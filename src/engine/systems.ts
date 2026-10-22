import {cas,expression,simplified,exact,onlyVariables,tex,constraints} from './expression';
import {gaussian,matrixTex,result} from './toolkit';
import type {Request} from './types';
export function systems(req:Request){
 const lines=req.expression.trim().split(/\n|;/).map(s=>s.trim()).filter(Boolean);
 if(lines.length<2||lines.length>6)throw new Error('Saisis de 2 à 6 équations linéaires, une par ligne, avec les inconnues x, y, z ou t.');
 const forms=lines.map(line=>{const halves=line.split('=');if(halves.length!==2)throw new Error('Chaque ligne doit contenir un signe =.');const raw='('+expression(halves[0])+')-('+expression(halves[1])+')';onlyVariables(raw,['x','y','z','t']);return raw;});
 const vars=['x','y','z','t'].filter(v=>forms.some(f=>new RegExp('\\b'+v+'\\b').test(f)));
 if(!vars.length)throw new Error('Le système doit contenir au moins une inconnue : x, y, z ou t.');
 const zero=Object.fromEntries(vars.map(v=>[v,'0']));
 for(const raw of forms)for(const c of constraints(raw))if(vars.some(v=>new RegExp('\\b'+v+'\\b').test(c.expr)))throw new Error('Ce modèle linéaire exige des coefficients constants : évite les inconnues dans les dénominateurs, logarithmes et racines.');
 const rows=forms.map(s=>{
  const c=cas(s,zero).toString(),co=vars.map(v=>simplified('('+cas(s,{...zero,[v]:'1'}).toString()+')-('+c+')'));
  const reconstructed=co.map((a,i)=>'('+a+')*'+vars[i]).join('+')+'+('+c+')';
  if(simplified('('+s+')-('+reconstructed+')')!=='0')throw new Error('Ce modèle résout les systèmes linéaires. Les produits entre inconnues, puissances et quotients demandent un autre modèle.');
  return [...co,exact('-('+c+')')];
 });
 const g=gaussian(rows,vars.length),impossible=g.rows.some(r=>r.slice(0,vars.length).every(v=>v==='0')&&r[vars.length]!=='0');
 const steps=[{title:'Organiser les inconnues',text:'Ordre des colonnes : '+vars.join(', ')+', puis second membre.',latex:matrixTex(rows)},{title:'Réduire par Gauss–Jordan',text:'Les opérations sur les lignes conservent l’ensemble des solutions.',latex:matrixTex(g.rows)}];
 if(impossible)return result('Système incompatible','S=\\varnothing',steps,{method:'exact'});
 const free=vars.map((_,i)=>i).filter(i=>!g.pivots.includes(i)),symbols=['r','s','v','w'];
 const solutions=vars.map((_,col)=>{const at=g.pivots.indexOf(col);if(at<0)return symbols[free.indexOf(col)];return exact('('+g.rows[at][vars.length]+')'+free.map((f,j)=>'-('+g.rows[at][f]+')*'+symbols[j]).join(''));});
 for(const raw of forms)if(simplified(cas(raw,Object.fromEntries(vars.map((v,i)=>[v,solutions[i]]))).toString())!=='0')throw new Error('La vérification exacte du système a échoué. Vérifie les coefficients.');
 steps.push({title:'Vérifier les solutions',text:'Remplacer les inconnues dans chacune des équations initiales donne une égalité exacte.',latex:'\\operatorname{rang}(A)='+g.pivots.length});
 return result(free.length?'Une infinité de solutions':'Solution du système','\\left\\{\\begin{aligned}'+vars.map((v,i)=>v+'&='+tex(solutions[i])).join('\\\\')+'\\end{aligned}\\right.'+(free.length?',\\quad '+symbols.slice(0,free.length).join(',')+'\\in\\mathbb R':''),steps,{method:'exact',exact:free.length?undefined:solutions.join(';'),notes:free.length?['Chaque paramètre réel peut être choisi librement. Les formules donnent toutes les solutions du système.']:[]});
}
