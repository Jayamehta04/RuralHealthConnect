// backend/utils/aiHelper.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const getGroqChatCompletion = async (prompt) => {
    const apiKey = process.env.GROQ_API_KEY || process.env.Groq_API_Key;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY is not configured on the server. Please add it to your .env file.');
    }

    // Connect securely to Groq's OpenAI-compatible endpoint using native fetch (No SDK package required)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile", // Groq's flagship fast Llama 3 model
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1 // Keep it deterministic for rigid JSON parsing
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Groq API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
};

exports.extractMedicinesFromText = async (text) => {
    if (!text) return [];

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

    let outputText = await getGroqChatCompletion(prompt);
    
    // Robustly extract JSON if the model included extra conversational text
    let jsonString = outputText;
    const jsonMatch = outputText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
       jsonString = jsonMatch[0];
    } else {
        jsonString = outputText.replace(/```json/gi, '').replace(/```/g, '').trim();
    }

    try {
        const parsedJson = JSON.parse(jsonString);
        return parsedJson;
    } catch (parseError) {
        console.error("Failed to parse Groq output as JSON:", outputText, parseError);
        throw new Error('AI Error: Could not understand the prescription text.');
    }
};

exports.generateHealthAwarenessContent = async (language) => {
    const prompt = `Act as a healthcare awareness assistant for a rural healthcare mobile app.
Your job is to generate simple, practical, and easy-to-understand health awareness content for common people.

IMPORTANT INSTRUCTIONS:
- Topics must heavily feature Home Remedies and general Health Awareness.
- Content must be entirely in ${language} language.
- Use very simple, non-technical language.
- Generate EXACTLY 5 videos and exactly 10 blogs.
- Return ONLY valid JSON matching exactly the structure below, no markdown blocks, no extra text.

STRUCTURE:
{
  "daily_tip": {
    "title": "A short, actionable tip",
    "description": "Details for the tip"
  },
  "videos": [
    {
      "id": "v1",
      "title": "...",
      "description": "...",
      "youtube_search_query": "...",
      "image_keyword": "single english word representing the topic (e.g. running, herbal, food)"
    }
  ],
  "blogs": [
    {
      "id": "b1",
      "title": "...",
      "summary": "...",
      "content": "Full article with line breaks...",
      "image_keyword": "single english word for image search (e.g., honey, lemon, yoga)"
    }
  ]
}`;

    let outputText = await getGroqChatCompletion(prompt);
    
    // Clean up potential markdown formatting securely
    let jsonString = outputText;
    const jsonMatch = outputText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
       jsonString = jsonMatch[0];
    } else {
       jsonString = outputText.replace(/```json/gi, '').replace(/```/g, '').trim();
    }

    try {
        return JSON.parse(jsonString);
    } catch (parseError) {
        console.error("Failed to parse Groq output as JSON:", outputText);
        throw new Error('Failed to process health awareness output from AI.');
    }
};

exports.chatWithAI = async (message, lang, history = []) => {

    // Safely format conversation history into text to avoid formatting strictness errors
    const historyText = history.length > 0 
        ? history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n')
        : "None";

    const prompt = `You are a Final Year Project Level Smart Health Assistant for a rural healthcare app.
Use simple language. Do not give dangerous advice. Always suggest doctor if serious.
User's language preference: ${lang === 'hi' ? 'Hindi / Hinglish' : 'English'}.
Provide the final response fully in the requested language.

You must analyze the symptoms contextually with prior messages.
Severity MUST be one of: "mild", "moderate", "severe".
- Mild -> Home remedies
- Moderate -> Doctor recommended
- Severe -> Immediate emergency

Safe Medical Disclaimer MUST be included exactly as: "This is not a medical diagnosis. Please consult a doctor."

You MUST respond ONLY with a valid JSON object matching this structure (no markdown blocks, no extra text):
{
  "possible_issue": "...",
  "severity": "mild/moderate/severe",
  "advice": "...",
  "next_step": "Consult doctor / Home care / Emergency",
  "precautions": ["...", "..."]
}

Conversation History so far:
${historyText}

Current User Query: "${message}"`;

    let outputText;
    try {
        outputText = await getGroqChatCompletion(prompt);
    } catch (apiError) {
        if (apiError.message?.includes("429")) {
            console.warn("⚠️ Groq API Rate Limit (429) Hit! Serving mock structured response to keep UI functional.");
            outputText = JSON.stringify({
                "possible_issue": "System Rate Limit Triggered",
                "severity": "moderate",
                "advice": "Groq's API quota was reached while developing. Please attach a new API key or wait a moment. This is a placeholder payload.",
                "next_step": "Consult doctor / Home care",
                "precautions": ["Rest", "Drink Water"]
            });
        } else {
            throw apiError;
        }
    }
    
    // Robustly extract JSON if the model included extra conversational text or formatting
    let jsonString = outputText;
    const jsonMatch = outputText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
       jsonString = jsonMatch[0];
    } else {
        jsonString = outputText.replace(/```json/gi, '').replace(/```/g, '').trim();
    }

    try {
        const parsedJson = JSON.parse(jsonString);
        // Ensure disclaimer is there
        if (parsedJson.advice && !parsedJson.advice.includes("medical diagnosis")) {
            const disclaimer = lang === 'hi' ? "यह कोई चिकित्सा निदान नहीं है। कृपया डॉक्टर से संपर्क करें।" : "This is not a medical diagnosis. Please consult a doctor.";
            parsedJson.advice += "\n\nDisclaimer: " + disclaimer;
        }
        return parsedJson;
    } catch (e) {
        console.error("AI JSON Parse Error:", outputText);
        throw new Error("Failed to parse structured AI response.");
    }
};

