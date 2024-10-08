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
    const prompt =
      "Create an image focusing on themes of sales, negotiation, marketing, or motivation. The image should inspire real estate professionals to improve their sales techniques and stay motivated. It could depict scenarios like a handshake to symbolize closing deals, a presentation to represent marketing skills, or a confident agent to embody motivation.";

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
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
export const generateQuoteFromImage = async (imageUrl) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a AI real estate Agent that gives guidance tailored to the users needs in Sales, Negotiation and Marketing. Generate an inspirational real estate, sales, negotiation, or marketing related quote based on the image. The quote should be similar in length to "Focus on building relationships, not just closing deal." Then, based on the generated quote, provide a subject and a message.`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "Quote",
          schema: {
            type: "object",
            properties: {
              quote: {
                type: "string",
              },
              subject: {
                type: "string",
              },
              message: {
                type: "string",
              },
            },
            required: ["quote", "subject", "message"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
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
  ctx.font = `bold ${fontSize}px Tahoma`; // Font style
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
  const logoWidth = image.width * 0.25; // Adjust logo size as needed
  const logoHeight = (logo.height / logo.width) * logoWidth; // Maintain aspect ratio
  ctx.drawImage(
    logo,
    (canvas.width - logoWidth) / 2,
    canvas.height - logoHeight - 40,
    logoWidth,
    logoHeight
  ); // 20px from the bottom

  const buffer = canvas.toBuffer("image/png");
  const outputPath = "output/image-with-quote.png";
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
};
