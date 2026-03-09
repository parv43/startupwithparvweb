import Razorpay from "razorpay";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
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

    const amount = 100; // Rs. 1 test payment

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: "workshop_order",
    });

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Order creation failed" });
  }
}
