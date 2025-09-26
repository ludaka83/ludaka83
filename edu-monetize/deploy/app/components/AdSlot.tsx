"use client";
import { useEffect } from "react";

export default function AdSlot({ slot, className }: { slot?: string; className?: string }) {
  const enabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (!enabled || !client) return;
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [enabled, client]);

  if (!enabled) return null;

  if (!client) {
    return (
      <div
        className={className}
        role="complementary"
        aria-label="Advertisement"
        style={{
          background: "#f9fafb",
          color: "#9ca3af",
          padding: 8,
          textAlign: "center",
          borderRadius: 8,
          border: "1px solid #eef2f7",
          fontSize: 12,
          minHeight: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Sponsored
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle ${className ?? ""}`}
      style={{ display: "block", minHeight: 60 }}
      data-ad-client={client}
      data-ad-slot={slot || "0000000000"}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}