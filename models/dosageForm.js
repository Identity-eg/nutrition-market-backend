import mongoose from 'mongoose';

const { model, Schema } = mongoose;

const dosageFormSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide dosageForm name'],
  },
  slug: {
    type: String,
    unique: true,
    required: true,
  },
  productsCount: { type: Number, default: 0 },
});

const DosageForm = model('DosageForm', dosageFormSchema);
export default DosageForm;
