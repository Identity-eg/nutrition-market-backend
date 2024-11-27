import { StatusCodes } from 'http-status-codes';
import Variant from '../models/variant.js';
import CustomError from '../errors/index.js';
import Cart from '../models/cart.js';
import mongoose from 'mongoose';
import Product from '../models/product.js';

export const createVariant = async (req, res) => {
	const productId = req.body.product;
	const product = await Product.findById(productId);

	if (!product) {
		throw new CustomError.BadRequestError(
			`No product found with id ${productId}`
		);
	}

	const session = await mongoose.startSession();
	try {
		session.startTransaction();
		req.body.name = `${product.name} ${req.body.unitCount} ${req.body.flavor}`;
		const variant = new Variant(req.body);
		await variant.save({ session });

		await Product.findByIdAndUpdate(
			productId,
			{
				$push: { variants: variant._id },
			},
			{ session }
		);

		await session.commitTransaction();
		res.status(StatusCodes.OK).json({ msg: 'Variant created successfuly' });
	} catch (error) {
		await session.abortTransaction();
		throw new CustomError.CustomAPIError(error.message);
	} finally {
		await session.endSession();
	}
};

export const getAllVariants = async (req, res) => {
	const variants = await Variant.find({});
	res.status(StatusCodes.OK).json({ variants });
};

export const getProductVariants = async (req, res) => {
	const { productId } = req.params;
	const variants = await Variant.find({ product: productId });

	res.status(StatusCodes.OK).json({ variants });
};

export const getVariant = async (req, res) => {
	const variant = await Variant.findById(req.params.variantId);
	if (!variant) {
		throw new CustomError.BadRequestError(
			`No variant found with this id ${req.params.variantId}`
		);
	}
	res.status(StatusCodes.OK).json({ variant });
};

export const updateVariant = async (req, res) => {
	const variant = await Variant.findById(req.params.variantId);
	if (!variant) {
		throw new CustomError.BadRequestError('No variant found with this id');
	}

	if (req.body.unitCount || req.body.flavor) {
		const unitCount = req.body.unitCount || variant.unitCount;
		const flavor = req.body.flavor || variant.flavor;
		const product = await Product.findById(variant.product);
		req.body.name = `${product.name} ${unitCount} ${flavor}`;
	}

	const updatedVariant = await Variant.findOneAndUpdate(
		{ _id: req.params.variantId },
		req.body,
		{
			new: true,
			runValidators: true,
		}
	);
	res
		.status(StatusCodes.OK)
		.json({ msg: 'Variant updated successfully', variant: updatedVariant });
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
