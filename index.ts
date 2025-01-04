import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs/promises";
import inquirer from "inquirer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { convert } from "html-to-text";
import { takeHTML } from "./utils/takeHtml";
import { htmlToText } from "html-to-text";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const prompt = `you are the best webscraper AI. You are an artist in terms of getting raw html or text data and extracting or mining valuable data from html or text content. now 
please sir give me product data from the provided html or text the product data should be json and you should only give json data no other data. The json format will look 
like this  {name: string, price:number, link: string}`;
//   await takeScreenshot(prompt.url, "screenshot.png");
//   const image = {
//     inlineData: {
//       data: await fs.readFile("screenshot.png", { encoding: "base64" }),
//       mimeType: "image/png",
//     },
//   };
const url = await inquirer.prompt({
  type: "input",
  name: "url",
  message: "Enter the URL of the website you want to scrape",
});
const htmlFile = await takeHTML(url.url);
const text = htmlToText(htmlFile);
const result = await model.generateContent([prompt, text]);
console.log(JSON.stringify(result));
const refinedResult = JSON.stringify(
  JSON.parse(result.response.text().replace(/```|json/g, "")),
  null,
  2
);
fs.writeFile("output.json", refinedResult);
console.log(result.response.text());
