import { Instagram, Linkedin, Mail } from "lucide-react";

function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-10">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-5 text-sm text-zinc-400 md:grid-cols-3">
        <p className="text-center font-serif text-xs font-bold tracking-[0.18em] text-zinc-200 md:text-left">
          PARV <span className="text-accent">SRIVASTAVA</span>
        </p>
        <p className="text-center text-sm text-white/40">© 2024 All Rights Reserved. Built for Output.</p>
        <div className="flex items-center justify-center gap-3 md:justify-end">
          <a
            href="#"
            aria-label="LinkedIn"
            className="rounded-full border border-white/10 p-2 transition-colors hover:border-accent hover:text-accent"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href="#"
            aria-label="Instagram"
            className="rounded-full border border-white/10 p-2 transition-colors hover:border-accent hover:text-accent"
          >
            <Instagram className="h-4 w-4" />
          </a>
          <a
            href="#"
            aria-label="Mail"
            className="rounded-full border border-white/10 p-2 transition-colors hover:border-accent hover:text-accent"
          >
            <Mail className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
