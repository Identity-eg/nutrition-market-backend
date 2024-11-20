import { StatusCodes } from 'http-status-codes';

import Order from '../models/order.js';
import Cart from '../models/cart.js';
import User from '../models/user.js';
import Variant from '../models/variant.js';

import CustomError from '../errors/index.js';
import { checkPermissions } from '../utils/index.js';
import { PAYMENT_METHODS } from '../constants/paymentMethods.js';
import { USER_ROLES } from '../constants/index.js';
import mongoose from 'mongoose';
import Company from '../models/company.js';

// CREATE ONLINE ORDER ################
export const createOnlineOrder = async (req, res) => {
	const user =
		req.body.intention?.extras?.creation_extras?.userId || req.user._id;
	const paymentIntentId = req.body.intention?.id;
	const clientSecret = req.body.intention?.client_secret;
	const shippingAddress =
		req.body.intention?.extras?.creation_extras?.addressId;
	const amount = req.body.intention?.intention_detail?.amount;
	const orderItems = req.body.intention?.extras?.creation_extras?.cartItems;
	const shippingFee = 0;

	if (!req.body.transaction?.success) {
		throw new CustomError.BadRequestError(
			'Something went wrong while creating your order'
		);
	}

	for (const item of orderItems) {
		const variant = await Variant.findById(item.variant);
		const isExceedQuantity = variant?.quantity < (item.amount ?? 0);
		if (isExceedQuantity)
			throw new CustomError.BadRequestError(
				'The requested quantity is not available, try to reduce your requested quantity'
			);
	}

	const newOrder = {
		user,
		orderItems,
		subtotal: amount,
		total: amount + shippingFee,
		shippingFee,
		shippingAddress,
		clientSecret,
		paymentIntentId,
		paid: true,
		paymentMethod:
			PAYMENT_METHODS[req.body.intention.payment_methods[0].integration_id] ??
			PAYMENT_METHODS.cashOnDelivery,
	};

	const session = await mongoose.startSession();
	try {
		session.startTransaction();
		const order = new Order(newOrder);
		await order.save({ session });

		const uniqueCompanySet = new Set(orderItems.map(item => item.company));
		const uniqueCompanyArray = [...uniqueCompanySet];

		await Promise.all(
			uniqueCompanyArray.map(com =>
				Company.findByIdAndUpdate(
					com,
					{ $inc: { ordersCount: 1 } },
					{ session }
				)
			)
		);

		await Promise.all(
			orderItems.map(item =>
				Variant.findByIdAndUpdate(
					item.variant,
					{
						$inc: { sold: item.amount, quantity: -item.amount },
					},
					{ session }
				)
			)
		);

		await Promise.all(
			orderItems.map(item =>
				User.findByIdAndUpdate(
					req.user._id,
					{
						$addToSet: { purchasedProducts: item.product },
					},
					{ session }
				)
			)
		);

		await User.findByIdAndUpdate(
			req.user._id,
			{ $inc: { ordersCount: 1 } },
			{ session }
		);
		// await cart.deleteOne({ session });
		await session.commitTransaction();
		res.status(StatusCodes.CREATED).json({ order });
	} catch (error) {
		await session.abortTransaction();
		throw new CustomError.CustomAPIError(error.message);
	} finally {
		session.endSession();
	}
};

