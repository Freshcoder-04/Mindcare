// server/ai-adapter.ts

/** 1) Target interface every AI provider must implement */
export interface IAIAdapter {
    /**
     * Given a natural‐language prompt, return the raw text response.
     * Caller will parse JSON or do fallback.
     */
    generateFeedback(prompt: string): Promise<string>;
  }
  
  /** 2) Gemini “adaptee” → GeminiAdapter */
  import { GoogleGenerativeAI } from "@google/generative-ai";
  
  export class GeminiAdapter implements IAIAdapter {
    private client: GoogleGenerativeAI;
    constructor(apiKey: string) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
    async generateFeedback(prompt: string): Promise<string> {
      const model = this.client.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp-01-21" });
      const result = await model.generateContent(prompt);
      const resp = await result.response;
      return resp.text();
    }
  }
  
  /** 3) OpenAI “adaptee” → OpenAIAdapter */
  import OpenAI from "openai";
  
  export class OpenAIAdapter implements IAIAdapter {
    private client: OpenAI;
    constructor(apiKey: string) {
      this.client = new OpenAI({ apiKey });
    }
    async generateFeedback(prompt: string): Promise<string> {
      const res = await this.client.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a mental‑health assistant." },
          { role: "user",   content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
      });
      const msg = res.choices?.[0]?.message?.content;
      if (!msg) throw new Error("No content from OpenAI");
      return msg;
    }
  }
  
  /** 4) Factory to produce the correct Adapter at runtime */
  export class AIAdapterFactory {
    static getAdapter(): IAIAdapter {
      const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
      const key      = process.env.AI_API_KEY || "";
      if (provider === "openai") return new OpenAIAdapter(key);
      return new GeminiAdapter(key);
    }
  }
  