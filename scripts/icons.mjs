import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import assert from 'node:assert/strict';

// public/icon.svg is the single source for the web and Android marks.
// All supported Android versions (minSdk 24) can load vector drawables.
const root=resolve(import.meta.dirname,'..'),svg=await readFile(resolve(root,'public/icon.svg'),'utf8');
const paths=[...svg.matchAll(/<path\s+([^>]+)\/>/g)].map(([,raw])=>Object.fromEntries([...raw.matchAll(/([\w-]+)="([^"]*)"/g)].map(([,key,value])=>[key,value])));
assert.deepEqual(paths.map(p=>p.id),['background','mark','radical']);
const namespace='xmlns:android="http://schemas.android.com/apk/res/android"';
const mark=(mono=false)=>paths.slice(1).map(p=>'    <path android:name="'+p.id+'" android:fillColor="'+(mono?'#FFFFFF':p.fill)+'" android:pathData="'+p.d+'"/>').join('\n');
const foreground=mono=>'<?xml version="1.0" encoding="utf-8"?>\n<vector '+namespace+' android:width="108dp" android:height="108dp" android:viewportWidth="192" android:viewportHeight="192">\n  <group android:pivotX="96" android:pivotY="96" android:scaleX="0.74" android:scaleY="0.74">\n'+mark(mono)+'\n  </group>\n</vector>\n';
const legacy=round=>'<?xml version="1.0" encoding="utf-8"?>\n<vector '+namespace+' android:width="48dp" android:height="48dp" android:viewportWidth="192" android:viewportHeight="192">\n  <path android:fillColor="'+paths[0].fill+'" android:pathData="'+(round?'M96 0A96 96 0 1 1 96 192A96 96 0 1 1 96 0Z':paths[0].d)+'"/>\n'+mark()+'\n</vector>\n';
const adaptive=mono=>'<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon '+namespace+'>\n  <background android:drawable="@color/maths_bac_icon_background"/>\n  <foreground android:drawable="@drawable/maths_bac_foreground"/>\n'+(mono?'  <monochrome android:drawable="@drawable/maths_bac_monochrome"/>\n':'')+'</adaptive-icon>\n';
const res='android/app/src/main/res/';
const files={
 [res+'drawable/maths_bac_foreground.xml']:foreground(false),
 [res+'drawable/maths_bac_monochrome.xml']:foreground(true),
 [res+'values/maths_bac_icon.xml']:'<resources><color name="maths_bac_icon_background">'+paths[0].fill+'</color></resources>\n'
};
for(const round of [false,true]){
 const name='maths_bac_launcher'+(round?'_round':'')+'.xml';
 files[res+'mipmap-anydpi/'+name]=legacy(round);
 files[res+'mipmap-anydpi-v26/'+name]=adaptive(false);
 files[res+'mipmap-anydpi-v33/'+name]=adaptive(true);
}
for(const [name,content] of Object.entries(files)){
 const path=resolve(root,name);
 if(process.argv.includes('--check'))assert.equal(await readFile(path,'utf8'),content,name+' est désynchronisé de icon.svg');
 else{await mkdir(dirname(path),{recursive:true});await writeFile(path,content);}
}
console.log('Icônes Maths BAC : '+Object.keys(files).length+' ressources cohérentes.');
