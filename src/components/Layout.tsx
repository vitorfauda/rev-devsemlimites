import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useAuth } from '@/hooks/useAuth';

const PUBLIC_ROUTES = ['/', '/login', '/cadastrar', '/seja-revenda', '/termos', '/privacidade'];

export function Layout() {
  const { session } = useAuth();
  const location = useLocation();

  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
  const useSidebar = !!session && !isPublicRoute;

  if (useSidebar) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
        <Sidebar />
        <main className="md:ml-64 min-h-screen pb-20 md:pb-0">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
