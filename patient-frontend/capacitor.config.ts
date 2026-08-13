import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mednexa.careq',
  appName: 'CareQ',
  webDir: 'out',
  server: {
    cleartext: true,
    allowNavigation: ['192.168.1.9', '192.168.1.9:5000']
  }
};

export default config;
