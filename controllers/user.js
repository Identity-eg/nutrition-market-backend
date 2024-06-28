import { StatusCodes } from 'http-status-codes';
import User from '../models/user.js';
import CustomError from '../errors/index.js';
import { checkPermissions } from '../utils/index.js';
import chechPermissions from '../utils/checkPermissions.js';

export const getAllUsers = async (req, res) => {
  let { name, blocked, page = 1, limit = 10 } = req.query;

  let skip = (Number(page) - 1) * Number(limit);
  let queryObject = { role: 'user', ...req.query };

  // Name
  if (queryObject.name) {
    queryObject.name = { $regex: name, $options: 'i' };
  }
  // Blocked
  if (queryObject.blocked) {
    console.log(blocked);
    const arrOfBoolean = Array.isArray(blocked)
      ? blocked.map((b) => (b === 'blocked' ? true : false))
      : blocked === 'blocked'
      ? true
      : false;

    console.log(arrOfBoolean);
    queryObject.blocked = { $in: arrOfBoolean };
  }

  // Pagination
  delete queryObject.page;
  delete queryObject.limit;

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

// ADD ADDRESS  #######################################
export const addAddress = async (req, res) => {
  const { city, state, street, userId } = req.body;

  const resourceId = userId ?? req.user._id;

  chechPermissions(req.user, resourceId);

  await User.findOneAndUpdate(
    { _id: resourceId },
    { $push: { addresses: { city, state, street } } },
    { runValidators: true }
  );
  res.status(StatusCodes.OK).json({ msg: 'Address added successfully' });
};

// GET ME #############################################
export const showCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json({ user: req.user });
};

// UPDATE USER ########################################
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, name } = req.body;

  chechPermissions(req.user, id);

  const updatedUser = await User.findOneAndUpdate(
    { _id: id },
    { email, name },
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
