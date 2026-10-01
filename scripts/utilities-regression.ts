declare const process: { exit(code?: number): never };
import { gcdBigInt,lcmBigInt,gcdLcmDetailed,primeFactorization,moduloDetailed,convertBaseDetailed,parseBaseInteger } from '../src/lib/arithmeticEngine.js';
let checks=0,failures=0;const ok=(v:boolean,l:string)=>{checks++;if(!v){failures++;console.error('FAIL',l)}};
ok(gcdBigInt(48n,36n)===12n,'gcd');ok(lcmBigInt(48n,36n)===144n,'lcm');let gl=gcdLcmDetailed(-84n,30n);ok(gl.gcd===6n&&gl.lcm===420n&&gl.checks.every(c=>c.ok),'gcd/lcm signed + checks');
let pf=primeFactorization(360n);ok(pf.factors.map(f=>`${f.factor}^${f.power}`).join('*')==='2^3*3^2*5^1','factorization 360');ok(pf.divisors.length===24&&pf.checks.every(c=>c.ok),'divisors 360');pf=primeFactorization(9973n);ok(pf.isPrime&&pf.checks.every(c=>c.ok),'prime 9973');
let mod=moduloDetailed(-17n,5n);ok(mod.quotient===-4n&&mod.remainder===3n&&mod.checks.every(c=>c.ok),'positive Euclidean remainder negative a');
let bc=convertBaseDetailed('FF',16,2);ok(bc.result==='11111111'&&bc.decimal===255n&&bc.checks.every(c=>c.ok),'base 16->2');bc=convertBaseDetailed('-101010',2,16);ok(bc.result==='-2A'&&bc.checks.every(c=>c.ok),'signed base conversion');ok(parseBaseInteger('102',2)===null,'invalid digit base');
let seed=450045;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};const ri=(a:number,b:number)=>Math.floor(rnd()*(b-a+1))+a;
for(let i=0;i<150;i++){let a=BigInt(ri(-100000,100000)),b=BigInt(ri(-100000,100000));if(a===0n&&b===0n)b=1n;const r=gcdLcmDetailed(a,b);ok(r.checks.every(c=>c.ok),`random gcd lcm ${i}`)}
for(let i=0;i<120;i++){const n=BigInt(ri(1,999999)),m=BigInt(ri(1,9999));const r=moduloDetailed(n*(i%2?-1n:1n),m);ok(r.checks.every(c=>c.ok),`random modulo ${i}`)}
for(let i=0;i<100;i++){const n=BigInt(ri(-1000000000,1000000000));const from=ri(2,16),to=ri(2,16);const text=n.toString(from).toUpperCase();const r=convertBaseDetailed(text,from,to);ok(r.decimal===n&&r.checks.every(c=>c.ok),`random base ${i}`)}
console.log(`Arithmetic utilities audit: ${checks} checks, ${failures} failure(s)`);if(failures)process.exit(1);
