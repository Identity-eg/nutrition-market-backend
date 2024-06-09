import Review from '../models/review.js';
import Product from '../models/product.js';
import { StatusCodes } from 'http-status-codes';
import CustomError from '../errors/index.js';
import { checkPermissions } from '../utils/index.js';

// ################# Create Review #################
export const createReview = async (req, res) => {
  const { product: productId } = req.body;

  const isValidProduct = await Product.findOne({ _id: productId });

  if (!isValidProduct) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }

  const alreadySubmitted = await Review.findOne({
    product: productId,
    user: req.user._id,
  });

  if (alreadySubmitted) {
    throw new CustomError.BadRequestError(
      'Already submitted review for this product'
    );
  }

  req.body.user = req.user._id;
  const review = await Review.create(req.body);
  res.status(StatusCodes.CREATED).json({ review });
};

// ################# Get All Reviews #################
export const getAllReviews = async (req, res) => {
  let { page = 1, limit = 10 } = req.query;
  let skip = (Number(page) - 1) * Number(limit);
  const queryObject = { ...req.query };
// console.log({queryObject});
  // Pagination & Sort
  delete queryObject.page;
  delete queryObject.limit;

  const reviews = await Review.find(queryObject)
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'user product',
      select: 'name price',
    });
  const reviewsCount = await Review.countDocuments(queryObject);
  const lastPage = Math.ceil(reviewsCount / limit);

  res.status(StatusCodes.OK).json({
    reviews,
    pageCount: reviews.length,
    totalCount: reviewsCount,
    currentPage: Number(page),
    lastPage,
  });
};

// ################# Get Single Review #################
export const getSingleReview = async (req, res) => {
  const { id: reviewId } = req.params;

  const review = await Review.findOne({ _id: reviewId });

  if (!review) {
    throw new CustomError.NotFoundError(`No review with id ${reviewId}`);
  }

  res.status(StatusCodes.OK).json({ review });
};

// ################# Update Review #################
export const updateReview = async (req, res) => {
  const { id: reviewId } = req.params;
  const { rating, title, comment } = req.body;

  const review = await Review.findOne({ _id: reviewId });

  if (!review) {
    throw new CustomError.NotFoundError(`No review with id ${reviewId}`);
  }

  checkPermissions(req.user, review.user);

  review.rating = rating;
  review.title = title;
  review.comment = comment;

  await review.save();
  res.status(StatusCodes.OK).json({ review });
};

// ################# Delete Review #################
export const deleteReview = async (req, res) => {
  const { id: reviewId } = req.params;

  const review = await Review.findOne({ _id: reviewId });

  if (!review) {
    throw new CustomError.NotFoundError(`No review with id ${reviewId}`);
  }

  checkPermissions(req.user, review.user);
  await review.remove();
  res.status(StatusCodes.OK).json({ msg: 'Success! Review removed' });
};

// if you decide to not use virtual
export const getSingleProductReviews = async (req, res) => {
  const { id: productId } = req.params;
  const reviews = await Review.find({ product: productId });
  res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};
