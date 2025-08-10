"use client";
import React from "react";

export interface UIItem { id?: string; name?: string; quantity?: number; price?: number | null; lineTotal?: number | null; }

interface Props {
  items?: UIItem[];
  loading: boolean;
  error?: { message: string } | null;
}

export const ItemsTable: React.FC<Props> = ({ items, loading, error }) => {
    console.log("ItemsTable rendered", { items, loading, error });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">All Items</h2>
        {loading && <span className="text-xs text-gray-400">Loading...</span>}
      </div>
      {error && <p className="text-sm text-red-400">{error.message}</p>}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/10">
            <tr className="text-left">
              <th className="py-2 px-3 font-medium">Name</th>
              <th className="py-2 px-3 font-medium">Qty</th>
              <th className="py-2 px-3 font-medium">Price(per quantity)</th>
              <th className="py-2 px-3 font-medium">Total Item Price</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((it) => (
              <tr key={it.id} className="border-b last:border-b-0 border-white/5">
                <td className="py-1.5 px-3">{it.name}</td>
                <td className="py-1.5 px-3">{it.quantity}</td>
                <td className="py-1.5 px-3">{it.price ?? '-'}</td>
                <td className="py-1.5 px-3">{it.lineTotal ?? '-'}</td>
              </tr>
            ))}
            {(!loading && (items?.length ?? 0) === 0) && (
              <tr><td colSpan={4} className="py-2 px-3 text-center text-gray-400">No items.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
