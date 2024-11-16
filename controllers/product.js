import mongoose from 'mongoose';
import fetch from 'node-fetch';
import { StatusCodes } from 'http-status-codes';

import Product from '../models/product.js';
import Review from '../models/review.js';
import Variant from '../models/variant.js';
import Company from '../models/company.js';
import DosageForm from '../models/dosageForm.js';
import Category from '../models/category.js';
import Cart from '../models/cart.js';

import CustomError from '../errors/index.js';
import { USER_ROLES } from '../constants/index.js';

export const createProduct = async (req, res) => {
	if (!req.body.company) {
		req.body.company = req.user.company;
	}

	const session = await mongoose.startSession();
	try {
		session.startTransaction();

		const variants = await Variant.create(req.body.variants, { session });

		req.body.variants = variants.map(variant => variant._id);
		const product = new Product(req.body);
		await product.save({ session });

		await Promise.all(
			variants.map(variant => {
				variant.product = product._id;
				return variant.save({ session });
			})
		);

		await Company.findByIdAndUpdate(
			req.body.company,
			{
				$inc: { productsCount: 1 },
			},
			{ session }
		);

		await DosageForm.findByIdAndUpdate(
			req.body.dosageForm,
			{
				$inc: { productsCount: 1 },
			},
			{ session }
		);

		await Promise.all(
			req.body.category.map(cat =>
				Category.findByIdAndUpdate(
					cat,
					{
						$inc: { productsCount: 1 },
					},
					{ session }
				)
			)
		);

		await Promise.all(
			req.body.variants.map(variant =>
				Variant.findByIdAndUpdate(
					variant,
					{
						product: product._id,
					},
					{ session }
				)
			)
		);

		await session.commitTransaction();
		res.status(StatusCodes.CREATED).json({ product });
	} catch (error) {
		await session.abortTransaction();
		throw new CustomError.CustomAPIError(error.message);
	} finally {
		await session.endSession();
	}
};

