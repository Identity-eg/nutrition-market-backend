import { StatusCodes } from 'http-status-codes';

import Product from '../models/product.js';
import Review from '../models/review.js';
import CustomError from '../errors/index.js';
import { USER_ROLES } from '../constants/index.js';
import Variant from '../models/variant.js';
import { getIncludes } from './cart.js';

export const createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(StatusCodes.CREATED).json({ product });
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
  const includes = getIncludes(req);

  let skip = (Number(page) - 1) * Number(limit);
  let queryObject = {};

  if (name) {
    const nameQuery = { $regex: name, $options: 'i' };
    const variants = await Variant.find({ name: nameQuery });
    const variantIDs = variants.map((variant) => variant?._id) ?? [];
    queryObject['$or'] = [
      { variants: { $in: variantIDs } },
      { 'nutritionFacts.ingredients.name': nameQuery },
    ];
  }

  if (averageRating) {
    queryObject.averageRating = { $gte: averageRating };
  }

  if (price) {
    const from = price.split('-')[0];
    const to = price.split('-')[1];

    queryObject.variants = {
      $elemMatch: {
        ...queryObject.variants?.$elemMatch,
        price: { ...(from && { $gte: from }), ...(to && { $lte: to }) },
      },
    };
  }

  if (company) {
    queryObject.company = { $in: company };
  }

  if (dosageForm) {
    queryObject.dosageForm = { $in: dosageForm };
  }

  if (category) {
    queryObject.category = { $elemMatch: { $in: category } };
  }

  const products = await Product.find(queryObject)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate(includes);

  const productsCount = await Product.countDocuments(queryObject);
  const lastPage = Math.ceil(productsCount / limit);
  res.status(StatusCodes.OK).json({
    totalCount: productsCount,
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

// if you decide to not use virtual
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

  const updatedProduct = await Product.findOneAndUpdate(
    { _id: productId },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(StatusCodes.OK).json({ product: updatedProduct });
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

  await product.deleteOne();
  product.variants.map(async (variant) => {
    await Variant.findByIdAndDelete(variant);
  });

  res.status(StatusCodes.OK).json({ msg: 'Success! Product removed.' });
};

// ###########################################

export const getSimilarProducts = async (req, res) => {
  let { limit = 5 } = req.query;
  const { id } = req.params;
  const product = await Product.findById(id);
  const ingNames = product.nutritionFacts.ingredients.map(
    (ingredient) => ingredient.name
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
                    $in: ingNames.map((name) => new RegExp(name, 'i')),
                  },
                },
              },
              _id: { $ne: product._id },
            },
          },
          {
            $group: {
              _id: '$_id',
              product: { $first: '$$ROOT' },
            },
          },
        ],
        // Match products in the same category
        categoryMatches: [
          {
            $match: {
              category: { $in: product.category },
              _id: { $ne: product._id },
            },
          },
          {
            $group: {
              _id: '$_id',
              product: { $first: '$$ROOT' },
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
          {
            $group: {
              _id: '$_id',
              product: { $first: '$$ROOT' },
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
        product: { $first: '$combinedResults.product' },
      },
    },
    {
      $limit: +limit, // Limit to a maximum of 4 products
    },
    {
      $replaceRoot: { newRoot: '$product' }, // Replace root with the product document
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
