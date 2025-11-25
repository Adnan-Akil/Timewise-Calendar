import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.timewise.calendar',
  appName: 'TimewiseCalendar',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['openid', 'email', 'profile'],
      serverClientId: '469614747310-img4jgcph9ckunas36b5ponac64avo0m.apps.googleusercontent.com', // Replace with your Web Client ID
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
