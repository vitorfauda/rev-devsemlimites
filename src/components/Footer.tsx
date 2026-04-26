import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-12">
      <div className="max-w-[1100px] mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-dim)]">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded overflow-hidden">
            <img src="/logo.png" alt="DSL" className="h-full w-full object-contain" />
          </div>
          <span>© {new Date().getFullYear()} Dev Sem Limites · Programa de revendas</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/seja-revenda" className="hover:text-[var(--color-text)] transition-colors">
            Seja revenda
          </Link>
          <Link to="/login" className="hover:text-[var(--color-text)] transition-colors">
            Entrar
          </Link>
          <Link to="/termos" className="hover:text-[var(--color-text)] transition-colors">
            Termos
          </Link>
          <Link to="/privacidade" className="hover:text-[var(--color-text)] transition-colors">
            Privacidade
          </Link>
          <a
            href="https://wa.me/5527992660736"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--color-text)] transition-colors"
          >
            Suporte
          </a>
        </div>
      </div>
    </footer>
  );
}
