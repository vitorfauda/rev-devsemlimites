import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Settings, Banknote, Shield, Bell, ChevronRight, Loader2, Search, AlertTriangle, Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoaderRing } from '@/components/LoaderRing';
import { searchBanks, getBanksList } from '@/data/banks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

type TabKey = 'recebimento' | 'seguranca' | 'notificacoes';

export default function Configuracoes() {
  const [tab, setTab] = useState<TabKey>('recebimento');

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'recebimento', label: 'Recebimento', icon: Banknote },
    { key: 'seguranca', label: 'Segurança', icon: Shield },
    { key: 'notificacoes', label: 'Notificações', icon: Bell },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold mb-2 flex items-center gap-3">
          <Settings className="size-7 text-primary" /> Configurações
        </h1>
        <p className="text-text-muted text-sm mb-6">Gerencie sua conta de recebimento, segurança e notificações.</p>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.key
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'recebimento' && <RecebimentoTab />}
        {tab === 'seguranca' && <SegurancaTab />}
        {tab === 'notificacoes' && <NotificacoesTab />}
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: RECEBIMENTO — editar conta bancária Pagar.me
// ═══════════════════════════════════════════════════════════════

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
  const selectedBank = useMemo(() => getBanksList().find(b => b.code === selectedBankCode), [selectedBankCode]);

  // Status: bank_changed_at recente?
  const bankChangedRecently = reseller?.bank_changed_at && new Date(reseller.bank_changed_at as any) > new Date(Date.now() - 24 * 3600000);

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
      toast.success('Conta bancária atualizada! Saques bloqueados por 24h.');
      setShowEditForm(false);
      setTfaCode('');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!reseller) return <LoaderRing />;

  // Se não fez onboarding ainda
  if (!reseller.pagarme_recipient_id) {
    return (
      <div className="holo-card p-6 text-center">
        <Banknote size={32} className="text-text-muted mx-auto mb-3" />
        <h3 className="font-semibold mb-2">Conta de recebimento não configurada</h3>
        <p className="text-text-muted text-sm mb-4">
          Você ainda não fez o onboarding Pagar.me. Configure pra começar a receber comissões.
        </p>
        <Link to="/onboarding-pagarme" className="cta-neon !py-2 inline-flex items-center gap-2 text-sm">
          Configurar agora <ChevronRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="holo-card p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Banknote size={18} className="text-primary" /> Conta bancária Pagar.me
        </h3>

        <div className="space-y-2 text-sm mb-4">
          <Row label="Recipient ID" value={reseller.pagarme_recipient_id?.substring(0, 24) + '…'} mono />
          <Row label="KYC" value={
            reseller.pagarme_kyc_status === 'approved' ? '✅ Aprovado' :
            reseller.pagarme_kyc_status === 'rejected' ? '❌ Reprovado' :
            reseller.pagarme_kyc_status === 'under_review' ? '⏳ Em análise' : '⏸ Pendente'
          } />
          <Row label="Slug venda" value={reseller.slug || '—'} mono />
        </div>

        {bankChangedRecently && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-200 mb-4">
            ⚠️ Conta bancária atualizada recentemente — saques bloqueados por 24h por segurança.
          </div>
        )}

        {!showEditForm ? (
          <button
            onClick={() => setShowEditForm(true)}
            className="cta-ghost !py-2 text-sm inline-flex items-center gap-2"
          >
            Alterar conta bancária <ChevronRight size={14} />
          </button>
        ) : (
          <form onSubmit={handleSubmit(submit)} className="space-y-3 border-t border-white/5 pt-4">
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-200 flex gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <div>
                <strong>Atenção:</strong> mudar a conta bancária bloqueia saques por <strong>24h</strong> por segurança.
                Email + WhatsApp confirmam a mudança.
              </div>
            </div>

            {/* Banco */}
            <Field label="Banco" error={errors.bank?.message}>
              <div className="relative">
                <input
                  value={selectedBank ? `${selectedBank.code} — ${selectedBank.name}` : bankSearch}
                  onChange={(e) => { setBankSearch(e.target.value); setValue('bank', ''); setShowBankList(true); }}
                  onFocus={() => setShowBankList(true)}
                  placeholder="Buscar banco por nome ou código"
                  className="input-dsl"
                  autoComplete="off"
                />
                {showBankList && (
                  <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-emerald-500/20 bg-slate-950 shadow-xl">
                    {banks.map(b => (
                      <button
                        type="button"
                        key={b.code}
                        onClick={() => { setValue('bank', b.code); setBankSearch(''); setShowBankList(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-emerald-500/10 flex items-center gap-3"
                      >
                        <span className="text-emerald-400 font-mono text-sm">{b.code}</span>
                        <span className="text-slate-200">{b.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field label="Agência" error={errors.branch_number?.message}>
                  <input {...register('branch_number')} className="input-dsl" placeholder="0000" />
                </Field>
              </div>
              <Field label="Dígito ag." error={errors.branch_check_digit?.message}>
                <input {...register('branch_check_digit')} className="input-dsl" />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
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

            <div className="border-t border-white/5 pt-3 mt-3">
              <Field label={<><Shield className="inline size-4 text-primary mr-1" /> Código 2FA pra confirmar</>}>
                <input
                  value={tfaCode}
                  onChange={e => setTfaCode(e.target.value.toUpperCase().replace(/[^0-9A-Z-]/g, '').slice(0, 11))}
                  placeholder="000000"
                  className="input-dsl text-center text-xl tracking-widest font-mono"
                  autoComplete="one-time-code"
                />
              </Field>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                disabled={submitting}
                className="cta-ghost !py-2 text-sm flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="cta-neon !py-2 text-sm flex-1 inline-flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Lock size={14} />}
                Confirmar mudança
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="holo-card p-5 text-sm text-text-muted">
        <h4 className="font-semibold text-text-primary mb-2">📖 Sobre a conta de recebimento</h4>
        <ul className="space-y-1.5 text-xs">
          <li>• Onde caem os saques que você solicita no extrato</li>
          <li>• Pode estar em nome do titular do CPF/CNPJ cadastrado</li>
          <li>• Pagar.me valida titular automaticamente — se errado, saque falha</li>
          <li>• Mudar a conta bloqueia saques por 24h (anti-fraude)</li>
        </ul>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: SEGURANÇA — atalho pra /seguranca
// ═══════════════════════════════════════════════════════════════
function SegurancaTab() {
  return (
    <div className="space-y-4">
      <Link to="/seguranca" className="block holo-card p-5 hover:border-primary/30 transition-all">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-xl bg-primary/10 grid place-items-center">
            <Shield className="size-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Autenticação em 2 fatores (2FA)</div>
            <div className="text-xs text-text-muted">Configurar, desativar, ver códigos de backup</div>
          </div>
          <ChevronRight size={18} className="text-text-muted" />
        </div>
      </Link>
      <div className="holo-card p-5 text-sm text-text-muted">
        <h4 className="font-semibold text-text-primary mb-2">🔒 Por que 2FA é importante?</h4>
        <ul className="space-y-1.5 text-xs">
          <li>• Mesmo se alguém descobrir sua senha, sem o código do app não consegue entrar</li>
          <li>• <strong>Obrigatório</strong> pra solicitar saques e mudar conta bancária</li>
          <li>• Use Google Authenticator, Authy, 1Password ou Microsoft Authenticator</li>
        </ul>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: NOTIFICAÇÕES
// ═══════════════════════════════════════════════════════════════
function NotificacoesTab() {
  return (
    <div className="space-y-4">
      <div className="holo-card p-5">
        <h3 className="font-semibold mb-3">Notificações ativas</h3>
        <div className="space-y-3">
          <NotifItem label="Nova venda confirmada" by="email + WhatsApp" />
          <NotifItem label="Cliente cancelou assinatura" by="email" />
          <NotifItem label="Cliente teve cobrança falhada" by="email" />
          <NotifItem label="Saldo disponível pra saque" by="email" />
          <NotifItem label="Saque transferido pra conta" by="email + WhatsApp" />
          <NotifItem label="Mudou de tier" by="email" />
          <NotifItem label="Top 1 do mês 🏆" by="email + WhatsApp" />
          <NotifItem label="Bônus Lendário R$ 2.000 🎉" by="email + WhatsApp" />
        </div>
        <p className="text-xs text-text-dim mt-4">
          Em breve você poderá customizar canais (somente email, somente WhatsApp, etc).
        </p>
      </div>
    </div>
  );
}

// Helpers
function NotifItem({ label, by }: { label: string; by: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-sm">{label}</span>
      <span className="text-xs text-text-muted">{by}</span>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
      <span className="text-text-muted">{label}</span>
      <code className={`${mono ? 'font-mono text-xs' : ''} text-text-primary`}>{value}</code>
    </div>
  );
}

function Field({ label, children, error }: { label: React.ReactNode; children: React.ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="block text-sm text-text-muted mb-1.5 font-medium">{label}</span>
      {children}
      {error && <span className="block mt-1 text-xs text-rose-400">{error}</span>}
    </label>
  );
}
