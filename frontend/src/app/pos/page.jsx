"use client";
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { apiGetProduct, apiPostPurchase } from "../utils/apiClient";
import dynamic from "next/dynamic";

const CameraVideo = dynamic(() => import("@/app/components/CameraVideo"), { ssr: false });

export default function Home() {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [items, setItems] = useState([]);

  // ================== ユーティリティ ==================
  const clean = (v) => String(v || "").replace(/\D/g, "");

  const validEAN13 = (s) => {
    if (!/^\d{13}$/.test(s)) return false;
    const a = [...s].map(Number);
    const c = (10 - (a.slice(0, 12).reduce((t, d, i) => t + d * (i % 2 ? 3 : 1), 0) % 10)) % 10;
    return c === a[12];
  };

  // 手入力でも自動取得
  useEffect(() => {
    const c = clean(code).slice(0, 13);
    if (c.length !== 13) {
      setName("");
      setPrice("");
      return;
    }

    let gone = false;
    (async () => {
      try {
        const p = await apiGetProduct(c);
        if (gone) return;
        if (p) {
          setName(p.name ?? "");
          setPrice(String(p.price_tax_included ?? ""));
        } else {
          setName("");
          setPrice("");
        }
      } catch {
        if (!gone) {
          setName("");
          setPrice("");
        }
      }
    })();
    return () => {
      gone = true;
    };
  }, [code]);

  // ================== スキャン起動 ==================
  const startScan = async () => {
    if (scanning) return;
    setScanning(true);

    try {
      console.log("[SCAN] enumerateDevices...");
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      if (!videoInputs.length) throw new Error("No video input device found");

      let deviceId =
        videoInputs.find((d) => /back|environment/i.test(d.label))?.deviceId ||
        videoInputs[videoInputs.length - 1].deviceId;

      console.log("[SCAN] use deviceId:", deviceId, videoInputs.map((v) => v.label));

      const constraints = {
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("[SCAN] stream acquired");
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();
      console.log("[SCAN] video playing:", video.videoWidth, "x", video.videoHeight);

      // === BarcodeDetector 優先 ===
      if ("BarcodeDetector" in window) {
        console.log("[SCAN] start BarcodeDetector");
        const detector = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a"],
        });
        const loop = async () => {
          if (!scanning) return;
          try {
            const codes = await detector.detect(video);
            if (codes?.length) {
              const raw = clean(codes[0].rawValue);
              if (raw.length === 13 && validEAN13(raw)) {
                console.log("[SCAN] BarcodeDetector detected:", raw);
                setCode(raw);
                stopScan();
                return;
              }
            }
          } catch {}
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
        return;
      }

      // === ZXing フォールバック ===
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      readerRef.current = new BrowserMultiFormatReader(hints, 200);
      console.log("[SCAN] ZXing decodeFromVideoDevice start...");
      controlsRef.current = await readerRef.current.decodeFromVideoDevice(
        deviceId,
        video,
        async (result, err) => {
          if (!scanning) return;
          if (result) {
            const raw = clean(result.getText());
            if (raw.length === 13 && validEAN13(raw)) {
              console.log("[SCAN] ZXing detected:", raw);
              setCode(raw);
              stopScan();
            }
          }
        }
      );
      console.log("[SCAN] ZXing started OK");
    } catch (e) {
      console.error("[SCAN] start failed:", e);
      alert("カメラが使用できません。権限や接続、ブラウザ設定（HTTPS/localhost）を確認してください。");
      setScanning(false);
    }
  };

  const stopScan = () => {
    console.log("[SCAN] stop");
    setScanning(false);
    try {
      if (controlsRef.current) controlsRef.current.stop();
    } catch {}
    try {
      const s = videoRef.current?.srcObject;
      if (s) {
        s.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    } catch {}
  };

  // ================== 商品追加・購入処理 ==================
  const addItem = () => {
    if (!code || !name || !price) return;
    setItems((prev) => [...prev, { code, name, price: Number(price), quantity: 1 }]);
    setCode("");
    setName("");
    setPrice("");
  };

  const handlePurchase = async () => {
    if (items.length === 0) return;
    const res = await apiPostPurchase({
      empCd: "9999999999",
      storeCd: "30",
      posNo: "90",
      items: items.map((i) => ({ code: i.code, quantity: i.quantity })),
    });
    if (res?.success) {
      alert(
        `合計（税込）：${res.totalTaxIncluded} 円\n合計（税抜）：${res.totalExTax} 円`
      );
      setItems([]);
    } else {
      alert("購入処理に失敗しました。");
    }
  };

  const sum = items.reduce((a, i) => a + i.price * i.quantity, 0);

  // ================== UI ==================
  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-xl font-bold mb-4">簡易POS</h1>

      <button
        className={`btn w-full ${
          scanning ? "bg-gray-400" : "bg-blue-600 text-white"
        } mb-3`}
        onClick={scanning ? stopScan : startScan}
      >
        {scanning ? "スキャン停止" : "スキャン（カメラ）"}
      </button>

      <div className="border border-gray-300 mb-4">
        {/* ★ refで渡す（propsではなくref） */}
        <CameraVideo ref={videoRef} />
      </div>

      <input
        className="input input-bordered w-full mb-2"
        placeholder="コード"
        value={code}
        onChange={(e) => setCode(clean(e.target.value).slice(0, 13))}
      />
      <input
        className="input input-bordered w-full mb-2"
        placeholder="名称"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="input input-bordered w-full mb-3"
        placeholder="単価(円)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <button className="btn w-full bg-gray-200 mb-3" onClick={addItem}>
        追加
      </button>

      <h2 className="text-lg font-bold mb-2">購入リスト</h2>
      <div className="mb-2">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="flex justify-between border-b py-1 text-sm"
          >
            <div>{it.name}</div>
            <div>x{it.quantity}</div>
            <div>{it.price}円</div>
          </div>
        ))}
      </div>

      <div className="text-right font-bold mb-4">小計：{sum} 円</div>
      <button
        className="btn w-full bg-blue-600 text-white"
        onClick={handlePurchase}
      >
        購入
      </button>
    </div>
  );
}
