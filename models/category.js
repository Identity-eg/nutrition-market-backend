import mongoose from 'mongoose';

const { model, Schema } = mongoose;

const categorySchema = new Schema({
	name: {
		type: String,
		required: [true, 'Please provide category name'],
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
