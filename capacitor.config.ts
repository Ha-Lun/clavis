import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clavis.app',
  appName: 'Clavis',
  webDir: 'public',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://clavis.lundstromslogiska.se',
    cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#0a0a0f',
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
    },
  },
};

export default config;
