const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

let client = null;
if (accountSid && authToken) {
  try {
    client = twilio(accountSid, authToken);
  } catch (err) {
    console.error('Failed to initialize Twilio client:', err?.message || err);
  }
} else {
  console.warn('Twilio not configured: missing TWILIO_ACCOUNT_SID and/or TWILIO_AUTH_TOKEN');
}

/**
 * Send an SMS using Twilio. Prefers Messaging Service SID when provided.
 * Requires either TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER in env.
 * @param {string} to E.164 phone number, e.g., +15551234567
 * @param {string} body Message body text
 */
async function sendSms(to, body) {
  if (!client) return;

  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!messagingServiceSid && !from) {
    console.warn('Twilio not configured: set TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER');
    return;
  }

  try {
    await client.messages.create({
      to,
      body,
      ...(messagingServiceSid ? { messagingServiceSid } : { from }),
    });
  } catch (err) {
    console.error('Twilio SMS send failed:', err?.message || err);
  }
}

module.exports = { sendSms };
