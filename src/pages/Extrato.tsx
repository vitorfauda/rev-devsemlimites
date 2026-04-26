import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Wallet, ArrowDownToLine, Clock, CheckCircle2, XCircle, ArrowDownLeft, ArrowUpRight,
  ShieldCheck, RefreshCw, AlertTriangle, X, Lock, Download,
} from 'lucide-react';
import { LoaderRing } from '@/components/LoaderRing';
import { formatBRL, formatDateTime } from '@/lib/utils';
import { Button, Card, PageHeader, Section, Stat, inputClass } from '@/components/ui';

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

  useEffect(() => {
    load();
  }, []);

  if (loading)
    return (
      <div className="min-h-[60vh] grid place-items-center text-[var(--color-text-muted)]">
        <LoaderRing size={28} />
      </div>
    );

  const blockedByBankChange = balance?.can_withdraw_at && new Date(balance.can_withdraw_at) > new Date();
  const canWithdraw =
    !balance?.kyc_pending &&
    !blockedByBankChange &&
    (balance?.available_amount || 0) > (balance?.transfer_fee || 367);

  return (
    <Section>
      <PageHeader
        title="Extrato"
        description="Saldo, movimentações e saque para sua conta"
        actions={
          <>
            <Button onClick={load} variant="secondary" size="sm" disabled={refreshing}>
              <RefreshCw size={13} className={refreshing ? 'spin' : ''} /> Atualizar
            </Button>
            <Button onClick={() => setShowWithdrawModal(true)} size="sm" disabled={!canWithdraw}>
              <ArrowDownToLine size={13} /> Sacar saldo
            </Button>
          </>
        }
      />

      {balance?.kyc_pending && (
        <Card className="mb-6 p-5 border-amber-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium mb-0.5">Verificação KYC pendente</div>
              <p className="text-sm text-[var(--color-text-muted)]">
                Pra ver saldo e sacar, você precisa completar a verificação no Pagar.me primeiro.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Stat label="Saldo disponível" value={formatBRL(balance?.available_amount || 0)} icon={Wallet} />
        <Stat label="A receber" value={formatBRL(balance?.waiting_funds || 0)} icon={Clock} />
        <Stat label="Já transferido" value={formatBRL(balance?.transferred || 0)} icon={Download} />
      </div>

      {blockedByBankChange && (
        <Card className="mb-6 p-4 border-amber-500/30 text-sm text-amber-300 flex items-center gap-2">
          <Lock size={13} /> Saque bloqueado até {formatDateTime(balance!.can_withdraw_at!)}
        </Card>
      )}

      <Card className="mb-6 p-3 text-xs text-[var(--color-text-muted)] flex items-center gap-2">
        Taxa de saque{' '}
        <span className="text-[var(--color-text)] font-medium">
          {formatBRL(balance?.transfer_fee || 367)}
        </span>{' '}
        por transferência. Pagar.me processa em até 1 dia útil.
      </Card>

      <Card>
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="text-sm font-medium">Movimentações (últimos 30 dias)</div>
        </div>

        {movements.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-muted)]">
            <Wallet size={24} className="text-[var(--color-text-dim)] mx-auto mb-2" />
            <p className="text-sm">Nenhuma movimentação no período</p>
          </div>
        ) : (
          <div>
            {movements.map((m, i) => (
              <MovementRow key={m.id} mov={m} last={i === movements.length - 1} />
            ))}
          </div>
        )}
      </Card>

      {showWithdrawModal && balance && (
        <WithdrawModal
          balance={balance}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={() => {
            setShowWithdrawModal(false);
            load();
          }}
        />
      )}
    </Section>
  );
}

