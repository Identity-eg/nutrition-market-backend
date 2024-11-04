import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import Order from '../models/order.js';
import Product from '../models/product.js';

// ################# Total Sales #################9
export const getTotalSales = async (req, res) => {
	const companyId = req.user.company;
	const period = req.query.period;

	let queryObject = {};

	if (companyId) {
		queryObject['orderItems.company'] = companyId;
	}

	if (period) {
		const fromDate = period.from ? new Date(period.from) : undefined;
		const toDate = period.to ? new Date(period.to) : undefined;

		queryObject.createdAt = {
			$gte: fromDate,
			...(toDate && { $lte: toDate.setHours(23, 59, 59, 999) }),
		};
	}

	const companyOrders = await Order.find(queryObject).populate([
		{ path: 'user', select: 'firstName lastName email' },
	]);

	const result = companyOrders.reduce(
		(acc, order) => {
			order.orderItems.forEach(item => {
				if (!companyId || item.company.toString() === companyId) {
					acc.totalSales += parseFloat(item.totalProductPrice);
					acc.totalProductsSold += item.amount;
				}
			});
			return acc;
		},
		{ totalSales: 0, totalProductsSold: 0 }
	);

	const totalSales = result.totalSales;
	const totalProductsSold = result.totalProductsSold;
	const totalOrders = companyOrders.length;
	const averageOrderValue = companyOrders.length
		? (totalSales / totalOrders).toFixed(2)
		: 0;
	const recentSales = companyOrders.slice(0, 5);

	res.status(StatusCodes.CREATED).json({
		totalSales,
		totalProductsSold,
		totalOrders,
		averageOrderValue,
		recentSales,
	});
};

// ################# Monthly Sales #################
export const getMonthlySales = async (req, res) => {
	const companyId = req.user.company;
	const year = req.params.year;

	const monthlySales = await Order.aggregate([
		{
			$match: {
				// paid: true,
				createdAt: {
					$gte: new Date(`${year}-01-01`),
					$lte: new Date(`${year}-12-31`),
				},
			},
		},
		{
			$unwind: '$orderItems',
		},
		// Difference between Admin and Super Admin
		...(companyId
			? [
					{
						$match: {
							'orderItems.company':
								mongoose.Types.ObjectId.createFromHexString(companyId),
						},
					},
				]
			: []),
		{
			$group: {
				_id: { month: { $month: '$createdAt' } },
				totalOrders: { $sum: 1 },
				totalItems: { $sum: '$orderItems.amount' },
				totalSales: { $sum: '$orderItems.totalProductPrice' },
			},
		},
		{
			$project: {
				_id: 0,
				month: '$_id.month',
				totalOrders: 1,
				totalItems: 1,
				totalSales: 1,
			},
		},
		{ $sort: { month: 1 } },
	]);
	res.status(StatusCodes.CREATED).json({
		monthlySales,
	});
};

// ################# Top Selling Products Sales #################
export const getTopSellingProducts = async (req, res) => {
	const companyId = req.user.company;
	const topSelling = await Product.aggregate([
		{
			$match: {
				// paid: true,
				createdAt: {
					$gte: new Date(`${2024}-01-01`),
					$lte: new Date(`${2024}-12-31`),
				},
			},
		},
		...(companyId
			? [
					{
						$match: {
							company: mongoose.Types.ObjectId.createFromHexString(companyId),
						},
					},
				]
			: []),
		{
			$lookup: {
				from: 'variants', // Collection name of variants
				localField: 'variants',
				foreignField: '_id',
				as: 'variants',
			},
		},
		{
			$unwind: '$variants',
		},
		// Step 3: Project the required fields in the desired format
		{
			$project: {
				company: '$company',
				variant: '$variants',
				totalSold: '$variants.sold',
			},
		},
		{
			$sort: { totalSold: -1 },
		},
		{ $limit: 10 },
	]);
	res.status(StatusCodes.CREATED).json({
		topSelling,
	});
};
