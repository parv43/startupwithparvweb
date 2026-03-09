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

function resolveMongoConfig(rawMongoUri: string, envDbName?: string): { uri: string; dbName: string } {
  const dbNameFromEnv = envDbName?.trim();
  const parsedUri = new URL(rawMongoUri);
  const dbNameFromUri = parsedUri.pathname.replace(/^\//, "").trim();
  const dbName = dbNameFromEnv || dbNameFromUri || "startupwithparv";

  if (!dbNameFromUri) {
    parsedUri.pathname = `/${dbName}`;
  }
  if (!parsedUri.searchParams.has("retryWrites")) {
    parsedUri.searchParams.set("retryWrites", "true");
  }
  if (!parsedUri.searchParams.has("w")) {
    parsedUri.searchParams.set("w", "majority");
  }

  return { uri: parsedUri.toString(), dbName };
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
    const rawMongoUri = process.env.MONGODB_URI;
    const mongoDbNameFromEnv = process.env.MONGODB_DB_NAME;

    if (!keyId || !keySecret) {
      return res.status(500).json({ error: "Missing Razorpay credentials" });
    }

    if (!rawMongoUri) {
      return res.status(500).json({ error: "Missing MongoDB connection string" });
    }

    const mongoConfig = resolveMongoConfig(rawMongoUri, mongoDbNameFromEnv);

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    const mongoClient = new MongoClient(mongoConfig.uri);

    const amount = 100;

    try {
      const order = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt: "workshop_order",
      });

      await mongoClient.connect();
      await mongoClient
        .db(mongoConfig.dbName)
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
    const details = err instanceof Error ? err.message : "Unknown error";
    console.error("create-order failed", err);

    if (/Mongo|SSL|tlsv1|ECONNREFUSED|querySrv/i.test(details)) {
      return res.status(500).json({
        error: "MongoDB connection failed",
        details: "Check Atlas IP access list and MONGODB_URI",
      });
    }

    return res.status(500).json({ error: "Order creation failed", details });
  }
}
