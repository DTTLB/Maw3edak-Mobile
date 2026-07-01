const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceaccountkey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();

app.use(cors());
app.use(express.json());

app.post('/mobile_fcm_send-notification', async (req, res) => {
  try {
    const { token, title, body } = req.body;

    if (!token || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: token, title, and body are required',
      });
    }

    const message = {
      token,
      notification: {
        title,
        body,
      },
    };

    const messageId = await admin.messaging().send(message);

    res.json({
      success: true,
      messageId,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'FCM Notification Server is running' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`FCM Notification Server running on port ${PORT}`);
});
