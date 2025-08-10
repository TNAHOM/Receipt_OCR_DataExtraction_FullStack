"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_RECEIPTS, GET_ITEMS } from "@/graphql/queries/receipts";
import { UploadForm, ProcessedResult } from "@/components/UploadForm";
import { ProcessedResultCard } from "@/components/ProcessedResultCard";
import { ReceiptsList } from "@/components/ReceiptsList";
import { ItemsTable } from "@/components/ItemsTable";


export default function HomePage() {
  const [result, setResult] = useState<ProcessedResult | null>(null);

  const { data: receiptsData, loading: receiptsLoading, error: receiptsError } = useQuery(GET_RECEIPTS, { fetchPolicy: "cache-and-network" });
  const { data: itemsData, loading: itemsLoading, error: itemsError } = useQuery(GET_ITEMS, { fetchPolicy: "cache-and-network" });

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-10">
      <section className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Receipt OCR Dashboard</h1>
        <UploadForm onResult={setResult} />
        {result && <ProcessedResultCard result={result} />}
      </section>

      <section className="grid lg:grid-cols-3 gap-8">
        <ReceiptsList receipts={receiptsData?.receipts} loading={receiptsLoading} error={receiptsError} />
        <ItemsTable items={itemsData?.items} loading={itemsLoading} error={itemsError} />
      </section>
    </main>
  );
}
