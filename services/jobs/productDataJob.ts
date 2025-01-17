import mongoose from "mongoose";
import { ProductModel, type IProduct } from "../../models/productModel";
import { getProductData } from "../getProductData";
import cron from "node-cron";
import dotenv from "dotenv";
import { sendEmail } from "../sendEmail";
dotenv.config();
// we can use node cron to run this continuesly
// cron.schedule("0 0 */12 * * *",);
export const productDataJob = async () => {
  const allProducts = await ProductModel.find();
  console.log(allProducts);
  if (!allProducts) {
    return {
      success: false,
      message: "No product data found",
    };
  }
  const uniqueProducts = new Map<string, any>();
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
      const getSecondLatestProduct = await ProductModel.find({
        link: product.link,
      })
        .sort({ createdAt: -1 })
        .limit(2);
      const firstLatestProduct = getSecondLatestProduct[0];
      const secondLatestProduct = getSecondLatestProduct[1];
      if (firstLatestProduct.price !== secondLatestProduct.price) {
        await sendEmail(
          // we can change the email to custom reciever
          process.env.RECIEVER_EMAIL!,
          "Product price changed",
          `The price of ${product.name} has changed from ${firstLatestProduct.price} to ${secondLatestProduct.price}`
        );
      }
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
