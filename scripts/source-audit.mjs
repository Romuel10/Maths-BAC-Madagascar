import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const files = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(name)) files.push(p);
  }
}
walk(root);

let checks = 0;
const errors = [];
const localRe = /(?:from\s+|import\s*\()(['"])(\.{1,2}\/[^'"]+)\1/g;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = localRe.exec(text))) {
    checks++;
    const spec = m[2];
    const base = path.resolve(path.dirname(file), spec);
    const candidates = [];
    const ext = path.extname(base);
    if (ext) {
      candidates.push(base);
      if (ext === '.js') candidates.push(base.slice(0, -3) + '.ts', base.slice(0, -3) + '.tsx');
    } else {
      candidates.push(base + '.ts', base + '.tsx', base + '.js', base + '.jsx', path.join(base, 'index.ts'), path.join(base, 'index.tsx'));
    }
    if (!candidates.some(p => fs.existsSync(p))) errors.push(`${path.relative('.', file)} -> ${spec}`);
  }

  if (file.includes(`${path.sep}components${path.sep}`)) {
    checks++;
    if (/from\s+['"]mathjs['"]/.test(text)) errors.push(`${path.relative('.', file)} importe MathJS directement`);
  }
}

function assertSource(condition, label) {
  checks++;
  if (!condition) errors.push(label);
}

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const protection = fs.readFileSync('src/lib/protection.ts', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const serviceWorker = fs.readFileSync('public/sw.js', 'utf8');
const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
const mathNotation = fs.readFileSync('src/lib/mathNotation.ts', 'utf8');
const capacitorConfig = fs.readFileSync('capacitor.config.ts', 'utf8');
const androidVariables = fs.readFileSync('android/variables.gradle', 'utf8');
const androidBuild = fs.readFileSync('android/app/build.gradle', 'utf8');
const androidManifest = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
const androidInstrumentedTest = fs.readFileSync('android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java', 'utf8');
const appSource = fs.readFileSync('src/App.tsx', 'utf8');
const graphSource = fs.readFileSync('src/components/InteractiveGraph.tsx', 'utf8');
const localAnnalesSource = fs.readFileSync('src/lib/localAnnales.ts', 'utf8');
const learningStoreSource = fs.readFileSync('src/lib/learningStore.ts', 'utf8');
const progressSource = fs.readFileSync('src/components/BacProgressDashboard.tsx', 'utf8');
const workflow = fs.readFileSync('.github/workflows/android-v7-release.yml', 'utf8');
assertSource(packageJson.version === '7.0.0', 'package.json doit annoncer la version 7.0.0');
assertSource(protection.includes("APP_VERSION = '7.0.0'"), 'APP_VERSION doit annoncer 7.0.0');
assertSource(serviceWorker.includes('maths-bac-madagascar-v7-0-0'), 'le cache PWA doit être versionné 7.0.0');
assertSource(serviceWorker.includes('analysis\\.worker-'), 'le Web Worker d’analyse doit être ajouté au cache hors ligne');
assertSource(serviceWorker.includes('Object.keys(buildManifest).forEach(addManifestEntry)') && serviceWorker.includes("file.endsWith('.woff2')"), 'le préchargement PWA doit inclure tous les chunks applicatifs et éviter les formats de police redondants');
assertSource(!/from\s+['"]mathjs['"]/.test(mathNotation), 'le rendu des formules ne doit pas charger MathJS');
assertSource(!html.includes('user-scalable=no'), 'le zoom utilisateur ne doit pas être bloqué');
assertSource(manifest.orientation === 'any', 'le manifeste doit autoriser portrait et paysage');
assertSource(manifest.icons.every(icon => icon.type === 'image/png' && icon.purpose === 'any'), 'les icônes doivent être déclarées en PNG sans faux masque');
assertSource(packageJson.dependencies?.['@capacitor/core'] === '8.5.2' && packageJson.dependencies?.['@capacitor/android'] === '8.5.2' && packageJson.dependencies?.['@capacitor/app'] === '8.1.1' && packageJson.devDependencies?.['@capacitor/cli'] === '8.5.2', 'Capacitor Android et le gestionnaire du bouton Retour doivent rester verrouillés');
assertSource(packageJson.devDependencies?.vite === '7.3.6', 'Vite doit rester sur une version corrigée des vulnérabilités connues');
assertSource(packageJson.overrides?.xcode?.uuid === '11.1.1', 'la dépendance uuid de xcode doit utiliser la version corrigée compatible CommonJS');
assertSource(packageJson.engines?.node === '>=22.0.0', 'Node.js 22 ou ultérieur doit être exigé pour Capacitor 8');
assertSource(capacitorConfig.includes("appId: 'mg.mathsbac.madagascar'") && capacitorConfig.includes("webDir: 'dist'"), 'la configuration Capacitor doit conserver son identifiant et son répertoire web');
assertSource(androidVariables.includes('minSdkVersion = 24') && androidVariables.includes('compileSdkVersion = 36') && androidVariables.includes('targetSdkVersion = 36'), 'Android doit cibler API 36 avec un minimum API 24');
assertSource(androidBuild.includes('versionCode 700') && androidBuild.includes('versionName "7.0.0"') && androidBuild.includes('MATHS_BAC_KEYSTORE_PATH'), 'la version Android et la signature de publication doivent être configurées');
assertSource(androidBuild.includes('minifyEnabled true') && androidBuild.includes('shrinkResources true'), 'la release Android doit activer la réduction du code et des ressources');
assertSource(androidManifest.includes('android:usesCleartextTraffic="false"'), 'Android ne doit pas autoriser le trafic HTTP en clair');
assertSource(androidManifest.includes('android:allowBackup="false"'), 'Android ne doit pas sauvegarder automatiquement les données scolaires locales');
assertSource(androidInstrumentedTest.includes('"mg.mathsbac.madagascar"'), 'le test Android doit vérifier le vrai applicationId');
assertSource(packageJson.scripts?.start?.includes('vite preview --host 0.0.0.0') && packageJson.scripts?.['cap:sync'], 'les commandes Termux et Capacitor doivent être disponibles');
assertSource(packageJson.scripts?.['android:bundle']?.startsWith('bash '), 'le script de bundle Android doit être exécutable même sans bit Unix');
assertSource(workflow.includes('npm run test:full'), 'le workflow Android doit exécuter la validation complète avant publication');
assertSource(appSource.includes('analysisRange.xMin') && appSource.includes('setAnalysisRange({ xMin, xMax })'), 'le graphe doit conserver l’intervalle choisi par l’utilisateur');
assertSource(graphSource.includes('activeData.length === 0') && graphSource.includes('setXMin(initialXMin)'), 'le graphe doit gérer les données vides et synchroniser son intervalle');
assertSource(localAnnalesSource.includes("if(!save([normalized,...getLocalAnnales()]))throw"), 'un échec de stockage des annales doit être signalé');
assertSource(learningStoreSource.includes('function localDayKey') && !learningStoreSource.includes("toISOString().slice(0, 10)"), 'les jours d’étude doivent utiliser la date locale');
assertSource(progressSource.includes('progression globale') && !progressSource.includes('réussite globale'), 'l’indicateur global doit décrire une progression et non un taux de réussite');

for (const [name, expected] of [['icon-192.png', 192], ['icon-512.png', 512]]) {
  const icon = fs.readFileSync(path.join('public', name));
  const pngSignature = icon.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assertSource(pngSignature && icon.readUInt32BE(16) === expected && icon.readUInt32BE(20) === expected, `${name} doit être un vrai PNG ${expected} × ${expected}`);
}

const androidMasterIcon = fs.readFileSync(path.join('public', 'icon-android-master.png'));
assertSource(androidMasterIcon.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && androidMasterIcon.readUInt32BE(16) >= 1024 && androidMasterIcon.readUInt32BE(20) >= 1024, 'l’icône Android maître doit être un PNG carré haute définition');

const unsafeStorage = files.filter(file => !file.endsWith(`${path.sep}safeStorage.ts`) && /\b(?:localStorage|sessionStorage)\./.test(fs.readFileSync(file, 'utf8')));
assertSource(unsafeStorage.length === 0, `accès direct au stockage détecté : ${unsafeStorage.map(file => path.relative('.', file)).join(', ')}`);
const forbiddenFiles = ['AuthScreen.tsx', 'Badges.tsx', 'ClassroomLock.tsx', 'ExamMode.tsx', 'ExerciseMode.tsx', 'ExportButton.tsx', 'FormulaScan.tsx', 'HandwritingPad.tsx', 'Onboarding.tsx', 'SplashScreen.tsx', 'StatsPanel.tsx'];
assertSource(forbiddenFiles.every(name => !fs.existsSync(path.join('src', 'components', name))), 'des écrans hérités supprimés sont revenus');
assertSource(!files.some(file => /ADMIN_SECRET|2025MS/.test(fs.readFileSync(file, 'utf8'))), 'un secret administrateur historique est encore présent');

console.log(`Source audit: ${files.length} fichiers TS/TSX, ${checks} contrôles, ${errors.length} erreur(s)`);
for (const e of errors) console.error('FAIL', e);
if (errors.length) process.exit(1);
