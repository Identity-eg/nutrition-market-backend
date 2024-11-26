import mongoose from 'mongoose';
import dayjs from 'dayjs';
import Coupon from './coupon.js';

const { model, Schema } = mongoose;

const cartSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		items: [
			{
				product: {
					type: Schema.Types.ObjectId,
					ref: 'Product',
					required: [true, 'Please provide a product'],
				},
				company: {
					type: Schema.Types.ObjectId,
					ref: 'Company',
					required: [true, 'Please provide a company'],
				},
				variant: {
					type: Schema.Types.ObjectId,
					ref: 'Variant',
					required: [true, 'Please provide a variant'],
				},
				amount: {
					type: Number,
					default: 1,
				},
				totalProductPrice: {
					type: Number,
					required: [true, 'Please provide total product price'],
				},
				totalProductPriceAfterCoupon: {
					type: Number,
				},
			},
		],
		totalItems: {
			type: Number,
			default: 1,
		},
		totalPrice: {
			type: Number,
			required: [true, 'Please provide total price'],
		},
		totalPriceAfterCoupon: {
			type: Number,
		},
		coupon: {
			type: Schema.Types.ObjectId,
			ref: 'Coupon',
		},
		expireAt: {
			type: Date,
			default: dayjs().add(15, 'd'),
		},
	},
	{
		timestamps: true,
	}
);

cartSchema.pre('save', async function (next) {
	if (!this.coupon) return;

	const coupon = await Coupon.findById(this.coupon);

	const cartItemsAfterCoupon = this.items.map(item => {
		if (item.company.toString() === coupon.company.toString()) {
			item.totalProductPriceAfterCoupon = Math.floor(
				item.totalProductPrice - (item.totalProductPrice * coupon.sale) / 100
			);
		}
		return item;
	});

	const totalPriceAfterCoupon = cartItemsAfterCoupon.reduce((acc, item) => {
		acc = (item.totalProductPriceAfterCoupon ?? item.totalProductPrice) + acc;
		return acc;
	}, 0);

	this.items = cartItemsAfterCoupon;
	this.totalPriceAfterCoupon = totalPriceAfterCoupon;

	next();
});

const Cart = model('Cart', cartSchema);
export default Cart;
