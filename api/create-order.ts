import crypto from "node:crypto";
import Razorpay from "razorpay";

const WORKSHOP_PRICE_INR = Number(process.env.WORKSHOP_PRICE_INR ?? 2000);
const WORKSHOP_CURRENCY = process.env.WORKSHOP_CURRENCY?.trim() || "INR";
const WORKSHOP_TEST_MODE = (process.env.WORKSHOP_TEST_MODE ?? "true").toLowerCase() === "true";

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
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 20;

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

function randomReceipt(): string {
  return `workshop_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`.slice(0, 40);
}

export default async function handler(req: any, res: any) {
  setSecurityHeaders(res);

  const origin = typeof req.headers.origin === "string" ? req.headers.origin : undefined;
  if (origin) {
    setCorsHeaders(res, origin);
    if (!allowedOrigins.has(origin)) {
      return res.status(403).json({ error: "Origin not allowed" });
    }
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (isRateLimited(req)) {
    return res.status(429).json({ error: "Too many requests. Please retry shortly." });
  }

  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({ error: "Missing Razorpay credentials" });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const amount = WORKSHOP_TEST_MODE ? 100 : Math.round(WORKSHOP_PRICE_INR * 100);

    const order = await razorpay.orders.create({
      amount,
      currency: WORKSHOP_CURRENCY,
      receipt: randomReceipt(),
    });

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("create-order failed", err);
    const details = err instanceof Error ? err.message : "Unknown create-order failure";
    return res.status(500).json({ error: "Order creation failed", details });
  }
}
