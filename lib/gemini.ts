import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function analyzeBrandFit(product: {
    name: string;
    category: string;
    recommended_price: number;
    images: string[];
}) {
    if (!genAI) {
        console.warn("Gemini API key not found. Skipping AI analysis.");
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
You are a brand consultant for COZIA, a cozy minimalist home goods store.

BRAND IDENTITY:
- Aesthetic: Cozy, warm, minimalist, simple, clean
- Tagline: "Thoughtfully Designed Home Essentials"
- Target: Home enthusiasts who value simplicity and warmth
- Colors: Cream, charcoal, sage green (neutral, calming palette)
- Vibe: Like a warm hug, hygge, peaceful home sanctuary

ANALYZE THIS PRODUCT:
Name: ${product.name}
Category: ${product.category}
Price: $${product.recommended_price}
Images: ${product.images.join(', ')}

SCORING (1-10 for each):
1. COZY FACTOR: Does it feel warm, inviting, comfortable?
2. MINIMALIST DESIGN: Is it simple, clean, not cluttered or busy?
3. HOME RELEVANCE: Is it useful for home/apartment living?
4. QUALITY PERCEPTION: Does it look premium, not cheap or tacky?
5. YEAR-ROUND APPEAL: Can it sell beyond one season?

RESPOND IN THIS EXACT JSON FORMAT:
{
  "scores": {
    "cozy": <1-10>,
    "minimalist": <1-10>,
    "home_relevance": <1-10>,
    "quality": <1-10>,
    "year_round": <1-10>
  },
  "overall_score": <1-10>,
  "recommendation": "<APPROVE|REVIEW|REJECT>",
  "explanation_en": "<1-2 sentence explanation in English>",
  "explanation_kh": "<same explanation in Khmer>"
}

RECOMMENDATION LOGIC:
- APPROVE: Overall score 7-10, fits brand well
- REVIEW: Overall score 5-6, might work with consideration
- REJECT: Overall score 1-4, does not fit brand
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();

        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Gemini analysis failed:", error);
        return null;
    }
}
