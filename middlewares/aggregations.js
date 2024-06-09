import Category from '../models/category.js';
import Order from '../models/order.js';
import Product from '../models/product.js';
import User from '../models/user.js';

export async function countOrdersByUser(userId) {
  const result = await Order.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
      },
    },
  ]);

  try {
    const user = await User.findById(userId);
    user.ordersCount = result[0]?.count ?? 0;
    await user.save();
  } catch (error) {
    throw new CustomAPIError.NotFoundError(error);
  }
}

export async function countProductsByCategory() {
  const result = await Product.aggregate([
    { $unwind: '$category' },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
  ]);

  try {
    result.forEach(async (cat) => {
      const category = await Category.findById(cat._id);
      category.productsCount = cat?.count ?? 0;
      await category.save();
    });

    await Category.updateMany({ _id: { $nin: result.map((r) => r._id) } }, [
      {
        $set: {
          productsCount: 0,
        },
      },
    ]);
  } catch (error) {
    throw new CustomAPIError.BadRequestError(error);
  }
};