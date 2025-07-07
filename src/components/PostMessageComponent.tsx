"use client";

import { useEffect, useState } from 'react';

const PostMessageComponent = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [port, setPort] = useState<MessagePort | null>(null);
  const [inputMessage, setInputMessage] = useState('Hello from React!');

  useEffect(() => {
    // Simple message listener based on your example
    window.addEventListener("message", function (event) {
      console.log("Received message from:", event.origin);
      
      // Get the port then use it for communication
      var messagePort = event.ports[0];
      if (typeof messagePort === 'undefined') return;

      // Store the port for later use
      setPort(messagePort);

      // Post message on this port
      messagePort.postMessage("Test");

      // Receive upcoming messages on this port
      messagePort.onmessage = function(portEvent) {
        console.log("[PostMessage] Got message: " + portEvent.data);
        setMessages(prev => [...prev, portEvent.data]);
      };
    });
  }, []);

  const sendMessage = () => {
    if (port) {
      port.postMessage(inputMessage);
      console.log("Sent:", inputMessage);
    } else {
      alert("No MessagePort available");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Simple PostMessage</h1>
      
      <div>
        <p className="text-sm text-gray-600 mb-2">
          Port Status: {port ? "Connected" : "Waiting for connection..."}
        </p>
      </div>

      <div>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Enter message..."
        />
      </div>

      <button
        onClick={sendMessage}
        disabled={!port}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        Send Message
      </button>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Received Messages:</h3>
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm">No messages yet...</p>
        ) : (
          <div className="space-y-1">
            {messages.map((msg, index) => (
              <div key={index} className="p-2 bg-gray-100 rounded text-sm">
                {msg}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostMessageComponent;
