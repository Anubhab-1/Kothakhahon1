"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, LoaderCircle, Lock, Mail, MapPinHouse, ShieldCheck, Tag, WalletCards, X } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { getPaymentMethodLabel } from "@/lib/orders";
import { getShippingQuote } from "@/lib/shipping";
import { cn, formatINR } from "@/lib/utils";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Enter your full name."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().min(8, "Enter a valid phone number."),
  addressLine1: z.string().min(4, "Enter a complete address."),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "Enter city."),
  state: z.string().min(2, "Enter state."),
  postalCode: z.string().min(4, "Enter postal code."),
  country: z.string().min(2, "Enter country."),
  paymentMethod: z.enum(["razorpay", "cod"], {
    error: "Choose a payment method.",
  }),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayResponse) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface CreateOrderRazorpayResponse {
  orderId: string;
  paymentMethod: "razorpay";
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
}

interface CreateOrderCodResponse {
  orderId: string;
  paymentMethod: "cod";
  redirectUrl: string;
}

type CreateOrderResponse = CreateOrderRazorpayResponse | CreateOrderCodResponse;

export default function CheckoutClient() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [step, setStep] = useState(1);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponId: string;
    code: string;
    discount: number;
    type: string;
    value: number;
  } | null>(null);
  const onlinePaymentEnabled = Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim());

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: "India",
      paymentMethod: "cod",
    },
  });

  const selectedPaymentMethod = watch("paymentMethod");
  const selectedCountry = watch("country");
  const selectedPostalCode = watch("postalCode");

  // India Pincode API lookup
  useEffect(() => {
    const isIndia =
      selectedCountry?.toLowerCase().trim() === "india" ||
      selectedCountry?.toLowerCase().trim() === "bharat";

    if (!isIndia || !selectedPostalCode || !/^\d{6}$/.test(selectedPostalCode)) {
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    setPincodeLoading(true);
    setPincodeError(null);

    fetch(`https://api.postalpincode.in/pincode/${selectedPostalCode}`, { signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (signal.aborted) return;
        if (data && data[0] && data[0].Status === "Success") {
          const postOfficeList = data[0].PostOffice;
          if (postOfficeList && postOfficeList.length > 0) {
            const firstOffice = postOfficeList[0];
            setValue("city", firstOffice.District || firstOffice.Taluk || "", { shouldValidate: true });
            setValue("state", firstOffice.State || "", { shouldValidate: true });
          }
        } else {
          setPincodeError("Invalid PIN code. Please check or type manually.");
        }
      })
      .catch((err) => {
        if (err.name === "AbortError" || signal.aborted) {
          return;
        }
        // Fail silently to let user type manually, but warn in console instead of erroring (to prevent Next.js error overlays)
        console.warn("Pincode API fetch failed (falling back to manual input):", err.message || err);
      })
      .finally(() => {
        if (!signal.aborted) {
          setPincodeLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [selectedPostalCode, selectedCountry, setValue]);

  const shippingQuote = useMemo(
    () =>
      getShippingQuote({
        country: selectedCountry,
        subtotalAmount: subtotal,
      }),
    [selectedCountry, subtotal],
  );
  const shippingFee = shippingQuote.shippingAmount;
  const discount = appliedCoupon?.discount ?? 0;
  const total = Math.max(0, subtotal + shippingFee - discount);

  async function handleApplyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch(`/api/coupon/validate?code=${encodeURIComponent(code)}&subtotal=${subtotal}`);
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error ?? "Invalid coupon.");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data);
        setCouponError(null);
      }
    } catch {
      setCouponError("Could not validate coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  }

  useEffect(() => {
    if (!onlinePaymentEnabled) {
      setRazorpayReady(false);
      return;
    }

    const scriptId = "razorpay-checkout-js";
    if (document.getElementById(scriptId)) {
      setRazorpayReady(true);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayReady(true);
    script.onerror = () => setSubmitError("Failed to load payment gateway. Please refresh.");
    document.body.appendChild(script);
  }, [onlinePaymentEnabled]);

  const hasItems = useMemo(() => items.length > 0, [items.length]);

  const handleNextStep = async () => {
    let fieldsToValidate: Array<keyof CheckoutValues> = [];
    if (step === 1) {
      fieldsToValidate = ["fullName", "email", "phone"];
    } else if (step === 2) {
      fieldsToValidate = [
        "country",
        "postalCode",
        "addressLine1",
        "city",
        "state",
      ];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    if (!hasItems) {
      setSubmitError("Your cart is empty.");
      return;
    }

    if (!shippingQuote.serviceable) {
      setSubmitError(shippingQuote.message);
      return;
    }

    if (values.paymentMethod === "razorpay") {
      if (!onlinePaymentEnabled) {
        setSubmitError("Online payment is not available right now. Choose cash on delivery instead.");
        return;
      }

      if (!razorpayReady || typeof window.Razorpay === "undefined") {
        setSubmitError("Payment gateway is not ready yet. Please try again.");
        return;
      }
    }

    setSubmitting(true);

    let createData: CreateOrderResponse;

    try {
      const response = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: values,
          paymentMethod: values.paymentMethod,
          items: items.map((item) => ({
            bookId: item.bookId,
            quantity: item.quantity,
          })),
          couponId: appliedCoupon?.couponId ?? null,
          discount: appliedCoupon?.discount ?? 0,
        }),
      });

      const body = (await response.json()) as CreateOrderResponse | { error?: string };

      if (!response.ok || !("orderId" in body)) {
        const errorMessage =
          "error" in body && body.error ? body.error : "Failed to initialize checkout.";
        setSubmitError(errorMessage);
        setSubmitting(false);
        return;
      }

      createData = body;
    } catch {
      setSubmitError("Network error while creating order. Please try again.");
      setSubmitting(false);
      return;
    }

    if (createData.paymentMethod === "cod") {
      clearCart();
      router.push(createData.redirectUrl);
      setSubmitting(false);
      return;
    }

    const RazorpayCheckout = window.Razorpay;
    if (!RazorpayCheckout) {
      setSubmitError("Payment gateway is not ready yet. Please try again.");
      setSubmitting(false);
      return;
    }

    const checkout = new RazorpayCheckout({
      key: createData.key,
      amount: createData.amount,
      currency: createData.currency,
      name: "Kothakhahon Prokashoni",
      description: "Book purchase",
      order_id: createData.razorpayOrderId,
      prefill: {
        name: values.fullName,
        email: values.email,
        contact: values.phone,
      },
      theme: {
        color: "#c9973a",
      },
      handler: async (razorpayResponse) => {
        try {
          const verifyResponse = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId: createData.orderId,
              razorpayOrderId: razorpayResponse.razorpay_order_id,
              razorpayPaymentId: razorpayResponse.razorpay_payment_id,
              razorpaySignature: razorpayResponse.razorpay_signature,
            }),
          });

          if (!verifyResponse.ok) {
            router.push(`/checkout/failed?order=${encodeURIComponent(createData.orderId)}`);
            setSubmitting(false);
            return;
          }

          clearCart();
          router.push(`/checkout/success?order=${encodeURIComponent(createData.orderId)}`);
        } catch {
          router.push(`/checkout/failed?order=${encodeURIComponent(createData.orderId)}`);
        } finally {
          setSubmitting(false);
        }
      },
      modal: {
        ondismiss: () => {
          router.push(`/checkout/failed?order=${encodeURIComponent(createData.orderId)}`);
          setSubmitting(false);
        },
      },
    });

    checkout.open();
  });

  if (!hasItems) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-16 md:px-8">
        <div className="editorial-panel rounded-2xl p-8 md:p-10">
          <p className="font-ui text-xs tracking-[0.16em] text-gold">CHECKOUT</p>
          <h1 className="mt-3 font-title text-5xl text-ivory">Your Cart Is Empty</h1>
          <p className="mt-4 max-w-2xl font-body text-lg text-stone">
            Add at least one book to your bag before continuing to payment.
          </p>
          <Link
            href="/books"
            className="fx-button mt-8 inline-flex rounded-full border border-gold bg-gold px-6 py-3 font-ui text-xs tracking-[0.16em] text-void transition hover:bg-gold-dim"
          >
            RETURN TO CATALOG
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
      <div className="editorial-panel rounded-2xl p-6 md:p-8">
        <p className="font-ui text-xs tracking-[0.16em] text-gold">CHECKOUT</p>
        <h1 className="mt-3 font-title text-5xl text-ivory">Guest Checkout</h1>
        <p className="mt-3 max-w-3xl font-body text-lg text-stone">
          Confirm shipping details, then place the order with cash on delivery or secure online payment when available. Direct checkout is currently enabled for India deliveries.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-ui text-[10px] tracking-[0.12em] text-gold">
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" />
              CHECKOUT READY
            </span>
          </span>
          <span className="rounded-full border border-smoke px-3 py-1 font-ui text-[10px] tracking-[0.12em] text-parchment">
            {items.length} ITEMS
          </span>
          <span className="rounded-full border border-smoke px-3 py-1 font-ui text-[10px] tracking-[0.12em] text-parchment">
            COD PRIMARY
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={onSubmit} className="editorial-panel space-y-5 rounded-2xl p-6 md:p-7">
          {/* Progress Stepper */}
          <div className="mb-6 flex items-center justify-between border-b border-smoke/50 pb-6">
            {[
              { num: 1, label: "INFO" },
              { num: 2, label: "SHIPPING" },
              { num: 3, label: "PAYMENT" },
            ].map((s) => (
              <div key={s.num} className="flex flex-1 items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs border transition duration-150",
                      step === s.num
                        ? "border-gold bg-gold text-void font-bold shadow"
                        : step > s.num
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-smoke bg-void/50 text-stone"
                    )}
                  >
                    {s.num}
                  </div>
                  <span
                    className={cn(
                      "font-ui text-[10px] tracking-[0.12em] transition",
                      step === s.num ? "text-gold font-medium" : "text-stone"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {s.num < 3 && (
                  <div
                    className={cn(
                      "mx-4 h-[1px] flex-1 transition",
                      step > s.num ? "bg-gold/40" : "bg-smoke"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-title text-4xl text-ivory">Contact Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="font-ui text-xs tracking-[0.13em] text-parchment">FULL NAME</label>
                  <input
                    type="text"
                    {...register("fullName")}
                    className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                  />
                  {errors.fullName ? <p className="text-sm text-ember">{errors.fullName.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <label className="font-ui text-xs tracking-[0.13em] text-parchment">EMAIL</label>
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                  />
                  {errors.email ? <p className="text-sm text-ember">{errors.email.message}</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-ui text-xs tracking-[0.13em] text-parchment">PHONE</label>
                <input
                  type="text"
                  {...register("phone")}
                  placeholder="Enter 10-digit phone number"
                  className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                />
                {errors.phone ? <p className="text-sm text-ember">{errors.phone.message}</p> : null}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-title text-4xl text-ivory">Delivery Address</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="font-ui text-xs tracking-[0.13em] text-parchment">COUNTRY</label>
                  <input
                    type="text"
                    {...register("country")}
                    className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                  />
                  {errors.country ? <p className="text-sm text-ember">{errors.country.message}</p> : null}
                  {!errors.country ? (
                    <p className={cn("text-sm", shippingQuote.serviceable ? "text-stone" : "text-ember")}>
                      {shippingQuote.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-ui text-xs tracking-[0.13em] text-parchment">POSTAL CODE</label>
                    {pincodeLoading && (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border border-gold border-t-transparent" />
                    )}
                  </div>
                  <input
                    type="text"
                    {...register("postalCode")}
                    placeholder="6-digit Indian PIN Code"
                    className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                  />
                  {errors.postalCode ? <p className="text-sm text-ember">{errors.postalCode.message}</p> : null}
                  {pincodeError ? <p className="text-sm text-ember">{pincodeError}</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-ui text-xs tracking-[0.13em] text-parchment">ADDRESS LINE 1</label>
                <input
                  type="text"
                  {...register("addressLine1")}
                  placeholder="House No, Building name, Street address"
                  className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                />
                {errors.addressLine1 ? <p className="text-sm text-ember">{errors.addressLine1.message}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="font-ui text-xs tracking-[0.13em] text-parchment">ADDRESS LINE 2 (OPTIONAL)</label>
                <input
                  type="text"
                  {...register("addressLine2")}
                  placeholder="Apartment, suite, unit, landmark, etc."
                  className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="font-ui text-xs tracking-[0.13em] text-parchment">CITY</label>
                  <input
                    type="text"
                    {...register("city")}
                    className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                  />
                  {errors.city ? <p className="text-sm text-ember">{errors.city.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <label className="font-ui text-xs tracking-[0.13em] text-parchment">STATE</label>
                  <input
                    type="text"
                    {...register("state")}
                    className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                  />
                  {errors.state ? <p className="text-sm text-ember">{errors.state.message}</p> : null}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-title text-4xl text-ivory">Payment Method</h2>
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <label
                    className={cn(
                      "cursor-pointer rounded-2xl border p-4 transition",
                      selectedPaymentMethod === "cod"
                        ? "border-gold bg-gold/10"
                        : "border-smoke bg-void/60 hover:border-gold/45",
                    )}
                  >
                    <input type="radio" value="cod" {...register("paymentMethod")} className="sr-only" />
                    <div className="flex items-start gap-3">
                      <div className="rounded-full border border-gold/35 bg-gold/10 p-2 text-gold">
                        <Banknote className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-ui text-xs tracking-[0.14em] text-parchment">CASH ON DELIVERY</p>
                        <p className="mt-2 font-body text-sm text-stone">
                          Place the order now and pay in cash when the parcel reaches you.
                        </p>
                        <p className="mt-2 font-mono text-xs text-stone">Available for India deliveries.</p>
                      </div>
                    </div>
                  </label>

                  {onlinePaymentEnabled ? (
                    <label
                      className={cn(
                        "cursor-pointer rounded-2xl border p-4 transition",
                        selectedPaymentMethod === "razorpay"
                          ? "border-gold bg-gold/10"
                          : "border-smoke bg-void/60 hover:border-gold/45",
                      )}
                    >
                      <input
                        type="radio"
                        value="razorpay"
                        {...register("paymentMethod")}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-3">
                        <div className="rounded-full border border-gold/35 bg-gold/10 p-2 text-gold">
                          <WalletCards className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-ui text-xs tracking-[0.14em] text-parchment">ONLINE PAYMENT</p>
                          <p className="mt-2 font-body text-sm text-stone">
                            Pay instantly through Razorpay using cards, UPI, or supported banking methods.
                          </p>
                          <p className="mt-2 font-mono text-xs text-stone">
                            Secure session opens after order review.
                          </p>
                        </div>
                      </div>
                    </label>
                  ) : null}
                </div>
                {errors.paymentMethod ? <p className="text-sm text-ember">{errors.paymentMethod.message}</p> : null}
                {!onlinePaymentEnabled ? (
                  <p className="font-body text-sm text-stone">
                    Cash on delivery is currently the active payment path. Online payment will appear here only after Razorpay is fully configured.
                  </p>
                ) : null}
              </div>
            </div>
          )}

          {submitError ? <p className="text-sm text-ember">{submitError}</p> : null}

          {/* Navigation Buttons */}
          <div className="flex gap-3 border-t border-smoke/50 pt-5">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="fx-button rounded-full border border-smoke bg-obsidian px-5 py-3 font-ui text-xs tracking-[0.14em] text-parchment transition hover:border-gold hover:text-gold"
              >
                BACK
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="fx-button flex-1 rounded-full border border-gold bg-gold px-5 py-3 font-ui text-xs tracking-[0.14em] text-void transition hover:bg-gold-dim"
              >
                CONTINUE
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || !shippingQuote.serviceable}
                className="fx-button flex-1 rounded-full border border-gold bg-gold px-6 py-3 font-ui text-xs tracking-[0.16em] text-void transition hover:bg-gold-dim disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting
                  ? selectedPaymentMethod === "cod"
                    ? "PLACING ORDER..."
                    : "PROCESSING..."
                  : selectedPaymentMethod === "cod"
                    ? `PLACE COD ORDER ${formatINR(total)}`
                    : `PROCEED TO PAYMENT ${formatINR(total)}`}
              </button>
            )}
          </div>

          <p className="text-center font-body text-sm text-stone">
            By placing this order, you confirm that your delivery details are accurate for dispatch and support.
          </p>
        </form>

        <aside className="editorial-panel rounded-2xl p-6">
          <p className="font-ui text-xs tracking-[0.12em] text-gold">ORDER SUMMARY</p>
          <div className="mt-4 space-y-3 border-b border-smoke pb-4">
            {items.map((item) => (
              <div key={item.bookId} className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-body text-base text-ivory">{item.title}</p>
                  <p className="font-mono text-xs text-stone">Qty {item.quantity}</p>
                </div>
                <p className="font-mono text-xs text-parchment">{formatINR(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-body text-sm text-parchment">Subtotal</p>
              <p className="font-mono text-sm text-parchment">{formatINR(subtotal)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-body text-sm text-parchment">Shipping</p>
              <p className="font-mono text-sm text-parchment">{formatINR(shippingFee)}</p>
            </div>
            <p className="font-body text-xs text-stone">{shippingQuote.label}</p>
            {appliedCoupon && (
              <div className="flex items-center justify-between">
                <p className="font-body text-sm text-emerald-400">
                  Coupon ({appliedCoupon.code})
                </p>
                <p className="font-mono text-sm text-emerald-400">− {formatINR(appliedCoupon.discount)}</p>
              </div>
            )}
          </div>

          {/* Coupon input */}
          <div className="mt-4 space-y-2">
            <p className="font-ui text-[10px] tracking-[0.14em] text-parchment/60">PROMO CODE</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                disabled={!!appliedCoupon}
                className="flex-1 rounded-xl border border-smoke bg-void px-3 py-2 font-mono text-sm uppercase text-ivory outline-none ring-gold transition focus:ring-1 placeholder:text-stone/40 disabled:opacity-50"
              />
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={() => { setAppliedCoupon(null); setCouponCode(""); setCouponError(null); }}
                  className="flex items-center gap-1 rounded-xl border border-ember/40 bg-ember/10 px-3 py-2 font-ui text-[10px] tracking-[0.1em] text-ember transition hover:bg-ember/20"
                >
                  <X className="h-3.5 w-3.5" /> REMOVE
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="flex items-center gap-1 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 font-ui text-[10px] tracking-[0.1em] text-gold transition hover:bg-gold/20 disabled:opacity-50"
                >
                  <Tag className="h-3.5 w-3.5" />
                  {couponLoading ? "…" : "APPLY"}
                </button>
              )}
            </div>
            {couponError && <p className="text-xs text-ember">{couponError}</p>}
            {appliedCoupon && (
              <p className="text-xs text-emerald-400">✓ {appliedCoupon.type === "percent" ? `${appliedCoupon.value}%` : `₹${appliedCoupon.value}`} discount applied</p>
            )}
          </div>

          <div className="mt-4 border-t border-smoke pt-4">
            <div className="flex items-center justify-between">
              <p className="font-ui text-xs tracking-[0.14em] text-stone">TOTAL</p>
              <p className="font-mono text-3xl text-ivory">{formatINR(total)}</p>
            </div>
          </div>

          <div className="mt-5 space-y-2 rounded-xl border border-smoke bg-ash/40 p-4">
            <p className="flex items-center gap-2 font-body text-sm text-parchment">
              {selectedPaymentMethod === "cod" ? (
                <Banknote className="h-4 w-4 text-gold" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-gold" />
              )}
              {selectedPaymentMethod === "cod"
                ? "Cash will be collected when the order reaches you."
                : "Razorpay-secured payment session."}
            </p>
            <p className="flex items-center gap-2 font-body text-sm text-parchment">
              <MapPinHouse className="h-4 w-4 text-gold" />
              Orders are stored against your delivery details for fulfillment.
            </p>
            <p className="flex items-center gap-2 font-body text-sm text-parchment">
              <Mail className="h-4 w-4 text-gold" />
              Use the same email for order updates and support.
            </p>
            <p className="flex items-center gap-2 font-body text-sm text-parchment">
              <Lock className="h-4 w-4 text-gold" />
              Payment method: {getPaymentMethodLabel(selectedPaymentMethod)}
            </p>
            {submitting ? (
              <p className="flex items-center gap-2 font-body text-sm text-gold">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                {selectedPaymentMethod === "cod"
                  ? "Saving your order..."
                  : "Initializing payment..."}
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
