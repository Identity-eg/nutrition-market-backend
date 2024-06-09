import mongoose from 'mongoose';

const { model, Schema } = mongoose;
const { ObjectId } = Schema.Types;

const reviewSchema = new Schema(
  {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Please provide rating'],
    },
    comment: {
      type: String,
      required: [true, 'Please provide review text'],
    },
    user: {
      type: ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: ObjectId,
      ref: 'Product',
      required: true,
    },
  },
  {
    statics: {
      calculateAverageRating: async function (productId) {
        const result = await this.aggregate([
          { $match: { product: productId } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              numReviews: { $sum: 1 },
            },
          },
        ]);

        try {
          await this.model('Product').findOneAndUpdate(
            { _id: productId },
            {
              averageRating: result[0]?.averageRating || 0,
              numReviews: result[0]?.numReviews || 0,
            }
          );
        } catch (error) {
          console.log(error);
        }
      },
    },
    timestamps: true,
  }
);
// to make sure the user can leave only one review per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

reviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.product);
});

reviewSchema.post('remove', async function () {
  await this.constructor.calculateAverageRating(this.product);
});

const Review = model('Review', reviewSchema)
export default Review;
