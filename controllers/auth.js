import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import User from '../models/user.js';
import CustomError from '../errors/index.js';
import createTokenUser from '../utils/createToken.js';
import sendEmail from '../utils/email.js';
import {
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} from '../constants/index.js';

// REGISTER USER #####################
export const register = async (req, res) => {
  const { email, name, password } = req.body;

  const emailUser = await User.findOne({ email });

  if (emailUser) {
    throw new CustomError.BadRequestError('Email is already taken');
  }

  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? 'admin' : 'user';

  const user = await User.create({ email, name, password, role });

  const tokenUser = createTokenUser(user);
  const accessToken = jwt.sign(tokenUser, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '30m',
  });
  const refreshToken = jwt.sign(tokenUser, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '1d',
  });

  // Create secure cookies
  res.cookie(
    process.env.REFRESH_TOKEN_NAME,
    refreshToken,
    REFRESH_COOKIE_OPTIONS
  );

  res.status(StatusCodes.CREATED).json({ user: tokenUser, accessToken });
};

// LOGIN USER ########################
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError.BadRequestError('Please provide email and password');
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.UnauthenticatedError('Invalid Credentials');
  }

  const isPasswordMatches = await user.comparePassword(password);

  if (!isPasswordMatches) {
    throw new CustomError.UnauthenticatedError('Invalid Credentials');
  }

  if (user.blocked) {
    throw new CustomError.UnauthenticatedError('You are banned from admin');
  }

  const tokenUser = createTokenUser(user);
  const accessToken = jwt.sign(tokenUser, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '30m',
  });
  const refreshToken = jwt.sign(tokenUser, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '1d',
  });

  // Create secure cookies
  res.cookie(
    process.env.REFRESH_TOKEN_NAME,
    refreshToken,
    REFRESH_COOKIE_OPTIONS
  );

  res.status(StatusCodes.OK).json({ user: tokenUser, accessToken });
};

// REFRESH TOKEN #####################
export const refresh = async (req, res) => {
  const cookies = req.cookies;
  // console.log({ cookies: req.cookies });
  if (!cookies[process.env.REFRESH_TOKEN_NAME])
    throw new CustomError.UnauthenticatedError(
      'Unauthorized you do not have a cookie'
    );

  const refreshToken = cookies[process.env.REFRESH_TOKEN_NAME];

  try {
    const { _id: userId } = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(userId);
    if (!user) throw new CustomError.UnauthenticatedError('Unauthorized');

    const tokenUser = createTokenUser(user);
    const accessToken = jwt.sign(tokenUser, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '30m',
    });

    return res.json({ accessToken });
  } catch (error) {
    throw new CustomError.UnauthorizedError(`Forbidden ${error.message}`);
  }
};

// LOGOUT ############################
export const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies[process.env.REFRESH_TOKEN_NAME])
    return res.status(StatusCodes.NO_CONTENT).json({ message: 'No content' });
  res.clearCookie(process.env.REFRESH_TOKEN_NAME);
  res.json({ message: 'Cookie cleared' });
};

// FORGOT PASSWORD ########################################
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new CustomError.BadRequestError('Please provide email address');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError.NotFoundError(
      'There is no User with this email address'
    );
  }

  const resetToken = user.createResetPasswordToken();
  await user.save();

  const resetUrl = `${process.env.ORIGIN}/reset-password/${resetToken}`;

  const message = `message`;

  try {
    await sendEmail({
      to: email,
      subject: 'Your Password Reset token (valid for 10 minutes)',
      message,
      html: `<a href="${resetUrl}"></a>`,
    });

    res.status(StatusCodes.OK).json({ msg: 'Token sent to email' });
  } catch (error) {
    console.log(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiration = undefined;
    await user.save();
    throw new CustomError.CustomAPIError(
      'There was an Error sending email address'
    );
  }
};

// RESET PASSWORD ########################################
export const resetPassword = async (req, res) => {
  const { password, confirmPassword } = req.body;
  const matched = password === confirmPassword;
  if (!matched) {
    throw new CustomError.BadRequestError('Passwords do not match');
  }

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordTokenExpiration: { $gt: Date.now() },
  });

  if (!user) {
    throw new CustomError.BadRequestError('Token is invalid or has expired');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpiration = undefined;
  await user.save();

  // const tokenUser = createTokenUser(user);
  // const accessToken = jwt.sign(tokenUser, process.env.ACCESS_TOKEN_SECRET, {
  //   expiresIn: '30m',
  // });
  // const refreshToken = jwt.sign(tokenUser, process.env.REFRESH_TOKEN_SECRET, {
  //   expiresIn: '1d',
  // });

  // // Create secure cookies
  // res.cookie(
  //   process.env.REFRESH_TOKEN_NAME,
  //   refreshToken,
  //   REFRESH_COOKIE_OPTIONS
  // );

  // res.status(StatusCodes.OK).json({ user: tokenUser, accessToken });
  res.status(StatusCodes.OK).json({ msg: 'Password updated succussfully' });
};
