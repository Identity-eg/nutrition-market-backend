import mongoose from 'mongoose';
import pkg from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { USER_ROLES } from '../constants/index.js';

const { model, Schema } = mongoose;
const { ObjectId } = Schema.Types;
const { isEmail } = pkg;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please provide a first name'],
      minlength: 3,
      maxlength: 20,
    },
    lastName: {
      type: String,
      required: [true, 'Please provide a last name'],
      minlength: 3,
      maxlength: 20,
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

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

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
