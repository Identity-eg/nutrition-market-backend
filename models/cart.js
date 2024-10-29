import mongoose from 'mongoose';
import dayjs from 'dayjs';

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
					required: true,
				},
				variant: {
					type: Schema.Types.ObjectId,
					ref: 'Variant',
					required: true,
				},
				amount: {
					type: Number,
					default: 1,
				},
				totalProductPrice: {
					type: Number,
					required: true,
				},
			},
		],
		totalItems: {
			type: Number,
			default: 1,
		},
		totalPrice: {
			type: Number,
			required: true,
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

const Cart = model('Cart', cartSchema);
export default Cart;
