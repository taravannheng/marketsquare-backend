const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db');
const bodyParser = require('body-parser');

const productRoutes = require('./routes/products/products.route');
const relatedProductRoutes = require('./routes/products/related-products.route');
const cartRoutes = require('./routes/carts/cart.route');
const orderRoutes = require('./routes/orders/order.route');
const slideshowRoutes = require('./routes/slideshows/slideshow.route');
const notFoundRoute = require('./routes/not-found/not-found.route');
const loggingMiddleWare = require('./middleware/logging/logging.middleware');

const app = express();

dotenv.config();

// logging
app.use(loggingMiddleWare);

// Enable CORS 
app.use(cors({
  origin: `${process.env.ACCESS_CONTROL_ALLOW_ORIGIN}`
}));

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// connect to mongodb
connectDB();

app.use('/api', productRoutes);
app.use('/api', relatedProductRoutes);
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);
app.use('/api', slideshowRoutes);
app.use(notFoundRoute);

const port = process.env.PORT || 3001;

// start server
app.listen(port, () => {
  console.warn('Server started on port 3001');
});
