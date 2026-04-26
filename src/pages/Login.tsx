import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { LoaderRing } from '@/components/LoaderRing';
import { Button, Card, inputClass } from '@/components/ui';

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
    if (error) {
      setLoading(false);
      toast.error('Email ou senha inválidos');
      return;
    }
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === 'aal2' && aal.currentLevel === 'aal1') {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find((f) => f.status === 'verified');
      if (!totp) {
        setLoading(false);
        toast.error('Erro de configuração 2FA');
        return;
      }
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
    toast.success('Bem-vindo de volta');
    nav('/dashboard');
  };

  const submitMfa = async () => {
    if (!mfaPending) return;
    if (mfaUseBackup) {
      setMfaSubmitting(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Sessão inválida');
        const buf = new TextEncoder().encode(mfaCode.trim());
        const hash = await crypto.subtle.digest('SHA-256', buf);
        const hashHex = Array.from(new Uint8Array(hash))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        const { data: reseller } = await supabase
          .from('resellers')
          .select('id, tfa_backup_codes_encrypted')
          .eq('user_id', user.id)
          .single();
        const codes = (reseller?.tfa_backup_codes_encrypted || []) as string[];
        if (!codes.includes(hashHex)) throw new Error('Código de backup inválido');
        const remaining = codes.filter((c) => c !== hashHex);
        await supabase.from('resellers').update({ tfa_backup_codes_encrypted: remaining }).eq('id', reseller!.id);
        toast.success(`Logado com backup. Restam ${remaining.length} códigos.`);
        nav('/dashboard');
      } catch (e: any) {
        toast.error(e.message || 'Código inválido');
      } finally {
        setMfaSubmitting(false);
      }
      return;
    }
    if (!/^\d{6}$/.test(mfaCode)) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }
    setMfaSubmitting(true);
    const { error } = await supabase.auth.mfa.verify({
      factorId: mfaPending.factorId,
      challengeId: mfaPending.challengeId,
      code: mfaCode,
    });
    setMfaSubmitting(false);
    if (error) {
      toast.error('Código inválido');
      return;
    }
    toast.success('Bem-vindo de volta');
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
    if (!email) {
      toast.error('Informe o email primeiro');
      return;
    }
    setRecovering(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setRecovering(false);
    if (error) {
      toast.error('Erro ao enviar. Tente novamente.');
      return;
    }
    toast.success('Enviamos um link de recuperação pro seu email');
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6 py-12">
      <Card className="p-8 w-full max-w-md">
        {mfaPending ? (
          <>
            <div className="size-12 rounded-md bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 grid place-items-center mx-auto mb-5">
              <ShieldCheck size={20} className="text-[var(--color-primary)]" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center">Verificação em 2 etapas</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-6 text-center">
              {mfaUseBackup
                ? 'Digite um dos seus códigos de backup'
                : 'Digite o código do seu app autenticador'}
            </p>

            <input
              value={mfaCode}
              onChange={(e) =>
                setMfaCode(
                  mfaUseBackup
                    ? e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 11)
                    : e.target.value.replace(/\D/g, '').slice(0, 6),
                )
              }
              placeholder={mfaUseBackup ? 'XXXXX-XXXXX' : '000000'}
              className={inputClass + ' text-center text-2xl tracking-widest font-mono h-12'}
              autoFocus
              autoComplete="one-time-code"
              inputMode={mfaUseBackup ? 'text' : 'numeric'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitMfa();
              }}
            />

            <Button onClick={submitMfa} disabled={mfaSubmitting} size="lg" className="w-full mt-4">
              {mfaSubmitting ? (
                <LoaderRing size={16} />
              ) : (
                <>
                  Confirmar <ArrowRight size={14} />
                </>
              )}
            </Button>

            <div className="flex justify-between items-center mt-4 text-xs">
              <button onClick={cancelMfa} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                Cancelar
              </button>
              <button
                onClick={() => {
                  setMfaUseBackup(!mfaUseBackup);
                  setMfaCode('');
                }}
                className="text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
              >
                <KeyRound size={11} /> {mfaUseBackup ? 'Usar app' : 'Usar backup'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-7">Entre no seu painel de revenda</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="seu@email.com"
                    className={inputClass + ' pl-10' + (errors.email ? ' border-red-500/50' : '')}
                  />
                </div>
                {errors.email && <div className="text-xs text-red-400 mt-1">{errors.email.message}</div>}
              </div>

              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1.5">Senha</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" />
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    className={inputClass + ' pl-10' + (errors.password ? ' border-red-500/50' : '')}
                  />
                </div>
                {errors.password && <div className="text-xs text-red-400 mt-1">{errors.password.message}</div>}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRecover}
                  disabled={recovering}
                  className="text-xs text-[var(--color-primary)] hover:underline"
                >
                  {recovering ? 'Enviando…' : 'Esqueci minha senha'}
                </button>
              </div>

              <Button type="submit" disabled={loading} size="lg" className="w-full">
                {loading ? (
                  <LoaderRing size={16} />
                ) : (
                  <>
                    Entrar <ArrowRight size={14} />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-xs text-[var(--color-text-muted)] mt-7 pt-5 border-t border-[var(--color-border)]">
              Ainda não é revendedor?{' '}
              <Link to="/cadastrar" className="text-[var(--color-primary)] hover:underline font-medium">
                Cadastre-se
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
