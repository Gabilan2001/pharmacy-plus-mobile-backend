const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const DEFAULT_CC = (process.env.TWILIO_DEFAULT_COUNTRY_CODE || '').trim(); // e.g. +94 or +1

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

function onlyDigits(s) {
  return (s || '').replace(/\D+/g, '');
}

function isValidE164(s) {
  return /^\+\d{6,15}$/.test(s || '');
}

// Normalize a local number to E.164 using TWILIO_DEFAULT_COUNTRY_CODE when needed
function normalizeToE164(input) {
  if (!input) return '';
  let s = String(input).trim();

  // Already in E.164
  if (s.startsWith('+') && isValidE164(s)) return s;

  // Remove non-digits
  const digits = onlyDigits(s);
  if (!digits) return '';

  // If starts with leading 0 and a default country code is provided, drop the 0
  if (DEFAULT_CC && digits.startsWith('0')) {
    return `${DEFAULT_CC}${digits.substring(1)}`;
  }

  // If no + and default CC provided, prepend it
  if (DEFAULT_CC && !s.startsWith('+')) {
    return `${DEFAULT_CC}${digits}`;
  }

  // Fallback: if user entered something like 15551234567 and no default CC, try to add '+'
  if (!s.startsWith('+')) {
    return `+${digits}`;
  }

  return s;
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

  const toE164 = normalizeToE164(to);
  try {
    console.log(`[Twilio] attempting SMS to normalized number: ${toE164}`);
  } catch {}
  if (!isValidE164(toE164)) {
    console.error(`Twilio SMS not sent: invalid destination number after normalization: "${to}" -> "${toE164}". Set TWILIO_DEFAULT_COUNTRY_CODE (e.g., +94 or +1) or store phone in E.164 format.`);
    return;
  }

  try {
    await client.messages.create({
      to: toE164,
      body,
      ...(messagingServiceSid ? { messagingServiceSid } : { from }),
    });
  } catch (err) {
    console.error('Twilio SMS send failed:', err?.message || err);
  }
}

module.exports = { sendSms };
