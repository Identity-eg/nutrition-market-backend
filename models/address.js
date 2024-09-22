import mongoose from 'mongoose';

const { model, Schema } = mongoose;

const address = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide user'],
  },

  firstName: {
    type: String,
    required: [true, 'Please provide first name'],
  },

  lastName: {
    type: String,
    required: [true, 'Please provide last name'],
  },

  email: {
    type: String,
    required: [true, 'Please provide email'],
  },

  governorate: {
    type: String,
    required: [true, 'Please provide governorate'],
  },
  city: {
    type: String,
    required: [true, 'Please provide city'],
  },

  phone: {
    type: Number,
    required: [true, 'Please provide phone'],
  },

  additionalPhone: {
    type: Number,
    required: [true, 'Please provide additional phone'],
  },

  street: {
    type: String,
    required: [true, 'Please provide street'],
  },

  buildingNo: {
    type: String,
    required: [true, 'Please provide building number'],
  },
  floor: {
    type: String,
  },
});

const Address = model('Address', address);
export default Address;
