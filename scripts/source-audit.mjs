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
const androidInstrumentedTest = fs.readFileSync('android/app/src/androidTest/java/mg/mathsbac/madagascar/ExampleInstrumentedTest.java', 'utf8');
const appSource = fs.readFileSync('src/App.tsx', 'utf8');
const graphSource = fs.readFileSync('src/components/InteractiveGraph.tsx', 'utf8');
const localAnnalesSource = fs.readFileSync('src/lib/localAnnales.ts', 'utf8');
const learningStoreSource = fs.readFileSync('src/lib/learningStore.ts', 'utf8');
const progressSource = fs.readFileSync('src/components/BacProgressDashboard.tsx', 'utf8');
const tutorSource = fs.readFileSync('src/components/BacTutor.tsx', 'utf8');
const mathSolutionSource = fs.readFileSync('src/components/MathSolutionWork.tsx', 'utf8');
const resultCardSource = fs.readFileSync('src/components/ResultCard.tsx', 'utf8');
const cssSource = fs.readFileSync('src/index.css', 'utf8');
const tutorCoachSource = fs.readFileSync('src/lib/tutorCoach.ts', 'utf8');
const statementResolutionSource = fs.readFileSync('src/lib/statementResolutionEngine.ts', 'utf8');
const advancedStatementResolutionSource = fs.readFileSync('src/lib/advancedStatementResolution.ts', 'utf8');
const calculatorEngineSource = fs.readFileSync('src/lib/calculatorEngine.ts', 'utf8');
const matrixSource = fs.readFileSync('src/lib/matrix.ts', 'utf8');
const probabilitySource = fs.readFileSync('src/lib/probabilityEngine.ts', 'utf8');
const complexSource = fs.readFileSync('src/lib/complex.ts', 'utf8');
const bacSubjectsSource = fs.readFileSync('src/data/bacSubjects.ts', 'utf8');
const bacScopeSource = fs.readFileSync('src/data/bacMadagascarScope.ts', 'utf8');
const arithmeticSource = fs.readFileSync('src/lib/arithmeticEngine.ts', 'utf8');
const odeSource = fs.readFileSync('src/lib/differentialEquationEngine.ts', 'utf8');
const conicSource = fs.readFileSync('src/lib/conicEngine.ts', 'utf8');
const probabilityCalcSource = fs.readFileSync('src/components/ProbabilityCalc.tsx', 'utf8');
const financialSource = fs.readFileSync('src/lib/financialMathEngine.ts', 'utf8');
const learningCatalogSource = fs.readFileSync('src/data/learningCatalog.ts', 'utf8');
const detailedLessonsSource = fs.readFileSync('src/data/detailedLessons.ts', 'utf8');
const learningCoachSource = fs.readFileSync('src/components/LearningCoach.tsx', 'utf8');
const workflow = fs.readFileSync('.github/workflows/android-v7-release.yml', 'utf8');
assertSource(packageJson.version === '7.0.0', 'package.json doit annoncer la version 7.0.0');
assertSource(protection.includes("APP_VERSION = '7.0.0'"), 'APP_VERSION doit annoncer 7.0.0');
assertSource(serviceWorker.includes('maths-bac-madagascar-v7-0-0'), 'le cache PWA doit être versionné 7.0.0');
assertSource(serviceWorker.includes('analysis\\.worker-'), 'le Web Worker d’analyse doit être ajouté au cache hors ligne');
assertSource(serviceWorker.includes('Object.keys(buildManifest).forEach(addManifestEntry)') && serviceWorker.includes("file.endsWith('.woff2')"), 'le préchargement PWA doit inclure tous les chunks applicatifs et éviter les formats de police redondants');
assertSource(!/from\s+['"]mathjs['"]/.test(mathNotation), 'le rendu des formules ne doit pas charger MathJS');
assertSource(mathNotation.includes('splitMathWorkLines') && mathNotation.includes('\\\\binom') && mathNotation.includes('\\\\left\\\\{'), 'la notation scolaire doit gérer étapes, combinaisons et ensembles');
assertSource(mathSolutionSource.includes('solution-math-line') && tutorSource.includes('MathSolutionWork'), 'le tuteur doit rendre les calculs ligne par ligne');
assertSource(resultCardSource.includes('MathSolutionWork'), 'les calculatrices doivent utiliser le même rendu lisible');
assertSource(cssSource.includes('.solution-step-card') && cssSource.includes('.solution-final') && cssSource.includes('.solution-math-answer'), 'le style des corrections détaillées doit rester disponible');
assertSource(packageJson.scripts?.['test:notation'] && packageJson.scripts?.['test:full']?.includes('npm run test:notation'), 'le rendu mathématique doit être testé dans test:full');
assertSource(!html.includes('user-scalable=no'), 'le zoom utilisateur ne doit pas être bloqué');
assertSource(manifest.orientation === 'any', 'le manifeste doit autoriser portrait et paysage');
assertSource(manifest.icons.every(icon => icon.type === 'image/png' && icon.purpose === 'any'), 'les icônes doivent être déclarées en PNG sans faux masque');
assertSource(packageJson.dependencies?.['@capacitor/core'] === '8.5.2' && packageJson.dependencies?.['@capacitor/android'] === '8.5.2' && packageJson.dependencies?.['@capacitor/app'] === '8.1.1' && packageJson.devDependencies?.['@capacitor/cli'] === '8.5.2', 'Capacitor Android et le gestionnaire du bouton Retour doivent rester verrouillés');
assertSource(packageJson.devDependencies?.vite === '8.3.2', 'Vite doit rester sur la version 8 validée pour le bundling des Web Workers');
assertSource(packageJson.devDependencies?.['@vitejs/plugin-react'] === '6.1.1', 'le plugin React doit rester compatible avec Vite 8');
assertSource(packageJson.devDependencies?.['@tailwindcss/vite'] === '4.3.3' && packageJson.devDependencies?.tailwindcss === '4.3.3', 'Tailwind et son plugin Vite doivent rester alignés et compatibles Vite 8');
assertSource(packageJson.overrides?.xcode?.uuid === '11.1.1', 'la dépendance uuid de xcode doit utiliser la version corrigée compatible CommonJS');
assertSource(packageJson.engines?.node === '>=22.12.0', 'Node.js 22.12 ou ultérieur doit être exigé pour Vite et Capacitor');
assertSource(capacitorConfig.includes("appId: 'mg.mathsbac.madagascar'") && capacitorConfig.includes("webDir: 'dist'"), 'la configuration Capacitor doit conserver son identifiant et son répertoire web');
assertSource(androidVariables.includes('minSdkVersion = 24') && androidVariables.includes('compileSdkVersion = 36') && androidVariables.includes('targetSdkVersion = 36'), 'Android doit cibler API 36 avec un minimum API 24');
assertSource(androidBuild.includes('versionCode 700') && androidBuild.includes('versionName "7.0.0"') && androidBuild.includes('MATHS_BAC_KEYSTORE_PATH'), 'la version Android et la signature de publication doivent être configurées');
assertSource(androidBuild.includes('minifyEnabled false') && androidBuild.includes('shrinkResources false'), 'la release Android doit conserver R8 désactivé tant que la stabilité Capacitor 8 n’est pas validée sur appareils réels');
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
assertSource(progressSource.includes('progression globale') && !progressSource.includes('réussite globale') && progressSource.includes('mastered/totalQuestions'), 'l’indicateur global doit mesurer la progression sur l’ensemble du corpus');
assertSource(tutorSource.includes('Je n’ai pas compris cette étape') && tutorSource.includes('M’entraîner sur une question similaire') && tutorSource.includes('TutorExplanationLevel'), 'le tuteur doit proposer une aide progressive et un entraînement similaire');
assertSource(tutorCoachSource.includes("TutorExplanationLevel = 'simple' | 'detail' | 'bac'") && tutorCoachSource.includes('getTutorPractice') && tutorCoachSource.includes('getTutorStepSupport'), 'le moteur pédagogique doit conserver ses trois niveaux d’explication et ses exercices de transfert');
assertSource(packageJson.scripts?.['test:tutor'] && packageJson.scripts?.['test:full']?.includes('npm run test:tutor'), 'les régressions du tuteur doivent faire partie de la validation complète');
assertSource(tutorSource.includes('Correction construite avec ton énoncé') && tutorSource.includes('revealedResolutionSteps') && tutorSource.includes('solveStatementExactly'), 'le tuteur doit afficher progressivement la résolution calculée depuis l’énoncé réel');
assertSource(statementResolutionSource.includes("'inequality'") && statementResolutionSource.includes("'limit'") && statementResolutionSource.includes("'complex'") && statementResolutionSource.includes("'ode'") && statementResolutionSource.includes("'conic'") && statementResolutionSource.includes('solveAdvancedStatement') && statementResolutionSource.includes('solveStatementExactly'), 'le moteur d’énoncé réel doit conserver les familles BAC avancées');
assertSource(advancedStatementResolutionSource.includes('solveInequalityVerified') && advancedStatementResolutionSource.includes('exactLimitAtInfinity') && advancedStatementResolutionSource.includes('normalRangeProbability') && advancedStatementResolutionSource.includes('solveQuadraticComplex') && advancedStatementResolutionSource.includes('solveSecondOrderHomogeneous') && advancedStatementResolutionSource.includes('analyzeEllipse'), 'le solveur avancé doit couvrir inéquations, limites, lois continues, complexes, EDO et coniques');
assertSource(packageJson.scripts?.['test:statement'] && packageJson.scripts?.['test:full']?.includes('npm run test:statement'), 'les tests des résolutions d’énoncés doivent faire partie de la validation complète');
assertSource(packageJson.scripts?.['test:lessons'] && packageJson.scripts?.['test:full']?.includes('npm run test:lessons'), 'les leçons détaillées doivent avoir une régression dédiée dans test:full');
assertSource(detailedLessonsSource.includes('DETAILED_LESSONS') && detailedLessonsSource.includes("Finance:[") && learningCoachSource.includes('detailedLessonFor') && learningCoachSource.includes('Exemple guidé'), 'le coach doit afficher les leçons détaillées et leurs exemples guidés');
assertSource(learningCoachSource.includes("['A','C','D','L','OSE','S'] as BacSeries[]"), 'le premier choix de série doit proposer A C D L OSE S');
assertSource(calculatorEngineSource.includes('convertAngleFunctionsDegrees') && calculatorEngineSource.includes('asin') && calculatorEngineSource.includes('atan'), 'la calculatrice scientifique doit gérer les fonctions trigonométriques réciproques en degrés');
assertSource(matrixSource.includes('solveLinearSystem') && matrixSource.includes('solveCramer') && matrixSource.includes('mRref') && matrixSource.includes('mPower'), 'la calculatrice matricielle doit conserver systèmes, Cramer, RREF et puissances');
assertSource(probabilitySource.includes('binomialRangeProbability') && probabilitySource.includes('inverseNormalCdf') && probabilitySource.includes('linearRegression') && probabilitySource.includes('uniformRangeProbability') && probabilitySource.includes('exponentialRangeProbability'), 'probabilités/statistiques doivent conserver binomiale, normale, uniforme, exponentielle et régression');
assertSource(complexSource.includes('cRoots') && complexSource.includes('cFromPolar'), 'la calculatrice complexe doit conserver racines n-ièmes et conversion polaire');
assertSource(packageJson.scripts?.['test:advanced-calculators'] && packageJson.scripts?.['test:full']?.includes('npm run test:advanced-calculators'), 'les calculatrices avancées doivent faire partie de la validation complète');
assertSource(bacSubjectsSource.includes("BacSeries = 'A' | 'C' | 'D' | 'L' | 'OSE' | 'S'"), 'les séries A C D L OSE S doivent faire partie du modèle BAC');
assertSource(bacScopeSource.includes("schoolYear: '2024-2025'") && bacScopeSource.includes("finance:{A:'extra',C:'extra',D:'extra',L:'extra',OSE:'core',S:'extra'}") && bacScopeSource.includes("matrix:{A:'extra',C:'extra',D:'useful',L:'useful',OSE:'useful',S:'core'}") && bacScopeSource.includes('continuous-laws-s'), 'le périmètre 2024-2025 doit distinguer A C D L OSE S et leurs outils propres');
assertSource(arithmeticSource.includes('extendedGcd') && arithmeticSource.includes('solveLinearCongruence') && arithmeticSource.includes('solveLinearDiophantine'), 'l’arithmétique BAC C/S doit inclure Bézout, congruences et diophantiennes');
assertSource(odeSource.includes('solveFirstOrderHomogeneous') && odeSource.includes('solveSecondOrderHomogeneous'), 'les équations différentielles BAC C/S doivent être couvertes');
assertSource(conicSource.includes('analyzeEllipse') && conicSource.includes('analyzeHyperbola') && conicSource.includes('analyzeParabola') && conicSource.includes('conicTangent'), 'les coniques de Terminale C doivent être couvertes');
assertSource(probabilitySource.includes('mayerRegression') && probabilityCalcSource.includes("series==='A'||series==='L'") && probabilityCalcSource.includes("series==='OSE'") && probabilityCalcSource.includes("id:'continuous' as Mode"), 'les statistiques A/L, D/OSE et les lois continues S doivent être distinguées');
assertSource(financialSource.includes('simpleInterest') && financialSource.includes('compoundFutureValue') && financialSource.includes('annuityPresentValue'), 'les mathématiques financières OSE doivent inclure intérêts, actualisation et annuités');
assertSource(learningCatalogSource.includes("topic: 'Finance'") && learningCatalogSource.includes("series: ['OSE']"), 'le coach OSE doit contenir un chapitre Finance');
assertSource(tutorSource.includes('Résolution complète · vérifiée') && tutorSource.includes('Méthode guidée seulement'), 'le tuteur doit distinguer une résolution complète d’un simple guidage');
assertSource(packageJson.scripts?.['test:bac-madagascar'] && packageJson.scripts?.['test:full']?.includes('npm run test:bac-madagascar'), 'le périmètre BAC Madagascar doit être testé dans test:full');

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
