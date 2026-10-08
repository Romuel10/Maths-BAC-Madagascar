import type {Operation,Request} from '../engine/types';
interface GuidedField {key:string;label:string;initial:string;}
interface GuidedForm {model:string;fields:GuidedField[];expression:(values:Record<string,string>)=>string;}
const field=(key:string,label:string,initial:string):GuidedField=>({key,label,initial});
const wrap=(value:string)=>'('+value+')';
export const guidedForms:Partial<Record<Operation,GuidedForm>>={
 equation:{model:'ax^2+bx+c=0',fields:[field('a','Coefficient a','1'),field('b','Coefficient b','-5'),field('c','Coefficient c','6')],expression:v=>`${wrap(v.a)}*x^2+${wrap(v.b)}*x+${wrap(v.c)}=0`},
 system:{model:'\\begin{cases}a_1x+b_1y=c_1\\\\a_2x+b_2y=c_2\\end{cases}',fields:[field('a1','Coefficient a₁','2'),field('b1','Coefficient b₁','1'),field('c1','Second membre c₁','5'),field('a2','Coefficient a₂','1'),field('b2','Coefficient b₂','-1'),field('c2','Second membre c₂','1')],expression:v=>`${wrap(v.a1)}*x+${wrap(v.b1)}*y=${wrap(v.c1)}\n${wrap(v.a2)}*x+${wrap(v.b2)}*y=${wrap(v.c2)}`},
 complex:{model:'z=a+bi',fields:[field('a','Partie réelle a','3'),field('b','Partie imaginaire b','4')],expression:v=>`${wrap(v.a)}+${wrap(v.b)}*i`},
 geometry:{model:'u=(u_x;u_y;u_z),\\quad v=(v_x;v_y;v_z)',fields:[field('ux','Coordonnée uₓ','1'),field('uy','Coordonnée uᵧ','2'),field('uz','Coordonnée u_z','0'),field('vx','Coordonnée vₓ','2'),field('vy','Coordonnée vᵧ','-1'),field('vz','Coordonnée v_z','0')],expression:v=>`${v.ux};${v.uy};${v.uz}\n${v.vx};${v.vy};${v.vz}`},
 arithmetic:{model:'\\operatorname{PGCD}(a;b),\\quad\\operatorname{PPCM}(a;b)',fields:[field('a','Premier entier a','252'),field('b','Deuxième entier b','198')],expression:v=>`${v.a};${v.b}`}
};
export function guidedRequest(request:Request,changes:Record<string,string>={}):Request{
 const form=guidedForms[request.operation];if(!form)return request;
 const params:Record<string,string>={...request.params,entry:'guided'};
 const values:Record<string,string>={};
 for(const field of form.fields){const key='data_'+field.key;values[field.key]=changes[key]??request.params[key]??field.initial;params[key]=values[field.key];}
 return {...request,params,expression:form.expression(values)};
}
