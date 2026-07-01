/**
 * Test script to send a push notification
 *
 * Usage: node test-notification.js YOUR_DEVICE_TOKEN
 */

const deviceToken = process.argv[2];

if (!deviceToken) {
  console.error('❌ Please provide a device token as argument');
  console.log('Usage: node test-notification.js YOUR_DEVICE_TOKEN');
  process.exit(1);
}

const testPayload = {
  token: deviceToken,
  title: 'Test Notification',
  body: 'This is a test notification from FCM server',
};

fetch('http://localhost:3000/mobile_fcm_send-notification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testPayload),
})
  .then((response) => response.json())
  .then((data) => {
    if (data.success) {
      console.log('✅ Notification sent successfully!');
      console.log('Message ID:', data.messageId);
    } else {
      console.error('❌ Failed to send notification');
      console.error('Error:', data.error);
    }
  })
  .catch((error) => {
    console.error('❌ Request failed:', error.message);
    console.log('\n💡 Make sure the server is running: npm start');
  });
