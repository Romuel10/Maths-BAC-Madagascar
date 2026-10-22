import {expression,onlyVariables,exact,tex,asReal,fmt,param,cas} from './expression';
import {integer,result} from './toolkit';
import type {Request,Step} from './types';
export function complexes(req:Request){
 const s=expression(req.expression);onlyVariables(s,['i']);let z:string,re:string,im:string;
 try{z=exact(s);re=exact('realpart('+z+')');im=exact('imagpart('+z+')');if(!Number.isFinite(asReal(re))||!Number.isFinite(asReal(im)))throw Error();}catch{throw new Error('Saisis un nombre complexe fini, avec i pour l’unité imaginaire et sans dénominateur nul.');}
 const mod=exact('sqrt(('+re+')^2+('+im+')^2)'),arg=mod==='0'?null:exact('arg('+z+')'),mode=req.params.model??'analyze';
 const steps:Step[]=[{title:'Forme algébrique',text:'Séparer z = a + ib.',latex:'a='+tex(re)+',\\quad b='+tex(im)},{title:'Module et conjugué',text:'Le module mesure la distance à l’origine ; le conjugué change le signe de la partie imaginaire.',latex:'|z|='+tex(mod)+',\\quad \\overline z='+tex(exact('('+re+')-('+im+')*i'))}];
 if(mode==='roots'){
  const degree=param(req.params,'degree','3');integer(degree,2,24,'Le degré de la racine');
  if(arg===null)return result('Racines complexes de zéro','z=0',steps,{method:'exact',exact:'0',notes:['Zéro est l’unique racine distincte, de multiplicité '+degree+'.']});
  const rows:string[][]=[],points:[number,number][]=[];for(let k=0;k<degree;k++){const angle=exact('(('+arg+')+2*pi*'+k+')/'+degree),root=exact('('+mod+')^(1/'+degree+')*(cos('+angle+')+i*sin('+angle+'))');const a=asReal(exact('realpart('+root+')')),b=asReal(exact('imagpart('+root+')'));rows.push([String(k),root,fmt(a)+' '+(b<0?'−':'+')+' '+fmt(Math.abs(b))+'i']);points.push([a,b]);}
  steps.push({title:'Répartir les arguments',text:'Les racines ont le même module et leurs arguments sont espacés de 2π/n.',latex:'w_k=('+tex(mod)+')^{1/'+degree+'}\\left(\\cos\\frac{'+tex(arg)+'+2k\\pi}{'+degree+'}+i\\sin\\frac{'+tex(arg)+'+2k\\pi}{'+degree+'}\\right),\\quad k=0,\\ldots,'+(degree-1)});
  return result('Les '+degree+' racines complexes','w^{'+degree+'}='+tex(z),steps,{method:'exact',table:{headers:['k','Forme exacte','Forme approchée'],rows,latexRows:rows.map(r=>[undefined,tex(r[1]),undefined])},chart:{kind:'scatter',label:'Racines dans le plan complexe',points},notes:['Les arguments des racines sont donnés modulo 2π.']});
 }
 if(mode==='power'){
  const power=param(req.params,'power','3');integer(power,-100,100,'L’exposant');if(mod==='0'&&power<=0)throw new Error('Zéro à une puissance négative ou nulle n’est pas défini dans cet outil.');const raised=exact('expand(('+z+')^('+power+'))'),a=exact('realpart('+raised+')'),b=exact('imagpart('+raised+')'),answer=exact('('+a+')+('+b+')*i');
  steps.push({title:'Appliquer la formule de Moivre',text:'Élever le module à la puissance et multiplier l’argument par l’exposant.',latex:'[r(\\cos\\theta+i\\sin\\theta)]^m=r^m(\\cos(m\\theta)+i\\sin(m\\theta))'},{title:'Revenir à la forme algébrique',text:'Développer et regrouper les parties réelle et imaginaire.',latex:'z^{'+power+'}='+tex(answer)});
  return result('Puissance d’un complexe','z^{'+power+'}='+tex(answer),steps,{method:'exact',exact:answer});
 }
 if(mode!=='analyze')throw new Error('Choisis un calcul complexe proposé.');
 steps.push({title:'Donner un argument',text:arg?'L’argument principal est donné dans ]−π ; π], les autres s’obtiennent en ajoutant 2kπ.':'Le nombre zéro n’a pas d’argument.',latex:arg?'\\arg(z)='+tex(arg)+',\\quad \\theta\\approx '+fmt(Math.atan2(asReal(im),asReal(re))*180/Math.PI)+'^\\circ':undefined});
 if(arg)steps.push({title:'Formes trigonométrique et exponentielle',text:'Ces écritures facilitent les produits, quotients et puissances.',latex:'z='+tex(mod)+'\\left(\\cos('+tex(arg)+')+i\\sin('+tex(arg)+')\\right)='+tex(mod)+'e^{i('+tex(arg)+')}'});
 return result('Nombre complexe','z='+tex(z),steps,{method:'exact',exact:z,chart:{kind:'scatter',label:'Affixe dans le plan complexe',points:[[asReal(re),asReal(im)]]}});
}
