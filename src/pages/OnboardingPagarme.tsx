import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Check, ChevronRight, ChevronLeft, ExternalLink, Search, Building, MapPin, Banknote, ShieldCheck, Copy, Loader2 } from 'lucide-react';
import { LoaderRing } from '@/components/LoaderRing';
import { copyToClipboard, maskCEP, maskCPF, maskPhone, validateCPF } from '@/lib/utils';
import { getBanksList, searchBanks, type Bank } from '@/data/banks';

function maskCNPJ(v: string): string {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function validateCNPJ(raw: string): boolean {
  const c = raw.replace(/\D/g, '');
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  // Algoritmo módulo 11 CNPJ
  const calc = (slice: string, weights: number[]) => {
    const sum = slice.split('').reduce((acc, d, i) => acc + parseInt(d) * weights[i], 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, ...w1];
  return calc(c.slice(0, 12), w1) === parseInt(c[12]) && calc(c.slice(0, 13), w2) === parseInt(c[13]);
}

// ─── Schemas ───────────────────────────────────────────────────────
const stepIdentitySchema = z.discriminatedUnion('entity_type', [
  // Pessoa Física
  z.object({
    entity_type: z.literal('individual'),
    name: z.string().min(5, 'Digite o nome completo'),
    document: z.string().refine(validateCPF, 'CPF inválido'),
    birthdate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Formato dd/mm/aaaa'),
    mother_name: z.string().min(3, 'Mínimo 3 caracteres'),
    professional_occupation: z.string().min(3, 'Mínimo 3 caracteres'),
  }),
  // Pessoa Jurídica
  z.object({
    entity_type: z.literal('company'),
    name: z.string().min(5, 'Razão social obrigatória'),
    trading_name: z.string().min(3, 'Nome fantasia obrigatório'),
    document: z.string().refine(validateCNPJ, 'CNPJ inválido'),
    founding_date: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Formato dd/mm/aaaa'),
    annual_revenue_cents: z.coerce.number().min(100000, 'Mínimo R$ 1.000'),
  }),
]);
type StepIdentityForm = z.infer<typeof stepIdentitySchema>;

const stepAddressSchema = z.object({
  zip_code: z.string().min(8, 'CEP inválido'),
  street: z.string().min(3),
  street_number: z.string().min(1),
  complementary: z.string().optional(),
  neighborhood: z.string().min(2),
  city: z.string().min(2),
  state: z.string().length(2, 'UF inválida'),
});
type StepAddressForm = z.infer<typeof stepAddressSchema>;

const stepBankSchema = z.object({
  bank: z.string().min(3, 'Selecione o banco'),
  branch_number: z.string().min(1, 'Agência obrigatória'),
  branch_check_digit: z.string().optional(),
  account_number: z.string().min(1, 'Conta obrigatória'),
  account_check_digit: z.string().min(1, 'Dígito obrigatório'),
  type: z.enum(['checking', 'savings', 'checking_conjunct', 'savings_conjunct']),
});
type StepBankForm = z.infer<typeof stepBankSchema>;

// ─── Componente principal ──────────────────────────────────────────
export default function OnboardingPagarme() {
  const nav = useNavigate();
  const { reseller, refreshReseller } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);

  // Estados acumulados das etapas
  const [identityData, setIdentityData] = useState<StepIdentityForm | null>(null);
  const [addressData, setAddressData] = useState<StepAddressForm | null>(null);
  const [bankData, setBankData] = useState<StepBankForm | null>(null);

  // Resultado final
  const [createResult, setCreateResult] = useState<null | {
    recipient_id: string;
    status: string;
    kyc_link: string | null;
    slug: string;
    sale_url: string;
  }>(null);

  // Redirect se já tem recipient OK
  useEffect(() => {
    if (!reseller) return;
    if (!reseller.entry_paid) {
      toast.error('Você precisa pagar a entrada antes de continuar.');
      nav('/cadastrar?step=payment');
      return;
    }
    if (reseller.pagarme_recipient_id && reseller.pagarme_kyc_status === 'approved') {
      nav('/dashboard');
    }
  }, [reseller, nav]);

  if (!reseller) return <div className="min-h-[60vh] grid place-items-center"><LoaderRing /></div>;

  // ─── Submit final ────────────────────────────────────────────────
  const submitAll = async () => {
    if (!identityData || !addressData || !bankData) return;
    setSubmitting(true);
    try {
      const phoneClean = (reseller.whatsapp || '').replace(/\D/g, '');
      const ddd = phoneClean.substring(0, 2);
      const number = phoneClean.substring(2);

      const isCompany = (identityData as any).entity_type === 'company';
      const documentClean = (identityData as any).document.replace(/\D/g, '');

      const body: any = {
        entity_type: (identityData as any).entity_type,
        name: (identityData as any).name,
        email: reseller.email,
        document: documentClean,
        phone_ddd: ddd,
        phone_number: number,
        monthly_income_cents: 500000, // R$ 5k default
        address: {
          ...addressData,
          zip_code: addressData.zip_code.replace(/\D/g, ''),
        },
        bank: bankData,
      };

      if (isCompany) {
        body.trading_name = (identityData as any).trading_name;
        body.founding_date = (identityData as any).founding_date;
        body.annual_revenue_cents = (identityData as any).annual_revenue_cents;
      } else {
        body.birthdate = (identityData as any).birthdate;
        body.mother_name = (identityData as any).mother_name;
        body.professional_occupation = (identityData as any).professional_occupation;
      }

      const { data, error } = await supabase.functions.invoke('create-pagarme-recipient', { body });
      if (error) throw new Error(error.message || 'Erro desconhecido');
      if (!data?.ok) throw new Error(data?.error || data?.details || 'Falha ao criar conta Pagar.me');

      setCreateResult({
        recipient_id: data.recipient_id,
        status: data.status,
        kyc_link: data.kyc_link,
        slug: data.slug,
        sale_url: data.sale_url,
      });
      await refreshReseller?.();
      setStep(4);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao criar conta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-16">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Configure sua conta de recebimento
        </h1>
        <p className="text-slate-400 mt-2">
          4 etapas rápidas pra ativar o Pagar.me e começar a receber suas comissões direto.
        </p>
      </header>

      {/* Stepper */}
      <Stepper current={step} />

      {/* Conteúdo da etapa */}
      <div className="mt-8 rounded-2xl border border-emerald-500/15 bg-slate-950/60 p-6 md:p-8">
        {step === 1 && (
          <StepIdentity
            initial={identityData}
            onNext={(d) => { setIdentityData(d); setStep(2); }}
            reseller={reseller}
          />
        )}
        {step === 2 && (
          <StepAddress
            initial={addressData}
            onBack={() => setStep(1)}
            onNext={(d) => { setAddressData(d); setStep(3); }}
          />
        )}
        {step === 3 && (
          <StepBank
            initial={bankData}
            reseller={reseller}
            onBack={() => setStep(2)}
            onNext={(d) => { setBankData(d); submitAll(); }}
            submitting={submitting}
          />
        )}
        {step === 4 && createResult && (
          <StepKyc result={createResult} onFinish={() => nav('/dashboard')} />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  STEPPER
// ═══════════════════════════════════════════════════════════════════
function Stepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  const steps = [
    { n: 1, label: 'Identidade', icon: Building },
    { n: 2, label: 'Endereço', icon: MapPin },
    { n: 3, label: 'Banco', icon: Banknote },
    { n: 4, label: 'Verificação', icon: ShieldCheck },
  ] as const;
  return (
    <div className="flex items-center justify-between">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const done = current > s.n;
        const active = current === s.n;
        return (
          <div key={s.n} className="flex items-center flex-1">
            <div className={`flex flex-col items-center ${i === 0 ? '' : 'flex-1'}`}>
              {i > 0 && (
                <div className={`absolute h-0.5 ${done ? 'bg-emerald-500' : 'bg-slate-800'}`} style={{ left: 0, right: 0 }} />
              )}
              <div
                className={`relative z-10 size-12 rounded-full grid place-items-center transition-all
                  ${active ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30' : ''}
                  ${done ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40' : ''}
                  ${!active && !done ? 'bg-slate-800 text-slate-500 border-2 border-slate-700' : ''}`}
              >
                {done ? <Check className="size-5" /> : <Icon className="size-5" />}
              </div>
              <span className={`mt-2 text-xs font-medium ${active || done ? 'text-emerald-400' : 'text-slate-500'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 -mt-6 bg-slate-800 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-emerald-500 transition-all"
                  style={{ width: current > s.n ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  STEP 1 — IDENTIDADE (PF ou PJ)
// ═══════════════════════════════════════════════════════════════════
function StepIdentity({ initial, onNext, reseller }: { initial: StepIdentityForm | null; onNext: (d: StepIdentityForm) => void; reseller: any }) {
  const [entityType, setEntityType] = useState<'individual' | 'company'>(
    (initial as any)?.entity_type || 'individual'
  );

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(stepIdentitySchema),
    defaultValues: initial || {
      entity_type: entityType,
      name: reseller.name || '',
      document: entityType === 'individual' ? (reseller.cpf || '') : '',
      professional_occupation: 'Vendedor',
      annual_revenue_cents: 100000,
    } as any,
  });

  // Trocar PF/PJ reseta campos específicos mas mantém comuns
  const switchType = (type: 'individual' | 'company') => {
    setEntityType(type);
    const current = watch();
    reset({
      entity_type: type,
      name: current.name || reseller.name || '',
      document: type === 'individual' ? (reseller.cpf || '') : '',
      professional_occupation: 'Vendedor',
      annual_revenue_cents: 100000,
    });
  };

  // Mascara documento conforme tipo
  const document = watch('document');
  useEffect(() => {
    if (!document) return;
    const masked = entityType === 'individual' ? maskCPF(document) : maskCNPJ(document);
    if (masked !== document) setValue('document', masked);
  }, [document, entityType, setValue]);

  // Mascara datas
  const birthdate = watch('birthdate');
  useEffect(() => {
    if (!birthdate) return;
    const d = birthdate.replace(/\D/g, '').slice(0, 8);
    let formatted = d;
    if (d.length >= 3) formatted = `${d.slice(0, 2)}/${d.slice(2, 4)}${d.length >= 5 ? '/' + d.slice(4, 8) : ''}`;
    if (formatted !== birthdate) setValue('birthdate', formatted);
  }, [birthdate, setValue]);

  const founding = watch('founding_date');
  useEffect(() => {
    if (!founding) return;
    const d = founding.replace(/\D/g, '').slice(0, 8);
    let formatted = d;
    if (d.length >= 3) formatted = `${d.slice(0, 2)}/${d.slice(2, 4)}${d.length >= 5 ? '/' + d.slice(4, 8) : ''}`;
    if (formatted !== founding) setValue('founding_date', formatted);
  }, [founding, setValue]);

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Building className="size-5 text-emerald-400" /> Identidade
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Você vai receber comissões como Pessoa Física ou Pessoa Jurídica?
        </p>
      </div>

      {/* Toggle PF/PJ */}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => switchType('individual')}
          className={`p-4 rounded-xl border-2 transition-all text-left ${entityType === 'individual'
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-white/10 bg-white/5 hover:border-emerald-500/30'}`}>
          <div className="text-2xl mb-1">👤</div>
          <div className="font-semibold">Pessoa Física</div>
          <div className="text-xs text-slate-400 mt-1">CPF · usar conta pessoal</div>
        </button>
        <button type="button" onClick={() => switchType('company')}
          className={`p-4 rounded-xl border-2 transition-all text-left ${entityType === 'company'
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-white/10 bg-white/5 hover:border-emerald-500/30'}`}>
          <div className="text-2xl mb-1">🏢</div>
          <div className="font-semibold">Pessoa Jurídica</div>
          <div className="text-xs text-slate-400 mt-1">CNPJ · MEI ou empresa</div>
        </button>
      </div>

      <input type="hidden" {...register('entity_type')} value={entityType} />

      {/* Read-only do cadastro */}
      <div className="rounded-lg bg-white/5 p-4 space-y-2">
        <ReadOnlyRow label="Email cadastrado" value={reseller.email} />
        <ReadOnlyRow label="WhatsApp" value={maskPhone(reseller.whatsapp)} />
      </div>

      {/* Campos comuns */}
      <Field label={entityType === 'individual' ? 'Nome completo' : 'Razão social'} error={errors.name?.message as string}>
        <input
          {...register('name')}
          className="input-dsl"
          placeholder={entityType === 'individual' ? 'Seu nome completo (igual no documento)' : 'Razão social conforme CNPJ'}
        />
      </Field>

      <Field label={entityType === 'individual' ? 'CPF' : 'CNPJ'} error={errors.document?.message as string}>
        <input
          {...register('document')}
          className="input-dsl"
          placeholder={entityType === 'individual' ? '000.000.000-00' : '00.000.000/0000-00'}
          maxLength={entityType === 'individual' ? 14 : 18}
        />
      </Field>

      {/* Campos específicos PF */}
      {entityType === 'individual' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Data de nascimento" error={errors.birthdate?.message as string}>
              <input {...register('birthdate')} placeholder="DD/MM/AAAA" className="input-dsl" maxLength={10} />
            </Field>
            <Field label="Profissão" error={errors.professional_occupation?.message as string}>
              <input {...register('professional_occupation')} className="input-dsl" />
            </Field>
          </div>
          <Field label="Nome da mãe" error={errors.mother_name?.message as string}>
            <input {...register('mother_name')} className="input-dsl" placeholder="Nome completo da sua mãe" />
          </Field>
        </>
      )}

      {/* Campos específicos PJ */}
      {entityType === 'company' && (
        <>
          <Field label="Nome fantasia" error={errors.trading_name?.message as string}>
            <input {...register('trading_name')} className="input-dsl" placeholder="Como sua empresa é conhecida" />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Data de fundação" error={errors.founding_date?.message as string}>
              <input {...register('founding_date')} placeholder="DD/MM/AAAA" className="input-dsl" maxLength={10} />
            </Field>
            <Field label="Faturamento anual estimado (R$)" error={errors.annual_revenue_cents?.message as string}>
              <input
                {...register('annual_revenue_cents', { valueAsNumber: true })}
                type="number"
                className="input-dsl"
                placeholder="60000"
              />
            </Field>
          </div>
        </>
      )}

      <Footer right={
        <button type="submit" className="cta-neon !py-2.5 !px-5 inline-flex items-center gap-2">
          Avançar <ChevronRight className="size-4" />
        </button>
      } />
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  STEP 2 — ENDEREÇO
// ═══════════════════════════════════════════════════════════════════
function StepAddress({ initial, onBack, onNext }: { initial: StepAddressForm | null; onBack: () => void; onNext: (d: StepAddressForm) => void }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<StepAddressForm>({
    resolver: zodResolver(stepAddressSchema),
    defaultValues: initial || {},
  });
  const cep = watch('zip_code');
  const [searching, setSearching] = useState(false);

  // Auto-fill ViaCEP
  useEffect(() => {
    const cleaned = (cep || '').replace(/\D/g, '');
    if (cleaned.length !== 8) return;
    setSearching(true);
    fetch(`https://viacep.com.br/ws/${cleaned}/json/`)
      .then((r) => r.json())
      .then((data) => {
        if (data.erro) {
          toast.error('CEP não encontrado');
          return;
        }
        setValue('street', data.logradouro || '');
        setValue('neighborhood', data.bairro || '');
        setValue('city', data.localidade || '');
        setValue('state', (data.uf || '').toUpperCase());
        toast.success('Endereço preenchido!');
      })
      .catch(() => toast.error('Falha ao buscar CEP'))
      .finally(() => setSearching(false));
  }, [cep, setValue]);

  // Mask CEP
  useEffect(() => {
    if (!cep) return;
    const masked = maskCEP(cep);
    if (masked !== cep) setValue('zip_code', masked);
  }, [cep, setValue]);

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MapPin className="size-5 text-emerald-400" /> Endereço
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Digita o CEP que a gente preenche o resto automaticamente.
        </p>
      </div>

      <Field label="CEP" error={errors.zip_code?.message}>
        <div className="relative">
          <input {...register('zip_code')} placeholder="00000-000" className="input pr-10" maxLength={9} />
          {searching ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-emerald-400" />
          ) : (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          )}
        </div>
      </Field>

      <Field label="Logradouro (Rua, Avenida...)" error={errors.street?.message}>
        <input {...register('street')} className="input-dsl" />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Número" error={errors.street_number?.message}>
          <input {...register('street_number')} className="input-dsl" />
        </Field>
        <div className="col-span-2">
          <Field label="Complemento (opcional)" error={errors.complementary?.message}>
            <input {...register('complementary')} className="input-dsl" placeholder="Apto, Sala..." />
          </Field>
        </div>
      </div>

      <Field label="Bairro" error={errors.neighborhood?.message}>
        <input {...register('neighborhood')} className="input-dsl" />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Field label="Cidade" error={errors.city?.message}>
            <input {...register('city')} className="input-dsl" />
          </Field>
        </div>
        <Field label="UF" error={errors.state?.message}>
          <input {...register('state')} className="input uppercase" maxLength={2} />
        </Field>
      </div>

      <Footer
        left={<button type="button" onClick={onBack} className="cta-ghost !py-2.5 !px-5 inline-flex items-center gap-2"><ChevronLeft className="size-4" /> Voltar</button>}
        right={<button type="submit" className="cta-neon !py-2.5 !px-5 inline-flex items-center gap-2">Avançar <ChevronRight className="size-4" /></button>}
      />
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  STEP 3 — BANCO
// ═══════════════════════════════════════════════════════════════════
function StepBank({ initial, reseller, onBack, onNext, submitting }: { initial: StepBankForm | null; reseller: any; onBack: () => void; onNext: (d: StepBankForm) => void; submitting: boolean }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<StepBankForm>({
    resolver: zodResolver(stepBankSchema),
    defaultValues: initial || { type: 'checking' },
  });
  const [bankSearch, setBankSearch] = useState('');
  const [showBankList, setShowBankList] = useState(false);
  const banks = useMemo(() => searchBanks(bankSearch).slice(0, 30), [bankSearch]);
  const selectedBankCode = watch('bank');
  const selectedBank = useMemo(() => getBanksList().find(b => b.code === selectedBankCode), [selectedBankCode]);

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Banknote className="size-5 text-emerald-400" /> Conta bancária
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Onde você quer receber os saques das suas comissões.
        </p>
      </div>

      <Field label="Banco" error={errors.bank?.message}>
        <div className="relative">
          <input
            value={selectedBank ? `${selectedBank.code} — ${selectedBank.name}` : bankSearch}
            onChange={(e) => { setBankSearch(e.target.value); setValue('bank', ''); setShowBankList(true); }}
            onFocus={() => setShowBankList(true)}
            placeholder="Digita o nome ou código do banco"
            className="input-dsl"
            autoComplete="off"
          />
          {showBankList && (
            <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-emerald-500/20 bg-slate-950 shadow-xl">
              {banks.map((b) => (
                <button
                  type="button"
                  key={b.code}
                  onClick={() => { setValue('bank', b.code); setBankSearch(''); setShowBankList(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-emerald-500/10 transition-colors flex items-center gap-3"
                >
                  <span className="text-emerald-400 font-mono text-sm">{b.code}</span>
                  <span className="text-slate-200">{b.name}</span>
                </button>
              ))}
              {banks.length === 0 && (
                <div className="p-4 text-slate-500 text-center text-sm">Nenhum banco encontrado</div>
              )}
            </div>
          )}
        </div>
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Field label="Agência" error={errors.branch_number?.message}>
            <input {...register('branch_number')} className="input-dsl" placeholder="0000" />
          </Field>
        </div>
        <Field label="Dígito (opc.)" error={errors.branch_check_digit?.message}>
          <input {...register('branch_check_digit')} className="input-dsl" />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Field label="Conta" error={errors.account_number?.message}>
            <input {...register('account_number')} className="input-dsl" placeholder="00000000" />
          </Field>
        </div>
        <Field label="Dígito" error={errors.account_check_digit?.message}>
          <input {...register('account_check_digit')} className="input-dsl" />
        </Field>
      </div>

      <Field label="Tipo de conta" error={errors.type?.message}>
        <select {...register('type')} className="input-dsl">
          <option value="checking">Conta corrente</option>
          <option value="savings">Conta poupança</option>
          <option value="checking_conjunct">Conta corrente conjunta</option>
          <option value="savings_conjunct">Conta poupança conjunta</option>
        </select>
      </Field>

      <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-4 text-sm text-slate-300">
        <p className="font-medium text-emerald-300 mb-1">📌 Como funciona o saque</p>
        <p>O dinheiro das suas vendas fica acumulado no Pagar.me. Quando quiser, você solicita transferência pra essa conta. Taxa de R$ 3,67 por saque.</p>
      </div>

      <Footer
        left={<button type="button" onClick={onBack} disabled={submitting} className="cta-ghost !py-2.5 !px-5 inline-flex items-center gap-2"><ChevronLeft className="size-4" /> Voltar</button>}
        right={
          <button type="submit" disabled={submitting} className="cta-neon !py-2.5 !px-5 inline-flex items-center gap-2">
            {submitting ? <><Loader2 className="size-4 animate-spin" /> Criando conta...</> : <>Criar conta Pagar.me <ChevronRight className="size-4" /></>}
          </button>
        }
      />
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  STEP 4 — KYC
// ═══════════════════════════════════════════════════════════════════
function StepKyc({ result, onFinish }: { result: { recipient_id: string; status: string; kyc_link: string | null; slug: string; sale_url: string }; onFinish: () => void }) {
  const isApproved = result.status === 'active';

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="size-20 rounded-full bg-emerald-500/15 grid place-items-center">
          <ShieldCheck className="size-10 text-emerald-400" />
        </div>
      </div>

      {isApproved ? (
        <>
          <div>
            <h2 className="text-2xl font-bold">Conta criada e aprovada! 🎉</h2>
            <p className="text-slate-400 mt-2">Já pode começar a vender. Esse é seu link único:</p>
          </div>

          <SaleLinkBox url={result.sale_url} />

          <button onClick={onFinish} className="btn-primary mx-auto">
            Ir pro dashboard <ChevronRight className="size-4" />
          </button>
        </>
      ) : (
        <>
          <div>
            <h2 className="text-2xl font-bold">Falta uma última etapa</h2>
            <p className="text-slate-400 mt-2 max-w-md mx-auto">
              Pra liberar seu link de venda, complete a verificação de identidade no Pagar.me.<br />
              Leva uns 2 minutos, e a aprovação sai em 1-3 dias úteis.
            </p>
          </div>

          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 text-left max-w-md mx-auto">
            <p className="font-medium text-emerald-300 mb-3">Você vai precisar de:</p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex gap-2"><Check className="size-4 text-emerald-400 mt-0.5 shrink-0" /> Selfie segurando seu documento</li>
              <li className="flex gap-2"><Check className="size-4 text-emerald-400 mt-0.5 shrink-0" /> Foto do RG ou CNH (frente e verso)</li>
              <li className="flex gap-2"><Check className="size-4 text-emerald-400 mt-0.5 shrink-0" /> Comprovante de endereço recente</li>
            </ul>
          </div>

          {result.kyc_link ? (
            <a href={result.kyc_link} target="_blank" rel="noreferrer" className="btn-primary inline-flex">
              Iniciar verificação <ExternalLink className="size-4" />
            </a>
          ) : (
            <p className="text-amber-400 text-sm">Link de verificação será gerado em alguns minutos. Recarregue a página.</p>
          )}

          <p className="text-xs text-slate-500">
            Te enviamos por email um link único pra completar quando quiser.<br />
            Quando aprovar, você recebe outro email confirmando.
          </p>

          <SaleLinkBox url={result.sale_url} locked />

          <button onClick={onFinish} className="btn-ghost mx-auto">
            Voltar pro dashboard
          </button>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  Helpers UI
// ═══════════════════════════════════════════════════════════════════
function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-slate-200 font-medium">{value}</span>
    </div>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="block text-sm text-slate-300 mb-1.5 font-medium">{label}</span>
      {children}
      {error && <span className="block mt-1 text-xs text-rose-400">{error}</span>}
    </label>
  );
}

function Footer({ left, right }: { left?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

function SaleLinkBox({ url, locked = false }: { url: string; locked?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await copyToClipboard(url);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={`max-w-md mx-auto rounded-xl border p-4 ${locked ? 'bg-slate-900/40 border-slate-800 opacity-60' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
      <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${locked ? 'text-slate-500' : 'text-emerald-400'}`}>
        {locked ? 'Link bloqueado até KYC aprovar' : 'Seu link de venda'}
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-sm font-mono text-slate-100 break-all">{url}</code>
        <button onClick={copy} disabled={locked} className="shrink-0 size-8 rounded-md bg-slate-800 hover:bg-slate-700 grid place-items-center disabled:opacity-50">
          {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4 text-slate-300" />}
        </button>
      </div>
    </div>
  );
}
