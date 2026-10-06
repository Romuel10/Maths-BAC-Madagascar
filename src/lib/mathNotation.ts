const SUPER_TO_NORMAL: Record<string, string> = {
 '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
 '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
 '⁻': '-', '⁺': '+'
};

const SUB_TO_NORMAL: Record<string, string> = {
 '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
 '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9'
};

function normalizeSuperscripts(input: string): string {
 return input.replace(/([A-Za-z0-9)πe])([⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+)/g, (_, base: string, sup: string) => {
  const value = [...sup].map(ch => SUPER_TO_NORMAL[ch] ?? ch).join('');
  return `${base}^(${value})`;
 });
}

function normalizeSubscripts(input: string): string {
 return input.replace(/([A-Za-z])([₀₁₂₃₄₅₆₇₈₉]+)/g, (_, base: string, sub: string) => {
  const value = [...sub].map(ch => SUB_TO_NORMAL[ch] ?? ch).join('');
  return `${base}_${value}`;
 });
}

export function normalizeMathInput(input: string): string {
 let s = input.trim();
 // Preserve school combinatorics C(n,k) before converting decimal commas.
 s = s.replace(/\bC\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/g, 'C($1;$2)');
 s = s.replace(/\*\*/g, '^');
 s = s.replace(/[−–—]/g, '-');
 s = s.replace(/[×·]/g, '*');
 s = s.replace(/÷/g, '/');
 s = s.replace(/√\s*\(/g, 'sqrt(');
 s = s.replace(/\bln\s*\(/gi, 'log(');
 s = s.replace(/\bπ\b/g, 'pi');
 s = s.replace(/(\d),(\d)/g, '$1.$2');
 s = normalizeSuperscripts(s);
 s = normalizeSubscripts(s);
 return s;
}

function texRelation(op: string): string {
 switch (op) {
  case '!=':
  case '≠': return '\\ne';
  case '<=':
  case '≤': return '\\le';
  case '>=':
  case '≥': return '\\ge';
  case '≈': return '\\approx';
  case '→': return '\\to';
  case '∈': return '\\in';
  default: return op;
 }
}

function escapeTexText(text: string): string {
 return text
  .replace(/\\/g, '\\textbackslash{}')
  .replace(/([{}#$%&_])/g, '\\$1');
}

// Balanced groups preserve exactly the operand of a root or a power.
function groupEnd(input: string, start: number): number {
 let depth = 0;
 for (let i = start; i < input.length; i++) {
  if (input[i] === '(') depth++;
  if (input[i] === ')' && --depth === 0) return i;
 }
 return -1;
}

function powersAndRoots(input: string, depth = 0): string {
 if (depth > 30) return input;
 let out = '';
 for (let i = 0; i < input.length;) {
  const root = /^(?:sqrt|√)\s*\(/.exec(input.slice(i));
  if (root) {
   const start = i + root[0].lastIndexOf('(');
   const end = groupEnd(input, start);
   if (end >= 0) {
    out += `\\sqrt{${powersAndRoots(input.slice(start + 1, end), depth + 1)}}`;
    i = end + 1;
    continue;
   }
  }
  if (input[i] === '^') {
   let start = i + 1;
   while (input[start] === ' ') start++;
   let end = start;
   let exponent = '';
   if (input[start] === '(') {
    end = groupEnd(input, start);
    if (end >= 0) exponent = input.slice(start + 1, end++);
   } else {
    const atom = /^[+-]?(?:\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|[A-Za-z]+(?:_\d+)?)/.exec(input.slice(start));
    if (atom) {
     exponent = atom[0]; end = start + atom[0].length;
     if (/^[+-]?[A-Za-z]+$/.test(exponent) && input[end] === '(') {
      const close = groupEnd(input,end);
      if (close >= 0) { exponent += input.slice(end,close+1); end = close+1; }
     }
    }
   }
   if (exponent) {
    // Exponentiation associates to the right: x^2^3 means x^(2^3).
    if (input[end] === '^') {
     const tail = powersAndRoots(input.slice(end), depth + 1);
     const match = /^\^\{/.exec(tail);
     if (match) {
      let level = 0, k = 1;
      for (; k < tail.length; k++) {
       if (tail[k] === '{') level++;
       if (tail[k] === '}' && --level === 0) break;
      }
      out += `^{${powersAndRoots(exponent, depth + 1)}${tail.slice(0, k + 1)}}${tail.slice(k + 1)}`;
      return out;
     }
    }
    out += `^{${powersAndRoots(exponent, depth + 1)}}`;
    i = end;
    continue;
   }
  }
  out += input[i++];
 }
 return out;
}

function balancedEnd(input:string,start:number,open:string,close:string):number {
 let depth=0;
 for(let i=start;i<input.length;i++) {
  if(input[i]===open)depth++;
  if(input[i]===close&&--depth===0)return i+1;
 }
 return start;
}

function atomEnd(input:string,start:number):number {
 let i=start;
 const previous=input.slice(0,start).trimEnd().slice(-1);
 if((input[i]==='-'||input[i]==='+')&&(!previous||/[(/+*=-]/.test(previous)))i++;
 if(input[i]==='(')i=balancedEnd(input,i,'(',')');
 else if(input[i]==='\\') {
  const command=/^\\([A-Za-z]+)/.exec(input.slice(i));
  if(!command)return start;
  i+=command[0].length;
  const groups=command[1]==='frac'?2:command[1]==='sqrt'?1:0;
  for(let n=0;n<groups;n++){if(input[i]!=='{')return start;i=balancedEnd(input,i,'{','}');}
 } else {
  const atom=/^(?:\d+(?:\.\d*)?|[A-Za-z][A-Za-z0-9_.']*)/.exec(input.slice(i));
  if(!atom)return start;
  i+=atom[0].length;
 }
 if(i<=start)return start;
 if(input[i]==='(')i=balancedEnd(input,i,'(',')');
 while(input.slice(i,i+2)==='^{')i=balancedEnd(input,i+1,'{','}');
 return i;
}

function fractions(input:string):string {
 let result=input;
 for(let count=0,search=0;count<100;count++) {
  const slash=result.indexOf('/',search);if(slash<0)break;
  let leftStart=-1,leftEnd=-1;
  for(let i=0;i<slash;) {
   const end=atomEnd(result,i);
   if(end>i){leftStart=i;leftEnd=end;i=end;}else i++;
  }
  let rightStart=slash+1;while(result[rightStart]===' ')rightStart++;
  const rightEnd=atomEnd(result,rightStart);
  if(leftStart<0||result.slice(leftEnd,slash).trim()||rightEnd<=rightStart){search=slash+1;continue;}
  const strip=(value:string)=>value.startsWith('(')&&balancedEnd(value,0,'(',')')===value.length?value.slice(1,-1):value;
  const value=`\\frac{${strip(result.slice(leftStart,leftEnd))}}{${strip(result.slice(rightStart,rightEnd))}}`;
  result=result.slice(0,leftStart)+value+result.slice(rightEnd);
  search=leftStart+value.length;
 }
 return result;
}

function fallbackLatex(input: string): string {
 const sets = input.trim().replace(/^\{([^{}]*)\}$/g,'\\left\\{$1\\right\\}').replace(/\bS\s*=\s*\{([^{}]*)\}/g,'S=\\left\\{$1\\right\\}');
 let s = powersAndRoots(sets.replace(/\b(\d+(?:\.\d*)?)[eE]([+-]?\d+)\b/g,'$1*10^($2)'));
 if (!s) return '';

 // Common school notation that is not parsed by mathjs.
 s = s
  .replace(/ℝ/g, '\\mathbb{R}')
  .replace(/ℂ/g, '\\mathbb{C}')
  .replace(/ℕ/g, '\\mathbb{N}')
  .replace(/ℤ/g, '\\mathbb{Z}')
  .replace(/∞/g, '\\infty')
  .replace(/Δ/g, '\\Delta')
  .replace(/ℓ/g, '\\ell')
  .replace(/μ/g, '\\mu')
  .replace(/σ/g, '\\sigma')
  .replace(/θ/g, '\\theta')
  .replace(/±/g, '\\pm')
  .replace(/≠/g, '\\ne')
  .replace(/≤/g, '\\le')
  .replace(/≥/g, '\\ge')
  .replace(/≈/g, '\\approx')
  .replace(/→/g, '\\to')
  .replace(/×/g, '\\times ')
  .replace(/·/g, '\\cdot ')
  .replace(/\*/g, '\\cdot ')
  .replace(/\bpi\b/gi, '\\pi')
  .replace(/−/g, '-');

 // School derivative notation. MathJS interprets apostrophes as Hermitian
 // transpose. Convert ALL school primes before MathJS sees them, including
 // primes after parentheses such as (u/v)' and (u^n)'.
 s = s
  .replace(/([A-Za-z]|\))\s*(?:''|′′|″)/g, '$1^{\\prime\\prime}')
  .replace(/([A-Za-z]|\))\s*(?:'|′)/g, '$1^{\\prime}');

 // sqrt(...) / √(...) fallback.
 s = s.replace(/√\s*([A-Za-z0-9]+)/g, '\\sqrt{$1}');

 // Keep each complete operand together, including roots and powers.
 s = fractions(s);

 // School sets, binomial coefficients and indexed sequences.
 s = s
  .replace(/^\{([^{}]*)\}$/g, '\\left\\{$1\\right\\}')
  .replace(/\bS\s*=\s*\{([^{}]*)\}/g, 'S=\\left\\{$1\\right\\}')
  .replace(/\bC\s*\(\s*([^,;()]+)\s*[,;]\s*([^()]+)\s*\)/g, '\\binom{$1}{$2}')
  .replace(/\bPGCD\s*\(/gi, '\\operatorname{PGCD}(')
  .replace(/\bPPCM\s*\(/gi, '\\operatorname{PPCM}(')
  .replace(/([A-Za-z])_\(([^()]*)\)/g, '$1_{$2}');

 // French interval notation commonly used in Malagasy BAC papers.
 s = s
  .replace(/\]\s*([^;\[\]]+)\s*;\s*([^;\[\]]+)\s*\[/g, '\\left]$1;$2\\right[')
  .replace(/\[\s*([^;\[\]]+)\s*;\s*([^;\[\]]+)\s*\]/g, '\\left[$1;$2\\right]')
  .replace(/\[\s*([^;\[\]]+)\s*;\s*([^;\[\]]+)\s*\[/g, '\\left[$1;$2\\right[')
  .replace(/\]\s*([^;\[\]]+)\s*;\s*([^;\[\]]+)\s*\]/g, '\\left]$1;$2\\right]');

 // Function names.
 s = s
  .replace(/\blog\s*\(/g, '\\ln(')
  .replace(/\bexp\s*\(([^()]*)\)/g, 'e^{$1}')
  .replace(/\b(sin|cos|tan)\s*\(/g, '\\$1(');

 return s;
}

function parsePartToLatex(part: string): string {
 const trimmed = part.trim();
 if (!trimmed) return '';

 // Explicit TeX can be passed for domains or special notation.
 if (/\\(?:frac|sqrt|mathbb|infty|Delta|ell|mu|sigma|theta|int|sum|lim|left|right)/.test(trimmed)) {
  return trimmed;
 }

 // L'affichage scolaire reste volontairement léger : l'ancien parseur MathJS
 // ajoutait plusieurs centaines de kilo-octets au simple affichage d'une page.
 // Le moteur complet reste chargé uniquement lorsqu'un calcul est demandé.
 return fallbackLatex(normalizeMathInput(trimmed));
}

/**
 * Convert the app's friendly/mathjs notation into LaTeX suitable for KaTeX.
 * Supports relations and the notation students see in Malagasy BAC papers.
 */
function splitTopLevelRelations(source: string): string[] {
 const operators = ['<=', '>=', '!=', '≠', '≤', '≥', '≈', '→', '∈', '=', '<', '>'];
 const out: string[] = [];
 let current = '';
 let depth = 0;
 for (let i = 0; i < source.length; i++) {
  const ch = source[i];
  if (ch === '(' || ch === '[' || ch === '{') depth++;
  if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1);

  if (depth === 0) {
   const op = operators.find(candidate => source.startsWith(candidate, i));
   if (op) {
    out.push(current, op);
    current = '';
    i += op.length - 1;
    continue;
   }
  }
  current += ch;
 }
 out.push(current);
 return out;
}

export function mathToLatex(input: string): string {
 const source = input.trim();
 if (!source) return '';

 // Preserve only top-level relation operators. This keeps P(X=2) intact.
 const parts = splitTopLevelRelations(source);
 if (parts.length > 1) {
  return parts.map((part, index) => index % 2 === 1 ? texRelation(part) : parsePartToLatex(part)).join(' ');
 }
 return parsePartToLatex(source);
}

export function plainMathFallback(input: string): string {
 return input
  .replace(/\*\*/g, '^')
  .replace(/\^2\b/g, '²')
  .replace(/\^3\b/g, '³')
  .replace(/\*/g, '×')
  .replace(/\bpi\b/g, 'π')
  .replace(/\bsqrt\(/g, '√(')
  .replace(/\blog\(/g, 'ln(')
  .replace(/\bexp\(/g, 'e^(');
}

export function looksLikeMath(input: string): boolean {
 const s = input.trim();
 if (!s) return false;
 if (/^[-+]?\d+(?:[.,]\d+)?$/.test(s)) return true;

 // Avoid typesetting full French/English prose as a mathematical variable chain.
 if (/\s(?:et|puis|donc|avec|sans|pour|dans|par|sur|est|sont|vaut|reste|base|résultat|calcul|forme)\s/i.test(s)) return false;
 const words = s.match(/[A-Za-zÀ-ÿ]{3,}/g) || [];
 const allowedWords = new Set(['sin', 'cos', 'tan', 'sqrt', 'log', 'exp', 'PGCD', 'PPCM', 'mod', 'ANS', 'rad']);
 const proseWords = words.filter(w => !allowedWords.has(w) && !allowedWords.has(w.toLowerCase()));
 if (proseWords.length >= 2) return false;

 if (/[=^*/√∫ΣΔπ²³₀₁₂₃₄₅₆₇₈₉]|(?:sin|cos|tan|sqrt|log|ln|exp)\s*\(/i.test(s)) return true;
 if (/(?:[A-Za-z]|\))\s*(?:'{1,2}|′{1,2}|″)/.test(s)) return true;
 if (/^[A-Za-z]\s*\([^)]*\)/.test(s)) return true;
 return false;
}

export function splitMathWorkLines(input:string):string[]{
 const source=String(input??'').trim();
 if(!source)return [];
 const arrowParts:string[]=[];
 let current='';
 let depth=0;
 const push=()=>{const value=current.trim().replace(/^[→⇒⟺⇔]+\s*/,'');if(value)arrowParts.push(value);current='';};
 for(let i=0;i<source.length;i++){
  const ch=source[i];
  if(ch==='('||ch==='['||ch==='{')depth++;
  if(ch===')'||ch===']'||ch==='}')depth=Math.max(0,depth-1);
  const two=source.slice(i,i+2);
  if(depth===0&&(ch==='→'||ch==='⇒'||ch==='⟺'||ch==='⇔'||two==='=>')){
   push();if(two==='=>')i++;continue;
  }
  current+=ch;
 }
 push();

 const out:string[]=[];
 for(const part of arrowParts){
  const semi:string[]=[];
  let piece='',level=0;
  const flush=()=>{const value=piece.trim();if(value)semi.push(value);piece='';};
  for(const ch of part){
   if(ch==='('||ch==='['||ch==='{')level++;
   if(ch===')'||ch===']'||ch==='}')level=Math.max(0,level-1);
   if(ch===';'&&level===0){flush();continue;}
   piece+=ch;
  }
  flush();
  const allEquations=semi.length>1&&semi.every(value=>/[=≈≤≥<>]/.test(value));
  if(allEquations)out.push(...semi);else out.push(part);
 }
 return out.length?out:[source];
}

export function escapeAsTextLatex(text: string): string {
 return `\\text{${escapeTexText(text)}}`;
}
