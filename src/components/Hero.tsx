import { motion } from "framer-motion";
import { Calendar, ChevronDown, Clock } from "lucide-react";

function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24 text-center"
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.1, 0.06] }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
          style={{ willChange: "opacity" }}
          className="absolute -left-24 -top-20 h-96 w-96 rounded-full bg-yellow-500/10 blur-[120px]"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.1, 0.05] }}
          transition={{ duration: 2, delay: 0.2, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
          style={{ willChange: "opacity" }}
          className="absolute -bottom-16 -right-16 h-96 w-96 rounded-full bg-yellow-500/5 blur-[120px]"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.5em" }}
          animate={{ opacity: 0.6, letterSpacing: "0.3em" }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          style={{ willChange: "opacity, letter-spacing" }}
          className="mb-6 font-mono text-sm uppercase"
        >
          Exclusive Workshop Series
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          style={{ willChange: "transform, opacity" }}
          className="max-w-5xl font-serif text-7xl font-bold leading-[0.9] tracking-tighter sm:text-8xl md:text-9xl"
        >
          Welcome <span className="italic text-accent">back</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ type: "spring", stiffness: 60, damping: 15, mass: 1, delay: 0.8 }}
          style={{ willChange: "opacity" }}
          className="mt-8 max-w-2xl font-serif text-2xl italic sm:text-3xl"
        >
          We Believe on Output
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 60, damping: 15, mass: 1, delay: 1.2 }}
          style={{ willChange: "transform, opacity" }}
          className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6"
        >
          <div className="glass flex items-center gap-3 rounded-2xl px-6 py-4">
            <Calendar className="h-5 w-5 text-yellow-500" />
            <span className="font-medium">This Sunday</span>
          </div>
          <div className="glass flex items-center gap-3 rounded-2xl px-6 py-4">
            <Clock className="h-5 w-5 text-yellow-500" />
            <span className="font-medium">8:00 PM - 11:00 PM</span>
          </div>
        </motion.div>
      </div>

      <motion.a
        href="#philosophy"
        animate={{ y: [0, 10, 0], opacity: [0.3, 0.1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform, opacity" }}
        className="absolute bottom-8 z-10 rounded-full border border-white/20 p-2 text-zinc-200"
      >
        <ChevronDown className="h-6 w-6" />
      </motion.a>
    </section>
  );
}

export default Hero;
