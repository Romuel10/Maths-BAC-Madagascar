/**
 * Deterministic symbolic derivative engine for the BAC app.
 *
 * Design goals:
 * - one AST is used for the derivative, final answer and pedagogical steps;
 * - no MathJS dependency for differentiation (MathJS can be used by the caller
 *   only as an independent checker/evaluator);
 * - stable student-friendly output;
 * - explicit support for the function families used in the application.
 */

export type DNode =
  | { kind: 'num'; value: number }
  | { kind: 'sym'; name: string }
  | { kind: 'neg'; value: DNode }
  | { kind: 'bin'; op: '+' | '-' | '*' | '/' | '^'; left: DNode; right: DNode }
  | { kind: 'func'; name: 'sin' | 'cos' | 'tan' | 'exp' | 'log' | 'sqrt' | 'abs'; arg: DNode };

export interface DerivativeLessonStep {
  rule: string;
  formula: string;
  application: string;
  lines?: string[];
  before?: string;
  after?: string;
}

export interface DerivativeEngineResult {
  expression: string;
  derivative: string;
  secondDerivative: string;
  steps: DerivativeLessonStep[];
  warnings: string[];
  supported: boolean;
}

type Token = { type: 'num' | 'id' | 'op' | 'lpar' | 'rpar' | 'eof'; value: string };

const EPS = 1e-12;

function cleanInput(input: string): string {
  return input
    .trim()
    .replace(/\*\*/g, '^')
    .replace(/[−–—]/g, '-')
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/√\s*\(/g, 'sqrt(')
    .replace(/\bln\s*\(/gi, 'log(')
    .replace(/\s+/g, '');
}

function tokenize(input: string): Token[] {
  const s = cleanInput(input);
  const out: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\d|\./.test(ch)) {
      const start = i;
      let dots = 0;
      while (i < s.length && /[\d.]/.test(s[i])) {
        if (s[i] === '.') dots++;
        i++;
      }
      if (dots > 1) throw new Error('Nombre invalide');
      const raw = s.slice(start, i);
      if (!/^\d*\.?\d+$/.test(raw)) throw new Error('Nombre invalide');
      out.push({ type: 'num', value: raw });
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const start = i;
      while (i < s.length && /[A-Za-z0-9_]/.test(s[i])) i++;
      out.push({ type: 'id', value: s.slice(start, i).toLowerCase() });
      continue;
    }
    if ('+-*/^'.includes(ch)) {
      out.push({ type: 'op', value: ch }); i++; continue;
    }
    if (ch === '(') { out.push({ type: 'lpar', value: ch }); i++; continue; }
    if (ch === ')') { out.push({ type: 'rpar', value: ch }); i++; continue; }
    throw new Error(`Symbole non pris en charge: ${ch}`);
  }
  out.push({ type: 'eof', value: '' });
  return out;
}

class Parser {
  private tokens: Token[];
  private pos = 0;
  constructor(input: string) { this.tokens = tokenize(input); }
  private current(): Token { return this.tokens[this.pos]; }
  private take(): Token { return this.tokens[this.pos++]; }
  private accept(type: Token['type'], value?: string): boolean {
    const t = this.current();
    if (t.type === type && (value === undefined || t.value === value)) { this.pos++; return true; }
    return false;
  }
  private expect(type: Token['type'], value?: string): Token {
    const t = this.current();
    if (t.type !== type || (value !== undefined && t.value !== value)) throw new Error(`Expression invalide près de « ${t.value || 'fin'} »`);
    this.pos++; return t;
  }
  parse(): DNode {
    const node = this.parseAddSub();
    if (this.current().type !== 'eof') throw new Error(`Expression incomplète près de « ${this.current().value} »`);
    return node;
  }
  private parseAddSub(): DNode {
    let node = this.parseMulDiv();
    while (this.current().type === 'op' && (this.current().value === '+' || this.current().value === '-')) {
      const op = this.take().value as '+' | '-';
      node = { kind: 'bin', op, left: node, right: this.parseMulDiv() };
    }
    return node;
  }
  private startsFactor(t: Token): boolean {
    return t.type === 'num' || t.type === 'id' || t.type === 'lpar';
  }
  private parseMulDiv(): DNode {
    let node = this.parseUnary();
    while (true) {
      const t = this.current();
      if (t.type === 'op' && (t.value === '*' || t.value === '/')) {
        const op = this.take().value as '*' | '/';
        node = { kind: 'bin', op, left: node, right: this.parseUnary() };
        continue;
      }
      // School notation: 2x, 3(x+1), x sin(x), (x+1)(x-1)
      if (this.startsFactor(t)) {
        node = { kind: 'bin', op: '*', left: node, right: this.parseUnary() };
        continue;
      }
      break;
    }
    return node;
  }
  private parseUnary(): DNode {
    if (this.accept('op', '+')) return this.parseUnary();
    if (this.accept('op', '-')) return { kind: 'neg', value: this.parseUnary() };
    return this.parsePower();
  }
  private parsePower(): DNode {
    let node = this.parsePrimary();
    if (this.accept('op', '^')) {
      node = { kind: 'bin', op: '^', left: node, right: this.parseUnary() };
    }
    return node;
  }
  private parsePrimary(): DNode {
    const t = this.current();
    if (t.type === 'num') { this.take(); return { kind: 'num', value: Number(t.value) }; }
    if (t.type === 'id') {
      const id = this.take().value;
      if (this.accept('lpar')) {
        const arg = this.parseAddSub();
        this.expect('rpar');
        const normalized = id === 'ln' ? 'log' : id;
        if (!['sin','cos','tan','exp','log','sqrt','abs'].includes(normalized)) throw new Error(`Fonction non prise en charge: ${id}`);
        return { kind: 'func', name: normalized as 'sin'|'cos'|'tan'|'exp'|'log'|'sqrt'|'abs', arg };
      }
      return { kind: 'sym', name: id };
    }
    if (this.accept('lpar')) {
      const node = this.parseAddSub();
      this.expect('rpar');
      return node;
    }
    throw new Error(`Expression invalide près de « ${t.value || 'fin'} »`);
  }
}