// #################### Get All Products ######################
export const getAllProducts = async (req, res) => {
	let {
		name,
		sort,
		page = 1,
		limit = 12,
		averageRating,
		price,
		company,
		category,
		dosageForm,
	} = req.query;

	let skip = (Number(page) - 1) * Number(limit);

	let aggregationPipeline = [
		{
			$lookup: {
				from: 'variants',
				localField: 'variants',
				foreignField: '_id',
				as: 'variants',
			},
		},
		{ $unwind: '$variants' },
	];

	const comingFromDashboard =
		req.headers['api-key'] &&
		req.headers['api-key'] === process.env.DASHBOARD_API_KEY;

	// For Admins only Populate companny & dosage form & categories
	if (comingFromDashboard) {
		aggregationPipeline = aggregationPipeline.concat([
			{
				$lookup: {
					from: 'categories',
					localField: 'category',
					foreignField: '_id',
					as: 'category',
				},
			},
			{
				$lookup: {
					from: 'companies',
					localField: 'company',
					foreignField: '_id',
					as: 'company',
				},
			},
			{ $unwind: '$company' },
			{
				$lookup: {
					from: 'dosageforms',
					localField: 'dosageForm',
					foreignField: '_id',
					as: 'dosageForm',
				},
			},
			{ $unwind: '$dosageForm' },
		]);
	}

	if (name) {
		const response = await fetch(`${process.env.ORIGIN_AI}/correct-query`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query: name,
			}),
		});
		const data = await response.json();
		const nameQuery = { $regex: data.spell_corrected_text, $options: 'i' };

		aggregationPipeline.push({
			$match: {
				$or: [
					{ 'variants.name': nameQuery },
					{ 'nutritionFacts.ingredients.name': nameQuery },
					{ description: nameQuery },
				],
			},
		});
	}

	if (averageRating) {
		aggregationPipeline.push({
			$match: { averageRating: { $gte: +averageRating } },
		});
	}

	if (company) {
		const query =
			typeof company === 'string'
				? company
				: {
						$in: company,
					};
		if (comingFromDashboard) {
			aggregationPipeline.push({
				$match: { 'company.slug': query },
			});
		} else {
			aggregationPipeline = aggregationPipeline.concat([
				{
					$lookup: {
						from: 'companies',
						localField: 'company',
						foreignField: '_id',
						as: 'company',
					},
				},
				{ $unwind: '$company' },
				{
					$match: { 'company.slug': query },
				},
			]);
		}
	}

	if (dosageForm) {
		const query =
			typeof dosageForm === 'string'
				? dosageForm
				: {
						$in: dosageForm,
					};

		if (comingFromDashboard) {
			aggregationPipeline.push({
				$match: { 'dosageForm.slug': query },
			});
		} else {
			aggregationPipeline = aggregationPipeline.concat([
				{
					$lookup: {
						from: 'dosageforms',
						localField: 'dosageForm',
						foreignField: '_id',
						as: 'dosageForm',
					},
				},
				{ $unwind: '$dosageForm' },
				{
					$match: { 'dosageForm.slug': query },
				},
			]);
		}
	}

	if (category) {
		const query =
			typeof category === 'string'
				? category
				: {
						$in: category,
					};
		if (comingFromDashboard) {
			aggregationPipeline.push({
				$match: { 'category.slug': query },
			});
		} else {
			aggregationPipeline = aggregationPipeline.concat([
				{
					$lookup: {
						from: 'categories',
						localField: 'category',
						foreignField: '_id',
						as: 'category',
					},
				},
				{
					$match: { 'category.slug': query },
				},
			]);
		}
	}

	// Match stage for price range
	if (price) {
		const [from, to] = price.split('-');
		aggregationPipeline.push({
			$match: {
				'variants.price': {
					...(from && { $gte: +from }),
					...(to && { $lte: +to }),
				},
			},
		});
	}

	if (sort) {
		const sortMapper = {
			price: 'variants.price',
			createdAt: 'createdAt',
			averageRating: 'averageRating',
			name: 'variants.name',
			sold: 'variants.sold',
		};
		const query = sort.startsWith('-')
			? { [sortMapper[sort.substring(1)]]: -1 }
			: { [sortMapper[sort]]: 1 };
		aggregationPipeline.push({
			$sort: query,
		});
	}

	const countPipeline = [...aggregationPipeline];
	countPipeline.push({ $count: 'totalCount' });
	const countResult = await Product.aggregate(countPipeline).allowDiskUse(true);
	const totalCount = countResult.length > 0 ? countResult[0].totalCount : 0;

	aggregationPipeline.push({ $skip: skip }, { $limit: Number(limit) });

	const products = await Product.aggregate(aggregationPipeline);

	const lastPage = Math.ceil(totalCount / limit);
	res.status(StatusCodes.OK).json({
		totalCount,
		currentPage: Number(page),
		lastPage,
		products,
	});
};

// ######################################################

export const getSingleProduct = async (req, res) => {
	const { id: productId } = req.params;

	const product = await Product.findOne({ _id: productId }).populate([
		{
			path: 'variants',
		},
		{
			path: 'category company dosageForm',
			select: 'name',
			options: { _recursed: true },
		},
	]);

	if (!product) {
		throw new CustomError.NotFoundError(`No product with id : ${productId}`);
	}

	res.status(StatusCodes.OK).json({ product });
};

// ######################################################
export const getSingleProductReviews = async (req, res) => {
	const { id: productId } = req.params;
	const reviews = await Review.find({ product: productId }).populate([
		{
			path: 'user',
			select: 'firstName lastName',
		},
	]);
	res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};

// ######################################################

export const updateProduct = async (req, res) => {
	const { id: productId } = req.params;

	const product = await Product.findById(productId);
	if (!product) {
		throw new CustomError.NotFoundError(`No product with id : ${productId}`);
	}

	const myOwnProduct =
		req.user.role === USER_ROLES.admin
			? req.user.company.toString() === product.company.toString()
			: true;
	if (!myOwnProduct) {
		throw new CustomError.UnauthenticatedError(
			"You don't have access to do this action"
		);
	}

	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		if (req.body.variants) {
			const variantsWithoutIds = req.body.variants
				.filter(variant => !variant._id)
				.map(variant => ({ ...variant, product: product._id }));

			if (variantsWithoutIds) {
				const variants = await Variant.create(variantsWithoutIds, { session });
				req.body['$push'] = { variants: { $each: variants.map(v => v._id) } };
			}
			delete req.body.variants;
		}

		const updatedProduct = await Product.findOneAndUpdate(
			{ _id: productId },
			req.body,
			{
				new: true,
				runValidators: true,
				session,
			}
		);

		if (req.body.category) {
			await Product.countByCategory({ session });
		}
		if (req.body.company) {
			await Product.countByCompany({ session });
		}
		if (req.body.dosageForm) {
			await Product.countByDosageForm({ session });
		}

		await session.commitTransaction();
		res.status(StatusCodes.OK).json({ product: updatedProduct });
	} catch (error) {
		await session.abortTransaction();
		throw new CustomError.CustomAPIError(error.message);
	} finally {
		await session.endSession();
	}
};

