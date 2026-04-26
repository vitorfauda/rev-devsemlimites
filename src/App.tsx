import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Cadastrar from '@/pages/Cadastrar';
import Dashboard from '@/pages/Dashboard';
import ComprarChaves from '@/pages/ComprarChaves';
import MinhasChaves from '@/pages/MinhasChaves';
import EnviarTeste from '@/pages/EnviarTeste';
import Materiais from '@/pages/Materiais';
import Perfil from '@/pages/Perfil';
import Suporte from '@/pages/Suporte';
import OnboardingPagarme from '@/pages/OnboardingPagarme';
import Seguranca from '@/pages/Seguranca';
import Extrato from '@/pages/Extrato';
import Escala from '@/pages/Escala';
import Configuracoes from '@/pages/Configuracoes';
import SejaRevenda from '@/pages/SejaRevenda';
import Termos from '@/pages/Termos';
import Privacidade from '@/pages/Privacidade';
import Cursos from '@/pages/Cursos';
import CursoView from '@/pages/CursoView';
import AdminCursos from '@/pages/AdminCursos';
import Loja from '@/pages/Loja';
import Estoque from '@/pages/Estoque';

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
                background: '#0f0f0f',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fafafa',
              },
            }}
          />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<SejaRevenda />} />
              <Route path="/seja-revenda" element={<SejaRevenda />} />
              <Route path="/termos" element={<Termos />} />
              <Route path="/privacidade" element={<Privacidade />} />
              <Route path="/landing-antiga" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastrar" element={<Cadastrar />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/comprar-chaves" element={<ProtectedRoute><ComprarChaves /></ProtectedRoute>} />
              <Route path="/minhas-chaves" element={<ProtectedRoute><MinhasChaves /></ProtectedRoute>} />
              <Route path="/enviar-teste" element={<ProtectedRoute><EnviarTeste /></ProtectedRoute>} />
              <Route path="/materiais" element={<ProtectedRoute><Materiais /></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
              <Route path="/suporte" element={<ProtectedRoute><Suporte /></ProtectedRoute>} />
              <Route path="/onboarding-pagarme" element={<ProtectedRoute><OnboardingPagarme /></ProtectedRoute>} />
              <Route path="/seguranca" element={<ProtectedRoute><Seguranca /></ProtectedRoute>} />
              <Route path="/extrato" element={<ProtectedRoute><Extrato /></ProtectedRoute>} />
              <Route path="/escala" element={<ProtectedRoute><Escala /></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
              <Route path="/cursos" element={<ProtectedRoute><Cursos /></ProtectedRoute>} />
              <Route path="/cursos/:slug" element={<ProtectedRoute><CursoView /></ProtectedRoute>} />
              <Route path="/admin/cursos" element={<ProtectedRoute><AdminCursos /></ProtectedRoute>} />
              <Route path="/loja" element={<ProtectedRoute><Loja /></ProtectedRoute>} />
              <Route path="/estoque" element={<ProtectedRoute><Estoque /></ProtectedRoute>} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
