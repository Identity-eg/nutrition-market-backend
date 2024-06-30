import { StatusCodes } from 'http-status-codes';
import Cart from '../models/cart.js';
import Product from '../models/product.js';
import CustomError from '../errors/index.js';

// ################# Get Cart #################
export const getCart = async (req, res) => {
  const { _id: userId } = req.user;
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product items.selectedColor',
    select: 'name price images',
  });

  if (!cart) {
    throw new CustomError.NotFoundError(`No cart for this userid : ${userId}`);
  }
  return res.status(StatusCodes.OK).json({ cart });
};

// ################# Add To Cart #################
export const addItemToCart = async (req, res) => {
  const { _id: userId } = req.user;
  const { amount, color, productId, size } = req.body;
  // console.log(req.body);
  // 1) Check if product doesn't exist
  const product = await Product.findById(productId);
  if (!product) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }

  // // use priceAfterDiscount instead of price after add discount feature
  const { price } = product;

  // 2) Check if cart exists
  const cart = await Cart.findOne({ user: userId });
  if (cart) {
    // Find item index in the cart
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId.toString() &&
        item.selectedColor.toString() === color.toString() &&
        item.selectedSize.toString() === size.toString()
    );

    if (itemIndex === -1) {
      // in case item doesn't exist
      cart.items.push({
        product: productId,
        selectedColor: color,
        selectedSize: size,
        amount,
        totalProductPrice: price * amount,
      });
      cart.totalItems += amount;
      cart.totalPrice += price * amount;
    } else {
      // in case item exists
      cart.items = cart.items.map((item, idx) =>
        idx === itemIndex
          ? {
              ...item,
              amount: item.amount + amount,
              totalProductPrice: item.totalProductPrice + price * amount,
            }
          : item
      );
      cart.totalItems += amount;
      cart.totalPrice += price * amount;
    }
    await cart.save();
    return res.status(StatusCodes.CREATED).json({ cart });
  }

  // 3) In case user doesn't have cart, then create new cart for the user
  const cartData = {
    user: userId,
    items: [
      {
        product: productId,
        selectedColor: color,
        selectedSize: size,
        amount,
        totalProductPrice: price * amount,
      },
    ],
    totalItems: amount,
    totalPrice: price * amount,
  };
  // 4) Create new cart
  const newCart = await Cart.create(cartData);
  // 5) If everything is OK, send cart
  return res.status(StatusCodes.CREATED).json({ cart: newCart });
};

// ################# Increase By Amount #################
export const increaseByone = async (req, res) => {
  const { _id: userId } = req.user;
  const { itemId } = req.params;

  // 2) Check if cart exists
  let cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'price',
  });
  if (!cart) {
    throw new CustomError.NotFoundError(`No cart for user: ${userId}`);
  }

  // Find item index in the cart
  const itemIndex = cart.items.findIndex(
    (item) => item._id.toString() === itemId.toString()
  );

  if (itemIndex === -1)
    throw new CustomError.NotFoundError(`No item with id: ${itemId}`);

  cart.items = cart.items.map((item) =>
    item._id.toString() === itemId.toString()
      ? {
          ...item,
          amount: item.amount + 1,
          totalProductPrice: item.totalProductPrice + item.product.price,
        }
      : item
  );
  cart.totalItems += 1;
  cart.totalPrice += cart.items[itemIndex].product.price;

  await cart.save();
  return res.status(StatusCodes.CREATED).json({ cart });
};

// ################# Reduce By Amount #################
export const reduceByone = async (req, res) => {
  const { _id: userId } = req.user;
  const { itemId } = req.params;

  // 2) Check if cart exists
  let cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'price',
  });
  if (!cart) {
    throw new CustomError.NotFoundError(`No cart for user: ${userId}`);
  }

  // Find item index in the cart
  const itemIndex = cart.items.findIndex(
    (item) => item._id.toString() === itemId.toString()
  );
  if (itemIndex === -1)
    throw new CustomError.NotFoundError(`No item with id: ${itemId}`);

  if (cart.items[itemIndex].amount === 1) {
    cart.totalPrice -= cart.items[itemIndex].product.price;
    cart.items = cart.items.filter(
      (item) => item._id.toString() !== itemId.toString()
    );
  } else {
    cart.items = cart.items.map((item) =>
      item._id.toString() === itemId.toString()
        ? {
            ...item,
            amount: item.amount - 1,
            totalProductPrice: item.totalProductPrice - item.product.price,
          }
        : item
    );
    cart.totalPrice -= cart.items[itemIndex].product.price;
  }

  cart.totalItems -= 1;

  await cart.save();
  return res.status(StatusCodes.CREATED).json({ cart });
};

// ################# Delete Item From Cart #################
export const deleteItemFromCart = async (req, res) => {
  const { _id: userId } = req.user;
  const { itemId } = req.params;

  // 1) Check if cart exists
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new CustomError.NotFoundError(`No cart for user: ${userId}`);
  }

  // 1) Check if item doesn't exist
  const deletedItem = cart.items.find(
    (item) => item._id.toString() === itemId.toString()
  );
  if (!deletedItem) {
    throw new CustomError.NotFoundError(`No item with id: ${itemId}`);
  }

  cart.items = cart.items.filter(
    (item) => item._id.toString() !== itemId.toString()
  );
  cart.totalItems -= deletedItem.amount;
  cart.totalPrice -= deletedItem.totalProductPrice;
  await cart.save();

  return res
    .status(StatusCodes.CREATED)
    .json({ message: 'item deleted successfully from cart' });
};

// ################# Delete Cart #################
export const deleteCart = async (req, res) => {
  const { _id: userId } = req.user;

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new CustomError.NotFoundError(`No cart for this userid : ${userId}`);
  }

  cart.items = [];
  cart.totalItems = 0;
  cart.totalPrice = 0;

  await cart.save();

  return res
    .status(StatusCodes.OK)
    .json({ message: 'cart deleted successfully' });
};
