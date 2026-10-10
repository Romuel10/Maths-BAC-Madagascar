import {convertAsciiMathToLatex,convertLatexToAsciiMath} from 'mathlive';
import {normalize} from './engine/notation';

// Only notation crosses this boundary; the restricted engine still parses and
// validates every calculation. No Compute Engine or remote service is needed.
export function editorExpression(latex:string):string {
 return convertLatexToAsciiMath(latex)
  .replace(/root\(3\)\(/g,'cbrt(')
  .replace(/log\s*_\s*\(10\)\s*\(/g,'log10(')
  .replace(/\s+/g,' ').trim();
}
export function editorLatex(expression:string):string {
 if(!expression.trim())return '';
 try{return convertAsciiMathToLatex(normalize(expression).replace(/\blog\b/g,'ln').replace(/\bcbrt\b/g,'∛'));}
 catch{return convertAsciiMathToLatex(expression);}
}
