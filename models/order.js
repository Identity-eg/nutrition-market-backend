import mongoose from 'mongoose';
import { countOrdersByUser } from '../middlewares/aggregations.js';

const { model, Schema } = mongoose;
const { ObjectId } = Schema.Types;

const SingleOrderItemSchema = new Schema({
  product: {
    type: ObjectId,
    ref: 'Product',
    required: true,
  },
  amount: { type: Number, default: 0 },
  price: { type: Number, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
});

const orderSchema = new Schema(
  {
    user: {
      type: ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [SingleOrderItemSchema],
    shippingFee: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'canceled'],
      default: 'pending',
    },
    shippingAddress: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
    },
    clientSecret: {
      type: String,
      // required: true,
    },
    paymentIntentId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.post('save', async function () {
  await countOrdersByUser(this.user);
});

const Order = model('Order', orderSchema);
export default Order;
