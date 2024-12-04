import mongoose from 'mongoose';
import Product from './product.js';

const { model, Schema } = mongoose;
const { ObjectId } = Schema.Types;

const variantSchema = new Schema(
	{
		product: {
			type: ObjectId,
			ref: 'Company',
			required: [true, 'Please provide relevant product'],
		},
		name: {
			type: String,
			maxlength: [100, 'Name can not be more than 100 characters'],
			required: [true, 'Please provide variant name'],
		},
		unitCount: {
			type: Number,
			required: [true, 'Please provide product unit count'],
		},
		flavor: {
			type: String,
		},
		quantity: {
			type: Number,
			required: [true, 'Please provide product quantity'],
		},
		sold: {
			type: Number,
			default: 0,
		},
		price: {
			type: Number,
			required: [true, 'Please provide product price'],
		},
		priceAfterDiscount: {
			type: Number,
		},
		priceAfterSubscription: {
			type: Number,
		},

		images: {
			type: [
				{
					url: String,
					name: String,
					size: Number,
				},
			],
			validate: {
				validator: v => Array.isArray(v) && v.length > 0,
				message: 'Please provide at least 1 image',
			},
		},
	},
	{
		timestamps: true,
	}
);

variantSchema.pre('save', async function (next) {
	if (this.priceAfterSubscription) return;

	const product = await Product.findById(this.product);

	if (!product.isSubscribable) return;

	this.priceAfterSubscription =
		this.price - (this.price * product.subscriptionDiscount) / 100;
	next();
});

const Variant = model('Variant', variantSchema);
export default Variant;
