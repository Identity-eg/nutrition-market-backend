import mongoose from 'mongoose';

const { model, Schema } = mongoose;

const dosageFormSchema = new Schema({
	name_en: {
		type: String,
		required: [true, 'Please provide dosageForm English name'],
	},
	name_ar: {
		type: String,
		required: [true, 'Please provide dosageForm Arabic name'],
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
