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
		coupons: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Coupon',
			},
		],
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
	// If no coupons or totalPriceAfterCoupon is already undefined, reset items and exit
	if ((!this.coupons || !this.coupons.length) && this.totalPriceAfterCoupon) {
		this.items.forEach(item => {
			item.totalProductPriceAfterCoupon = undefined;
		});
		this.totalPriceAfterCoupon = undefined;
		return next();
	}

	if (!this.coupons.length) return next();

	try {
		const coupons = await Coupon.find({ _id: { $in: this.coupons } });

		const couponMap = new Map(
			coupons.map(coupon => [coupon.company.toString(), coupon.sale])
		);

		const couponCompanies = new Set(
			coupons.map(coupon => coupon.company.toString())
		);

		let totalPriceAfterCoupon = 0;

		this.items = this.items.map(item => {
			const sale = couponMap.get(item.company.toString());
			if (sale) {
				item.totalProductPriceAfterCoupon = Math.floor(
					item.totalProductPrice - (item.totalProductPrice * sale) / 100
				);
			} else if (
				item.totalProductPriceAfterCoupon &&
				!couponCompanies.has(item.company.toString())
			) {
				item.totalProductPriceAfterCoupon = undefined;
			}
			totalPriceAfterCoupon +=
				item.totalProductPriceAfterCoupon ?? item.totalProductPrice;

			return item;
		});

		this.totalPriceAfterCoupon = totalPriceAfterCoupon;

		next();
	} catch (error) {
		console.error('Error in cart pre-save middleware:', error);
		next(error);
	}
});

const Cart = model('Cart', cartSchema);
export default Cart;
