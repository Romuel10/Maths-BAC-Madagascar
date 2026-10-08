import {readdir,readFile,writeFile} from 'node:fs/promises';
import {join,relative} from 'node:path';
import {createHash} from 'node:crypto';
const files=[];
async function walk(dir){for(const f of await readdir(dir,{withFileTypes:true})){const p=join(dir,f.name);if(f.isDirectory())await walk(p);else if(f.name!=='sw.js')files.push(relative('dist',p).replaceAll('\\','/'));}}
await walk('dist');files.sort();
const hash=createHash('sha256');for(const file of files)hash.update(await readFile(join('dist',file)));
const version=hash.digest('hex').slice(0,16);
const template=await readFile('public/sw.js','utf8');
await writeFile('dist/sw.js',template.replace('BUILD_VERSION',version).replace("'BUILD_ASSETS'",JSON.stringify(files)));
console.log('Hors connexion : '+files.length+' ressources, version '+version);
