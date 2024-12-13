import Cart from '../models/cart.js';

export const syncCart = async (cartId, userId) => {
	const geustCart = await Cart.findById(cartId);
	const userCart = await Cart.findOne({ user: userId });

	if (geustCart && userCart) {
		const arr = [...userCart.items, ...geustCart.items];

		const newOne = Object.values(
			arr.reduce((acc, item) => {
				if (!acc[item.product])
					acc[item.product] = {
						product: item.product,
						variant: item.variant,
						company: item.company,
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
};
