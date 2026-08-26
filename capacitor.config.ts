import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mg.mathsbac.madagascar',
  appName: 'Maths BAC Madagascar',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#080b12',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
