import mongoose from 'mongoose';
import dayjs from 'dayjs';

const { model, Schema } = mongoose;

const cartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
        },
        selectedVariant: String,
        amount: {
          type: Number,
          default: 0,
        },
        totalProductPrice: {
          type: Number,
          default: 0,
        },
      },
    ],
    totalItems: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 50,
    },
    expireAt: {
      type: Date,
      default: dayjs().add(15, 'd'),
    },
  },
  {
    timestamps: true,
  }
);

const Cart = model('Cart', cartSchema);
export default Cart;
