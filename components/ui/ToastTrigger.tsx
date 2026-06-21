"use client";

import { useEffect } from "react";
import { toast } from "sonner";

interface ToastTriggerProps {
  notice?: string;
  error?: string;
}

export default function ToastTrigger({ notice, error }: ToastTriggerProps) {
  useEffect(() => {
    if (notice) {
      toast.success(notice);
    }
    if (error) {
      toast.error(error);
    }
  }, [notice, error]);

  return null;
}
