"use client";

import { Toaster as HotToaster } from "react-hot-toast";

/** Toaster global (react-hot-toast) com a paleta Faísca. */
export function Toaster() {
  return (
    <HotToaster
      position="top-center"
      containerStyle={{ top: "calc(12px + env(safe-area-inset-top))" }}
      toastOptions={{
        duration: 4000,
        style: {
          background: "rgb(29 22 49)", // surface-2
          color: "rgb(244 241 250)", // text
          border: "1px solid hsl(256 24% 30%)", // border-strong
          borderRadius: "16px", // radius-md
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          fontSize: "14px",
          lineHeight: "1.5",
          padding: "10px 14px",
          boxShadow: "0 24px 48px -24px rgb(0 0 0 / .75)",
        },
        success: { iconTheme: { primary: "rgb(52 211 153)", secondary: "rgb(29 22 49)" } },
        error: { iconTheme: { primary: "rgb(248 113 113)", secondary: "rgb(29 22 49)" } },
      }}
    />
  );
}
