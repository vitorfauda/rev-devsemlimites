import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ButtonLink, Button } from '@/components/ui';

export function Header() {
  const { session, signOut } = useAuth();
  const nav = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    nav('/');
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[var(--color-bg)]/80 border-b border-[var(--color-border)]">
      <div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link to={session ? '/dashboard' : '/'} className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md overflow-hidden">
            <img src="/logo.png" alt="DSL" className="h-full w-full object-contain" />
          </div>
          <span className="font-semibold tracking-tight">Dev Sem Limites</span>
          <span className="hidden sm:inline text-xs text-[var(--color-text-dim)]">· Revenda</span>
        </Link>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <ButtonLink href="/dashboard" variant="ghost" size="sm">
                Dashboard
              </ButtonLink>
              <Button onClick={handleSignOut} variant="ghost" size="sm">
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link to="/cadastrar">
                <Button size="sm">Cadastrar →</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
