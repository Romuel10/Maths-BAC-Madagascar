import {exact,tex,asReal,fmt,param,numericTex} from './expression';
import {quadrature} from './numerical';
import {value,integer,result,comb} from './toolkit';
import type {Request,Step} from './types';
const probability=(raw:string)=>{const v=value(raw),n=asReal(v);if(n<0||n>1)throw new Error('Une probabilité doit être comprise entre 0 et 1.');return v;};
function event(p:Record<string,string>,max:number){const kind=p.kind??'exact',k=param(p,'k','3');integer(k,0,max,'k');let lo=k,hi=k;if(kind==='atmost')lo=0;else if(kind==='atleast')hi=max;else if(kind==='between'){hi=param(p,'upper','5');integer(hi,k,max,'La borne supérieure');}else if(kind!=='exact')throw new Error('Choisis un événement proposé.');return {lo,hi,label:kind==='atmost'?'X\\le '+k:kind==='atleast'?'X\\ge '+k:kind==='between'?k+'\\le X\\le '+hi:'X='+k};}
const add=(values:string[])=>exact(values.map(v=>'('+v+')').join('+')||'0');
export function probabilityTool(req:Request){
 const p=req.params,model=p.model??'binomial';
 if(model==='counting'){
  const n=param(p,'n','10'),k=param(p,'k','3');integer(n,0,1000,'n');integer(k,0,n,'k');let arrangements=1n;for(let j=0;j<k;j++)arrangements*=BigInt(n-j);const combinations=comb(n,k);
  return result('Dénombrement','\\binom{'+n+'}{'+k+'}='+combinations,[{title:'Sans tenir compte de l’ordre',text:'Choisir k éléments distincts parmi n, sans remise.',latex:'C_n^k=\\frac{n!}{k!(n-k)!}='+combinations},{title:'En tenant compte de l’ordre',text:'Choisir puis ordonner k éléments distincts, sans remise.',latex:'A_n^k=\\frac{n!}{(n-k)!}='+arrangements}],{method:'exact',exact:combinations,notes:['Avec remise et en tenant compte de l’ordre, le nombre de listes est nᵏ.']});
 }
 if(model==='conditional'){
  const a=probability(req.expression),b=probability(p.probB??'1/2'),joint=probability(p.joint??'1/4');
  if(asReal(exact('('+joint+')-('+a+')'))>0||asReal(exact('('+joint+')-('+b+')'))>0||asReal(exact('('+a+')+('+b+')-1-('+joint+')'))>0)throw new Error('Les trois probabilités sont incompatibles : max(0, P(A)+P(B)−1) ≤ P(A∩B) ≤ min(P(A),P(B)).');
  const union=exact('('+a+')+('+b+')-('+joint+')'),steps:Step[]=[{title:'Réunir deux événements',text:'Retirer l’intersection comptée deux fois.',latex:'P(A\\cup B)='+tex(union)},{title:'Tester l’indépendance',text:exact('('+joint+')-('+a+')*('+b+')')==='0'?'Les événements sont indépendants : P(A∩B) = P(A)P(B).':'Les événements ne sont pas indépendants.'}];
  for(const [name,den]of [['P(A\\mid B)',b],['P(B\\mid A)',a]])steps.push({title:'Calculer '+(name.includes('A\\mid')?'P(A | B)':'P(B | A)'),text:den==='0'?'La probabilité conditionnelle est indéfinie car l’événement conditionnant a une probabilité nulle.':'Diviser la probabilité de l’intersection par celle de l’événement conditionnant.',latex:den==='0'?undefined:name+'='+tex(exact('('+joint+')/('+den+')'))});
  return result('Événements et probabilités conditionnelles','P(A\\cup B)='+tex(union),steps,{method:'exact',exact:union});
 }
 if(model==='normal'){
  const mean=asReal(value(req.expression)),sigma=param(p,'sigma','1');if(sigma<=0)throw new Error('L’écart type σ doit être strictement positif.');
  const upper=param(p,'upper','1'),lower=param(p,'lower','-1'),kind=p.kind??'between';
  const tail=(z:number)=>{if(z>39)return 0;return Math.exp(-z*z/2)/Math.sqrt(2*Math.PI)*quadrature('exp(-('+String(z)+')*x-x^2/2)',0,10).value;};
  const z=(x:number)=>(x-mean)/sigma;let answer:number,label:string;
  if(kind==='atmost'){const t=z(upper);answer=t<=0?tail(-t):1-tail(t);label='X\\le '+numericTex(upper);}
  else if(kind==='atleast'){const t=z(lower);answer=t>=0?tail(t):1-tail(-t);label='X\\ge '+numericTex(lower);}
  else if(kind==='between'){if(lower>upper)throw new Error('La borne inférieure doit être inférieure ou égale à la borne supérieure.');const a=Math.max(-40,z(lower)),b=Math.min(40,z(upper));answer=a>=b?0:quadrature('exp(-x^2/2)/sqrt(2*pi)',a,b).value;label=numericTex(lower)+'\\le X\\le '+numericTex(upper);}
  else throw new Error('Pour la loi normale, choisis « Au plus », « Au moins » ou « Entre deux bornes ».');
  if(!Number.isFinite(answer))throw new Error('Les données dépassent la plage numérique de cette loi.');answer=Math.max(0,Math.min(1,answer));
  return result('Loi normale','P('+label+')\\approx '+numericTex(answer),[{title:'Identifier les paramètres',text:'μ est la moyenne et σ l’écart type, et non la variance.',latex:'X\\sim\\mathcal N('+numericTex(mean)+';'+numericTex(sigma*sigma)+')'},{title:'Centrer et réduire',text:'Transformer les bornes avec Z = (X − μ)/σ.',latex:'Z=\\frac{X-('+numericTex(mean)+')}{'+numericTex(sigma)+'}\\sim\\mathcal N(0;1)'},{title:'Intégrer la densité',text:'La probabilité est l’aire sous la densité. La quadrature est numérique ; les bornes ont une probabilité nulle.',latex:'\\varphi(z)=\\frac{e^{-z^2/2}}{\\sqrt{2\\pi}}'}],{method:'numeric',numericValues:[answer],approximate:fmt(answer),notes:['Le calcul utilise la précision numérique de l’appareil ; les probabilités extrêmement petites peuvent être arrondies à zéro.']});
 }
 if(model==='hypergeometric'){
  const population=param(p,'population','20'),successes=param(p,'successes','8'),n=param(p,'n','5');integer(population,1,500,'La population');integer(successes,0,population,'Le nombre d’éléments favorables');integer(n,0,population,'Le nombre de tirages');const e=event(p,n);
  const mass=(k:number)=>exact(comb(successes,k)+'*'+comb(population-successes,n-k)+'/'+comb(population,n)),v=add(Array.from({length:e.hi-e.lo+1},(_,i)=>mass(e.lo+i)));
  const mean=exact(n+'*'+successes+'/'+population),variance=population===1?'0':exact(n+'*'+successes+'/'+population+'*(1-'+successes+'/'+population+')*('+population+'-'+n+')/('+population+'-1)');
  return result('Tirages sans remise','P('+e.label+')='+tex(v),[{title:'Identifier le modèle',text:'N éléments au total, M favorables et n tirages sans remise. Les tirages ne sont pas indépendants.',latex:'N='+population+',\\quad M='+successes+',\\quad n='+n},{title:'Dénombrer les tirages',text:'Choisir les éléments favorables et les autres, puis diviser par le nombre total de tirages.',latex:'P(X=k)=\\frac{\\binom Mk\\binom{N-M}{n-k}}{\\binom Nn}'},{title:'Calculer les indicateurs',text:'Le facteur (N−n)/(N−1) corrige la variance pour l’absence de remise.',latex:'E(X)='+tex(mean)+',\\quad V(X)='+tex(variance)}],{method:'exact',exact:v,approximate:fmt(asReal(v))});
 }
 if(model==='poisson'){
  const lambda=asReal(value(req.expression));if(lambda<0||lambda>10000)throw new Error('Le paramètre λ doit être compris entre 0 et 10 000.');const e=event(p,10000),mode=Math.floor(lambda),max=Math.max(e.hi===10000?0:e.hi,mode+Math.ceil(12*Math.sqrt(lambda))+50,e.lo+50),weights=Array(max+1).fill(0);
  if(lambda===0)weights[0]=1;else{let logFactorial=0;for(let j=2;j<=mode;j++)logFactorial+=Math.log(j);weights[mode]=Math.exp(-lambda+mode*Math.log(lambda)-logFactorial);for(let j=mode;j>0;j--)weights[j-1]=weights[j]*j/lambda;for(let j=mode;j<max;j++)weights[j+1]=weights[j]*lambda/(j+1);}
  const answer=weights.slice(e.lo,p.kind==='atleast'?undefined:e.hi+1).reduce((a,b)=>a+b,0);
  return result('Loi de Poisson','P('+e.label+')\\approx '+numericTex(answer),[{title:'Identifier le paramètre',text:'λ représente le nombre moyen d’événements sur la période étudiée.',latex:'X\\sim\\mathcal P('+numericTex(lambda)+')'},{title:'Calculer les masses puis les additionner',text:'Le calcul part de la masse au voisinage de λ puis utilise la récurrence pour éviter les factorielles numériques.',latex:'P(X=k)=e^{-\\lambda}\\frac{\\lambda^k}{k!},\\quad E(X)=V(X)=\\lambda'}],{method:'numeric',numericValues:[answer],approximate:fmt(answer),notes:['La somme infinie est tronquée très au-delà du centre de la loi ; le résultat est une approximation numérique.']});
 }
 if(model!=='binomial')throw new Error('Choisis un modèle de probabilité proposé.');
 const n=param(p,'n','10'),prob=probability(req.expression);integer(n,0,10000,'n');const e=event(p,n),q=asReal(prob);
 const mass=(k:number)=>prob==='0'?(k===0?'1':'0'):prob==='1'?(k===n?'1':'0'):exact(comb(n,k)+'*('+prob+')^'+k+'*(1-('+prob+'))^'+(n-k));
 const steps:Step[]=[{title:'Vérifier le modèle',text:'n épreuves indépendantes, deux issues, avec une même probabilité de succès p à chaque épreuve.',latex:'X\\sim\\mathcal B('+n+';'+tex(prob)+')'},{title:'Calculer l’événement',text:'Additionner les masses des valeurs retenues, bornes incluses.',latex:'P(X=k)=\\binom nk p^k(1-p)^{n-k}'},{title:'Calculer les indicateurs',text:'L’espérance est np et la variance np(1−p).',latex:'E(X)='+tex(exact(n+'*('+prob+')'))+',\\quad V(X)='+tex(exact(n+'*('+prob+')*(1-('+prob+'))'))}];
 if(n<=200){const v=add(Array.from({length:e.hi-e.lo+1},(_,i)=>mass(e.lo+i)));return result('Loi binomiale','P('+e.label+')='+tex(v),steps,{method:'exact',exact:v,approximate:fmt(asReal(v))});}
 const weights=Array(n+1).fill(0),mode=Math.floor((n+1)*q);if(q===0)weights[0]=1;else if(q===1)weights[n]=1;else{weights[mode]=1;for(let j=mode;j>0;j--)weights[j-1]=weights[j]*j/(n-j+1)*(1-q)/q;for(let j=mode;j<n;j++)weights[j+1]=weights[j]*(n-j)/(j+1)*q/(1-q);}
 const total=weights.reduce((a,b)=>a+b,0),answer=weights.slice(e.lo,e.hi+1).reduce((a,b)=>a+b,0)/total;
 return result('Loi binomiale — grand effectif','P('+e.label+')\\approx '+numericTex(answer),steps,{method:'numeric',numericValues:[answer],approximate:fmt(answer),notes:['Au-delà de 200 épreuves, les masses sont calculées numériquement par récurrence autour du mode, jusqu’à 10 000 épreuves.']});
}
