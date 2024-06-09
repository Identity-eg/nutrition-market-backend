import mongoose from 'mongoose';
import { countProductsByCategory } from '../middlewares/aggregations.js';

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
      unique: true,
      required: [true, 'Please provide product slug'],
    },
    description: {
      type: String,
      required: [true, 'Please provide product description'],
    },
    nutritionFacts: {
      type: String,
      required: [true, "Please provide product's nutrition Facts"],
    },
    images: {
      type: [
        {
          url: String,
          name: String,
          size: Number,
        },
      ],
      required: [true, 'Please provide product image'],
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
      type: String,
      enum: ['polygon', 'biovac', 'test'],
      required: [true, 'Please provide product company'],
    },
    itemForm: {
      type: String,
      enum: ['tablets', 'capsules', 'liquid', 'powders', 'oral', 'injection'],
      required: [true, 'Please provide product Form'],
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide product quantity'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide product price'],
    },
    // itemUnits: Schema.Types.Mixed,
    freeShipping: {
      type: Boolean,
      default: false,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    priceAfterDiscount: {
      type: Number,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    sold: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
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
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  justOne: false,
});

productSchema.post(
  ['save', 'deleteOne', 'findOneAndUpdate'],
  async function () {
    await countProductsByCategory();
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
