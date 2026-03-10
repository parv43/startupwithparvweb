import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import QuoteSection from "./components/QuoteSection";
import Registration from "./components/Registration";
import SuccessSection from "./components/SuccessSection";
import WorkshopDetails from "./components/WorkshopDetails";

type RegistrationDetails = {
  fullName: string;
  email: string;
  whatsapp: string;
  location: string;
};

async function getResponseMessage(response: Response, fallback: string): Promise<string> {
  const responseClone = response.clone();

  try {
    const payload = (await response.json()) as { error?: string; details?: string };
    if (typeof payload.error === "string" && payload.error.trim().length > 0) {
      const details =
        typeof payload.details === "string" && payload.details.trim().length > 0 ? `: ${payload.details}` : "";
      return `${payload.error}${details}`;
    }
  } catch {
    const text = await responseClone.text();
    if (text.trim().length > 0) {
      return `${fallback} (HTTP ${response.status}): ${text.slice(0, 180)}`;
    }
  }

  return fallback;
}

function App() {
  const [paymentSuccess, setPaymentSuccess] = React.useState(false);

  const openMockRazorpay = React.useCallback(async (details: RegistrationDetails) => {
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() ?? "").replace(/\/+$/, "");
    const resolveApiUrl = (path: string) => (import.meta.env.DEV && apiBaseUrl ? `${apiBaseUrl}${path}` : path);
    const createOrderUrl = resolveApiUrl("/api/create-order");
    const verifyPaymentUrl = resolveApiUrl("/api/verify-payment");

    if (!window.Razorpay) {
      throw new Error("Razorpay SDK not loaded");
    }

    if (!keyId) {
      throw new Error("Missing VITE_RAZORPAY_KEY_ID");
    }

    const createOrderResponse = await fetch(createOrderUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
    });

    if (!createOrderResponse.ok) {
      throw new Error(await getResponseMessage(createOrderResponse, "Unable to create payment order"));
    }

    const orderPayload: { orderId: string; amount: number; currency: string } =
      await createOrderResponse.json();

    const options: RazorpayOptions = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID as string,
      amount: orderPayload.amount,
      currency: orderPayload.currency,
      order_id: orderPayload.orderId,
      name: "Parv Srivastava",
      description: "Entrepreneurship Workshop",
      notes: {
        location: details.location,
      },
      prefill: {
        name: details.fullName,
        email: details.email,
        contact: details.whatsapp,
      },
      theme: {
        color: "#EAB308",
      },
      handler: async (response) => {
        if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
          window.alert("Payment response was incomplete. Please contact support.");
          return;
        }

        try {
          const verifyResponse = await fetch(verifyPaymentUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (!verifyResponse.ok) {
            throw new Error(await getResponseMessage(verifyResponse, "Payment verification failed"));
          }

          const verifyPayload = (await verifyResponse.json()) as { verified?: boolean; error?: string };
          if (!verifyPayload.verified) {
            throw new Error(verifyPayload.error ?? "Payment verification failed");
          }

          setPaymentSuccess(true);
        } catch (error) {
          console.error("verify-payment failed", error);
          const message =
            error instanceof Error
              ? error.message
              : "Payment verification failed. Please contact support with your payment ID.";
          window.alert(message);
        }
      },
      retry: {
        enabled: true,
      },
      modal: {
        ondismiss: () => undefined,
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      <AnimatePresence mode="wait">
        {paymentSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 60, damping: 15, mass: 1 }}
            className="min-h-screen"
          >
            <SuccessSection />
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 60, damping: 15, mass: 1 }}
          >
            <Navbar />
            <main>
              <Hero />
              <QuoteSection />
              <WorkshopDetails />
              <Registration onRegister={openMockRazorpay} />
            </main>
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
