const express = require('express');
const admin = require('firebase-admin');
const app = express();
const PORT = process.env.PORT || 10000;

// ✅ تهيئة Firebase
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// ✅ المفتاح السري (يجب أن يكون مطابق 100%)
const SECRET_KEY = 'Hmiobhaa14/';

// ✅ دالة التحقق من المفتاح
function isAuthorized(req) {
  return req.query.key === SECRET_KEY;
}

// ✅ Webhook خاص بـ BitLabs
app.get('/bitlabs', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).send('Unauthorized');
  }

  const userId = req.query.user_id;
  const reward = parseInt(req.query.reward) || 0;

  if (!userId || reward === 0) {
    return res.status(400).send('Missing user_id or reward');
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).send('User not found');
    }

    await userRef.update({
      coins: admin.firestore.FieldValue.increment(reward),
    });

    console.log('✅ BitLabs reward added for', userId);
    return res.status(200).send('BitLabs reward added');
  } catch (error) {
    console.error('❌ Error from BitLabs:', error);
    return res.status(500).send('Internal server error');
  }
});

// ✅ Webhook خاص بـ Tapjoy
app.get('/tapjoy', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).send('Unauthorized');
  }

  const userId = req.query.user_id;
  const reward = parseInt(req.query.reward) || 0;

  if (!userId || reward === 0) {
    return res.status(400).send('Missing user_id or reward');
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).send('User not found');
    }

    await userRef.update({
      coins: admin.firestore.FieldValue.increment(reward),
    });

    console.log('✅ Tapjoy reward added for', userId);
    return res.status(200).send('Tapjoy reward added');
  } catch (error) {
    console.error('❌ Error from Tapjoy:', error);
    return res.status(500).send('Internal server error');
  }
});

// ✅ تشغيل الخادم
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
