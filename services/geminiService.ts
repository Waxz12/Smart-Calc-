import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse } from "../types";

export const processAIMath = async (query: string): Promise<AIResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Solve this mathematical query or word problem with high precision: "${query}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            result: {
              type: Type.STRING,
              description: "The final numerical result or concise answer. Use 'Unsolvable' if the prompt isn't a math problem.",
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "An array of logical steps taken to solve the problem.",
            },
            reasoning: {
              type: Type.STRING,
              description: "A detailed explanation of the mathematical principles or logic applied.",
            },
            formulaUsed: {
              type: Type.STRING,
              description: "The specific mathematical formula(s) applied, if any.",
            }
          },
          required: ["result", "steps", "reasoning"],
          propertyOrdering: ["result", "formulaUsed", "steps", "reasoning"]
        },
        systemInstruction: "You are a world-class mathematical reasoning engine. Analyze the user's natural language input, identify the underlying mathematical problem, and solve it step-by-step. If the input is not a math problem or is nonsensical, set the result to 'Invalid Query' and explain why in the reasoning. Always return valid JSON."
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return {
        result: "No Result",
        steps: ["The AI returned an empty response."],
        reasoning: "This usually happens if the prompt was blocked by safety filters or the model failed to generate content.",
        error: "Empty response"
      };
    }
    
    try {
      const parsed = JSON.parse(text);
      
      // Handle cases where AI explicitly says it can't solve it
      if (parsed.result === 'Unsolvable' || parsed.result === 'Invalid Query') {
        return {
          result: "Query Error",
          steps: parsed.steps || ["I couldn't identify a clear mathematical problem to solve."],
          reasoning: parsed.reasoning || "Please try rephrasing your question or check if it contains mathematical operations.",
          formulaUsed: parsed.formulaUsed
        };
      }

      return {
        ...parsed,
        result: String(parsed.result)
      } as AIResponse;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw text:", text);
      return {
        result: "Formatting Error",
        steps: ["The AI calculated an answer but failed to format it correctly."],
        reasoning: "The raw response was: " + (text.length > 100 ? text.substring(0, 100) + "..." : text),
        error: "Malformed JSON"
      };
    }
  } catch (error: any) {
    console.error("Gemini AI Error:", error);
    
    let userMessage = "The AI encountered an error processing your request.";
    let technicalReason = "Connection failed or query was ambiguous.";
    
    if (error.message?.includes("API key")) {
      userMessage = "Invalid API Configuration.";
      technicalReason = "The Gemini API key is missing or incorrect. Please check your environment variables.";
    } else if (error.message?.includes("safety")) {
      userMessage = "Content Flagged.";
      technicalReason = "The request was blocked by safety filters. Ensure your query follows safety guidelines.";
    } else if (error.message?.includes("overloaded") || error.status === 503) {
      userMessage = "Gemini is busy.";
      technicalReason = "The AI service is currently overloaded. Please wait a few moments and try again.";
    }

    return {
      result: "Error",
      steps: [userMessage],
      reasoning: technicalReason,
      error: String(error)
    };
  }
};