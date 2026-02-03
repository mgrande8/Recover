'use client';

import { useState } from 'react';

type LogEntry = { time: string; message: string; type: 'info' | 'success' | 'error' };

export function PushDiagnostic() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [testSending, setTestSending] = useState(false);

  const log = (message: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { time, message, type }]);
  };

  const runDiagnostic = async () => {
    setLogs([]);
    setRunning(true);

    // Step 1: Check Capacitor
    log('Checking Capacitor bridge...');
    const cap = (window as any).Capacitor;

    if (!cap) {
      log('Capacitor bridge NOT found. Push notifications require the native app.', 'error');
      setRunning(false);
      return;
    }

    const platform = cap.getPlatform?.() || 'unknown';
    const isNative = cap.isNativePlatform?.() || false;
    log(`Platform: ${platform}, Native: ${isNative}`, isNative ? 'success' : 'error');

    if (platform !== 'ios' && platform !== 'android') {
      log('Not a native platform. Push notifications only work in the iOS/Android app.', 'error');
      setRunning(false);
      return;
    }

    // Step 2: Import plugin
    log('Loading PushNotifications plugin...');
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      log('Plugin loaded', 'success');

      // Step 3: Check permissions
      log('Checking permissions...');
      const permStatus = await PushNotifications.checkPermissions();
      log(`Permission status: ${permStatus.receive}`, permStatus.receive === 'granted' ? 'success' : 'error');

      if (permStatus.receive === 'prompt') {
        log('Requesting permission...');
        const result = await PushNotifications.requestPermissions();
        log(`Permission result: ${result.receive}`, result.receive === 'granted' ? 'success' : 'error');
        if (result.receive !== 'granted') {
          log('User denied notification permission. Enable in iPhone Settings > Recover > Notifications.', 'error');
          setRunning(false);
          return;
        }
      } else if (permStatus.receive !== 'granted') {
        log('Notifications not permitted. Enable in iPhone Settings > Recover > Notifications.', 'error');
        setRunning(false);
        return;
      }

      // Step 4: Register for push
      log('Registering with APNs...');

      // Set up one-time listeners for this diagnostic
      const registrationPromise = new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Registration timed out after 10s')), 10000);

        PushNotifications.addListener('registration', (token) => {
          clearTimeout(timeout);
          resolve(token.value);
        });

        PushNotifications.addListener('registrationError', (error) => {
          clearTimeout(timeout);
          reject(new Error(error.error));
        });
      });

      await PushNotifications.register();
      log('Register() called, waiting for APNs response...');

      const token = await registrationPromise;
      log(`APNs token received: ${token.substring(0, 20)}...`, 'success');

      // Step 5: Save token to server
      log('Saving token to server...');
      const response = await fetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, platform }),
      });

      if (response.ok) {
        log('Token saved to database!', 'success');
      } else {
        const err = await response.json();
        log(`Failed to save token: ${JSON.stringify(err)}`, 'error');
      }

      // Clean up listeners
      await PushNotifications.removeAllListeners();

    } catch (error: any) {
      log(`Error: ${error.message || error}`, 'error');
    }

    setRunning(false);
  };

  const sendTestNotification = async () => {
    setTestSending(true);
    log('Sending test notification...');

    try {
      const response = await fetch('/api/push/test', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        log(`Test result: sent=${data.sent}, failed=${data.failed}`, data.sent > 0 ? 'success' : 'error');
        if (data.sent === 0 && data.failed === 0) {
          log('No device tokens found. Run diagnostic first.', 'error');
        }
      } else {
        log(`Test failed: ${data.error}`, 'error');
      }
    } catch (error: any) {
      log(`Test error: ${error.message}`, 'error');
    }

    setTestSending(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="font-semibold text-text-primary mb-3">Push Notification Diagnostic</h3>

      <div className="flex gap-2 mb-3">
        <button
          onClick={runDiagnostic}
          disabled={running}
          className="flex-1 bg-primary text-white text-sm font-medium py-2 px-3 rounded-lg disabled:opacity-50"
        >
          {running ? 'Running...' : 'Run Diagnostic'}
        </button>
        <button
          onClick={sendTestNotification}
          disabled={testSending}
          className="flex-1 bg-success text-white text-sm font-medium py-2 px-3 rounded-lg disabled:opacity-50"
        >
          {testSending ? 'Sending...' : 'Send Test Push'}
        </button>
      </div>

      {logs.length > 0 && (
        <div className="bg-background rounded-lg p-3 max-h-64 overflow-y-auto space-y-1">
          {logs.map((entry, i) => (
            <div key={i} className="text-xs font-mono">
              <span className="text-text-muted">{entry.time}</span>{' '}
              <span
                className={
                  entry.type === 'success'
                    ? 'text-success'
                    : entry.type === 'error'
                      ? 'text-error'
                      : 'text-text-secondary'
                }
              >
                {entry.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
