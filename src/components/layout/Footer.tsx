import { BrandMark } from "./BrandLogo";

const DONATION = "bc1q... (definir dirección de donación)";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-border bg-surface-2/50">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
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
            Comunidad
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a
                className="text-muted hover:text-fg"
                href="https://lacrypta.ar"
                target="_blank"
                rel="noreferrer"
              >
                La Crypta
              </a>
            </li>
            <li>
              <a
                className="text-muted hover:text-fg"
                href="https://lacrypta.ar"
                target="_blank"
                rel="noreferrer"
              >
                Comunidad Bitcoin Argentina
              </a>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">
            Bibliografía
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a className="text-muted hover:text-fg" href="#">
                Whitepaper de Bitcoin (ES/EN)
              </a>
            </li>
            <li>
              <a className="text-muted hover:text-fg" href="#">
                Mastering Bitcoin
              </a>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">
            Aportar
          </div>
          <p className="mt-3 break-all font-mono text-[11px] text-muted">
            {DONATION}
          </p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        Blocks.AR · Datos con fines informativos. No es asesoramiento financiero.
      </div>
    </footer>
  );
}
