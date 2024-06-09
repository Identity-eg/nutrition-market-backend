import Brand from "../models/brand.js";
import { StatusCodes } from "http-status-codes";
import CustomError from "../errors/index.js";
import slugify from "slugify";

// ################# Create Crand #################
export const createBrand = async (req, res) => {
  req.body.slug = slugify(req.body.name);

  const brand = await Brand.create(req.body);
  res.status(StatusCodes.CREATED).json({ brand });
};

// ################# Get All Crand #################
export const getBrands = async (req, res) => {
  const brands = await Brand.find({});
  res.status(StatusCodes.CREATED).json(brands);
};

// ################# Update Crand #################
export const updateBrand = async (req, res) => {
  const { id: brandId } = req.params;

  const brand = await Brand.findOneAndUpdate({ _id: brandId }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!brand) {
    throw new CustomError.NotFoundError(`No brand with id : ${brandId}`);
  }

  res.status(StatusCodes.OK).json(brand);
};

// ################# Delete Brand #################
export const deleteBrand = async (req, res) => {
  const { id: brandId } = req.params;

  const brand = await Brand.findOne({ _id: brandId });

  if (!brand) {
    throw new CustomError.NotFoundError(`No crand with id : ${brandId}`);
  }

  await brand.remove();
  res.status(StatusCodes.OK).json({ msg: "Success! Brand removed." });
};
