import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Lock, Mail, MapPin, Phone, User, Users2, X } from "lucide-react";
import { useState, type FormEvent } from "react";

type RegistrationDetails = {
  fullName: string;
  email: string;
  whatsapp: string;
  location: string;
};

type RegistrationProps = {
  onRegister: (details: RegistrationDetails) => Promise<void>;
};

const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { type: "spring", stiffness: 60, damping: 15, mass: 1 },
};

const fieldConfig = [
  {
    key: "fullName",
    label: "Full Name",
    placeholder: "Enter your full name",
    icon: User,
    type: "text",
    inputMode: "text",
  },
  {
    key: "email",
    label: "Email",
    placeholder: "Enter your email address",
    icon: Mail,
    type: "email",
    inputMode: "email",
  },
  {
    key: "whatsapp",
    label: "WhatsApp Number",
    placeholder: "Enter your WhatsApp number",
    icon: Phone,
    type: "tel",
    inputMode: "tel",
  },
  {
    key: "location",
    label: "Location (State/City)",
    placeholder: "Enter your state and city",
    icon: MapPin,
    type: "text",
    inputMode: "text",
  },
] as const;

function Registration({ onRegister }: RegistrationProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<RegistrationDetails>({
    fullName: "",
    email: "",
    whatsapp: "",
    location: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isFormValid = Object.values(formData).every((value) => value.trim().length > 0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onRegister(formData);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to start payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.section id="register" {...reveal} className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <AnimatePresence mode="wait">
          {!showForm ? (
            <motion.div
              key="registration-cta"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -10 }}
              transition={{ type: "spring", stiffness: 60, damping: 15, mass: 1 }}
              className="glass rounded-[3rem] p-8 text-center md:p-16"
            >
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-400">Registration</p>
              <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
                Ready to <span className="italic text-accent">validate</span> your future?
              </h2>

              <div className="mt-8 rounded-2xl border border-white/10 bg-black/50 p-6">
                <p className="font-serif text-2xl italic text-zinc-100 sm:text-3xl">
                  &quot;If you think that ₹149 is more valuable than your idea, then according to my suggestion, you
                  should not enter entrepreneurship.&quot;
                </p>
              </div>

              <motion.button
                onClick={() => setShowForm(true)}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-8 py-5 text-lg font-bold text-black sm:w-auto sm:px-12 sm:text-xl"
              >
                REGISTER FOR ₹149
                <ArrowRight className="h-5 w-5" />
              </motion.button>

              <p className="mt-4 text-sm font-medium text-accent/80">
                Note: Money will be refunded if you do not find the session useful.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 text-sm text-white/50 sm:flex-row">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <Lock className="h-4 w-4 text-accent" />
                  Secure Payment
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <Users2 className="h-4 w-4 text-accent" />
                  Limited Batch
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="registration-form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 60, damping: 15, mass: 1 }}
              className="glass rounded-[3rem] border-white/10 p-8 text-left md:p-16"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-4xl font-bold tracking-tight text-white">
                    Complete Registration
                  </h3>
                  <p className="mt-3 text-white/50">
                    Please provide your details to proceed with the payment.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSubmitError(null);
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:text-white"
                  aria-label="Close registration form"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                {fieldConfig.map((field) => {
                  const Icon = field.icon;
                  return (
                    <label key={field.key} className="block">
                      <span className="mb-3 block text-sm font-mono uppercase tracking-widest text-white/40">
                        {field.label}
                      </span>
                      <div className="relative">
                        <Icon className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-white opacity-40" />
                        <input
                          type={field.type}
                          inputMode={field.inputMode}
                          required
                          value={formData[field.key]}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              [field.key]: event.target.value,
                            }))
                          }
                          placeholder={field.placeholder}
                          className="relative z-0 w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white placeholder:text-white/20 outline-none transition focus:border-yellow-500"
                        />
                      </div>
                    </label>
                  );
                })}
              </div>

              <motion.button
                type="submit"
                whileHover={!isFormValid || isSubmitting ? undefined : { scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                disabled={!isFormValid || isSubmitting}
                aria-disabled={!isFormValid || isSubmitting}
                className="mt-8 w-full rounded-2xl bg-yellow-500 py-5 text-center text-base font-bold text-black shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Processing..." : "Proceed To Payment"}
              </motion.button>

              {submitError ? (
                <p className="mt-3 text-sm text-red-300">{submitError}</p>
              ) : null}
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

export default Registration;
