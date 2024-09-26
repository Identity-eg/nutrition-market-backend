import fetch from 'node-fetch';
import Cart from '../models/cart.js';
import { StatusCodes } from 'http-status-codes';
import CustomError from '../errors/index.js';
import crypto from 'crypto';
import User from '../models/user.js';
import Address from '../models/address.js';

const convertToCent = (price) => {
  return price * 100;
};

export const createPayment = async (req, res) => {
  const address = await Address.findById(req.body.addressId);
  const cart = await Cart.findById(req.body.cartId).populate({
    path: 'items.variant',
  });
  const user = await User.findById(req.user._id);

  if (!address) {
    throw new CustomError.BadRequestError('Please provide your address');
  }
  if (!cart) {
    throw new CustomError.BadRequestError(
      'No products found in your cart to make order'
    );
  }

  const response = await fetch('https://accept.paymob.com/v1/intention/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.PAYMOB_SK}`,
    },
    body: JSON.stringify({
      amount: convertToCent(cart.totalPrice),
      currency: 'EGP',
      // notification_url: 'http://localhost:5000/api/orders',
      // redirection_url: `http://localhost:5000/api/payment/after-payment?cartId=${cart._id}`,
      payment_methods: [+req.body.paymentMethodId],

      items: cart.items.map((item) => ({
        name: item.variant.name.slice(0, 49),
        amount: convertToCent(
          item.variant.priceAfterDiscount || item.variant.price
        ),
        quantity: item.amount,
      })),

      billing_data: {
        first_name: address.firstName,
        last_name: address.lastName,
        street: address.street,
        building: address.buildingNo,
        phone_number: address.phone,
        country: 'EGYPT',
        state: address.city,
        email: address.email,
        floor: address.floor,
      },
      customer: {
        first_name: user.name,
        last_name: user.name,
        email: user.email,
      },
      extras: {
        userId: user._id,
        cartItems: cart.items,
        addressId: address._id,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new CustomError.NotFoundError(data.detail);
  }
  res.status(StatusCodes.CREATED).json({ clientSecret: data.client_secret });
};

export const afterPayment = async (req, res) => {
  const source_data_pan = req.query['source_data.pan'];
  const source_data_sub_type = req.query['source_data.sub_type'];
  const source_data_type = req.query['source_data.type'];
  const cartId = req.query.cartId;

  const {
    amount_cents,
    created_at,
    currency,
    error_occured,
    has_parent_transaction,
    id,
    integration_id,
    is_3d_secure,
    is_auth,
    is_capture,
    is_refunded,
    is_standalone_payment,
    is_voided,
    order,
    owner,
    pending,
    success,
  } = req.query;

  const concatenateString =
    amount_cents +
    created_at +
    currency +
    error_occured +
    has_parent_transaction +
    id +
    integration_id +
    is_3d_secure +
    is_auth +
    is_capture +
    is_refunded +
    is_standalone_payment +
    is_voided +
    order +
    owner +
    pending +
    source_data_pan +
    source_data_sub_type +
    source_data_type +
    success;

  const hash = crypto
    .createHmac('sha512', 'CE16D7071DC5DD4F590DA061DECEBA63')
    .update(concatenateString)
    .digest('hex');

  // await Cart.findByIdAndDelete(cartId);

  if (hash === req.query.hmac) {
    res.cookie('encpl', JSON.stringify({ success, orderId: id }), {
      maxAge: 1000,
    });
    res.redirect(301, `http://localhost:3000/orders/status`);
  }
};
