# FCM Push Notification Server

Node.js/Express API server for sending Firebase Cloud Messaging (FCM) push notifications to your Expo mobile app.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd api
npm install
```

### 2. Start the Server
```bash
npm start
```

Server runs on: `http://localhost:3000`

### 3. Test the Server
```bash
# Health check
curl http://localhost:3000/health
```

## 📡 API Endpoints

### POST /mobile_fcm_send-notification

Send a push notification to a device.

**Request:**
```json
{
  "token": "DEVICE_FCM_TOKEN",
  "title": "Notification title",
  "body": "Notification body text"
}
```

**Success Response:**
```json
{
  "success": true,
  "messageId": "projects/maw3edak/messages/1234567890"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "FCM Notification Server is running"
}
```

## 🧪 Testing

### Method 1: Using the Test Script

```bash
node test-notification.js YOUR_FCM_TOKEN
```

### Method 2: Using curl

```bash
curl -X POST http://localhost:3000/mobile_fcm_send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_DEVICE_TOKEN",
    "title": "Test Notification",
    "body": "This is a test message"
  }'
```

### Method 3: Using the Mobile App

1. Navigate to `/test-fcm` screen in your app
2. Get your FCM token (automatically displayed)
3. Use the built-in test form to send notifications

## 📱 Getting FCM Tokens

In your Expo app, use:

```typescript
import { getFCMToken } from '@/utils/notifications';

const token = await getFCMToken();
console.log('FCM Token:', token);
```

**Important:** FCM tokens only work on physical devices, not simulators!

## 🔒 Security Notes

- ✅ `serviceaccountkey.json` is in `.gitignore`
- ⚠️ Never commit service account credentials
- 🔐 Add authentication to endpoints in production
- 🌐 Enable HTTPS in production
- ✅ Validate tokens before sending

## 📂 Files

- `server.js` - Express server with FCM integration
- `serviceaccountkey.json` - Firebase service account (DO NOT COMMIT)
- `test-notification.js` - CLI testing tool
- `package.json` - Dependencies

## 🚢 Production Deployment

Deploy to any Node.js hosting:

- **Heroku**: `git push heroku main`
- **Render**: Connect GitHub repo
- **DigitalOcean**: App Platform
- **AWS**: Elastic Beanstalk or Lambda

## 📖 Documentation

For complete setup instructions, see: `../PUSH_NOTIFICATIONS_SETUP.md`
