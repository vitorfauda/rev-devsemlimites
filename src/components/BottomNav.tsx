import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, TrendingUp, Link as LinkIcon, Wallet, Menu, X,
  Users, Send, Image, HelpCircle, Shield, User, LogOut, Settings,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const primary = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/escala', label: 'Escala', icon: TrendingUp },
  { to: '/comprar-chaves', label: 'Links', icon: LinkIcon },
  { to: '/extrato', label: 'Extrato', icon: Wallet },
];

const moreLinks = [
  { to: '/minhas-chaves', label: 'Meus clientes', icon: Users },
  { to: '/enviar-teste', label: 'Enviar teste', icon: Send },
  { to: '/materiais', label: 'Materiais', icon: Image },
  { to: '/suporte', label: 'Suporte', icon: HelpCircle },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
  { to: '/seguranca', label: 'Segurança · 2FA', icon: Shield },
  { to: '/perfil', label: 'Perfil', icon: User },
];

export function BottomNav() {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();
  const nav = useNavigate();

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
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-md hover:bg-white/5 text-[var(--color-text-muted)]">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {moreLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
              >
                <l.icon size={15} /> {l.label}
              </Link>
            ))}
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
