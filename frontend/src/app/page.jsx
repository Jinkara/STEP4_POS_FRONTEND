"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const goToPos = () => {
    router.push("/pos"); // ← これで /pos に遷移
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">簡易POSデモ</h1>
      <button
        onClick={goToPos}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
      >
        POS画面を開く
      </button>
    </div>
  );
}
