import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
const { chromium } = await import(process.env.AUDIT_PLAYWRIGHT_MODULE || 'playwright');
const root=path.resolve('dist'),out=path.resolve(process.env.UI_AUDIT_OUTPUT||'.ui-test');
fs.mkdirSync(out,{recursive:true});
let blockedFile=null;
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const filePath=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 const file=fs.existsSync(filePath)&&fs.statSync(filePath).isDirectory()?path.join(filePath,'index.html'):filePath;
 if(blockedFile&&file.includes(blockedFile)){res.writeHead(503);res.end('Interruption simulée');return;}
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port,base=`http://127.0.0.1:${port}`;
const browser=await chromium.launch({headless:true,...(process.env.AUDIT_CHROMIUM_PATH?{executablePath:process.env.AUDIT_CHROMIUM_PATH}:{}),args:process.env.AUDIT_BROWSER_ARGS?JSON.parse(process.env.AUDIT_BROWSER_ARGS):[]});
const results=[],errors=[];
const check=(label,detail={})=>{results.push({label,...detail});console.log('OK',label);};
async function fresh(page,route,host=base){
 await page.goto(`${host}/?test=${Date.now()}#${route}`,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>!document.body.innerText.includes('Préparation du module sur ton téléphone.'),null,{timeout:20000});
}
const routes=['home','profile','solve','subjects','tools',...['calculator','search','algebra','sequence','probability','geometry','complex','arithmetic','matrix','finance','ode','conics','ineqxy','compare','parametric'].map(x=>'tools/'+x)];
try {
 for(const config of (process.env.UI_WORKFLOWS_ONLY?[]:[{name:'mobile-320-light',width:320,height:640,theme:'light'},{name:'mobile-390-dark',width:390,height:844,theme:'dark'},{name:'desktop-1280-light',width:1280,height:900,theme:'light'},{name:'mobile-320-xlarge',width:320,height:640,theme:'light',scale:'xlarge'}])){
  const context=await browser.newContext({viewport:{width:config.width,height:config.height}});
  await context.addInitScript(config=>{localStorage.setItem('mathsolver_theme',config.theme);if(config.scale)localStorage.setItem('mathbac_student_profile_v62',JSON.stringify({accessibility:{textScale:config.scale}}));},config);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(`${config.name}: ${e.message}`));
  for(const route of routes){
   await fresh(page,route);
   const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,fallback:!!document.querySelector('.error-fallback'),mathErrors:document.querySelectorAll('.katex-error').length,headings:document.querySelectorAll('h1,h2,h3').length}));
   assert.equal(state.overflow,false,`${config.name} / ${route}: débordement`);assert.equal(state.fallback,false,`${route}: écran d’erreur`);assert.equal(state.mathErrors,0,`${route}: notation invalide`);assert.ok(state.headings>0,`${route}: écran vide`);
   check(`${config.name} / ${route}`);
  }
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
 for(const [tool,label] of [['geometry','x₁'],['probability','Données (séparées par virgules)'],['matrix','Matrice A (format : 1,2;3,4)'],['complex','z₁ ='],['conics','a ='],['ode','a =']]){
  await fresh(page,'tools/'+tool);const input=page.getByLabel(label,{exact:true});
  await input.click();await page.keyboard.press('ControlOrMeta+A');await page.keyboard.type('12',{delay:30});
  assert.equal(await input.inputValue(),'12',tool+': caractères perdus');assert.equal(await input.evaluate(el=>el===document.activeElement),true,tool+': focus perdu');check('B12 : saisie '+tool);
 }
 for(const theme of ['dark','light']){
  await fresh(page,'tools/geometry');await page.evaluate(theme=>document.body.classList.toggle('light',theme==='light'),theme);
  await page.getByRole('button',{name:'Calculer',exact:true}).click();await page.locator('.tool-result-label').waitFor();
  const ratio=await page.locator('.tool-result-label').evaluate(el=>{
   const rgba=s=>(s.match(/[\d.]+/g)||[]).map(Number);
   const layers=[];for(let node=el;node;node=node.parentElement)layers.push(rgba(getComputedStyle(node).backgroundColor));
   let bg=[255,255,255];for(const layer of layers.reverse()){const alpha=layer[3]??1;bg=bg.map((c,i)=>(layer[i]||0)*alpha+c*(1-alpha));}
   const fg=rgba(getComputedStyle(el).color);
   const lum=rgb=>rgb.slice(0,3).map(v=>v/255).reduce((sum,v,i)=>sum+[.2126,.7152,.0722][i]*(v<=.04045?v/12.92:((v+.055)/1.055)**2.4),0);
   return (Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05);
  });
  assert.ok(ratio>=4.5,`${theme}: contraste ${ratio}`);check('B16 : contraste '+theme,{ratio});
  await page.getByLabel('x₂',{exact:true}).fill('6');assert.equal(await page.locator('.tool-result-label').count(),0,'B13: résultat périmé');
  await page.getByRole('button',{name:'Calculer',exact:true}).click();assert.ok((await page.locator('.math-answer').first().innerText()).includes('7.2111'));check('B13 : nouveau calcul '+theme);
  await page.waitForTimeout(350);await page.screenshot({path:path.join(out,`geometry-${theme}.png`),fullPage:true});
 }
 // Verify semantic MathML, so a valid-looking superscript cannot contain the next term.
 await fresh(page,'solve');await page.getByRole('button',{name:/Vérifier mes étapes/}).click();
 const inputs=page.locator('input');await inputs.nth(0).fill('x^2+1');await inputs.nth(1).fill('x^2+1');
 await page.waitForFunction(()=>document.querySelector('.math-preview-expression msup'));
 assert.equal(await page.locator('.math-preview-expression msup').first().evaluate(el=>el.children[1].textContent),'2');check('B20 : exposant MathML');
 await inputs.nth(0).fill('x²=0');await inputs.nth(1).fill('x=0');await page.getByRole('button',{name:'Vérifier mon étape',exact:true}).click();
 await page.getByText('Étape vérifiée',{exact:true}).waitFor();check('B11 : vérification dans le tuteur');
 // Persist each previously rejected school series through an actual create/reload path.
 for(const series of ['L','OSE','S']){
  await fresh(page,'subjects');await page.getByRole('button',{name:'Série '+series,exact:true}).click();await page.getByRole('tab',{name:'Mes sujets',exact:true}).click();await page.getByRole('button',{name:'Ajouter / importer une annale',exact:true}).click();
  await page.locator('#local-title').fill('Audit '+series);await page.locator('#local-prompt').fill('Calculer 2+2');await page.getByRole('button',{name:'Enregistrer hors ligne',exact:true}).click();await page.getByText('Annale ajoutée hors ligne.',{exact:true}).waitFor();
  await fresh(page,'subjects');await page.getByRole('button',{name:'Série '+series,exact:true}).click();await page.getByRole('tab',{name:'Mes sujets',exact:true}).click();await page.getByText('Audit '+series,{exact:true}).waitFor();check('B14 : annale '+series);
 }
 await fresh(page,'solve');await page.getByRole('button',{name:/Comprendre un énoncé/}).click();
 const statement='Résoudre (x-1)^2/(x-10)>=0. '+ 'Justifier les valeurs interdites et chaque changement de signe. '.repeat(4);
 await page.locator('#tutor-statement').fill(statement);await page.getByRole('button',{name:'Comprendre la demande',exact:true}).click();
 await page.getByRole('button',{name:'Accueil',exact:true}).click();await page.getByRole('button',{name:/^Continuer/}).click();
 assert.equal(await page.locator('#tutor-statement').inputValue(),statement);await page.getByText('Énoncé décomposé',{exact:true}).waitFor();check('B15 : énoncé complet de plus de 180 caractères restauré');
 const exactStatement='Résoudre (x-1)^2/(x-10)>=0.';
 await page.locator('#tutor-statement').fill(exactStatement);await page.getByRole('button',{name:'Comprendre la demande',exact:true}).click();
 await page.getByRole('button',{name:'Voir toute la méthode',exact:true}).click();await page.getByRole('button',{name:'Voir la réponse finale',exact:true}).click();
 await page.getByRole('button',{name:'Accueil',exact:true}).click();await page.getByRole('button',{name:/^Continuer/}).click();
 assert.equal(await page.locator('#tutor-statement').inputValue(),exactStatement);await page.getByText('Correction construite avec ton énoncé',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Voir la réponse finale',exact:true}).count(),0);check('B15 : énoncé et progression restaurés');
 await fresh(page,'subjects');await page.getByRole('button',{name:'Série A',exact:true}).click();await page.getByRole('button',{name:'Simulation chronométrée',exact:true}).first().click();await page.getByRole('button',{name:'Commencer la simulation',exact:true}).click();
 await page.locator('input').first().fill('12345');await page.getByRole('button',{name:'Quitter',exact:true}).click();
 await page.getByRole('button',{name:'Simulation chronométrée',exact:true}).first().click();await page.getByRole('button',{name:/^Reprendre la simulation/}).click();assert.equal(await page.locator('input').first().inputValue(),'12345');check('B19 : sauvegarde avant sortie immédiate');
 await page.locator('input').first().fill('67890');await fresh(page,'home');await fresh(page,'subjects');await page.getByRole('button',{name:'Série A',exact:true}).click();await page.getByRole('button',{name:'Simulation chronométrée',exact:true}).first().click();await page.getByRole('button',{name:/^Reprendre la simulation/}).click();assert.equal(await page.locator('input').first().inputValue(),'67890');check('B19 : sauvegarde avant navigation');
 await fresh(page,'profile');await page.getByRole('tab',{name:'Réglages',exact:true}).click();await page.getByLabel('Taille du texte',{exact:true}).selectOption('normal');
 const sizes=()=>page.evaluate(()=>['.page-title','.btn','.brand-title'].map(s=>parseFloat(getComputedStyle(document.querySelector(s)).fontSize)));
 const normal=await sizes();await page.getByLabel('Taille du texte',{exact:true}).selectOption('xlarge');const large=await sizes();assert.ok(large.every((n,i)=>n>=normal[i]*1.24));check('B17 : titres, boutons et marque agrandis',{normal,large});
 await context.close();
 // The interrupted install must never activate a partial cache. Then retry and use a lazy tool offline.
 const calculator=fs.readdirSync(path.join(root,'assets')).find(name=>/^Calculator-.*\.js$/.test(name));assert.ok(calculator);
 const pwaContext=await browser.newContext({viewport:{width:390,height:844}}),pwa=await pwaContext.newPage();pwa.on('pageerror',e=>errors.push('PWA: '+e.message));
 const pwaBase=`http://app.localhost:${port}`;blockedFile=calculator;
 await fresh(pwa,'home',pwaBase);await pwa.getByText(/Le téléchargement pour utiliser tous les outils hors connexion est incomplet/).waitFor({timeout:20000});
 assert.equal(await pwa.evaluate(()=>!!navigator.serviceWorker.controller),false);assert.equal(await pwa.evaluate(async()=>{const keys=await caches.keys();return keys.some(key=>key==='maths-bac-madagascar-v1-0-2');}),false);
 check('B18 : installation partielle refusée');blockedFile=null;await pwa.getByRole('button',{name:'Réessayer',exact:true}).click();
 await pwa.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:30000});await pwa.waitForLoadState('networkidle');
 await pwaContext.setOffline(true);await fresh(pwa,'tools/calculator',pwaBase);await pwa.getByRole('heading',{name:'Calculatrice scientifique',exact:true}).waitFor();assert.equal(await pwa.locator('.error-fallback').count(),0);check('B18 : reprise et outil hors connexion');
 await pwaContext.close();assert.deepEqual(errors,[],'Erreurs JavaScript');
} finally {
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,errors},null,2));await browser.close();await new Promise(resolve=>server.close(resolve));
}
console.log(`Interface regression: ${results.length} contrôles validés.`);
