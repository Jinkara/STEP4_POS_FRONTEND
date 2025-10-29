// POSのために追加
// src/app/utils/apiClient.js
const BASE = process.env.NEXT_PUBLIC_API_ENDPOINT ?? "https://app-002-gen10-step3-1-py-oshima12.azurewebsites.net/";

// デバッグ用（ブラウザで一度だけ表示）
if (typeof window !== "undefined") {
  console.log("API BASE =", BASE);
}

export async function apiGetProduct(code) {
  const r = await fetch(`${BASE}/products/${code}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("get product failed");
  return await r.json();
}

export async function apiPostPurchase(body) {
  const r = await fetch(`${BASE}/purchases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) return null;
  return await r.json();
}
