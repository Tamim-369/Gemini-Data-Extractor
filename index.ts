import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs/promises";
import inquirer from "inquirer";
import puppeteer from "puppeteer";
import { convert } from "html-to-text";
async function takeScreenshot(url: string, path: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  await page.screenshot({ path });
  await browser.close();
}
async function htmlToText(html: string) {
  return convert(html);
}
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

while (true) {
  const prompt = await inquirer
    .prompt([
      {
        type: "input",
        name: "input",
        message: "Enter your prompt:",
      },
    ])
    .then((answers) => answers);
  //   await takeScreenshot(prompt.url, "screenshot.png");
  //   const image = {
  //     inlineData: {
  //       data: await fs.readFile("screenshot.png", { encoding: "base64" }),
  //       mimeType: "image/png",
  //     },
  //   };
  const htmlFile = await fs.readFile("data.html", { encoding: "utf-8" });
  const text = await htmlToText(htmlFile);
  const result = await model.generateContent([prompt.input, text]);
  const refinedResult = await result.toString().replace(/```|json/g, " ");
  fs.writeFile("output.json", refinedResult);
  console.log(result.response.text());
}
