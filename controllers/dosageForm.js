import DosageForm from '../models/dosageForm.js';
import { StatusCodes } from 'http-status-codes';
import CustomError from '../errors/index.js';
import slugify from 'slugify';

// ################# Create DosageForm #################
export const createDosageForm = async (req, res) => {
  req.body.slug = slugify(req.body.name, { lower: true });

  const dosageForm = await DosageForm.create(req.body);
  res.status(StatusCodes.CREATED).json({ dosageForm });
};

// ################# Get All DosageForm #################
export const getDosageForms = async (req, res) => {
  const dosageForms = await DosageForm.find({});
  res.status(StatusCodes.OK).json({ dosageForms });
};

// ################# Get All DosageForm #################
export const getSingleDosageForm = async (req, res) => {
  const { id: dosageFormId } = req.params;

  const dosageForm = await DosageForm.findOne({ _id: dosageFormId });

  if (!dosageForm) {
    throw new CustomError.NotFoundError(`No product with id : ${dosageFormId}`);
  }

  res.status(StatusCodes.OK).json({ dosageForm });
};

// ################# Update DosageForm #################
export const updateDosageForm = async (req, res) => {
  const { id: dosageFormId } = req.params;

  if (req.body.name) {
    req.body.slug = slugify(req.body.name, { lower: true });
  }

  const dosageForm = await DosageForm.findOneAndUpdate(
    { _id: dosageFormId },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!dosageForm) {
    throw new CustomError.NotFoundError(
      `No dosageForm with id : ${dosageFormId}`
    );
  }

  res.status(StatusCodes.OK).json({ dosageForm });
};

// ################# Delete DosageForm #################
export const deleteDosageForm = async (req, res) => {
  const { id: dosageFormId } = req.params;

  const dosageForm = await DosageForm.findOne({ _id: dosageFormId });

  if (!dosageForm) {
    throw new CustomError.NotFoundError(
      `No dosage form with id : ${dosageFormId}`
    );
  }

  await dosageForm.deleteOne();
  res.status(StatusCodes.OK).json({ msg: 'Success! DosageForm removed.' });
};
