import mongoose from 'mongoose';

const { model, Schema } = mongoose;

const categorySchema = new Schema({
	name_en: {
		type: String,
		required: [true, 'Please provide category English name'],
	},
	name_ar: {
		type: String,
		required: [true, 'Please provide category Arabic name'],
	},
	slug: {
		type: String,
		unique: true,
		required: true,
	},
	description_en: {
		type: String,
		required: [true, 'Please provide category English description'],
	},
	description_ar: {
		type: String,
		required: [true, 'Please provide category Arabic description'],
	},
	cover: {
		type: {
			url: String,
			name: String,
			size: Number,
		},
		required: true,
	},
	productsCount: { type: Number, default: 0 },
});

const Category = model('Category', categorySchema);
export default Category;
