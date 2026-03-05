import { motion } from "framer-motion";
import { CheckCircle2, MessageSquare, Star, Users, Zap } from "lucide-react";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, margin: "-100px" },
  transition: { type: "spring", stiffness: 60, damping: 15, mass: 1 },
};

const featureGridVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const featureItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 60, damping: 15, mass: 1 },
  },
};

const features = [
  {
    icon: Users,
    title: "Personal Interaction",
    description: "You will be personally spoken to, ensuring your voice is heard.",
  },
  {
    icon: CheckCircle2,
    title: "Idea Validation",
    description: "Your idea will be properly validated with critical feedback.",
  },
  {
    icon: Zap,
    title: "Future Scope",
    description: "Detailed explanation of the future scope and scalability of your concept.",
  },
  {
    icon: MessageSquare,
    title: "Networking",
    description: "Connect with like-minded individuals building the next big thing.",
  },
];

function WorkshopDetails() {
  return (
    <motion.section
      id="workshop"
      {...reveal}
      style={{ willChange: "transform, opacity" }}
      className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-16 bg-zinc-950 px-6 py-24 md:grid-cols-2 md:py-32"
    >
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-400">Workshop Details</p>
        <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
          Up Coming <span className="italic text-accent">Session</span>
        </h2>

        <div className="glass mt-8 rounded-3xl border-l-4 border-l-accent bg-zinc-900 p-8">
          <h3 className="text-2xl font-bold leading-tight sm:text-3xl">
            Topic: Idea Validation / Networking
          </h3>
          <p className="mt-4 text-white/60">
            A high-intensity 3-hour session designed for serious founders who want to stop guessing and start
            building.
          </p>
        </div>

        <motion.div
          variants={featureGridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-100px" }}
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {features.map((feature) => (
            <motion.article
              key={feature.title}
              variants={featureItemVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="rounded-2xl border border-white/5 bg-white/5 p-6"
            >
              <feature.icon className="mb-4 h-5 w-5 text-yellow-500" />
              <h4 className="font-semibold">{feature.title}</h4>
              <p className="mt-2 text-sm text-white/50">{feature.description}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>

      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="glass aspect-[4/5] rounded-3xl p-4"
      >
        <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-zinc-900 p-12 text-center">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.3)]">
            <Star className="h-8 w-8 text-black" />
          </div>
          <h3 className="mb-4 font-serif text-3xl font-bold">Limited Seats</h3>
          <p className="mb-8 text-white/60">
            To maintain the quality of personal interaction, we only accept a handful of participants each session.
          </p>

          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "85%" }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ willChange: "width" }}
              className="h-full rounded-full bg-yellow-500"
            />
          </div>
          <p className="mt-4 font-mono text-xs font-bold uppercase tracking-widest text-yellow-500">
            85% CAPACITY REACHED
          </p>
        </div>
      </motion.div>
    </motion.section>
  );
}

export default WorkshopDetails;
