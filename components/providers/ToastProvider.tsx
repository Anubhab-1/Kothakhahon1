"use client";

import { Toaster } from "sonner";

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      theme="dark"
      toastOptions={{
        className: "border border-smoke bg-obsidian text-parchment font-body",
        style: {
          background: "#161412",
          borderColor: "#2e2820",
          color: "#e8e5de",
        },
      }}
    />
  );
}
