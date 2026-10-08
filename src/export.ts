import {Capacitor} from '@capacitor/core';
export async function saveBackup(text:string,name:string){
 if(Capacitor.isNativePlatform()){
  const [{Filesystem,Directory,Encoding},{Share}]=await Promise.all([import('@capacitor/filesystem'),import('@capacitor/share')]);
  const {uri}=await Filesystem.writeFile({path:name,data:text,directory:Directory.Cache,encoding:Encoding.UTF8});
  await Share.share({title:'Sauvegarde Maths BAC',url:uri,dialogTitle:'Enregistrer ma sauvegarde'});
 }else{
  const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }
}
