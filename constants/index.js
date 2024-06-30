export const DOSAGE_FORM = [
  'film_coated_tablets',
  'sugar_coated_tablets',
  'effervescent_tablets',
  'chewable_tablets',
  'orally_disintegrating_tablets',
  'sublingual_tablets',
  'soft_gelatin_capsules',
  'hard_gelatin_capsules',
  'liquids',
  'powders',
  'gummies',
  'injections',
];

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true, //accessible only by web server
  sameSite: 'Strict',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 1000 * 60 * 60 * 24, //cookie expiry: set to match refresh Token
};

export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true, //accessible only by web server
  sameSite: 'Strict',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 1000 * 60 * 30, //cookie expiry: set to match access Token
};