// CREATE CASH ON DELIVERY ORDER #########################
export const createCashOnDeliveryOrder = async (req, res) => {
	const { cartId, addressId } = req.body;

	const cart = await Cart.findById(cartId);

	if (!cart) {
		throw new CustomError.NotFoundError(`No cart with id : ${cartId}`);
	}

	for (const item of cart.items) {
		const variant = await Variant.findById(item.variant);
		const isExceedQuantity = variant?.quantity < (item.amount ?? 0);
		if (isExceedQuantity)
			throw new CustomError.BadRequestError(
				'The requested quantity is not available, try to reduce your requested quantity'
			);
	}

	const shippingFee = 0;

	const newOrder = {
		user: req.user._id,
		orderItems: cart.items,
		shippingAddress: addressId,
		subtotal: cart.totalPrice,
		total: cart.totalPrice + shippingFee,
		shippingFee,
		paid: false,
		paymentMethod: {
			id: 1,
			name: 'cashOnDelivery',
		},
	};

	const session = await mongoose.startSession();
	try {
		session.startTransaction();
		const order = new Order(newOrder);
		await order.save({ session });

		const uniqueCompanySet = new Set(
			cart.items.map(item => item.company.toString())
		);

		const uniqueCompanyArray = [...uniqueCompanySet];
		await Promise.all(
			uniqueCompanyArray.map(com =>
				Company.findByIdAndUpdate(
					com,
					{ $inc: { ordersCount: 1 } },
					{ session }
				)
			)
		);

		await Promise.all(
			cart.items.map(item =>
				Variant.findByIdAndUpdate(
					item.variant,
					{
						$inc: { sold: item.amount, quantity: -item.amount },
					},
					{ session }
				)
			)
		);

		await Promise.all(
			cart.items.map(item =>
				User.findByIdAndUpdate(
					req.user._id,
					{
						$addToSet: { purchasedProducts: item.product },
					},
					{ session }
				)
			)
		);

		await User.findByIdAndUpdate(
			req.user._id,
			{
				$inc: { ordersCount: 1 },
			},
			{ session }
		);

		await cart.deleteOne({ session });
		await session.commitTransaction();
		res.status(StatusCodes.CREATED).json({ order });
	} catch (error) {
		await session.abortTransaction();
		throw new CustomError.CustomAPIError(error.message);
	} finally {
		await session.endSession();
	}
};

// GET ALL ORDERS ##############
export const getAllOrders = async (req, res) => {
	let {
		name,
		status,
		company,
		paid,
		paymentMethod,
		period,
		sort,
		page = 1,
		limit = 10,
	} = req.query;

	let skip = (Number(page) - 1) * Number(limit);

	let queryObject = {};

	if (name) {
		const nameQuery = { $regex: name, $options: 'i' };
		const users = await User.find({
			$or: [
				{ firstName: nameQuery },
				{ lastName: nameQuery },
				{ email: nameQuery },
			],
		});

		const userIds = users.map(user => user?._id) ?? [];
		queryObject.user = { $in: userIds };
	}

	if (status) {
		queryObject.status = { $in: status };
	}

	if (company) {
		queryObject['orderItems.company'] = company;
	}

	if (paid) {
		queryObject.paid = paid;
	}

	if (paymentMethod) {
		queryObject['paymentMethod.name'] = paymentMethod;
	}

	if (period) {
		queryObject.createdAt = { $gte: period };
	}

	const orders = await Order.find(queryObject)
		.populate({
			path: 'user',
			select: 'firstName lastName email',
			options: { _recursed: true },
		})
		.sort(sort)
		.skip(skip)
		.limit(limit);

	const ordersCount = orders.length;
	const lastPage = Math.ceil(ordersCount / limit);
	res.status(StatusCodes.OK).json({
		totalCount: ordersCount,
		currentPage: Number(page),
		lastPage,
		orders,
	});
};

// GET SINGLE ORDER ############
export const getSingleOrder = async (req, res) => {
	const { id: orderId } = req.params;
	const order = await Order.findOne({ _id: orderId }).populate([
		'orderItems.variant',
		'shippingAddress',
		{ path: 'orderItems.product', select: 'dosageForm category' },
	]);
	if (!order) {
		throw new CustomError.NotFoundError(`No order with id : ${orderId}`);
	}

	const superAdmin = req.user.role === USER_ROLES.superAdmin;
	const adminOwner =
		req.user.role === USER_ROLES.admin &&
		order.orderItems.some(item => item.company.toString() === req.user.company);
	const userOwner = req.user._id === order.user.toString();

	if (!superAdmin && !adminOwner && !userOwner) {
		throw new CustomError.UnauthorizedError(
			'Not authorized to access this route'
		);
	}

	res.status(StatusCodes.OK).json({ order });
};

