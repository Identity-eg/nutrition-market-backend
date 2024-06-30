import Order from '../models/order.js';
import User from '../models/user.js';
import Product from '../models/product.js';

import { StatusCodes } from 'http-status-codes';
import CustomError from '../errors/index.js';
import { checkPermissions } from '../utils/index.js';

const fakeStripeAPI = async ({ amount, currency }) => {
  const client_secret = 'someRandomValue';
  return { client_secret, amount };
};

// CREATE ORDER ################
export const createOrder = async (req, res) => {
  const { items: cartItems, shippingFee, address } = req.body;

  if (!cartItems || cartItems.length < 1) {
    throw new CustomError.BadRequestError('No cart items provided');
  }

  let orderItems = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const product = await Product.findOne({ _id: item.product });
    if (!product) {
      throw new CustomError.NotFoundError(
        `No product with id : ${item.product}`
      );
    }
    const { name, price, images, _id } = product;
    const singleOrderItem = {
      amount: item.amount,
      name,
      price,
      image: images[0].url,
      product: _id,
    };
    // add item to order
    orderItems = [...orderItems, singleOrderItem];
    // calculate subtotal
    subtotal += item.amount * price;
  }
  // calculate total
  const total = shippingFee + subtotal;
  // get client secret
  // const paymentIntent = await fakeStripeAPI({
  //   amount: total,
  //   currency: 'usd',
  // });

  const user = await User.findById(req.user._id);
  console.log(user);
  const shippingAddress = user.addresses.find(
    (ad) => ad._id.toString() === address
  );

  if (!shippingAddress) {
    throw new CustomError.NotFoundError(`Please provide an address`);
  }

  const order = await Order.create({
    user: req.user._id,
    orderItems,
    total,
    subtotal,
    shippingFee,
    shippingAddress,
    // clientSecret: paymentIntent.client_secret,
  });

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
      match: { name: new RegExp(name, 'i') },
      select: 'name email',
      options: { _recursed: true },
    })
    .sort(sort)
    .skip(skip)
    .limit(limit);

  // Filter out orders with no matched user
  const filteredOrders = orders.filter((order) => order.user);
  const ordersCount = await Order.countDocuments(queryObject);
  const lastPage = Math.ceil(ordersCount / limit);
  res.status(StatusCodes.OK).json({
    totalCount: ordersCount,
    currentPage: Number(page),
    lastPage,
    orders: filteredOrders,
  });
};

// GET SINGLE ORDER ############
export const getSingleOrder = async (req, res) => {
  const { id: orderId } = req.params;
  const order = await Order.findOne({ _id: orderId }).populate({
    path: 'orderItems.product',
    select: 'description images',
  });
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
