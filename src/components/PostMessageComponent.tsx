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
  const [communicationPort, setCommunicationPort] = useState<MessagePort | null>(null);
  const [logs, setLogs] = useState<Array<{
    timestamp: number;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    details?: any;
  }>>([]);
  const [portConnectionStatus, setPortConnectionStatus] = useState<'disconnected' | 'waiting' | 'connected'>('disconnected');

  // Add log entry
  const addLog = (type: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) => {
    const logEntry = {
      timestamp: Date.now(),
      type,
      message,
      details
    };
    setLogs(prev => [...prev, logEntry]);
    console.log(`[TWA-${type.toUpperCase()}]`, message, details || '');
  };

  // Parse query parameters on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const params: Record<string, string> = {};
      
      urlParams.forEach((value, key) => {
        params[key] = value;
      });
      
      setQueryParams(params);
      addLog('info', 'Query parameters parsed', params);
    }
  }, []);
  // Handle incoming messages from TWA
  const handleMessage = useCallback((event: MessageEvent<any>) => {
    addLog('info', 'Received message event', {
      origin: event.origin,
      data: event.data,
      ports: event.ports?.length || 0
    });
    
    // Add origin validation for security in production
    if (event.origin !== window.location.origin && targetOrigin !== '*') {
      addLog('warning', `Message from unauthorized origin: ${event.origin}`);
      return;
    }

    // Check if this message contains ports for MessageChannel communication
    if (event.ports && event.ports.length > 0) {
      const port = event.ports[0];
      if (port) {
        addLog('success', 'MessagePort received from parent', { origin: event.origin });
        setCommunicationPort(port);
        setPortConnectionStatus('connected');
        
        // Set up port message handler
        port.onmessage = function(portEvent) {
          addLog('info', 'Message received via MessagePort', portEvent.data);
          
          const newMessage: TWAMessageEvent = {
            type: 'received',
            data: portEvent.data,
            timestamp: Date.now(),
            origin: 'MessagePort'
          };
          setMessages(prev => [...prev, newMessage]);
        };
        
        // Send initial test message to confirm connection
        port.postMessage({
          type: 'port_connected',
          message: 'MessagePort connection established from Next.js',
          timestamp: Date.now(),
          source: 'nextjs-app'
        });
        
        addLog('success', 'Sent port connection confirmation');
        return;
      }
    }

    // Handle regular postMessage
    const newMessage: TWAMessageEvent = {
      type: 'received',
      data: event.data,
      timestamp: Date.now(),
      origin: event.origin
    };

    setMessages(prev => [...prev, newMessage]);
    addLog('info', 'Regular postMessage handled', event.data);
  }, [targetOrigin]);
  useEffect(() => {
    addLog('info', 'Setting up message event listener');
    
    // Listen for messages from parent (TWA)
    window.addEventListener('message', handleMessage);
    
    // Initial port connection attempt
    setPortConnectionStatus('waiting');
    addLog('info', 'Waiting for MessagePort from parent...');
    
    return () => {
      addLog('info', 'Cleaning up message event listener');
      window.removeEventListener('message', handleMessage);
      if (communicationPort) {
        communicationPort.close();
        addLog('info', 'MessagePort closed');
      }
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
          addLog('error', 'Invalid JSON format in custom data', error);
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

      let messageSent = false;

      // Prefer MessagePort communication if available
      if (communicationPort) {
        try {
          communicationPort.postMessage(dataToSend);
          addLog('success', 'Message sent via MessagePort', dataToSend);
          messageSent = true;
        } catch (error) {
          addLog('error', 'Failed to send via MessagePort', error);
        }
      }

      // Fallback to regular postMessage
      if (!messageSent) {
        // Send to parent window (TWA)
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(dataToSend, targetOrigin);
          addLog('info', 'Message sent via window.parent.postMessage', { data: dataToSend, origin: targetOrigin });
          messageSent = true;
        }
        
        // Also try Android interface if available
        if (typeof (window as any).Android !== 'undefined') {
          (window as any).Android.receiveMessage(JSON.stringify(dataToSend));
          addLog('info', 'Message sent via Android interface', dataToSend);
          messageSent = true;
        }
      }

      if (!messageSent) {
        addLog('warning', 'No communication method available');
        alert('No communication method available (no parent window, MessagePort, or Android interface)');
        return;
      }

      // Log the sent message
      const sentMessage: TWAMessageEvent = {
        type: 'sent',
        data: dataToSend,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, sentMessage]);
      
    } catch (error) {
      addLog('error', 'Error sending message', error);
      console.error('Error sending message:', error);
      alert('Error sending message: ' + error);
    }
  };
  // Send predefined hello message
  const sendHelloMessage = () => {
    const helloData = {
      type: 'greeting',
      message: 'Hello from Next.js!',
      timestamp: Date.now(),
      source: 'nextjs-app',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    };

    let messageSent = false;

    // Prefer MessagePort communication if available
    if (communicationPort) {
      try {
        communicationPort.postMessage(helloData);
        addLog('success', 'Hello message sent via MessagePort', helloData);
        messageSent = true;
      } catch (error) {
        addLog('error', 'Failed to send hello via MessagePort', error);
      }
    }

    // Fallback to regular postMessage
    if (!messageSent) {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(helloData, '*');
        addLog('info', 'Hello message sent via window.parent.postMessage', helloData);
        messageSent = true;
      }

      if (typeof (window as any).Android !== 'undefined') {
        (window as any).Android.receiveMessage(JSON.stringify(helloData));
        addLog('info', 'Hello message sent via Android interface', helloData);
        messageSent = true;
      }
    }

    if (!messageSent) {
      addLog('warning', 'No communication method available for hello message');
    }

    const sentMessage: TWAMessageEvent = {
      type: 'sent',
      data: helloData,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, sentMessage]);
  };
  // Clear message history
  const clearMessages = () => {
    setMessages([]);
    addLog('info', 'Message history cleared');
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Test MessagePort connection
  const testPortConnection = () => {
    if (communicationPort) {
      const testData = {
        type: 'connection_test',
        message: 'Testing MessagePort connection',
        timestamp: Date.now()
      };
      
      try {
        communicationPort.postMessage(testData);
        addLog('info', 'Port connection test sent', testData);
      } catch (error) {
        addLog('error', 'Port connection test failed', error);
      }
    } else {
      addLog('warning', 'No MessagePort available for testing');
    }
  };
  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Connection Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              portConnectionStatus === 'connected' ? 'bg-green-500' : 
              portConnectionStatus === 'waiting' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium">
              MessagePort: {portConnectionStatus}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              window.parent && window.parent !== window ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium">
              Parent Window: {window.parent && window.parent !== window ? 'Available' : 'Not Available'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              typeof (window as any).Android !== 'undefined' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium">
              Android Interface: {typeof (window as any).Android !== 'undefined' ? 'Available' : 'Not Available'}
            </span>
          </div>
        </div>
        
        {communicationPort && (
          <div className="mt-4">
            <button
              onClick={testPortConnection}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Test MessagePort Connection
            </button>
          </div>
        )}
      </div>

      {/* Activity Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Activity Logs
          </h2>
          <button
            onClick={clearLogs}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Clear Logs
          </button>
        </div>
        
        {logs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No activity logs yet. Actions will appear here as they occur.
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 text-sm ${
                  log.type === 'error' ? 'bg-red-50 border-red-400 dark:bg-red-900/20' :
                  log.type === 'warning' ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20' :
                  log.type === 'success' ? 'bg-green-50 border-green-400 dark:bg-green-900/20' :
                  'bg-blue-50 border-blue-400 dark:bg-blue-900/20'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-medium text-xs uppercase tracking-wide ${
                    log.type === 'error' ? 'text-red-800 dark:text-red-300' :
                    log.type === 'warning' ? 'text-yellow-800 dark:text-yellow-300' :
                    log.type === 'success' ? 'text-green-800 dark:text-green-300' :
                    'text-blue-800 dark:text-blue-300'
                  }`}>
                    {log.type === 'error' ? '❌ ERROR' :
                     log.type === 'warning' ? '⚠️ WARNING' :
                     log.type === 'success' ? '✅ SUCCESS' : 'ℹ️ INFO'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className={`${
                  log.type === 'error' ? 'text-red-800 dark:text-red-200' :
                  log.type === 'warning' ? 'text-yellow-800 dark:text-yellow-200' :
                  log.type === 'success' ? 'text-green-800 dark:text-green-200' :
                  'text-blue-800 dark:text-blue-200'
                }`}>
                  {log.message}
                </div>
                {log.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                      Show Details
                    </summary>
                    <pre className="mt-1 text-xs bg-white dark:bg-gray-800 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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
            </div>            <div className="mt-4">
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

                  let messageSent = false;

                  // Prefer MessagePort communication if available
                  if (communicationPort) {
                    try {
                      communicationPort.postMessage(queryMessage);
                      addLog('success', 'Query parameters sent via MessagePort', queryMessage);
                      messageSent = true;
                    } catch (error) {
                      addLog('error', 'Failed to send query params via MessagePort', error);
                    }
                  }

                  // Fallback to regular postMessage
                  if (!messageSent) {
                    // Send to parent window (TWA)
                    if (window.parent && window.parent !== window) {
                      window.parent.postMessage(queryMessage, '*');
                      addLog('info', 'Query parameters sent via window.parent.postMessage', queryMessage);
                      messageSent = true;
                    }
                    
                    // Also try Android interface if available
                    if (typeof (window as any).Android !== 'undefined') {
                      (window as any).Android.receiveMessage(JSON.stringify(queryMessage));
                      addLog('info', 'Query parameters sent via Android interface', queryMessage);
                      messageSent = true;
                    }
                  }

                  if (!messageSent) {
                    addLog('warning', 'No communication method available for query parameters');
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