export function parseDerivativeExpression(input: string): DNode {
  return new Parser(input).parse();
}

function num(value: number): DNode { return { kind: 'num', value: Math.abs(value) < EPS ? 0 : value }; }
function neg(value: DNode): DNode { return simplifyNode({ kind: 'neg', value }); }
function bin(op: '+'|'-'|'*'|'/'|'^', left: DNode, right: DNode): DNode { return simplifyNode({ kind: 'bin', op, left, right }); }
function fn(name: 'sin'|'cos'|'tan'|'exp'|'log'|'sqrt'|'abs', arg: DNode): DNode { return { kind: 'func', name, arg: simplifyNode(arg) }; }

function isNum(n: DNode, v?: number): boolean { return n.kind === 'num' && (v === undefined || Math.abs(n.value - v) < EPS); }
function sameNode(a: DNode, b: DNode): boolean { return serializeNode(a) === serializeNode(b); }

function simplifyNode(node: DNode): DNode {
  if (node.kind === 'num' || node.kind === 'sym') return node;
  if (node.kind === 'func') {
    const arg = simplifyNode(node.arg);
    if (node.name === 'log' && arg.kind === 'sym' && arg.name === 'e') return num(1);
    if (node.name === 'log' && isNum(arg, 1)) return num(0);
    if (node.name === 'exp' && isNum(arg, 0)) return num(1);
    if (node.name === 'sin' && isNum(arg, 0)) return num(0);
    if (node.name === 'cos' && isNum(arg, 0)) return num(1);
    if (node.name === 'tan' && isNum(arg, 0)) return num(0);
    if (node.name === 'sqrt' && arg.kind === 'num' && arg.value >= 0) {
      const r = Math.sqrt(arg.value);
      if (Number.isFinite(r) && Math.abs(r - Math.round(r)) < EPS) return num(r);
    }
    return { ...node, arg };
  }
  if (node.kind === 'neg') {
    const v = simplifyNode(node.value);
    if (v.kind === 'num') return num(-v.value);
    if (v.kind === 'neg') return simplifyNode(v.value);
    if (v.kind === 'bin' && v.op === '*' && v.left.kind === 'num') return simplifyNode({kind:'bin',op:'*',left:num(-v.left.value),right:v.right});
    return { kind: 'neg', value: v };
  }
  const a = simplifyNode(node.left), b = simplifyNode(node.right);
  switch (node.op) {
    case '+':
      if (isNum(a,0)) return b;
      if (isNum(b,0)) return a;
      if (b.kind === 'neg') return bin('-', a, b.value);
      if (a.kind === 'neg') return bin('-', b, a.value);
      if (a.kind === 'num' && b.kind === 'num') return num(a.value+b.value);
      if (sameNode(a,b)) return bin('*', num(2), a);
      if (b.kind==='bin' && b.op==='*') {
        if (sameNode(a,b.right)) return bin('*',bin('+',num(1),b.left),a);
        if (sameNode(a,b.left)) return bin('*',bin('+',num(1),b.right),a);
      }
      if (a.kind==='bin' && a.op==='*') {
        if (sameNode(b,a.right)) return bin('*',bin('+',a.left,num(1)),b);
        if (sameNode(b,a.left)) return bin('*',bin('+',a.right,num(1)),b);
      }
      if (a.kind==='bin'&&a.op==='*'&&b.kind==='bin'&&b.op==='*') {
        if (sameNode(a.right,b.right)) return bin('*',bin('+',a.left,b.left),a.right);
        if (sameNode(a.left,b.left)) return bin('*',a.left,bin('+',a.right,b.right));
      }
      return { kind:'bin',op:'+',left:a,right:b };
    case '-':
      if (isNum(b,0)) return a;
      if (isNum(a,0)) return neg(b);
      if (b.kind === 'neg') return bin('+', a, b.value);
      if (a.kind === 'num' && b.kind === 'num') return num(a.value-b.value);
      if (sameNode(a,b)) return num(0);
      if (a.kind === 'bin' && a.op === '+') {
        if (sameNode(a.left,b)) return a.right;
        if (sameNode(a.right,b)) return a.left;
      }
      if (b.kind==='bin' && b.op==='*') {
        if (sameNode(a,b.right)) return bin('*',bin('-',num(1),b.left),a);
        if (sameNode(a,b.left)) return bin('*',bin('-',num(1),b.right),a);
      }
      if (a.kind==='bin' && a.op==='*') {
        if (sameNode(b,a.right)) return bin('*',bin('-',a.left,num(1)),b);
        if (sameNode(b,a.left)) return bin('*',bin('-',a.right,num(1)),b);
      }
      if (a.kind==='bin'&&a.op==='*'&&b.kind==='bin'&&b.op==='*') {
        if (sameNode(a.right,b.right)) return bin('*',bin('-',a.left,b.left),a.right);
        if (sameNode(a.left,b.left)) return bin('*',a.left,bin('-',a.right,b.right));
      }
      // a - b/c = (ac-b)/c. This is especially useful for simplifying
      // derivatives involving sqrt(u), where sqrt(u)*sqrt(u)=u.
      if (b.kind === 'bin' && b.op === '/') return bin('/', bin('-', bin('*',a,b.right), b.left), b.right);
      return { kind:'bin',op:'-',left:a,right:b };
    case '*':
      if (isNum(a,0) || isNum(b,0)) return num(0);
      if (isNum(a,1)) return b;
      if (isNum(b,1)) return a;
      if (isNum(a,-1)) return neg(b);
      if (isNum(b,-1)) return neg(a);
      if (a.kind === 'neg') return neg(bin('*', a.value, b));
      if (b.kind === 'neg') return neg(bin('*', a, b.value));
      if (a.kind === 'num' && b.kind === 'num') return num(a.value*b.value);
      // Keep numerical coefficients together: 2*(3*u) -> 6*u.
      if (a.kind === 'num' && b.kind === 'bin' && b.op === '*' && b.left.kind === 'num') return bin('*', num(a.value*b.left.value), b.right);
      if (b.kind === 'num' && a.kind === 'bin' && a.op === '*' && a.left.kind === 'num') return bin('*', num(b.value*a.left.value), a.right);
      if (b.kind === 'num' && a.kind !== 'num') return bin('*', b, a);
      // (A/B)*B -> A and B*(A/B) -> A (valid on original domain)
      if (a.kind === 'bin' && a.op === '/' && sameNode(a.right,b)) return a.left;
      if (b.kind === 'bin' && b.op === '/' && sameNode(b.right,a)) return b.left;
      // sqrt(u)*sqrt(u) = u; otherwise a*a = a^2.
      if (sameNode(a,b)) return a.kind === 'func' && a.name === 'sqrt' ? a.arg : bin('^', a, num(2));
      return { kind:'bin',op:'*',left:a,right:b };
    case '/':
      if (isNum(a,0)) return num(0);
      if (isNum(b,1)) return a;
      // (a/b)/c = a/(bc), a/(b/c) = ac/b
      if (a.kind === 'bin' && a.op === '/') return bin('/', a.left, bin('*', a.right, b));
      if (b.kind === 'bin' && b.op === '/') return bin('/', bin('*', a, b.right), b.left);
      if (a.kind === 'num' && b.kind === 'num' && Math.abs(b.value)>EPS) {
        const av=a.value,bv=b.value;
        if(Number.isInteger(av)&&Number.isInteger(bv)){
          const gcd=(m:number,n:number):number=>{m=Math.abs(m);n=Math.abs(n);while(n){const r=m%n;m=n;n=r;}return m||1;};
          const g=gcd(av,bv),nn=av/g,dd=bv/g;
          if(dd===1)return num(nn);
          if(dd===-1)return num(-nn);
          return {kind:'bin',op:'/',left:num(dd<0?-nn:nn),right:num(Math.abs(dd))};
        }
        return num(av/bv);
      }
      if (a.kind === 'num' && b.kind === 'bin' && b.op === '*' && b.left.kind === 'num' && Math.abs(b.left.value)>EPS) {
        if(Number.isInteger(a.value)&&Number.isInteger(b.left.value)){
          const gcd=(m:number,n:number):number=>{m=Math.abs(m);n=Math.abs(n);while(n){const r=m%n;m=n;n=r;}return m||1;};
          const g=gcd(a.value,b.left.value),nn=a.value/g,dd=b.left.value/g;
          if(dd===1)return bin('/',num(nn),b.right);
          const newDen:DNode={kind:'bin',op:'*',left:num(dd<0?-dd:dd),right:b.right};
          return {kind:'bin',op:'/',left:num(dd<0?-nn:nn),right:newDen};
        }
        const ratio = a.value / b.left.value;
        return Math.abs(ratio-1)<EPS ? bin('/', num(1), b.right) : {kind:'bin',op:'/',left:a,right:b};
      }
      // Cancel a common numerical coefficient: (2*u)/(2*v) -> u/v.
      if (a.kind === 'bin' && a.op === '*' && a.left.kind === 'num' && b.kind === 'bin' && b.op === '*' && b.left.kind === 'num' && Math.abs(b.left.value)>EPS) {
        const ratio = a.left.value / b.left.value;
        if (Math.abs(ratio-1)<EPS) return bin('/', a.right, b.right);
        return bin('/', bin('*', num(ratio), a.right), b.right);
      }
      if (sameNode(a,b)) return num(1);
      // (A*B)/B -> A
      if (a.kind === 'bin' && a.op === '*') {
        if (sameNode(a.left,b)) return a.right;
        if (sameNode(a.right,b)) return a.left;
      }
      return { kind:'bin',op:'/',left:a,right:b };
    case '^':
      if (isNum(b,0)) return num(1);
      if (isNum(b,1)) return a;
      if (isNum(a,1)) return num(1);
      if (a.kind === 'func' && a.name === 'sqrt' && isNum(b,2)) return a.arg;
      if (a.kind==='bin'&&a.op==='*'&&a.left.kind==='num'&&b.kind==='num'&&Number.isInteger(b.value)&&b.value>=2&&b.value<=8) {
        return bin('*',num(Math.pow(a.left.value,b.value)),bin('^',a.right,b));
      }
      if (a.kind === 'bin' && a.op === '^' && a.right.kind === 'num' && b.kind === 'num' && Number.isInteger(a.right.value) && Number.isInteger(b.value)) return bin('^', a.left, num(a.right.value*b.value));
      if (a.kind === 'num' && b.kind === 'num') {
        const v = Math.pow(a.value,b.value); if (Number.isFinite(v)) return num(v);
      }
      return { kind:'bin',op:'^',left:a,right:b };
  }
}

