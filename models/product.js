import mongoose from 'mongoose';
import Company from './company.js';
import DosageForm from './dosageForm.js';
import Category from './category.js';
import Review from './review.js';
import Cart from './cart.js';
import CustomAPIError from '../errors/custom-api.js';

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
      countByCategory: async function () {
        const result = await this.aggregate([
          { $unwind: '$category' },
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 },
            },
          },
        ]);

        try {
          result.forEach(async (cat) => {
            const category = await Category.findById(cat._id);
            category.productsCount = cat?.count ?? 0;
            await category.save();
          });

          await Category.updateMany(
            { _id: { $nin: result.map((r) => r._id) } },
            [
              {
                $set: {
                  productsCount: 0,
                },
              },
            ]
          );
        } catch (error) {
          throw new CustomAPIError.BadRequestError(error);
        }
      },
      countByCompany: async function () {
        const result = await this.aggregate([
          {
            $group: {
              _id: '$company',
              count: { $sum: 1 },
            },
          },
        ]);

        try {
          result.forEach(async (com) => {
            const company = await Company.findById(com._id);
            company.productsCount = com?.count ?? 0;
            await company.save();
          });

          await Company.updateMany(
            { _id: { $nin: result.map((r) => r._id) } },
            [
              {
                $set: {
                  productsCount: 0,
                },
              },
            ]
          );
        } catch (error) {
          throw new CustomAPIError.BadRequestError(error);
        }
      },
      countByDosageForm: async function () {
        const result = await this.aggregate([
          {
            $group: {
              _id: '$dosageForm',
              count: { $sum: 1 },
            },
          },
        ]);

        try {
          result.forEach(async (form) => {
            const dosageForm = await DosageForm.findById(form._id);
            dosageForm.productsCount = form?.count ?? 0;
            await dosageForm.save();
          });

          await DosageForm.updateMany(
            { _id: { $nin: result.map((r) => r._id) } },
            [
              {
                $set: {
                  productsCount: 0,
                },
              },
            ]
          );
        } catch (error) {
          throw new CustomAPIError.BadRequestError(error);
        }
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

// Set property(reviews) to product object when create it
// productSchema.virtual('reviews', {
//   ref: 'Review',
//   localField: '_id',
//   foreignField: 'product',
//   justOne: false,
// });

productSchema.post('save', async function (doc) {
  await Company.findByIdAndUpdate(doc.company, { $inc: { productsCount: 1 } });
  await DosageForm.findByIdAndUpdate(doc.dosageForm, {
    $inc: { productsCount: 1 },
  });
  doc.category.forEach(async function (cat) {
    await Category.findByIdAndUpdate(cat, { $inc: { productsCount: 1 } });
  });
});

productSchema.post(['deleteOne', 'findOneAndUpdate'], function () {
  this.model.countByCategory();
  this.model.countByCompany();
  this.model.countByDosageForm();
});

productSchema.pre(
  'deleteOne',
  { document: false, query: true },
  async function (next) {
    const filter = this.getFilter();
    const productId = filter._id;

    if (productId) {
      await Review.deleteMany({ product: productId });

      // delete related carts as well
      const cartIDs = await Cart.find({ 'items.product': productId }).select(
        '_id'
      );

      cartIDs.map(async (id) => {
        const cart = await Cart.findById(id);
        const deletedItem = cart.items.find(
          (item) => item.product.toString() === productId.toString()
        );

        cart.items = cart.items.filter(
          (item) => item.product.toString() !== productId.toString()
        );
        cart.totalItems -= deletedItem.amount;
        cart.totalPrice -= deletedItem.totalProductPrice;

        if (cart.totalItems === 0) {
          await cart.deleteOne();
        } else {
          await cart.save();
        }
      });
    }

    next();
  }
);

const Product = model('Product', productSchema);
export default Product;
