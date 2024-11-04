import { StatusCodes } from 'http-status-codes';
import Variant from '../models/variant.js';
import CustomError from '../errors/index.js';
import Cart from '../models/cart.js';
import mongoose from 'mongoose';

export const createVariant = async (req, res) => {
	const variant = await Variant.create({
		name: req.body.name,
		unitCount: req.body.unitCount,
		quantity: req.body.quantity,
		price: req.body.price,
		priceAfterDiscount: req.body.priceAfterDiscount,
		flavor: req.body.flavor,
		images: req.body.images,
	});

	res.status(StatusCodes.CREATED).json({ variant });
};

export const getAllVariants = async (req, res) => {
	const variants = await Variant.find({});
	res.status(StatusCodes.OK).json({ variants });
};

export const getVariant = async (req, res) => {
	const variant = await Variant.findById(req.params.variantId);
	if (!variant) {
		throw new CustomError.BadRequestError('No variant found with this id');
	}
	res.status(StatusCodes.OK).json({ variant });
};

export const updateVariant = async (req, res) => {
	const variant = await Variant.findById(req.params.variantId);
	if (!variant) {
		throw new CustomError.BadRequestError('No variant found with this id');
	}
	const updatedVariant = await Variant.findOneAndUpdate(
		{ _id: req.params.variantId },
		req.body,
		{
			new: true,
			runValidators: true,
		}
	);
	res.status(StatusCodes.OK).json({ variant: updatedVariant });
};

export const deleteVariant = async (req, res) => {
	const variantId = req.params.variantId;
	const variant = await Variant.findById(variantId);

	if (!variant) {
		throw new CustomError.BadRequestError('No variant found with this id');
	}

	const session = await mongoose.startSession();
	try {
		session.startTransaction();

		await variant.deleteOne({ session });

		const cartIDs = await Cart.find({
			'items.variant': variantId,
		}).select('_id');

		if (cartIDs.length > 0) {
			await Promise.all(
				cartIDs.map(async id => {
					const cart = await Cart.findById(id);
					const deletedItem = cart.items.find(
						item => item.variant.toString() === variantId.toString()
					);

					cart.items = cart.items.filter(
						item => item.variant.toString() !== variantId.toString()
					);
					cart.totalItems -= deletedItem.amount;
					cart.totalPrice -= deletedItem.totalProductPrice;

					if (cart.totalItems === 0) {
						return cart.deleteOne({ session });
					} else {
						return cart.save({ session });
					}
				})
			);
		}
		await session.commitTransaction();
		res.status(StatusCodes.OK).json({ msg: 'Variant deleted successfuly' });
	} catch (error) {
		await session.abortTransaction();
		throw new CustomError.CustomAPIError(error.message);
	} finally {
		await session.endSession();
	}
};
