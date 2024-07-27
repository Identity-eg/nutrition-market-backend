import mongoose from 'mongoose';

const { model, Schema } = mongoose;
const { ObjectId } = Schema.Types;

const variantSchema = new Schema(
  {
    product: {
      type: ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: Number,
    },
    size: { type: Number },
    flavor: {
      type: String,
    },
    price: {
      type: Number,
      required: [true, 'Please provide product size'],
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
  },
  {
    timestamps: true,
  }
);

const Variant = model('Variant', variantSchema);
export default Variant;
