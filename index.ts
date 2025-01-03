import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs/promises";
import inquirer from "inquirer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { convert } from "html-to-text";
async function takeHTML(url: string) {
  puppeteer.use(StealthPlugin());
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  // Randomly move the mouse to make it more human-like
  await page.mouse.move(
    Math.floor(Math.random() * 1000),
    Math.floor(Math.random() * 1000)
  );

  // Scroll a little bit
  await page.evaluate(() => {
    window.scrollBy(0, window.innerHeight / 2);
  });

  // Wait for a random time between 1 to 10 seconds
  page.setDefaultTimeout(Math.floor(Math.random() * 9000) + 1000);

  const html = await page.content();
  fs.writeFile("output.html", html);
  await browser.close();
  return html.toString();
}

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const prompt = `you are the best webscraper AI you are an artist in terms of getting raw html data and extracting or mining valuable data from html content now 
please sir give me product data from the provided html the product data should be json and you should only give json data no other data. The json format will look 
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
const result = await model.generateContent([prompt, htmlFile]);
const refinedResult = JSON.stringify(
  JSON.parse(result.response.text().replace(/```|json/g, "")),
  null,
  2
);
fs.writeFile("output.json", refinedResult);
console.log(result.response.text());
