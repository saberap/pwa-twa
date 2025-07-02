# TWA PostMessage Demo

A Next.js TypeScript project designed to communicate with TWA (Trusted Web Activity) using the postMessage API.

## 🚀 Features

- **PostMessage Communication**: Send and receive messages to/from TWA parent context
- **TWA Detection**: Automatically detects if running within a TWA environment
- **Real-time Messaging**: Interactive UI for testing postMessage functionality
- **TypeScript Support**: Full TypeScript implementation with type safety
- **Modern UI**: Beautiful Tailwind CSS interface
- **SSR Safe**: Properly handles server-side rendering

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd post-message
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 TWA Integration

### Basic Usage

The app automatically detects TWA context and provides tools to:

1. **Send Hello Message**: Quick greeting to parent TWA
2. **Custom Messages**: Send structured data with different message types
3. **Message History**: View all sent and received messages
4. **Environment Info**: Display current TWA detection status

### Message Types

- `greeting`: Simple hello messages
- `data`: Data transmission to TWA
- `action`: User action notifications
- `notification`: Alert-style messages
- `custom`: Custom JSON payloads

### Example Usage in TWA

```typescript
// Send a simple hello message
await messenger.sendHello({
  userId: '123',
  sessionId: 'abc-def'
});

// Send user action
await messenger.sendUserAction('button_click', {
  buttonId: 'checkout',
  productId: 'prod_123'
});

// Request data from TWA
const userData = await messenger.requestData('user_profile', {
  fields: ['name', 'email']
});
```

## 🔧 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main page with TWA detection
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   └── PostMessageComponent.tsx  # Main messaging UI
└── utils/
    └── twa-messenger.ts      # TWA communication utilities
```

## 🧰 API Reference

### TWAMessenger Class

```typescript
import { TWAMessenger } from '@/utils/twa-messenger';

const messenger = new TWAMessenger();

// Send message
await messenger.sendMessage({
  type: 'greeting',
  data: { message: 'Hello TWA!' }
});

// Send with response expected
const response = await messenger.sendMessage({
  type: 'data_request',
  data: { type: 'user_info' }
}, { expectResponse: true });
```

### TWA Detection

```typescript
import { TWADetector } from '@/utils/twa-messenger';

// Check if in TWA
const isInTWA = TWADetector.isInTWA();

// Get detailed info
const info = TWADetector.getTWAInfo();
```

## 🔒 Security Considerations

- **Origin Validation**: Always validate message origins in production
- **Data Sanitization**: Sanitize all incoming message data
- **HTTPS Only**: Use HTTPS for all TWA communications
- **CSP Headers**: Implement proper Content Security Policy

## 🏗️ Building for Production

```bash
npm run build
npm start
```

## 📦 Deployment

This app can be deployed to any hosting platform that supports Next.js:

- **Vercel**: `vercel deploy`
- **Netlify**: Connect your Git repository
- **AWS/GCP/Azure**: Use Docker or platform-specific deployment

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For questions or issues:
- Create an issue in this repository
- Check the [Next.js documentation](https://nextjs.org/docs)
- Review [TWA documentation](https://developer.chrome.com/docs/android/trusted-web-activity/)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
