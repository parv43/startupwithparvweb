import crypto from "node:crypto";
import cors, { type CorsOptions } from "cors";
import dotenv from "dotenv";
import express, { type NextFunction, type Request, type Response } from "express";
import Razorpay from "razorpay";
import { WORKSHOP_CONFIG } from "./src/config/workshop.ts";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.disable("x-powered-by");
app.set("trust proxy", 1);

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!razorpayKeyId || !razorpayKeySecret) {
  throw new Error("Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
}

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

const allowedOrigins = new Set(
  [
    "http://localhost:5173",
    "https://startupwithparvweb.vercel.app",
    process.env.FRONTEND_ORIGIN,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    ...(process.env.ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()) ?? []),
  ].filter((origin): origin is string => Boolean(origin)),
);

const ORDER_TTL_MS = 30 * 60 * 1000;
const pendingOrders = new Map<string, { createdAt: number; isProcessed: boolean }>();

function isAllowedOrigin(origin: string): boolean {
  return allowedOrigins.has(origin);
}

function prunePendingOrders(now = Date.now()): void {
  for (const [orderId, record] of pendingOrders) {
    if (now - record.createdAt > ORDER_TTL_MS) {
      pendingOrders.delete(orderId);
    }
  }
}

function randomReceipt(): string {
  return `workshop_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`.slice(0, 40);
}

function signaturesMatch(expectedHex: string, providedHex: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(providedHex)) {
    return false;
  }
  const expected = Buffer.from(expectedHex, "hex");
  const provided = Buffer.from(providedHex, "hex");
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
}

type RateLimitOptions = {
  keyPrefix: string;
  max: number;
  windowMs: number;
};

function createRateLimiter({ keyPrefix, max, windowMs }: RateLimitOptions) {
  const store = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();

    if (store.size > 5_000) {
      for (const [entryKey, entry] of store) {
        if (entry.resetAt <= now) {
          store.delete(entryKey);
        }
      }
    }

    const key = `${keyPrefix}:${req.ip ?? "unknown"}`;
    const bucket = store.get(key);

    if (!bucket || bucket.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({ error: "Too many requests. Please retry shortly." });
      return;
    }

    next();
  };
}

function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  );

  const forwardedProto = req.header("x-forwarded-proto")?.split(",")[0]?.trim();
  if (req.secure || forwardedProto === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  next();
}

function enforceAllowedOrigin(req: Request, res: Response, next: NextFunction): void {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    next();
    return;
  }

  const origin = req.header("origin");
  if (!origin || isAllowedOrigin(origin)) {
    next();
    return;
  }

  res.status(403).json({ error: "Origin not allowed" });
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    callback(null, isAllowedOrigin(origin));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

const createOrderLimiter = createRateLimiter({
  keyPrefix: "create-order",
  max: 20,
  windowMs: 60 * 1000,
});

const verifyPaymentLimiter = createRateLimiter({
  keyPrefix: "verify-payment",
  max: 40,
  windowMs: 60 * 1000,
});

app.use(securityHeaders);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "10kb" }));
app.use(enforceAllowedOrigin);

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/api/create-order", createOrderLimiter, async (_req, res) => {
  try {
    const amount = WORKSHOP_CONFIG.TEST_MODE ? 100 : WORKSHOP_CONFIG.price * 100;
    prunePendingOrders();

    const order = await razorpay.orders.create({
      amount,
      currency: WORKSHOP_CONFIG.currency,
      receipt: randomReceipt(),
    });

    pendingOrders.set(order.id, { createdAt: Date.now(), isProcessed: false });

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("create-order failed", error);
    res.status(500).json({ error: "Unable to create order" });
  }
});

app.post("/api/verify-payment", verifyPaymentLimiter, (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body ?? {};

    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string"
    ) {
      res.status(400).json({ verified: false, error: "Missing payment verification fields" });
      return;
    }

    prunePendingOrders();
    const orderRecord = pendingOrders.get(razorpay_order_id);
    if (!orderRecord) {
      res.status(400).json({ verified: false, error: "Unknown or expired order ID" });
      return;
    }
    if (orderRecord.isProcessed) {
      res.status(409).json({ verified: false, error: "Order already processed" });
      return;
    }

    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const verified = signaturesMatch(expectedSignature, razorpay_signature);
    if (!verified) {
      res.status(400).json({ verified: false, error: "Invalid payment signature" });
      return;
    }

    orderRecord.isProcessed = true;
    res.status(200).json({ verified: true });
  } catch (error) {
    console.error("verify-payment failed", error);
    res.status(500).json({ verified: false, error: "Unable to verify payment" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
