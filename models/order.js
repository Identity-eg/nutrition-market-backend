import mongoose from 'mongoose';
import { PAYMENT_METHODS } from '../constants/paymentMethods.js';
import { ORDER_STATUSES } from '../constants/index.js';
import Coupon from './coupon.js';

const { model, Schema } = mongoose;
const { ObjectId } = Schema.Types;

const SingleOrderItemSchema = new Schema({
	product: {
		type: ObjectId,
		ref: 'Product',
		required: [true, 'Please provide a product'],
	},
	company: {
		type: Schema.Types.ObjectId,
		ref: 'Company',
		required: [true, 'Please provide a company'],
	},
	amount: { type: Number, default: 1 },
	variant: {
		type: ObjectId,
		ref: 'Variant',
		required: [true, 'Please provide a variant'],
	},
	totalProductPrice: {
		type: Number,
		required: [true, 'Please provide total product price'],
	},
	totalProductPriceAfterCoupon: {
		type: Number,
	},
});

const orderSchema = new Schema(
	{
		user: {
			type: ObjectId,
			ref: 'User',
			required: [true, 'Please provide a user'],
		},
		orderItems: [SingleOrderItemSchema],
		shippingFee: {
			type: Number,
			required: [true, 'Please provide shipping fee'],
		},
		subtotal: {
			type: Number,
			required: [true, 'Please provide subtotal'],
		},
		total: {
			type: Number,
			required: [true, 'Please provide total'],
		},
		status: {
			type: String,
			enum: Object.values(ORDER_STATUSES),
			default: ORDER_STATUSES.processing,
		},
		cancelReason: String,
		shippingAddress: {
			type: ObjectId,
			ref: 'Address',
			required: [true, 'Please provide a shipping address'],
		},
		deliveryDate: {
			type: Date,
		},
		clientSecret: {
			type: String,
		},
		paymentIntentId: {
			type: String,
		},
		paid: {
			type: Boolean,
			required: true,
		},
		paymobOrderId: {
			type: String,
			index: { unique: true, sparse: true }
		},
		coupons: [
			{
				type: ObjectId,
				ref: 'Coupon',
			},
		],
		paymentMethod: {
			type: {
				id: String,
				name: {
					type: String,
					enum: Object.values(PAYMENT_METHODS).map(pm => pm.name),
				},
			},
			required: [true, 'Please provide a payment method'],
		},
	},
	{
		timestamps: true,
	}
);

orderSchema.pre('save', async function (next) {
	if (!this.coupons) return next();
	for (const couponId of this.coupons) {
		const coupon = await Coupon.findById(couponId);
		coupon.orders.push(this._id);
		coupon.save();
	}
	next();
});

const Order = model('Order', orderSchema);
export default Order;
