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
