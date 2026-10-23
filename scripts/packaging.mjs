#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { parseCsv } from './lib/csv.mjs';
import { table } from './lib/format.mjs';

export const commands = ['help','locations','items','movements','balances','returns-due','unmatched-returns','reconciliations','disputes','hygiene','compliance','attention','weekly-review','location','add-location','set-location','add-item','set-item','log','reverse','match-return','unmatch-return','count','inspect','raise-dispute','close-dispute','draft-statement','import','export'];
const readQueries={
 locations:'select code,name,kind,owner,country from packaging.locations order by code',
 items:'select code,name,food_contact,suitability_ref from packaging.items order by code',
 movements:`select m.reference,i.code item,f.code origin,t.code destination,m.quantity,m.moved_on,m.due_on,m.evidence_ref,m.reversal_of from packaging.movements m join packaging.items i on i.id=m.item_id join packaging.locations f on f.id=m.from_id join packaging.locations t on t.id=m.to_id order by m.moved_on,m.reference`,
 balances:"select location,item,quantity,kind,owner,last_movement from packaging.balances where kind<>'system' order by location,item",
 'returns-due':'select reference,partner,owner,item,due_on,issued,returned,outstanding,state from packaging.returns_due order by due_on nulls first,reference',
 'unmatched-returns':`select r.reference,l.code partner,i.code item,r.quantity-coalesce(a.quantity,0) unmatched from packaging.movements r join packaging.locations l on l.id=r.from_id join packaging.locations t on t.id=r.to_id join packaging.items i on i.id=r.item_id left join lateral(select sum(quantity) quantity from packaging.allocations where return_id=r.id and void_reason is null) a on true where l.kind='partner' and t.kind='internal' and r.reversal_of is null and not exists(select 1 from packaging.movements where reversal_of=r.id) and r.quantity>coalesce(a.quantity,0) order by r.reference`,
 reconciliations:'select location,item,counted_on,counted,ledger_at_count,ledger_now_for_date,variance,backdated_change from packaging.reconciliations order by counted_on desc,location',
 disputes:`select d.id,m.reference,d.title,d.owner,d.due_on,d.status,d.resolution from packaging.disputes d join packaging.movements m on m.id=d.movement_id order by d.due_on,d.id`,
 hygiene:'select location,item,quantity,country,checked_on,result,state from packaging.hygiene order by location,item',
 compliance:'select * from packaging.compliance order by rule,record'
};
export function parseArgs(args){const opts={},pos=[];for(const a of args){if(a.startsWith('--')){const [k,...v]=a.slice(2).split('=');if(k in opts)throw Error(`Duplicate flag --${k}`);opts[k]=v.length?v.join('='):true;}else pos.push(a);}return {opts,pos};}
const required=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`--${k}= is required`);return o[k].trim();};
const integer=(v,min=1)=>{if(!/^\d+$/.test(String(v))||!Number.isSafeInteger(Number(v))||Number(v)<min||Number(v)>2147483647)throw Error(`Expected whole quantity ${min}..2147483647`);return Number(v);};
const date=(v,{future=false}={})=>{const s=String(v);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error(`Expected real ISO date YYYY-MM-DD: ${s}`);if(!future&&s>new Date().toISOString().slice(0,10))throw Error('Future observations cannot be posted');return s;};
const today=()=>new Date().toISOString().slice(0,10);
const hash=v=>createHash('sha256').update(v).digest('hex');
const bool=v=>{if(!['true','false'].includes(v))throw Error('Use true or false');return v==='true';};
const allowed={
 'add-location':['code','name','kind','owner','country'],'set-location':['location','kind','owner','country'],
 'add-item':['code','name','food-contact','suitability'],'set-item':['item','food-contact','suitability'],
 log:['ref','item','from','to','qty','date','due','evidence','note'],reverse:['movement','ref','date','evidence','reason'],
 'match-return':['issue','return','qty'],'unmatch-return':['allocation','reason'],count:['location','item','date','qty','evidence'],
 inspect:['location','item','date','result','evidence','note'],'raise-dispute':['movement','title','owner','due'],'close-dispute':['dispute','resolution'],
 location:['location'],'draft-statement':['location'],import:['file','map','dry-run'],export:['out']
};
export async function resolve(db,entity,query){
 const column=entity==='movements'?'reference':entity==='disputes'?'title':entity==='allocations'?'id::text':'code';
 const name=['locations','items'].includes(entity)?'name':column;
 const exact=await db.query(`select * from packaging.${entity} where lower(${column})=lower($1)`,[query]);
 if(exact.length===1)return exact[0];
 const found=await db.query(`select * from packaging.${entity} where left(id::text,length($1))=$1 or lower(${name})=lower($1) order by id`,[query]);
 if(found.length!==1)throw Error(found.length?`Ambiguous ${entity}: ${found.map(x=>`${x.id} ${x.code||x.reference||x.title||''}`).join('; ')}`:`No ${entity} match: ${query}`);
 return found[0];
}
async function audit(db,action,actor,detail){await db.query('insert into packaging.activity(action,actor,detail) values($1,$2,$3)',[action,actor,JSON.stringify(detail)]);}
async function transaction(db,work){await db.exec('BEGIN');try{const result=await work();await db.exec('COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}}
const ret=async(db,sql,params)=> (await db.query(sql+' returning *',params))[0];
async function ledger(db,loc,item,on){return Number((await db.query('select coalesce(sum(quantity),0) quantity from packaging.entries where location_id=$1 and item_id=$2 and moved_on<=$3',[loc,item,on]))[0].quantity);}

export async function run(db,args){
 const {opts:o,pos}=parseArgs(args);const cmd=pos[0]||'help';
 if(!commands.includes(cmd))throw Error(`Unknown command ${cmd}; run help`);
 const permits=new Set(['json',...(allowed[cmd]||[]),...(allowed[cmd]&&!['location','draft-statement','export'].includes(cmd)?['actor']:[])]);
 for(const k of Object.keys(o))if(!permits.has(k))throw Error(`Unknown flag --${k} for ${cmd}`);
 if(cmd!=='import'&&pos.length>1)throw Error('Use named flags; see docs/cli.md');
 if(cmd==='help')return commands.map(command=>({command,guide:'docs/cli.md'}));
 if(readQueries[cmd])return db.query(readQueries[cmd]);
 if(['attention','weekly-review'].includes(cmd)){
  const returns=await db.query("select reference,partner,item,outstanding,due_on,state from packaging.returns_due where state<>'scheduled' order by due_on nulls first,reference");
  const disputes=await db.query("select title,owner,due_on from packaging.disputes where status='open' order by due_on,id");
  const compliance=await db.query(readQueries.compliance);
  return {returns,disputes,compliance,...(cmd==='weekly-review'?{balances:await db.query(readQueries.balances),unmatched_returns:await db.query(readQueries['unmatched-returns'])}:{})};
 }
 if(cmd==='location'||cmd==='draft-statement'){
  const l=await resolve(db,'locations',required(o,'location'));
  const result={location:l,balances:await db.query('select item,quantity,last_movement from packaging.balances where location_id=$1 order by item',[l.id]),movements:await db.query('select reference,quantity,moved_on,evidence_ref from packaging.movements where from_id=$1 or to_id=$1 order by moved_on,reference',[l.id]),returns:await db.query('select reference,item,outstanding,due_on from packaging.returns_due where partner=$1 order by due_on,reference',[l.code])};
  if(cmd==='location')return result;
  const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true,mode:0o700});const file=path.join(dir,`statement-${l.id}-${randomUUID()}.md`);
  fs.writeFileSync(file,`# Packaging statement draft: ${l.name}\n\nInternal draft. Reconcile against the partner statement before sending.\n\n${format(result)}\n`,{mode:0o600});return {file,sent:false};
 }
 if(cmd==='export'){
  const sets=['locations','items','movements','allocations','counts','disputes','inspections','activity','import_batches'];const records={};
  await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');try{for(const t of sets)records[t]=await db.query(`select * from packaging.${t} order by id`);}finally{await db.exec('ROLLBACK');}
  const file=path.resolve(o.out===undefined?path.join(REPO_ROOT,'exports',`packaging-${randomUUID()}.json`):required(o,'out'));fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});fs.writeFileSync(file,JSON.stringify({version:1,exported_at:new Date().toISOString(),records},null,2)+'\n',{mode:0o600,flag:'wx'});return {file,sets:sets.length};
 }
 const actor=required(o,'actor');
 if(cmd==='import'){
  if(pos.length!==2||pos[1]!=='trackonline')throw Error('Use import trackonline --file=export.csv --actor=Name [--map=mapping.json] [--dry-run]');
  return importTrackOnline(db,o,actor);
 }
 return transaction(db,async()=>{
  let result;
  if(cmd==='add-location')result=await ret(db,'insert into packaging.locations(code,name,kind,owner,country) values($1,$2,$3,$4,$5)',[required(o,'code'),required(o,'name'),required(o,'kind'),required(o,'owner'),required(o,'country')]);
  if(cmd==='set-location'){
   const l=await resolve(db,'locations',required(o,'location'));
   result=await ret(db,'update packaging.locations set kind=$2,owner=$3,country=$4 where id=$1',[l.id,required(o,'kind'),required(o,'owner'),required(o,'country')]);
  }
  if(cmd==='add-item')result=await ret(db,'insert into packaging.items(code,name,food_contact,suitability_ref) values($1,$2,$3,$4)',[required(o,'code'),required(o,'name'),bool(required(o,'food-contact')),o.suitability||null]);
  if(cmd==='set-item'){
   const item=await resolve(db,'items',required(o,'item'));
   result=await ret(db,'update packaging.items set food_contact=$2,suitability_ref=$3 where id=$1',[item.id,bool(required(o,'food-contact')),o.suitability||null]);
  }
  if(cmd==='log'){
   const i=await resolve(db,'items',required(o,'item')),f=await resolve(db,'locations',required(o,'from')),t=await resolve(db,'locations',required(o,'to'));
   result=await ret(db,'insert into packaging.movements(reference,item_id,from_id,to_id,quantity,moved_on,due_on,evidence_ref,note,actor) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[required(o,'ref'),i.id,f.id,t.id,integer(required(o,'qty')),date(o.date||today()),o.due?date(o.due,{future:true}):null,required(o,'evidence'),o.note||'',actor]);
  }
  if(cmd==='reverse'){
   const m=await resolve(db,'movements',required(o,'movement'));
   result=await ret(db,'insert into packaging.movements(reference,item_id,from_id,to_id,quantity,moved_on,evidence_ref,note,actor,reversal_of) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[required(o,'ref'),m.item_id,m.to_id,m.from_id,m.quantity,date(o.date||today()),required(o,'evidence'),required(o,'reason'),actor,m.id]);
  }
  if(cmd==='match-return'){
   const i=await resolve(db,'movements',required(o,'issue')),r=await resolve(db,'movements',required(o,'return'));
   result=await ret(db,'insert into packaging.allocations(issue_id,return_id,quantity,actor) values($1,$2,$3,$4)',[i.id,r.id,integer(required(o,'qty')),actor]);
  }
  if(cmd==='unmatch-return'){
   const a=await resolve(db,'allocations',required(o,'allocation'));
   result=await ret(db,'update packaging.allocations set void_reason=$2 where id=$1',[a.id,required(o,'reason')]);
  }
  if(cmd==='count'||cmd==='inspect'){
   const l=await resolve(db,'locations',required(o,'location')),i=await resolve(db,'items',required(o,'item'));const on=date(o.date||today());
   if(cmd==='count')result=await ret(db,'insert into packaging.counts(location_id,item_id,counted_on,quantity,ledger_at_count,evidence_ref,actor) values($1,$2,$3,$4,$5,$6,$7)',[l.id,i.id,on,integer(required(o,'qty'),0),await ledger(db,l.id,i.id,on),required(o,'evidence'),actor]);
   else result=await ret(db,'insert into packaging.inspections(location_id,item_id,checked_on,result,evidence_ref,actor,note) values($1,$2,$3,$4,$5,$6,$7)',[l.id,i.id,on,required(o,'result'),required(o,'evidence'),actor,required(o,'note')]);
  }
  if(cmd==='raise-dispute'){
   const m=await resolve(db,'movements',required(o,'movement'));
   result=await ret(db,'insert into packaging.disputes(movement_id,title,owner,due_on,actor) values($1,$2,$3,$4,$5)',[m.id,required(o,'title'),required(o,'owner'),date(required(o,'due'),{future:true}),actor]);
  }
  if(cmd==='close-dispute'){
   const d=await resolve(db,'disputes',required(o,'dispute'));if(d.status==='closed')throw Error('Dispute already closed');
   result=await ret(db,"update packaging.disputes set status='closed',resolution=$2 where id=$1",[d.id,required(o,'resolution')]);
  }
  await audit(db,cmd,actor,{id:result.id,options:o});return result;
 });
}

async function importTrackOnline(db,o,actor){
 const file=required(o,'file');if(path.extname(file).toLowerCase()!=='.csv')throw Error('Save the item-level Excel export as CSV UTF-8 first; see replace-trackonline.md');
 const contents=fs.readFileSync(file,'utf8'),rows=parseCsv(contents);if(!rows.length)throw Error('Empty import');
 const defaults={id:'Number',item:'Item',quantity:'Quantity',from:'From',to:'To',date:'Date',status:'Status',evidence:'Reference'};
 const custom=o.map?JSON.parse(fs.readFileSync(required(o,'map'),'utf8')):{};
 for(const [k,v] of Object.entries(custom))if(!(k in defaults)||typeof v!=='string'||!v.trim())throw Error(`Invalid column mapping ${k}`);
 const mapping={...defaults,...custom};
 for(const k of ['id','item','quantity','from','to','date','status'])if(!Object.hasOwn(rows[0],mapping[k]))throw Error(`Missing column ${mapping[k]}; use --map for your export headings`);
 const seen=new Set();const parsed=rows.map((raw,n)=>{
  const get=k=>String(raw[mapping[k]]??'').trim();
  for(const k of ['id','item','from','to'])if(!get(k))throw Error(`Row ${n+2}: ${k} is blank`);
  if(get('status').toLowerCase()!=='processed')throw Error(`Row ${n+2}: export Processed transactions only; no inferred status`);
  if(get('from').toLowerCase()===get('to').toLowerCase())throw Error(`Row ${n+2}: origin and destination must differ`);
  const key=JSON.stringify([get('id'),get('item')]);if(seen.has(key))throw Error(`Duplicate transaction/item key at row ${n+2}; preserve distinct line identifiers`);seen.add(key);
  return {raw,key,hash:hash(JSON.stringify(Object.fromEntries(Object.entries(raw).sort(([a],[b])=>a.localeCompare(b))))),item:get('item'),from:get('from'),to:get('to'),quantity:integer(get('quantity')),on:date(get('date')),evidence:get('evidence')||null};
 });
 await db.exec('BEGIN');try{
  // Serialises competing imports on Postgres; PGlite has one local writer.
  await db.exec('LOCK TABLE packaging.import_batches IN EXCLUSIVE MODE');
  let added=0,unchanged=0;
  async function entity(table,code){let found=await db.query(`select * from packaging.${table} where lower(code)=lower($1)`,[code]);if(!found.length)found=await db.query(`insert into packaging.${table}(code,name) values($1,$1) returning *`,[code]);return found[0];}
  for(const row of parsed){
   const previous=await db.query('select source_hash from packaging.movements where source_key=$1',[row.key]);
   if(previous.length){if(previous[0].source_hash!==row.hash)throw Error(`Changed source row ${row.key}; reconcile explicitly before importing`);unchanged++;continue;}
   const i=await entity('items',row.item),f=await entity('locations',row.from),t=await entity('locations',row.to);
   await db.query('insert into packaging.movements(reference,item_id,from_id,to_id,quantity,moved_on,evidence_ref,actor,source_key,source_payload,source_hash) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',[`TO-${hash(row.key)}`,i.id,f.id,t.id,row.quantity,row.on,row.evidence,actor,row.key,JSON.stringify(row.raw),row.hash]);added++;
  }
  const result={added,unchanged,dry_run:Boolean(o['dry-run']),notes:'Imported locations need classification; item food-contact status needs review. Opening balances, return allocations and attachments are separate.'};
  if(o['dry-run'])await db.exec('ROLLBACK');
  else{await db.query('insert into packaging.import_batches(file_hash,actor,added,unchanged) values($1,$2,$3,$4)',[hash(contents),actor,added,unchanged]);await audit(db,'import',actor,result);await db.exec('COMMIT');}
  return result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}

export function format(result){
 if(Array.isArray(result)){if(!result.length)return 'Nothing here.';const cols=Object.keys(result[0]).map(key=>({key,label:key,format:v=>v===null?'':typeof v==='object'?JSON.stringify(v):String(v)}));return table(result,cols);}
 if(result&&typeof result==='object'&&Object.values(result).some(Array.isArray))return Object.entries(result).map(([key,value])=>`${key}\n${format(value)}`).join('\n\n');
 return JSON.stringify(result,null,2);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const args=process.argv.slice(2),result=await run(db,args);console.log(args.includes('--json')?JSON.stringify(result,null,2):format(result));}
 catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
