import path from 'path';
import cloudinary from 'cloudinary';
import { StatusCodes } from 'http-status-codes';

import CustomError from '../errors/index.js';
import { uploadToCloudinary } from '../utils/uploadToCloudinary.js';

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
export const uploadSingleImage = async (req, res) => {
  try {
    const { buffer } = req.file;
    const result = await uploadToCloudinary(buffer);

    res.status(StatusCodes.OK).json({ image: result.secure_url });
  } catch (error) {
    console.log(error);
    throw new CustomError.BadRequestError(
      error.message ?? 'something went wrong'
    );
  }
};

export const uploadMultipleImage = async (req, res) => {
  try {
    const images = [];
    for (const file of req.files) {
      const { buffer } = file;
      const result = await uploadToCloudinary(buffer);
      console.log(result);

      images.push(result.secure_url);
    }
    res.status(StatusCodes.OK).json({ images });
  } catch (error) {
    console.log(error);
    throw new CustomError.BadRequestError(
      error.message ?? 'something went wrong'
    );
  }
};
