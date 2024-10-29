import Image from '../models/image.js';
import { StatusCodes } from 'http-status-codes';
import CustomError from '../errors/index.js';

// ################# Create Image #################
export const createImage = async (req, res) => {
	// console.log(req.body);
	const image = await Image.create(req.body);
	res.status(StatusCodes.CREATED).json({ image });
};

// ################# Get Images For Specific Path #################
export const getImages = async (req, res) => {
	const { path } = req.query;
	let queryObject = {};
	if (path) {
		queryObject.path = path;
	}
	const images = await Image.find(queryObject);
	res.status(StatusCodes.OK).json({ images });
};

// ################ Get Image ##################
export const getSingleImage = async (req, res) => {
	const { id: imageId } = req.params;

	const image = await Image.findOne({ _id: imageId }).populate([
		{
			path: 'relatedProduct',
			select: 'name description',
			options: { _recursed: true },
		},
	]); // virtuals

	if (!image) {
		throw new CustomError.NotFoundError(`No image with id : ${imageId}`);
	}

	res.status(StatusCodes.OK).json({ image });
};

// ################# Update Image #################
export const updateImage = async (req, res) => {
	const { id: imageId } = req.params;

	const image = await Image.findOneAndUpdate({ _id: imageId }, req.body, {
		new: true,
		runValidators: true,
	});

	if (!image) {
		throw new CustomError.NotFoundError(`No image with id : ${imageId}`);
	}

	res.status(StatusCodes.OK).json({ msg: 'Image updated successfully', image });
};

// ################# Delete Image #################
export const deleteImage = async (req, res) => {
	const { id: imageId } = req.params;

	const image = await Image.findOne({ _id: imageId });

	if (!image) {
		throw new CustomError.NotFoundError(`No image with id : ${imageId}`);
	}

	await image.deleteOne();
	res.status(StatusCodes.OK).json({ msg: 'Success! Image removed.' });
};
