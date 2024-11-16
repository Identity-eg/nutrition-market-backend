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
	res.status(StatusCodes.OK).json({ categories });
};

// ################ Get Category by ID ##################
export const getSingleCategoryById = async (req, res) => {
	const { id: categoryId } = req.params;

	const category = await Category.findById(categoryId); // virtuals

	if (!category) {
		throw new CustomError.NotFoundError(`No category with id : ${categoryId}`);
	}

	res.status(StatusCodes.OK).json({ category });
};
// ################ Get Category by Slug ##################
export const getSingleCategoryBySlug = async (req, res) => {
	const { slug } = req.params;

	const category = await Category.findOne({ slug }); // virtuals

	if (!category) {
		throw new CustomError.NotFoundError(`No category with slug : ${slug}`);
	}

	res.status(StatusCodes.OK).json({ category });
};

// ################# Update Category #################
export const updateCategory = async (req, res) => {
	const { id: categoryId } = req.params;

	if (req.body.name) {
		req.body.slug = slugify(req.body.name, { lower: true });
	}

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

	res
		.status(StatusCodes.OK)
		.json({ msg: 'Category updated successfully', category });
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
