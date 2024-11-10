import { ChatOpenAI } from "@langchain/openai";

export const gptModal = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-3.5-turbo',
  temperature: 0.3,
  streaming: true,
  maxTokens: 16000,
});