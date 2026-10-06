export function prettyToMath(s: string): string {
 return s
  .replace(/²/g, '^2')
  .replace(/³/g, '^3')
  .replace(/×/g, '*')
  .replace(/÷/g, '/')
  .replace(/√\(/g, 'sqrt(')
  .replace(/√/g, 'sqrt')
  .replace(/π/g, 'pi')
  .replace(/−/g, '-')
  .replace(/ln\(/g, 'log(')
  .replace(/e\^\(/g, 'exp(')
  .replace(/\|([^|]+)\|/g, 'abs($1)')
  .replace(/(\d)([a-zA-Z])/g, (match,digit,letter,offset,source) => letter.toLowerCase()==='e'&&/^[+-]?\d/.test(source.slice(offset+2))?match:`${digit}*${letter}`)
  .replace(/(\d)\(/g, (match,digit,offset,source) => /log10$/.test(source.slice(0,offset+1))?match:`${digit}*(`)
  .replace(/\)\(/g, ')*(')
  .replace(/\)(\d)/g, ')*$1');
}
