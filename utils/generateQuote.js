import OpenAI from "openai";
import { createCanvas, loadImage } from "canvas"; // Ensure you have canvas installed
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate an image
export const generateImage = async () => {
  try {
    const prompts = [
      "Generate a serene background image featuring a tranquil nature scene, such as a sunset over a calm lake or a misty forest, with no text.",
      "Show a panoramic view of a bustling city skyline at dusk, with twinkling lights starting to glow, creating a vibrant yet peaceful scene, with no text.",
      "Generate a breathtaking view of the night sky filled with stars and a glowing galaxy, creating a sense of wonder and infinity, with no text.",
    ];

    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    const imageResponse = await openai.images.generate({
      prompt,
      n: 1,
      size: "1024x1024",
    });
    return imageResponse.data[0].url;
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate an image.");
  }
};

// Generate a quote based on an image
export const generateQuoteFromImage = async () => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a quote generator. Generate an inspirational quote. Then, based on this quote, generate a subject and a message. Return the response in valid JSON format with the following structure:
{
  "quote": "string",
  "subject": "string",
  "message": "string"
},
Do not add any placeholder text or additional commentary. Only return the JSON.`,
        },
      ],
    });

    console.log("Completion", completion.choices[0].message.content);

    const quoteData = completion.choices[0].message.content;

    // const message = await openai.chat.completions.create({
    //   model: "gpt-4o-mini",
    //   messages: [
    //     {
    //       role: "system",
    //       content: `Generate a subject and message based on this ${quote}, Do not add placeholder text. The response should be in json format.`,
    //     },
    //   ],
    // });

    return JSON.parse(quoteData);
  } catch (error) {
    console.error("Error generating quote:", error);
    throw new Error("Failed to generate a quote.");
  }
};

// Add text to image
export const addTextToImage = async (imageUrl, text, logoPath) => {
  const image = await loadImage(imageUrl);
  const logo = await loadImage(logoPath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  // Draw the original image
  ctx.drawImage(image, 0, 0);

  // Create a semi-transparent overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Black overlay with 50% opacity
  ctx.fillRect(0, 0, image.width, image.height); // Full canvas size

  const maxWidth = image.width * 0.9; // 90% of image width
  const fontSize = Math.floor(image.height / 15); // Dynamic font size
  ctx.font = `bold ${fontSize}px Sans`; // Font style
  ctx.fillStyle = "white"; // Text color
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Split text into lines
  const words = text.split(" ");
  let lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine + word + " ";
    const metrics = ctx.measureText(testLine);
    const lineWidth = metrics.width;

    if (lineWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word + " ";
    } else {
      currentLine = testLine;
    }
  });

  lines.push(currentLine);

  // Draw each line centered
  const lineHeight = fontSize * 1.2; // Line height
  const totalHeight = lines.length * lineHeight;
  let y = (canvas.height - totalHeight) / 2; // Center vertically

  lines.forEach((line) => {
    ctx.fillText(line.trim(), canvas.width / 2, y);
    y += lineHeight;
  });

  // Draw the logo at the bottom center
  const logoWidth = image.width * 0.2; // Adjust logo size as needed
  const logoHeight = (logo.height / logo.width) * logoWidth; // Maintain aspect ratio
  ctx.drawImage(
    logo,
    (canvas.width - logoWidth) / 2,
    canvas.height - logoHeight - 20,
    logoWidth,
    logoHeight
  ); // 20px from the bottom

  const buffer = canvas.toBuffer("image/png");
  const outputPath = "output/image-with-quote.png";
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
};
