import SubCategory from '../models/sub-category.js';
import { StatusCodes } from 'http-status-codes';
import CustomError from '../errors/index.js';
import slugify from 'slugify';

// ################# Create Sub Category #################
export const createSubCategory = async (req, res) => {
	req.body.slug = slugify(req.body.name);

	const subCategory = await SubCategory.create(req.body);
	res.status(StatusCodes.CREATED).json({ subCategory });
};

// ################# Get All Sub Categories #################
export const getSubCategories = async (req, res) => {
	const queryObject = { ...req.query };

	const subCategories = await SubCategory.find(queryObject).populate({
		path: 'parent',
		select: 'name slug',
		options: { _recursed: true },
	});
	res.status(StatusCodes.OK).json(subCategories);
};

// ################# Update Sub Category #################
export const updateSubCategory = async (req, res) => {
	const { id: subCategoryId } = req.params;

	const subCategory = await SubCategory.findOneAndUpdate(
		{ _id: subCategoryId },
		req.body,
		{
			new: true,
			runValidators: true,
		}
	);

	if (!subCategory) {
		throw new CustomError.NotFoundError(
			`No category with id : ${subCategoryId}`
		);
	}

	res.status(StatusCodes.OK).json(subCategory);
};

// ################# Delete Sub Category #################
export const deleteSubCategory = async (req, res) => {
	const { id: subCategoryId } = req.params;

	const subCategory = await SubCategory.findOne({ _id: subCategoryId });

	if (!subCategory) {
		throw new CustomError.NotFoundError(
			`No category with id : ${subCategoryId}`
		);
	}

	await subCategory.remove();
	res.status(StatusCodes.OK).json({ msg: 'Success! Product removed.' });
};
