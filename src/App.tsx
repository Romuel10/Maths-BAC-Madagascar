import {Component,useEffect,useState,type ReactNode} from 'react';
import {Capacitor} from '@capacitor/core';
import {App as NativeApp} from '@capacitor/app';
import {useStore,update,storageWarning} from './store';
import {Icon} from './components/Icon';
import {Home} from './pages/Home';
import {Workspace} from './pages/Workspace';
import {Courses} from './pages/Courses';
import {Practice} from './pages/Practice';
import {Notebook} from './pages/Notebook';
import {Settings} from './pages/Settings';
import type {Series} from './engine/types';
const nav=[['accueil','Accueil','home'],['resoudre','Résoudre','solve'],['cours','Cours','book'],['bac','Entraînement','practice'],['carnet','Carnet','note']];
const readRoute=()=>location.hash.slice(1)||'accueil';
export default function App(){
 const state=useStore(),[route,setRoute]=useState(readRoute),[offline,setOffline]=useState(!navigator.onLine),[cache,setCache]=useState('Préparation hors connexion…');
 const [page,id]=route.split('/');
 const go=(to:string)=>{if(readRoute()===to){setRoute(to);return;}location.hash=to;};
 useEffect(()=>{const changed=()=>{setRoute(readRoute());window.scrollTo({top:0});};window.addEventListener('hashchange',changed);return()=>window.removeEventListener('hashchange',changed);},[]);
 useEffect(()=>{
  const media=matchMedia('(prefers-color-scheme: dark)');
  const apply=()=>{document.documentElement.dataset.theme=state.theme==='system'?(media.matches?'dark':'light'):state.theme;document.documentElement.style.fontSize=state.size+'%';document.documentElement.dataset.motion=state.motion?'on':'off';};
  apply();media.addEventListener('change',apply);return()=>media.removeEventListener('change',apply);
 },[state.theme,state.size,state.motion]);
 useEffect(()=>{
  const online=()=>setOffline(!navigator.onLine);window.addEventListener('online',online);window.addEventListener('offline',online);
  if(Capacitor.isNativePlatform()){setCache('Disponible hors connexion');const handle=NativeApp.addListener('backButton',()=>{if(readRoute()!=='accueil')go('accueil');else void NativeApp.exitApp();});return()=>{void handle.then(h=>h.remove());window.removeEventListener('online',online);window.removeEventListener('offline',online);};}
  let live=true;
  const ready=()=>{if(live)setCache('Disponible hors connexion');};
  const failed=()=>{if(live)setCache('Hors connexion : réessayer');};
  if('serviceWorker' in navigator&&import.meta.env.PROD){
   navigator.serviceWorker.register('./sw.js').then(reg=>{if(reg.active)ready();if(reg.installing){const installing=reg.installing;installing.addEventListener('statechange',()=>{if(installing.state==='redundant'&&!reg.active)failed();if(reg.active)ready();});}reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='activated')ready();if(worker.state==='redundant'&&!reg.active)failed();});});}).catch(failed);
   navigator.serviceWorker.addEventListener('controllerchange',ready);
  }else setCache(import.meta.env.DEV?'Version de développement':'Calculs sur cet appareil');
  return()=>{live=false;window.removeEventListener('online',online);window.removeEventListener('offline',online);navigator.serviceWorker?.removeEventListener('controllerchange',ready);};
 },[]);
 const titles:Record<string,string>={accueil:'Ton espace de travail',resoudre:'Atelier de résolution',cours:'Bibliothèque de méthodes',bac:'Objectif baccalauréat',carnet:'Mon carnet',reglages:'Réglages'};
 return <div className="app"><a className="skip-link" href="#main" onClick={e=>{e.preventDefault();document.getElementById('main')?.focus();}}>Aller au contenu</a><aside className="sidebar"><button className="brand" onClick={()=>go('accueil')} aria-label="Maths BAC, accueil"><img src="./icon.svg" alt="" width="42" height="42"/><span>Maths BAC<small>MADAGASCAR</small></span></button><div className="sidebar-label">TON PARCOURS</div><nav aria-label="Navigation principale">{nav.map(([key,label,icon])=><button key={key} className={page===key?'active':''} aria-current={page===key?'page':undefined} onClick={()=>go(key)}><Icon name={icon}/><span>{label}</span>{page===key&&<span className="nav-dot"/>}</button>)}</nav><div className="sidebar-bottom"><div className="offline-status"><span className={cache.includes('Disponible')?'status-dot ready':'status-dot'}/><button onClick={()=>{if(cache.includes('réessayer'))location.reload();}}>{offline?'Sans connexion':cache}</button></div><button className={'settings-link '+(page==='reglages'?'active':'')} onClick={()=>go('reglages')}><Icon name="settings"/>Réglages</button><p>COMPRENDRE. RÉSOUDRE. PROGRESSER.</p></div></aside>
 <div className="shell"><header className="topbar"><div className="breadcrumb"><span className="desktop">Maths BAC <span className="slash">/</span></span>{titles[page]??'Accueil'}</div><div className="top-actions"><label className="series-select"><span>Série</span><select aria-label="Ma série" value={state.series} onChange={e=>update({series:e.target.value as Series})}>{['A','C','D','L','OSE','S'].map(s=><option key={s}>{s}</option>)}</select></label><button className="icon-button" aria-label="Changer de thème" onClick={()=>update({theme:document.documentElement.dataset.theme==='dark'?'light':'dark'})}><Icon name={document.documentElement.dataset.theme==='dark'?'sun':'moon'}/></button><button className="icon-button mobile-settings" aria-label="Réglages" onClick={()=>go('reglages')}><Icon name="settings"/></button></div></header>
 {storageWarning()&&<div className="storage-warning" role="alert">{storageWarning()}</div>}<main id="main" tabIndex={-1}><ErrorBoundary key={page}>{page==='accueil'?<Home go={go}/>:page==='resoudre'?<Workspace/>:page==='cours'?<Courses id={id} go={go}/>:page==='bac'?<Practice chapter={id} go={go}/>:page==='carnet'?<Notebook go={go}/>:page==='reglages'?<Settings/>:<Home go={go}/>}</ErrorBoundary></main><footer className="page-footer"><span>Maths BAC Madagascar</span><span>Apprendre avec méthode.</span></footer></div>
 <nav className="bottom-nav" aria-label="Navigation mobile">{nav.map(([key,label,icon])=><button key={key} className={page===key?'active':''} aria-current={page===key?'page':undefined} onClick={()=>go(key)}><Icon name={icon}/><span>{key==='bac'?'Bac':label}</span></button>)}</nav></div>;
}
class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<div className="empty-state"><h1>Cet écran n’a pas pu s’ouvrir.</h1><p>Ton travail enregistré est conservé.</p><button className="button primary" onClick={()=>location.reload()}>Recharger l’application</button></div>:this.props.children;}}
