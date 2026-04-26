import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { LoaderRing } from '@/components/LoaderRing';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});
type Form = z.infer<typeof schema>;

export default function Login() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [mfaPending, setMfaPending] = useState<{ factorId: string; challengeId: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaUseBackup, setMfaUseBackup] = useState(false);
  const [mfaSubmitting, setMfaSubmitting] = useState(false);
  const { register, handleSubmit, getValues, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    if (error) { setLoading(false); toast.error('Email ou senha inválidos'); return; }

    // Check if MFA is required (AAL upgrade needed)
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === 'aal2' && aal.currentLevel === 'aal1') {
      // User has MFA enrolled — challenge required
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find(f => f.status === 'verified');
      if (!totp) { setLoading(false); toast.error('Erro de configuração 2FA'); return; }

      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
      if (chErr || !challenge) {
        setLoading(false);
        toast.error('Falha ao iniciar 2FA');
        return;
      }
      setMfaPending({ factorId: totp.id, challengeId: challenge.id });
      setLoading(false);
      return;
    }

    setLoading(false);
    toast.success('Bem-vindo de volta!');
    nav('/dashboard');
  };

  const submitMfa = async () => {
    if (!mfaPending) return;

    if (mfaUseBackup) {
      // Backup code flow: hash and check against resellers.tfa_backup_codes_encrypted
      setMfaSubmitting(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Sessão inválida');
        const buf = new TextEncoder().encode(mfaCode.trim());
        const hash = await crypto.subtle.digest('SHA-256', buf);
        const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
        const { data: reseller } = await supabase.from('resellers')
          .select('id, tfa_backup_codes_encrypted')
          .eq('user_id', user.id).single();
        const codes = (reseller?.tfa_backup_codes_encrypted || []) as string[];
        if (!codes.includes(hashHex)) throw new Error('Código de backup inválido');

        // Remove used code
        const remaining = codes.filter(c => c !== hashHex);
        await supabase.from('resellers').update({ tfa_backup_codes_encrypted: remaining }).eq('id', reseller!.id);
        toast.success(`Logado com backup. Restam ${remaining.length} códigos.`);

        // For backup codes we have to elevate AAL via challenge skip workaround:
        // Since user already passed password, we accept the backup code as proof.
        // Note: this means session stays at aal1 in Supabase but our middleware checks both.
        nav('/dashboard');
      } catch (e: any) {
        toast.error(e.message || 'Código inválido');
      } finally {
        setMfaSubmitting(false);
      }
      return;
    }

    if (!/^\d{6}$/.test(mfaCode)) { toast.error('Digite o código de 6 dígitos'); return; }
    setMfaSubmitting(true);
    const { error } = await supabase.auth.mfa.verify({
      factorId: mfaPending.factorId,
      challengeId: mfaPending.challengeId,
      code: mfaCode,
    });
    setMfaSubmitting(false);
    if (error) { toast.error('Código inválido'); return; }
    toast.success('Bem-vindo de volta!');
    nav('/dashboard');
  };

  const cancelMfa = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    setMfaPending(null);
    setMfaCode('');
    setMfaUseBackup(false);
  };

  const handleRecover = async () => {
    const email = getValues('email');
    if (!email) { toast.error('Informe o email primeiro'); return; }
    setRecovering(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setRecovering(false);
    if (error) { toast.error('Erro ao enviar. Tente novamente.'); return; }
    toast.success('Enviamos um link de recuperação pro seu email.');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 relative">
      <div className="mesh-blob" style={{ width: 500, height: 500, top: '10%', left: '20%', background: '#22c55e' }} />
      <div className="mesh-blob" style={{ width: 400, height: 400, bottom: '10%', right: '10%', background: '#22d3ee' }} />

      <div className="holo-card holo-permanent p-8 sm:p-10 w-full max-w-md relative z-10">
        {/* MFA Challenge Step */}
        {mfaPending ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="size-14 rounded-2xl bg-primary/15 grid place-items-center">
                <ShieldCheck className="size-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-display font-bold mb-2 text-center">Verificação em 2 etapas</h1>
            <p className="text-text-muted mb-6 text-sm text-center">
              {mfaUseBackup
                ? 'Digite um dos seus códigos de backup'
                : 'Digite o código de 6 dígitos do seu app autenticador'}
            </p>

            <input
              value={mfaCode}
              onChange={(e) => setMfaCode(mfaUseBackup
                ? e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 11)
                : e.target.value.replace(/\D/g, '').slice(0, 6)
              )}
              placeholder={mfaUseBackup ? 'XXXXX-XXXXX' : '000000'}
              className="input-dsl text-center text-2xl tracking-widest font-mono"
              autoFocus
              autoComplete="one-time-code"
              inputMode={mfaUseBackup ? 'text' : 'numeric'}
              onKeyDown={(e) => { if (e.key === 'Enter') submitMfa(); }}
            />

            <button
              onClick={submitMfa}
              disabled={mfaSubmitting}
              className="cta-neon w-full flex items-center justify-center gap-2 mt-4"
            >
              {mfaSubmitting ? <LoaderRing size={20} /> : <span className="relative z-10 flex items-center gap-2">Confirmar <ArrowRight size={18} /></span>}
            </button>

            <div className="flex justify-between items-center mt-4 text-xs">
              <button onClick={cancelMfa} className="text-text-muted hover:text-text-primary">Cancelar</button>
              <button onClick={() => { setMfaUseBackup(!mfaUseBackup); setMfaCode(''); }} className="text-primary hover:text-primary/80 inline-flex items-center gap-1">
                <KeyRound size={12} /> {mfaUseBackup ? 'Usar app autenticador' : 'Usar código de backup'}
              </button>
            </div>
          </>
        ) : (
        <>
        <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">Bem-vindo de volta</h1>
        <p className="text-text-muted mb-8 text-sm">Entre no seu painel de revenda</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-2">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input {...register('email')} type="email" placeholder="seu@email.com" className={`input-dsl pl-10 ${errors.email ? 'error' : ''}`} />
            </div>
            {errors.email && <div className="text-xs text-red-400 mt-1">{errors.email.message}</div>}
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-2">Senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input {...register('password')} type="password" placeholder="••••••••" className={`input-dsl pl-10 ${errors.password ? 'error' : ''}`} />
            </div>
            {errors.password && <div className="text-xs text-red-400 mt-1">{errors.password.message}</div>}
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={handleRecover} disabled={recovering} className="text-xs text-primary hover:text-primary/80">
              {recovering ? 'Enviando...' : 'Esqueci minha senha'}
            </button>
          </div>

          <button type="submit" disabled={loading} className="cta-neon w-full flex items-center justify-center gap-2">
            {loading ? <LoaderRing size={20} /> : <span className="relative z-10 flex items-center gap-2">Entrar <ArrowRight size={18} /></span>}
          </button>
        </form>

        <div className="text-center text-sm text-text-muted mt-8 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          Ainda não é revendedor?{' '}
          <Link to="/cadastrar" className="text-primary font-semibold">Cadastre-se</Link>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
