import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Banknote, Shield, Bell, ChevronRight, AlertTriangle, Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoaderRing } from '@/components/LoaderRing';
import { searchBanks, getBanksList } from '@/data/banks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Badge, Button, Card, PageHeader, Section, inputClass } from '@/components/ui';

type TabKey = 'recebimento' | 'seguranca' | 'notificacoes';

export default function Configuracoes() {
  const [tab, setTab] = useState<TabKey>('recebimento');

  return (
    <Section>
      <PageHeader title="Configurações" description="Gerencie sua conta de recebimento, segurança e notificações" />

      <div className="grid grid-cols-[200px_1fr] gap-8">
        <nav className="flex flex-col gap-1">
          {[
            { key: 'recebimento' as const, label: 'Recebimento', icon: Banknote },
            { key: 'seguranca' as const, label: 'Segurança', icon: Shield },
            { key: 'notificacoes' as const, label: 'Notificações', icon: Bell },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all ' +
                  (active
                    ? 'bg-[var(--color-surface-2)] text-[var(--color-text)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]/50')
                }
              >
                <Icon size={14} className={active ? 'text-[var(--color-primary)]' : ''} />
                {t.label}
              </button>
            );
          })}
        </nav>
        <div>
          {tab === 'recebimento' && <RecebimentoTab />}
          {tab === 'seguranca' && <SegurancaTab />}
          {tab === 'notificacoes' && <NotificacoesTab />}
        </div>
      </div>
    </Section>
  );
}

const bankSchema = z.object({
  bank: z.string().min(3, 'Selecione o banco'),
  branch_number: z.string().min(1, 'Agência obrigatória'),
  branch_check_digit: z.string().optional(),
  account_number: z.string().min(1, 'Conta obrigatória'),
  account_check_digit: z.string().min(1, 'Dígito obrigatório'),
  type: z.enum(['checking', 'savings', 'checking_conjunct', 'savings_conjunct']),
});
type BankForm = z.infer<typeof bankSchema>;

