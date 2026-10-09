const superscripts:Record<string,string>={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-','⁺':'+','ˣ':'x','ⁿ':'n'};
const unary='sqrt|cbrt|ln|log10|log|exp|sin|cos|tan|asin|acos|atan|abs';
// A function without parentheses consumes one atom and its exponent. A compound
// argument still needs parentheses; the preview makes this choice visible.
function closeArguments(s:string):string {
 const token=new RegExp('('+unary+')(?=\\s|[\\d(]|[xyzne]|pi)','g');
 return s.replace(token,(_full:string,name:string,offset:number)=>{
  let at=offset+name.length;while(/\s/.test(s[at]??'')&&at<s.length)at++;
  return s[at]==='('?name:name+'@';
 }).replace(new RegExp('('+unary+')@\\s*([+-]?(?:\\d+(?:\\.\\d+)?|pi|[xyzne])(?:\\s*\\^\\s*(?:\\([^()]+\\)|[+-]?\\d+|[xyzne]))?)','g'),'$1($2)');
}
export function normalize(input:string):string {
 if(!input.trim())throw new Error('Écris une expression avant de lancer le calcul.');
 if(input.length>600)throw new Error('Traite une question à la fois, avec une expression de moins de 600 caractères.');
 let s=input.trim().replace(/−|–/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/π/g,'pi')
  .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ˣⁿ]+/g,part=>'^('+[...part].map(c=>superscripts[c]).join('')+')')
  .replace(/(\d),(\d)/g,'$1.$2').replace(/\b(\d+(?:\.\d*)?)[eE]([+-]?\d+)\b/g,'($1*10^($2))')
  .replace(/√\s*/g,'sqrt ').replace(/∛\s*/g,'cbrt ')
  .replace(/\b(?:racine\s+de|racine)\s*/gi,'sqrt ').replace(/\b(?:arcsin|arccos|arctan)\b/g,v=>v.replace('arc','a'));
 s=closeArguments(s).replace(/\bln\b/g,'log');
 s=s.replace(/[A-Za-z]+/g,word=>/^(?:pi[xyznteui]+|[xyznteui]+pi|[xyznteui]{2,})$/.test(word)?word.replace(/pi/g,'π').split('').map(c=>c==='π'?'pi':c).join('*'):word);
 // |…| is accepted for a non-nested absolute value, including 2|x|.
 s=s.replace(/\|([^|]+)\|/g,'abs($1)');
 return s;
}
export function withoutFunctionLabel(input:string):string {
 return input.replace(/^\s*[fgh]\s*\(\s*x\s*\)\s*=\s*/i,'');
}
