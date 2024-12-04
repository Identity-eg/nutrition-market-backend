import mongoose from 'mongoose';

const { model, Schema } = mongoose;
const { ObjectId } = Schema.Types;

const subscriptionSchema = new Schema(
	{
		product: { type: ObjectId, ref: 'Product' },
		frequency: {
			type: [String],
			enum: ['30 days', '60 days', '90 days'],
			required: [true, 'Please provide a frequence'],
		},
		sale: {
			type: Number,
			required: [true, 'Please provide a sale amount for subscription'],
		},
	},
	{
		timestamps: true,
	}
);

const Subscription = model('Subscription', subscriptionSchema);
export default Subscription;
