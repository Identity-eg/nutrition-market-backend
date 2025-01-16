import mongoose from 'mongoose';

const { model, Schema } = mongoose;

const companySchema = new Schema(
	{
		name_en: {
			type: String,
			required: [true, 'Please provide company English name'],
		},
		name_ar: {
			type: String,
			required: [true, 'Please provide company Arabic name'],
		},
		slug: {
			type: String,
			unique: true,
			required: true,
		},
		description_en: {
			type: String,
			required: [true, 'Please provide company English description'],
		},
		description_ar: {
			type: String,
			required: [true, 'Please provide company Arabic description'],
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
