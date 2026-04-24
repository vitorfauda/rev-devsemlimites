import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t mt-24" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 font-display font-bold text-lg mb-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center">
                <span className="text-void font-black text-sm">D</span>
              </div>
              Dev Sem Limites
            </div>
            <p className="text-sm text-text-muted">
              Programa oficial de revenda. A extensão mais vendida pra Lovable ilimitado.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3 text-text-primary">Produto</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><a href="https://devsemlimites.site" target="_blank" rel="noreferrer" className="hover:text-primary">Site oficial</a></li>
              <li><a href="https://pay.devsemlimites.site" target="_blank" rel="noreferrer" className="hover:text-primary">Comprar licença</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3 text-text-primary">Revenda</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link to="/" className="hover:text-primary">Seja revendedor</Link></li>
              <li><Link to="/como-funciona" className="hover:text-primary">Como funciona</Link></li>
              <li><Link to="/login" className="hover:text-primary">Entrar</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3 text-text-primary">Contato</h4>
            <div className="flex gap-3">
              <a href="https://wa.me/5527992660736" target="_blank" rel="noreferrer" className="h-10 w-10 rounded-xl flex items-center justify-center border hover:border-primary hover:text-primary transition-all" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <MessageCircle size={18} />
              </a>
              <a href="https://instagram.com/devsemlimites" target="_blank" rel="noreferrer" className="h-10 w-10 rounded-xl flex items-center justify-center border hover:border-primary hover:text-primary transition-all font-semibold text-sm" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                IG
              </a>
              <a href="#" className="h-10 w-10 rounded-xl flex items-center justify-center border hover:border-primary hover:text-primary transition-all font-semibold text-sm" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                YT
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row justify-between gap-4 text-xs text-text-dim" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <p>© {new Date().getFullYear()} Dev Sem Limites. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-text-muted">Termos</a>
            <a href="#" className="hover:text-text-muted">Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
