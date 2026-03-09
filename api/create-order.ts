import Razorpay from "razorpay";
import { MongoClient } from "mongodb";

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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const registrationDetails = parseRegistrationDetails(req.body);
    if (!registrationDetails) {
      return res.status(400).json({ error: "Missing registration fields" });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const mongoUri = process.env.MONGODB_URI;
    const mongoDbName = process.env.MONGODB_DB_NAME ?? "startupwithparv";

    if (!keyId || !keySecret) {
      return res.status(500).json({ error: "Missing Razorpay credentials" });
    }

    if (!mongoUri) {
      return res.status(500).json({ error: "Missing MongoDB connection string" });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    const mongoClient = new MongoClient(mongoUri);

    const amount = 100;

    try {
      const order = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt: "workshop_order",
      });

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
          source: "vercel_api",
          createdAt: new Date(),
        });

      return res.status(200).json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      });
    } finally {
      await mongoClient.close();
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Order creation failed" });
  }
}
