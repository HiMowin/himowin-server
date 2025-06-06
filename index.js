const express = require('express');
const admin = require('firebase-admin');
const app = express();
const PORT = process.env.PORT || 10000;

// تهيئة Firebase
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 🔐 المفتاح السري النهائي
const BITLABS_SECRET = 'Hmiobhaa14/';

// ✅ Webhook محمي لـ BitLabs
app.get('/bitlabs', async (req, res) => {
  const userId = req.query.user_id;
  const reward = parseInt(req.query.reward) || 0;
  const secret = req.query.secret;

  if (!userId || reward === 0 || !secret) {
    console.log('❌ Missing parameters:', { userId, reward, secret });
    return res.status(400).send('Missing parameters');
  }

  // ✅ التحقق من صحة المفتاح
  if (secret !== BITLABS_SECRET) {
    console.log('❌ Unauthorized access attempt with secret:', secret);
    return res.status(403).send('Forbidden');
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log('❌ User not found:', userId);
      return res.status(404).send('User not found');
    }

    console.log('✅ Adding reward:', reward, 'to user:', userId);
    await userRef.update({
      coins: admin.firestore.FieldValue.increment(reward),
    });

    console.log('✅ Reward added successfully');
    return res.status(200).send('Reward added successfully');
  } catch (error) {
    console.error('❌ Error while updating coins:', error);
    return res.status(500).send('Internal server error');
  }
});

// اختبار أن السيرفر شغال
app.get('/test', (req, res) => {
  res.send('Server is working ✅');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
