import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Link as LinkIcon, Users, Wallet, Send, ShoppingCart, Package,
  Image, HelpCircle, Shield, User, LogOut, Settings, GraduationCap, Wrench, Lock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type NavItem = {
  to: string;
  label: string;
  icon: any;
  /** Quando true, item aparece em cinza, não-clicável, com badge "em manutenção" */
  disabled?: boolean;
};
type NavGroup = { label: string; items: NavItem[] };

const baseGroups: NavGroup[] = [
  { label: 'Visão geral', items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    label: 'Revenda',
    items: [
      { to: '/loja', label: 'Comprar licenças', icon: ShoppingCart },
      { to: '/estoque', label: 'Meu estoque', icon: Package },
      { to: '/enviar-teste', label: 'Enviar teste', icon: Send },
    ],
  },
  {
    label: 'Comissão (em breve)',
    items: [
      { to: '/escala', label: 'Plano de escala', icon: TrendingUp, disabled: true },
      { to: '/comprar-chaves', label: 'Meus links', icon: LinkIcon, disabled: true },
      { to: '/minhas-chaves', label: 'Meus clientes', icon: Users, disabled: true },
      { to: '/extrato', label: 'Extrato Pagar.me', icon: Wallet, disabled: true },
    ],
  },
  {
    label: 'Recursos',
    items: [
      { to: '/cursos', label: 'Cursos', icon: GraduationCap },
      { to: '/materiais', label: 'Materiais', icon: Image },
      { to: '/suporte', label: 'Suporte', icon: HelpCircle },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { to: '/configuracoes', label: 'Configurações', icon: Settings },
      { to: '/seguranca', label: 'Segurança · 2FA', icon: Shield },
      { to: '/perfil', label: 'Perfil', icon: User },
    ],
  },
];

const adminGroup: NavGroup = {
  label: 'Admin',
  items: [{ to: '/admin/cursos', label: 'Gerenciar cursos', icon: Wrench }],
};

export function Sidebar() {
  const { signOut, session, reseller, isAdmin } = useAuth();
  const nav = useNavigate();
  const groups = isAdmin ? [...baseGroups, adminGroup] : baseGroups;

  const handleSignOut = async () => {
    await signOut();
    nav('/');
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] z-40">
      <Link to="/dashboard" className="h-14 flex items-center gap-2.5 px-4 border-b border-[var(--color-border)]">
        <div className="h-7 w-7 rounded-md overflow-hidden">
          <img src="/logo.png" alt="DSL" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight truncate">Dev Sem Limites</div>
          <div className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-widest">Revenda</div>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-2 mb-1.5 text-[10px] font-semibold text-[var(--color-text-dim)] uppercase tracking-widest">
              {g.label}
            </div>
            <div className="space-y-0.5">
              {g.items.map((it) =>
                it.disabled ? (
                  <div
                    key={it.to}
                    title="Em manutenção — voltará em breve"
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-[var(--color-text-dim)] opacity-50 cursor-not-allowed select-none"
                  >
                    <it.icon size={15} />
                    <span className="truncate flex-1">{it.label}</span>
                    <Lock size={11} />
                  </div>
                ) : (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    className={({ isActive }) =>
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-all ' +
                      (isActive
                        ? 'bg-[var(--color-surface-2)] text-[var(--color-text)]'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]/50')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <it.icon size={15} className={isActive ? 'text-[var(--color-primary)]' : ''} />
                        <span className="truncate">{it.label}</span>
                      </>
                    )}
                  </NavLink>
                ),
              )}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--color-border)] p-3">
        {reseller && (
          <div className="flex items-center gap-2.5 px-1 py-1.5 mb-2">
            <div className="size-8 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center text-xs font-semibold text-[var(--color-primary)] shrink-0">
              {reseller.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || 'R'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{reseller.name?.split(' ')[0] || 'Revenda'}</div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-dim)]">
                {reseller.tier?.toUpperCase() || 'BRONZE'}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={13} /> Sair
        </button>
      </div>
    </aside>
  );
}
