import { PrismaClient } from "@prisma/client";
import { GraphQLError } from "graphql";
import path from "path";
import fs from "fs"
import { v4 as uuidv4 } from "uuid";
import { processFile } from "../../services/upload.service";


interface Context {
  prisma: PrismaClient;
}

export const receiptResolver = {
  Query: {
    receipts: async (_parent: unknown, _args: unknown, ctx: Context) => {
      return ctx.prisma.receipt.findMany({
        include: { items: true }, 
      });
    },

    receipt: async (_parent: unknown, args: { id: string }, ctx: Context) => {
      return ctx.prisma.receipt.findUnique({
        where: { id: args.id },
        include: { items: true },
      });
    },
  },

  Mutation: {
    createReceipt: async (
      _parent: unknown,
      args: {
        storeName?: string;
        purchaseDate?: string;
        totalAmount?: number;
        imageUrl?: string;
      },
      ctx: Context
    ) => {
      return ctx.prisma.receipt.create({
        data: {
          storeName: args.storeName,
          purchaseDate: args.purchaseDate ? new Date(args.purchaseDate) : undefined,
          totalAmount: args.totalAmount,
          imageUrl: args.imageUrl,
        },
      });
    },

    async uploadAndProcess(_parent: unknown, args: { file: Promise<any> }) {
      let tempPath: string | null = null;
      try {
        if (!args.file) {
          throw new Error("No file provided");
        }

        const upload = await args.file;
        if (!upload) throw new Error("Upload payload missing");

        const { createReadStream, filename, mimetype } = upload;
        if (!createReadStream || !filename) {
          throw new Error("Invalid upload object received");
        }

        // Basic mime guard (optional minimal validation)
        if (!/image\//.test(mimetype || "")) {
          throw new Error("Only image uploads are supported");
        }

        const tempDir = path.join(__dirname, "../../uploads");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        tempPath = path.join(tempDir, `${uuidv4()}-${filename}`);

        await new Promise<void>((resolve, reject) => {
          const stream = createReadStream();
          stream
            .on("error", (e: any) => {
              reject(e);
            })
            .pipe(fs.createWriteStream(tempPath as string))
            .on("finish", () => resolve())
            .on("error", reject);
        });

        const aiResult = await processFile(tempPath);

        return { message: "File processed & saved successfully", data: aiResult };
      } catch (err: any) {
        console.error("Upload processing failed:", err);
        throw new GraphQLError(err.message || "Failed to process file", { extensions: { code: "INTERNAL_SERVER_ERROR" } });
      } finally {
        if (tempPath && fs.existsSync(tempPath)) {
          try { fs.unlinkSync(tempPath); } catch {}
        }
      }
    }
  },
};
