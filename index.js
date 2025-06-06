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

// ✅ التحقق من صحة البيانات
function isValidData(userId, reward, offerName) {
  return (
    typeof userId === 'string' &&
    userId.length > 0 &&
    Number.isInteger(reward) &&
    reward > 0 &&
    reward <= 10000 &&
    typeof offerName === 'string' &&
    offerName.length > 0 &&
    offerName.length <= 100
  );
}

// ✅ التحقق من تكرار العرض
async function isOfferAlreadyClaimed(userId, offerName) {
  const snapshot = await db
    .collection('users')
    .doc(userId)
    .collection('reward_history')
    .where('offer_name', '==', offerName)
    .limit(1)
    .get();
  return !snapshot.empty;
}

// ✅ حفظ السجل
async function logReward(userId, source, reward, offerName) {
  const logRef = db.collection('users').doc(userId).collection('reward_history').doc();
  await logRef.set({
    source,
    reward,
    offer_name: offerName,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ✅ دالة موحدة للمعالجة
async function handleReward(req, res, sourceName) {
  if (!isAuthorized(req)) {
    return res.status(403).send('Unauthorized');
  }

  const userId = req.query.user_id;
  const reward = parseInt(req.query.reward);
  const offerName = req.query.offer_name || 'Unknown';

  if (!isValidData(userId, reward, offerName)) {
    return res.status(400).send('Invalid or missing data');
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).send('User not found');
    }

    const alreadyClaimed = await isOfferAlreadyClaimed(userId, offerName);
    if (alreadyClaimed) {
      return res.status(409).send('Offer already claimed');
    }

    await userRef.update({
      coins: admin.firestore.FieldValue.increment(reward),
    });

    await logReward(userId, sourceName, reward, offerName);
    console.log(`✅ ${sourceName} reward added for ${userId} | Offer: ${offerName}`);
    return res.status(200).send(`${sourceName} reward added`);
  } catch (error) {
    console.error(`❌ Error from ${sourceName}:`, error);
    return res.status(500).send('Internal server error');
  }
}

// ✅ Webhook لـ BitLabs
app.get('/bitlabs', (req, res) => {
  handleReward(req, res, 'BitLabs');
});

// ✅ Webhook لـ Tapjoy
app.get('/tapjoy', (req, res) => {
  handleReward(req, res, 'Tapjoy');
});

// ✅ تشغيل الخادم
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
