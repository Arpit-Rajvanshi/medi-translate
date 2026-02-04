import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

export const genAI = new GoogleGenerativeAI(apiKey);
export const fileManager = new GoogleAIFileManager(apiKey);