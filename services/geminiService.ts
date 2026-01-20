
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse } from "../types";

export const processAIMath = async (query: string): Promise<AIResponse> => {
  // Always use the latest instance for potential key changes
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Solve this mathematical query or word problem: "${query}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            result: {
              type: Type.STRING,
              description: "The final numerical result or short answer.",
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Logical steps taken to solve it.",
            },
            reasoning: {
              type: Type.STRING,
              description: "Brief explanation of the logic.",
            },
            formulaUsed: {
              type: Type.STRING,
              description: "The specific math formula applied.",
            }
          },
          required: ["result", "steps", "reasoning"],
        },
        systemInstruction: "You are a specialized math reasoning engine. Identify mathematical queries from user natural language and solve them accurately. Always return the output in structured JSON format."
      },
    });

    // property access text (not method) per guidelines
    const textOutput = response.text?.trim() || "{}";
    const parsed = JSON.parse(textOutput);
    
    return { 
      ...parsed, 
      result: String(parsed.result) 
    } as AIResponse;
  } catch (error: any) {
    console.error("AI Math Engine Error:", error);
    return {
      result: "Error",
      steps: ["Calculation could not be completed."],
      reasoning: error.message || "The AI encountered an issue processing your request.",
    };
  }
};
