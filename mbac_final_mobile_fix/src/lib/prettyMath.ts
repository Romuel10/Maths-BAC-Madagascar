/**
 * Token-based system for math expression input.
 * 
 * Internally we work with "tokens" — small chunks that map to both
 * a pretty display symbol and a mathjs computation string.
 * 
 * The user only ever sees the pretty side.
 */

export interface MathToken {
 display: string;  // What the user sees: √, ², π, ×, …
 mathjs: string;  // What mathjs needs: sqrt(, ^2, pi, *, …
}

// ── Predefined tokens ──────────────────────────────────────────
export const TOKENS: Record<string, MathToken> = {
 '0':   { display: '0',   mathjs: '0' },
 '1':   { display: '1',   mathjs: '1' },
 '2':   { display: '2',   mathjs: '2' },
 '3':   { display: '3',   mathjs: '3' },
 '4':   { display: '4',   mathjs: '4' },
 '5':   { display: '5',   mathjs: '5' },
 '6':   { display: '6',   mathjs: '6' },
 '7':   { display: '7',   mathjs: '7' },
 '8':   { display: '8',   mathjs: '8' },
 '9':   { display: '9',   mathjs: '9' },
 '.':   { display: '.',   mathjs: '.' },
 'x':   { display: 'x',   mathjs: 'x' },
 '+':   { display: ' + ',  mathjs: '+' },
 '-':   { display: ' − ',  mathjs: '-' },
 '*':   { display: '×',   mathjs: '*' },
 '/':   { display: '÷',   mathjs: '/' },
 '(':   { display: '(',   mathjs: '(' },
 ')':   { display: ')',   mathjs: ')' },
 '^':   { display: '^',   mathjs: '^' },
 'sq':  { display: '²',   mathjs: '^2' },
 'cb':  { display: '³',   mathjs: '^3' },
 'sqrt': { display: '√(',  mathjs: 'sqrt(' },
 'sin':  { display: 'sin(', mathjs: 'sin(' },
 'cos':  { display: 'cos(', mathjs: 'cos(' },
 'tan':  { display: 'tan(', mathjs: 'tan(' },
 'ln':  { display: 'ln(',  mathjs: 'log(' },
 'exp':  { display: 'e^(',  mathjs: 'exp(' },
 'abs':  { display: '|',   mathjs: 'abs(' },
 'absC': { display: '|',   mathjs: ')' },
 'pi':  { display: 'π',   mathjs: 'pi' },
 'e':   { display: 'e',   mathjs: 'e' },
};

// ── Convert token array → display string ──────────────────────
export function tokensToDisplay(tokens: MathToken[]): string {
 return tokens.map(t => t.display).join('');
}

// ── Convert token array → mathjs string (with implicit *) ─────
export function tokensToMathjs(tokens: MathToken[]): string {
 let result = '';
 for (let i = 0; i < tokens.length; i++) {
  const curr = tokens[i];
  const prev = i > 0 ? tokens[i - 1] : null;

  // Insert implicit multiplication
  if (prev && needsImplicitMul(prev, curr)) {
   result += '*';
  }
  result += curr.mathjs;
 }
 return result;
}

function needsImplicitMul(a: MathToken, b: MathToken): boolean {
 const aEnd = a.mathjs;
 const bStart = b.mathjs;

 // number × x : 2x → 2*x
 if (/\d$/.test(aEnd) && bStart === 'x') return true;
 // number × ( : 2( → 2*(
 if (/\d$/.test(aEnd) && bStart === '(') return true;
 // number × function : 2sin( → 2*sin(
 if (/\d$/.test(aEnd) && /^[a-zA-Z]/.test(bStart) && bStart !== 'x') return true;
 // number × pi/e
 if (/\d$/.test(aEnd) && (bStart === 'pi' || bStart === 'e')) return true;
 // x × ( : x( → x*(
 if (aEnd === 'x' && bStart === '(') return true;
 // x × function
 if (aEnd === 'x' && /^[a-zA-Z]/.test(bStart)) return true;
 // ) × ( : )( → )*(
 if (aEnd === ')' && bStart === '(') return true;
 // ) × number : )2 → )*2
 if (aEnd === ')' && /^\d/.test(bStart)) return true;
 // ) × x : )x → )*x
 if (aEnd === ')' && bStart === 'x') return true;
 // ) × function : )sin → )*sin
 if (aEnd === ')' && /^[a-zA-Z]/.test(bStart)) return true;
 // pi/e × something
 if ((aEnd === 'pi' || aEnd === 'e') && (/^\d/.test(bStart) || bStart === 'x' || bStart === '(' || /^[a-zA-Z]/.test(bStart))) return true;
 // ^2 or ^3 × something (after exponent)
 if (/\^\d$/.test(aEnd) && (bStart === 'x' || bStart === '(' || /^[a-zA-Z]/.test(bStart))) return true;

 return false;
}

// ── Convert a raw mathjs string back to pretty display ────────
export function mathjsToPretty(expr: string): string {
 let p = expr;
 p = p.replace(/sqrt\(/g, '√(');
 p = p.replace(/\*/g, '×');
 p = p.replace(/\//g, '÷');
 p = p.replace(/\bpi\b/g, 'π');
 p = p.replace(/\^2(?!\d)/g, '²');
 p = p.replace(/\^3(?!\d)/g, '³');
 p = p.replace(/\blog\(/g, 'ln(');
 p = p.replace(/\bexp\(/g, 'e^(');
 p = p.replace(/\babs\(/g, '|');
 // Clean up double spaces
 p = p.replace(/\s+/g, ' ').trim();
 return p;
}

export function formatPretty(expr: string): string {
 return mathjsToPretty(expr);
}
