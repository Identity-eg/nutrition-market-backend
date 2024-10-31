import { StatusCodes } from 'http-status-codes';
import Review from '../models/review.js';
import Order from '../models/order.js';
import CustomError from '../errors/index.js';
import { checkPermissions } from '../utils/index.js';
import mongoose from 'mongoose';

// ################# Total Sales #################9
export const getTotalSales = async (req, res) => {
	const companyId = req.user.company || req.body.companyId;
	const period = req.query.period;

	let queryObject = {
		'orderItems.company': req.user.company,
	};
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
	console.log(companyOrders);

	const result = companyOrders.reduce(
		(acc, order) => {
			order.orderItems.forEach(item => {
				if (item.company.toString() === companyId) {
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
		? totalSales / totalProductsSold
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

// ################# Get All Reviews #################
export const getMonthlySales = async (req, res) => {
	const companyId = req.user.company || req.body.companyId;
	const monthlySales = await Order.aggregate([
		{
			$match: {
				// paid: true,
				createdAt: {
					$gte: new Date(`${2024}-01-01`),
					$lte: new Date(`${2024}-12-31`),
				},
			},
		},
		{
			$unwind: '$orderItems',
		},
		{
			$match: {
				'orderItems.company':
					mongoose.Types.ObjectId.createFromHexString(companyId),
			},
		},
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

// ################# Get Single Review #################
export const getSingleReview = async (req, res) => {
	const { id: reviewId } = req.params;

	const review = await Review.findOne({ _id: reviewId });

	if (!review) {
		throw new CustomError.NotFoundError(`No review with id ${reviewId}`);
	}

	res.status(StatusCodes.OK).json({ review });
};

// ################# Update Review #################
export const updateReview = async (req, res) => {};

// ################# Delete Review #################
export const deleteReview = async (req, res) => {
	const { id: reviewId } = req.params;

	const review = await Review.findOne({ _id: reviewId });

	if (!review) {
		throw new CustomError.NotFoundError(`No review with id ${reviewId}`);
	}

	checkPermissions(req.user, review.user);
	await review.deleteOne();
	res.status(StatusCodes.OK).json({ msg: 'Success! Review removed' });
};
