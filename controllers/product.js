import path from 'path';
import fs from 'fs';
import cloudinary from 'cloudinary';
import { StatusCodes } from 'http-status-codes';
import slugify from 'slugify';

import Product from '../models/product.js';
import CustomError from '../errors/index.js';

export const createProduct = async (req, res) => {
  // req.body.user = req.user._id;
  req.body.slug = slugify(req.body.name, { lower: true });
  console.log(req.body);
  const product = await Product.create(req.body);
  res.status(StatusCodes.CREATED).json({ product });
};

// ######################################################
export const getAllProducts = async (req, res) => {
  let {
    name,
    sort,
    page = 1,
    limit = 10,
    averageRating,
    price,
    company,
    category,
    itemForm,
  } = req.query;

  let skip = (Number(page) - 1) * Number(limit);
  let queryObject = { ...req.query };
  // Name
  if (queryObject.name) {
    queryObject.name = { $regex: name, $options: 'i' };
  }
  // Average Rating
  if (queryObject.averageRating) {
    queryObject.averageRating = { $gte: averageRating };
  }
  // Price
  if (queryObject.price) {
    queryObject.price = { $gte: price[0], $lte: price[1] };
  }
  // Company
  if (queryObject.company) {
    queryObject.company = { $in: company };
  }
  // Item Form
  if (queryObject.itemForm) {
    queryObject.itemForm = { $in: itemForm };
  }
  // Category
  if (queryObject.category) {
    queryObject.category = { $elemMatch: { $in: category } };
  }
  // // Sizes
  // if (queryObject.sizes) {
  //   queryObject.sizes = { $elemMatch: { $in: sizes } };
  // }

  // Pagination & Sort
  delete queryObject.page;
  delete queryObject.limit;
  delete queryObject.sort;

  const products = await Product.find(queryObject)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'category',
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
    {
      path: 'reviews',
      populate: { path: 'user', select: 'name' },
    },
    {
      path: 'category',
      select: 'name',
      options: { _recursed: true },
    },
  ]); // virtuals

  if (!product) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }

  res.status(StatusCodes.OK).json({ product });
};

// ######################################################

export const updateProduct = async (req, res) => {
  const { id: productId } = req.params;

  if (req.body.name) {
    req.body.slug = slugify(req.body.name);
  }

  const product = await Product.findOneAndUpdate({ _id: productId }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }

  res.status(StatusCodes.OK).json({ product });
};

// ######################################################

export const deleteProduct = async (req, res) => {
  const { id: productId } = req.params;

  const product = await Product.findOne({ _id: productId });

  if (!product) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
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
  // console.log(req.files);
  const result = await cloudinary.v2.uploader.upload(
    req.files.image.tempFilePath,
    { use_filename: true, folder: 'elgendy-ecommerce' }
  );

  fs.unlinkSync(req.files.image.tempFilePath);

  // console.log(result);
  res.status(StatusCodes.OK).json({ image: result.secure_url });
};

// ###########################################

export const getSimilarProducts = async (req, res) => {
  let { limit = 3 } = req.query;
  const { id } = req.params;
  const product = await Product.findById(id);

  const productsBySub = await Product.find({
    subCategory: product.subCategory._id,
    _id: { $ne: id },
  })
    .limit(limit)
    .populate({
      path: 'brand category subCategory colors',
      select: 'name slug',
      options: { _recursed: true },
    });

  if (productsBySub.length < limit) {
    const productsByCategory = await Product.find({
      category: product.category._id,
      _id: { $ne: id },
      subCategory: { $ne: product.subCategory._id },
    })
      .limit(limit - productsBySub.length)
      .populate({
        path: 'brand category subCategory colors',
        select: 'name slug',
        options: { _recursed: true },
      });

    return res.json({
      products: [...productsBySub, ...productsByCategory],
    });
  }

  res.json({
    products: productsBySub,
  });
};
