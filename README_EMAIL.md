Setup for confirmation email service

1) Install dependencies

```bash
npm install
```

2) Required environment variables (example .env or set in your environment):

- `SMTP_HOST` - your SMTP server host (e.g. smtp.gmail.com)
- `SMTP_PORT` - SMTP port (e.g. 587 or 465)
- `SMTP_USER` - SMTP username (email)
- `SMTP_PASS` - SMTP password or app-specific password
- `FROM_EMAIL` - optional "from" address (defaults to `SMTP_USER`)

3) Start the server (serves static site and email endpoint):

```bash
node server.js
```

4) How it works

- The client stores `checkoutData` (now includes `userEmail`) and navigates to `payment.html`.
- After an order is saved, the client makes a POST to `/send-confirmation` with `{ email, order, transactionId }`.
- `server.js` uses `nodemailer` to send the confirmation email via SMTP.

Notes
- This is a minimal example for local testing. For production, run the server on HTTPS and secure your SMTP credentials.
