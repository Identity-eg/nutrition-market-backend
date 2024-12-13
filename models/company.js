import mongoose from 'mongoose';

const { model, Schema } = mongoose;

const companySchema = new Schema(
	{
		name: {
			type: String,
			required: [true, 'Please provide company name'],
		},
		slug: {
			type: String,
			unique: true,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		logo: {
			type: {
				url: String,
				name: String,
				size: Number,
			},
		},
		cover: {
			type: {
				url: String,
				name: String,
				size: Number,
			},
		},
		ordersCount: { type: Number, default: 0 },
		productsCount: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

const Company = model('Company', companySchema);
export default Company;
