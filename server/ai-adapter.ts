// server/ai-adapter.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

/** 1) Target interface */
export interface IAIAdapter {
  generateFeedback(prompt: string): Promise<string>;
  /** stream tokens as they arrive */
  streamFeedback(prompt: string): AsyncIterable<string>;
}

/** 2) GeminiAdapter */
export class GeminiAdapter implements IAIAdapter {
  private client = new GoogleGenerativeAI(process.env.AI_API_KEY!);

  async generateFeedback(prompt: string): Promise<string> {
    const model = this.client.getGenerativeModel({ model: "gemini-turbo" });
    const result = await model.generateContent(prompt);
    const resp = await result.response;
    return resp.text();
  }

  async *streamFeedback(prompt: string): AsyncIterable<string> {
    const model = this.client.getGenerativeModel({ model: "gemini-turbo" });
    const stream = model.generateContent(prompt, { stream: true });
    for await (const chunk of stream) {
      yield chunk.text();
    }
  }
}

/** 3) OpenAIAdapter */
export class OpenAIAdapter implements IAIAdapter {
  private client = new OpenAI({ apiKey: process.env.AI_API_KEY });

  async generateFeedback(prompt: string): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
    return res.choices[0].message?.content ?? "";
  }

  async *streamFeedback(prompt: string): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      stream: true,
    });

    for await (const part of stream) {
      const content = part.choices[0]?.delta?.content;
      if (content) yield content;
    }
  }
}

/** 4) Factory */
export class AIAdapterFactory {
  static getAdapter(): IAIAdapter {
    const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
    return provider === "openai"
      ? new OpenAIAdapter()
      : new GeminiAdapter();
  }
}
