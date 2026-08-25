export type LinearRelation = '>' | '>=' | '<' | '<=';
export interface LinearConstraint2D { a:number; b:number; c:number; op:LinearRelation; }
export interface Point2D { x:number; y:number; }

const EPS=1e-12;
export function linearBoundaryValue(q:LinearConstraint2D,p:Point2D):number{return q.a*p.x+q.b*p.y+q.c;}
export function satisfiesLinearConstraint(q:LinearConstraint2D,p:Point2D,tol=1e-10):boolean{
 const v=linearBoundaryValue(q,p);
 if(q.op==='>=')return v>=-tol;
 if(q.op==='>')return v>tol;
 if(q.op==='<=')return v<=tol;
 return v<-tol;
}
export function intersectBoundaryLines(q1:LinearConstraint2D,q2:LinearConstraint2D):Point2D|null{
 // a1 x + b1 y = -c1 ; a2 x + b2 y = -c2
 const det=q1.a*q2.b-q2.a*q1.b;
 const scale=Math.max(1,Math.abs(q1.a*q2.b),Math.abs(q2.a*q1.b));
 if(Math.abs(det)<=EPS*scale)return null;
 const x=(q1.b*q2.c-q2.b*q1.c)/det;
 const y=(q2.a*q1.c-q1.a*q2.c)/det;
 if(!Number.isFinite(x)||!Number.isFinite(y))return null;
 return{x,y};
}
export function verifyBoundaryIntersection(q1:LinearConstraint2D,q2:LinearConstraint2D,p:Point2D):{ok:boolean;r1:number;r2:number}{
 const r1=Math.abs(linearBoundaryValue(q1,p)),r2=Math.abs(linearBoundaryValue(q2,p));
 const scale=Math.max(1,Math.abs(q1.a*p.x),Math.abs(q1.b*p.y),Math.abs(q1.c),Math.abs(q2.a*p.x),Math.abs(q2.b*p.y),Math.abs(q2.c));
 return{ok:r1<=1e-9*scale&&r2<=1e-9*scale,r1,r2};
}
