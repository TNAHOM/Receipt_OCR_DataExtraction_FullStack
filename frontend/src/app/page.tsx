"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { UPLOAD_AND_PROCESS } from "@/graphql/mutations/upload";
import { GET_RECEIPTS, GET_ITEMS } from "@/graphql/queries/receipts";

interface UIItem { id?: string; name?: string; quantity?: number; price?: number | null; lineTotal?: number | null; }
interface UIReceipt { id: string; storeName?: string | null; purchaseDate?: string | null; totalAmount?: number | null; createdAt?: string; imageUrl?: string | null; items?: UIItem[] }
interface ProcessedResult { message: string; data: { totalPrice: number; items: UIItem[]; receipt: { storeName: string; purchaseDate: string } } }

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ProcessedResult | null>(null);

  const { data: receiptsData, loading: receiptsLoading, error: receiptsError, refetch: refetchReceipts } = useQuery(GET_RECEIPTS, { fetchPolicy: "cache-and-network" });
  const { data: itemsData, loading: itemsLoading, error: itemsError } = useQuery(GET_ITEMS, { fetchPolicy: "cache-and-network" });
  const [uploadAndProcess, { loading: uploadLoading, error: uploadError }] = useMutation(UPLOAD_AND_PROCESS, {
    onCompleted: () => {
      // refresh receipts list after upload if backend eventually persists them (future-proof)
      refetchReceipts();
    }
  });

  const handleUpload = async () => {
    if (!file) return alert("Select a file first");
    try {
      const { data } = await uploadAndProcess({ variables: { file } });
      setResult(data.uploadAndProcess);
      setFile(null);
    } catch {
      /* handled by apollo error state */
    }
  };

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-10">
      <section className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Receipt OCR Dashboard</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
          />
          <button
            onClick={handleUpload}
            disabled={uploadLoading || !file}
            className="px-5 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium disabled:opacity-40"
          >
            {uploadLoading ? "Processing..." : "Upload & Process"}
          </button>
          {uploadError && <p className="text-sm text-red-400">{uploadError.message}</p>}
        </div>
        {result && (
          <div className="mt-6 border border-indigo-500/30 rounded-lg p-4 bg-indigo-950/20">
            <h2 className="font-medium text-indigo-300 mb-2">Latest Processed Result</h2>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Store</p>
                <p className="font-medium">{result.data.receipt.storeName}</p>
              </div>
              <div>
                <p className="text-gray-400">Date</p>
                <p className="font-medium">{new Date(result.data.receipt.purchaseDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-400">Total</p>
                <p className="font-medium">{result.data.totalPrice?.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-gray-400 mb-1 text-sm">Extracted Items</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left border-b border-white/10">
                      <th className="py-1 pr-4 font-medium">Name</th>
                      <th className="py-1 pr-4 font-medium">Qty</th>
                      <th className="py-1 pr-4 font-medium">Price</th>
                      <th className="py-1 pr-4 font-medium">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.items.map((it: UIItem, i: number) => (
                      <tr key={i} className="border-b last:border-b-0 border-white/5">
                        <td className="py-1 pr-4">{it.name}</td>
                        <td className="py-1 pr-4">{it.quantity}</td>
                        <td className="py-1 pr-4">{it.price ?? "-"}</td>
                        <td className="py-1 pr-4">{it.lineTotal ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Receipts</h2>
            {receiptsLoading && <span className="text-xs text-gray-400">Loading...</span>}
          </div>
          {receiptsError && <p className="text-sm text-red-400">{receiptsError.message}</p>}
          <div className="grid md:grid-cols-2 gap-4">
            {receiptsData?.receipts?.map((r: UIReceipt) => (
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
            {(!receiptsLoading && receiptsData?.receipts?.length === 0) && (
              <p className="text-sm text-gray-400">No receipts yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Items</h2>
            {itemsLoading && <span className="text-xs text-gray-400">Loading...</span>}
          </div>
          {itemsError && <p className="text-sm text-red-400">{itemsError.message}</p>}
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/10">
                <tr className="text-left">
                  <th className="py-2 px-3 font-medium">Name</th>
                  <th className="py-2 px-3 font-medium">Qty</th>
                  <th className="py-2 px-3 font-medium">Price</th>
                  <th className="py-2 px-3 font-medium">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {itemsData?.items?.map((it: UIItem) => (
                  <tr key={it.id} className="border-b last:border-b-0 border-white/5">
                    <td className="py-1.5 px-3">{it.name}</td>
                    <td className="py-1.5 px-3">{it.quantity}</td>
                    <td className="py-1.5 px-3">{it.price ?? '-'}</td>
                    <td className="py-1.5 px-3">{it.lineTotal ?? '-'}</td>
                  </tr>
                ))}
                {(!itemsLoading && itemsData?.items?.length === 0) && (
                  <tr><td colSpan={4} className="py-2 px-3 text-center text-gray-400">No items.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
