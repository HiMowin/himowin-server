const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/tapjoy-callback', (req, res) => {
  const { user_id, reward, currency } = req.body;

  console.log('Received Tapjoy callback:');
  console.log('User ID:', user_id);
  console.log('Reward:', reward);
  console.log('Currency:', currency);

  res.status(200).send('Callback received');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
