import { StatusCodes } from 'http-status-codes';
import Variant from '../models/variant.js';
import CustomError from '../errors/index.js';

export const createVariant = async (req, res) => {
  const variant = await Variant.create({
    name: req.body.name,
    unitCount: req.body.unitCount,
    quantity: req.body.quantity,
    price: req.body.price,
    priceAfterDiscount: req.body.priceAfterDiscount,
    flavor: req.body.flavor,
    images: req.body.images,
  });

  res.status(StatusCodes.CREATED).json({ variant });
};

export const getVariant = async (req, res) => {
  const variant = await Variant.findById(req.params.variantId);
  if (!variant) {
    throw new CustomError.BadRequestError('No variant found with this id');
  }
  res.status(StatusCodes.CREATED).json({ variant });
};

export const updateVariant = async (req, res) => {
  const variant = await Variant.findById(req.params.variantId);
  if (!variant) {
    throw new CustomError.BadRequestError('No variant found with this id');
  }
  const updatedVariant = await Variant.findOneAndUpdate(
    { _id: req.params.variantId },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(StatusCodes.CREATED).json({ variant: updatedVariant });
};

export const deleteVariant = async (req, res) => {
  const variant = await Variant.findByIdAndDelete(req.params.variantId);

  if (!variant) {
    throw new CustomError.BadRequestError('No variant found with this id');
  }
  res.status(StatusCodes.CREATED).json({ msg: 'Variant deleted successfuly' });
};
