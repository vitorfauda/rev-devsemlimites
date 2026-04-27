import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, TrendingUp, Link as LinkIcon, Wallet, Menu, X,
  Users, Send, Image, HelpCircle, Shield, User, LogOut, Settings,
  GraduationCap, Wrench, ShoppingCart, Package, Lock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type MoreItem = { to: string; label: string; icon: any; disabled?: boolean };

const primary = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/loja', label: 'Loja', icon: ShoppingCart },
  { to: '/estoque', label: 'Estoque', icon: Package },
  { to: '/cursos', label: 'Cursos', icon: GraduationCap },
];

const baseMoreLinks: MoreItem[] = [
  { to: '/enviar-teste', label: 'Enviar teste', icon: Send },
  { to: '/escala', label: 'Plano de escala', icon: TrendingUp },
  { to: '/comprar-chaves', label: 'Meus links', icon: LinkIcon },
  { to: '/minhas-chaves', label: 'Meus clientes', icon: Users },
  { to: '/extrato', label: 'Extrato Pagar.me', icon: Wallet },
  { to: '/materiais', label: 'Materiais', icon: Image },
  { to: '/suporte', label: 'Suporte', icon: HelpCircle },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
  { to: '/seguranca', label: 'Segurança · 2FA', icon: Shield },
  { to: '/perfil', label: 'Perfil', icon: User },
];

const adminMoreLinks: MoreItem[] = [
  { to: '/admin/cursos', label: 'Gerenciar cursos', icon: Wrench },
];

export function BottomNav() {
  const [open, setOpen] = useState(false);
  const { signOut, isAdmin } = useAuth();
  const nav = useNavigate();
  const moreLinks = isAdmin ? [...baseMoreLinks, ...adminMoreLinks] : baseMoreLinks;

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    nav('/');
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
        <div className="grid grid-cols-5 h-14">
          {primary.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                'flex flex-col items-center justify-center gap-0.5 text-[10px] ' +
                (isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]')
              }
            >
              <l.icon size={16} />
              {l.label}
            </NavLink>
          ))}
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] text-[var(--color-text-muted)]"
          >
            <Menu size={16} />
            Mais
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)]/95 backdrop-blur">
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <span className="text-sm font-medium">Mais opções</span>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-md hover:bg-white/5 text-[var(--color-text-muted)]"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {moreLinks.map((l) =>
              l.disabled ? (
                <div
                  key={l.to}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[var(--color-text-dim)] opacity-50 select-none"
                >
                  <l.icon size={15} /> <span className="flex-1">{l.label}</span>
                  <Lock size={11} />
                </div>
              ) : (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                >
                  <l.icon size={15} /> {l.label}
                </Link>
              ),
            )}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-red-400 hover:bg-red-500/10 mt-3"
            >
              <LogOut size={15} /> Sair
            </button>
          </div>
        </div>
      )}
    </>
  );
}
