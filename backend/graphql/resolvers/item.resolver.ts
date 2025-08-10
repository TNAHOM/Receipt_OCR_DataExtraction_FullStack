import { PrismaClient } from "@prisma/client";

interface Context {
  prisma: PrismaClient;
}

export const itemResolver = {
  Query: {
    items: async (_parent: unknown, _args: unknown, ctx: Context) => {
      return ctx.prisma.item.findMany();
    },
    item: async (_parent: unknown, args: { id: string }, ctx: Context) => {
      return ctx.prisma.item.findUnique({
        where: { id: args.id },
      });
    },
  },

  Mutation: {
    createItem: async (
      _parent: unknown,
    args: { data: { name?: string; quantity?: number; price?: number; lineTotal?: number; receiptId: string } },
      ctx: Context
    ) => {
      return ctx.prisma.item.create({
        data: {
          name: args.data.name,
          quantity: args.data.quantity,
      price: args.data.price,
      lineTotal: args.data.lineTotal,
          receipt: { connect: { id: args.data.receiptId } },
        },
      });
    },

    updateItem: async (
      _parent: unknown,
    args: { id: string; data: { name?: string; quantity?: number; price?: number; lineTotal?: number } },
      ctx: Context
    ) => {
      return ctx.prisma.item.update({
        where: { id: args.id },
        data: args.data,
      });
    },

    deleteItem: async (_parent: unknown, args: { id: string }, ctx: Context) => {
      return ctx.prisma.item.delete({
        where: { id: args.id },
      });
    },
  },

  Item: {
    receipt: async (parent: any, _args: unknown, ctx: Context) => {
      return ctx.prisma.receipt.findUnique({
        where: { id: parent.receiptId },
      });
    },
  },
};