function dependsOnX(node: DNode): boolean {
  if (node.kind === 'num') return false;
  if (node.kind === 'sym') return node.name === 'x';
  if (node.kind === 'neg') return dependsOnX(node.value);
  if (node.kind === 'func') return dependsOnX(node.arg);
  return dependsOnX(node.left) || dependsOnX(node.right);
}

export function differentiateNode(node: DNode, warnings: string[] = []): DNode {
  if (node.kind === 'num') return num(0);
  if (node.kind === 'sym') return num(node.name === 'x' ? 1 : 0);
  if (node.kind === 'neg') return neg(differentiateNode(node.value,warnings));
  if (node.kind === 'bin') {
    const u=node.left,v=node.right;
    if (node.op === '+') return bin('+',differentiateNode(u,warnings),differentiateNode(v,warnings));
    if (node.op === '-') return bin('-',differentiateNode(u,warnings),differentiateNode(v,warnings));
    if (node.op === '*') return bin('+',bin('*',differentiateNode(u,warnings),v),bin('*',u,differentiateNode(v,warnings)));
    if (node.op === '/') return bin('/',bin('-',bin('*',differentiateNode(u,warnings),v),bin('*',u,differentiateNode(v,warnings))),bin('^',v,num(2)));
    if (node.op === '^') {
      // u^n with constant exponent: the BAC case and the safest simplification.
      if (!dependsOnX(v)) {
        return bin('*',bin('*',v,bin('^',u,bin('-',v,num(1)))),differentiateNode(u,warnings));
      }
      // a^v with constant positive base: a^v ln(a) v'
      if (!dependsOnX(u)) {
        const knownPositive = (u.kind==='num' && u.value>0) || (u.kind==='sym' && (u.name==='e'||u.name==='pi'));
        if(!knownPositive) warnings.push('Pour a^u(x), la formule réelle utilisée suppose que la base constante a est strictement positive.');
        return bin('*',bin('*',node,fn('log',u)),differentiateNode(v,warnings));
      }
      // General logarithmic differentiation: u^v [v' ln(u) + v u'/u], u>0.
      warnings.push('Pour une puissance u(x)^v(x), la formule logarithmique suppose u(x) > 0 sur l’intervalle étudié.');
      return bin('*',node,bin('+',bin('*',differentiateNode(v,warnings),fn('log',u)),bin('*',v,bin('/',differentiateNode(u,warnings),u))));
    }
  }
  if (node.kind === 'func') {
    const u=node.arg,du=differentiateNode(u,warnings);
    switch(node.name) {
      case 'sin': return bin('*',du,fn('cos',u));
      case 'cos': return neg(bin('*',du,fn('sin',u)));
      case 'tan':
        warnings.push('La dérivée de tan(u) est valable uniquement lorsque cos(u) ≠ 0.');
        return bin('/',du,bin('^',fn('cos',u),num(2)));
      case 'exp': return bin('*',du,fn('exp',u));
      case 'log':
        warnings.push('La formule (ln u)′ = u′/u s’applique sur les points où u > 0.');
        return bin('/',du,u);
      case 'sqrt':
        warnings.push('Pour √u, la fonction peut être définie en u=0 mais la formule de dérivation u′/(2√u) s’utilise seulement lorsque u > 0 ; les points où u=0 doivent être étudiés séparément.');
        return bin('/',du,bin('*',num(2),fn('sqrt',u)));
      case 'abs':
        warnings.push('La dérivée de |u| n’existe pas aux points où u=0 et change de signe. La formule affichée vaut seulement lorsque u≠0.');
        return bin('*',du,bin('/',u,fn('abs',u)));
    }
  }
  throw new Error('Cas de dérivation non pris en charge');
}

