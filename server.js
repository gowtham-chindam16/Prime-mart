const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// POST /send-confirmation
app.post('/send-confirmation', async (req, res) => {
  const { email, order, transactionId } = req.body || {};
  if (!email || !order) {
    return res.status(400).json({ error: 'Missing email or order data' });
  }

  // SMTP config from environment
  const host = process.env.SMTP_HOST;
  const portNum = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.FROM_EMAIL || user;

  if (!host || !user || !pass) {
    return res.status(500).json({ error: 'SMTP not configured on server' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(portNum),
      secure: Number(portNum) === 465, // true for 465, false for other ports
      auth: { user, pass }
    });

    const itemsHtml = (order.items || []).map(i => `
      <tr>
        <td style="padding:6px 8px;border:1px solid #eaeaea">${i.name} x ${i.quantity}</td>
        <td style="padding:6px 8px;border:1px solid #eaeaea" align="right">$${(i.price * i.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <h2>Thank you for your order</h2>
      <p>Transaction ID: <strong>${transactionId}</strong></p>
      <table style="border-collapse:collapse;width:100%;">
        ${itemsHtml}
        <tr>
          <td style="padding:6px 8px;border:1px solid #eaeaea"><strong>Total</strong></td>
          <td style="padding:6px 8px;border:1px solid #eaeaea" align="right"><strong>$${(order.total||0).toFixed(2)}</strong></td>
        </tr>
      </table>
      <p>We will notify you when your order ships.</p>
    `;

    await transporter.sendMail({
      from,
      to: email,
      subject: `Order Confirmation - ${transactionId}`,
      html
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error sending confirmation email:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
