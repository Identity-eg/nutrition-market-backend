export const REFRESH_COOKIE_OPTIONS = {
  domian:
    process.env.NODE_ENV === 'production'
      ? 'supplement-food-backend.vercel.app'
      : 'localhost',
  httpOnly: true, //accessible only by web server
  sameSite: 'None',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 1000 * 60 * 60 * 24, //cookie expiry: set to match refresh Token
};

export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true, //accessible only by web server
  sameSite: 'Strict',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 1000 * 60 * 30, //cookie expiry: set to match access Token
};

export const USER_ROLES = {
  user: 'USER',
  admin: 'ADMIN',
  superAdmin: 'SUPER_ADMIN',
};

export const usersAllowedToAccessDashboard = [
  USER_ROLES.superAdmin,
  USER_ROLES.admin,
];
