import React, { useEffect, useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, off } from 'firebase/database';

export const FirebaseDebugPage: React.FC = () => {
  const [status, setStatus] = useState<'Connecting...' | 'Connected — live' | 'Connection failed'>('Connecting...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState<number>(0);
  const [rawData, setRawData] = useState<any>(null);

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  useEffect(() => {
    let databaseRef: any = null;

    try {
      if (!firebaseConfig.databaseURL) {
        setStatus('Connection failed');
        setErrorMessage('Missing VITE_FIREBASE_DATABASE_URL in environment variables (.env)');
        return;
      }

      // Initialize Firebase App if not already initialized
      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      const db = getDatabase(app, firebaseConfig.databaseURL);
      databaseRef = ref(db, '/');

      setStatus('Connecting...');

      const unsubscribe = onValue(
        databaseRef,
        (snapshot) => {
          const val = snapshot.val();
          setRawData(val);
          setStatus('Connected — live');
          setErrorMessage(null);
          setLastUpdated(new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString());
          setUpdateCount((c) => c + 1);
        },
        (error) => {
          console.error('[FirebaseDebug] Error listening to root:', error);
          setStatus('Connection failed');
          setErrorMessage(`${error.name}: ${error.message} (code: ${(error as any).code || 'unknown'})`);
        }
      );

      return () => {
        if (databaseRef) {
          off(databaseRef);
        }
      };
    } catch (err: any) {
      console.error('[FirebaseDebug] Initialization error:', err);
      setStatus('Connection failed');
      setErrorMessage(err?.message || String(err));
    }
  }, []);

  return (
    <div style={{ padding: '24px', fontFamily: 'monospace', maxWidth: '1200px', margin: '0 auto', background: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px', color: '#ffffff' }}>
        Firebase Realtime Database Live Debugger
      </h1>

      {/* Connection Status Box */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          background:
            status === 'Connected — live'
              ? 'rgba(22, 163, 74, 0.2)'
              : status === 'Connecting...'
              ? 'rgba(217, 119, 6, 0.2)'
              : 'rgba(220, 38, 38, 0.2)',
          border:
            status === 'Connected — live'
              ? '1px solid #16a34a'
              : status === 'Connecting...'
              ? '1px solid #d97706'
              : '1px solid #dc2626',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 'bold' }}>
          <span>Status:</span>
          <span
            style={{
              color:
                status === 'Connected — live'
                  ? '#4ade80'
                  : status === 'Connecting...'
                  ? '#fbbf24'
                  : '#f87171',
            }}
          >
            {status}
          </span>
        </div>

        {errorMessage && (
          <div style={{ marginTop: '8px', color: '#fca5a5', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
            <strong>Error Details:</strong> {errorMessage}
          </div>
        )}
      </div>

      {/* Target Info */}
      <div style={{ background: '#1e293b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', lineHeight: '1.6' }}>
        <div><strong>Database URL:</strong> {firebaseConfig.databaseURL || '(not set)'}</div>
        <div><strong>Project ID:</strong> {firebaseConfig.projectId || '(not set)'}</div>
        <div><strong>Listening Path:</strong> / (root tree)</div>
        <div><strong>Live Updates Received:</strong> {updateCount}</div>
        <div><strong>Last Updated:</strong> {lastUpdated || 'Waiting for first snapshot...'}</div>
      </div>

      {/* Raw JSON Dump */}
      <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#94a3b8' }}>
          Raw Firebase JSON Tree (snapshot.val()):
        </h2>
        <pre
          style={{
            background: '#090d16',
            padding: '16px',
            borderRadius: '6px',
            overflowX: 'auto',
            maxHeight: '600px',
            fontSize: '12px',
            color: '#38bdf8',
            lineHeight: '1.4',
            border: '1px solid #334155',
          }}
        >
          {rawData !== null ? JSON.stringify(rawData, null, 2) : 'No data loaded yet (null / empty / connecting)...'}
        </pre>
      </div>
    </div>
  );
};

export default FirebaseDebugPage;