function RecebimentoTab() {
  const { reseller } = useAuth();
  const [showEditForm, setShowEditForm] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [showBankList, setShowBankList] = useState(false);
  const [tfaCode, setTfaCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BankForm>({
    resolver: zodResolver(bankSchema),
    defaultValues: { type: 'checking' },
  });

  const banks = useMemo(() => searchBanks(bankSearch).slice(0, 30), [bankSearch]);
  const selectedBankCode = watch('bank');
  const selectedBank = useMemo(() => getBanksList().find((b) => b.code === selectedBankCode), [selectedBankCode]);
  const bankChangedRecently =
    reseller?.bank_changed_at && new Date(reseller.bank_changed_at as any) > new Date(Date.now() - 24 * 3600000);

  const submit = async (data: BankForm) => {
    if (!/^\d{6}$|^[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(tfaCode)) {
      toast.error('Digite o código 2FA');
      return;
    }
    setSubmitting(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('update-reseller-bank', {
        body: { tfa_code: tfaCode, bank_account: data },
      });
      if (error) throw new Error(error.message);
      if (!result?.ok) {
        if (result?.error === 'tfa_invalid') throw new Error('Código 2FA inválido');
        throw new Error(result?.message || result?.error || 'Falha ao atualizar');
      }
      toast.success('Conta bancária atualizada. Saques bloqueados por 24h');
      setShowEditForm(false);
      setTfaCode('');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!reseller)
    return (
      <div className="flex justify-center py-10">
        <LoaderRing size={20} />
      </div>
    );

  if (!reseller.pagarme_recipient_id) {
    return (
      <Card className="p-8 text-center">
        <Banknote size={28} className="text-[var(--color-text-dim)] mx-auto mb-3" />
        <div className="font-medium mb-1">Conta de recebimento não configurada</div>
        <p className="text-sm text-[var(--color-text-muted)] max-w-sm mx-auto mb-5">
          Você ainda não fez o onboarding Pagar.me. Configure pra começar a receber comissões.
        </p>
        <Link to="/onboarding-pagarme">
          <Button size="sm">
            Configurar agora <ChevronRight size={13} />
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="text-sm font-medium mb-4 flex items-center gap-2">
          <Banknote size={14} /> Conta bancária Pagar.me
        </div>

        <div className="space-y-1.5 text-sm mb-4">
          <Row label="Recipient ID" value={reseller.pagarme_recipient_id?.substring(0, 24) + '…'} mono />
          <Row
            label="KYC"
            value={
              reseller.pagarme_kyc_status === 'approved'
                ? 'Aprovado'
                : reseller.pagarme_kyc_status === 'rejected'
                ? 'Reprovado'
                : reseller.pagarme_kyc_status === 'under_review'
                ? 'Em análise'
                : 'Pendente'
            }
          />
          <Row label="Slug venda" value={reseller.slug || '—'} mono />
        </div>

        {bankChangedRecently && (
          <div className="rounded-md bg-amber-500/5 border border-amber-500/20 p-3 text-xs text-amber-300 mb-4">
            Conta bancária atualizada recentemente — saques bloqueados por 24h
          </div>
        )}

        {!showEditForm ? (
          <Button onClick={() => setShowEditForm(true)} variant="secondary" size="sm">
            Alterar conta bancária <ChevronRight size={13} />
          </Button>
        ) : (
          <form onSubmit={handleSubmit(submit)} className="space-y-3 border-t border-[var(--color-border)] pt-4">
            <div className="rounded-md bg-amber-500/5 border border-amber-500/20 p-3 text-xs text-amber-300 flex gap-2">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <div>
                Mudar a conta bancária bloqueia saques por <strong>24h</strong> por segurança. Email
                e WhatsApp confirmam.
              </div>
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

            <div className="border-t border-[var(--color-border)] pt-3 mt-3">
              <Field label="Código 2FA pra confirmar">
                <input
                  value={tfaCode}
                  onChange={(e) =>
                    setTfaCode(e.target.value.toUpperCase().replace(/[^0-9A-Z-]/g, '').slice(0, 11))
                  }
                  placeholder="000000"
                  className={inputClass + ' text-center text-xl tracking-widest font-mono h-11'}
                  autoComplete="one-time-code"
                />
              </Field>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" onClick={() => setShowEditForm(false)} disabled={submitting} variant="secondary" className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? <LoaderRing size={14} /> : <Lock size={13} />}
                Confirmar mudança
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card className="p-5 text-xs text-[var(--color-text-muted)]">
        <div className="text-sm font-medium text-[var(--color-text)] mb-2">Sobre a conta de recebimento</div>
        <ul className="space-y-1.5 leading-relaxed">
          <li>• Onde caem os saques que você solicita no extrato</li>
          <li>• Precisa estar em nome do titular do CPF cadastrado</li>
          <li>• Pagar.me valida titular automaticamente — se errado, saque falha</li>
          <li>• Mudar a conta bloqueia saques por 24h (anti-fraude)</li>
        </ul>
      </Card>
    </div>
  );
}

function SegurancaTab() {
  return (
    <div className="space-y-4">
      <Link to="/seguranca">
        <Card className="p-5 hover:bg-[var(--color-surface-2)]/40 transition-colors">
          <div className="flex items-center gap-4">
            <div className="size-9 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] grid place-items-center shrink-0">
              <Shield size={15} className="text-[var(--color-primary)]" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Autenticação em 2 fatores (2FA)</div>
              <div className="text-xs text-[var(--color-text-dim)]">
                Configurar, desativar, ver códigos de backup
              </div>
            </div>
            <ChevronRight size={14} className="text-[var(--color-text-dim)]" />
          </div>
        </Card>
      </Link>
      <Card className="p-5 text-xs text-[var(--color-text-muted)]">
        <div className="text-sm font-medium text-[var(--color-text)] mb-2">Por que 2FA é importante?</div>
        <ul className="space-y-1.5 leading-relaxed">
          <li>• Mesmo se descobrirem sua senha, sem o código do app não entram</li>
          <li>• <strong className="text-[var(--color-text)]">Obrigatório</strong> pra solicitar saques e mudar conta bancária</li>
          <li>• Use Google Authenticator, Authy, 1Password ou Microsoft Authenticator</li>
        </ul>
      </Card>
    </div>
  );
}

function NotificacoesTab() {
  return (
    <Card className="p-6">
      <div className="text-sm font-medium mb-1">Notificações ativas</div>
      <div className="text-xs text-[var(--color-text-muted)] mb-5">Eventos que disparam alertas pra você</div>
      <div className="space-y-2.5">
        {[
          ['Nova venda confirmada', 'Email + WhatsApp'],
          ['Cliente cancelou assinatura', 'Email'],
          ['Cliente teve cobrança falhada', 'Email'],
          ['Saldo disponível pra saque', 'Email'],
          ['Saque transferido pra conta', 'Email + WhatsApp'],
          ['Mudou de tier', 'Email'],
          ['Top 1 do mês', 'Email + WhatsApp'],
          ['Bônus Lendário R$ 2.000', 'Email + WhatsApp'],
        ].map(([label, by]) => (
          <div
            key={label}
            className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0"
          >
            <span className="text-sm">{label}</span>
            <Badge>{by}</Badge>
          </div>
        ))}
      </div>
      <p className="text-xs text-[var(--color-text-dim)] mt-5">
        Em breve você poderá customizar canais (somente email, somente WhatsApp, etc).
      </p>
    </Card>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-[var(--color-border)] last:border-0">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <code className={(mono ? 'font-mono text-xs ' : '') + 'text-[var(--color-text)]'}>{value}</code>
    </div>
  );
}

function Field({ label, children, error }: { label: React.ReactNode; children: React.ReactNode; error?: string }) {
  return (
    <label className="block">
      <div className="text-xs text-[var(--color-text-muted)] mb-1.5">{label}</div>
      {children}
      {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
    </label>
  );
}
