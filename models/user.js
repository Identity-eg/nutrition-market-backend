import mongoose from 'mongoose';
import pkg from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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
    resetPasswordToken: String,
    resetPasswordTokenExpiration: Date,
  },
  {
    methods: {
      comparePassword: async function (enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
      },
      createResetPasswordToken: function () {
        const resetToken = crypto.randomBytes(32).toString('hex');
        this.resetPasswordToken = crypto
          .createHash('sha256')
          .update(resetToken)
          .digest('hex');

        this.resetPasswordTokenExpiration = Date.now() + 10 * 60 * 1000;
        return resetToken;
      },
    },
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Fire a function before doc saved to db
userSchema.pre('save', async function (next) {
  // console.log('this.modifiedPaths()', this.modifiedPaths());
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = model('User', userSchema);
export default User;
