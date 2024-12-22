import jwt from 'jsonwebtoken';

const createTokenUser = user => ({
	fullName: user.fullName,
	email: user.email,
	role: user.role,
	_id: user._id,
	...(user.company && { company: user.company }),
});

export const createAccessToken = user =>
	jwt.sign(createTokenUser(user), process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: '1d',
	});

export const createRefreshToken = user =>
	jwt.sign(createTokenUser(user), process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: '2d',
	});
