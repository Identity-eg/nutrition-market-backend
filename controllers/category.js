import Category from '../models/category.js';
import { StatusCodes } from 'http-status-codes';
import CustomError from '../errors/index.js';
import slugify from 'slugify';

// ################# Create Category #################
export const createCategory = async (req, res) => {
  req.body.slug = slugify(req.body.name, { lower: true });

  const category = await Category.create(req.body);
  res.status(StatusCodes.CREATED).json({ category });
};

// ################# Get All Category #################
export const getCategories = async (req, res) => {
  const categories = await Category.find({});
  res.status(StatusCodes.OK).json(categories);
};

// ################ Get Category ##################
export const getSingleCategory = async (req, res) => {
  const { id: categoryId } = req.params;

  const category = await Category.findOne({ _id: categoryId }); // virtuals

  if (!category) {
    throw new CustomError.NotFoundError(`No category with id : ${categoryId}`);
  }

  res.status(StatusCodes.OK).json({ category });
};

// ################# Update Category #################
export const updateCategory = async (req, res) => {
  const { id: categoryId } = req.params;

  const category = await Category.findOneAndUpdate(
    { _id: categoryId },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!category) {
    throw new CustomError.NotFoundError(`No category with id : ${categoryId}`);
  }

  res.status(StatusCodes.OK).json(category);
};

// ################# Delete Category #################
export const deleteCategory = async (req, res) => {
  const { id: categoryId } = req.params;

  const category = await Category.findOne({ _id: categoryId });

  if (!category) {
    throw new CustomError.NotFoundError(`No category with id : ${categoryId}`);
  }

  await category.deleteOne();
  res.status(StatusCodes.OK).json({ msg: 'Success! Category removed.' });
};
