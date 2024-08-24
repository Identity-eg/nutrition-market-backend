import { jwtDecode } from 'jwt-decode';

export function getCredFromCookies(req) {
  const cookies = req.cookies;
  const cartId = cookies['cart_id'] || req.body.cartId;

  const refreshToken =
    cookies[process.env.REFRESH_TOKEN_NAME] || req.body.refreshToken;
  const user = refreshToken ? jwtDecode(refreshToken) : undefined;

  return { user, cartId };
}
