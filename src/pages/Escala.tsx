import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import {
  TrendingUp, Trophy, Target, Users, DollarSign, Crown, Medal,
  Sparkles, Calculator, Copy, Check, Gift, Lock,
} from 'lucide-react';
import { LoaderRing } from '@/components/LoaderRing';
import { formatBRL, copyToClipboard } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge, Button, Card, PageHeader, Section, Stat as UIStat, inputClass } from '@/components/ui';

interface Tier {
  name: string;
  emoji: string;
  min: number;
  max: number | null;
  percent: number;
  display_order: number;
}

interface Metrics {
  tier: Tier & { commission_percent: number; is_override: boolean };
  next_tier: (Tier & { missing: number; extra_commission_percent: number }) | null;
  active_customers: number;
  mrr_bruto_cents: number;
  mrr_commission_cents: number;
  total_sales_30d: number;
  total_revenue_30d_cents: number;
  ticket_medio_cents: number;
  projection_12m_customers: number;
  projection_12m_mrr_cents: number;
  lendario_bonus_pending: boolean;
  lendario_bonus_cents: number;
}

interface TopReseller {
  position: number;
  name: string;
  sales_in_month: number;
  revenue_cents: number;
  active_customers: number;
  medal: string | null;
}

const ALL_TIERS: Tier[] = [
  { name: 'bronze', emoji: '🥉', min: 0, max: 9, percent: 60, display_order: 1 },
  { name: 'prata', emoji: '🥈', min: 10, max: 24, percent: 62.5, display_order: 2 },
  { name: 'ouro', emoji: '🥇', min: 25, max: 49, percent: 65, display_order: 3 },
  { name: 'diamante', emoji: '💎', min: 50, max: 99, percent: 67.5, display_order: 4 },
  { name: 'lendario', emoji: '👑', min: 100, max: null, percent: 70, display_order: 5 },
];

const TIER_LABEL: Record<string, string> = {
  bronze: 'Bronze', prata: 'Prata', ouro: 'Ouro', diamante: 'Diamante', lendario: 'Lendário',
};

