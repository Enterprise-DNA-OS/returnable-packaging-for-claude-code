import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
export async function seed(db) {
 // Fixed demo IDs make repeated seeds preserve all existing work.
 const exists = await db.query("select 1 from packaging.locations where id='10000000-0000-4000-8000-000000000001'");
 if(exists.length) return {seeded:false};
 await db.exec('BEGIN');
 try {await db.exec(readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8'));await db.exec('COMMIT');return {seeded:true};}
 catch(e){await db.exec('ROLLBACK');throw e;}
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const db=await getDb();try{console.log(await seed(db));}finally{await db.close();}}
