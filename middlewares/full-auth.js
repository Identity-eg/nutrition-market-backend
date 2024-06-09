import CustomError from '../errors/index.js';
import jwt from 'jsonwebtoken';

export const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new CustomError.UnauthenticatedError('Authentication invalid');
  }
  const token = authHeader.split(' ')[1];
// console.log({token});
  if (!token) {
    throw new CustomError.UnauthenticatedError('Authentication invalid');
  }
  
  try {
    const { name, _id, role } = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );
    // console.log({ name, _id, role });
    req.user = { name, _id, role };
    next();
  } catch (error) {
    throw new CustomError.UnauthorizedError(`Forbidden ${error.message}`);
  }
};

export const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new CustomError.UnauthorizedError(
        'Unauthorized to access this route'
      );
    }
    next();
  };
};
