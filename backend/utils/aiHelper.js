const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.extractMedicinesFromText = async (text) => {
    if (!text) return [];
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured on the server.');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a strict medical prescription parser for a healthcare app.

Your task is to extract medicines and convert them into reminder-ready structured JSON.

STRICT RULES:
* Do NOT assume or add any medicine.
* Extract ONLY what is clearly written.
* If something is unclear, ignore it.
* Do NOT hallucinate.
* Return ONLY JSON, no explanation, no markdown blocks. Just the raw JSON string.

EXTRACT:
* medicine name
* dosage (e.g., 1 tablet, 5ml)
* timing (convert to exact time format)
* frequency (if mentioned)
* duration (if mentioned)

TIME CONVERSION RULES:
* morning → 08:00
* afternoon → 14:00
* evening → 18:00
* night → 20:00
* If specific time given (e.g., 9pm) → convert to 24-hour (21:00)

OUTPUT FORMAT:
[
  {
    "medicine": "",
    "dosage": "",
    "times": [],
    "frequency": null,
    "duration_days": null
  }
]

EXAMPLE:
Input: "Paracetamol 1 tablet at 9pm"
Output:
[
  {
    "medicine": "Paracetamol",
    "dosage": "1 tablet",
    "times": ["21:00"],
    "frequency": null,
    "duration_days": null
  }
]

Input: "${text}"
Output:`;

    const result = await model.generateContent(prompt);
    let outputText = result.response.text();
    
    // Clean up potential markdown formatting
    outputText = outputText.replace(/^```json/m, '').replace(/^```/m, '').trim();

    try {
        const parsedJson = JSON.parse(outputText);
        return parsedJson;
    } catch (parseError) {
        console.error("Failed to parse Gemini output as JSON:", outputText);
        throw new Error('Failed to process prescription output from AI.');
    }
};
