import { solveStatementExactly } from '../src/lib/statementResolutionEngine.js';

function expectResolution(statement:string,kind:string,answerPart:string){
 const result=solveStatementExactly(statement);
 if(!result)throw new Error(`Aucune résolution pour : ${statement}`);
 if(result.kind!==kind)throw new Error(`Type attendu ${kind}, reçu ${result.kind}`);
 if(!result.finalAnswer.includes(answerPart))throw new Error(`Réponse inattendue : ${result.finalAnswer}`);
 if(!result.steps.length||result.steps.some(step=>!step.title||!step.work||!step.why))throw new Error(`Étapes pédagogiques incomplètes pour ${statement}`);
}

expectResolution('Résoudre x²−5x+6=0.','equation','2 ; 3');
expectResolution('Résoudre 2x+4=10.','equation','3');
expectResolution('On considère f(x)=x²−4x+3. Étudier ses variations.','function-variation','minimum vaut -1');
expectResolution('Calculer le PGCD de 84 et 30.','pgcd','6');
expectResolution("Soit f(x)=x^3+2x. Calculer f'(x).",'derivative','3x^2 + 2');
expectResolution("Calculer l'integrale de 0 à 2 de 3x^2+1 dx.",'integral','10');
expectResolution('On considère la suite u_0=1 et u_(n+1)=u_n+2. Calculer u_4.','sequence','u_4=9');
expectResolution('X suit B(5;0,4). Calculer P(X=2).','probability','0,3456');
expectResolution('1 000 000 Ar sont placés à intérêts composés au taux de 10 % pendant 2 ans. Calculer la valeur acquise.','finance','1210000 Ar');
expectResolution('Résoudre le système : x+y+z=6 ; 2x-y+z=3 ; x+2y-z=2.','linear-system','x=1');
expectResolution('Résoudre 56x ≡ 2 [15].','congruence','x ≡ 7 [15]');
expectResolution('A(0;0), B(2;1), C(-1;2). Montrer que AB et AC sont orthogonaux.','orthogonality','sont orthogonaux');

if(solveStatementExactly('Démontrer par récurrence une propriété quelconque sans formule.')!==null)throw new Error('Le moteur ne doit pas inventer une résolution non vérifiée.');

console.log('Statement resolution regression: résolutions réelles vérifiées.');
