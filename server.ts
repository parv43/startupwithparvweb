import crypto from "node:crypto";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { MongoClient } from "mongodb";
import Razorpay from "razorpay";
import { WORKSHOP_CONFIG } from "./src/config/workshop.ts";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 8787);

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB_NAME ?? "startupwithparv";

type RegistrationDetails = {
  fullName: string;
  email: string;
  whatsapp: string;
  location: string;
};

function isFilledString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseRegistrationDetails(payload: unknown): RegistrationDetails | null {
  const raw = (payload ?? {}) as Partial<RegistrationDetails>;
  const { fullName, email, whatsapp, location } = raw;
  if (
    !isFilledString(fullName) ||
    !isFilledString(email) ||
    !isFilledString(whatsapp) ||
    !isFilledString(location)
  ) {
    return null;
  }

  return {
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    whatsapp: whatsapp.trim(),
    location: location.trim(),
  };
}

if (!razorpayKeyId || !razorpayKeySecret) {
  throw new Error("Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
}

if (!mongoUri) {
  throw new Error("Missing MongoDB connection string. Set MONGODB_URI.");
}

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

app.use(cors({ origin: "*" }));
app.options("*", cors({ origin: "*" }));
app.use(express.json());

app.post("/api/create-order", async (req, res) => {
  try {
    const registrationDetails = parseRegistrationDetails(req.body);
    if (!registrationDetails) {
      res.status(400).json({ error: "Missing registration fields" });
      return;
    }

    const amount = WORKSHOP_CONFIG.TEST_MODE ? 100 : WORKSHOP_CONFIG.price * 100;

    const order = await razorpay.orders.create({
      amount,
      currency: WORKSHOP_CONFIG.currency,
      receipt: "workshop_order",
    });

    const mongoClient = new MongoClient(mongoUri);
    try {
      await mongoClient.connect();
      await mongoClient
        .db(mongoDbName)
        .collection("registrations")
        .insertOne({
          ...registrationDetails,
          orderId: order.id,
          orderAmount: order.amount,
          currency: order.currency,
          paymentStatus: "created",
          source: "express_server",
          createdAt: new Date(),
        });
    } finally {
      await mongoClient.close();
    }

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

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});

// import crypto from "node:crypto";
// import cors, { type CorsOptions } from "cors";
// import dotenv from "dotenv";
// import express from "express";
// import Razorpay from "razorpay";
// import { WORKSHOP_CONFIG } from "./src/config/workshop.ts";

// dotenv.config();

// const app = express();
// const port = Number(process.env.PORT ?? 8787);

// const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
// const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

// if (!razorpayKeyId || !razorpayKeySecret) {
//   throw new Error("Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
// }

// const razorpay = new Razorpay({
//   key_id: razorpayKeyId,
//   key_secret: razorpayKeySecret,
// });

// const allowedOrigins = [
//   "http://localhost:5173",
//   "https://startupwithparvweb.vercel.app",
// ];

// const corsOptions: CorsOptions = {
//   origin: (origin, callback) => {
//     if (!origin) {
//       callback(null, true);
//       return;
//     }
//     const isAllowed =
//       allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");

//     if (isAllowed) {
//       callback(null, true);
//       return;
//     }
//     callback(new Error(`CORS blocked for origin: ${origin}`));
//   },
//   methods: ["GET", "POST", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
//   optionsSuccessStatus: 200,
// };

// app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));
// app.use(express.json());

// app.post("/api/create-order", async (req, res) => {
//   try {
//     const amount = WORKSHOP_CONFIG.TEST_MODE ? 100 : WORKSHOP_CONFIG.price * 100;

//     const order = await razorpay.orders.create({
//       amount,
//       currency: WORKSHOP_CONFIG.currency,
//       receipt: "workshop_order",
//     });

//     res.status(200).json({
//       orderId: order.id,
//       amount: order.amount,
//       currency: order.currency,
//     });
//   } catch (error) {
//     console.error("create-order failed", error);
//     res.status(500).json({ error: "Unable to create order" });
//   }
// });

// app.post("/api/verify-payment", (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body ?? {};

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       res.status(400).json({ verified: false, error: "Missing payment verification fields" });
//       return;
//     }

//     const expectedSignature = crypto
//       .createHmac("sha256", razorpayKeySecret)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     const verified = expectedSignature === razorpay_signature;

//     if (!verified) {
//       res.status(400).json({ verified: false, error: "Invalid payment signature" });
//       return;
//     }

//     res.status(200).json({ verified: true });
//   } catch (error) {
//     console.error("verify-payment failed", error);
//     res.status(500).json({ verified: false, error: "Unable to verify payment" });
//   }
// });

// app.listen(port, "0.0.0.0", () => {
//   console.log(`Server running on port ${port}`);
// });
