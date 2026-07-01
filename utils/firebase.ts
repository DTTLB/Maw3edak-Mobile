import { Platform } from 'react-native';

let firebaseApp: any = null;
let isInitialized = false;

export function initializeFirebase() {
  if (Platform.OS === 'web') {
    console.log('Firebase not needed on web');
    return null;
  }

  if (isInitialized) {
    console.log('Firebase already initialized');
    return firebaseApp;
  }

  try {
    const firebase = require('@react-native-firebase/app').default;

    // Check if Firebase is already initialized
    if (firebase.apps.length > 0) {
      console.log('Firebase already initialized via google-services.json');
      firebaseApp = firebase.app();
      isInitialized = true;
      return firebaseApp;
    }

    // If not initialized, it means there's a problem with the setup
    console.error('❌ Firebase not auto-initialized. Check google-services.json and rebuild.');
    return null;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return null;
  }
}

export function getFirebaseApp() {
  if (!isInitialized) {
    return initializeFirebase();
  }
  return firebaseApp;
}
