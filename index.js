const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const passport = require('passport');

const connectDB = require('./configs/db');
const productRoutes = require('./routes/products/products.route');
const relatedProductRoutes = require('./routes/products/related-products.route');
const cartRoutes = require('./routes/carts/cart.route');
const orderRoutes = require('./routes/orders/order.route');
const slideshowRoutes = require('./routes/slideshows/slideshow.route');
const userRoutes = require('./routes/users/user.routes');
const authRoutes = require('./routes/auth/auth.routes');
const signInRoutes = require('./routes/signin/signin.route');
const notFoundRoute = require('./routes/not-found/not-found.route');
const loggingMiddleWare = require('./middlewares/logging/logging.middleware');
const { connectToRedis } = require('./configs/redis-client');

const app = express();

// Configs
dotenv.config();
require('./configs/passport');

// Middlewares
app.use(loggingMiddleWare);
app.use(cors({
  origin: `${process.env.ACCESS_CONTROL_ALLOW_ORIGIN}`,
  credentials: true,
}));
app.use(bodyParser.json());
app.use(helmet());
app.use(passport.initialize());

// DB Connections
connectDB();
connectToRedis();

// Routes
app.use('/api', productRoutes);
app.use('/api', relatedProductRoutes);
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);
app.use('/api', slideshowRoutes);
app.use('/api', userRoutes);
app.use('/api', authRoutes);
app.use('/api', signInRoutes);
app.use(notFoundRoute);

// Port
const port = process.env.PORT || 3001;

// Start Server
app.listen(port, () => {
  console.warn(`Server started on port ${port}`);
});
