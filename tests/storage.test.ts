import {test} from 'node:test';
import assert from 'node:assert/strict';
import {snapshot,validateState,defaultRequest} from '../src/store';
test('sauvegarde : les six séries, le sujet complet et la session sont conservés',()=>{
 const base=snapshot();
 for(const series of ['A','C','D','L','OSE','S']){
  const s={...base,series,statement:'Énoncé de bac '.repeat(600),draft:defaultRequest('matrix'),exam:{ids:['ex-1'],answers:{'ex-1':'2'},started:Date.now(),duration:120,finished:false}};
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(s))),s);
 }
});
test('une restauration invalide est refusée avant de modifier les données',()=>{
 const base=snapshot();
 for(const patch of [{series:'B'},{size:400},{version:1},{draft:{operation:'hacked',expression:'x',params:{}}},{history:[{}]},{attempts:[{id:'x'}]},{exam:{ids:[]}}])assert.throws(()=>validateState({...base,...patch}));
 assert.equal(snapshot(),base);
});
