import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs/promises";
import inquirer from "inquirer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { convert, htmlToText } from "html-to-text";
import { takeHTML } from "./takeHtml";
import { prompt } from "./prompt";

dotenv.config();
export const getProductData = async () => {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
  if (htmlFile === "" || htmlFile === null || htmlFile === undefined) {
    return {
      error: "failed to take html",
    };
  }
  const text = await htmlToText(htmlFile);
  let result: any = await model.generateContent([prompt, text]);
  const jsonData = JSON.stringify(result);
  if (jsonData.includes("MAX_TOKENS") || jsonData.includes("parts")) {
    result = JSON.parse(jsonData).response.candidates[0].content.parts[0].text;
  } else {
    result = result.response.text;
  }
  const refinedResult = JSON.stringify(
    await JSON.parse(result.toString().replace(/```|json/g, "")),
    null,
    2
  );
  return refinedResult;
};
