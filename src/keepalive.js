const https = require('https');
const http = require('http');

const URL = process.env.KEEPALIVE_URL || 'https://pharmacy-plus-mobile-backend.onrender.com/api/health';

function ping() {
  const client = URL.startsWith('https') ? https : http;
  client.get(URL, (res) => {
    // Optionally log status
    // console.log(`Keepalive ping: ${res.statusCode}`);
  }).on('error', (err) => {
    // Optionally log error
    // console.error('Keepalive error:', err.message);
  });
}

// Ping every 13 minutes (780,000 ms)
setInterval(ping, 13 * 60 * 1000);

// Initial ping on startup
ping();
