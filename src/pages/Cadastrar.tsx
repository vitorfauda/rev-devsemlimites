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

const step1Schema = z.object({
  name: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  whatsapp: z.string().refine((v) => v.replace(/\D/g, '').length >= 10, 'WhatsApp inválido'),
  cpf: z.string().refine((v) => validateCPF(v), 'CPF inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
  terms: z.boolean().refine((v) => v === true, { message: 'Aceite os termos' }),
}).refine((d) => d.password === d.confirmPassword, {
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
  useEffect(() => { setValue('whatsapp', maskPhone(whatsapp || '')); }, [whatsapp, setValue]);
  useEffect(() => { setValue('cpf', maskCPF(cpf || '')); }, [cpf, setValue]);

  // Se já tá logado e tem reseller, redireciona
  useEffect(() => {
    if (session && reseller?.entry_paid) nav('/dashboard');
    if (session && reseller && !reseller.entry_paid) setStep(2);
  }, [session, reseller, nav]);

  // Cleanup do polling
  useEffect(() => () => { if (pollIntervalId) clearInterval(pollIntervalId); }, [pollIntervalId]);

  const onStep1Submit = async (data: Step1Form) => {
    setCreating(true);
    try {
      // 1) signup no Supabase Auth
      const { data: signup, error: signupErr } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { name: data.name } },
      });
      if (signupErr) throw new Error(signupErr.message);
      const userId = signup.user?.id;
      if (!userId) throw new Error('Falha ao criar conta');

      // 2) insere em resellers
      const { error: insertErr } = await supabase.from('resellers').insert({
        user_id: userId,
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp.replace(/\D/g, ''),
        cpf: data.cpf.replace(/\D/g, ''),
      });
      if (insertErr && !insertErr.message.includes('duplicate')) throw new Error(insertErr.message);

      await refreshReseller();
      toast.success('Conta criada! Finalize o pagamento para ativar.');
      setStep(2);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const startPayment = async () => {
    if (!reseller) { toast.error('Recarregue a página'); return; }
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-reseller-payment', {
        body: { type: 'entry', reseller_id: reseller.id, payment_method: 'pix' },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || 'Falha ao criar PIX');
      setPix({ qr: data.qr_code_base64, text: data.qr_code_text, expires: data.expires_at });

      // Polling a cada 4s
      const id = window.setInterval(async () => {
        const { data: r } = await supabase.from('resellers').select('entry_paid').eq('id', reseller.id).single();
        if (r?.entry_paid) {
          clearInterval(id);
          toast.success('Pagamento confirmado! Bem-vindo ao time.');
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
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success('Copiado!'); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 relative">
      <div className="mesh-blob" style={{ width: 500, height: 500, top: 0, left: '30%', background: '#22c55e' }} />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2].map((n) => (
            <div key={n} className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= n ? 'bg-primary text-void shadow-lg shadow-primary/50' : 'bg-white/5 text-text-muted'}`}>
                {step > n ? <Check size={18} /> : n}
              </div>
              {n === 1 && <div className={`h-px w-12 transition-all ${step >= 2 ? 'bg-primary' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="holo-card holo-permanent p-8 sm:p-10">
            <h1 className="text-3xl font-display font-bold mb-2">Cadastro de revendedor</h1>
            <p className="text-text-muted mb-8 text-sm">Preencha seus dados para começar</p>

            <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-4">
              <Field label="Nome completo" icon={User} error={errors.name?.message}>
                <input {...register('name')} placeholder="João da Silva" className={`input-dsl pl-10 ${errors.name ? 'error' : ''}`} />
              </Field>
              <Field label="Email" icon={Mail} error={errors.email?.message}>
                <input {...register('email')} type="email" placeholder="seu@email.com" className={`input-dsl pl-10 ${errors.email ? 'error' : ''}`} />
              </Field>
              <Field label="WhatsApp" icon={Phone} error={errors.whatsapp?.message}>
                <input {...register('whatsapp')} placeholder="(27) 99999-9999" maxLength={15} className={`input-dsl pl-10 ${errors.whatsapp ? 'error' : ''}`} />
              </Field>
              <Field label="CPF" icon={FileText} error={errors.cpf?.message}>
                <input {...register('cpf')} placeholder="000.000.000-00" maxLength={14} className={`input-dsl pl-10 ${errors.cpf ? 'error' : ''}`} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Senha" icon={Lock} error={errors.password?.message}>
                  <input {...register('password')} type="password" placeholder="••••••••" className={`input-dsl pl-10 ${errors.password ? 'error' : ''}`} />
                </Field>
                <Field label="Confirmar senha" icon={Lock} error={errors.confirmPassword?.message}>
                  <input {...register('confirmPassword')} type="password" placeholder="••••••••" className={`input-dsl pl-10 ${errors.confirmPassword ? 'error' : ''}`} />
                </Field>
              </div>

              <label className="flex items-start gap-3 text-sm pt-2 cursor-pointer">
                <input {...register('terms')} type="checkbox" className="mt-1 w-4 h-4 accent-primary" />
                <span className="text-text-muted">Li e aceito os <a href="#" className="text-primary">termos de revenda</a></span>
              </label>
              {errors.terms && <div className="text-xs text-red-400">{errors.terms.message}</div>}

              <button type="submit" disabled={creating} className="cta-neon w-full flex items-center justify-center gap-2 mt-4">
                {creating ? <LoaderRing size={20} /> : <span className="relative z-10 flex items-center gap-2">Continuar para pagamento <ArrowRight size={18} /></span>}
              </button>
            </form>

            <div className="text-center text-sm text-text-muted mt-8">
              Já é revendedor? <Link to="/login" className="text-primary font-semibold">Entrar</Link>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="holo-card holo-permanent p-8 sm:p-10">
            <h1 className="text-3xl font-display font-bold mb-2">Pagamento de acesso</h1>
            <p className="text-text-muted mb-6 text-sm">Taxa única de ativação da conta</p>

            <div className="rounded-xl p-5 mb-6 bg-gradient-to-br from-primary/10 to-accent-cyan/5 border border-primary/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-muted text-sm">Acesso vitalício ao painel</span>
              </div>
              <div className="text-4xl font-display font-bold text-primary">{formatBRL(990)}</div>
              <div className="text-xs text-text-muted mt-2">Pagamento único. Sem mensalidade.</div>
            </div>

            {!pix && (
              <button onClick={startPayment} disabled={paying} className="cta-neon w-full flex items-center justify-center gap-2">
                {paying ? <LoaderRing size={20} /> : <span className="relative z-10 flex items-center gap-2"><QrCode size={18} /> Gerar PIX</span>}
              </button>
            )}

            {pix && (
              <div className="space-y-4">
                {pix.qr && (
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-xl">
                      <img src={`data:image/png;base64,${pix.qr}`} alt="QR Code PIX" className="w-56 h-56" />
                    </div>
                  </div>
                )}
                {pix.text && (
                  <div>
                    <label className="block text-sm text-text-muted mb-2">PIX Copia e Cola</label>
                    <div className="flex gap-2">
                      <input readOnly value={pix.text} className="input-dsl font-mono text-xs" />
                      <button onClick={handleCopyPix} className="cta-ghost !px-4 shrink-0">
                        {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-center gap-3 text-sm text-text-muted p-4 rounded-xl bg-white/5">
                  <LoaderRing size={16} />
                  Aguardando pagamento... (checa a cada 4s)
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, error, children }: { label: string; icon: any; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-text-muted mb-2">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim z-10" />
        {children}
      </div>
      {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
    </div>
  );
}
