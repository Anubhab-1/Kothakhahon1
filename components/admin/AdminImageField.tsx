"use client";

import { useId, useRef, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  ImagePlus,
  LoaderCircle,
  Trash2,
} from "lucide-react";

interface AdminImageFieldProps {
  label: string;
  name: string;
  folder: string;
  initialValue?: string;
  placeholder?: string;
  hint?: string;
  stacked?: boolean;
}

interface UploadResponse {
  secureUrl: string;
}

export default function AdminImageField({
  label,
  name,
  folder,
  initialValue = "",
  placeholder = "https://...",
  hint = "Paste a stable image URL or upload directly to Cloudinary.",
  stacked = false,
}: AdminImageFieldProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<{
    tone: "idle" | "success" | "error";
    message: string;
  }>({
    tone: "idle",
    message: "",
  });
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileSelection(file: File) {
    setIsUploading(true);
    setStatus({ tone: "idle", message: "" });

    const payload = new FormData();
    payload.set("file", file);
    payload.set("folder", folder);

    try {
      const response = await fetch("/api/admin/uploads/image", {
        method: "POST",
        body: payload,
      });

      const data = (await response.json().catch(() => null)) as
        | UploadResponse
        | { error?: string }
        | null;

      if (!response.ok || !data || !("secureUrl" in data)) {
        throw new Error(data && "error" in data ? data.error : "Upload failed.");
      }

      setValue(data.secureUrl);
      setStatus({
        tone: "success",
        message: "Image uploaded. The URL field has been updated.",
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Upload failed.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-3">
      <span className="admin-field-label">{label}</span>

      <div className={stacked ? "space-y-3" : "grid gap-4 lg:grid-cols-[180px_1fr]"}>
        <div className={`relative overflow-hidden rounded-[26px] border border-ink/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(238,228,213,0.92))] ${stacked ? "w-full max-w-[180px]" : ""}`}>
          <div className="aspect-[4/5]">
            {value ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value} alt="" className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/22 via-transparent to-white/0" />
              </>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center">
                <div>
                  <p className="font-title text-3xl text-ink/72">Preview</p>
                  <p className="mt-2 font-body text-sm leading-relaxed text-ink/56">
                    Upload an image or paste a direct URL to see the result here.
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="absolute inset-x-0 bottom-0 border-t border-white/20 bg-ink/72 px-4 py-3">
            <p className="font-ui text-[10px] tracking-[0.16em] text-paper-strong">
              {isUploading ? "UPLOADING IMAGE" : value ? "IMAGE READY" : "NO IMAGE SELECTED"}
            </p>
          </div>
        </div>

        <div className="space-y-3 flex-1 min-w-0">
          <label htmlFor={inputId} className="sr-only">
            {label}
          </label>
          <input
            id={inputId}
            type="url"
            name={name}
            className="admin-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="admin-button admin-button-secondary"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImagePlus className="h-4 w-4" />
                  Upload Image
                </>
              )}
            </button>

            <button
              type="button"
              className="admin-button admin-button-secondary"
              disabled={!value}
              onClick={() => {
                setValue("");
                setStatus({ tone: "idle", message: "" });
              }}
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleFileSelection(file);
              }
            }}
          />

          <p className="font-body text-sm leading-relaxed text-ink/64">{hint}</p>

          {status.message ? (
            <div
              className={`flex items-start gap-2 rounded-[18px] border px-4 py-3 font-body text-sm ${
                status.tone === "error"
                  ? "border-red-900/10 bg-red-50 text-red-800"
                  : status.tone === "success"
                    ? "border-emerald-900/10 bg-emerald-50 text-emerald-800"
                    : "border-ink/10 bg-white/70 text-ink/70"
              }`}
            >
              {status.tone === "error" ? (
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              ) : status.tone === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : null}
              <span>{status.message}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
