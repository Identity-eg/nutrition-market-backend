import Company from '../models/company.js';
import { StatusCodes } from 'http-status-codes';
import CustomError from '../errors/index.js';
import slugify from 'slugify';

// ################# Create Company #################
export const createCompany = async (req, res) => {
  req.body.slug = slugify(req.body.name, { lower: true });

  const company = await Company.create(req.body);
  res.status(StatusCodes.CREATED).json({ company });
};

// ################# Get All Company #################
export const getCompanys = async (req, res) => {
  const companys = await Company.find({});
  res.status(StatusCodes.CREATED).json(companys);
};

// ################# Update Company #################
export const updateCompany = async (req, res) => {
  const { id: companyId } = req.params;

  const company = await Company.findOneAndUpdate({ _id: companyId }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!company) {
    throw new CustomError.NotFoundError(`No company with id : ${companyId}`);
  }

  res.status(StatusCodes.OK).json(company);
};

// ################# Delete Company #################
export const deleteCompany = async (req, res) => {
  const { id: companyId } = req.params;

  const company = await Company.findOne({ _id: companyId });

  if (!company) {
    throw new CustomError.NotFoundError(`No crand with id : ${companyId}`);
  }

  await company.remove();
  res.status(StatusCodes.OK).json({ msg: 'Success! Company removed.' });
};
