import CustomError from '../errors/index.js';
import { USER_ROLES } from '../constants/index.js';

export const authorizeCompany = ({ admin, productCompany }) => {
	if (admin.role === USER_ROLES.superAdmin) return;
	if (admin.company.toString() === productCompany.toString()) return;
	throw new CustomError.UnauthorizedError('Unauthorized to do this action');
};