// ######################################################

export const deleteProduct = async (req, res) => {
	const { id: productId } = req.params;

	const product = await Product.findById(productId);

	if (!product) {
		throw new CustomError.NotFoundError(`No product with id : ${productId}`);
	}
	const myOwnProduct =
		req.user.role === USER_ROLES.admin
			? req.user.company.toString() === product.company.toString()
			: true;
	if (!myOwnProduct) {
		throw new CustomError.UnauthenticatedError(
			`You don't have access to do this action : ${productId}`
		);
	}

	const session = await mongoose.startSession();
	try {
		session.startTransaction();

		await product.deleteOne({ session });

		await Promise.all(
			product.variants.map(item => Variant.findByIdAndDelete(item, { session }))
		);

		await Review.deleteMany({ product: productId }, { session });
		const cartIDs = await Cart.find({ 'items.product': productId }).select(
			'_id'
		);

		await Promise.all(
			cartIDs.map(async id => {
				const cart = await Cart.findById(id);
				const deletedItem = cart.items.find(
					item => item.product.toString() === productId.toString()
				);

				cart.items = cart.items.filter(
					item => item.product.toString() !== productId.toString()
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

		await Company.findByIdAndUpdate(
			product.company,
			{
				$inc: { productsCount: -1 },
			},
			{ session }
		);

		await DosageForm.findByIdAndUpdate(
			product.dosageForm,
			{
				$inc: { productsCount: -1 },
			},
			{ session }
		);

		await Promise.all(
			product.category.map(cat =>
				Category.findByIdAndUpdate(
					cat,
					{
						$inc: { productsCount: -1 },
					},
					{ session }
				)
			)
		);
		await session.commitTransaction();
		res.status(StatusCodes.OK).json({ msg: 'Success! Product removed.' });
	} catch (error) {
		await session.abortTransaction();
		throw new CustomError.CustomAPIError(error.message);
	} finally {
		await session.endSession();
	}
};

// ###########################################

export const getSimilarProducts = async (req, res) => {
	let { limit = 5 } = req.query;
	const { id } = req.params;
	const product = await Product.findById(id);
	const ingNames = product.nutritionFacts.ingredients.map(
		ingredient => ingredient.name
	);

	const similarProducts = await Product.aggregate([
		{
			$facet: {
				// Match products with the same ingredients
				ingredientMatches: [
					{
						$match: {
							['nutritionFacts.ingredients']: {
								$elemMatch: {
									name: {
										$in: ingNames.map(name => new RegExp(name, 'i')),
									},
								},
							},
							_id: { $ne: product._id },
						},
					},
				],
				categoryMatches: [
					{
						$match: {
							category: { $in: product.category },
							_id: { $ne: product._id },
						},
					},
				],
				dosageMatches: [
					{
						$match: {
							dosageForm: product.dosageForm,
							_id: { $ne: product._id },
						},
					},
				],
			},
		},
		{
			$project: {
				combinedResults: {
					$concatArrays: [
						'$ingredientMatches',
						'$categoryMatches',
						'$dosageMatches',
					],
				},
			},
		},

		{
			$unwind: '$combinedResults',
		},

		{
			$group: {
				_id: '$combinedResults._id',
				product: { $first: '$combinedResults' },
			},
		},
		{
			$limit: +limit,
		},
		{
			$replaceRoot: {
				newRoot: '$product',
			},
		},
		{
			$lookup: {
				from: 'variants', // Replace with your actual collection name
				localField: 'variants', // Assuming there's a brand field
				foreignField: '_id',
				as: 'variants',
			},
		},
	]);

	return res.json({
		products: similarProducts,
	});
};
