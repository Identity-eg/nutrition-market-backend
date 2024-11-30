import { StatusCodes } from 'http-status-codes';
import Coupon from '../models/coupon.js';
import CustomError from '../errors/index.js';
import Cart from '../models/cart.js';
import dayjs from 'dayjs';

export const createCoupon = async (req, res) => {
	const { code, sale } = req.body;

	const company = req.user.company || req.body.company;

	const coupon = await Coupon.create({
		company,
		code,
		sale,
	});

	return res.status(StatusCodes.OK).json({ coupon });
};

export const getCoupons = async (req, res) => {
	const company = req.user.company;

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
		throw new CustomError.BadRequestError(`Coupon is expired`);
	}

	const cart = await Cart.findById(cartId);

	if (!cart) {
		throw new CustomError.NotFoundError(`No cart found`);
	}

	const isCouponEnteredBefore = cart.coupons?.includes(coupon._id?.toString());

	if (isCouponEnteredBefore) {
		throw new CustomError.BadRequestError(
			`Coupon was entered before for this cart`
		);
	}

	cart.coupons.push(coupon._id);

	await cart.save();

	return res
		.status(StatusCodes.OK)
		.json({ msg: 'Coupon applied successfully!' });
};

export const removeCouponFromCart = async (req, res) => {
	const { cartId, couponId } = req.body;

	const cart = await Cart.findById(cartId);

	if (!cart) {
		throw new CustomError.NotFoundError(`No cart found`);
	}

	cart.coupons = cart.coupons.filter(cId => cId.toString() !== couponId);

	await cart.save();

	return res
		.status(StatusCodes.OK)
		.json({ msg: 'Coupon removed from cart successfully!' });
};
