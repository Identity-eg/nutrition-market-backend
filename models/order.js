import mongoose from 'mongoose';
import { PAYMENT_METHODS } from '../constants/paymentMethods.js';
import User from './user.js';
import CustomAPIError from '../errors/custom-api.js';

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
    statics: {
      countByUser: async function () {
        const result = await this.aggregate([
          {
            $group: {
              _id: '$user',
              count: { $sum: 1 },
            },
          },
        ]);

        try {
          result.forEach(async (form) => {
            const user = await User.findById(form._id);
            user.ordersCount = form?.count ?? 0;
            await user.save();
          });

          await User.updateMany({ _id: { $nin: result.map((r) => r._id) } }, [
            {
              $set: {
                ordersCount: 0,
              },
            },
          ]);
        } catch (error) {
          throw new CustomAPIError.BadRequestError(error);
        }
      },
    },
  }
);

orderSchema.post('save', async function (doc) {
  await User.findByIdAndUpdate(doc.user, { $inc: { ordersCount: 1 } });
});

orderSchema.post(['deleteOne'], function () {
  this.model.countByUser();
});

const Order = model('Order', orderSchema);
export default Order;
