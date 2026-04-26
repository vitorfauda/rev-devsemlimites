import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Link as LinkIcon,
  Users,
  Wallet,
  Send,
  Image,
  HelpCircle,
  Shield,
  User,
  LogOut,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const groups = [
  {
    label: 'Visão geral',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Vendas',
    items: [
      { to: '/escala', label: 'Plano de Escala', icon: TrendingUp },
      { to: '/comprar-chaves', label: 'Meus Links', icon: LinkIcon },
      { to: '/minhas-chaves', label: 'Meus Clientes', icon: Users },
      { to: '/enviar-teste', label: 'Enviar teste', icon: Send },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { to: '/extrato', label: 'Extrato', icon: Wallet },
    ],
  },
  {
    label: 'Recursos',
    items: [
      { to: '/materiais', label: 'Materiais', icon: Image },
      { to: '/suporte', label: 'Suporte', icon: HelpCircle },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { to: '/configuracoes', label: 'Configurações', icon: Settings },
      { to: '/seguranca', label: 'Segurança (2FA)', icon: Shield },
      { to: '/perfil', label: 'Perfil', icon: User },
    ],
  },
];

export function Sidebar() {
  const { signOut, session, reseller } = useAuth();
  const nav = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    nav('/');
  };

  const tierColor = reseller?.tier === 'lendario' ? 'text-amber-400 border-amber-400/40' :
    reseller?.tier === 'diamante' ? 'text-cyan-400 border-cyan-400/40' :
    reseller?.tier === 'ouro' ? 'text-amber-300 border-amber-300/40' :
    reseller?.tier === 'prata' ? 'text-text-primary border-white/30' :
    'text-amber-600 border-amber-600/30';

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r backdrop-blur-xl z-40"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(5,7,13,0.85)' }}
    >
      {/* Logo */}
      <Link to="/dashboard" className="h-16 flex items-center gap-3 px-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="relative">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center shadow-lg shadow-primary/50">
            <span className="text-void font-black text-sm">D</span>
          </div>
          <div className="absolute inset-0 rounded-xl bg-primary/40 blur-md -z-10" />
        </div>
        <div>
          <div className="font-display font-bold leading-tight">Dev Sem Limites</div>
          <div className="text-[10px] text-text-dim uppercase tracking-widest">Revenda</div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-3 mb-2 text-[10px] font-semibold text-text-dim uppercase tracking-widest">{g.label}</div>
            <div className="space-y-0.5">
              {g.items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent'
                    }`
                  }
                >
                  <it.icon size={16} />
                  {it.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t p-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {reseller && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {reseller.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || 'R'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-text-muted truncate font-medium">{reseller.name?.split(' ')[0] || 'Revenda'}</div>
              <div className={`text-[10px] uppercase tracking-wider font-semibold ${tierColor.split(' ')[0]}`}>
                {reseller.tier?.toUpperCase() || 'BRONZE'}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={14} /> Sair
        </button>
      </div>
    </aside>
  );
}
