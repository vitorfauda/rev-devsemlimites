import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Wallet, Banknote, ArrowDownToLine, Clock, CheckCircle2, XCircle,
  TrendingDown, Loader2, ShieldCheck, RefreshCw, AlertTriangle, X, Lock,
} from 'lucide-react';
import { LoaderRing } from '@/components/LoaderRing';
import { formatBRL, formatDateTime } from '@/lib/utils';

interface Balance {
  available_amount: number;
  waiting_funds: number;
  transferred: number;
  transfer_fee: number;
  can_withdraw_at: string | null;
  kyc_pending?: boolean;
}

interface Movement {
  id: string;
  type: 'sale' | 'transfer' | 'refund' | 'fee';
  description: string;
  amount_cents: number;
  status: string;
  date: string;
  customer_name?: string;
  plan_code?: string;
  payment_method?: string;
}

export default function Extrato() {
  const { reseller } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const [{ data: balData }, { data: movData }] = await Promise.all([
        supabase.functions.invoke('get-reseller-balance'),
        supabase.functions.invoke('get-reseller-movements'),
      ]);
      if (balData?.ok) setBalance(balData);
      if (movData?.ok) setMovements(movData.movements || []);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar extrato');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="min-h-[60vh] grid place-items-center"><LoaderRing /></div>;

  const blockedByBankChange = balance?.can_withdraw_at && new Date(balance.can_withdraw_at) > new Date();

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-3">
              <Wallet className="size-7 text-primary" /> Extrato
            </h1>
            <p className="text-text-muted text-sm mt-1">Saldo, movimentações e saque pra sua conta.</p>
          </div>
          <button onClick={load} disabled={refreshing} className="cta-ghost !py-2 !px-3 text-sm inline-flex items-center gap-2">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Atualizar
          </button>
        </div>

        {/* KYC pendente */}
        {balance?.kyc_pending && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 flex items-start gap-4">
            <AlertTriangle className="size-6 text-amber-300 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-100">Verificação KYC pendente</h3>
              <p className="text-sm text-amber-200/80 mt-1">
                Pra ver saldo e sacar, você precisa completar a verificação no Pagar.me primeiro.
              </p>
            </div>
          </div>
        )}

        {/* Cards de saldo */}
        <div className="grid sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <BalanceCard
            icon={Wallet}
            iconColor="text-emerald-400"
            label="Saldo disponível"
            amount={balance?.available_amount || 0}
            highlight
            footer={
              blockedByBankChange ? (
                <span className="text-amber-400 text-xs">🔒 Liberado em {formatDateTime(balance!.can_withdraw_at!)}</span>
              ) : balance?.available_amount && balance.available_amount > balance.transfer_fee ? (
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="cta-neon !py-2 text-sm w-full inline-flex items-center justify-center gap-2"
                >
                  <ArrowDownToLine size={14} /> Transferir pra conta
                </button>
              ) : (
                <span className="text-text-dim text-xs">Sem valor pra transferir</span>
              )
            }
          />
          <BalanceCard
            icon={Clock}
            iconColor="text-blue-400"
            label="A receber"
            amount={balance?.waiting_funds || 0}
            footer={<span className="text-text-dim text-xs">Recebimento conforme prazo Pagar.me</span>}
          />
          <BalanceCard
            icon={TrendingDown}
            iconColor="text-text-muted"
            label="Já transferido"
            amount={balance?.transferred || 0}
            footer={<span className="text-text-dim text-xs">Total histórico de saques</span>}
          />
        </div>

        {/* Taxa info */}
        <div className="mb-6 rounded-xl bg-white/5 border border-white/5 p-3 text-xs text-text-muted flex items-center gap-2">
          ℹ️ Taxa de saque: <span className="text-text-primary font-semibold">{formatBRL(balance?.transfer_fee || 367)}</span> por transferência. Pagar.me processa em até 1 dia útil.
        </div>

        {/* Movimentações */}
        <div className="holo-card p-5 sm:p-6">
          <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
            <Banknote size={18} className="text-primary" /> Movimentações (últimos 30 dias)
          </h2>

          {movements.length === 0 ? (
            <div className="text-center py-12">
              <Wallet size={32} className="text-text-dim mx-auto mb-2" />
              <p className="text-text-muted text-sm">Nenhuma movimentação no período.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {movements.map(m => (
                <MovementRow key={m.id} mov={m} />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {showWithdrawModal && balance && (
        <WithdrawModal
          balance={balance}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={() => { setShowWithdrawModal(false); load(); }}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
function BalanceCard({ icon: Icon, iconColor, label, amount, footer, highlight = false }: {
  icon: any; iconColor: string; label: string; amount: number; footer?: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 ${highlight ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-2 border-emerald-500/30' : 'bg-white/5 border border-white/5'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`size-4 ${iconColor}`} />
        <span className="text-text-muted text-xs uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className={`text-3xl font-bold mb-3 ${highlight ? 'text-emerald-400' : 'text-text-primary'}`}>
        {formatBRL(amount)}
      </div>
      <div>{footer}</div>
    </div>
  );
}

function MovementRow({ mov }: { mov: Movement }) {
  const isCredit = mov.amount_cents > 0;
  const Icon = mov.type === 'sale' ? CheckCircle2 : mov.type === 'transfer' ? ArrowDownToLine : mov.type === 'refund' ? XCircle : Banknote;
  const iconColor = mov.type === 'sale' ? 'text-emerald-400' : mov.type === 'transfer' ? 'text-blue-400' : mov.type === 'refund' ? 'text-red-400' : 'text-text-muted';

  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-b-0">
      <div className={`size-10 rounded-xl bg-white/5 grid place-items-center shrink-0`}>
        <Icon className={`size-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">{mov.description}</div>
        <div className="text-xs text-text-dim">{formatDateTime(mov.date)} · <span className="capitalize">{mov.status}</span></div>
      </div>
      <div className={`text-right shrink-0 ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
        <div className="font-semibold text-sm">
          {isCredit ? '+' : '−'}{formatBRL(Math.abs(mov.amount_cents))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
function WithdrawModal({ balance, onClose, onSuccess }: { balance: Balance; onClose: () => void; onSuccess: () => void }) {
  const [valueStr, setValueStr] = useState('');
  const [tfaCode, setTfaCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const valueCents = Math.round(parseFloat(valueStr.replace(/[^\d.,]/g, '').replace(',', '.')) * 100) || 0;
  const fee = balance.transfer_fee;
  const netCents = Math.max(0, valueCents - fee);
  const isValid = valueCents > fee && valueCents <= balance.available_amount && /^\d{6}$|^[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(tfaCode);

  const submit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-pagarme-transfer', {
        body: { amount_cents: valueCents, tfa_code: tfaCode },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) {
        if (data?.error === 'tfa_invalid') throw new Error('Código 2FA inválido');
        if (data?.error === 'insufficient_funds') throw new Error('Saldo insuficiente');
        if (data?.error === 'tfa_not_configured') throw new Error('Configure 2FA antes de sacar');
        if (data?.error === 'bank_change_cooldown') throw new Error('Saque bloqueado por mudança de banco recente (24h)');
        throw new Error(data?.message || data?.error || 'Falha no saque');
      }
      toast.success('Saque solicitado! Cai na conta em até 1 dia útil.');
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || 'Erro');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="holo-card holo-permanent max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-xl flex items-center gap-2">
            <ArrowDownToLine size={20} className="text-primary" /> Transferir saldo
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>

        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/30 p-3 mb-4 text-sm">
          Saldo disponível: <strong className="text-emerald-400">{formatBRL(balance.available_amount)}</strong>
        </div>

        <label className="block">
          <span className="block text-sm text-text-muted mb-1.5">Quanto quer transferir?</span>
          <div className="flex gap-2">
            <input
              value={valueStr}
              onChange={e => setValueStr(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              className="input-dsl flex-1"
            />
            <button
              type="button"
              onClick={() => setValueStr(((balance.available_amount - balance.transfer_fee) / 100).toFixed(2).replace('.', ','))}
              className="cta-ghost !py-2 !px-3 text-xs"
            >
              TUDO
            </button>
          </div>
        </label>

        <div className="mt-3 rounded-lg bg-white/5 p-3 text-xs space-y-1">
          <Row label="Valor solicitado" value={formatBRL(valueCents)} />
          <Row label="Taxa Pagar.me" value={`-${formatBRL(fee)}`} dim />
          <div className="pt-1.5 mt-1.5 border-t border-white/10">
            <Row label="Você recebe" value={formatBRL(netCents)} bold />
          </div>
        </div>

        <label className="block mt-4">
          <span className="block text-sm text-text-muted mb-1.5 flex items-center gap-2">
            <ShieldCheck size={14} className="text-primary" /> Código 2FA (app autenticador ou backup)
          </span>
          <input
            value={tfaCode}
            onChange={e => setTfaCode(e.target.value.toUpperCase().replace(/[^0-9A-Z-]/g, '').slice(0, 11))}
            placeholder="000000"
            className="input-dsl text-center text-xl tracking-widest font-mono"
            autoComplete="one-time-code"
            inputMode="text"
          />
        </label>

        <button
          onClick={submit}
          disabled={!isValid || submitting}
          className="cta-neon w-full mt-4 inline-flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Lock size={14} />}
          Confirmar saque de {formatBRL(valueCents)}
        </button>

        <p className="text-[11px] text-text-dim mt-3 text-center">
          Cai na conta cadastrada em até 1 dia útil. Você recebe email + WhatsApp confirmando.
        </p>
      </motion.div>
    </div>
  );
}

function Row({ label, value, dim = false, bold = false }: { label: string; value: string; dim?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-text-${dim ? 'dim' : 'muted'}`}>{label}:</span>
      <span className={`${bold ? 'font-bold text-emerald-400 text-base' : 'text-text-primary'}`}>{value}</span>
    </div>
  );
}
