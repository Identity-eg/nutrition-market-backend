import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import User from '../models/user.js';
import Company from '../models/company.js';
import CustomError from '../errors/index.js';
import createTokenUser from '../utils/createToken.js';
import sendEmail from '../utils/email.js';
import {
  REFRESH_COOKIE_OPTIONS,
  USER_ROLES,
  usersAllowedToAccessDashboard,
} from '../constants/index.js';

// REGISTER USER #####################
export const register = async (req, res) => {
  const { email, name, password, company } = req.body;

  const emailUser = await User.findOne({ email });

  if (emailUser) {
    throw new CustomError.BadRequestError('Email is already taken');
  }

  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? USER_ROLES.superAdmin : req.body.role;

  const userToBeCreated = {
    email,
    name,
    password,
    role,
    ...(company && { company }),
  };
  const user = await User.create(userToBeCreated);

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

  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    ordersCount: user.ordersCount,
    addresses: user.addresses,
  };
  res.status(StatusCodes.CREATED).json({ user: userResponse, accessToken });
};

// LOGIN USER ########################
export const login = async (req, res) => {
  const { email, password } = req.body;
  const comingFromDashboard =
    req.headers['api-key'] &&
    req.headers['api-key'] === process.env.DASHBOARD_API_KEY;

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

  let userCompany = undefined;
  if (comingFromDashboard) {
    if (!usersAllowedToAccessDashboard.includes(user.role)) {
      throw new CustomError.UnauthenticatedError(
        'Forbidden to access dashboard'
      );
    }
    if (user.role === USER_ROLES.admin) {
      const company = await Company.findById(user.company);
      userCompany = company;
    }
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
    comingFromDashboard
      ? process.env.REFRESH_TOKEN_ADMIN_NAME
      : process.env.REFRESH_TOKEN_NAME,
    refreshToken,
    REFRESH_COOKIE_OPTIONS
  );

  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    ordersCount: user.ordersCount,
    addresses: user.addresses,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    ...(userCompany && { company: userCompany }),
  };
  res
    .status(StatusCodes.OK)
    .json({ user: userResponse, accessToken, refreshToken });
};

// REFRESH TOKEN #####################
export const refresh = async (req, res) => {
  const comingFromDashboard =
    req.headers['api-key'] &&
    req.headers['api-key'] === process.env.DASHBOARD_API_KEY;
  const refreshTokenName = comingFromDashboard
    ? process.env.REFRESH_TOKEN_ADMIN_NAME
    : process.env.REFRESH_TOKEN_NAME;
  const cookies = req.cookies;
  // console.log({ cookies: req.cookies });
  if (!cookies[refreshTokenName])
    throw new CustomError.UnauthenticatedError(
      'Unauthorized you do not have a cookie'
    );

  const refreshToken = cookies[refreshTokenName];

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

    let userCompany = undefined;
    if (user.role === USER_ROLES.admin) {
      const company = await Company.findById(user.company);
      userCompany = company;
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      ordersCount: user.ordersCount,
      addresses: user.addresses,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...(userCompany && { company: userCompany }),
    };

    return res.json({ accessToken, user: userResponse });
  } catch (error) {
    throw new CustomError.UnauthorizedError(`Forbidden ${error.message}`);
  }
};

// LOGOUT ############################
export const logout = (req, res) => {
  const comingFromDashboard =
    req.headers['api-key'] &&
    req.headers['api-key'] === process.env.DASHBOARD_API_KEY;

  const refreshTokenName = comingFromDashboard
    ? process.env.REFRESH_TOKEN_ADMIN_NAME
    : process.env.REFRESH_TOKEN_NAME;
  const cookies = req.cookies;

  if (!cookies[refreshTokenName])
    return res.status(StatusCodes.NO_CONTENT).json({ message: 'No content' });
  res.clearCookie(refreshTokenName);
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
