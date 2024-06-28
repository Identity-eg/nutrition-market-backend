import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import User from '../models/user.js';
import CustomError from '../errors/index.js';
import createTokenUser from '../utils/createToken.js';
import sendEmail from '../utils/email.js';

// REGISTER USER #####################
export const register = async (req, res) => {
  const { email, name, password } = req.body;

  const emailUser = await User.findOne({ email });

  if (emailUser) {
    throw new CustomError.BadRequestError('Email is already taken');
  }
  // first registered user is an admin
  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? 'admin' : 'user';

  // Create the user
  const user = await User.create({ email, name, password, role });
  // Create Token User
  const tokenUser = createTokenUser(user);
  const accessToken = jwt.sign(tokenUser, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '30m',
  });
  const refreshToken = jwt.sign(tokenUser, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '1d',
  });

  // Create secure cookie with refresh token
  res.cookie('ishop-refresh-token', refreshToken, {
    httpOnly: true, //accessible only by web server
    sameSite: 'None',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24, //cookie expiry: set to match rT
  });

  // Return the user
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

  // Create secure cookie with refresh token
  res.cookie('ishop-refresh-token', refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24, //cookie expiry: set to match refresh Token
  });

  res.status(StatusCodes.OK).json({ user: tokenUser, accessToken });
};

// REFRESH TOKEN #####################
export const refresh = async (req, res) => {
  const cookies = req.cookies;
  // console.log({ cookies: req.cookies });
  if (!cookies['ishop-refresh-token'])
    throw new CustomError.UnauthenticatedError(
      'Unauthorized you do not have a cookie'
    );

  const refreshToken = cookies['ishop-refresh-token'];

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
  if (!cookies['ishop-refresh-token'])
    return res.status(StatusCodes.NO_CONTENT).json({ message: 'No content' });
  res.clearCookie('ishop-refresh-token', {
    httpOnly: true,
    sameSite: false,
    secure: process.env.NODE_ENV === 'production',
  });
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

  const message = `message ${resetUrl}`;

  try {
    await sendEmail({
      to: email,
      subject: 'Your Password Reset token (valid for 10 minutes)',
      message,
    });

    res.status(StatusCodes.OK).json({ msg: 'Token sent to email' });
  } catch (error) {
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

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpiration = undefined;
  await user.save();
  
  const tokenUser = createTokenUser(user);
  const accessToken = jwt.sign(tokenUser, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '30m',
  });
  const refreshToken = jwt.sign(tokenUser, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '1d',
  });

  // Create secure cookie with refresh token
  res.cookie('ishop-refresh-token', refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24, //cookie expiry: set to match refresh Token
  });

  res.status(StatusCodes.OK).json({ user: tokenUser, accessToken });
};
