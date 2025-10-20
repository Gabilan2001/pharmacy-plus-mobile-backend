
const app = require('./app');
const connectDB = require('./config/db');

connectDB();

const PORT = process.env.PORT || 5000;

// Start keepalive cron job to avoid Render spin down
require('./keepalive');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
