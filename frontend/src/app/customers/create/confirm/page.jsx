"use client";

import OneCustomerInfoCard from "@/app/components/one_customer_info_card.jsx";
import fetchCustomer from "./fetchCustomer";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function ConfirmInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customer_id = searchParams.get("customer_id");
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const fetchAndSetCustomer = async () => {
      if (customer_id) {
        const customerData = await fetchCustomer(customer_id);
        setCustomer(customerData);
      }
    };
    fetchAndSetCustomer();
  }, [customer_id]);

  return (
    <>
      <div className="card bordered bg-white border-blue-200 border-2 max-w-sm m-4">
        <div className="alert alert-success p-4 text-center">
          正常に作成しました
        </div>
        {customer ? (
          <OneCustomerInfoCard {...customer} />
        ) : (
          <div className="text-gray-500 p-4">読み込み中...</div>
        )}
        <button onClick={() => router.push("/customers")}>
          <div className="btn btn-primary m-4 text-2xl">戻る</div>
        </button>
      </div>
    </>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="p-4 text-gray-500">読み込み中...</div>}>
      <ConfirmInner />
    </Suspense>
  );
}
