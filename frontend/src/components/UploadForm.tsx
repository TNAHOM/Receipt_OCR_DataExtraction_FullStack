"use client";
import { useState } from "react";
import { useMutation } from "@apollo/client";
import { UPLOAD_AND_PROCESS } from "@/graphql/mutations/upload";
import { GET_RECEIPTS, GET_ITEMS } from "@/graphql/queries/receipts";

export interface UIItem { id?: string; name?: string; quantity?: number; price?: number | null; lineTotal?: number | null; }
export interface ProcessedResult { message: string; data: { totalPrice: number; items: UIItem[]; receipt: { storeName: string; purchaseDate: string } } }

interface Props {
  onResult: (res: ProcessedResult) => void;
}

export const UploadForm: React.FC<Props> = ({ onResult }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadAndProcess, { loading, error }] = useMutation(UPLOAD_AND_PROCESS, {
    refetchQueries: [ { query: GET_RECEIPTS }, { query: GET_ITEMS } ],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      if (data?.uploadAndProcess) {
        onResult(data.uploadAndProcess);
      }
    }
  });

  const handleUpload = async () => {
    if (!file) return alert("Select a file first");
    try {
      await uploadAndProcess({ variables: { file } });
      setFile(null);
    } catch {}
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
      />
      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className="px-5 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium disabled:opacity-40"
      >
        {loading ? "Processing..." : "Upload & Process"}
      </button>
      {error && <p className="text-sm text-red-400">{error.message}</p>}
    </div>
  );
};
