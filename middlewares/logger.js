import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';

export const logEvents = async (message, logFileName) => {
	const dateTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
	const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

	try {
		if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
			await fsPromises.mkdir(path.join(__dirname, '..', 'logs'));
		}
		await fsPromises.appendFile(
			path.join(__dirname, '..', 'logs', logFileName),
			logItem
		);
	} catch (err) {
		console.log(err);
	}
};

export const logger = (req, res, next) => {
	logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, 'reqLog.log');
	console.log(`${req.method} ${req.path}`);
	next();
};
