import mongoose from 'mongoose';

const { model, Schema } = mongoose;

const subCategorySchema = new Schema({
  user: {
    type: String,
    required: [true, 'Please provide sub-category name'],
  },
  slug: {
    type: String,
    unique: true,
    required: true,
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please provide sub-category parent'],
  },
  productsCount: { type: Number, default: 0 },
});

const SubCategory = model('SubCategory', subCategorySchema)
export default SubCategory;
