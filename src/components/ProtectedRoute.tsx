import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoaderRing } from '@/components/LoaderRing';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, reseller, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderRing />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  // Se logado mas ainda não pagou taxa de entrada, manda pra cadastro (step 2)
  if (reseller && !reseller.entry_paid) {
    return <Navigate to="/cadastrar?step=payment" replace />;
  }

  return <>{children}</>;
}
