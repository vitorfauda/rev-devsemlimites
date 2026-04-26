import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Check, ChevronRight, ChevronLeft, ExternalLink, Search, Building, MapPin, Banknote, ShieldCheck, Copy,
} from 'lucide-react';
import { LoaderRing } from '@/components/LoaderRing';
import { copyToClipboard, maskCEP, maskCPF, maskPhone, validateCPF } from '@/lib/utils';
import { getBanksList, searchBanks } from '@/data/banks';
import { Button, Card, inputClass } from '@/components/ui';

function maskCNPJ(v: string): string {
  return v
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function validateCNPJ(raw: string): boolean {
  const c = raw.replace(/\D/g, '');
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const calc = (slice: string, weights: number[]) => {
    const sum = slice.split('').reduce((acc, d, i) => acc + parseInt(d) * weights[i], 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, ...w1];
  return calc(c.slice(0, 12), w1) === parseInt(c[12]) && calc(c.slice(0, 13), w2) === parseInt(c[13]);
}

const stepIdentitySchema = z.discriminatedUnion('entity_type', [
  z.object({
    entity_type: z.literal('individual'),
    name: z.string().min(5, 'Digite o nome completo'),
    document: z.string().refine(validateCPF, 'CPF inválido'),
    birthdate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Formato dd/mm/aaaa'),
    mother_name: z.string().min(3, 'Mínimo 3 caracteres'),
    professional_occupation: z.string().min(3, 'Mínimo 3 caracteres'),
  }),
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

export default function OnboardingPagarme() {
  const nav = useNavigate();
  const { reseller, refreshReseller } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);

  const [identityData, setIdentityData] = useState<StepIdentityForm | null>(null);
  const [addressData, setAddressData] = useState<StepAddressForm | null>(null);
  const [bankData, setBankData] = useState<StepBankForm | null>(null);
  const [createResult, setCreateResult] = useState<null | {
    recipient_id: string;
    status: string;
    kyc_link: string | null;
    slug: string;
    sale_url: string;
  }>(null);

  useEffect(() => {
    if (!reseller) return;
    if (!reseller.entry_paid) {
      toast.error('Você precisa pagar a entrada antes');
      nav('/cadastrar?step=payment');
      return;
    }
    if (reseller.pagarme_recipient_id && reseller.pagarme_kyc_status === 'approved') {
      nav('/dashboard');
    }
  }, [reseller, nav]);

  if (!reseller)
    return (
      <div className="min-h-[60vh] grid place-items-center text-[var(--color-text-muted)]">
        <LoaderRing size={28} />
      </div>
    );

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
        monthly_income_cents: 500000,
        address: { ...addressData, zip_code: addressData.zip_code.replace(/\D/g, '') },
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
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Configure sua conta de recebimento</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          4 etapas pra ativar o Pagar.me e começar a receber comissões.
        </p>
      </div>

      <Stepper current={step} />

      <Card className="mt-8 p-8">
        {step === 1 && (
          <StepIdentity
            initial={identityData}
            onNext={(d) => {
              setIdentityData(d);
              setStep(2);
            }}
            reseller={reseller}
          />
        )}
        {step === 2 && (
          <StepAddress
            initial={addressData}
            onBack={() => setStep(1)}
            onNext={(d) => {
              setAddressData(d);
              setStep(3);
            }}
          />
        )}
        {step === 3 && (
          <StepBank
            initial={bankData}
            onBack={() => setStep(2)}
            onNext={(d) => {
              setBankData(d);
              submitAll();
            }}
            submitting={submitting}
          />
        )}
        {step === 4 && createResult && <StepKyc result={createResult} onFinish={() => nav('/dashboard')} />}
      </Card>
    </div>
  );
}

function Stepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  const steps = [
    { n: 1, label: 'Identidade', icon: Building },
    { n: 2, label: 'Endereço', icon: MapPin },
    { n: 3, label: 'Banco', icon: Banknote },
    { n: 4, label: 'Verificação', icon: ShieldCheck },
  ] as const;
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const done = current > s.n;
        const active = current === s.n;
        return (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={
                  'size-9 rounded-md grid place-items-center border ' +
                  (active
                    ? 'bg-[var(--color-primary)] text-black border-transparent'
                    : done
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/30'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-dim)] border-[var(--color-border)]')
                }
              >
                {done ? <Check size={14} /> : <Icon size={14} />}
              </div>
              <span
                className={
                  'mt-1.5 text-[10px] uppercase tracking-widest ' +
                  (active || done ? 'text-[var(--color-text)]' : 'text-[var(--color-text-dim)]')
                }
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px mx-2 -mt-4 bg-[var(--color-border)] relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[var(--color-primary)] transition-all"
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

function StepIdentity({
  initial,
  onNext,
  reseller,
}: {
  initial: StepIdentityForm | null;
  onNext: (d: StepIdentityForm) => void;
  reseller: any;
}) {
  const [entityType, setEntityType] = useState<'individual' | 'company'>(
    (initial as any)?.entity_type || 'individual',
  );

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(stepIdentitySchema),
    defaultValues:
      initial ||
      ({
        entity_type: entityType,
        name: reseller.name || '',
        document: entityType === 'individual' ? reseller.cpf || '' : '',
        professional_occupation: 'Vendedor',
        annual_revenue_cents: 100000,
      } as any),
  });

  const switchType = (type: 'individual' | 'company') => {
    setEntityType(type);
    const current = watch();
    reset({
      entity_type: type,
      name: current.name || reseller.name || '',
      document: type === 'individual' ? reseller.cpf || '' : '',
      professional_occupation: 'Vendedor',
      annual_revenue_cents: 100000,
    });
  };

  const document = watch('document');
  useEffect(() => {
    if (!document) return;
    const masked = entityType === 'individual' ? maskCPF(document) : maskCNPJ(document);
    if (masked !== document) setValue('document', masked);
  }, [document, entityType, setValue]);

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
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Building size={15} className="text-[var(--color-primary)]" /> Identidade
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Você vai receber comissões como Pessoa Física ou Pessoa Jurídica?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => switchType('individual')}
          className={
            'p-4 rounded-md border text-left transition-all ' +
            (entityType === 'individual'
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
              : 'border-[var(--color-border)] bg-[var(--color-surface-2)]/50 hover:border-[var(--color-border-hover)]')
          }
        >
          <div className="text-sm font-medium">Pessoa Física</div>
          <div className="text-xs text-[var(--color-text-dim)] mt-0.5">CPF · conta pessoal</div>
        </button>
        <button
          type="button"
          onClick={() => switchType('company')}
          className={
            'p-4 rounded-md border text-left transition-all ' +
            (entityType === 'company'
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
              : 'border-[var(--color-border)] bg-[var(--color-surface-2)]/50 hover:border-[var(--color-border-hover)]')
          }
        >
          <div className="text-sm font-medium">Pessoa Jurídica</div>
          <div className="text-xs text-[var(--color-text-dim)] mt-0.5">CNPJ · MEI ou empresa</div>
        </button>
      </div>

      <input type="hidden" {...register('entity_type')} value={entityType} />

      <div className="rounded-md bg-[var(--color-surface-2)]/40 border border-[var(--color-border)] p-3 space-y-1.5 text-sm">
        <Row label="Email" value={reseller.email} />
        <Row label="WhatsApp" value={maskPhone(reseller.whatsapp)} />
      </div>

      <Field label={entityType === 'individual' ? 'Nome completo' : 'Razão social'} error={errors.name?.message as string}>
        <input {...register('name')} className={inputClass} placeholder={entityType === 'individual' ? 'Igual no documento' : 'Conforme CNPJ'} />
      </Field>

      <Field label={entityType === 'individual' ? 'CPF' : 'CNPJ'} error={errors.document?.message as string}>
        <input
          {...register('document')}
          className={inputClass}
          placeholder={entityType === 'individual' ? '000.000.000-00' : '00.000.000/0000-00'}
          maxLength={entityType === 'individual' ? 14 : 18}
        />
      </Field>

      {entityType === 'individual' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Data de nascimento" error={errors.birthdate?.message as string}>
              <input {...register('birthdate')} placeholder="DD/MM/AAAA" className={inputClass} maxLength={10} />
            </Field>
            <Field label="Profissão" error={errors.professional_occupation?.message as string}>
              <input {...register('professional_occupation')} className={inputClass} />
            </Field>
          </div>
          <Field label="Nome da mãe" error={errors.mother_name?.message as string}>
            <input {...register('mother_name')} className={inputClass} placeholder="Nome completo" />
          </Field>
        </>
      )}

      {entityType === 'company' && (
        <>
          <Field label="Nome fantasia" error={errors.trading_name?.message as string}>
            <input {...register('trading_name')} className={inputClass} placeholder="Como é conhecida" />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Data de fundação" error={errors.founding_date?.message as string}>
              <input {...register('founding_date')} placeholder="DD/MM/AAAA" className={inputClass} maxLength={10} />
            </Field>
            <Field label="Faturamento anual estimado (R$)" error={errors.annual_revenue_cents?.message as string}>
              <input {...register('annual_revenue_cents', { valueAsNumber: true })} type="number" className={inputClass} placeholder="60000" />
            </Field>
          </div>
        </>
      )}

      <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
        <Button type="submit">
          Avançar <ChevronRight size={14} />
        </Button>
      </div>
    </form>
  );
}

