import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="grain" />
      <Header />
      <main className="flex-1 relative z-[2]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
