'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function CheckInTest() {
  const { user } = useAuth();
  
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="w-full">
        <h1>Test Page</h1>
        {error && <p className="text-red-500">{error}</p>}
      </div>
    </div>
  );
}
