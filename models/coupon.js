import dayjs from 'dayjs';
import mongoose from 'mongoose';

const { model, Schema } = mongoose;
const { ObjectId } = Schema.Types;

const couponSchema = new Schema(
	{
		company: {
			type: ObjectId,
			ref: 'Company',
			required: [true, 'Please provide a company'],
		},
		code: {
			type: String,
			required: [true, 'Please provide a code for coupon'],
			unique: true,
		},
		sale: {
			type: Number,
			required: [true, 'Please provide a sale amount for coupon'],
		},
		orders: {
			type: [
				{
					type: ObjectId,
					ref: 'Order',
				},
			],
		},
		expireAt: {
			type: Date,
			default: dayjs().add(1, 'd'),
		},
	},
	{
		timestamps: true,
	}
);

const Coupon = model('Coupon', couponSchema);
export default Coupon;
