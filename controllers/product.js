import path from 'path';
import cloudinary from 'cloudinary';
import { StatusCodes } from 'http-status-codes';
import slugify from 'slugify';

import Product from '../models/product.js';
import Review from '../models/review.js';
import CustomError from '../errors/index.js';
import { USER_ROLES } from '../constants/index.js';

export const createProduct = async (req, res) => {
  const variantsWithSlug = req.body.variants?.map((v) => {
    return {
      ...v,
      slug: slugify(v.name ?? '', { lower: true }),
    };
  });

  req.body.variants = variantsWithSlug;

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

  let skip = (Number(page) - 1) * Number(limit);
  let queryObject = {};

  if (name) {
    const nameQuery = { $regex: name, $options: 'i' };
    queryObject['$or'] = [
      { 'variants.name': nameQuery },
      { 'nutritionFacts.ingredients.name': nameQuery },
      { 'nutritionFacts.otherIngredients.name': nameQuery },
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
    .populate({
      path: 'category company dosageForm',
      select: 'name slug',
      options: { _recursed: true },
    });

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
    // {
    //   path: 'reviews',
    //   populate: { path: 'user', select: 'name' },
    // },
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

  if (req.body.variants) {
    const variantsWithSlug = req.body.variants?.map((v) => ({
      ...v,
      slug: slugify(v.name ?? '', { lower: true }),
    }));

    req.body.variants = variantsWithSlug;
  }

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

  res.status(StatusCodes.OK).json({ msg: 'Success! Product removed.' });
};

// ######################################################

export const uploadImageLocal = async (req, res) => {
  if (!req.files) {
    throw new CustomError.BadRequestError('No File Uploaded');
  }
  const productImage = req.files.image;

  if (!productImage.mimetype.startsWith('image')) {
    throw new CustomError.BadRequestError('Please Upload Image');
  }

  const maxSize = 1024 * 1024;

  if (productImage.size > maxSize) {
    throw new CustomError.BadRequestError(
      'Please upload image smaller than 1MB'
    );
  }
  const dirname = path.resolve(path.dirname(''));
  const imagePath = path.join(
    dirname,
    './public/uploads/' + `${productImage.name}`
  );

  await productImage.mv(imagePath);
  res.status(StatusCodes.OK).json({ image: `/uploads/${productImage.name}` });
};

// ######################################################

export const uploadImage = async (req, res) => {
  // console.log('req.files', req.files);
  const arrayOfImages = Array.isArray(req.files.image)
    ? req.files.image
    : [req.files.image];

  const imagesToUpload = arrayOfImages.map(async (img) => {
    return await cloudinary.v2.uploader.upload(img.tempFilePath, {
      use_filename: true,
      folder: 'supplement-food',
    });
  });

  // arrayOfImages.forEach((img) => {
  //   fs.unlinkSync(img.tempFilePath);
  // });

  const results = await Promise.all(imagesToUpload);
  // fs.unlinkSync(req.files.image.tempFilePath);
  // const result = await cloudinary.v2.uploader.upload(
  //   req.files.image.tempFilePath,
  //   { use_filename: true, folder: 'supplement-food' }
  // );
  console.log('results', results);
  res
    .status(StatusCodes.OK)
    .json({ images: results.map((img) => img.secure_url) });
};

// ###########################################

export const getSimilarProducts = async (req, res) => {
  let { limit = 3 } = req.query;
  const { id } = req.params;
  const product = await Product.findById(id);

  // const productsBySub = await Product.find({
  //   subCategory: product.subCategory._id,
  //   _id: { $ne: id },
  // })
  //   .limit(limit)
  //   .populate({
  //     path: 'category company dosageForm',
  //     select: 'name slug',
  //     options: { _recursed: true },
  //   });

  // if (productsBySub.length < limit) {
  const productsByCategory = await Product.find({
    category: { $elemMatch: { $in: product.category } },
    _id: { $ne: id },
    // subCategory: { $ne: product.subCategory._id },
  })
    .limit(limit)
    .populate({
      path: 'category company dosageForm',
      select: 'name slug',
      options: { _recursed: true },
    });

  return res.json({
    // products: [...productsBySub, ...productsByCategory],
    products: [...productsByCategory],
  });
  // }

  // res.json({
  //   products: productsBySub,
  // });
};
