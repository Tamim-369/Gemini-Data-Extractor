import mongoose from "mongoose";
import { ProductModel, type IProduct } from "./models/productModel";
import { getProductData } from "./services/getProductData";
import cron from "node-cron";
import dotenv from "dotenv";
dotenv.config();
// we can use node cron to run this continuesly
// cron.schedule("0 0 */12 * * *",);
const productDataJob = async () => {
  const allProducts = await ProductModel.find();
  if (!allProducts.length) {
    return {
      success: false,
      message: "No product data found",
    };
  }
  const uniqueProducts = new Map<string, any>();
  await mongoose.connect(process.env.MONGODB_URI!);
  allProducts.forEach((product: IProduct) => {
    const key = `${product.name}-${product.price}`;
    if (
      !uniqueProducts.has(key) ||
      new Date(product.createdAt) > new Date(uniqueProducts.get(key).createdAt)
    ) {
      uniqueProducts.set(key, product);
    }
  });

  const latestProducts = Array.from(uniqueProducts.values());
  console.log(latestProducts);
  await Promise.all([
    latestProducts.map(async (product: IProduct) => {
      const products: IProduct[] = await getProductData(product?.link);
      const selectedProduct: IProduct = products[0];
      const createdProduct = await ProductModel.create({
        ...selectedProduct,
        link: product.link,
      });
      if (!createdProduct) {
        console.log("Failed to add product data");
      }
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }),
  ]);
  return {
    success: true,
    message: "Successfully mined data",
  };
};
productDataJob();
