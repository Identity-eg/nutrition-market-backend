import fetch from 'node-fetch';
import Address from '../models/address.js';
import Cart from '../models/cart.js';
import { StatusCodes } from 'http-status-codes';
import CustomError from '../errors/index.js';
import crypto from 'crypto';

const API_KEY = process.env.PAYMOB_API_KEY;
const PAYMENT_INTEGRATION_ID = '4827863';
const IFRAME =
  'https://accept.paymob.com/api/acceptance/iframes/866526?payment_token='; // put your iframe id here dont use mine

const getToken = async () => {
  const res = await fetch('https://accept.paymob.com/api/auth/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: API_KEY }),
  });
  const data = await res.json();

  return data.token;
};

const createOrder = async (selectedCart, selectedAddress, authToken) => {
  const firstName = selectedAddress.fullname.split(' ')[0];
  const lastName = selectedAddress.fullname.split(' ')[1];

  const res = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: true,
      amount_cents: (selectedCart.totalPrice + selectedCart.shippingFee) * 100,
      currency: 'EGP',
      items: selectedCart.items.reduce((cart, item, i) => {
        cart.push({
          name: item.product.name,
          amount_cents: item.totalProductPrice * 100,
          description: item.product.description,
          quantity: item.amount,
        });

        return cart;
      }, []),

      shipping_data: {
        first_name: firstName,
        last_name: lastName,
        email: selectedAddress.email,
        phone_number: selectedAddress.phone,

        country: selectedAddress.goverment,
        city: selectedAddress.area,

        street: selectedAddress.street,
        building: selectedAddress.building,
        apartment: selectedAddress.apartment,
        floor: selectedAddress.floor,

        postal_code: '01898',
        // state: "Utah",
      },
    }),
  });

  const data = await res.json();
  const orderId = data.id;

  return orderId;
};

const getPaymentToken = async (
  selectedCart,
  selectedAddress,
  authToken,
  orderId
) => {
  const firstName = selectedAddress.fullname.split(' ')[0];
  const lastName = selectedAddress.fullname.split(' ')[1];
  const res = await fetch(
    'https://accept.paymob.com/api/acceptance/payment_keys',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: true,
        amount_cents:
          (selectedCart.totalPrice + selectedCart.shippingFee) * 100,
        expiration: 600,
        order_id: orderId,
        billing_data: {
          first_name: firstName,
          last_name: lastName,
          email: selectedAddress.email,
          phone_number: selectedAddress.phone,

          country: selectedAddress.goverment,
          city: selectedAddress.area,

          street: selectedAddress.street,
          building: selectedAddress.building || 'undefined',
          apartment: selectedAddress.apartment || 0,
          floor: selectedAddress.floor || 0,

          postal_code: '01898',
          // shipping_method: "PKG",
          // state: "Utah",
        },
        currency: 'EGP',
        integration_id: INTEGRATION_ID,
        lock_order_when_paid: true,
      }),
    }
  );

  const data = await res.json();
  const paymentToken = data.token;

  return paymentToken;
};

export const createPayment = async (req, res) => {
  const selectedAddress = await Address.findById(req.body.addressId);
  const selectedCart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'items.product',
    select: 'name price description priceAfterDiscount',
  });

  if (!selectedAddress) {
    throw new CustomError.BadRequestError('Please provide your address');
  }
  if (!selectedCart) {
    throw new CustomError.BadRequestError(
      'No products found in your cart to make order'
    );
  }

  // 1- Get Token
  const authToken = await getToken();
  // 2- Make Order & Get Order id
  const orderId = await createOrder(selectedCart, selectedAddress, authToken);
  // 3- Get Payement Token
  const paymentToken = await getPaymentToken(
    selectedCart,
    selectedAddress,
    authToken,
    orderId
  );

  return res.status(StatusCodes.CREATED).json({
    paymentToken,
    paymentLink: ifameOne + paymentToken,
  });
};

export const afterPayment = async (req, res) => {
  // res.status(StatusCodes.CREATED).json({ req });
  // res.send({ isSuccess: req.query.success });

  const source_data_pan = req.query['source_data.pan'];
  const source_data_sub_type = req.query['source_data.sub_type'];
  const source_data_type = req.query['source_data.type'];
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

  res.redirect(
    301,
    `http://dukamarket.vercel.app/checkout/order/${req.query.order}?success=${
      req.query.success
    }&validation=${hash === req.query.hmac}`
  );

  // res.status(StatusCodes.CREATED).json({ isSuccess: req.query.success });
};