function precedence(node: DNode): number {
  if (node.kind === 'bin') return node.op==='+'||node.op==='-'?1:node.op==='*'||node.op==='/'?2:3;
  if (node.kind === 'neg') return 4;
  return 5;
}
function formatNum(v:number):string {
  if (Math.abs(v-Math.round(v))<1e-12) return String(Math.round(v));
  return String(Math.round(v*1e12)/1e12);
}
export function serializeNode(node: DNode, parentPrec = 0, _rightSide = false): string {
  if (node.kind === 'num') return formatNum(node.value);
  if (node.kind === 'sym') return node.name;
  if (node.kind === 'func') return `${node.name}(${serializeNode(node.arg)})`;
  if (node.kind === 'neg') {
    const inner=serializeNode(node.value,4);
    return `-${precedence(node.value)<4?`(${serializeNode(node.value)})`:inner}`;
  }
  const p=precedence(node);
  let left=serializeNode(node.left,p);
  let right=serializeNode(node.right,p,node.op==='-'||node.op==='/'||node.op==='^');
  if (precedence(node.left)<p || (node.op==='^' && node.left.kind==='neg')) left=`(${serializeNode(node.left)})`;
  const needRight = precedence(node.right)<p || ((node.op==='-'||node.op==='/') && precedence(node.right)===p) || (node.op==='^' && node.right.kind==='bin');
  if (needRight) right=`(${serializeNode(node.right)})`;
  const raw=`${left}${node.op}${right}`;
  return p<parentPrec?`(${raw})`:raw;
}

