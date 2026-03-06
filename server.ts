import crypto from "node:crypto";
import cors, { type CorsOptions } from "cors";
import dotenv from "dotenv";
import express from "express";
import Razorpay from "razorpay";
import { WORKSHOP_CONFIG } from "./src/config/workshop";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 8787);
const frontendUrl = process.env.FRONTEND_URL;

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!razorpayKeyId || !razorpayKeySecret) {
  throw new Error("Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
}

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

const allowedOrigins = [
  "http://localhost:5173",
  "https://startupwithparvweb.vercel.app",
  frontendUrl,
].filter(Boolean) as string[];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser tools and same-origin calls without Origin header.
    if (!origin) {
      callback(null, true);
      return;
    }

    const isAllowed =
      allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");

    if (isAllowed) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

app.post("/api/create-order", async (req, res) => {
  try {
    const amount = WORKSHOP_CONFIG.TEST_MODE ? 100 : WORKSHOP_CONFIG.price * 100;

    // Amount is enforced on server, so browser-side tampering does not change checkout value.
    const order = await razorpay.orders.create({
      amount,
      currency: WORKSHOP_CONFIG.currency,
      receipt: "workshop_order",
    });

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

app.post("/api/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body ?? {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ verified: false, error: "Missing payment verification fields" });
      return;
    }

    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const verified = expectedSignature === razorpay_signature;

    if (!verified) {
      res.status(400).json({ verified: false, error: "Invalid payment signature" });
      return;
    }

    res.status(200).json({ verified: true });
  } catch (error) {
    console.error("verify-payment failed", error);
    res.status(500).json({ verified: false, error: "Unable to verify payment" });
  }
});

app.listen(port, () => {
  console.log(`Razorpay backend running on http://localhost:${port}`);
});
