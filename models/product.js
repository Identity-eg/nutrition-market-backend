import mongoose from 'mongoose';
import Company from './company.js';
import DosageForm from './dosageForm.js';
import Category from './category.js';

const { model, Schema } = mongoose;
const { ObjectId } = Schema.Types;

const productSchema = new Schema(
	{
		name: {
			type: String,
			required: [true, 'Please provide product name'],
			maxlength: [100, 'Name can not be more than 100 characters'],
		},
		slug: {
			type: String,
			required: [true, 'Please provide product slug'],
			unique: [true, 'Product name already exists'],
		},
		description: {
			type: String,
			required: [true, 'Please provide product description'],
		},
		nutritionFacts: {
			type: {
				servingSize: String,
				servingPerContainer: String,
				ingredients: [
					{
						name: String,
						amountPerServing: String,
						dailyValue: String,
					},
				],
				otherIngredients: [{ name: String }],
			},
			required: [true, "Please provide product's nutrition Facts"],
		},
		category: {
			type: [
				{
					type: ObjectId,
					ref: 'Category',
				},
			],
			required: [true, 'Please provide product category'],
		},
		company: {
			type: ObjectId,
			ref: 'Company',
			required: [true, 'Please provide product company'],
		},
		dosageForm: {
			type: ObjectId,
			ref: 'DosageForm',
			required: [true, 'Please provide product Form'],
		},
		variants: {
			type: [
				{
					type: ObjectId,
					ref: 'Variant',
				},
			],
			default: [],
		},
		directionOfUse: {
			type: String,
			required: [true, 'Please provide product Direction Of Use'],
		},
		warnings: {
			type: String,
		},
		storageConditions: {
			type: String,
		},
		NFSA_REG_NO: {
			type: String,
		},
		numReviews: {
			type: Number,
			default: 0,
		},
		averageRating: {
			type: Number,
			default: 0,
		},
		featured: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
		// toJSON: { virtuals: true },
		// toObject: { virtuals: true },
		statics: {
			countByCategory: async function ({ session }) {
				const result = await this.aggregate([
					{ $unwind: '$category' },
					{
						$group: {
							_id: '$category',
							count: { $sum: 1 },
						},
					},
				]).session(session);

				await Promise.all(
					result.map(async cat => {
						const category = await Category.findById(cat._id);
						category.productsCount = cat?.count ?? 0;
						return category.save({ session });
					})
				);

				await Category.updateMany(
					{ _id: { $nin: result.map(r => r._id) } },
					[
						{
							$set: {
								productsCount: 0,
							},
						},
					],
					{ session }
				);
			},
			countByCompany: async function ({ session }) {
				const result = await this.aggregate([
					{
						$group: {
							_id: '$company',
							count: { $sum: 1 },
						},
					},
				]).session(session);

				await Promise.all(
					result.map(async com => {
						const company = await Company.findById(com._id);
						company.productsCount = com?.count ?? 0;
						await company.save({ session });
					})
				);

				await Company.updateMany(
					{ _id: { $nin: result.map(r => r._id) } },
					[
						{
							$set: {
								productsCount: 0,
							},
						},
					],
					{ session }
				);
			},
			countByDosageForm: async function ({ session }) {
				const result = await this.aggregate([
					{
						$group: {
							_id: '$dosageForm',
							count: { $sum: 1 },
						},
					},
				]).session(session);

				await Promise.all(
					result.map(async form => {
						const dosageForm = await DosageForm.findById(form._id);
						dosageForm.productsCount = form?.count ?? 0;
						return dosageForm.save({ session });
					})
				);

				await DosageForm.updateMany(
					{ _id: { $nin: result.map(r => r._id) } },
					[
						{
							$set: {
								productsCount: 0,
							},
						},
					],
					{ session }
				);
			},
			// countBySubCategory: async function (subCategoryId) {
			//   const result = await this.aggregate([
			//     { $match: { subCategory: subCategoryId } },
			//     {
			//       $group: {
			//         _id: null,
			//         count: { $sum: 1 },
			//       },
			//     },
			//   ]);
			//   try {
			//     const sub = await this.model('SubCategory').findById(subCategoryId);
			//     sub.productsCount = result[0]?.count ?? 0;
			//     await sub.save();
			//   } catch (error) {
			//     console.log(error);
			//   }
			// },
		},
	}
);

const Product = model('Product', productSchema);
export default Product;
