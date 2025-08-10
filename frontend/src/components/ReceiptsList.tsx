"use client";
import React from "react";

export interface UIItem { id?: string; name?: string; quantity?: number; price?: number | null; lineTotal?: number | null; }
export interface UIReceipt { id: string; storeName?: string | null; purchaseDate?: string | null; totalAmount?: number | null; createdAt?: string; imageUrl?: string | null; items?: UIItem[] }

interface Props {
  receipts?: UIReceipt[];
  loading: boolean;
  error?: Error | { message: string } | null;
}

export const ReceiptsList: React.FC<Props> = ({ receipts, loading, error }) => {
  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Receipts</h2>
        {loading && <span className="text-xs text-gray-400">Loading...</span>}
      </div>
      {error && <p className="text-sm text-red-400">{error.message}</p>}
      <div className="grid md:grid-cols-2 gap-4">
        {receipts?.map((r) => (
          <div key={r.id} className="rounded-lg border border-white/10 p-4 bg-white/5 backdrop-blur">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium truncate max-w-[70%]" title={r.storeName || "(No store)"}>{r.storeName || "(No store)"}</h3>
              <span className="text-xs text-gray-400">{r.purchaseDate ? new Date(r.purchaseDate).toLocaleDateString() : "-"}</span>
            </div>
            <p className="text-sm text-gray-400">Total: {r.totalAmount?.toFixed?.(2) ?? "-"}</p>
            {r.items && r.items.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">{r.items.length} item{r.items.length !== 1 && 's'}</p>
            )}
          </div>
        ))}
        {(!loading && (receipts?.length ?? 0) === 0) && (
          <p className="text-sm text-gray-400">No receipts yet.</p>
        )}
      </div>
    </div>
  );
};
