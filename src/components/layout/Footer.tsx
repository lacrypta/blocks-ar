import { BrandMark } from "./BrandLogo";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-white/15 bg-transparent dark:border-white/8">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="flex items-center gap-2">
            <BrandMark className="h-5 w-5" />
            <span className="text-sm font-extrabold">
              Blocks<span className="text-bitcoin">.AR</span>
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Sats argentos: el precio del Bitcoin en pesos, en tiempo real, desde
            los principales exchanges y brokers.
          </p>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">
            Open Source
          </div>
          <a
            className="mt-3 inline-flex items-center gap-2 text-sm text-muted hover:text-fg"
            href="https://github.com/lacrypta/blocks-ar"
            target="_blank"
            rel="noreferrer"
          >
            <GitHubMark className="h-4 w-4" />
            <span>lacrypta/blocks-ar</span>
          </a>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-muted sm:px-6">
          Blocks.AR · Created by{" "}
          <a
            className="hover:text-fg"
            href="https://github.com/agustinkassis"
            target="_blank"
            rel="noreferrer"
          >
            agustinkassis
          </a>
          . Powered by{" "}
            <a
              className="hover:text-fg"
              href="https://www.lacrypta.dev/"
              target="_blank"
              rel="noreferrer"
            >
            La Crypta Dev
            </a>
          .
        </div>
      </div>
    </footer>
  );
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .5C5.649.5.5 5.649.5 12A11.5 11.5 0 0 0 8.36 22.06c.575.105.785-.25.785-.555 0-.275-.01-1-.015-1.96-3.18.69-3.85-1.53-3.85-1.53-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.695.08-.695 1.15.08 1.755 1.18 1.755 1.18 1.02 1.75 2.675 1.245 3.325.95.105-.74.4-1.245.725-1.53-2.54-.29-5.21-1.27-5.21-5.655 0-1.25.445-2.275 1.175-3.08-.12-.29-.51-1.455.11-3.03 0 0 .96-.305 3.145 1.175a10.9 10.9 0 0 1 5.73 0c2.18-1.48 3.14-1.175 3.14-1.175.62 1.575.23 2.74.115 3.03.73.805 1.17 1.83 1.17 3.08 0 4.395-2.675 5.36-5.225 5.645.41.355.775 1.055.775 2.125 0 1.535-.015 2.775-.015 3.15 0 .31.205.665.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.649 18.351.5 12 .5Z" />
    </svg>
  );
}
