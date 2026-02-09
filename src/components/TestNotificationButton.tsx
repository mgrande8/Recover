'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui';

export function TestNotificationButton() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const sendTest = async () => {
    setStatus('sending');
    setMessage('');

    try {
      const response = await fetch('/api/push/test', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        if (data.sent > 0) {
          setStatus('success');
          setMessage('Notification sent! Check your phone.');
        } else {
          setStatus('error');
          setMessage('No device registered. Try reopening the app.');
        }
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to send');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error');
    }

    // Reset after 5 seconds
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 5000);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-5 h-5 text-primary" />
        <span className="text-text-primary font-medium">Test Push Notifications</span>
      </div>
      <p className="text-text-secondary text-sm mb-3">
        Send a test notification to verify push is working.
      </p>
      <Button
        onClick={sendTest}
        variant="outline"
        size="sm"
        isLoading={status === 'sending'}
        className="w-full"
      >
        {status === 'idle' && 'Send Test Notification'}
        {status === 'sending' && 'Sending...'}
        {status === 'success' && 'Sent!'}
        {status === 'error' && 'Try Again'}
      </Button>
      {message && (
        <p className={`text-xs mt-2 ${status === 'success' ? 'text-success' : 'text-error'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
