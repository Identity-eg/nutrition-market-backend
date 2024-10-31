import mongoose from 'mongoose';
import { PAYMENT_METHODS } from '../constants/paymentMethods.js';

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
			enum: ['processing', 'shipped', 'delivered', 'cancelled'],
			default: 'processing',
		},
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

const Order = model('Order', orderSchema);
export default Order;
