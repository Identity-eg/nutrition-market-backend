import express from 'express';
import 'express-async-errors';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import connectDb from './config/db.js';
// import ngrok from 'ngrok';

// import Routes
import authRoutes from './routes/auth.route.js';
import uploadRoutes from './routes/upload.route.js';
import productRoutes from './routes/product.route.js';
import variantRoutes from './routes/variant.route.js';
import cartRoutes from './routes/cart.route.js';
import userRoutes from './routes/user.route.js';
import reviewRoutes from './routes/review.route.js';
import orderRoutes from './routes/order.route.js';
import categoryRoutes from './routes/category.route.js';
// import subCategoryRoutes from './routes/sub-category.js';
import companyRoutes from './routes/company.route.js';
import dosageFormRoutes from './routes/dosageForm.route.js';
import imageRoutes from './routes/image.route.js';
import paymentRoutes from './routes/payment.route.js';
import addressRoutes from './routes/address.route.js';
import statisticsRoutes from './routes/statistics.route.js';

// import custom Middlewares
import trim from './middlewares/trim.js';
import notFoundMiddleware from './middlewares/not-found.js';
import errorHandlerMiddleware from './middlewares/error-handler.js';
import { getGovernorateCities, getGovernorates } from './controllers/egypt.js';

process.on('uncaughtException', err => {
	console.log(err.name, err.message);
	console.log('UNCAUGHT EXCEPTION! shutting down...');
	process.exit(1);
});

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
		origin: [process.env.ORIGIN_DEV_FRONTEND, process.env.ORIGIN_DEV_DASHBOARD],
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
// app.use('/api/sub-categories', subCategoryRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/dosage-forms', dosageFormRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/governorates', getGovernorates);
app.use('/api/cities/:govId', getGovernorateCities);
app.use('/api/payment', paymentRoutes);
app.use('/api/statistics', statisticsRoutes);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const server = app.listen(port, async () => {
	console.log(`server running on port ${port}`);
});

process.on('unhandledRejection', err => {
	console.log(err.name, err.message);
	console.log('UNHANDLED REJECTION! shutting down...');
	server.close(() => process.exit(1));
});
