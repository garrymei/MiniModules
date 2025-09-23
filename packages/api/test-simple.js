const express = require('express');
const app = express();

app.get('/healthz', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.listen(3001, () => {
  console.log('Simple server running on port 3001');
});