// ---------- Rational-polynomial canonical form ----------
type Poly = number[];
type Rat = { num:Poly; den:Poly };
function trim(a:Poly):Poly { const o=a.slice(); while(o.length>1&&Math.abs(o[o.length-1])<1e-10)o.pop(); return o.map(v=>Math.abs(v)<1e-11?0:v); }
function padd(a:Poly,b:Poly):Poly{const n=Math.max(a.length,b.length),o=Array(n).fill(0);for(let i=0;i<n;i++)o[i]=(a[i]||0)+(b[i]||0);return trim(o);}
function psub(a:Poly,b:Poly):Poly{return padd(a,b.map(v=>-v));}
function pmul(a:Poly,b:Poly):Poly{const o=Array(a.length+b.length-1).fill(0);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)o[i+j]+=a[i]*b[j];return trim(o);}
function pscale(a:Poly,k:number):Poly{return trim(a.map(v=>v*k));}
function ppow(a:Poly,n:number):Poly{let o:Poly=[1],b=a,e=n;while(e>0){if(e%2)o=pmul(o,b);b=pmul(b,b);e=Math.floor(e/2);}return o;}
function pdivmod(a0:Poly,b0:Poly):{q:Poly;r:Poly}|null{let a=trim(a0),b=trim(b0);if(b.length===1&&Math.abs(b[0])<EPS)return null;if(a.length<b.length)return{q:[0],r:a};const q=Array(a.length-b.length+1).fill(0);let r=a.slice(),guard=0;while(r.length>=b.length&&!(r.length===1&&Math.abs(r[0])<1e-9)&&guard++<80){const k=r.length-b.length,c=r[r.length-1]/b[b.length-1];q[k]=c;const sub=Array(k).fill(0).concat(pscale(b,c));r=trim(psub(r,sub));}return{q:trim(q),r:trim(r)};}
function pmonic(a:Poly):Poly{const p=trim(a),lead=p[p.length-1];return Math.abs(lead)<EPS?[0]:pscale(p,1/lead);}
function pgcd(a0:Poly,b0:Poly):Poly{let a=trim(a0),b=trim(b0),g=0;while(!(b.length===1&&Math.abs(b[0])<1e-8)&&g++<50){const dm=pdivmod(a,b);if(!dm)break;a=b;b=dm.r.map(v=>Math.abs(v)<1e-7?0:v);}return pmonic(a);}
function rreduce(r:Rat):Rat{let n=trim(r.num),d=trim(r.den);if(d.length===1&&Math.abs(d[0])<EPS)return r;const g=pgcd(n,d);if(!(g.length===1&&Math.abs(g[0]-1)<1e-7)){const a=pdivmod(n,g),b=pdivmod(d,g);if(a&&b&&a.r.every(v=>Math.abs(v)<1e-6)&&b.r.every(v=>Math.abs(v)<1e-6)){n=a.q;d=b.q;}}if(d[d.length-1]<0){n=pscale(n,-1);d=pscale(d,-1);}if(d.length===1&&Math.abs(d[0]-1)>1e-10&&Math.abs(d[0])>EPS){n=pscale(n,1/d[0]);d=[1];}const c=(p:Poly)=>p.map(v=>Math.abs(v-Math.round(v))<1e-9?Math.round(v):Math.round(v*1e10)/1e10);return{num:trim(c(n)),den:trim(c(d))};}
function toRat(n:DNode):Rat|null{
  n=simplifyNode(n);
  if(n.kind==='num')return{num:[n.value],den:[1]};
  if(n.kind==='sym')return n.name==='x'?{num:[0,1],den:[1]}:null;
  if(n.kind==='neg'){const r=toRat(n.value);return r?{num:pscale(r.num,-1),den:r.den}:null;}
  if(n.kind!=='bin')return null;
  const A=toRat(n.left),B=toRat(n.right);if(!A||!B)return null;
  if(n.op==='+')return rreduce({num:padd(pmul(A.num,B.den),pmul(B.num,A.den)),den:pmul(A.den,B.den)});
  if(n.op==='-')return rreduce({num:psub(pmul(A.num,B.den),pmul(B.num,A.den)),den:pmul(A.den,B.den)});
  if(n.op==='*')return rreduce({num:pmul(A.num,B.num),den:pmul(A.den,B.den)});
  if(n.op==='/')return rreduce({num:pmul(A.num,B.den),den:pmul(A.den,B.num)});
  if(n.op==='^'&&n.right.kind==='num'&&Number.isInteger(n.right.value)&&Math.abs(n.right.value)<=20){const e=n.right.value;return e>=0?rreduce({num:ppow(A.num,e),den:ppow(A.den,e)}):rreduce({num:ppow(A.den,-e),den:ppow(A.num,-e)});}
  return null;
}
function fpoly(p0:Poly):string{const p=trim(p0);if(p.every(v=>Math.abs(v)<EPS))return'0';const out:string[]=[];for(let i=p.length-1;i>=0;i--){const c=p[i];if(Math.abs(c)<EPS)continue;const sign=c<0?'-':'+';const a=Math.abs(c);const coeff=i>0&&Math.abs(a-1)<EPS?'':formatNum(a);const term=i===0?formatNum(a):i===1?`${coeff}x`:`${coeff}x^${i}`;out.push(out.length===0?(sign==='-'?`-${term}`:term):` ${sign} ${term}`);}return out.join('');}
function repeatedPower(p0:Poly):string|null{
  const p=trim(p0),n=p.length-1;
  if(n<2||n>12)return null;
  const lead=p[n];
  if(Math.abs(lead)<EPS || (n%2===0 && lead<0)) return null;
  const rawA=Math.pow(Math.abs(lead),1/n)*(lead<0?-1:1);
  const simple=(v:number)=>Math.abs(v-Math.round(v*1e6)/1e6)<1e-10;
  if(!simple(rawA)) return null; // avoid inventing irrational decimal factors
  const a=Math.round(rawA*1e6)/1e6;
  const denom=n*Math.pow(a,n-1);
  if(Math.abs(denom)<EPS)return null;
  const rawB=p[n-1]/denom;
  if(!simple(rawB)) return null;
  const b=Math.round(rawB*1e6)/1e6;
  const rebuilt=Array(n+1).fill(0);
  const C=(N:number,K:number)=>{let v=1;for(let i=1;i<=K;i++)v=v*(N-K+i)/i;return v;};
  // (a*x+b)^n = sum C(n,j) a^j b^(n-j) x^j
  for(let j=0;j<=n;j++) rebuilt[j]=C(n,j)*Math.pow(a,j)*Math.pow(b,n-j);
  if(!rebuilt.every((v,i)=>Math.abs(v-(p[i]||0))<=1e-8*Math.max(1,Math.abs(v),Math.abs(p[i]||0))))return null;
  const xpart=Math.abs(a-1)<EPS?'x':Math.abs(a+1)<EPS?'-x':`${formatNum(a)}x`;
  const linear=Math.abs(b)<EPS?xpart:b>0?`${xpart} + ${formatNum(b)}`:`${xpart} - ${formatNum(-b)}`;
  return linear==='x'?`x^${n}`:linear==='-x'?(n%2===0?`x^${n}`:`-x^${n}`):`(${linear})^${n}`;
}
function polynomialPowerForm(p0:Poly):string|null{
  const p=trim(p0), degree=p.length-1;
  if(degree<4)return null;
  const dp:Poly=[]; for(let i=1;i<p.length;i++)dp.push(p[i]*i);
  const g=pgcd(p,dp);
  if(g.length<=1||g.length>=p.length)return null;
  const first=pdivmod(p,g); if(!first||first.r.some(v=>Math.abs(v)>1e-6))return null;
  const base=trim(first.q);
  if(base.length<=1)return null;
  let remaining=p.slice(), power=0;
  while(remaining.length>=base.length&&power<12){
    const dm=pdivmod(remaining,base); if(!dm||dm.r.some(v=>Math.abs(v)>1e-6))break;
    remaining=trim(dm.q); power++;
  }
  if(power<2||remaining.length!==1||Math.abs(remaining[0]-1)>1e-6)return null;
  const baseText=fpoly(base);
  return `(${baseText})^${power}`;
}
function ratString(r0:Rat):string{
  const r=rreduce(r0),n=fpoly(r.num);
  const d=repeatedPower(r.den)||polynomialPowerForm(r.den)||fpoly(r.den);
  if(d==='1')return n;
  const wrap=(text:string)=>/\s[+-]\s/.test(text)||/^-.+\s[+-]\s/.test(text)?`(${text})`:text;
  return `${wrap(n)}/${d.startsWith('(')&&/\^\d+$/.test(d)?d:wrap(d)}`;
}

