/**
 * TWA (Trusted Web Activity) Communication Utilities
 * Provides helper functions for postMessage communication with TWA
 */

import { useRef, useEffect } from 'react';

export interface TWAMessage {
  type: string;
  data?: any;
  timestamp: number;
  source: string;
  id?: string;
}

export class TWAMessenger {
  private messageId = 0;
  private pendingMessages = new Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>();

  /**
   * Send a message to TWA parent with optional response handling
   */
  async sendMessage(
    message: Omit<TWAMessage, 'timestamp' | 'source' | 'id'>,
    options: {
      targetOrigin?: string;
      expectResponse?: boolean;
      responseTimeout?: number;
    } = {}
  ): Promise<any> {
    const {
      targetOrigin = '*',
      expectResponse = false,
      responseTimeout = 5000
    } = options;

    const messageId = `msg_${++this.messageId}_${Date.now()}`;
    const fullMessage: TWAMessage = {
      ...message,
      id: messageId,
      timestamp: Date.now(),
      source: 'nextjs-twa-app'
    };

    try {
      // Send to parent window (iframe/TWA)
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(fullMessage, targetOrigin);
      }

      // Send to Android interface if available
      if (typeof (window as any).Android !== 'undefined') {
        (window as any).Android.receiveMessage(JSON.stringify(fullMessage));
      }

      console.log('Message sent to TWA:', fullMessage);

      // If expecting a response, return a promise
      if (expectResponse) {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            this.pendingMessages.delete(messageId);
            reject(new Error(`Message response timeout after ${responseTimeout}ms`));
          }, responseTimeout);

          this.pendingMessages.set(messageId, { resolve, reject, timeout });
        });
      }

      return fullMessage;
    } catch (error) {
      console.error('Error sending message to TWA:', error);
      throw error;
    }
  }

  /**
   * Handle incoming message from TWA
   */
  handleIncomingMessage(event: MessageEvent): void {
    try {
      const message = event.data as TWAMessage;
      
      // Check if this is a response to a pending message
      if (message.id && this.pendingMessages.has(message.id)) {
        const pending = this.pendingMessages.get(message.id)!;
        clearTimeout(pending.timeout);
        this.pendingMessages.delete(message.id);
        pending.resolve(message);
        return;
      }

      // Handle other incoming messages
      console.log('Received message from TWA:', message);
      
      // Emit custom event for other parts of the app to listen to
      window.dispatchEvent(new CustomEvent('twa-message', { detail: message }));
    } catch (error) {
      console.error('Error handling incoming TWA message:', error);
    }
  }

  /**
   * Initialize message listener
   */
  initialize(): () => void {
    const handleMessage = (event: MessageEvent) => {
      this.handleIncomingMessage(event);
    };

    window.addEventListener('message', handleMessage);

    // Return cleanup function
    return () => {
      window.removeEventListener('message', handleMessage);
      // Clear any pending messages
      this.pendingMessages.forEach(({ timeout, reject }) => {
        clearTimeout(timeout);
        reject(new Error('TWAMessenger destroyed'));
      });
      this.pendingMessages.clear();
    };
  }
  /**
   * Send a simple hello message to TWA
   */
  async sendHello(customData?: any): Promise<TWAMessage> {
    return this.sendMessage({
      type: 'hello',
      data: {
        message: 'Hello from Next.js App!',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        ...customData
      }
    });
  }

  /**
   * Send user action to TWA
   */
  async sendUserAction(action: string, data?: any): Promise<TWAMessage> {
    return this.sendMessage({
      type: 'user_action',
      data: {
        action,
        ...data
      }
    });
  }

  /**
   * Request data from TWA
   */
  async requestData(dataType: string, parameters?: any): Promise<any> {
    return this.sendMessage({
      type: 'data_request',
      data: {
        dataType,
        parameters
      }
    }, {
      expectResponse: true,
      responseTimeout: 10000
    });
  }

  /**
   * Send notification to TWA
   */
  async sendNotification(title: string, message: string, data?: any): Promise<TWAMessage> {
    return this.sendMessage({
      type: 'notification',
      data: {
        title,
        message,
        ...data
      }
    });
  }
}

/**
 * TWA Environment Detection
 */
export class TWADetector {  /**
   * Check if running in TWA context
   */
  static isInTWA(): boolean {
    try {
      // Only run on client side
      if (typeof window === 'undefined') return false;
      
      // Check if in iframe
      const inIframe = window !== window.parent;
      
      // Check for Android interface
      const hasAndroidInterface = typeof (window as any).Android !== 'undefined';
      
      // Check user agent for TWA indicators
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const hasTWAUserAgent = /wv/.test(userAgent); // WebView indicator
      
      // Check for TWA-specific features
      const isTWA = inIframe || hasAndroidInterface || hasTWAUserAgent;
      
      return isTWA;
    } catch (error) {
      console.error('Error detecting TWA environment:', error);
      return false;
    }
  }
  /**
   * Get TWA environment details
   */
  static getTWAInfo(): {
    isInTWA: boolean;
    isInIframe: boolean;
    hasAndroidInterface: boolean;
    userAgent: string;
    origin: string;
  } {
    if (typeof window === 'undefined') {
      return {
        isInTWA: false,
        isInIframe: false,
        hasAndroidInterface: false,
        userAgent: '',
        origin: ''
      };
    }

    return {
      isInTWA: this.isInTWA(),
      isInIframe: window !== window.parent,
      hasAndroidInterface: typeof (window as any).Android !== 'undefined',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      origin: window.location.origin
    };
  }
}

/**
 * Hook for React components to use TWA messaging
 */
export const useTWAMessenger = () => {
  const messengerRef = useRef<TWAMessenger | null>(null);

  useEffect(() => {
    if (!messengerRef.current) {
      messengerRef.current = new TWAMessenger();
      const cleanup = messengerRef.current.initialize();
      
      return cleanup;
    }
  }, []);

  return messengerRef.current;
};

// For non-React usage
let globalMessenger: TWAMessenger | null = null;

/**
 * Get global TWA messenger instance
 */
export const getTWAMessenger = (): TWAMessenger => {
  if (!globalMessenger) {
    globalMessenger = new TWAMessenger();
    globalMessenger.initialize();
  }
  return globalMessenger;
};

export default TWAMessenger;
