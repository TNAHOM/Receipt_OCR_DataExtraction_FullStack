import 'dotenv/config';
import { GoogleGenAI, Type } from "@google/genai";
import { ParsedReceipt, AIFormattedResult } from "../../types/receipt";

// Initialize client with explicit API key (no ADC needed)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
} else {
  console.warn("GEMINI_API_KEY not set – AI formatting will return raw parsed receipt.");
}

const contextInstruction = `Instructions:
1. Extract relevant rows from the input JSON representing food items, quantities, and prices.
2. Identify rows with item details in the format "{quantity} {item name} {price}".
3. Output a JSON OBJECT with:
    .- items: array of line items.
      Each line item fields:
        * name: Food or drink's name (string)
        * quantity: Ordered quantity (integer)
        * price: Unit price (float or null if absent)
        * lineTotal: quantity * price (float) OR null if price missing
    - totalPrice: Overall total for ALL items (including tax if an explicit TOTAL line exists). If an explicit total line (e.g. 'TOTAL', 'TOTAL: $42.74', 'Amount Due') is present, prefer that numeric value. Otherwise compute as the sum of all non-null lineTotal values. If both computed sum and explicit total exist but differ by <= 2% (typical rounding/tax), use explicit total. If explicit total differs by > 2% provide explicit total; do not adjust line totals.
    - Receipt: its object that contains relevant information about the receipts storename and other relevant information besides the items.
      The object contains:
      * storeName: Name of the store (string)
      * purchaseDate: Date of the receipt (DateTime format, e.g., "2024-06-01T12:34:56.000Z")
4. Ignore irrelevant rows such as restaurant name, address, headers, subheaders.
5. Do NOT invent items.
6. Ensure adaptation across diverse restaurant receipt formats.
7. If no items found return: { "items": [], "totalPrice": 0 }.
`;

const InputJsonInstruction = `Restructure ONLY the provided JSON data (do not invent or guess) parsed from a restaurant receipt into a standardized object: { items: [...], totalPrice }. Use ONLY items explicitly present.`;

export async function aiFormatter(parsedReceipt: ParsedReceipt): Promise<AIFormattedResult | string> {
  if (!ai) {
    return { items: [], totalPrice: 0, receipt: { storeName: "", purchaseDate: "" } } as AIFormattedResult;
  }

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
                name: { type: Type.STRING },
                quantity: { type: Type.INTEGER },
                price: { type: Type.NUMBER, nullable: true },
                lineTotal: { type: Type.NUMBER, nullable: true }
              },
              propertyOrdering: ["name", "quantity", "price", "lineTotal"]
            }
          },
          totalPrice: { type: Type.NUMBER },
          receipt: {
            type: Type.OBJECT,
            properties: {
              storeName: { type: Type.STRING },
              purchaseDate: { type: Type.STRING, format: "date-time" }
            },
            required: ["storeName", "purchaseDate"]
          }
        },
        propertyOrdering: ["items", "totalPrice", "receipt"]
      }
    }
  });

  const raw = (response as any).text as string;
  // console.log("AI raw response:", raw);
  try {
    const parsed: AIFormattedResult | any = JSON.parse(raw);

    // used to calculate the total price if in the parsed receipt doesnt return a totalPrice dueo to poor image or any reason
    if (parsed && typeof parsed === 'object') {
      if (!Array.isArray((parsed as any).items)) (parsed as any).items = [];

      (parsed as any).items = (parsed as any).items.map((li: any) => {
        if (li && (li.lineTotal == null) && typeof li.price === 'number' && typeof li.quantity === 'number') {
          return { ...li, lineTotal: +(li.price * li.quantity).toFixed(2) };
        }
        return li;
      });
      if (typeof (parsed as any).totalPrice !== 'number') {
        const sum = (parsed as any).items
          .filter((li: any) => typeof li.lineTotal === 'number')
          .reduce((acc: number, li: any) => acc + (li.lineTotal || 0), 0);
        (parsed as any).totalPrice = +sum.toFixed(2);
      }
    }
    return parsed as AIFormattedResult;
  } catch (e: unknown) {
    console.warn("Failed to parse AI JSON response, returning raw string.", (e as Error).message);
    return raw;
  }
}