import { motion } from "framer-motion";
import { useMemo, useState } from "react";

const sectionVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const springQuote = {
  type: "spring",
  stiffness: 50,
  damping: 20,
  mass: 1,
} as const;

const firstQuoteVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springQuote,
  },
};

const secondQuoteVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      ...springQuote,
      delay: 0.3,
    },
  },
};

const signatureVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ...springQuote,
      delay: 0.6,
    },
  },
};

function QuoteSection() {
  const imageSources = useMemo(
    () => [
      "https://drive.google.com/uc?export=download&id=1abdUcEq2UDOToa23RXyiCNCvHCriLt3-",
      "https://drive.google.com/uc?export=view&id=1abdUcEq2UDOToa23RXyiCNCvHCriLt3-",
      "https://drive.google.com/thumbnail?id=1abdUcEq2UDOToa23RXyiCNCvHCriLt3-&sz=w2000",
    ],
    [],
  );
  const [imageIndex, setImageIndex] = useState(0);

  return (
    <motion.section
      id="philosophy"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, margin: "-100px" }}
      className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-6 py-24 md:grid-cols-2 md:gap-16 md:py-32"
    >
      <div>
        <motion.p
          variants={firstQuoteVariants}
          className="mb-7 font-serif text-3xl italic leading-snug text-accent/90 sm:text-4xl"
        >
          &quot;If your family would starve after your death, you should first find a stable job to secure their
          future.&quot;
        </motion.p>
        <motion.p
          variants={secondQuoteVariants}
          className="mb-10 font-serif text-3xl italic leading-snug text-white/80 sm:text-4xl"
        >
          &quot;But if even after your death their food and basic needs will still be taken care of, then come - you
          can try becoming a founder.&quot;
        </motion.p>

        <motion.div variants={signatureVariants}>
          <div className="h-px w-32 bg-accent" />
          <p className="mt-6 font-serif text-lg font-extrabold uppercase tracking-[0.2em]">PARV SRIVASTAVA</p>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.28em] text-white/40">
            Business Coach & Founder
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, margin: "-100px" }}
        transition={{ type: "spring", stiffness: 60, damping: 15, mass: 1, delay: 0.2 }}
        whileHover={{ scale: 1.02, y: -4 }}
        style={{ willChange: "transform, opacity" }}
        className="relative overflow-hidden rounded-[4rem] bg-zinc-900"
      >
        <img
          src={imageSources[imageIndex]}
          alt="Founder portrait"
          onError={() => {
            setImageIndex((current) => (current < imageSources.length - 1 ? current + 1 : current));
          }}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          className="h-[520px] w-full rounded-[4rem] border border-white/10 object-cover shadow-2xl transition duration-500 hover:brightness-110 md:h-[600px]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
      </motion.div>
    </motion.section>
  );
}

export default QuoteSection;
