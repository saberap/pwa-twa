"use client";

import { useEffect, useState } from 'react';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    setIsClient(true);
    
    // Check current notification permission status
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      
      // Check if we have a stored permission state (useful for iOS Safari)
      const storedPermission = localStorage.getItem('notificationPermission') as 'default' | 'granted' | 'denied' | null;
      
      // Use stored permission if current is 'default' but we previously had 'denied' (iOS Safari behavior)
      if (currentPermission === 'default' && storedPermission === 'denied') {
        setNotificationStatus('denied');
      } else {
        setNotificationStatus(currentPermission);
      }
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setMessage('مرورگر شما از نوتیفیکشن پشتیبانی نمی‌کند');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      
      // Store the permission state in localStorage for iOS Safari compatibility
      localStorage.setItem('notificationPermission', permission);
      
      if (permission === 'granted') {
        setMessage('خوش آمدید! حالا می‌توانیم برای شما نوتیفیکشن ارسال کنیم');
        
        // Send a welcome notification
        new Notification('خوش آمدید!', {
          body: 'نوتیفیکشن‌ها با موفقیت فعال شدند',
          icon: '/next.svg'
        });
      } else if (permission === 'denied') {
        setMessage('امیدواریم بعداً بتوانیم برای شما پیام بفرستیم');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setMessage('خطا در درخواست دسترسی نوتیفیکشن');
    }
  };

  const resetNotificationPermission = () => {
    localStorage.removeItem('notificationPermission');
    setNotificationStatus('default');
    setMessage('');
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading PostMessage Demo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            TWA PostMessage Demo
          </h1>
          <p className="text-lg text-gray-600">
            تست ارسال نوتیفیکشن و ارتباط با TWA
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            درخواست دسترسی نوتیفیکشن
          </h2>
          
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">
              وضعیت فعلی: 
              <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                notificationStatus === 'granted' 
                  ? 'bg-green-100 text-green-800' 
                  : notificationStatus === 'denied'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {notificationStatus === 'granted' && 'مجاز'}
                {notificationStatus === 'denied' && 'غیرمجاز'}
                {notificationStatus === 'default' && 'تعیین نشده'}
              </span>
            </p>
            <button
              onClick={resetNotificationPermission}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              ریست کردن وضعیت (تست)
            </button>
          </div>

          {notificationStatus !== 'granted' && (
            <div className="text-center mb-6">
              <button
                onClick={requestNotificationPermission}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md"
              >
                درخواست دسترسی نوتیفیکشن
              </button>
            </div>
          )}

          {message && (
            <div className={`p-4 rounded-lg text-center ${
              notificationStatus === 'granted' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-orange-50 text-orange-800 border border-orange-200'
            }`}>
              <p className="font-medium">{message}</p>
            </div>
          )}
        </div>

        {notificationStatus === 'granted' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              نوتیفیکشن تست
            </h3>
            <div className="text-center">
              <button
                onClick={() => {
                  new Notification('پیام تست', {
                    body: 'این یک پیام تستی است',
                    icon: '/next.svg'
                  });
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                ارسال نوتیفیکشن تست
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
