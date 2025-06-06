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

// 📌 Webhook لاختبار إضافة النقاط فقط (بدون حماية حالياً)
app.get('/', async (req, res) => {
  const userId = req.query.user_id;
  const reward = parseInt(req.query.reward) || 0;

  if (!userId || reward === 0) {
    console.log('❌ Missing parameters:', { userId, reward });
    return res.status(400).send('Missing user_id or reward');
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

// مسار اختباري لعرض أن السيرفر شغال
app.get('/test', (req, res) => {
  res.send('Server is working ✅');
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
