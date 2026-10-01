import fs from 'node:fs';
import path from 'node:path';

const EXPECTED_VERSION='1.0.1';
const EXPECTED_ANDROID_CODE=701;
const srcRoot=path.resolve('src');

function walk(dir){
 const out=[];
 for(const name of fs.readdirSync(dir)){
  const file=path.join(dir,name);
  const stat=fs.statSync(file);
  if(stat.isDirectory())out.push(...walk(file));
  else out.push(file);
 }
 return out;
}

const sourceFiles=walk(srcRoot).filter(file=>/\.(ts|tsx)$/.test(file)&&!file.endsWith('.d.ts'));
const sourceSet=new Set(sourceFiles.map(file=>path.resolve(file)));
const importRe=/(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/g;

function resolveImport(fromFile,spec){
 let base;
 if(spec.startsWith('./')||spec.startsWith('../'))base=path.resolve(path.dirname(fromFile),spec);
 else if(spec.startsWith('@/'))base=path.resolve(srcRoot,spec.slice(2));
 else return null;
 const ext=path.extname(base);
 const candidates=ext
  ? [base,ext==='.js'?base.slice(0,-3)+'.ts':null,ext==='.js'?base.slice(0,-3)+'.tsx':null].filter(Boolean)
  : [base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')];
 return candidates.find(candidate=>sourceSet.has(path.resolve(candidate)))||null;
}

const graph=new Map();
for(const file of sourceFiles){
 const text=fs.readFileSync(file,'utf8');
 const deps=[];
 let match;
 while((match=importRe.exec(text))){
  const resolved=resolveImport(file,match[1]);
  if(resolved)deps.push(path.resolve(resolved));
 }
 graph.set(path.resolve(file),deps);
}

const roots=[path.resolve('src/main.tsx'),path.resolve('src/workers/analysis.worker.ts')];
const reachable=new Set();
const stack=[...roots];
while(stack.length){
 const current=stack.pop();
 if(!current||reachable.has(current)||!sourceSet.has(current))continue;
 reachable.add(current);
 for(const dep of graph.get(current)||[])stack.push(dep);
}
const orphans=[...sourceSet].filter(file=>!reachable.has(file)).map(file=>path.relative('.',file)).sort();

const errors=[];
const packageJson=JSON.parse(fs.readFileSync('package.json','utf8'));
const packageLock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
const protection=fs.readFileSync('src/lib/protection.ts','utf8');
const androidBuild=fs.readFileSync('android/app/build.gradle','utf8');
const sw=fs.readFileSync('public/sw.js','utf8');
const app=fs.readFileSync('src/App.tsx','utf8');
const i18n=fs.readFileSync('src/lib/i18n.ts','utf8');

if(packageJson.version!==EXPECTED_VERSION)errors.push('package.json doit être en '+EXPECTED_VERSION);
if(packageLock.version!==EXPECTED_VERSION||packageLock.packages?.['']?.version!==EXPECTED_VERSION)errors.push('package-lock.json doit être en '+EXPECTED_VERSION);
if(!protection.includes("APP_VERSION = '"+EXPECTED_VERSION+"'"))errors.push('APP_VERSION doit être '+EXPECTED_VERSION);
if(!androidBuild.includes('versionCode '+EXPECTED_ANDROID_CODE))errors.push('Android versionCode doit être '+EXPECTED_ANDROID_CODE);
if(!androidBuild.includes('versionName "'+EXPECTED_VERSION+'"'))errors.push('Android versionName doit être '+EXPECTED_VERSION);
if(!sw.includes('maths-bac-madagascar-v1-0-1'))errors.push('cache PWA doit être versionné 1.0.1');
if(orphans.length)errors.push('fichiers source orphelins : '+orphans.join(', '));
if(!i18n.includes("navReview")||!i18n.includes("navBac"))errors.push('navigation principale doit distinguer Réviser et BAC');
if(!app.includes("['profile', 'book'")||!app.includes("['subjects', 'bac'"))errors.push('ordre de navigation mobile simplifié absent');
if(app.includes("MiniLesson")||app.includes("UnitConverter")||app.includes("RevisionSheets"))errors.push('anciens outils redondants encore branchés dans App');
if(/\bV7\b/.test(app)||/['\"]7\.0\.0['\"]/.test(app))errors.push('ancienne version visible dans App.tsx');
const ownedReleaseFiles=['README.md','CAPACITOR_ANDROID.md','PRIVACY_POLICY.md','CHANGELOG.md','RELEASE_V1.0.1.md','src/lib/protection.ts','public/sw.js','android/app/build.gradle','.github/workflows/android-release.yml'];
for(const file of ownedReleaseFiles){
 const text=fs.readFileSync(file,'utf8');
 if(/7\.0\.0|\bV7\b/.test(text))errors.push('ancienne référence de version dans '+file);
}
const legacyPaths=['CHANGELOG_V6.md','VALIDATION_V7.md','.github/workflows/android-v7-release.yml'];
for(const legacy of legacyPaths)if(fs.existsSync(legacy))errors.push('ancien fichier de version encore présent : '+legacy);
if(packageJson.dependencies?.clsx||packageJson.dependencies?.['tailwind-merge'])errors.push('dépendances UI inutilisées encore déclarées');
if(!app.includes("type ReviewTab = 'learn' | 'progress' | 'settings'"))errors.push('Réviser doit séparer Cours, Progression et Réglages');
if(!app.includes("Outils complémentaires")||app.includes("Mini-leçons")||app.includes("Convertisseur d’unités"))errors.push('la page Outils doit rester simplifiée et sans doublons de révision');


console.log('Release audit v'+EXPECTED_VERSION);
console.log('Sources atteignables : '+reachable.size+'/'+sourceSet.size);
console.log('Fichiers orphelins : '+orphans.length);
orphans.forEach(file=>console.log('ORPHAN '+file));
errors.forEach(error=>console.error('FAIL '+error));
if(errors.length)process.exit(1);
