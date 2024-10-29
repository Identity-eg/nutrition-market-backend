import { StatusCodes } from 'http-status-codes';
import { GOVERNORATES } from '../constants/governorates.js';
import { CITIES } from '../constants/cities.js';

export const getGovernorates = async (req, res) => {
	return res.status(StatusCodes.OK).json({ governorates: GOVERNORATES });
};

export const getGovernorateCities = async (req, res) => {
	const govId = req.params.govId;
	const cities = CITIES.filter(city => city.governorate_id === govId);
	return res.status(StatusCodes.OK).json({ cities });
};
