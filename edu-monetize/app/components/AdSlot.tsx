"use client";
import { useEffect } from "react";

export default function AdSlot({ slot, className }: { slot?: string; className?: string }) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  if (!client) {
    return (
      <div className={className} style={{ background: "#f3f4f6", color: "#6b7280", padding: 16, textAlign: "center", borderRadius: 8 }}>
        Ad placeholder
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <ins
      className={`adsbygoogle ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot || "0000000000"}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}