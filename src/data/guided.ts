import type {Operation,Request} from '../engine/types';
interface GuidedField {key:string;label:string;initial:string;}
interface GuidedForm {model:string;fields:GuidedField[];columns?:number;expression:(values:Record<string,string>,params:Record<string,string>)=>string;}
const field=(key:string,label:string,initial:string):GuidedField=>({key,label,initial});
const wrap=(value:string)=>'('+value+')';
export const guidedForms:Partial<Record<Operation,GuidedForm>>={
 equation:{model:'ax^2+bx+c=0',fields:[field('a','Coefficient a','1'),field('b','Coefficient b','-5'),field('c','Coefficient c','6')],expression:v=>`${wrap(v.a)}*x^2+${wrap(v.b)}*x+${wrap(v.c)}=0`},
 system:{model:'\\begin{cases}a_1x+b_1y=c_1\\\\a_2x+b_2y=c_2\\end{cases}',fields:[field('a1','Coefficient a₁','2'),field('b1','Coefficient b₁','1'),field('c1','Second membre c₁','5'),field('a2','Coefficient a₂','1'),field('b2','Coefficient b₂','-1'),field('c2','Second membre c₂','1')],expression:v=>`${wrap(v.a1)}*x+${wrap(v.b1)}*y=${wrap(v.c1)}\n${wrap(v.a2)}*x+${wrap(v.b2)}*y=${wrap(v.c2)}`},
 complex:{model:'z=a+bi',fields:[field('a','Partie réelle a','3'),field('b','Partie imaginaire b','4')],expression:v=>`${wrap(v.a)}+${wrap(v.b)}*i`},
 geometry:{model:'u=(u_x;u_y;u_z),\\quad v=(v_x;v_y;v_z)',fields:[field('ux','Coordonnée uₓ','1'),field('uy','Coordonnée uᵧ','2'),field('uz','Coordonnée u_z','0'),field('vx','Coordonnée vₓ','2'),field('vy','Coordonnée vᵧ','-1'),field('vz','Coordonnée v_z','0')],expression:v=>`${v.ux};${v.uy};${v.uz}\n${v.vx};${v.vy};${v.vz}`},
 arithmetic:{model:'\\operatorname{PGCD}(a;b),\\quad\\operatorname{PPCM}(a;b)',fields:[field('a','Premier entier a','252'),field('b','Deuxième entier b','198')],expression:v=>`${v.a};${v.b}`}
};
export const guideModels:Partial<Record<Operation,[string,string][]>>={
 function:[['polynomial','Polynôme'],['rational','Quotient de deux expressions affines'],['exponential','Expression × exponentielle'],['logarithm','Logarithme d’une expression affine']],
 derivative:[['polynomial','Polynôme'],['rational','Quotient de deux expressions affines'],['exponential','Expression × exponentielle'],['logarithm','Logarithme d’une expression affine']],
 integral:[['polynomial','Polynôme'],['rational','Quotient de deux expressions affines'],['exponential','Expression × exponentielle'],['logarithm','Logarithme d’une expression affine']],
 sequence:[['affine','u suivant = a × u + b'],['arithmetic','Suite arithmétique'],['geometric','Suite géométrique']]
};
export function guideFor(req:Request):GuidedForm|undefined {
 if(['function','derivative','integral'].includes(req.operation)){
  const model=req.params.data_model??'polynomial';
  if(model==='rational')return {model:'f(x)=\\frac{ax+b}{cx+d}',fields:[field('a','Coefficient a','1'),field('b','Coefficient b','1'),field('c','Coefficient c','1'),field('d','Coefficient d','-1')],expression:v=>`(${wrap(v.a)}*x+${wrap(v.b)})/(${wrap(v.c)}*x+${wrap(v.d)})`};
  if(model==='exponential')return {model:'f(x)=(ax^2+bx+c)e^{dx}',fields:[field('a','Coefficient a','1'),field('b','Coefficient b','0'),field('c','Coefficient c','1'),field('d','Coefficient d','1')],expression:v=>`(${wrap(v.a)}*x^2+${wrap(v.b)}*x+${wrap(v.c)})*exp(${wrap(v.d)}*x)`};
  if(model==='logarithm')return {model:'f(x)=\\ln(ax+b)',fields:[field('a','Coefficient a','2'),field('b','Coefficient b','1')],expression:v=>`ln(${wrap(v.a)}*x+${wrap(v.b)})`};
  const integrate=req.operation==='integral';
  return {model:'f(x)=ax^3+bx^2+cx+d',fields:[field('a','Coefficient de x³','1'),field('b','Coefficient de x²','0'),field('c','Coefficient de x','-3'),field('d','Terme constant','1')].map((f,i)=>integrate?{...f,initial:['0','1','2','0'][i]}:f),expression:v=>`${wrap(v.a)}*x^3+${wrap(v.b)}*x^2+${wrap(v.c)}*x+${wrap(v.d)}`};
 }
 if(req.operation==='inequality')return {...guidedForms.equation!,model:'ax^2+bx+c\\;'+(req.params.relation==='<'?'<':req.params.relation==='>'?'>':req.params.relation==='<='?'\\le':'\\ge')+'\\;0',expression:(v,p)=>`${wrap(v.a)}*x^2+${wrap(v.b)}*x+${wrap(v.c)}${['<','>','<=','>='].includes(p.relation)?p.relation:'>='}0`};
 if(req.operation==='sequence'){
  const model=req.params.data_model??'affine';
  if(model==='arithmetic')return {model:'u_{n+1}=u_n+r',fields:[field('r','Différence r','3')],expression:v=>`u+${wrap(v.r)}`};
  if(model==='geometric')return {model:'u_{n+1}=q\\,u_n',fields:[field('q','Raison q','2')],expression:v=>`${wrap(v.q)}*u`};
  return {model:'u_{n+1}=a\\,u_n+b',fields:[field('a','Multiplicateur a','0,8'),field('b','Nombre ajouté b','3')],expression:v=>`${wrap(v.a)}*u+${wrap(v.b)}`};
 }
 if(req.operation==='matrix'){
  const n=['2','3','4'].includes(req.params.data_size)?Number(req.params.data_size):2;
  return {model:'A=(a_{ij})',columns:n,fields:Array.from({length:n*n},(_,k)=>{const i=Math.floor(k/n)+1,j=k%n+1;return field('m'+i+j,'Ligne '+i+', colonne '+j,n===2?['2','1','1','3'][k]:String(i===j?1:0));}),expression:v=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>v['m'+(i+1)+(j+1)]).join(';')).join('\n')};
 }
 if(req.operation==='statistics'){
  const count=Math.max(2,Math.min(30,Number(req.params.data_rows)||3));
  return {model:'(x_1;y_1),\\;(x_2;y_2),\\;\\ldots',columns:2,fields:Array.from({length:count},(_,i)=>[field('x'+i,'Valeur x, ligne '+(i+1),String(i+1)),field('y'+i,'Valeur y, ligne '+(i+1),String(2*(i+1)))]).flat(),expression:v=>Array.from({length:count},(_,i)=>v['x'+i]+';'+v['y'+i]).join('\n')};
 }
 return guidedForms[req.operation];
}
export function hasGuidedData(request:Request):boolean {return request.params.entry==='guided'&&!!guideFor(request)?.fields.some(f=>request.params['data_'+f.key]!==undefined);}
export function guidedRequest(request:Request,changes:Record<string,string>={}):Request{
 const params:Record<string,string>={...request.params,...changes,entry:'guided'};
 const form=guideFor({...request,params});if(!form)return request;
 if(request.operation==='sequence')params.kind='recurrence';
 const values:Record<string,string>={};
 for(const field of form.fields){const key='data_'+field.key;values[field.key]=params[key]??field.initial;params[key]=values[field.key];}
 return {...request,params,expression:form.expression(values,params)};
}
