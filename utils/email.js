import CustomError from '../errors/index.js';
import { transporter } from '../config/email.config.js';
import { verificationCodeTemplate } from '../constants/emailTemplate.js';

const sendEmail = async options => {
	// const transporter = nodemailer.createTransport({
	// 	host: process.env.EMAIL_SENDER_HOST,
	// 	port: process.env.EMAIL_SENDER_PORT,
	// 	secure: false, // Use `true` for port 465, `false` for all other ports
	// 	auth: {
	// 		user: process.env.EMAIL_SENDER_USERNAME,
	// 		pass: process.env.EMAIL_SENDER_PASSWORD,
	// 	},
	// });

	const mailOptions = {
		from: 'example@gmail.com',
		to: options.to,
		subject: options.subject,
		text: options.message,
		html: options.html,
	};

	await transporter.sendMail(mailOptions);
};

const sendVerificationCode = async (email, code) => {
	const mailOptions = {
		from: 'example@gmail.com',
		to: email,
		subject: 'Verification Code Subject',
		text: 'Verification Code text',
		html: verificationCodeTemplate.replace('{verificationCode}', code),
	};
	try {
		await transporter.sendMail(mailOptions);
	} catch (error) {
		console.log(error);

		throw new CustomError.CustomAPIError(
			'There was an Error sending email address'
		);
	}
};

export { sendEmail, sendVerificationCode };
