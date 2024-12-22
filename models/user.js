import mongoose from 'mongoose';
import pkg from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { USER_ROLES } from '../constants/index.js';
import generateOtp from '../utils/generateOtp.js';

const { model, Schema } = mongoose;
const { ObjectId } = Schema.Types;
const { isEmail } = pkg;

const userSchema = new Schema(
	{
		googleId: String,
		firstName: {
			type: String,
			required: [true, 'Please provide a first name'],
			minlength: [2, 'First name must be at least 2 characters'],
			maxlength: 20,
		},
		lastName: {
			type: String,
			required: [true, 'Please provide a last name'],
			minlength: [2, 'Last name must be at least 2 characters'],
			maxlength: 20,
		},
		email: {
			type: String,
			required: [true, 'Please provide an email'],
			unique: true,
			lowercase: true,
			validate: [isEmail, 'Please provide a valid email'],
		},
		mobileNumber: {
			type: String,
			minlength: [
				11,
				'Please provide a valid mobile number starts with 01 and eleven number',
			],
			maxlength: [
				11,
				'Please provide a valid mobile number starts with 01 and eleven number',
			],
		},
		password: {
			type: String,
			required: [
				function () {
					return !this.googleId; // Password is required only if googleId is not provided
				},
				'Please provide a password',
			],
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
		isVerified: {
			type: Boolean,
			default: false,
		},
		ordersCount: { type: Number, default: 0 },
		purchasedProducts: {
			type: [
				{
					type: ObjectId,
					ref: 'Product',
				},
			],
			default: [],
		},

		otp: String,
		otpExpires: Date,

		resetPasswordToken: String,
		resetPasswordTokenExpiration: Date,
	},
	{
		methods: {
			comparePassword: async function (enteredPassword) {
				return bcrypt.compare(enteredPassword, this.password);
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
			createOtp: function () {
				const otp = generateOtp();
				this.otp = otp;
				this.otpExpires = Date.now() + 3 * 60 * 1000;
				return otp;
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

userSchema.pre('save', async function (next) {
	// console.log('this.modifiedPaths()', this.modifiedPaths());
	if (!this.isModified('password')) return next();
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

const User = model('User', userSchema);
export default User;