function StepAddress({ initial, onBack, onNext }: { initial: StepAddressForm | null; onBack: () => void; onNext: (d: StepAddressForm) => void }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<StepAddressForm>({
    resolver: zodResolver(stepAddressSchema),
    defaultValues: initial || {},
  });
  const cep = watch('zip_code');
  const [searching, setSearching] = useState(false);

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
        toast.success('Endereço preenchido');
      })
      .catch(() => toast.error('Falha ao buscar CEP'))
      .finally(() => setSearching(false));
  }, [cep, setValue]);

  useEffect(() => {
    if (!cep) return;
    const masked = maskCEP(cep);
    if (masked !== cep) setValue('zip_code', masked);
  }, [cep, setValue]);

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <h2 className="text-lg font-medium flex items-center gap-2">
          <MapPin size={15} className="text-[var(--color-primary)]" /> Endereço
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Digite o CEP que preenchemos o resto.
        </p>
      </div>

      <Field label="CEP" error={errors.zip_code?.message}>
        <div className="relative">
          <input {...register('zip_code')} placeholder="00000-000" className={inputClass + ' pr-10'} maxLength={9} />
          {searching ? (
            <LoaderRing size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" />
          ) : (
            <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" />
          )}
        </div>
      </Field>

      <Field label="Rua / Avenida" error={errors.street?.message}>
        <input {...register('street')} className={inputClass} />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Número" error={errors.street_number?.message}>
          <input {...register('street_number')} className={inputClass} />
        </Field>
        <div className="col-span-2">
          <Field label="Complemento" error={errors.complementary?.message}>
            <input {...register('complementary')} className={inputClass} placeholder="Apto, sala…" />
          </Field>
        </div>
      </div>

      <Field label="Bairro" error={errors.neighborhood?.message}>
        <input {...register('neighborhood')} className={inputClass} />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Field label="Cidade" error={errors.city?.message}>
            <input {...register('city')} className={inputClass} />
          </Field>
        </div>
        <Field label="UF" error={errors.state?.message}>
          <input {...register('state')} className={inputClass + ' uppercase'} maxLength={2} />
        </Field>
      </div>

      <div className="flex justify-between pt-4 border-t border-[var(--color-border)]">
        <Button type="button" onClick={onBack} variant="secondary">
          <ChevronLeft size={14} /> Voltar
        </Button>
        <Button type="submit">
          Avançar <ChevronRight size={14} />
        </Button>
      </div>
    </form>
  );
}

