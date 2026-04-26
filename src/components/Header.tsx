import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const publicLinks = [
  { to: '/', label: 'Início' },
  { to: '/como-funciona', label: 'Como funciona' },
];

const privateLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/escala', label: 'Plano de Escala' },
  { to: '/comprar-chaves', label: 'Meus Links' },
  { to: '/minhas-chaves', label: 'Meus Clientes' },
  { to: '/extrato', label: 'Extrato' },
  { to: '/enviar-teste', label: 'Enviar teste' },
  { to: '/materiais', label: 'Materiais' },
  { to: '/suporte', label: 'Suporte' },
];

export function Header() {
  const { session, signOut, isAdmin } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const links = session ? privateLinks : publicLinks;

  const handleSignOut = async () => {
    await signOut();
    nav('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur-xl" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(5,7,13,0.75)' }}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link to={session ? '/dashboard' : '/'} className="flex items-center gap-2 font-display font-bold text-lg">
          <div className="relative">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center shadow-lg shadow-primary/40">
              <span className="text-void font-black text-sm">D</span>
            </div>
            <div className="absolute inset-0 rounded-lg bg-primary/30 blur-md -z-10" />
          </div>
          <span className="text-text-primary">Dev Sem Limites</span>
          <span className="hidden sm:inline text-xs text-text-muted font-normal">| Revenda</span>
          {isAdmin && (
            <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full border font-bold ml-1" style={{ background: 'rgba(217,70,239,0.12)', borderColor: 'rgba(217,70,239,0.4)', color: '#d946ef' }}>
              MODO ADMIN
            </span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link to="/seguranca" className="hidden sm:block px-3 py-2 rounded-xl text-sm text-text-muted hover:text-text-primary hover:bg-white/5 transition-all">
                Segurança
              </Link>
              <Link to="/perfil" className="hidden sm:block px-3 py-2 rounded-xl text-sm text-text-muted hover:text-text-primary hover:bg-white/5 transition-all">
                Perfil
              </Link>
              <button onClick={handleSignOut} className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all">
                <LogOut size={16} /> Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block px-4 py-2 rounded-xl text-sm font-medium text-text-muted hover:text-text-primary transition-all">
                Entrar
              </Link>
              <Link to="/cadastrar" className="cta-neon text-sm !py-2.5">
                <span className="relative z-10">Cadastrar</span>
              </Link>
            </>
          )}
          <button className="md:hidden p-2 rounded-lg hover:bg-white/5" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-white/5'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {session ? (
              <>
                <Link to="/perfil" onClick={() => setOpen(false)} className="px-4 py-3 rounded-xl text-sm text-text-muted hover:bg-white/5">
                  Perfil
                </Link>
                <button onClick={handleSignOut} className="text-left px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10">
                  Sair
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="px-4 py-3 rounded-xl text-sm text-text-muted hover:bg-white/5">
                Entrar
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
