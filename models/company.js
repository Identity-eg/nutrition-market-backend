import mongoose from 'mongoose';

const { model, Schema } = mongoose;

const companySchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide company name'],
  },
  slug: {
    type: String,
    unique: true,
    required: true,
  },
  productsCount: { type: Number, default: 0 },
});

const Company = model('Company', companySchema);
export default Company;
