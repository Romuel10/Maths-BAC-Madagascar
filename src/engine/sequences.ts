import {cas,expression,onlyVariables,exact,simplified,tex,asReal,fmt,param} from './expression';
import {value,integer,result} from './toolkit';
import type {Request,Step} from './types';
export function sequences(req:Request){
 const p=req.params,kind=p.kind??'recurrence',count=param(p,'count','10'),start=param(p,'start','0');integer(count,1,100,'Le nombre de termes');integer(start,0,10000,'Le rang initial');
 if(!['recurrence','explicit','second'].includes(kind))throw new Error('Choisis une formule explicite ou une récurrence du premier ou du deuxième ordre.');
 const raw=expression(req.expression),rec=kind!=='explicit';onlyVariables(raw,kind==='second'?['u','v','n']:rec?['u','n']:['n']);
 const initial=rec?value(p.initial??'5'):'0';let term=initial,previous=initial,sum='0';const rows:string[][]=[],terms:string[]=[];
 for(let i=0;i<count;i++){
  const n=start+i;
  if(!rec)term=exact(cas(raw,{n:String(n)}).toString());
  else if(kind==='second'&&i===1)term=value(p.second??'1');
  else if(i>0){const next=exact(cas(raw,{u:term,v:previous,n:String(n-1)}).toString());previous=term;term=next;}
  if(!Number.isFinite(asReal(term)))throw new Error('Un terme est indéfini ou dépasse la plage numérique. Diminue le nombre de termes ou vérifie la formule.');
  sum=exact('('+sum+')+('+term+')');terms.push(term);rows.push([String(n),term,fmt(asReal(term))]);
 }
 const steps:Step[]=[{title:rec?'Appliquer la récurrence':'Utiliser le rang',text:kind==='second'?'u est le terme courant uₙ et v le précédent uₙ₋₁. Les deux premiers termes sont saisis séparément.':rec?'u représente uₙ ; la formule calcule uₙ₊₁. n est le rang du terme courant.':'Remplacer n par le rang demandé.',latex:(rec?'u_{n+1}=':'u_n=')+tex(raw)},{title:'Additionner les termes du tableau',text:'La somme porte sur les '+count+' termes à partir du rang '+start+'.',latex:'S='+tex(sum)}];
 let formula:string|undefined,limit:string|undefined;
 if(kind==='explicit')formula=raw;
 if(kind==='recurrence'&&!/\bn\b/.test(raw)){
  const b=exact(cas(raw,{u:'0'}).toString()),a=simplified('('+cas(raw,{u:'1'}).toString()+')-('+b+')');
  if(simplified('('+raw+')-(('+a+')*u+('+b+'))')==='0'){
   const shift='(n-'+start+')',A=asReal(a),B=asReal(b);
   if(a==='1'){formula='('+initial+')+'+shift+'*('+b+')';limit=B===0?initial:B>0?'+\\infty':'-\\infty';steps.push({title:'Suite arithmétique',text:B===0?'La suite est constante.':B>0?'La différence est positive : la suite est strictement croissante.':'La différence est négative : la suite est strictement décroissante.',latex:'r='+tex(b)});}
   else{
    const fixed=exact('('+b+')/(1-('+a+'))'),gap=exact('('+initial+')-('+fixed+')');formula='('+fixed+')+('+gap+')*('+a+')^'+shift;
    if(gap==='0'||Math.abs(A)<1)limit=fixed;
    else if(A===-1)limit='\\text{pas de limite : alternance de deux valeurs}';
    else if(A<-1)limit='\\text{pas de limite : oscillations non bornées}';
    else if(A>1)limit=asReal(gap)>0?'+\\infty':'-\\infty';
    steps.push({title:'Utiliser le point fixe',text:'Poser vₙ = uₙ − ℓ donne vₙ₊₁ = a vₙ : une suite géométrique.',latex:'\\ell='+tex(fixed)+',\\quad a='+tex(a)});
   }
  }
 }
 if(formula){steps.push({title:'Donner le terme général',text:'Le décalage tient compte du premier rang choisi.',latex:'u_n='+tex(formula)});
  if(p.target?.trim()){
   const n=param(p,'target',String(start));integer(n,start,1000000,'Le rang recherché');
   // Avoid constructing integers with millions of digits in a direct request.
   if(n-start>10000&&kind==='recurrence')throw new Error('Pour une formule récurrente, choisis un rang à moins de 10 000 du premier terme.');
   const v=kind==='recurrence'&&n===start?initial:exact(cas(formula,{n:String(n)}).toString());if(v.length>20000||/Infinity|undefined|NaN/.test(v))throw new Error('Ce terme est trop grand pour être affiché. Choisis un rang plus proche.');
   steps.push({title:'Calculer le rang demandé',text:'La formule explicite donne ce terme sans remplir les rangs intermédiaires.',latex:'u_{'+n+'}='+tex(v)});
  }
 }else if(p.target?.trim())throw new Error('Le calcul direct d’un rang demande une formule explicite ou une récurrence affine u suivant = a × u + b.');
 if(limit)steps.push({title:'Étudier la limite',text:'Conclusion obtenue à partir de la formule affine et de la raison géométrique.',latex:limit.includes('\\')?'\\lim_{n\\to+\\infty}u_n='+limit:'\\lim_{n\\to+\\infty}u_n='+tex(limit)});
 const differences=terms.slice(1).map((v,i)=>asReal(exact('('+v+')-('+terms[i]+')'))),direction=differences.every(x=>x===0)?'constants':differences.every(x=>x>=0)?'croissants':differences.every(x=>x<=0)?'décroissants':'non monotones';
 return result('Les termes de la suite','u_{'+(start+count-1)+'}='+tex(term),steps,{method:'exact',exact:term,table:{headers:['Rang','Valeur exacte','Approximation'],rows,latexRows:rows.map(r=>[undefined,tex(r[1]),undefined])},chart:{kind:'sequence',label:'Évolution des termes calculés',points:terms.map((v,i)=>[start+i,asReal(v)])},notes:count>1?['Les termes affichés sont '+direction+'. Cette observation seule ne prouve pas le comportement de toute la suite.']:[]});
}
