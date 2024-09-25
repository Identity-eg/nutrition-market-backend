import express from 'express';
import 'express-async-errors';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import connectDb from './config/db.js';
// import ngrok from 'ngrok';

// import Routes
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import productRoutes from './routes/product.js';
import variantRoutes from './routes/variant.js';
import cartRoutes from './routes/cart.js';
import userRoutes from './routes/user.js';
import reviewRoutes from './routes/review.js';
import orderRoutes from './routes/order.js';
import categoryRoutes from './routes/category.js';
import subCategoryRoutes from './routes/sub-category.js';
import companyRoutes from './routes/company.js';
import dosageFormRoutes from './routes/dosageForm.js';
import imageRoutes from './routes/image.js';
import paymentRoutes from './routes/payment.js';
import addressRoutes from './routes/address.js';

// import custom Middlewares
import trim from './middlewares/trim.js';
import notFoundMiddleware from './middlewares/not-found.js';
import errorHandlerMiddleware from './middlewares/error-handler.js';
import { getGovernorateCities, getGovernorates } from './controllers/egypt.js';

dotenv.config();
connectDb();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// init App
const app = express();

app.use(
  cors({
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    origin: [
      'https://elgendy-admin-dashboard.vercel.app',
      'http://localhost:3000',
      'https://elgendy-e-commerce.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174',
    ],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(trim);
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sub-categories', subCategoryRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/dosage-forms', dosageFormRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/governorates', getGovernorates);
app.use('/api/cities/:govId', getGovernorateCities);
app.use('/api/payment', paymentRoutes);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;
// (async function () {
//   console.log('Initializing Ngrok tunnel...');

//   // Initialize ngrok using auth token and hostname
//   const url = await ngrok.connect({
//     proto: 'http',
//     // Your authtoken if you want your hostname to be the same everytime
//     authtoken: '',
//     // Your hostname if you want your hostname to be the same everytime
//     hostname: '',
//     // Your app port
//     addr: port,
//   });

//   console.log(`Listening on url ${url}`);
//   console.log('Ngrok tunnel initialized!');
// })();
app.listen(port, async () => {
  console.log(`server running on port ${port}`);
});
