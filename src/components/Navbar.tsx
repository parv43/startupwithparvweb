import { motion } from "framer-motion";

const navLinks = [
  { href: "#home", label: "HOME" },
  { href: "#workshop", label: "WORKSHOP" },
  { href: "#register", label: "REGISTER" },
];

const navContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const navItemVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 60,
      damping: 15,
      mass: 1,
    },
  },
};

function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 m-4">
      <div className="glass relative mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-4 py-3 md:px-8 md:py-4">
        <a href="#home" className="font-serif text-sm font-bold tracking-[0.12em] sm:text-base">
          PARV <span className="text-accent">SRIVASTAVA</span>
        </a>

        <motion.nav
          initial="hidden"
          animate="visible"
          variants={navContainerVariants}
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex"
        >
          {navLinks.map((link) => (
            <motion.a
              key={link.label}
              href={link.href}
              variants={navItemVariants}
              className="text-sm font-medium tracking-[0.14em] text-white/70 transition-colors hover:text-accent"
            >
              {link.label}
            </motion.a>
          ))}
        </motion.nav>

        <motion.a
          href="#register"
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="rounded-full bg-accent px-4 py-2 text-xs font-bold tracking-wide text-black sm:px-6 sm:py-2.5 sm:text-sm"
        >
          JOIN NOW
        </motion.a>
      </div>
    </header>
  );
}

export default Navbar;
