// import { GoogleGenAI } from "@google/genai";
const { GoogleGenAI, Type } = require("@google/genai");

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

const contextInstruction = `Instructions:
1. Extract relevant rows from the input JSON representing food items, quantities, and prices.
2. Identify rows with item details in the format "{quantity} {item name} {price}".
3. Output a JSON OBJECT with:
    - items: array of line items.
      Each line item fields:
        * item: Food or drink's name (string)
        * quantity: Ordered quantity (integer)
        * price: Unit price (float or null if absent)
        * lineTotal: quantity * price (float) OR null if price missing
    - totalPrice: Overall total for ALL items (including tax if an explicit TOTAL line exists). If an explicit total line (e.g. 'TOTAL', 'TOTAL: $42.74', 'Amount Due') is present, prefer that numeric value. Otherwise compute as the sum of all non-null lineTotal values. If both computed sum and explicit total exist but differ by <= 2% (typical rounding/tax), use explicit total. If explicit total differs by > 2% provide explicit total; do not adjust line totals.
4. Ignore irrelevant rows such as restaurant name, address, headers, subheaders.
5. Do NOT invent items.
6. Ensure adaptation across diverse restaurant receipt formats.
7. If no items found return: { "items": [], "totalPrice": 0 }.
`;

const InputJsonInstruction = `Restructure ONLY the provided JSON data (do not invent or guess) parsed from a restaurant receipt into a standardized object: { items: [...], totalPrice }. Use ONLY items explicitly present.`;

async function aiFormatter(parsedReceipt) {
  // console.log("Parsed receipt passed to aiFormatter:");
  // console.dir(parsedReceipt, { depth: null });

  // Ensure we send clean JSON string (model previously received [object Object])
  const serialized = JSON.stringify(parsedReceipt);

  const hardRules = `HARD RULES (do not break):\n- DO NOT create imaginary food/items.\n- Use only lines that explicitly contain a quantity (integer) followed by item name words and (optionally) a price number.\n- Example valid line patterns: "1 Crisfield Special Platter 27.00" , "2 Coke 3.50".\n- Subtotal / tax / total lines are NOT items but may inform totalPrice.\n- Quantities default to 1 only if explicitly shown as 1 (never infer).\n- If no qualifying item lines, return { items: [], totalPrice: 0 }.\n`;

  const prompt = `${InputJsonInstruction}\n${hardRules}\nINPUT_JSON_ROWS: ${serialized}\n${contextInstruction}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item: { type: Type.STRING },
                quantity: { type: Type.INTEGER },
                price: { type: Type.NUMBER, nullable: true },
                lineTotal: { type: Type.NUMBER, nullable: true }
              },
              propertyOrdering: ["item", "quantity", "price", "lineTotal"]
            }
          },
          totalPrice: { type: Type.NUMBER }
        },
        propertyOrdering: ["items", "totalPrice"]
      }
    }
  });

  const raw = response.text;
  // console.log("AI raw response:", raw);
  try {
    const parsed = JSON.parse(raw);
    // Post-validate / compute fallback total if needed
    if (parsed && typeof parsed === 'object') {
      if (!Array.isArray(parsed.items)) parsed.items = [];

      parsed.items = parsed.items.map(li => {
        if (li && (li.lineTotal == null) && typeof li.price === 'number' && typeof li.quantity === 'number') {
          return { ...li, lineTotal: +(li.price * li.quantity).toFixed(2) };
        }
        return li;
      });
      if (typeof parsed.totalPrice !== 'number') {
        const sum = parsed.items
          .filter(li => typeof li.lineTotal === 'number')
          .reduce((acc, li) => acc + li.lineTotal, 0);
        parsed.totalPrice = +sum.toFixed(2);
      }
    }
    return parsed;
  } catch (e) {
    console.warn("Failed to parse AI JSON response, returning raw string.", e.message);
    return raw;
  }
}

module.exports = {
  aiFormatter
};