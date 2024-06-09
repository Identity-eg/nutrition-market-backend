import mongoose from 'mongoose';
import pkg from 'validator';
import bcrypt from 'bcryptjs';

const { model, Schema } = mongoose;
const { isEmail } = pkg;

const AddressSchema = new Schema({
  city: String,
  street: String,
  state: String,
});

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter an username'],
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Please enter an email'],
      unique: true,
      lowercase: true,
      validate: [isEmail, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please enter an password'],
      minlength: [6, 'Password cannot be lower than 6 character'],
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    blocked: {
      type: Boolean,
      default: false,
    },
    addresses: [AddressSchema],
    ordersCount: { type: Number, default: 0 },
  },
  {
    methods: {
      comparePassword: async function (enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
      },
    },
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Fire a function before doc saved to db
userSchema.pre('save', async function () {
  // console.log('this.modifiedPaths()', this.modifiedPaths());
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = model('User', userSchema);
export default User;
