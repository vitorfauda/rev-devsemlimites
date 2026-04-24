import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import ComoFunciona from '@/pages/ComoFunciona';
import Login from '@/pages/Login';
import Cadastrar from '@/pages/Cadastrar';
import Dashboard from '@/pages/Dashboard';
import ComprarChaves from '@/pages/ComprarChaves';
import MinhasChaves from '@/pages/MinhasChaves';
import EnviarTeste from '@/pages/EnviarTeste';
import Materiais from '@/pages/Materiais';
import Perfil from '@/pages/Perfil';
import Suporte from '@/pages/Suporte';

const qc = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 30000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: '#0a0f1a',
                border: '1px solid rgba(34,197,94,0.2)',
                color: '#f8fafc',
              },
            }}
          />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/como-funciona" element={<ComoFunciona />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastrar" element={<Cadastrar />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/comprar-chaves" element={<ProtectedRoute><ComprarChaves /></ProtectedRoute>} />
              <Route path="/minhas-chaves" element={<ProtectedRoute><MinhasChaves /></ProtectedRoute>} />
              <Route path="/enviar-teste" element={<ProtectedRoute><EnviarTeste /></ProtectedRoute>} />
              <Route path="/materiais" element={<ProtectedRoute><Materiais /></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
              <Route path="/suporte" element={<ProtectedRoute><Suporte /></ProtectedRoute>} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
