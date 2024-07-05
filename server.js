import express from 'express';
import 'express-async-errors';
import dotenv from 'dotenv';
import connectDb from './config/db.js';
import './config/i18n.js';

// import packages
// import i18next from 'i18next';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import cloudinary from 'cloudinary';
// import i18nMiddleware from 'i18next-http-middleware';

// import Routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/product.js';
import cartRoutes from './routes/cart.js';
import userRoutes from './routes/user.js';
import reviewRoutes from './routes/review.js';
import orderRoutes from './routes/order.js';
import categoryRoutes from './routes/category.js';
import subCategoryRoutes from './routes/sub-category.js';
import companyRoutes from './routes/company.js';
// import colorRoutes from './routes/color.js';

// import custom Middlewares
import trim from './middlewares/trim.js';
import notFoundMiddleware from './middlewares/not-found.js';
import errorHandlerMiddleware from './middlewares/error-handler.js';

dotenv.config();
connectDb();

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// init App
const app = express();

// middlewares
app.use(
  cors({
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    // preflightContinue: true,
    origin: [
      'https://elgendy-admin-dashboard.vercel.app',
      'http://localhost:3000',
      'https://elgendy-e-commerce.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174',
    ],
  })
);

// app.use(i18nMiddleware.handle(i18next));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(trim);
app.use(cookieParser());
app.use(express.static('./public'));
// When you upload a file, the file will be accessible from req.files
app.use(fileUpload({ useTempFiles: true }));

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sub-categories', subCategoryRoutes);
app.use('/api/companies', companyRoutes);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`server running on port ${port}`));
