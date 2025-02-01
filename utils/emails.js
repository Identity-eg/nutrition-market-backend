import { Resend } from 'resend';
import CustomError from '../errors/index.js';

// const resend = new Resend('re_3ataPeJu_QKR Ry9N9xRx1YNTBGkMGgsay');

const resend = new Resend('re_DTVZXzXS_CSdjPHVHvSZRVx9F413DcMaV');

export const sendVerificationCode = async ({
	otp,
	email = 'amr86tawfik@gmail.com',
}) => {
	try {
		await resend.emails.send({
			from: 'thenutritionmarket@resend.dev',
			to: [email],
			subject: 'Verification Code',
			html: `Your otp is ${otp} (valid for 3 min)`,
		});
	} catch (error) {
		throw new CustomError.CustomAPIError(error.message);
	}
};

export const sendPasswordResetToken = async ({
	resetUrl,
	email = 'amr86tawfik@gmail.com',
}) => {
	try {
		await resend.emails.send({
			from: 'thenutritionmarket@resend.dev',
			to: [email],
			subject: 'Your Password Reset token (valid for 10 minutes)',
			html: `<p>Your reset token is ${resetUrl} </p>`,
		});
	} catch (error) {
		throw new CustomError.CustomAPIError(error.message);
	}
};