// GET CURRENT USER ORDERS #####
export const getCurrentUserOrders = async (req, res) => {
	let {
		page = 1,
		limit = 12,
		status,
		paid,
		paymentMethod,
		user,
		period,
	} = req.query;
	let skip = (Number(page) - 1) * Number(limit);

	let queryObject = {
		user: req.user._id,
	};

	if (status) {
		queryObject.status = status;
	}

	if (paid) {
		queryObject.paid = paid;
	}

	if (paymentMethod) {
		queryObject['paymentMethod.name'] = paymentMethod;
	}

	if (user) {
		queryObject.user = user;
	}

	if (period) {
		queryObject.createdAt = { $gte: period };
	}

	const orders = await Order.find(queryObject)
		// .sort(sort)
		.skip(skip)
		.limit(limit)
		.populate(['orderItems.variant', 'shippingAddress']);

	const ordersCount = orders.length;
	const lastPage = Math.ceil(ordersCount / limit);
	res.status(StatusCodes.OK).json({
		totalCount: ordersCount,
		currentPage: Number(page),
		lastPage,
		orders,
	});
};

// GET CURRENT USER ORDERS #####
export const getCompanyOrders = async (req, res) => {
	let {
		page = 1,
		limit = 12,
		status,
		paid,
		paymentMethod,
		name,
		period,
	} = req.query;
	let skip = (Number(page) - 1) * Number(limit);

	let queryObject = {
		'orderItems.company': req.user.company,
	};

	if (name) {
		const nameQuery = { $regex: name, $options: 'i' };
		const users = await User.find({
			$or: [
				{ firstName: nameQuery },
				{ lastName: nameQuery },
				{ email: nameQuery },
			],
		});

		const userIds = users.map(user => user?._id) ?? [];
		queryObject.user = { $in: userIds };
	}

	if (status) {
		queryObject.status = status;
	}

	if (paid) {
		queryObject.paid = paid;
	}

	if (paymentMethod) {
		queryObject['paymentMethod.name'] = paymentMethod;
	}

	if (period) {
		queryObject.createdAt = { $gte: period };
	}

	const orders = await Order.find(queryObject)
		// .sort(sort)
		.skip(skip)
		.limit(limit)
		.populate({
			path: 'user',
		});

	const ordersCount = orders.length;
	const lastPage = Math.ceil(ordersCount / limit);
	res.status(StatusCodes.OK).json({
		totalCount: ordersCount,
		currentPage: Number(page),
		lastPage,
		orders,
	});
};

// UPDATE OREDR #################
export const updateOrder = async (req, res) => {
	const { id: orderId } = req.params;
	const { paymentIntentId } = req.body;

	const order = await Order.findOne({ _id: orderId });
	if (!order) {
		throw new CustomError.NotFoundError(`No order with id : ${orderId}`);
	}
	checkPermissions(req.user, order.user);

	order.paymentIntentId = paymentIntentId;
	order.status = 'processing';
	await order.save();

	res.status(StatusCodes.OK).json({ order });
};

export const cancelOrder = async (req, res) => {
	const { id: orderId } = req.params;

	const order = await Order.findOne({ _id: orderId });
	if (!order) {
		throw new CustomError.NotFoundError(`No order with id : ${orderId}`);
	}
	checkPermissions(req.user, order.user);

	if (!order.status !== 'processing') {
		throw new CustomError.BadRequestError(
			`You don't allowed because order is ${order.status}, contact us on whatsapp`
		);
	}

	const session = await mongoose.startSession();
	try {
		session.startTransaction();
		const uniqueCompanySet = new Set(
			order.orderItems.map(item => item.company)
		);
		const uniqueCompanyArray = [...uniqueCompanySet];
		await Promise.all(
			uniqueCompanyArray.map(com =>
				Company.findByIdAndUpdate(
					com,
					{ $inc: { ordersCount: -1 } },
					{ session }
				)
			)
		);

		await Promise.all(
			order.orderItems.map(item =>
				Variant.findByIdAndUpdate(
					item.variant,
					{
						$inc: { sold: -item.amount, quantity: item.amount },
					},
					{ session }
				)
			)
		);

		await Promise.all(
			order.orderItems.map(item =>
				User.findByIdAndUpdate(
					req.user._id,
					{
						$pull: { purchasedProducts: item.product },
					},
					{ session }
				)
			)
		);

		await User.findByIdAndUpdate(
			order.user,
			{
				$inc: { ordersCount: -1 },
			},
			{ session }
		);

		await order.deleteOne({ session });
		await session.commitTransaction();
		res.status(StatusCodes.OK).json({ msg: 'Order cancelled successfully' });
	} catch (error) {
		await session.abortTransaction();
		throw new CustomError.CustomAPIError(error.message);
	} finally {
		await session.endSession();
	}
};
