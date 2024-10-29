import Address from '../models/address.js';
import { StatusCodes } from 'http-status-codes';
import CustomError from '../errors/index.js';

export const createAddress = async (req, res) => {
	const newAddress = await Address.create({
		user: req.user._id,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		governorate: req.body.governorate,
		email: req.body.email,
		city: req.body.city,
		phone: req.body.phone,
		additionalPhone: req.body.additionalPhone,
		street: req.body.street,
		buildingNo: req.body.buildingNo,
		floor: req.body.floor,
	});

	res.status(StatusCodes.CREATED).json({ address: newAddress });
};

export const getAddresses = async (req, res) => {
	const addresses = await Address.find({ user: req.user._id });
	res.status(StatusCodes.CREATED).json({ addresses });
};

export const getSingleAddress = async (req, res) => {
	const address = await Address.findById(req.params.addressId);
	if (!address) {
		throw new CustomError.BadRequestError('No address found with this id');
	}
	res.status(StatusCodes.CREATED).json({ address });
};

export const updateAddress = async (req, res) => {
	const address = await Address.findById(req.params.addressId);
	if (!address) {
		throw new CustomError.BadRequestError('No address found with this id');
	}
	const updatedAddress = await Address.findOneAndUpdate(
		{ _id: req.params.addressId },
		req.body,
		{
			new: true,
			runValidators: true,
		}
	);
	res.status(StatusCodes.CREATED).json({ address: updatedAddress });
};

export const deleteAddress = async (req, res) => {
	const selectedAddressId = req.body.addressId;
	const selectedAddress = await Address.findOneAndRemove({
		$and: [{ user: req.user._id }, { _id: selectedAddressId }],
	});

	if (!selectedAddress) {
		throw new CustomError.BadRequestError('No address found with this id');
	}
	res.status(StatusCodes.CREATED).json({ msg: 'Address deleted successfuly' });
};
