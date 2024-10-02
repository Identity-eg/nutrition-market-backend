import mongoose from 'mongoose';
import { countOrdersByUser } from '../middlewares/aggregations.js';
import { PAYMENT_METHODS } from '../constants/paymentMethods.js';

const { model, Schema } = mongoose;
const { ObjectId } = Schema.Types;

const SingleOrderItemSchema = new Schema({
  product: {
    type: ObjectId,
    ref: 'Product',
    required: true,
  },
  amount: { type: Number, default: 1 },
  variant: {
    type: ObjectId,
    ref: 'Variant',
    required: true,
  },
  totalProductPrice: String,
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
      enum: ['processing', 'shipped', 'delivered', 'cancelled'],
      default: 'processing',
    },
    shippingAddress: {
      type: ObjectId,
      ref: 'Address',
      required: true,
    },
    deliveryDate: {
      type: Date,
    },
    clientSecret: {
      type: String,
    },
    paymentIntentId: {
      type: String,
    },
    paid: {
      type: Boolean,
      required: true,
    },
    paymentMethod: {
      type: {
        id: String,
        name: {
          type: String,
          enum: Object.values(PAYMENT_METHODS).map((pm) => pm.name),
        },
      },
      required: true,
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
