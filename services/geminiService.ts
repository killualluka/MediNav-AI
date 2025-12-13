import { GoogleGenAI, Type } from "@google/genai";
import { AgentId, RouterResponse, Message } from '../types';
import { AGENTS, NAVIGATOR_SYSTEM_INSTRUCTION } from '../constants';

const apiKey = process.env.API_KEY || '';

// Initialize client
// Note: In a real production app, ensure API key is present.
const ai = new GoogleGenAI({ apiKey });

/**
 * Determines which agent should handle the user query.
 * Uses a Flash model for speed and JSON output for reliability.
 */
export const routeQuery = async (userText: string): Promise<RouterResponse> => {
  if (!apiKey) throw new Error("API Key is missing");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userText,
      config: {
        systemInstruction: NAVIGATOR_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            target: { type: Type.STRING, enum: [AgentId.PIA, AgentId.AS, AgentId.MRA, AgentId.BIA] },
            reasoning: { type: Type.STRING },
            context: { type: Type.STRING }
          },
          required: ['target', 'reasoning', 'context']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Router");
    
    return JSON.parse(text) as RouterResponse;

  } catch (error) {
    console.error("Routing error:", error);
    // Fallback to Patient Info Agent if routing fails
    return {
      target: AgentId.PIA,
      reasoning: "Fallback due to routing error",
      context: userText
    };
  }
};

/**
 * Generates a response from a specific sub-agent.
 * Supports Search Grounding if configured for that agent.
 */
export const generateAgentResponse = async (
  agentId: AgentId, 
  history: Message[], 
  currentInput: string
): Promise<{ text: string, sources?: Array<{title: string, uri: string}> }> => {
  if (!apiKey) throw new Error("API Key is missing");

  const agent = AGENTS[agentId];
  if (!agent) throw new Error("Invalid Agent ID");

  // Construct history for context
  // We limit context window slightly for efficiency
  const recentHistory = history.slice(-10).map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  const tools = agent.useSearch ? [{ googleSearch: {} }] : [];
  
  // MRA handles sensitive data, so we might use a smarter model, 
  // others use Flash for speed.
  const modelName = agentId === AgentId.MRA || agentId === AgentId.BIA 
    ? 'gemini-2.5-flash' // Using Flash for all for speed in this demo, could be 'gemini-3-pro-preview'
    : 'gemini-2.5-flash';

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        ...recentHistory,
        { role: 'user', parts: [{ text: currentInput }] }
      ],
      config: {
        systemInstruction: agent.systemInstruction,
        tools: tools,
      }
    });

    const text = response.text || "I apologize, I couldn't generate a response.";
    
    // Extract sources if grounding was used
    let sources: Array<{title: string, uri: string}> = [];
    
    if (response.candidates && response.candidates[0].groundingMetadata?.groundingChunks) {
       response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sources.push({
              title: chunk.web.title || "Source",
              uri: chunk.web.uri
            });
          }
       });
    }

    return { text, sources: sources.length > 0 ? sources : undefined };

  } catch (error) {
    console.error(`Agent ${agentId} error:`, error);
    return { text: "I am having trouble accessing the system right now. Please try again later." };
  }
};