function StepBank({ initial, onBack, onNext, submitting }: { initial: StepBankForm | null; onBack: () => void; onNext: (d: StepBankForm) => void; submitting: boolean }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<StepBankForm>({
    resolver: zodResolver(stepBankSchema),
    defaultValues: initial || { type: 'checking' },
  });
  const [bankSearch, setBankSearch] = useState('');
  const [showBankList, setShowBankList] = useState(false);
  const banks = useMemo(() => searchBanks(bankSearch).slice(0, 30), [bankSearch]);
  const selectedBankCode = watch('bank');
  const selectedBank = useMemo(() => getBanksList().find((b) => b.code === selectedBankCode), [selectedBankCode]);

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Banknote size={15} className="text-[var(--color-primary)]" /> Conta bancária
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Onde você quer receber os saques das suas comissões.
        </p>
      </div>

      <Field label="Banco" error={errors.bank?.message}>
        <div className="relative">
          <input
            value={selectedBank ? `${selectedBank.code} — ${selectedBank.name}` : bankSearch}
            onChange={(e) => {
              setBankSearch(e.target.value);
              setValue('bank', '');
              setShowBankList(true);
            }}
            onFocus={() => setShowBankList(true)}
            placeholder="Buscar banco por nome ou código"
            className={inputClass}
            autoComplete="off"
          />
          {showBankList && (
            <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
              {banks.map((b) => (
                <button
                  type="button"
                  key={b.code}
                  onClick={() => {
                    setValue('bank', b.code);
                    setBankSearch('');
                    setShowBankList(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--color-surface-2)] flex items-center gap-3 text-sm"
                >
                  <span className="text-[var(--color-primary)] font-mono">{b.code}</span>
                  <span>{b.name}</span>
                </button>
              ))}
              {banks.length === 0 && (
                <div className="p-4 text-sm text-[var(--color-text-dim)] text-center">Nenhum banco encontrado</div>
              )}
            </div>
          )}
        </div>
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Field label="Agência" error={errors.branch_number?.message}>
            <input {...register('branch_number')} className={inputClass} placeholder="0000" />
          </Field>
        </div>
        <Field label="Dígito ag." error={errors.branch_check_digit?.message}>
          <input {...register('branch_check_digit')} className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Field label="Conta" error={errors.account_number?.message}>
            <input {...register('account_number')} className={inputClass} placeholder="00000000" />
          </Field>
        </div>
        <Field label="Dígito" error={errors.account_check_digit?.message}>
          <input {...register('account_check_digit')} className={inputClass} />
        </Field>
      </div>

      <Field label="Tipo de conta" error={errors.type?.message}>
        <select {...register('type')} className={inputClass}>
          <option value="checking">Conta corrente</option>
          <option value="savings">Conta poupança</option>
          <option value="checking_conjunct">Conta corrente conjunta</option>
          <option value="savings_conjunct">Conta poupança conjunta</option>
        </select>
      </Field>

      <div className="rounded-md bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 p-4 text-sm">
        <div className="font-medium text-[var(--color-text)] mb-1">Como funciona o saque</div>
        <p className="text-[var(--color-text-muted)]">
          O dinheiro fica acumulado no Pagar.me. Quando quiser, você solicita transferência pra essa
          conta. Taxa de R$ 3,67 por saque.
        </p>
      </div>

      <div className="flex justify-between pt-4 border-t border-[var(--color-border)]">
        <Button type="button" onClick={onBack} disabled={submitting} variant="secondary">
          <ChevronLeft size={14} /> Voltar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <LoaderRing size={14} /> Criando…
            </>
          ) : (
            <>
              Criar conta Pagar.me <ChevronRight size={14} />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function StepKyc({ result, onFinish }: { result: { recipient_id: string; status: string; kyc_link: string | null; slug: string; sale_url: string }; onFinish: () => void }) {
  const isApproved = result.status === 'active';

  return (
    <div className="space-y-6 text-center">
      <div className="size-12 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 grid place-items-center mx-auto">
        <ShieldCheck size={22} className="text-[var(--color-primary)]" />
      </div>

      {isApproved ? (
        <>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Conta criada e aprovada</h2>
            <p className="text-[var(--color-text-muted)] mt-2">Já pode começar a vender. Esse é seu link único:</p>
          </div>
          <SaleLinkBox url={result.sale_url} />
          <Button onClick={onFinish}>
            Ir pro dashboard <ChevronRight size={14} />
          </Button>
        </>
      ) : (
        <>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Falta uma última etapa</h2>
            <p className="text-[var(--color-text-muted)] mt-2 max-w-md mx-auto">
              Pra liberar seu link, complete a verificação de identidade no Pagar.me. Leva ~2
              minutos, aprovação em 1-3 dias úteis.
            </p>
          </div>

          <Card className="p-5 text-left max-w-md mx-auto">
            <div className="text-sm font-medium mb-3">Você vai precisar de</div>
            <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <li className="flex gap-2">
                <Check size={13} className="text-[var(--color-primary)] mt-0.5 shrink-0" /> Selfie segurando seu documento
              </li>
              <li className="flex gap-2">
                <Check size={13} className="text-[var(--color-primary)] mt-0.5 shrink-0" /> Foto do RG ou CNH (frente e verso)
              </li>
              <li className="flex gap-2">
                <Check size={13} className="text-[var(--color-primary)] mt-0.5 shrink-0" /> Comprovante de endereço recente
              </li>
            </ul>
          </Card>

          {result.kyc_link ? (
            <a href={result.kyc_link} target="_blank" rel="noreferrer" className="inline-block">
              <Button>
                Iniciar verificação <ExternalLink size={14} />
              </Button>
            </a>
          ) : (
            <p className="text-amber-400 text-sm">Link de verificação será gerado em alguns minutos</p>
          )}

          <SaleLinkBox url={result.sale_url} locked />

          <Button onClick={onFinish} variant="secondary">
            Voltar pro dashboard
          </Button>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-[var(--color-border)] last:border-0">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="text-[var(--color-text)] font-medium">{value}</span>
    </div>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label className="block">
      <div className="text-xs text-[var(--color-text-muted)] mb-1.5">{label}</div>
      {children}
      {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
    </label>
  );
}

function SaleLinkBox({ url, locked = false }: { url: string; locked?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await copyToClipboard(url);
    setCopied(true);
    toast.success('Link copiado');
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div
      className={
        'max-w-md mx-auto rounded-md border p-4 ' +
        (locked
          ? 'border-[var(--color-border)] bg-[var(--color-surface-2)]/40 opacity-60'
          : 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5')
      }
    >
      <div
        className={
          'text-[10px] uppercase tracking-widest mb-2 ' +
          (locked ? 'text-[var(--color-text-dim)]' : 'text-[var(--color-primary)]')
        }
      >
        {locked ? 'Link bloqueado até KYC aprovar' : 'Seu link de venda'}
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-sm font-mono break-all">{url}</code>
        <button
          onClick={copy}
          disabled={locked}
          className="shrink-0 size-7 rounded-md bg-[var(--color-surface-2)] hover:bg-white/10 grid place-items-center disabled:opacity-50"
        >
          {copied ? <Check size={12} className="text-[var(--color-primary)]" /> : <Copy size={12} />}
        </button>
      </div>
    </div>
  );
}
