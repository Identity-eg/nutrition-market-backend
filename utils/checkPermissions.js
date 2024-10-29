import { USER_ROLES } from '../constants/index.js';
import CustomError from '../errors/index.js';

const chechPermissions = (requestUser, resourceUserId) => {
	// console.log('requestUser', requestUser);
	// console.log(typeof resourceUserId);
	if (requestUser.role === USER_ROLES.superAdmin) return;
	if (requestUser._id === resourceUserId.toString()) return;
	throw new CustomError.UnauthorizedError(
		'Not authorized to access this route'
	);
};

export default chechPermissions;