export function canonicalDerivativeString(node: DNode): string {
  const simple=simplifyNode(node);
  const r=toRat(simple);
  return r?ratString(r):serializeNode(simple);
}

function derivativeString(n:DNode):string{return canonicalDerivativeString(differentiateNode(n,[]));}

function flattenAdd(node:DNode, sign=1, out:{node:DNode;sign:number}[]=[]):{node:DNode;sign:number}[]{
  if(node.kind==='bin'&&node.op==='+'){flattenAdd(node.left,sign,out);flattenAdd(node.right,sign,out);return out;}
  if(node.kind==='bin'&&node.op==='-'){flattenAdd(node.left,sign,out);flattenAdd(node.right,-sign,out);return out;}
  if(node.kind==='neg'){flattenAdd(node.value,-sign,out);return out;}
  out.push({node,sign});return out;
}

function buildSteps(root:DNode, final:string):DerivativeLessonStep[]{
  const steps:DerivativeLessonStep[]=[];
  if(root.kind==='bin'&&root.op==='/'){
    const u=serializeNode(root.left),v=serializeNode(root.right),du=derivativeString(root.left),dv=derivativeString(root.right);
    const raw=`((${du})*(${v})-(${u})*(${dv}))/((${v})^2)`;
    steps.push({rule:'Identifier le quotient',formula:'f(x)=\\frac{u(x)}{v(x)}',application:'On appelle u le numérateur et v le dénominateur.',lines:[`u(x)=${u}`,`v(x)=${v}`]});
    steps.push({rule:"Calculer u'(x) et v'(x)",formula:"u'(x)\\;et\\;v'(x)",application:'On dérive séparément le numérateur et le dénominateur.',lines:[`u'(x)=${du}`,`v'(x)=${dv}`]});
    steps.push({rule:'Appliquer la formule du quotient',formula:"\\left(\\frac{u}{v}\\right)'=\\frac{u'v-uv'}{v^2}",application:'On remplace chaque élément par sa valeur.',lines:[`f'(x)=${raw}`]});
    steps.push({rule:'Développer, réduire et simplifier',formula:'',application:'On développe seulement ce qui est nécessaire puis on regroupe les termes semblables.',lines:[`f'(x)=${final}`],before:raw,after:final});
    return steps;
  }
  if(root.kind==='bin'&&root.op==='*'){
    const u=serializeNode(root.left),v=serializeNode(root.right),du=derivativeString(root.left),dv=derivativeString(root.right);
    const raw=`(${du})*(${v})+(${u})*(${dv})`;
    return [
      {rule:'Identifier le produit',formula:'f(x)=u(x)v(x)',application:'On sépare les deux facteurs.',lines:[`u(x)=${u}`,`v(x)=${v}`]},
      {rule:"Calculer u'(x) et v'(x)",formula:"u'(x)\\;et\\;v'(x)",application:'On dérive chaque facteur.',lines:[`u'(x)=${du}`,`v'(x)=${dv}`]},
      {rule:'Appliquer la formule du produit',formula:"(uv)'=u'v+uv'",application:'On remplace dans la formule.',lines:[`f'(x)=${raw}`]},
      {rule:'Simplifier',formula:'',application:'On réduit l’expression finale.',lines:[`f'(x)=${final}`],before:raw,after:final}
    ];
  }
  if(root.kind==='func'){
    const u=serializeNode(root.arg),du=derivativeString(root.arg);
    const formulas:Record<string,string>={sin:"(\\sin u)'=u'\\cos u",cos:"(\\cos u)'=-u'\\sin u",tan:"(\\tan u)'=\\frac{u'}{\\cos^2u}",exp:"(e^u)'=u'e^u",log:"(\\ln u)'=\\frac{u'}{u}",sqrt:"(\\sqrt{u})'=\\frac{u'}{2\\sqrt{u}}",abs:"(|u|)'=u'\\frac{u}{|u|}\\;(u\\ne0)"};
    return [
      {rule:'Identifier la fonction composée',formula:'f(x)=F(u(x))',application:'On repère la fonction extérieure et la fonction intérieure.',lines:[`u(x)=${u}`]},
      {rule:"Calculer u'(x)",formula:"u'(x)",application:'On dérive la fonction intérieure.',lines:[`u'(x)=${du}`]},
      {rule:'Appliquer la règle de dérivation',formula:formulas[root.name]||'',application:'On applique la formule puis on remplace u et u\'.',lines:[`f'(x)=${final}`]}
    ];
  }
  if(root.kind==='bin'&&root.op==='^'&&!dependsOnX(root.right)){
    const u=serializeNode(root.left),n=serializeNode(root.right),du=derivativeString(root.left);
    return [
      {rule:'Identifier la puissance',formula:'f(x)=u(x)^n',application:'On repère la base u(x) et l’exposant constant n.',lines:[`u(x)=${u}`,`n=${n}`]},
      {rule:"Calculer u'(x)",formula:"u'(x)",application:'On dérive la base.',lines:[`u'(x)=${du}`]},
      {rule:'Appliquer la règle de puissance',formula:"(u^n)'=nu^{n-1}u'",application:'On remplace puis on simplifie.',lines:[`f'(x)=${final}`]}
    ];
  }
  const terms=flattenAdd(root);
  if(terms.length>1){
    const lines=terms.map(({node,sign})=>{
      const original=serializeNode(node),d=derivativeString(node);
      return `${sign<0?'-':''}(${original})'=${sign<0?'-':''}(${d})`;
    });
    return [
      {rule:'Dériver terme par terme',formula:"(u+v)'=u'+v'\\quad;\\quad(u-v)'=u'-v'",application:'On applique à chaque terme la règle qui lui correspond.',lines},
      {rule:'Réduire les termes',formula:'',application:'On regroupe les termes semblables et on simplifie.',lines:[`f'(x)=${final}`]}
    ];
  }
  return [{rule:'Appliquer la règle adaptée',formula:'',application:'On dérive l’expression puis on simplifie la réponse.',lines:[`f'(x)=${final}`]}];
}

