import mongoose from 'mongoose';

const { model, Schema } = mongoose;

const brandSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide brand name'],
  },
  slug: {
    type: String,
    unique: true,
    required: true,
  },
  productsCount: { type: Number, default: 0 },
});

const Brand = model('Brand', brandSchema)
export default Brand;
