
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const roleRequestRoutes = require('./routes/roleRequestRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const orderRoutes = require('./routes/orderRoutes');
const couponRoutes = require('./routes/couponRoutes');
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [
      /^http:\/\/localhost(:\d+)?$/,
      /^http:\/\/127\.0\.0\.1(:\d+)?$/,
      /^http:\/\/192\.168\.[0-9]+\.[0-9]+(:\d+)?$/,
      /^http:\/\/10\.[0-9]+\.[0-9]+\.[0-9]+(:\d+)?$/,
    ].some((re) => re.test(origin));
    if (allowed) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/role-requests', roleRequestRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/users', userRoutes);

// Health check and route introspection
app.get('/api/health', (req, res) => {
  // Attempt to enumerate mounted routes for debugging
  const listRoutes = () => {
    const routes = [];
    const stack = app._router && app._router.stack ? app._router.stack : [];
    stack.forEach((layer) => {
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods || {}).filter(Boolean);
        routes.push({ path: layer.route.path, methods });
      } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        // Nested router mounted at a path
        const mountPath = layer.regexp && layer.regexp.fast_slash === true ? '/' : (layer.regexp && layer.regexp.source) || '';
        layer.handle.stack.forEach((l2) => {
          if (l2.route && l2.route.path) {
            const methods = Object.keys(l2.route.methods || {}).filter(Boolean);
            routes.push({ path: `${layer.path || ''}${l2.route.path}`, methods });
          }
        });
      }
    });
    return routes;
  };

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    routes: listRoutes(),
  });
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
