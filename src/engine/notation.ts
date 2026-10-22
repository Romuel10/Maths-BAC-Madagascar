const superscripts:Record<string,string>={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-','⁺':'+','ˣ':'x','ⁿ':'n'};
const unary='sqrt|cbrt|ln|log10|log|exp|sinh|cosh|tanh|sin|cos|tan|sec|csc|cot|asin|acos|atan|abs';
export function indexedRoots(input:string):string {
 let s=input;const token=/\broot\s*\((\d+)\)\s*\(/g;let m:RegExpExecArray|null;
 while((m=token.exec(s))){
  const degree=Number(m[1]);if(degree<2||degree>10000)continue;
  let depth=1,end=token.lastIndex;for(;end<s.length&&depth;end++){if(s[end]==='(')depth++;else if(s[end]===')')depth--;}
  if(depth)continue;
  const argument=s.slice(token.lastIndex,end-1),replacement=degree===2?'sqrt('+argument+')':degree===3?'cbrt('+argument+')':'(('+argument+')^(1/'+degree+'))';
  s=s.slice(0,m.index)+replacement+s.slice(end);token.lastIndex=m.index;
 }
 return s;
}
function functionPowers(s:string):string {
 const token=new RegExp('\\b('+unary+')\\s*\\^\\s*','g');
 const atom=(at:number):{value:string;end:number}|null=>{
  while(/\s/.test(s[at]??'')&&at<s.length)at++;
  if(s[at]==='('){let depth=0;for(let i=at;i<s.length;i++){if(s[i]==='(')depth++;if(s[i]===')'&&--depth===0)return {value:s.slice(at+1,i),end:i+1};}return null;}
  const m=s.slice(at).match(/^[+-]?(?:\d+(?:\.\d+)?|pi|[xyzne])/);return m?{value:m[0],end:at+m[0].length}:null;
 };
 let m:RegExpExecArray|null;
 while((m=token.exec(s))){
  const p=atom(token.lastIndex),a=p?atom(p.end):null;if(!p||!a)continue;
  let argumentStart=p.end;while(/\s/.test(s[argumentStart]??'')&&argumentStart<s.length)argumentStart++;
  if(s[argumentStart]!=='('){let end=a.end;while(/\s/.test(s[end]??'')&&end<s.length)end++;if(s[end]==='^'){const exponent=atom(end+1);if(exponent){a.value='('+a.value+')^('+exponent.value+')';a.end=exponent.end;}}}
  const replacement='('+m[1]+'('+a.value+'))^('+p.value+')';
  s=s.slice(0,m.index)+replacement+s.slice(a.end);token.lastIndex=m.index+1;
 }
 return s;
}
// A function without parentheses consumes one atom and its exponent. A compound
// argument still needs parentheses; the preview makes this choice visible.
function closeArguments(s:string):string {
 const token=new RegExp('('+unary+')(?=\\s|[\\d(]|[xyzne]|pi)','g');
 return s.replace(token,(_full:string,name:string,offset:number)=>{
  let at=offset+name.length;while(/\s/.test(s[at]??'')&&at<s.length)at++;
  return s[at]==='('?name:name+'@';
 }).replace(new RegExp('('+unary+')@\\s*([+-]?(?:\\d+(?:\\.\\d+)?|pi|[xyzne])(?:\\s*\\^\\s*(?:\\([^()]+\\)|[+-]?\\d+|[xyzne]))?)','g'),'$1($2)');
}
export function normalize(input:string,maxLength=600):string {
 if(!input.trim())throw new Error('Écris une expression avant de lancer le calcul.');
 if(input.length>maxLength)throw new Error('Traite une question à la fois, avec une expression de moins de '+maxLength+' caractères.');
 let s=indexedRoots(input.trim()).replace(/−|–/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/π/g,'pi')
  .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ˣⁿ]+/g,part=>'^('+[...part].map(c=>superscripts[c]).join('')+')')
  .replace(/(\d),(\d)/g,'$1.$2').replace(/\b(\d+(?:\.\d*)?)[eE]([+-]?\d+)\b/g,'($1*10^($2))')
  .replace(/√\s*/g,'sqrt ').replace(/∛\s*/g,'cbrt ')
  .replace(/\b(?:racine\s+de|racine)\s*/gi,'sqrt ').replace(/\b(?:arcsin|arccos|arctan)\b/g,v=>v.replace('arc','a'));
 s=closeArguments(functionPowers(s)).replace(/\bln\b/g,'log');
 s=s.replace(/[A-Za-z]+/g,word=>/^(?:pi[xyznteui]+|[xyznteui]+pi|[xyznteui]{2,})$/.test(word)?word.replace(/pi/g,'π').split('').map(c=>c==='π'?'pi':c).join('*'):word);
 // |…| is accepted for a non-nested absolute value, including 2|x|.
 s=s.replace(/\|([^|]+)\|/g,'abs($1)');
 return s;
}
export function withoutFunctionLabel(input:string):string {
 return input.replace(/^\s*[fgh]\s*\(\s*x\s*\)\s*=\s*/i,'');
}
