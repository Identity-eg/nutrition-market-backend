import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';

import Order from '../models/order.js';
import Product from '../models/product.js';

// ################# Total Sales #################
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

	const companyOrders = await Order.find(queryObject)
		.sort('-createdAt')
		.populate([{ path: 'user', select: 'firstName lastName email' }]);

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
	const averageOrderValue = companyOrders.length ? totalSales / totalOrders : 0;
	const recentSales = companyOrders.slice(0, 5);

	res.status(StatusCodes.OK).json({
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
	res.status(StatusCodes.OK).json({
		monthlySales,
	});
};

// ################# Top Selling Products #################
export const getTopSellingProducts = async (req, res) => {
	const companyId = req.user.company;
	const { limit = 5 } = req.query;

	const topSelling = await Product.aggregate([
		// {
		// 	$match: {
		// 		paid: true,
		// 	},
		// },
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
				from: 'variants',
				localField: 'variants',
				foreignField: '_id',
				as: 'variants',
			},
		},
		{
			$unwind: '$variants',
		},
		{
			$project: {
				// Category: '$category',
				company: '$company',
				variant: '$variants',
				totalSold: '$variants.sold',
			},
		},
		{
			$sort: { totalSold: -1 },
		},
		{ $limit: +limit },
	]);

	res.status(StatusCodes.OK).json({
		products: topSelling,
	});
};

// ################# Top Selling Categories #################
export const getTopSellingCategories = async (req, res) => {
	const { limit = 5 } = req.query;
	const topSelling = await Product.aggregate([
		{
			$lookup: {
				from: 'variants',
				localField: 'variants',
				foreignField: '_id',
				as: 'variants',
			},
		},
		{
			$unwind: '$variants',
		},
		{
			$project: {
				category: '$category',
				totalSold: '$variants.sold',
			},
		},
		{
			$unwind: '$category',
		},
		{
			$group: {
				_id: '$category',
				totalSold: { $sum: '$totalSold' },
			},
		},
		{
			$lookup: {
				from: 'categories',
				localField: '_id',
				foreignField: '_id',
				as: 'category',
			},
		},
		{
			$unwind: '$category',
		},
		{
			$sort: { totalSold: -1 },
		},
		{ $limit: +limit },
	]);

	res.status(StatusCodes.OK).json({
		categories: topSelling,
	});
};

// ################# Top Selling Categories #################
export const getTopAreaSales = async (req, res) => {
	const companyId = req.user.company;
	const period = req.query.period;

	const fromDate = period?.from ? new Date(period.from) : undefined;
	const toDate = period?.to ? new Date(period.to) : undefined;

	const areaSales = await Order.aggregate([
		{
			$match: {
				// paid: true,
				...(fromDate && {
					createdAt: {
						$gte: fromDate,
						...(toDate && { $lte: toDate.setHours(23, 59, 59, 999) }),
					},
				}),
			},
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
			$lookup: {
				from: 'addresses',
				localField: 'shippingAddress',
				foreignField: '_id',
				as: 'shippingAddress',
			},
		},
		{
			$unwind: '$shippingAddress',
		},
		{
			$group: {
				_id: '$shippingAddress.governorate',
				totalOrders: { $sum: 1 },
			},
		},
		{
			$sort: { totalOrders: -1 },
		},
		{
			$project: {
				_id: 0,
				area: '$_id',
				totalOrders: 1,
			},
		},
	]);

	res.status(StatusCodes.OK).json({
		areaSales,
	});
};
