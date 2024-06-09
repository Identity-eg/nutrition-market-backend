import jwt from 'jsonwebtoken';

export const attachCookiesToResponse = ({ res, user }) => {
  const accessToken = jwt.sign(
    user,
    process.env.ACCESS_TOKEN_SECRET,
    {expiresIn: '10s'},
  );

  const oneDay = 1000 * 60 * 60 * 24;

  res.cookie('ishop-token', accessToken, {
    httpOnly: true,
    // sameSite: 'None',
    expires: new Date(Date.now() + oneDay),
    // secure: true,
  });
};
