import { Resend } from 'resend';
import CustomError from '../errors/index.js';

const resend = new Resend('re_3ataPeJu_QKRRy9N9xRx1YNTBGkMGgsay');

export const sendVerificationCode = async ({
	otp,
	email = 'hady.tawfik1999@gmail.com',
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
