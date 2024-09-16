import Order from '../models/order.js';
import User from '../models/user.js';
import Product from '../models/product.js';

import { StatusCodes } from 'http-status-codes';
import CustomError from '../errors/index.js';
import { checkPermissions } from '../utils/index.js';
import { PAYMENT_METHODS } from '../constants/paymentMethods.js';

// const fakeStripeAPI = async ({ amount, currency }) => {
//   const client_secret = 'someRandomValue';
//   return { client_secret, amount };
// };

// CREATE ORDER ################
export const createOrder = async (req, res) => {
  const user =
    req.body.intention?.extras?.creation_extras?.userId || req.user._id;
  const paymentIntentId = req.body.intention?.id;
  const clientSecret = req.body.intention?.client_secret;
  const shippingAddress =
    req.body.intention?.extras?.creation_extras?.addressId;
  const amount = req.body.intention?.intention_detail?.amount;
  const orderItems = req.body.intention?.extras?.creation_extras?.cartItems;

  if (!req.body.transaction?.success) {
    throw new CustomError.BadRequestError(
      'Something went wrong while creating your order'
    );
  }
  const newOrder = {
    user,
    orderItems,
    total: amount,
    subtotal: amount,
    shippingFee: 0,
    shippingAddress,
    clientSecret,
    paymentIntentId,
    paid: true,
    paymentMethod:
      PAYMENT_METHODS[req.body.intention.payment_methods[0].integration_id] ??
      PAYMENT_METHODS.cashOnDelivery,
  };

  const order = await Order.create(newOrder);

  res
    .status(StatusCodes.CREATED)
    .json({ order, clientSecret: order.clientSecret });
};

// GET ALL ORDERS ##############
export const getAllOrders = async (req, res) => {
  let { name, status, sort, page = 1, limit = 10 } = req.query;

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
  const orders = await Order.find({ user: req.user._id });
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
