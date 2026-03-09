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

function App() {
  const [paymentSuccess, setPaymentSuccess] = React.useState(false);

  const openMockRazorpay = React.useCallback(async (details: RegistrationDetails) => {
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";
    const createOrderUrl = apiBaseUrl ? `${apiBaseUrl}/api/create-order` : "/api/create-order";

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
      let message = "Unable to create payment order";
      const responseClone = createOrderResponse.clone();
      try {
        const errorPayload = (await createOrderResponse.json()) as { error?: string; details?: string };
        if (typeof errorPayload.error === "string" && errorPayload.error.trim().length > 0) {
          message = errorPayload.error;
        }
        if (typeof errorPayload.details === "string" && errorPayload.details.trim().length > 0) {
          message = `${message}: ${errorPayload.details}`;
        }
      } catch {
        const text = await responseClone.text();
        if (text.trim().length > 0) {
          message = `${message} (HTTP ${createOrderResponse.status}): ${text.slice(0, 180)}`;
        }
      }
      throw new Error(message);
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
          return;
        }
        setPaymentSuccess(true);
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
