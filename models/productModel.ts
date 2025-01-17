import mongoose, { Schema, Document } from "mongoose";
export interface IProduct extends Document {
  name: string;
  price: number;
  link: string;
  createdAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    link: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const ProductModel = mongoose.model<IProduct>("Product", ProductSchema);

export { ProductModel };