export default function Escala() {
  const { reseller } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [top, setTop] = useState<TopReseller[]>([]);
  const [goalAmount, setGoalAmount] = useState<string>('5000');
  const [copied, setCopied] = useState(false);

  const load = async () => {
    try {
      const [{ data: m }, { data: t }] = await Promise.all([
        supabase.functions.invoke('get-reseller-metrics'),
        supabase.functions.invoke('get-top-resellers'),
      ]);
      if (m?.ok) setMetrics(m);
      if (t?.ok) setTop(t.top || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading || !metrics)
    return (
      <div className="min-h-[60vh] grid place-items-center text-[var(--color-text-muted)]">
        <LoaderRing size={28} />
      </div>
    );

  const saleUrl = reseller?.slug ? `https://pay.devsemlimites.site/c/${reseller.slug}` : null;
  const copyLink = async () => {
    if (!saleUrl) return;
    await copyToClipboard(saleUrl);
    setCopied(true);
    toast.success('Link copiado');
    setTimeout(() => setCopied(false), 1500);
  };

  const goalCents = (parseInt(goalAmount.replace(/\D/g, '')) || 0) * 100;
  const avgRevenuePerCustomer =
    metrics.active_customers > 0 ? Math.round(metrics.mrr_commission_cents / metrics.active_customers) : 6300;
  const customersNeeded = goalCents > 0 && avgRevenuePerCustomer > 0 ? Math.ceil(goalCents / avgRevenuePerCustomer) : 0;
  const customersToAdd = Math.max(0, customersNeeded - metrics.active_customers);

  const tierProgress = metrics.next_tier
    ? Math.round(((metrics.active_customers - metrics.tier.min) / (metrics.next_tier.min - metrics.tier.min)) * 100)
    : 100;

  return (
    <Section>
      <PageHeader
        title="Plano de escala"
        description="Quanto mais clientes ativos, maior sua comissão"
      />

      {/* Hero tier */}
      <Card className="p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/8 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={14} className="text-[var(--color-primary)]" />
            <span className="text-xs uppercase tracking-widest text-[var(--color-text-dim)]">Tier atual</span>
          </div>
          <div className="flex items-baseline gap-3 mb-6 flex-wrap">
            <span className="text-3xl font-semibold tracking-tight">{TIER_LABEL[metrics.tier.name]}</span>
            <span className="text-sm text-[var(--color-text-muted)]">
              {metrics.tier.commission_percent}% por venda
            </span>
            {metrics.tier.is_override && <Badge tone="info">Override admin</Badge>}
          </div>

          {metrics.next_tier ? (
            <>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-[var(--color-text-muted)]">
                  Próximo {TIER_LABEL[metrics.next_tier.name]} ({metrics.next_tier.percent}%)
                </span>
                <span className="text-[var(--color-primary)] font-medium">
                  faltam {metrics.next_tier.missing}
                </span>
              </div>
              <div className="h-2 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                  style={{ width: `${Math.min(100, tierProgress)}%` }}
                />
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-3">
                Subir pra {TIER_LABEL[metrics.next_tier.name]} dá{' '}
                <span className="text-[var(--color-primary)] font-medium">
                  +{metrics.next_tier.extra_commission_percent.toFixed(1)}%
                </span>{' '}
                sobre TODOS os seus clientes.
              </p>
            </>
          ) : (
            <div className="rounded-md bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/30 p-3 flex items-center gap-3">
              <Crown size={16} className="text-[var(--color-primary)]" />
              <p className="text-sm text-[var(--color-primary)]">
                Você está no topo. 70% — máximo possível.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <UIStat label="MRR (sua parte)" value={formatBRL(metrics.mrr_commission_cents)} icon={DollarSign} />
        <UIStat label="Vendas 30d" value={String(metrics.total_sales_30d)} icon={Target} />
        <UIStat label="Ticket médio" value={formatBRL(metrics.ticket_medio_cents)} icon={Sparkles} />
        <UIStat label="Receita 30d" value={formatBRL(metrics.total_revenue_30d_cents)} icon={TrendingUp} />
      </div>

      {/* Bonus pendente */}
      {metrics.lendario_bonus_pending && (
        <Card className="mb-6 p-5 border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5">
          <div className="flex items-center gap-3">
            <Gift size={18} className="text-[var(--color-primary)] shrink-0" />
            <div>
              <div className="font-medium">Bônus de R$ 1.000 desbloqueado</div>
              <div className="text-sm text-[var(--color-text-muted)]">
                Você atingiu 100+ clientes ativos. Transferimos nos próximos dias úteis.
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tier ladder */}
      <div className="space-y-2 mb-6">
        {ALL_TIERS.map((tier) => {
          const isCurrent = tier.name === metrics.tier.name;
          const isAchieved = tier.display_order <= metrics.tier.display_order;
          return (
            <div
              key={tier.name}
              className={
                'flex items-center gap-4 p-5 rounded-lg border transition-all ' +
                (isCurrent
                  ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5'
                  : isAchieved
                  ? 'border-[var(--color-border)] bg-[var(--color-surface)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)]/40')
              }
            >
              <div
                className={
                  'size-10 rounded-md grid place-items-center ' +
                  (isAchieved
                    ? 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20'
                    : 'bg-[var(--color-surface-2)] border border-[var(--color-border)]')
                }
              >
                {isAchieved ? (
                  <Check size={15} className="text-[var(--color-primary)]" />
                ) : (
                  <Lock size={14} className="text-[var(--color-text-dim)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={'font-medium ' + (!isAchieved ? 'text-[var(--color-text-muted)]' : '')}>
                    {TIER_LABEL[tier.name]}
                  </span>
                  {isCurrent && <Badge tone="success">Você está aqui</Badge>}
                  {tier.name === 'lendario' && <Badge tone="info">+R$ 1.000 bônus</Badge>}
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {tier.min}
                  {tier.max ? `–${tier.max}` : '+'} clientes ativos
                </div>
              </div>
              <div className="text-right">
                <div
                  className={
                    'text-2xl font-semibold tracking-tight ' +
                    (!isAchieved ? 'text-[var(--color-text-muted)]' : '')
                  }
                >
                  {tier.percent}%
                </div>
                <div className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-widest">
                  comissão
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Calculadora */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Calculator size={14} className="text-[var(--color-primary)]" />
          <div className="text-sm font-medium">Calculadora de meta</div>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Quanto você quer ganhar por mês? Calculamos quantos clientes precisa.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <label className="flex-1">
            <div className="text-xs text-[var(--color-text-muted)] mb-1.5">Meta mensal (R$)</div>
            <input
              type="text"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value.replace(/\D/g, ''))}
              placeholder="5000"
              className={inputClass}
            />
          </label>
          <div className="rounded-md bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 p-4 flex-1">
            {goalCents > 0 ? (
              <>
                <div className="text-xs text-[var(--color-text-muted)]">
                  Pra {formatBRL(goalCents)}/mês:
                </div>
                <div className="text-xl font-semibold tracking-tight text-[var(--color-primary)] mt-0.5">
                  {customersNeeded} clientes ativos
                </div>
                {customersToAdd > 0 && (
                  <div className="text-xs text-[var(--color-text-muted)] mt-1">
                    Faltam <span className="text-[var(--color-text)] font-medium">{customersToAdd}</span> ·
                    1 venda/dia ≈ {customersToAdd} dias
                  </div>
                )}
                {customersToAdd === 0 && (
                  <div className="text-xs text-emerald-400 mt-1">Você já passou da meta</div>
                )}
              </>
            ) : (
              <div className="text-sm text-[var(--color-text-dim)]">Digite uma meta acima</div>
            )}
          </div>
        </div>
      </Card>

      {/* Sale link */}
      {saleUrl && (
        <Card className="p-6 mb-6">
          <div className="text-sm font-medium mb-3">Seu link único de venda</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-10 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center font-mono text-xs text-[var(--color-text-muted)] truncate">
              {saleUrl}
            </div>
            <Button onClick={copyLink} variant="secondary">
              {copied ? <Check size={13} className="text-[var(--color-primary)]" /> : <Copy size={13} />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
        </Card>
      )}

      {/* Top */}
      {top.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Medal size={14} className="text-amber-400" />
            <div className="text-sm font-medium">Top vendedores do mês</div>
          </div>
          <div className="space-y-2">
            {top.map((r, i) => (
              <div key={r.position} className="flex items-center gap-3 p-3 rounded-md bg-[var(--color-surface-2)]/40 border border-[var(--color-border)]">
                <div className="size-7 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] grid place-items-center text-xs font-mono">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.name}</div>
                  <div className="text-xs text-[var(--color-text-dim)]">
                    {r.sales_in_month} vendas · {r.active_customers} ativos
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-[var(--color-primary)]">{formatBRL(r.revenue_cents)}</div>
                  <div className="text-[10px] text-[var(--color-text-dim)]">no mês</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-dim)] mt-4 text-center">
            Top 1 do mês ganha <span className="text-[var(--color-text)] font-medium">R$ 500 bônus</span>
          </p>
        </Card>
      )}
    </Section>
  );
}
