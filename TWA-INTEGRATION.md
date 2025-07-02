# TWA PostMessage Integration Guide

## Quick Start for TWA Integration

### 1. Add to your Android TWA project

```kotlin
// In your TWA Activity
class MainActivity : LauncherActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Enable JavaScript
        webView.settings.javaScriptEnabled = true
        
        // Add JavaScript interface for postMessage
        webView.addJavascriptInterface(WebAppInterface(), "Android")
    }
    
    private inner class WebAppInterface {
        @JavascriptInterface
        fun receiveMessage(message: String) {
            Log.d("TWA", "Received message: $message")
            
            // Handle the message from Next.js app
            try {
                val json = JSONObject(message)
                val type = json.getString("type")
                val data = json.getJSONObject("data")
                
                when (type) {
                    "greeting" -> handleGreeting(data)
                    "user_action" -> handleUserAction(data)
                    "data_request" -> handleDataRequest(data)
                    "notification" -> handleNotification(data)
                }
            } catch (e: Exception) {
                Log.e("TWA", "Error parsing message", e)
            }
        }
        
        private fun handleGreeting(data: JSONObject) {
            // Handle greeting message
            runOnUiThread {
                Toast.makeText(this@MainActivity, 
                    "Hello from Next.js: ${data.getString("message")}", 
                    Toast.LENGTH_SHORT).show()
            }
        }
        
        private fun handleUserAction(data: JSONObject) {
            // Handle user actions
            val action = data.getString("action")
            Log.d("TWA", "User action: $action")
        }
        
        private fun handleDataRequest(data: JSONObject) {
            // Send data back to web app
            val response = JSONObject().apply {
                put("type", "data_response")
                put("data", JSONObject().apply {
                    put("userId", "12345")
                    put("userName", "John Doe")
                    put("permissions", JSONArray(listOf("read", "write")))
                })
                put("timestamp", System.currentTimeMillis())
            }
            
            // Send response back to web app
            webView.post {
                webView.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('twa-message', { detail: $response }));",
                    null
                )
            }
        }
        
        private fun handleNotification(data: JSONObject) {
            // Show system notification
            val title = data.getString("title")
            val message = data.getString("message")
            
            // Create notification using NotificationManager
            showNotification(title, message)
        }
    }
}
```

### 2. Gradle Dependencies

```gradle
// In your app/build.gradle
dependencies {
    implementation 'androidx.browser:browser:1.7.0'
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
}
```

### 3. Manifest Configuration

```xml
<!-- In your AndroidManifest.xml -->
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:launchMode="singleTop"
    android:theme="@style/Theme.TWAPostMessage">
    
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https"
              android:host="your-domain.com" />
    </intent-filter>
    
    <meta-data android:name="asset_statements" 
               android:resource="@string/asset_statements" />
</activity>
```

## Testing the Integration

### Option 1: Use the Demo HTML File
1. Open `http://localhost:3000/twa-demo.html` 
2. This simulates a parent TWA window
3. Test postMessage communication interactively

### Option 2: Browser Developer Tools
1. Open the Next.js app at `http://localhost:3000`
2. Open Developer Tools Console
3. Simulate parent messages:

```javascript
// Simulate receiving a message from TWA
window.postMessage({
    type: 'greeting',
    data: { message: 'Hello from TWA parent!' },
    source: 'twa-parent'
}, '*');

// Listen for messages sent by the app
window.addEventListener('message', (event) => {
    console.log('App sent message:', event.data);
});
```

## Production Deployment Checklist

- [ ] Update origin validation in production
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up proper CSP headers
- [ ] Test on actual Android device with TWA
- [ ] Verify digital asset links
- [ ] Test offline functionality
- [ ] Performance optimization for mobile

## Message Protocol Reference

### From Next.js to TWA:
```typescript
{
  type: 'greeting' | 'data' | 'action' | 'notification' | 'custom',
  data: any,
  timestamp: number,
  source: 'nextjs-twa-app',
  id?: string
}
```

### From TWA to Next.js:
```typescript
{
  type: 'response' | 'command' | 'data',
  data: any,
  timestamp: number,
  source: 'twa-parent',
  id?: string
}
```