function normalizeExactSubexpression(node:DNode):DNode{
  const text=canonicalDerivativeString(simplifyNode(node));
  try{return parseDerivativeExpression(text);}catch{return simplifyNode(node);}
}

function secondDerivativeNode(root:DNode,warnings:string[]):DNode{
  const du=normalizeExactSubexpression(differentiateNode(root,warnings));
  if(root.kind==='func' && root.name!=='abs'){
    const u=root.arg;
    const u1=normalizeExactSubexpression(differentiateNode(u,warnings));
    const u2=normalizeExactSubexpression(differentiateNode(u1,warnings));
    let candidate:DNode|null=null;
    switch(root.name){
      case 'exp':
        candidate=bin('*',bin('+',u2,bin('^',u1,num(2))),fn('exp',u)); break;
      case 'log':
        candidate=bin('/',bin('-',bin('*',u2,u),bin('^',u1,num(2))),bin('^',u,num(2))); break;
      case 'sqrt': {
        // (sqrt u)'' = [2u u'' - (u')²] / [4u sqrt(u)]
        const numerator=normalizeExactSubexpression(bin('-',bin('*',num(2),bin('*',u,u2)),bin('^',u1,num(2))));
        candidate=bin('/',numerator,bin('*',num(4),bin('*',u,fn('sqrt',u))));
        break;
      }
      case 'sin':
        candidate=bin('-',bin('*',u2,fn('cos',u)),bin('*',bin('^',u1,num(2)),fn('sin',u))); break;
      case 'cos':
        candidate=neg(bin('+',bin('*',u2,fn('sin',u)),bin('*',bin('^',u1,num(2)),fn('cos',u)))); break;
      case 'tan':
        candidate=bin('+',bin('/',u2,bin('^',fn('cos',u),num(2))),bin('/',bin('*',num(2),bin('*',bin('^',u1,num(2)),fn('sin',u))),bin('^',fn('cos',u),num(3)))); break;
    }
    if(candidate) return normalizeExactSubexpression(candidate);
  }
  return normalizeExactSubexpression(differentiateNode(du,warnings));
}

