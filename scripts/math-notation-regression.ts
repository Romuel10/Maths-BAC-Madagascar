import { mathToLatex, splitMathWorkLines } from '../src/lib/mathNotation.js';

const checks:Array<[string,boolean]> = [
 ['ensemble solution visible', mathToLatex('S={2 ; 3}').includes('\\left\\{2 ; 3\\right\\}')],
 ['coefficient binomial', mathToLatex('C(5,2)').includes('\\binom{5}{2}')],
 ['indice parenthésé', mathToLatex('u_(n+1)=2u_n').includes('u_{n+1}')],
 ['PGCD opérateur', mathToLatex('PGCD(84,30)=6').includes('\\operatorname{PGCD}')],
 ['découpage flèche', JSON.stringify(splitMathWorkLines('2x+4=10 → 2x=6 → x=3'))===JSON.stringify(['2x+4=10','2x=6','x=3'])],
 ['ne coupe pas un ensemble', splitMathWorkLines('S={2 ; 3}').length===1],
];
for(const [label,ok] of checks)if(!ok)throw new Error('Échec notation : '+label);
console.log('Math notation regression: '+checks.length+' contrôles validés.');
