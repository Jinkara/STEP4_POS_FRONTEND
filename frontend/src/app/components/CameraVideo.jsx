"use client";
import { forwardRef } from "react";

/**
 * forwardRef は (props, ref) の2引数が必須。
 * 呼び出し側は <CameraVideo ref={videoRef} /> とする。
 * スマホでも自動再生されるよう muted + playsInline + autoPlay 必須。
 */
const CameraVideo = forwardRef(function CameraVideo(props, ref) {
  return (
    <video
      ref={ref}
      muted
      playsInline
      autoPlay
      style={{
        width: "100%",
        height: "260px",
        objectFit: "cover",
        background: "#000",
      }}
      {...props}
    />
  );
});

export default CameraVideo;
