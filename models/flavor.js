import mongoose from 'mongoose';

const { model, Schema } = mongoose;

const flavorSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide flavor name'],
  },
  slug: {
    type: String,
    unique: true,
    required: true,
  },
  // productsCount: { type: Number, default: 0 },
});

const Flavor = model('Flavor', flavorSchema);
export default Flavor;
