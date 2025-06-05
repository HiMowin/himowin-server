const express = require('express');
const admin = require('firebase-admin');
const app = express();
const PORT = process.env.PORT || 10000;

// ✅ قراءة مفتاح الخدمة من المتغير البيئي بدلاً من الملف
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);

// ✅ تهيئة Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ✅ استقبال البيانات من أي شركة (user_id و reward عبر الرابط)
app.get('/', async (req, res) => {
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

    return res.status(200).send('Reward added successfully');
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).send('Internal server error');
  }
});

// ✅ تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
