require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.BREVO_SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        error: 'Name, email, and message are required.'
      });
    }

    await transporter.sendMail({
      from: {
        name: 'MS Production House',
        address: process.env.FROM_EMAIL
      },
      to: process.env.TO_EMAIL,
      replyTo: {
        name,
        address: email
      },
      subject: subject ? `Portfolio Message: ${subject}` : `Portfolio Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject || ''}\n\nMessage:\n${message}`,
      html: `
        <h2>New Portfolio Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || ''}</p>
        <p><strong>Message:</strong><br>${String(message).replace(/\n/g, '<br>')}</p>
      `
    });

    res.json({ ok: true, message: 'Email sent successfully' });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to send email' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));