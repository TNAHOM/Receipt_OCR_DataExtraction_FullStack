"use client";
import React from "react";
import { UIItem, ProcessedResult } from "./UploadForm";

export const ProcessedResultCard: React.FC<{ result: ProcessedResult }> = ({ result }) => {
  console.log(result, "result")
    return (
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
                <th className="py-1 pr-4 font-medium">Price(per quantity)</th>
                <th className="py-1 pr-4 font-medium">Total Item Price</th>
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
  );
};
