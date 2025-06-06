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

// ✅ المفتاح السري لحماية الويب هوك
const SECRET_KEY = process.env.MY_SECRET_KEY;

// ✅ دالة التحقق من المفتاح
function isAuthorized(req) {
  return req.query.key === SECRET_KEY;
}

// ✅ دالة لتسجيل سجل المكافأة مع اسم العرض
async function logReward(userId, source, reward, offerName) {
  const logRef = db.collection('users').doc(userId).collection('reward_history').doc();
  await logRef.set({
    source,
    reward,
    offer_name: offerName || 'Unknown',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ✅ Webhook خاص بـ BitLabs
app.get('/bitlabs', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).send('Unauthorized');
  }

  const userId = req.query.user_id;
  const reward = parseInt(req.query.reward) || 0;
  const offerName = req.query.offer_name || 'Unknown';

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

    await logReward(userId, 'BitLabs', reward, offerName);

    console.log(`✅ BitLabs reward added for ${userId} | Offer: ${offerName}`);
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
  const offerName = req.query.offer_name || 'Unknown';

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

    await logReward(userId, 'Tapjoy', reward, offerName);

    console.log(`✅ Tapjoy reward added for ${userId} | Offer: ${offerName}`);
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
