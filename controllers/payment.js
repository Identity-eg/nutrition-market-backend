import fetch from 'node-fetch';
import Cart from '../models/cart.js';
import { StatusCodes } from 'http-status-codes';
import CustomError from '../errors/index.js';
import crypto from 'crypto';
import User from '../models/user.js';
import Address from '../models/address.js';
import { convertToCent } from '../utils/convertToPound.js';
import Order from '../models/order.js';

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
			notification_url: `${process.env.ORIGIN_PROD_BACKEND}/api/orders`,
			redirection_url: `${process.env.ORIGIN_PROD_BACKEND}/api/payment/after-payment`,
			payment_methods: [+req.body.paymentMethodId],

			items: cart.items.map(item => ({
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
				cartId: cart._id,
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
		.createHmac('sha512', 'FCCFB4AE7442AA05AB2806A5DC19AEC6')
		.update(concatenateString)
		.digest('hex');

	const paidOrder = await Order.findOne({ paymobOrderId: order });

	if (hash === req.query.hmac) {
		// res.cookie('encpl', JSON.stringify({ success, orderId: id }), {
		// 	maxAge: 1 * 60 * 1000,
		// });
		res.redirect(
			301,
			`http://localhost:3000/orders/status?orderId=${paidOrder._id}`
		);
	}
};
