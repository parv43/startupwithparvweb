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
  phone: string;
  city: string;
};

function App() {
  const [paymentSuccess, setPaymentSuccess] = React.useState(false);

  const openMockRazorpay = React.useCallback((details: RegistrationDetails) => {
    const onSuccess = () => setPaymentSuccess(true);

    if (!window.Razorpay) {
      window.setTimeout(onSuccess, 700);
      return;
    }

    const options = {
      key: "rzp_test_1234567890",
      amount: 9900,
      currency: "INR",
      name: "Parv Srivastava",
      description: "Entrepreneurship Workshop",
      theme: {
        color: "#EAB308",
      },
      handler: onSuccess,
      modal: {
        ondismiss: onSuccess,
      },
      prefill: {
        name: details.fullName || "Founder",
        email: details.email,
        contact: details.phone,
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
