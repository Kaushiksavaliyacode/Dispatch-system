
import { GoogleGenAI } from "@google/genai";
import { DispatchEntry } from '../types';

// Initialize the Gemini API client
// The API key is retrieved from the environment variable process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDispatchInsights = async (data: DispatchEntry[]): Promise<string> => {
  if (data.length === 0) {
    return "No data available for analysis.";
  }

  // Summarize data to avoid hitting token limits with raw massive JSON
  // We'll take the last 50 entries or aggregate them if this were a real massive app.
  // For this demo, we pass a simplified version of the last 50 entries.
  const recentData = data.slice(-50).map(d => ({
    date: d.date,
    party: d.partyName,
    size: d.size,
    weight: d.weight,
    pcs: d.pcs,
    wastage: (d.productionWeight || 0) - (d.weight || 0)
  }));

  const prompt = `
    Analyze the following dispatch and production data for a steel/material manufacturing company.
    Data (Last 50 entries): ${JSON.stringify(recentData)}

    Please provide a concise executive summary in markdown format.
    Include:
    1. Trend analysis (is volume increasing or decreasing?).
    2. Identification of the most valuable customer (by weight).
    3. Wastage analysis: Are there specific sizes or dates with high wastage (Production Weight vs Dispatched Weight)?
    4. Any anomalies in the size distribution or ordering patterns.
    5. A brief suggestion for inventory planning based on recent demand.

    Keep the tone professional and actionable.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert supply chain analyst assistant.",
      }
    });
    return response.text || "Unable to generate insights.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Error generating AI insights. Please check your API key or internet connection.";
  }
};
