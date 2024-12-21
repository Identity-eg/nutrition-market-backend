import { StatusCodes } from 'http-status-codes';
import User from '../models/user.js';
import CustomError from '../errors/index.js';
import { checkPermissions } from '../utils/index.js';
import chechPermissions from '../utils/checkPermissions.js';

export const getAllUsers = async (req, res) => {
	let { name, role, blocked, page = 1, limit = 10 } = req.query;

	let skip = (Number(page) - 1) * Number(limit);
	let queryObject = {};

	if (name) {
		queryObject.name = { $regex: name, $options: 'i' };
	}

	if (role) {
		queryObject.role = role;
	}

	if (blocked !== undefined) {
		queryObject.blocked = blocked;
	}

	const users = await User.find(queryObject)
		.skip(skip)
		.limit(limit)
		.select('-password')
		.exec();

	const usersCount = await User.countDocuments(queryObject);
	const lastPage = Math.ceil(usersCount / limit);

	res.status(StatusCodes.OK).json({
		totalCount: usersCount,
		currentPage: Number(page),
		lastPage,
		users,
	});
};

// GET SINGLE USER ####################################
export const getSingleUser = async (req, res) => {
	const user = await User.findOne({ _id: req.params.id }).select('-password');
	if (!user) {
		throw new CustomError.NotFoundError(`No user with id : ${req.params.id}`);
	}
	checkPermissions(req.user, user._id);
	res.status(StatusCodes.OK).json({ user });
};

// GET SINGLE USER ####################################
export const getUserForOtp = async (req, res) => {
	const user = await User.findOne({
		_id: req.params.id,
		otpExpires: { $gt: Date.now() },
	}).select(['email']);

	if (!user) {
		throw new CustomError.NotFoundError(`No user with id : ${req.params.id}`);
	}
	res.status(StatusCodes.OK).json({ user });
};

// GET ME #############################################
export const showCurrentUser = async (req, res) => {
	const user = await User.findById(req.user._id)
		.select('-password')
		.populate('company');
	res.status(StatusCodes.OK).json({ user });
};

// UPDATE USER ########################################
export const updateUser = async (req, res) => {
	const { id } = req.params;
	const { email, firstName, lastName, mobileNumber } = req.body;

	chechPermissions(req.user, id);

	const updatedUser = await User.findOneAndUpdate(
		{ _id: id },
		{ email, firstName, lastName, mobileNumber },
		{ runValidators: true }
	);
	res
		.status(StatusCodes.OK)
		.json({ msg: 'User updated successfully', user: updatedUser });
};

// BLOCK USER #########################################
export const blockUser = async (req, res) => {
	const { id, blocked } = req.body;

	await User.findOneAndUpdate(
		{ _id: id },
		{ blocked },
		{ runValidators: true }
	);

	res.status(StatusCodes.OK).json({ msg: 'User updated successfully' });
};

// UPDATE USER PASSWORD ###############################

export const updateUserPassword = async (req, res) => {
	const { oldPassword, newPassword } = req.body;
	if (!oldPassword || !newPassword) {
		throw new CustomError.BadRequestError('Please provide both values');
	}
	const user = await User.findById(req.user._id);

	const isPasswordCorrect = await user.comparePassword(oldPassword);
	if (!isPasswordCorrect) {
		throw new CustomError.UnauthenticatedError('Invalid Credentials');
	}
	user.password = newPassword;
	await user.save();

	res.status(StatusCodes.OK).json({ msg: 'Success! Password Updated.' });
};
