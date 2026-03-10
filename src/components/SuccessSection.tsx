import { motion } from "framer-motion";
import { ExternalLink, PartyPopper } from "lucide-react";

function SuccessSection() {
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 60, damping: 15, mass: 1 }}
      className="flex min-h-screen items-center justify-center px-6 py-24"
    >
      <div className="glass w-full max-w-xl rounded-[2.5rem] p-10 text-center sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
          <PartyPopper className="h-8 w-8 text-accent" />
        </div>
        <h2 className="mt-6 font-serif text-4xl font-bold">🎉 Payment Successful!</h2>
        <p className="mt-3 text-white/70">Your seat for the webinar is confirmed.</p>
        <p className="mt-2 text-white/50">
          Join the private WhatsApp community, Founder's Session, where webinar links and reminders will
          be shared.
        </p>

        <motion.a
          href="https://chat.whatsapp.com/KAZkzGqyCPDHZSsP4yO7Ou?mode=hq1tcli"
          target="_blank"
          rel="noreferrer"
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-8 py-4 text-lg font-bold text-white"
        >
          Join Founder's Session
          <ExternalLink className="h-5 w-5" />
        </motion.a>
      </div>
    </motion.section>
  );
}

export default SuccessSection;
