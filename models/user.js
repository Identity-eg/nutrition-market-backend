import mongoose from 'mongoose';
import pkg from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { USER_ROLES } from '../constants/index.js';

const { model, Schema } = mongoose;
const { ObjectId } = Schema.Types;
const { isEmail } = pkg;

const AddressSchema = new Schema({
  firstName: {
    type: String,
    required: [true, 'Please provide an firstName'],
    minlength: 3,
  },
  lastName: {
    type: String,
    required: [true, 'Please provide an lastName'],
    minlength: 3,
  },
  phone: {
    type: Number,
    required: [true, 'Please provide an lastName'],
  },
  additionalPhone: {
    type: Number,
  },
  governorate: {
    type: String,
    required: [true, 'Please provide an governorate'],
    minlength: 3,
  },
  district: {
    type: String,
    required: [true, 'Please provide an district'],
    minlength: 3,
  },
  street: {
    type: String,
    required: [true, 'Please provide an street'],
    minlength: 3,
  },
  buildingNo: {
    type: String,
    required: [true, 'Please provide an building Number'],
  },
  floor: {
    type: String,
    required: [true, 'Please provide an floor'],
  },
});

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an username'],
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      validate: [isEmail, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password cannot be lower than 6 character'],
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.user,
    },
    company: {
      type: ObjectId,
      ref: 'Company',
      required: [
        function () {
          return this.role === USER_ROLES.admin;
        },
        'Please provide admin company',
      ],
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
