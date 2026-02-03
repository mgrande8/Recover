'use client';

import { useState, useRef } from 'react';

type LogEntry = { time: string; message: string; type: 'info' | 'success' | 'error' };

export function PushDiagnostic({ visible = true }: { visible?: boolean }) {
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

    // Step 0: Check for pending token from earlier registration
    const pendingToken = localStorage.getItem('pendingPushToken');
    if (pendingToken) {
      log(`Found pending token in localStorage: ${pendingToken.substring(0, 50)}...`, 'info');
    }

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

    // Check Capacitor bridge details
    const plugins = cap.Plugins ? Object.keys(cap.Plugins) : [];
    log(`Registered native plugins: ${plugins.length > 0 ? plugins.join(', ') : 'none detected'}`, plugins.length > 0 ? 'info' : 'error');

    // Step 2: Import plugin
    log('Loading PushNotifications plugin...');
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      log('Plugin loaded', 'success');

      // Clear ALL existing listeners first to avoid conflicts
      log('Clearing existing listeners...');
      await PushNotifications.removeAllListeners();

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
      log('Setting up listeners...');

      let listenerFired = false;

      const registrationPromise = new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!listenerFired) {
            reject(new Error('Registration timed out after 15s - native side did not respond'));
          }
        }, 15000);

        PushNotifications.addListener('registration', (token) => {
          listenerFired = true;
          clearTimeout(timeout);
          resolve(token.value);
        });

        PushNotifications.addListener('registrationError', (error) => {
          listenerFired = true;
          clearTimeout(timeout);
          reject(new Error(`APNs rejected: ${JSON.stringify(error)}`));
        });
      });

      log('Calling register()...');
      try {
        await PushNotifications.register();
        log('register() completed, waiting for native callback...', 'success');
      } catch (regError: any) {
        log(`register() threw error: ${regError.message || regError}`, 'error');
        setRunning(false);
        return;
      }

      try {
        const token = await registrationPromise;
        log(`APNs token received: ${token.substring(0, 30)}...`, 'success');
        log(`Full token length: ${token.length} chars`, 'info');

        // Step 5: Save token to server
        log('Saving token to server...');
        const response = await fetch('/api/push/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, platform }),
        });

        if (response.ok) {
          log('Token saved to database!', 'success');
          log('Push notifications are fully configured!', 'success');
        } else {
          const err = await response.json();
          log(`Server rejected token: ${JSON.stringify(err)}`, 'error');
        }
      } catch (waitError: any) {
        log(`${waitError.message}`, 'error');
        log('The native iOS app is not returning a push token.', 'error');
        log('This usually means:', 'info');
        log('1. Push Notifications capability not enabled in Xcode signing', 'info');
        log('2. App needs to be rebuilt with push entitlement', 'info');
        log('3. Try: iPhone Settings > General > VPN & Device Mgmt (if dev build)', 'info');
      }

      // Clean up
      await PushNotifications.removeAllListeners();

    } catch (error: any) {
      log(`Plugin error: ${error.message || JSON.stringify(error)}`, 'error');
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
          log('No device tokens found in database.', 'error');
        }
      } else {
        log(`Test failed: ${data.error}`, 'error');
      }
    } catch (error: any) {
      log(`Test error: ${error.message}`, 'error');
    }

    setTestSending(false);
  };

  if (!visible) return null;

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
        <div className="bg-background rounded-lg p-3 max-h-80 overflow-y-auto space-y-1">
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

export function HiddenPushDiagnostic() {
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVersionTap = () => {
    tapCount.current += 1;

    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 2000);

    if (tapCount.current >= 5) {
      setShowDiagnostic((prev) => !prev);
      tapCount.current = 0;
    }
  };

  return (
    <>
      {showDiagnostic && <PushDiagnostic visible={true} />}
      <div
        className="text-center text-text-muted text-sm cursor-default select-none"
        onClick={handleVersionTap}
      >
        <p>Recover v1.0.2</p>
        <p>Sleep better. Perform better.</p>
      </div>
    </>
  );
}