export function deriveWithBacEngine(input:string):DerivativeEngineResult{
  const warnings:string[]=[];
  try{
    const root=parseDerivativeExpression(input);
    const d=simplifyNode(differentiateNode(root,warnings));
    const dString=canonicalDerivativeString(d);
    const secondWarnings:string[]=[];
    const specializedD2=secondDerivativeNode(root,secondWarnings);
    const genericD2=normalizeExactSubexpression(differentiateNode(parseDerivativeExpression(dString),secondWarnings));
    const specializedText=canonicalDerivativeString(specializedD2);
    const genericText=canonicalDerivativeString(genericD2);
    const score=(text:string)=>text.length + 3*((text.match(/[+*/^]/g)||[]).length) + 2*((text.match(/(?:sin|cos|tan|exp|log|sqrt)/g)||[]).length);
    const d2String=score(genericText)<score(specializedText)?genericText:specializedText;
    warnings.push(...secondWarnings.filter(w=>!warnings.includes(w)));
    return{expression:serializeNode(root),derivative:dString,secondDerivative:d2String,steps:buildSteps(root,dString),warnings,supported:true};
  }catch(err){
    return{expression:cleanInput(input),derivative:'Non calculable',secondDerivative:'Non calculable',steps:[],warnings:[err instanceof Error?err.message:'Expression non prise en charge'],supported:false};
  }
}

export function evaluateDerivativeAst(node:DNode,x:number):number{
  switch(node.kind){
    case'num':return node.value;
    case'sym':if(node.name==='x')return x;if(node.name==='pi')return Math.PI;if(node.name==='e')return Math.E;throw new Error(`Constante ${node.name} sans valeur`);
    case'neg':return-evaluateDerivativeAst(node.value,x);
    case'bin':{const a=evaluateDerivativeAst(node.left,x),b=evaluateDerivativeAst(node.right,x);if(node.op==='+')return a+b;if(node.op==='-')return a-b;if(node.op==='*')return a*b;if(node.op==='/')return a/b;return Math.pow(a,b);}
    case'func':{const u=evaluateDerivativeAst(node.arg,x);if(node.name==='sin')return Math.sin(u);if(node.name==='cos')return Math.cos(u);if(node.name==='tan')return Math.tan(u);if(node.name==='exp')return Math.exp(u);if(node.name==='log')return Math.log(u);if(node.name==='sqrt')return Math.sqrt(u);return Math.abs(u);}
  }
}
