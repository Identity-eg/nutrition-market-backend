import mongoose from 'mongoose';

const { model, Schema } = mongoose;
const { ObjectId } = Schema.Types;

const imageSchema = new Schema({
  image: {
    type: {
      url: String,
      name: String,
      size: Number,
    },
    required: [true, 'Please provide product image'],
  },
  title: String,
  description: String,
  path: {
    type: String,
    required: [true, 'Please provide image path'],
    enum: ['hero'],
  },
  relatedProduct: {
    type: ObjectId,
    ref: 'Product',
  },
});

const Image = model('Image', imageSchema);
export default Image;