function MovementRow({ mov, last }: { mov: Movement; last: boolean }) {
  const isCredit = mov.amount_cents > 0;
  const Icon = mov.type === 'sale' ? ArrowDownLeft : mov.type === 'transfer' ? ArrowUpRight : mov.type === 'refund' ? XCircle : CheckCircle2;
  return (
    <div
      className={
        'flex items-center gap-3 p-4 hover:bg-[var(--color-surface-2)]/40 transition-colors ' +
        (!last ? 'border-b border-[var(--color-border)]' : '')
      }
    >
      <div
        className={
          'size-8 rounded-md grid place-items-center shrink-0 ' +
          (isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')
        }
      >
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{mov.description}</div>
        <div className="text-xs text-[var(--color-text-dim)]">
          {formatDateTime(mov.date)} · <span className="capitalize">{mov.status}</span>
        </div>
      </div>
      <div
        className={
          'text-right shrink-0 font-mono text-sm ' +
          (isCredit ? 'text-emerald-400' : 'text-[var(--color-text-muted)]')
        }
      >
        {isCredit ? '+' : '−'}
        {formatBRL(Math.abs(mov.amount_cents))}
      </div>
    </div>
  );
}

function WithdrawModal({ balance, onClose, onSuccess }: { balance: Balance; onClose: () => void; onSuccess: () => void }) {
  const [valueStr, setValueStr] = useState('');
  const [tfaCode, setTfaCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const valueCents = Math.round(parseFloat(valueStr.replace(/[^\d.,]/g, '').replace(',', '.')) * 100) || 0;
  const fee = balance.transfer_fee;
  const netCents = Math.max(0, valueCents - fee);
  const isValid =
    valueCents > fee && valueCents <= balance.available_amount && /^\d{6}$|^[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(tfaCode);

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
        if (data?.error === 'bank_change_cooldown')
          throw new Error('Saque bloqueado por mudança de banco recente (24h)');
        throw new Error(data?.message || data?.error || 'Falha no saque');
      }
      toast.success('Saque solicitado. Cai na conta em até 1 dia útil');
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || 'Erro');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <Card className="max-w-md w-full p-6" >
        <div onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ArrowDownToLine size={16} className="text-[var(--color-primary)]" />
            <h3 className="font-medium">Transferir saldo</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="rounded-md bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 p-3 mb-4 text-sm">
          Saldo disponível:{' '}
          <span className="text-[var(--color-primary)] font-medium">
            {formatBRL(balance.available_amount)}
          </span>
        </div>

        <label className="block">
          <div className="text-xs text-[var(--color-text-muted)] mb-1.5">Quanto quer transferir?</div>
          <div className="flex gap-2">
            <input
              value={valueStr}
              onChange={(e) => setValueStr(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              className={inputClass + ' flex-1'}
            />
            <Button
              type="button"
              onClick={() =>
                setValueStr(((balance.available_amount - balance.transfer_fee) / 100).toFixed(2).replace('.', ','))
              }
              variant="secondary"
              size="sm"
            >
              TUDO
            </Button>
          </div>
        </label>

        <div className="mt-3 rounded-md bg-[var(--color-surface-2)]/60 border border-[var(--color-border)] p-3 text-xs space-y-1.5">
          <Row label="Valor solicitado" value={formatBRL(valueCents)} />
          <Row label="Taxa Pagar.me" value={`−${formatBRL(fee)}`} dim />
          <div className="pt-1.5 mt-1.5 border-t border-[var(--color-border)]">
            <Row label="Você recebe" value={formatBRL(netCents)} bold />
          </div>
        </div>

        <label className="block mt-4">
          <div className="text-xs text-[var(--color-text-muted)] mb-1.5 flex items-center gap-1.5">
            <ShieldCheck size={12} /> Código 2FA (app ou backup)
          </div>
          <input
            value={tfaCode}
            onChange={(e) => setTfaCode(e.target.value.toUpperCase().replace(/[^0-9A-Z-]/g, '').slice(0, 11))}
            placeholder="000000"
            className={inputClass + ' text-center text-xl tracking-widest font-mono h-11'}
            autoComplete="one-time-code"
            inputMode="text"
          />
        </label>

        <Button onClick={submit} disabled={!isValid || submitting} size="lg" className="w-full mt-4">
          {submitting ? <LoaderRing size={16} /> : <Lock size={14} />}
          Confirmar saque de {formatBRL(valueCents)}
        </Button>

        <p className="text-[11px] text-[var(--color-text-dim)] mt-3 text-center">
          Cai na conta cadastrada em até 1 dia útil. Você recebe email e WhatsApp confirmando.
        </p>
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value, dim = false, bold = false }: { label: string; value: string; dim?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={dim ? 'text-[var(--color-text-dim)]' : 'text-[var(--color-text-muted)]'}>{label}</span>
      <span className={bold ? 'font-medium text-[var(--color-primary)]' : 'text-[var(--color-text)]'}>{value}</span>
    </div>
  );
}
