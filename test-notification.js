/**
 * Test Notification Script
 *
 * This script tests if FCM notifications are being delivered properly.
 *
 * Usage:
 * 1. Update the medicalId variable with your test patient's medical ID
 * 2. Run: node test-notification.js
 */

const medicalId = 'YOUR_MEDICAL_ID_HERE'; // Replace with actual medical ID

const SUPABASE_URL = 'https://ttyukcvqifqyfolxtwba.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0eXVrY3ZxaWZxeWZvbHh0d2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1MzExNjIsImV4cCI6MjA0ODEwNzE2Mn0.Gk2dqv0cI1NlAjjm1Cza8XJ3vIcPYE8rvR6bYz-Y-gk';

async function testNotification() {
  console.log('🧪 Testing FCM Notification Delivery...\n');

  // Step 1: Check if device token exists
  console.log('1️⃣ Checking device tokens...');
  const tokenResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/device_tokens?medical_id=eq.${medicalId}&select=*`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    }
  );

  const tokens = await tokenResponse.json();
  console.log(`   Found ${tokens.length} device token(s)`);

  if (tokens.length === 0) {
    console.error('   ❌ No device tokens found for this medical ID');
    console.error('   Make sure the app is installed and the user is logged in');
    return;
  }

  tokens.forEach((token, index) => {
    console.log(`   Token ${index + 1}:`, {
      platform: token.platform,
      device: token.device_model,
      active: token.is_active,
      fcm_token_preview: token.fcm_token.substring(0, 40) + '...'
    });
  });

  // Step 2: Send test notification
  console.log('\n2️⃣ Sending test notification...');
  const notificationResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/send-push-notification`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        medicalId: medicalId,
        title: 'Test Notification',
        body: 'This is a test notification from the notification system',
        data: {
          type: 'test',
          timestamp: new Date().toISOString()
        }
      })
    }
  );

  const result = await notificationResponse.json();

  if (notificationResponse.ok) {
    console.log('   ✅ Notification sent successfully!');
    console.log('   Details:', result);

    if (result.details) {
      console.log(`   📊 Sent to ${result.details.successful}/${result.details.total} devices`);
      if (result.details.failed > 0) {
        console.log(`   ⚠️  ${result.details.failed} failed`);
      }
    }

    if (result.results) {
      console.log('\n   Device Results:');
      result.results.forEach((r, i) => {
        const status = r.status === 'fulfilled' ? '✅' : '❌';
        console.log(`     ${status} ${r.platform} (${r.device})`);
        if (r.error) {
          console.log(`        Error: ${r.error}`);
        }
      });
    }
  } else {
    console.error('   ❌ Failed to send notification');
    console.error('   Error:', result);
  }

  // Step 3: Verify notification in database
  console.log('\n3️⃣ Checking notification records...');
  const notifResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/patient_notifications?medical_id=eq.${medicalId}&order=created_at.desc&limit=5`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    }
  );

  const notifications = await notifResponse.json();
  console.log(`   Found ${notifications.length} recent notification(s)`);

  if (notifications.length > 0) {
    console.log('   Latest:');
    const latest = notifications[0];
    console.log(`     - ${latest.message_header}`);
    console.log(`     - ${latest.message_body}`);
    console.log(`     - Read: ${latest.is_read ? 'Yes' : 'No'}`);
  }

  console.log('\n✅ Test complete!');
  console.log('\n📱 Check your mobile device for the notification');
  console.log('   - If app is open: You should see an alert');
  console.log('   - If app is closed: You should see a system notification');
}

// Run the test
testNotification().catch(error => {
  console.error('\n❌ Test failed with error:');
  console.error(error);
});
