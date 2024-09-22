import mongoose from 'mongoose';
import {
  countProductsByCategory,
  countProductsByCompany,
  countProductsByDosageForm,
} from '../middlewares/aggregations.js';

const { model, Schema } = mongoose;
const { ObjectId } = Schema.Types;

const productSchema = new Schema(
  {
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
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Please provide at least 1 variant',
      },
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
      // countByCategory: async function () {
      //   const result = await this.aggregate([
      //     { $unwind: '$category' },
      //     {
      //       $group: {
      //         _id: '$category',
      //         count: { $sum: 1 },
      //       },
      //     },
      //   ]);
      //   // console.log('result', result);
      //   try {
      //     result.forEach(async (cat) => {
      //       const category = await this.model('Category').findById(cat._id);
      //       category.productsCount = cat?.count ?? 0;
      //       await category.save();
      //     });
      //   } catch (error) {
      //     console.log(error);
      //   }
      // },
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

// Set property(reviews) to product object when create it
// productSchema.virtual('reviews', {
//   ref: 'Review',
//   localField: '_id',
//   foreignField: 'product',
//   justOne: false,
// });

productSchema.post(
  ['save', 'deleteOne', 'findOneAndUpdate'],
  async function () {
    await countProductsByCategory();
    await countProductsByCompany();
    await countProductsByDosageForm();
  }
);

productSchema.pre('remove', async function () {
  // delete all reviews related to this product
  await this.model('Review').deleteMany({ product: this._id });
  // delete all carts related to this product
  // await this.model('Cart')
});

const Product = model('Product', productSchema);
export default Product;
