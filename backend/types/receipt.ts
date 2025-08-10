// Core domain types for receipt OCR pipeline

export interface TextractBoundingBox {
  Top: number;
  Left: number;
  Width: number;
  Height: number;
}

export interface TextractGeometry {
  BoundingBox?: TextractBoundingBox;
}

export interface TextractBlock {
  Id?: string;
  BlockType?: string; // e.g., 'LINE'
  Text?: string;
  Geometry?: TextractGeometry;
  // Other properties from Textract are ignored for now
  [key: string]: any; // allow passthrough
}

export interface ParsedLine {
  id?: string;
  text: string;
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  raw: TextractBlock;
}

export interface ParsedRow {
  text: string;
}

export interface ParsedReceipt {
  rows: ParsedRow[];
}

export interface AIItem {
  name: string;
  quantity: number;
  price: number | null;
  lineTotal: number | null;
}

export interface AIReceipt {
  storeName: string;
  purchaseDate: string;
}

export interface AIFormattedResult {
  items: AIItem[];
  totalPrice: number;
  receipt: AIReceipt;
}
