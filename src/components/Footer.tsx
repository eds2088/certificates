import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t bg-secondary/40">
      <div className="container mx-auto max-w-6xl px-6 grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo size="md" />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Cada criança no seu ritmo, a família ao lado.
          </p>
          <p className="mt-1 max-w-xs text-xs italic text-muted-foreground">
            Cada niño a su ritmo, la familia al lado.
          </p>
        </div>

        <div>
          <h4 className="mb-3 font-display text-sm font-semibold text-foreground">Produto</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/precos" className="hover:text-foreground">Preços</Link></li>
            <li><Link to="/" hash="como-funciona" className="hover:text-foreground">Como funciona</Link></li>
            <li><Link to="/" hash="para-pais" className="hover:text-foreground">Para pais</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-display text-sm font-semibold text-foreground">Empresa</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="mailto:contato@estudito.com.br" className="hover:text-foreground">Contato</a></li>
            <li><span className="text-muted-foreground">Privacidade & LGPD</span></li>
            <li><span className="text-muted-foreground">Termos de uso</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="container mx-auto max-w-6xl px-6 flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Estudito. Feito em São Paulo, Brasil.</p>
          <p>Plataforma educacional para famílias.</p>
        </div>
      </div>
    </footer>
  );
}
