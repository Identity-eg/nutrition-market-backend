import { StatusCodes } from 'http-status-codes';
import Cart from '../models/cart.js';
import Product from '../models/product.js';
import CustomError from '../errors/index.js';
import { jwtDecode } from 'jwt-decode';

// ################# Get Cart #################
export const getCart = async (req, res) => {
  const cookies = req.cookies;
  const cartId = cookies['cart_id'] || req.body.cartId;

  const refreshToken =
    cookies[process.env.REFRESH_TOKEN_NAME] || req.body.refreshToken;
  const user = refreshToken ? jwtDecode(refreshToken) : undefined;

  const cart = await Cart.findOne({
    $or: [
      { $and: [{ user: { $exists: true } }, { user: user?._id }] },
      { $and: [{ user: { $exists: false } }, { _id: cartId }] },
    ],
  }).populate({
    path: 'items.product',
    select: 'name price images',
  });

  if (!cart) {
    throw new CustomError.NotFoundError(`No Cart Found`);
  }
  return res.status(StatusCodes.OK).json({ cart });
};

// #################### Add To Cart ####################
export const addItemToCart = async (req, res) => {
  // const { _id: userId } = req.user;
  const { amount, variantId, productId } = req.body;

  // 1) Check if product doesn't exist
  const product = await Product.findById(productId);
  if (!product) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }

  // // use priceAfterDiscount instead of price after add discount feature
  const { price, priceAfterDiscount } = product;

  // #################################################################
  const cookies = req.cookies;
  const cartId = cookies['cart_id'];

  const refreshToken = cookies[process.env.REFRESH_TOKEN_NAME];
  const user = refreshToken ? jwtDecode(refreshToken) : undefined;
  // #################################################################

  // 2) Check if cart exists
  const cart = await Cart.findOne({
    $or: [
      { $and: [{ user: { $exists: true } }, { user: user?._id }] },
      { $and: [{ user: { $exists: false } }, { _id: cartId }] },
    ],
  });

  if (cart) {
    // Find item index in the cart
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId.toString() &&
        item?.selectedVariant?.toString() === variantId?.toString()
    );

    console.log({ itemIndex });

    if (itemIndex === -1) {
      // in case item doesn't exist
      cart.items.push({
        product: productId,
        selectedVariant: variantId,
        amount,
        totalProductPrice: (priceAfterDiscount || price) * amount,
      });
      cart.totalItems += amount;
      cart.totalPrice += (priceAfterDiscount || price) * amount;
    } else {
      // in case item exists
      cart.items = cart.items.map((item, idx) =>
        idx === itemIndex
          ? {
              ...item,
              amount: item.amount + amount,
              totalProductPrice:
                item.totalProductPrice + (priceAfterDiscount || price) * amount,
            }
          : item
      );
      cart.totalItems += amount;
      cart.totalPrice += (priceAfterDiscount || price) * amount;
    }
    await cart.save();
    return res.status(StatusCodes.CREATED).json({ msg: 'Added successfully' });
  }

  // 3) In case user doesn't have cart, then create new cart for the user
  const cartData = {
    user: user?._id,
    items: [
      {
        product: productId,
        selectedVariant: variantId,
        amount,
        totalProductPrice: (priceAfterDiscount || price) * amount,
      },
    ],
    totalItems: amount,
    totalPrice: (priceAfterDiscount || price) * amount,
  };
  // 4) Create new cart
  const newCart = await Cart.create(cartData);
  console.log({ body: req.body });

  if (!user) {
    return res
      .status(StatusCodes.CREATED)
      .json({ msg: 'Added successfully', cartId: newCart._id });
  }

  // 5) If everything is OK, send cart
  return res.status(StatusCodes.CREATED).json({ msg: 'Added successfully' });
};

// #################### Add To Cart ####################
export const syncCart = async (req, res) => {
  const { _id: userId } = req.user;

  const cookies = req.cookies;
  const cartId = cookies['cart_id'];
  const geustCart = await Cart.findById(cartId);
  const userCart = await Cart.findOne({ user: userId });
  console.log('inside sync cart');

  if (geustCart && userCart) {
    const arr = [...userCart.items, ...geustCart.items];

    const newOne = Object.values(
      arr.reduce((acc, item) => {
        if (!acc[item.product])
          acc[item.product] = {
            product: item.product,
            selectedVariant: item.selectedVariant,
            _id: item._id,
            amount: 0,
            totalProductPrice: 0,
          };

        acc[item.product].amount += item.amount;
        acc[item.product].totalProductPrice += item.totalProductPrice;
        return acc;
      }, {})
    );

    userCart.items = newOne;
    userCart.totalItems += geustCart.totalItems;
    userCart.totalPrice += geustCart.totalPrice;

    await userCart.save();
    await geustCart.deleteOne();
  } else if (geustCart) {
    geustCart.user = userId;
    await geustCart.save();
  }
  return res.status(StatusCodes.CREATED).json({ msg: 'Sync successfully' });
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
  let isCartEmpty = false;

  const cookies = req.cookies;
  const cartId = cookies['cart_id'];

  const refreshToken = cookies[process.env.REFRESH_TOKEN_NAME];
  const user = refreshToken ? jwtDecode(refreshToken) : undefined;

  const { itemId } = req.params;

  // 1) Check if cart exists
  const cart = await Cart.findOne({
    $or: [
      { $and: [{ user: { $exists: true } }, { user: user?._id }] },
      { $and: [{ user: { $exists: false } }, { _id: cartId }] },
    ],
  });

  if (!cart) {
    throw new CustomError.NotFoundError(`No cart Found`);
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

  if (cart.totalItems === 0) {
    await cart.deleteOne();
    isCartEmpty = true;
  }

  return res
    .status(StatusCodes.CREATED)
    .json({ message: 'item deleted successfully from cart', isCartEmpty });
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
