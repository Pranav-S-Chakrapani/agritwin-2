/// <reference types="vite/client" />
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database, ref, onValue, off, set, update, push, serverTimestamp, DatabaseReference } from 'firebase/database';

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

export const FIREBASE_CONFIG = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  FIREBASE_CONFIG.databaseURL &&
  FIREBASE_CONFIG.apiKey &&
  !FIREBASE_CONFIG.databaseURL.includes('your-app')
);

let firebaseApp: FirebaseApp | null = null;
let realtimeDb: Database | null = null;

export function getFirebaseAppInstance(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  if (!firebaseApp) {
    try {
      firebaseApp = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
    } catch (err) {
      console.warn('[FIREBASE INIT WARNING]', err);
      return null;
    }
  }
  return firebaseApp;
}

export function getFirebaseRealtimeDb(): Database | null {
  if (!isFirebaseConfigured) return null;
  if (!realtimeDb) {
    const app = getFirebaseAppInstance();
    if (app) {
      try {
        realtimeDb = getDatabase(app, FIREBASE_CONFIG.databaseURL);
      } catch (err) {
        console.warn('[FIREBASE RTDB WARNING]', err);
        return null;
      }
    }
  }
  return realtimeDb;
}

export type FirebaseConnectionStatus = 'Connected' | 'Disconnected' | 'Reconnecting' | 'Not Configured';

export {
  ref,
  onValue,
  off,
  set,
  update,
  push,
  serverTimestamp,
};
export type { DatabaseReference };
