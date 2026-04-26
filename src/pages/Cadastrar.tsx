import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ArrowRight, Check, Copy, QrCode, User, Mail, Phone, Lock, FileText } from 'lucide-react';
import { LoaderRing } from '@/components/LoaderRing';
import { copyToClipboard, formatBRL, maskCPF, maskPhone, validateCPF } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, inputClass } from '@/components/ui';

const step1Schema = z
  .object({
    name: z.string().min(3, 'Nome muito curto'),
    email: z.string().email('Email inválido'),
    whatsapp: z.string().refine((v) => v.replace(/\D/g, '').length >= 10, 'WhatsApp inválido'),
    cpf: z.string().refine((v) => validateCPF(v), 'CPF inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v === true, { message: 'Aceite os termos' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  });
type Step1Form = z.infer<typeof step1Schema>;

export default function Cadastrar() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { session, reseller, refreshReseller } = useAuth();
  const [step, setStep] = useState<1 | 2>(params.get('step') === 'payment' ? 2 : 1);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [pix, setPix] = useState<{ qr: string | null; text: string | null; expires: string | null } | null>(null);
  const [pollIntervalId, setPollIntervalId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: { whatsapp: '', cpf: '' },
  });

  const whatsapp = watch('whatsapp');
  const cpf = watch('cpf');
  useEffect(() => {
    setValue('whatsapp', maskPhone(whatsapp || ''));
  }, [whatsapp, setValue]);
  useEffect(() => {
    setValue('cpf', maskCPF(cpf || ''));
  }, [cpf, setValue]);

  useEffect(() => {
    if (session && reseller?.entry_paid) nav('/dashboard');
    if (session && reseller && !reseller.entry_paid) setStep(2);
  }, [session, reseller, nav]);

  useEffect(
    () => () => {
      if (pollIntervalId) clearInterval(pollIntervalId);
    },
    [pollIntervalId],
  );

  const onStep1Submit = async (data: Step1Form) => {
    setCreating(true);
    try {
      const { data: signup, error: signupErr } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { name: data.name } },
      });
      if (signupErr) throw new Error(signupErr.message);
      const userId = signup.user?.id;
      if (!userId) throw new Error('Falha ao criar conta');

      if (!signup.session) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (signInErr) throw new Error('Conta criada, mas falha ao logar: ' + signInErr.message);
      }

      const { error: insertErr } = await supabase.from('resellers').insert({
        user_id: userId,
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp.replace(/\D/g, ''),
        cpf: data.cpf.replace(/\D/g, ''),
      });
      if (insertErr && !insertErr.message.includes('duplicate')) throw new Error(insertErr.message);

      await refreshReseller();
      toast.success('Conta criada. Finalize o pagamento para ativar');
      setStep(2);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const startPayment = async () => {
    if (!reseller) {
      toast.error('Recarregue a página');
      return;
    }
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-reseller-payment', {
        body: { type: 'entry', reseller_id: reseller.id, payment_method: 'pix' },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || 'Falha ao criar PIX');
      setPix({ qr: data.qr_code_base64, text: data.qr_code_text, expires: data.expires_at });

      const id = window.setInterval(async () => {
        const { data: r } = await supabase.from('resellers').select('entry_paid').eq('id', reseller.id).single();
        if (r?.entry_paid) {
          clearInterval(id);
          toast.success('Pagamento confirmado. Bem-vindo ao time');
          await refreshReseller();
          nav('/dashboard');
        }
      }, 4000);
      setPollIntervalId(id);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPaying(false);
    }
  };

  const handleCopyPix = async () => {
    if (!pix?.text) return;
    const ok = await copyToClipboard(pix.text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success('Copiado');
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2].map((n) => (
            <div key={n} className="flex items-center gap-3">
              <div
                className={
                  'size-8 rounded-md flex items-center justify-center text-sm font-medium transition-all border ' +
                  (step >= n
                    ? 'bg-[var(--color-primary)] text-black border-transparent'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]')
                }
              >
                {step > n ? <Check size={14} /> : n}
              </div>
              {n === 1 && (
                <div
                  className={
                    'h-px w-12 transition-all ' +
                    (step >= 2 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]')
                  }
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card className="p-8">
            <h1 className="text-2xl font-semibold tracking-tight">Cadastro de revendedor</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-7">Preencha seus dados para começar</p>

            <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-4">
              <Field label="Nome completo" icon={User} error={errors.name?.message}>
                <input {...register('name')} placeholder="João da Silva" className={inputClass + ' pl-10'} />
              </Field>
              <Field label="Email" icon={Mail} error={errors.email?.message}>
                <input {...register('email')} type="email" placeholder="seu@email.com" className={inputClass + ' pl-10'} />
              </Field>
              <Field label="WhatsApp" icon={Phone} error={errors.whatsapp?.message}>
                <input
                  {...register('whatsapp')}
                  placeholder="(27) 99999-9999"
                  maxLength={15}
                  className={inputClass + ' pl-10'}
                />
              </Field>
              <Field label="CPF" icon={FileText} error={errors.cpf?.message}>
                <input
                  {...register('cpf')}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={inputClass + ' pl-10'}
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Senha" icon={Lock} error={errors.password?.message}>
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    className={inputClass + ' pl-10'}
                  />
                </Field>
                <Field label="Confirmar senha" icon={Lock} error={errors.confirmPassword?.message}>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    placeholder="••••••••"
                    className={inputClass + ' pl-10'}
                  />
                </Field>
              </div>

              <label className="flex items-start gap-2.5 text-sm cursor-pointer pt-1">
                <input
                  {...register('terms')}
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 accent-[var(--color-primary)]"
                />
                <span className="text-[var(--color-text-muted)]">
                  Li e aceito os{' '}
                  <Link to="/termos" className="text-[var(--color-primary)] hover:underline">
                    termos de revenda
                  </Link>
                </span>
              </label>
              {errors.terms && <div className="text-xs text-red-400">{errors.terms.message}</div>}

              <Button type="submit" disabled={creating} size="lg" className="w-full mt-2">
                {creating ? (
                  <LoaderRing size={16} />
                ) : (
                  <>
                    Continuar para pagamento <ArrowRight size={14} />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-xs text-[var(--color-text-muted)] mt-7 pt-5 border-t border-[var(--color-border)]">
              Já é revendedor?{' '}
              <Link to="/login" className="text-[var(--color-primary)] hover:underline font-medium">
                Entrar
              </Link>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-8">
            <h1 className="text-2xl font-semibold tracking-tight">Pagamento de acesso</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-6">Taxa única de ativação da conta</p>

            <div className="rounded-md bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 p-5 mb-6">
              <div className="text-sm text-[var(--color-text-muted)]">Acesso vitalício ao painel</div>
              <div className="text-3xl font-semibold tracking-tight text-[var(--color-primary)] mt-1">
                {formatBRL(990)}
              </div>
              <div className="text-xs text-[var(--color-text-dim)] mt-2">Pagamento único · Sem mensalidade</div>
            </div>

            {!pix && (
              <Button onClick={startPayment} disabled={paying} size="lg" className="w-full">
                {paying ? <LoaderRing size={16} /> : (
                  <>
                    <QrCode size={14} /> Gerar PIX
                  </>
                )}
              </Button>
            )}

            {pix && (
              <div className="space-y-4">
                {pix.qr && (
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-lg">
                      <img src={`data:image/png;base64,${pix.qr}`} alt="QR PIX" className="w-56 h-56" />
                    </div>
                  </div>
                )}
                {pix.text && (
                  <div>
                    <div className="text-xs text-[var(--color-text-muted)] mb-1.5">PIX copia-e-cola</div>
                    <div className="flex gap-2">
                      <input readOnly value={pix.text} className={inputClass + ' font-mono text-xs'} />
                      <Button onClick={handleCopyPix} variant="secondary" className="shrink-0">
                        {copied ? <Check size={14} className="text-[var(--color-primary)]" /> : <Copy size={14} />}
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 text-sm p-3 rounded-md bg-[var(--color-surface-2)]/60 border border-[var(--color-border)] text-[var(--color-text-muted)]">
                  <LoaderRing size={14} className="text-[var(--color-primary)]" />
                  Aguardando pagamento (checa a cada 4s)
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, error, children }: { label: string; icon: any; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-[var(--color-text-muted)] mb-1.5">{label}</label>
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] z-10" />
        {children}
      </div>
      {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
    </div>
  );
}