exports.generateDailyAwareness = async (language, topic) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured on the server.');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a healthcare awareness assistant for a rural mobile app.

Selected Language: ${language}

CRITICAL LANGUAGE RULE:
- If English → output must be 100% in English
- If Hindi → output must be 100% in Hindi (Devanagari only)
- Do NOT mix languages

GOAL:
Generate complete awareness data for the app.

----------------------------------

OUTPUT MUST INCLUDE:

1. Tip of the Day
2. All categories with posts

----------------------------------

CATEGORIES:

- Common Diseases
- Mother & Child
- Nutrition
- Hygiene
- Emergency

----------------------------------

FOR EACH CATEGORY:
- Generate 2 awareness posts

----------------------------------

FOR EACH POST INCLUDE:

- title
- image_query (English only)
- problem_label
- problem
- symptoms_label
- symptoms (3 points)
- remedy_label
- remedies (3 points)
- doctor_label
- doctor (2 points)
- prevention_label
- prevention (1 short, practical line telling what user should do daily to avoid the problem)

----------------------------------

TIP OF THE DAY:

- short helpful tip
- image_query (English only)
- must match selected language

----------------------------------

IMAGE RULES (STRICT):

- image_query must be in English only
- must include a person + action
- must be realistic (no icons, no symbols)
- suitable for small-size fast-loading images (avoid complex scenes, minimal background)

GOOD:
- "woman washing hands with soap"
- "person drinking clean water rural"
- "mother feeding baby at home"

BAD:
- "health icon"
- "medical symbol"
- "abstract image"

----------------------------------

OUTPUT FORMAT (STRICT JSON):

{
  "tip": {
    "text": "...",
    "image_query": "..."
  },
  "categories": {
    "Common Diseases": [ 
      {
        "title": "...",
        "image_query": "...",
        "problem_label": "...",
        "problem": "...",
        "symptoms_label": "...",
        "symptoms": ["...", "...", "..."],
        "remedy_label": "...",
        "remedies": ["...", "...", "..."],
        "doctor_label": "...",
        "doctor": ["...", "..."],
        "prevention_label": "...",
        "prevention": "..."
      } 
    ],
    "Mother & Child": [ ],
    "Nutrition": [ ],
    "Hygiene": [ ],
    "Emergency": [ ]
  }
}

----------------------------------

FINAL CHECK:

