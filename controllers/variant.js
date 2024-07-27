import Variant from '../models/variant.js';
import Product from '../models/product.js';
import { StatusCodes } from 'http-status-codes';
import CustomError from '../errors/index.js';

// ################# Create Variant #################
export const createVariant = async (req, res) => {
  const { product: productId } = req.body;

  const isValidProduct = await Product.findOne({ _id: productId });

  if (!isValidProduct) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }

  const variant = await Variant.create(req.body);
  res.status(StatusCodes.CREATED).json({ variant });
};

// ################# Get All Variants #################
// export const getAllVariants = async (req, res) => {
//   let { page = 1, limit = 10 } = req.query;
//   let skip = (Number(page) - 1) * Number(limit);
//   const queryObject = { ...req.query };
//   // console.log({queryObject});
//   // Pagination & Sort
//   delete queryObject.page;
//   delete queryObject.limit;

//   const variants = await Variant.find(queryObject)
//     .skip(skip)
//     .limit(limit)
//     .populate({
//       path: 'user product',
//       select: 'name price',
//     });
//   const variantsCount = await Variant.countDocuments(queryObject);
//   const lastPage = Math.ceil(variantsCount / limit);

//   res.status(StatusCodes.OK).json({
//     variants,
//     pageCount: variants.length,
//     totalCount: variantsCount,
//     currentPage: Number(page),
//     lastPage,
//   });
// };

// ################# Get Single Variant #################
export const getSingleVariant = async (req, res) => {
  const { id: variantId } = req.params;

  const variant = await Variant.findOne({ _id: variantId });

  if (!variant) {
    throw new CustomError.NotFoundError(`No variant with id ${variantId}`);
  }

  res.status(StatusCodes.OK).json({ variant });
};

// ################# Update Variant #################
export const updateVariant = async (req, res) => {
  const { id: variantId } = req.params;
  const { name, flavor, size, images, price } = req.body;

  const variant = await Variant.findOne({ _id: variantId });

  if (!variant) {
    throw new CustomError.NotFoundError(`No variant with id ${variantId}`);
  }

  variant.name = name;
  variant.flavor = flavor;
  variant.size = size;
  variant.images = images;
  variant.price = price;

  await variant.save();
  res.status(StatusCodes.OK).json({ variant });
};

// ################# Delete Variant #################
export const deleteVariant = async (req, res) => {
  const { id: variantId } = req.params;

  const variant = await Variant.findOne({ _id: variantId });

  if (!variant) {
    throw new CustomError.NotFoundError(`No variant with id ${variantId}`);
  }

  await variant.deleteOne();
  res.status(StatusCodes.OK).json({ msg: 'Success! Variant removed' });
};
