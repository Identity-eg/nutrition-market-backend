import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_SENDER_HOST,
	port: process.env.EMAIL_SENDER_PORT,
	secure: false, // Use `true` for port 465, `false` for all other ports
	auth: {
		user: process.env.EMAIL_SENDER_USERNAME,
		pass: process.env.EMAIL_SENDER_PASSWORD,
	},
});