- No empty categories
- No mixed language
- All posts must have images
- Tip must match selected language
- Valid JSON only`;

    try {
        const result = await model.generateContent(prompt);
        let outputText = result.response.text();
        
        outputText = outputText.replace(/^```json/gm, '').replace(/^```/gm, '').trim();

        const parsedJson = JSON.parse(outputText);
        return parsedJson;
    } catch (parseError) {
        console.error("Gemini AI failed, returning dynamic category fallback:", parseError.message);
        
        const langIsHindi = language.toLowerCase() === 'hindi';
        return {
            "tip": {
                "text": langIsHindi ? "स्वस्थ रहने के लिए रोज कम से कम 8 गिलास साफ पानी पिएं।" : "Drink at least 8 glasses of clean water every day to stay healthy.",
                "image_query": "person drinking clean water"
            },
            "categories": {
                "Common Diseases": [
                    {
                        "title": langIsHindi ? "बुखार को समझना" : "Understanding Fever",
                        "image_query": "person sitting with fever",
                        "problem_label": langIsHindi ? "समस्या" : "Problem",
                        "problem": langIsHindi ? "बुखार संक्रमण से लड़ने का शरीर का तरीका है।" : "Fever is the body's way of fighting off infection.",
                        "symptoms_label": langIsHindi ? "लक्षण" : "Symptoms",
                        "symptoms": [langIsHindi ? "पूरे शरीर में गर्मी महसूस होना" : "Feeling hot", langIsHindi ? "कमजोरी और थकान" : "Weakness and fatigue", langIsHindi ? "सिर दर्द" : "Headache"],
                        "remedy_label": langIsHindi ? "घरेलू उपाय" : "Home Remedies",
                        "remedies": [langIsHindi ? "ठंडे पानी की पट्टियां रखें" : "Use cold water cloth", langIsHindi ? "खूब साफ पानी पिएं" : "Drink plenty of water", langIsHindi ? "आराम करें" : "Rest well"],
                        "doctor_label": langIsHindi ? "डॉक्टर को कब दिखाएं" : "When to see a doctor",
                        "doctor": [langIsHindi ? "अगर बुखार 2 दिन से अधिक रहता है" : "If fever lasts more than 2 days", langIsHindi ? "सांस लेने में दिक्कत हो" : "Difficulty breathing"],
                        "prevention_label": langIsHindi ? "बचाव टिप" : "Prevention Tip",
                        "prevention": langIsHindi ? "रोजाना साफ पानी पिएं और मच्छरदानी का उपयोग करें।" : "Drink clean water daily and use mosquito nets."
                    }
                ],
                "Mother & Child": [
                    {
                        "title": langIsHindi ? "शिशु पोषण" : "Baby Nutrition",
                        "image_query": "mother feeding baby at home",
                        "problem_label": langIsHindi ? "समस्या" : "Problem",
                        "problem": langIsHindi ? "बच्चों को वृद्धि के लिए सही पोषण की आवश्यकता होती है।" : "Babies need proper nutrition for healthy growth.",
                        "symptoms_label": langIsHindi ? "लक्षण" : "Symptoms",
                        "symptoms": [langIsHindi ? "वजन ना बढ़ना" : "Not gaining weight", langIsHindi ? "चिड़चिड़ापन" : "Irritability", langIsHindi ? "सुस्ती" : "Lethargy"],
                        "remedy_label": langIsHindi ? "घरेलू उपाय" : "Home Remedies",
                        "remedies": [langIsHindi ? "स्तनपान करवाएं" : "Breastfeed regularly", langIsHindi ? "ठोस आहार शुरू करें" : "Start solid foods", langIsHindi ? "फलों का रस दें" : "Give fruit juice"],
                        "doctor_label": langIsHindi ? "डॉक्टर को कब दिखाएं" : "When to see a doctor",
                        "doctor": [langIsHindi ? "यदि बच्चा दूध नहीं पी रहा है" : "If the baby is not feeding well", langIsHindi ? "अत्यधिक उल्टी हो" : "Excessive vomiting"],
                        "prevention_label": langIsHindi ? "बचाव टिप" : "Prevention Tip",
                        "prevention": langIsHindi ? "बच्चे को केवल मां का दूध ही 6 महीने तक पिलाएं।" : "Exclusively breastfeed your baby for the first 6 months."
                    }
                ],
                "Nutrition": [
                    {
                        "title": langIsHindi ? "संतुलित आहार" : "Balanced Diet",
                        "image_query": "family eating healthy food together",
                        "problem_label": langIsHindi ? "समस्या" : "Problem",
                        "problem": langIsHindi ? "बिना सब्जियों के शरीर कमजोर हो सकता है।" : "Without green vegetables, the body can get weak.",
                        "symptoms_label": langIsHindi ? "लक्षण" : "Symptoms",
                        "symptoms": [langIsHindi ? "काम में थकान" : "Tire easily during work", langIsHindi ? "कमजोरी लगना" : "Feeling weak", langIsHindi ? "सुस्ती" : "Lethargy"],
                        "remedy_label": langIsHindi ? "घरेलू उपाय" : "Home Remedies",
                        "remedies": [langIsHindi ? "ताजी सब्जियां खाएं" : "Eat fresh vegetables", langIsHindi ? "दालें शामिल करें" : "Include lentils", langIsHindi ? "फल खाएं" : "Eat fruits"],
                        "doctor_label": langIsHindi ? "डॉक्टर को कब दिखाएं" : "When to see a doctor",
                        "doctor": [langIsHindi ? "अत्यधिक कमजोरी महसूस होने पर" : "If extremely weak all day", langIsHindi ? "वजन तेजी से घटे" : "If weight drops rapidly"],
                        "prevention_label": langIsHindi ? "बचाव टिप" : "Prevention Tip",
                        "prevention": langIsHindi ? "हर भोजन में हरी सब्जियां शामिल करें।" : "Ensure every meal includes green leafy vegetables."
                    }
                ],
                "Hygiene": [
                    {
                        "title": langIsHindi ? "हाथों की सफाई" : "Hand Hygiene",
                        "image_query": "person washing hands with soap",
                        "problem_label": langIsHindi ? "समस्या" : "Problem",
                        "problem": langIsHindi ? "गंदे हाथ पेट की बीमारियों का कारण बनते हैं।" : "Dirty hands cause multiple stomach illnesses.",
                        "symptoms_label": langIsHindi ? "लक्षण" : "Symptoms",
                        "symptoms": [langIsHindi ? "बार-बार पेट दर्द" : "Frequent stomach pain", langIsHindi ? "दस्त" : "Diarrhea", langIsHindi ? "उल्टी" : "Vomiting"],
                        "remedy_label": langIsHindi ? "घरेलू उपाय" : "Home Remedies",
                        "remedies": [langIsHindi ? "सबुन से हाथ धोएं" : "Wash hands with soap", langIsHindi ? "साफ पानी पिएं" : "Drink clean water", langIsHindi ? "नाखून साफ रखें" : "Keep nails clean"],
                        "doctor_label": langIsHindi ? "डॉक्टर को कब दिखाएं" : "When to see a doctor",
                        "doctor": [langIsHindi ? "यदि पेट दर्द गंभीर हो" : "If stomach pain becomes severe", langIsHindi ? "उल्टी न रुके" : "If vomiting doesn't stop"],
                        "prevention_label": langIsHindi ? "बचाव टिप" : "Prevention Tip",
                        "prevention": langIsHindi ? "शौच के बाद और खाने से पहले हमेशा साबुन से हाथ धोएं।" : "Always wash hands with soap after using the toilet and before eating."
                    }
                ],
                "Emergency": [
                    {
                        "title": langIsHindi ? "प्राथमिक उपचार" : "First Aid",
                        "image_query": "helping injured person rural",
                        "problem_label": langIsHindi ? "समस्या" : "Problem",
                        "problem": langIsHindi ? "चोट लगने पर तुरंत सफाई जरूरी है।" : "Immediate cleaning is crucial after an injury.",
                        "symptoms_label": langIsHindi ? "लक्षण" : "Symptoms",
                        "symptoms": [langIsHindi ? "खून बहना" : "Bleeding", langIsHindi ? "दर्द" : "Pain", langIsHindi ? "सूजन" : "Swelling"],
                        "remedy_label": langIsHindi ? "घरेलू उपाय" : "Home Remedies",
                        "remedies": [langIsHindi ? "घाव को साफ पानी से धोएं" : "Wash wound with clean water", langIsHindi ? "साफ कपड़ा बांधें" : "Tie a clean cloth", langIsHindi ? "दबाव बनाएं" : "Apply pressure"],
                        "doctor_label": langIsHindi ? "डॉक्टर को कब दिखाएं" : "When to see a doctor",
                        "doctor": [langIsHindi ? "अगर खून बहना ना रुके" : "If bleeding doesn't stop", langIsHindi ? "चोट गहरी हो" : "If cut is deep"],
                        "prevention_label": langIsHindi ? "बचाव टिप" : "Prevention Tip",
                        "prevention": langIsHindi ? "खेत या सड़क पर हमेशा चप्पल या जूते पहनें।" : "Always wear shoes or slippers while farming or walking."
                    }
                ]
            }
        };
    }
};
