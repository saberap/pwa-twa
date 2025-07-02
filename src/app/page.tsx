"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the component to avoid SSR issues
const PostMessageComponent = dynamic(
  () => import('@/components/PostMessageComponent'),
  { ssr: false }
);

export default function Home() {
  const [isInTWA, setIsInTWA] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Check if running inside a TWA or iframe
    const checkTWAEnvironment = () => {
      try {
        // Check if we're in an iframe or TWA context
        const inIframe = window !== window.parent;
        const hasAndroidInterface = typeof (window as any).Android !== 'undefined';
        const hasTWAUserAgent = /wv/.test(navigator.userAgent);
        
        setIsInTWA(inIframe || hasAndroidInterface || hasTWAUserAgent);
      } catch (error) {
        console.log('TWA detection error:', error);
        setIsInTWA(false);
      }
    };

    checkTWAEnvironment();
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading TWA PostMessage Demo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            TWA PostMessage Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Next.js app for communicating with Trusted Web Activities
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {isInTWA ? '🔗 Running in TWA Context' : '🌐 Running in Browser'}
          </div>
        </header>

        <main className="max-w-4xl mx-auto">
          <PostMessageComponent isInTWA={isInTWA} />
        </main>
      </div>
    </div>
  );
}
