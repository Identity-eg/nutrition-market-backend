import { StatusCodes } from 'http-status-codes';
import Coupon from '../models/coupon.js';
import CustomError from '../errors/index.js';
import Cart from '../models/cart.js';
import dayjs from 'dayjs';
import getCredFromCookies from '../utils/getCredFromCookies.js';

export const createCoupon = async (req, res) => {
	const { code, sale } = req.body;
	const { user } = getCredFromCookies(req);

	const company = user.company;

	const coupon = await Coupon.create({
		company,
		code,
		sale,
	});

	return res.status(StatusCodes.OK).json({ coupon });
};

export const getCoupons = async (req, res) => {
	const { user } = getCredFromCookies(req);

	const company = user.company;

	let queryObject = {};

	if (company) {
		queryObject.company = company;
	}
	const coupons = await Coupon.find(queryObject);

	return res.status(StatusCodes.OK).json({ coupons });
};

export const applyCoupon = async (req, res) => {
	const { cartId, couponCode } = req.body;

	const coupon = await Coupon.findOne({
		code: couponCode,
	});

	if (!coupon) {
		throw new CustomError.NotFoundError(`Coupon is invalid`);
	}
	const isCouponExpired = dayjs().date > coupon.expireAt;

	if (isCouponExpired) {
		throw new CustomError.BadRequestError(`Coupon is invalid`);
	}

	const companyId = coupon.company;
	const cart = await Cart.findById(cartId);

	if (!cart) {
		throw new CustomError.NotFoundError(`No cart found`);
	}

	const isCouponEnteredBefore =
		cart.coupon?.toString() === coupon._id?.toString();

	if (isCouponEnteredBefore) {
		throw new CustomError.BadRequestError(
			`Coupon was entered before for this cart`
		);
	}

	const isCartItemsRelatedToCoupon = cart.items.find(
		item => item.company.toString() === companyId.toString()
	);

	if (!isCartItemsRelatedToCoupon) {
		throw new CustomError.NotFoundError(`Coupon is invalid`);
	}

	cart.coupon = coupon._id;

	await cart.save();

	return res
		.status(StatusCodes.OK)
		.json({ msg: 'Coupon applied successfully!' });
};
