/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RAZORPAY_KEY_ID?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface RazorpayHandlerResponse {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  image?: string;
  notes?: Record<string, string>;
  handler?: (response: RazorpayHandlerResponse) => void | Promise<void>;
  retry?: {
    enabled?: boolean;
  };
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color?: string;
  };
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

interface RazorpayInstance {
  open: () => void;
}

interface Window {
  Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
}
