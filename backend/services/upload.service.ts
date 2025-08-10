import 'dotenv/config';
import fs from "fs";
import process from "process";
import { TextractClient, AnalyzeDocumentCommand } from "@aws-sdk/client-textract";
import { parseProximity } from "./parsers/parseProximity";
import { aiFormatter } from "./parsers/aiFormatter";
import { AIFormattedResult, ParsedReceipt, TextractBlock, AIItem, AIReceipt } from "../types/receipt";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const awsRegion = process.env.AWS_REGION || "us-east-1";
const accessKey = process.env.AWS_ACCESS_KEY_ID;
const secretKey = process.env.AWS_SECRET_ACCESS_KEY;

const textractConfig: any = { region: awsRegion };
if (accessKey && secretKey) {
  textractConfig.credentials = { accessKeyId: accessKey, secretAccessKey: secretKey };
} else {
  console.warn("AWS credentials not fully set in env; falling back to default credential provider chain.");
}
const textractClient = new TextractClient(textractConfig);


const saveItems = async (data: AIFormattedResult): Promise<{ success: boolean; error?: string }> => {
  try {
    const receiptToCreate = {
      storeName: data.receipt.storeName || "",
      purchaseDate: data.receipt.purchaseDate || "",
      totalAmount: data.totalPrice || 0
    };

    const createdReceipt = await prisma.receipt.create({ data: receiptToCreate });
    const receiptId = createdReceipt.id;

    const itemToCreate = data.items.map((item: AIItem) => ({
      name: item.name,
      quantity: item.quantity,
      // price: item.price,
      // lineTotal: item.lineTotal
      receiptId,
    }));

    await prisma.item.createMany({ data: itemToCreate });

    return { success: true };
  } catch (error: any) {
    const message = error?.message || 'Unknown error while saving receipt/items.';
    console.error("Failed to persist receipt/items:", message, error);
    return { success: false, error: message };
  }
};

export const processFile = async (receiptPath: string): Promise<AIFormattedResult | string> => {
  const receiptBytes = fs.readFileSync(receiptPath);

  let blocks: TextractBlock[] = [];
    try {
      const params = {
        Document: { Bytes: receiptBytes },
        FeatureTypes: ["TABLES" as const],
      };
      const command = new AnalyzeDocumentCommand(params as any);
      const response: any = await textractClient.send(command as any);

      blocks = response.Blocks || [];
    } catch (err: any) {
      console.error('Textract call failed:', err?.name || err?.message || err);
      throw new Error('Failed to process receipt image with Textract.');
    }
    
  const parseRecieptReturn: ParsedReceipt = parseProximity(blocks);
  const aiFormatted = await aiFormatter(parseRecieptReturn);

  if (typeof aiFormatted !== "string" && aiFormatted?.items) {
    const saveResult = await saveItems(aiFormatted);
    if (!saveResult.success) {
      throw new Error(`Failed to save extracted receipt data: ${saveResult.error}`);
    }
  }
  return aiFormatted;
};