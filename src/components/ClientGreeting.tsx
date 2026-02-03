'use client';

import { useState, useEffect } from 'react';

export function ClientGreeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good morning');
    else if (hour >= 12 && hour < 17) setGreeting('Good afternoon');
    else if (hour >= 17 && hour < 21) setGreeting('Good evening');
    else setGreeting('Good night');
  }, []);

  if (!greeting) return null;

  return (
    <h1 className="text-2xl font-bold text-text-primary mb-1">
      {greeting}, {name}!
    </h1>
  );
}
