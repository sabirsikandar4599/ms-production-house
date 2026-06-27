require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const https   = require('https');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ ok: false, error: 'Name, email and message required' });

  const payload = JSON.stringify({
    sender:      { name: 'MS Production House', email: process.env.FROM_EMAIL },
    to:          [{ email: process.env.TO_EMAIL, name: 'Sabir Ali' }],
    replyTo:     { email, name },
    subject:     subject ? `Portfolio: ${subject}` : `Portfolio Message from ${name}`,
    htmlContent: `<h2>New Portfolio Message</h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> <a href="mailto:${email}">${email}</a></p>
      <p><b>Subject:</b> ${subject || '—'}</p>
      <p><b>Message:</b><br>${String(message).replace(/\n/g,'<br>')}</p>`
  });

  const options = {
    method: 'POST', hostname: 'api.brevo.com', path: '/v3/smtp/email',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const apiReq = https.request(options, (apiRes) => {
    let body = '';
    apiRes.on('data', d => body += d);
    apiRes.on('end', () => {
      if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
        console.log('Email sent:', name);
        res.json({ ok: true });
      } else {
        console.error('Brevo error:', apiRes.statusCode, body);
        res.status(500).json({ ok: false, error: 'Email failed' });
      }
    });
  });
  apiReq.on('error', e => res.status(500).json({ ok: false, error: e.message }));
  apiReq.setTimeout(20000, () => apiReq.destroy(new Error('Timeout')));
  apiReq.write(payload); apiReq.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));