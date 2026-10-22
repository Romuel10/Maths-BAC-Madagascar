import {tools} from './tools';
import {guidedRequest} from './guided';
import type {Request,Tool,Field} from '../engine/types';
const field=(key:string,label:string,initial:string,hint?:string):Field=>({key,label,initial,hint});
export const modelOptions:Partial<Record<Request['operation'],string[][]>>={
 probability:[['binomial','Loi binomiale'],['hypergeometric','Tirages sans remise'],['normal','Loi normale'],['poisson','Loi de Poisson'],['conditional','Événements et conditionnelles'],['counting','Dénombrement']],
 statistics:[['regression','Deux variables · ajustement affine'],['descriptive','Une variable · valeurs et effectifs']],
 complex:[['analyze','Module, argument et formes'],['power','Puissance entière'],['roots','Racines complexes']]
};
export function workbenchTool(req:Request):Tool{
 const base=tools.find(t=>t.id===req.operation)!,p=req.params,model=p.model;let fields=[...base.fields],label=base.label,description=base.description;
 if(req.operation==='calculate')fields.push(...(p.form==='divide'?[field('divisor','Diviseur D(x)','x-1')]:p.form==='taylor'?[field('center','Centre a','0'),field('degree','Ordre de Taylor','4','Un entier de 0 à 8.')]:[]));
 if(req.operation==='function')fields.push(field('tangentAt','Tangente exacte en x =','', 'Facultatif : nombre ou fraction.'));
 if(req.operation==='sequence'){fields=fields.filter(f=>f.key!=='initial'||p.kind!=='explicit');if(p.kind==='second')fields.push(field('second','Deuxième terme','1'));fields.push(field('target','Rang à calculer directement','','Facultatif : formule explicite ou récurrence affine.'));}
 if(req.operation==='statistics'){fields=model==='descriptive'?[]:[field('predict','Estimer y pour x =','','Facultatif : utilise la droite ajustée.')];if(model==='descriptive'){label='Une valeur ; un effectif par ligne';description='Moyenne, médiane, quartiles, variance, écart type, effectifs et fréquences.';}else description='Droite des moindres carrés, moyennes, variances, covariance, corrélation et estimation.';}
 if(req.operation==='complex')fields=model==='power'?[field('power','Exposant entier','3')]:model==='roots'?[field('degree','Ordre des racines','3','De 2 à 24 ; toutes les racines distinctes sont affichées.')]:[];
 if(req.operation==='probability'){
  const event=[field('kind','Événement',model==='normal'?'between':'exact')],kind=p.kind??'exact';
  fields=model==='normal'?[field('sigma','Écart type σ','1'),...event,...(kind!=='atmost'?[field('lower','Borne inférieure','-1')]:[]),...(kind!=='atleast'?[field('upper','Borne supérieure','1')]:[])]:model==='conditional'?[field('probB','Probabilité P(B)','1/2'),field('joint','Probabilité P(A ∩ B)','1/4')]:model==='counting'?[field('n','Nombre d’éléments n','10'),field('k','Nombre choisi k','3')]:[...(model==='hypergeometric'?[field('population','Population N','20'),field('successes','Éléments favorables M','8')]:[]),...(model!=='poisson'?[field('n',model==='hypergeometric'?'Nombre de tirages n':'Nombre d’épreuves n',model==='hypergeometric'?'5':'10')]:[]),...event,field('k',kind==='between'?'Borne inférieure k':'Nombre de succès k','3'),...(kind==='between'?[field('upper','Borne supérieure','5')]:[])];
  label=model==='normal'?'Moyenne μ':model==='poisson'?'Nombre moyen d’événements λ':model==='conditional'?'Probabilité P(A)':base.label;
  description=model==='normal'?'Calcule une aire sous la courbe normale à partir de la moyenne et de l’écart type.':model==='poisson'?'Probabilités d’un comptage à partir de son nombre moyen d’événements.':model==='hypergeometric'?'Tirages dans une population finie, sans remettre les éléments tirés.':model==='conditional'?'Renseigne P(A), P(B) et P(A ∩ B) ; l’application vérifie leur compatibilité.':model==='counting'?'Combinaisons et arrangements exacts, sans remise.':'Probabilités exactes jusqu’à 200 épreuves et numériques jusqu’à 10 000, événements simples et intervalles.';
 }
 return {...base,fields,label,description};
}
export function setParameter(req:Request,key:string,v:string):Request{
 let next:Request={...req,params:{...req.params,[key]:v}};
 if(key==='model'){
  for(const k of Object.keys(next.params))if(k.startsWith('data_'))delete next.params[k];
  const examples:Record<string,{expression:string;params?:Record<string,string>}>=req.operation==='probability'?{
   binomial:{expression:'0.3',params:{kind:'exact',n:'10',k:'3'}},normal:{expression:'0',params:{kind:'between',lower:'-1',upper:'1',sigma:'1'}},poisson:{expression:'3',params:{kind:'exact',k:'2'}},hypergeometric:{expression:'0',params:{kind:'exact',population:'20',successes:'8',n:'5',k:'2'}},conditional:{expression:'1/2',params:{probB:'2/5',joint:'1/5'}},counting:{expression:'0',params:{n:'10',k:'3'}}
  }:req.operation==='statistics'?{regression:{expression:'1;2\n2;3\n3;5\n4;6'},descriptive:{expression:'8;2\n12;5\n16;3'}}:{};
  if(examples[v])next={...next,expression:examples[v].expression,params:{...next.params,...examples[v].params,mathLatex:'',mathSource:''}};
  if(next.params.entry==='guided')next=guidedRequest(next);
 }
 return next;
}
export function fieldOptions(req:Request,key:string):string[][]|undefined{
 if(req.operation==='probability'&&key==='kind')return req.params.model==='normal'?[['between','Entre deux bornes'],['atmost','Au plus la borne supérieure'],['atleast','Au moins la borne inférieure']]:[['exact','Exactement k'],['atmost','Au plus k'],['atleast','Au moins k'],['between','Entre k et la borne supérieure']];
 return undefined;
}
export const examples:Partial<Record<Request['operation'],{label:string;expression:string;params:Record<string,string>}[]>>={
 calculate:[{label:'Division de polynômes',expression:'x^3-1',params:{form:'divide',divisor:'x-1'}},{label:'Taylor de eˣ',expression:'exp(x)',params:{form:'taylor',center:'0',degree:'4'}},{label:'Fractions rationnelles',expression:'1/(x^2-1)',params:{form:'partial'}}],
 system:[{label:'Trois inconnues',expression:'x+y+z=6\n2*x-y+z=3\nx+2*y-z=2',params:{}},{label:'Solutions paramétrées',expression:'x+y+z=3\n2*x+2*y+2*z=6',params:{}}],
 function:[{label:'Racine composée',expression:'sqrt(x^2+1)',params:{xmin:'-5',xmax:'5',tangentAt:'1'}},{label:'Logarithme et quotient',expression:'ln(x)/x',params:{xmin:'0.1',xmax:'6'}}],
 sequence:[{label:'Suite de Fibonacci',expression:'u+v',params:{kind:'second',initial:'0',second:'1',start:'0',count:'12',target:''}},{label:'Suite affine et limite',expression:'0.8*u+3',params:{kind:'recurrence',initial:'5',start:'0',count:'10',target:'50'}}]
};
