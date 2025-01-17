import inquirer from "inquirer";
import { ProductModel, type IProduct } from "./models/productModel";
import cron from "node-cron";
import { productDataJob } from "./services/jobs/productDataJob";
import { getProductData } from "./services/getProductData";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
await mongoose.connect(process.env.MONGODB_URI!);
const allProduct = await ProductModel.find({});
if (allProduct.length === 0) {
  const answers = await inquirer.prompt({
    type: "input",
    name: "url",
    message: "Please enter a url to continue",
  });
  const url = answers.url.toString();
  const products: IProduct[] = await getProductData(url);
  const selectedProduct = products[0];
  await ProductModel.create({
    ...selectedProduct,
    link: url,
  });
}
cron.schedule("0 */12 * * *", async () => {
  await productDataJob();
});
