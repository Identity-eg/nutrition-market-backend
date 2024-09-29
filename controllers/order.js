import { StatusCodes } from 'http-status-codes';

import Order from '../models/order.js';
import Cart from '../models/cart.js';

import CustomError from '../errors/index.js';
import { checkPermissions } from '../utils/index.js';
import { PAYMENT_METHODS } from '../constants/paymentMethods.js';

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

  const order = await Order.create(newOrder);

  res.status(StatusCodes.CREATED).json({ order });
};

// CREATE CASH ON DELIVERY ORDER
export const createCashOnDeliveryOrder = async (req, res) => {
  const { cartId, addressId } = req.body;

  const cart = await Cart.findById(cartId);

  if (!cart) {
    throw new CustomError.NotFoundError(`No cart with id : ${cartId}`);
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

  const order = await Order.create(newOrder);
  await cart.deleteOne();

  res.status(StatusCodes.CREATED).json({ order });
};

// GET ALL ORDERS ##############
export const getAllOrders = async (req, res) => {
  let { status, sort, page = 1, limit = 10 } = req.query;

  let skip = (Number(page) - 1) * Number(limit);

  let queryObject = {};

  // Status
  if (status) {
    queryObject.status = { $in: status };
  }

  // Pagination & Sort
  delete queryObject.page;
  delete queryObject.limit;
  delete queryObject.sort;

  const orders = await Order.find(queryObject)
    .populate({
      path: 'user',
      select: 'firstName lastName email',
      options: { _recursed: true },
    })
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const ordersCount = await Order.countDocuments(queryObject);
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
    {
      path: 'orderItems.product',
      select: 'variants',
    },
    { path: 'shippingAddress' },
  ]);
  if (!order) {
    throw new CustomError.NotFoundError(`No order with id : ${orderId}`);
  }
  checkPermissions(req.user, order.user);
  res.status(StatusCodes.OK).json({ order });
};

// GET CURRENT USER ORDERS #####
export const getCurrentUserOrders = async (req, res) => {
  let { page = 1, limit = 12, status, period } = req.query;
  let skip = (Number(page) - 1) * Number(limit);

  let queryObject = {
    user: req.user._id,
  };

  if (status) {
    queryObject.status = status;
  }
  
  if (period) {
    queryObject.createdAt = { $gte: period };
  }

  const orders = await Order.find(queryObject)
    // .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate(['orderItems.variant', 'shippingAddress']);

  res.status(StatusCodes.OK).json({ orders, count: orders.length });
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
