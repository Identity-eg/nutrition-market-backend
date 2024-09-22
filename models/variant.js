import mongoose from 'mongoose';

const { model, Schema } = mongoose;

const variantSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide product name'],
      maxlength: [100, 'Name can not be more than 100 characters'],
    },
    unitCount: {
      type: Number,
      required: [true, 'Please provide product unit count'],
    },
    flavor: {
      type: String,
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide product quantity'],
    },
    sold: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Please provide product price'],
    },
    priceAfterDiscount: {
      type: Number,
    },
    images: {
      type: [
        {
          url: String,
          name: String,
          size: Number,
        },
      ],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Please provide at least 1 image',
      },
    },
  },
  {
    timestamps: true,
  }
);

const Variant = model('Variant', variantSchema);
export default Variant;
