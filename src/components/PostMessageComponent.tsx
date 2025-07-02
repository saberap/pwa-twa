"use client";

import { useEffect, useState, useCallback } from 'react';

interface PostMessageComponentProps {
  isInTWA: boolean;
}

interface TWAMessageEvent {
  type: string;
  data: any;
  timestamp: number;
  origin?: string;
}

const PostMessageComponent: React.FC<PostMessageComponentProps> = ({ isInTWA }) => {
  const [messages, setMessages] = useState<TWAMessageEvent[]>([]);
  const [messageInput, setMessageInput] = useState('Hello');
  const [messageType, setMessageType] = useState('greeting');
  const [customData, setCustomData] = useState('{}');
  const [targetOrigin, setTargetOrigin] = useState('*');
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});

  // Parse query parameters on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const params: Record<string, string> = {};
      
      urlParams.forEach((value, key) => {
        params[key] = value;
      });
      
      setQueryParams(params);
    }
  }, []);

  // Handle incoming messages from TWA
  const handleMessage = useCallback((event: MessageEvent<any>) => {
    console.log('Received message:', event);
    
    // Add origin validation for security in production
    if (event.origin !== window.location.origin && targetOrigin !== '*') {
      console.warn('Message from unauthorized origin:', event.origin);
      return;
    }

    const newMessage: TWAMessageEvent = {
      type: 'received',
      data: event.data,
      timestamp: Date.now(),
      origin: event.origin
    };

    setMessages(prev => [...prev, newMessage]);
  }, [targetOrigin]);

  useEffect(() => {
    // Listen for messages from parent (TWA)
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  // Send message to TWA parent
  const sendMessage = () => {
    try {
      let dataToSend;
      
      if (messageType === 'custom') {
        try {
          dataToSend = JSON.parse(customData);
        } catch (error) {
          alert('Invalid JSON format in custom data');
          return;
        }
      } else {
        dataToSend = {
          type: messageType,
          message: messageInput,
          timestamp: Date.now(),
          source: 'nextjs-app'
        };
      }

      // Send to parent window (TWA)
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(dataToSend, targetOrigin);
      }
      
      // Also try Android interface if available
      if (typeof (window as any).Android !== 'undefined') {
        (window as any).Android.receiveMessage(JSON.stringify(dataToSend));
      }      // Log the sent message
      const sentMessage: TWAMessageEvent = {
        type: 'sent',
        data: dataToSend,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, sentMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message: ' + error);
    }
  };

  // Send predefined hello message
  const sendHelloMessage = () => {    const helloData = {
      type: 'greeting',
      message: 'Hello from Next.js!',
      timestamp: Date.now(),
      source: 'nextjs-app',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    };

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(helloData, '*');
    }

    if (typeof (window as any).Android !== 'undefined') {
      (window as any).Android.receiveMessage(JSON.stringify(helloData));
    }    const sentMessage: TWAMessageEvent = {
      type: 'sent',
      data: helloData,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, sentMessage]);
  };

  // Clear message history
  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={sendHelloMessage}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Send Hello Message
          </button>
          <button
            onClick={clearMessages}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Clear Messages
          </button>
        </div>
      </div>

      {/* Custom Message Sender */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Send Custom Message
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message Type
            </label>
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="greeting">Greeting</option>
              <option value="data">Data</option>
              <option value="action">Action</option>
              <option value="notification">Notification</option>
              <option value="custom">Custom JSON</option>
            </select>
          </div>

          {messageType !== 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message Content
              </label>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your message..."
              />
            </div>
          )}

          {messageType === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom JSON Data
              </label>
              <textarea
                value={customData}
                onChange={(e) => setCustomData(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white h-24"
                placeholder='{"key": "value", "message": "Hello TWA"}'
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Origin (for security)
            </label>
            <input
              type="text"
              value={targetOrigin}
              onChange={(e) => setTargetOrigin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="* (any origin) or specific origin"
            />
          </div>

          <button
            onClick={sendMessage}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Send Message to TWA
          </button>
        </div>
      </div>

      {/* Message History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Message History
        </h2>
        
        {messages.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No messages yet. Try sending a message to see it here.
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  msg.type === 'sent'
                    ? 'bg-blue-50 border-blue-400 dark:bg-blue-900/20'
                    : 'bg-green-50 border-green-400 dark:bg-green-900/20'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`font-medium text-sm ${
                    msg.type === 'sent' ? 'text-blue-800 dark:text-blue-300' : 'text-green-800 dark:text-green-300'
                  }`}>
                    {msg.type === 'sent' ? '📤 Sent' : '📥 Received'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {msg.origin && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Origin: {msg.origin}
                  </div>
                )}
                <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                  {JSON.stringify(msg.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TWA Detection Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Environment Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong className="text-gray-700 dark:text-gray-300">TWA Context:</strong>
            <span className={`ml-2 ${isInTWA ? 'text-green-600' : 'text-red-600'}`}>
              {isInTWA ? 'Detected' : 'Not Detected'}
            </span>
          </div>
          <div>
            <strong className="text-gray-700 dark:text-gray-300">User Agent:</strong>
            <span className="ml-2 text-gray-600 dark:text-gray-400 break-all">
              {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A (SSR)'}
            </span>
          </div>
          <div>
            <strong className="text-gray-700 dark:text-gray-300">Is iframe:</strong>
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              {typeof window !== 'undefined' && window !== window.parent ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <strong className="text-gray-700 dark:text-gray-300">Android Interface:</strong>
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              {typeof (window as any).Android !== 'undefined' ? 'Available' : 'Not Available'}
            </span>
          </div>
        </div>
      </div>

      {/* URL Query Parameters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          URL Query Parameters
        </h2>
        
        {Object.keys(queryParams).length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No query parameters found in the current URL.
            <br />
            <span className="text-sm">
              Try adding parameters to the URL: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">?param1=value1&param2=value2</code>
            </span>
          </p>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Current URL: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded break-all">
                {typeof window !== 'undefined' ? window.location.href : 'N/A (SSR)'}
              </code>
            </div>
            
            <div className="grid gap-3">
              {Object.entries(queryParams).map(([key, value]) => (
                <div 
                  key={key}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                          {key}
                        </span>
                        <span className="text-gray-400">:</span>
                        <span className="text-gray-700 dark:text-gray-300 break-all">
                          {value}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigator.clipboard?.writeText(`${key}=${value}`)}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      title="Copy parameter"
                    >
                      📋
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2 text-sm">
                JSON Format:
              </h4>
              <pre className="text-xs text-blue-800 dark:text-blue-300 bg-white dark:bg-gray-800 p-2 rounded overflow-x-auto">
                {JSON.stringify(queryParams, null, 2)}
              </pre>
              <button
                onClick={() => navigator.clipboard?.writeText(JSON.stringify(queryParams, null, 2))}
                className="mt-2 text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Copy JSON
              </button>
            </div>

            <div className="mt-4">
              <button
                onClick={() => {
                  // Send query parameters as a message
                  const queryMessage = {
                    type: 'query_params',
                    data: {
                      queryParams,
                      url: window.location.href,
                      timestamp: Date.now()
                    },
                    timestamp: Date.now(),
                    source: 'nextjs-app'
                  };

                  // Send to parent window (TWA)
                  if (window.parent && window.parent !== window) {
                    window.parent.postMessage(queryMessage, '*');
                  }
                  
                  // Also try Android interface if available
                  if (typeof (window as any).Android !== 'undefined') {
                    (window as any).Android.receiveMessage(JSON.stringify(queryMessage));
                  }

                  // Log the sent message
                  const sentMessage: TWAMessageEvent = {
                    type: 'sent',
                    data: queryMessage,
                    timestamp: Date.now()
                  };

                  setMessages(prev => [...prev, sentMessage]);
                }}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                📤 Send Query Parameters to TWA
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostMessageComponent;
