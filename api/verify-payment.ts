import crypto from "node:crypto";
import Razorpay from "razorpay";

const allowedOrigins = new Set(
  [
    "http://localhost:5173",
    "https://startupwithparvweb.vercel.app",
    process.env.FRONTEND_ORIGIN,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    ...(process.env.ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()) ?? []),
  ].filter((origin): origin is string => Boolean(origin)),
);

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const processedPayments = new Map<string, number>();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 40;
const PROCESSED_PAYMENT_TTL_MS = 24 * 60 * 60 * 1000;
const VERIFY_WITH_RAZORPAY_API = (process.env.VERIFY_WITH_RAZORPAY_API ?? "false").toLowerCase() === "true";

function setSecurityHeaders(res: any): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
}

function setCorsHeaders(res: any, origin: string): void {
  res.setHeader("Vary", "Origin");
  if (allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  }
}

function getClientIp(req: any): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim().length > 0) {
    return forwardedFor.split(",")[0].trim();
  }
  if (typeof req.socket?.remoteAddress === "string") {
    return req.socket.remoteAddress;
  }
  return "unknown";
}

function isRateLimited(req: any): boolean {
  const now = Date.now();

  if (rateBuckets.size > 5_000) {
    for (const [entryKey, entry] of rateBuckets) {
      if (entry.resetAt <= now) {
        rateBuckets.delete(entryKey);
      }
    }
  }

  const key = getClientIp(req);
  const bucket = rateBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

function pruneProcessedPayments(now = Date.now()): void {
  for (const [paymentId, processedAt] of processedPayments) {
    if (now - processedAt > PROCESSED_PAYMENT_TTL_MS) {
      processedPayments.delete(paymentId);
    }
  }
}

function signaturesMatch(expectedHex: string, providedHex: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(providedHex)) {
    return false;
  }

  const expected = Buffer.from(expectedHex, "hex");
  const provided = Buffer.from(providedHex, "hex");
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
}

export default async function handler(req: any, res: any) {
  setSecurityHeaders(res);

  const origin = typeof req.headers.origin === "string" ? req.headers.origin : undefined;
  if (origin) {
    setCorsHeaders(res, origin);
    if (!allowedOrigins.has(origin)) {
      return res.status(403).json({ verified: false, error: "Origin not allowed" });
    }
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ verified: false, error: "Method not allowed" });
  }

  if (isRateLimited(req)) {
    return res.status(429).json({ verified: false, error: "Too many requests. Please retry shortly." });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body ?? {};
  if (
    typeof razorpay_order_id !== "string" ||
    typeof razorpay_payment_id !== "string" ||
    typeof razorpay_signature !== "string"
  ) {
    return res.status(400).json({ verified: false, error: "Missing payment verification fields" });
  }

  pruneProcessedPayments();
  if (processedPayments.has(razorpay_payment_id)) {
    return res.status(409).json({ verified: false, error: "Payment already processed" });
  }

  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return res.status(500).json({ verified: false, error: "Missing Razorpay credentials" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!signaturesMatch(expectedSignature, razorpay_signature)) {
      return res.status(400).json({ verified: false, error: "Invalid payment signature" });
    }

    if (VERIFY_WITH_RAZORPAY_API) {
      const keyId = process.env.RAZORPAY_KEY_ID;
      if (!keyId) {
        return res.status(500).json({ verified: false, error: "Missing Razorpay credentials" });
      }

      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const payment = (await razorpay.payments.fetch(razorpay_payment_id)) as {
        order_id?: string;
        status?: string;
      };

      if (payment.order_id !== razorpay_order_id) {
        return res.status(400).json({ verified: false, error: "Order and payment do not match" });
      }

      if (payment.status !== "authorized" && payment.status !== "captured") {
        return res.status(400).json({ verified: false, error: "Payment is not successful" });
      }
    }

    processedPayments.set(razorpay_payment_id, Date.now());
    return res.status(200).json({ verified: true });
  } catch (error) {
    console.error("verify-payment failed", error);
    return res.status(500).json({ verified: false, error: "Unable to verify payment" });
  }
}
