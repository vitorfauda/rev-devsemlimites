import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import {
  TrendingUp, Trophy, Target, Users, DollarSign, ArrowRight, Crown, Medal,
  Sparkles, Calculator, Copy, Check, Gift,
} from 'lucide-react';
import { LoaderRing } from '@/components/LoaderRing';
import { formatBRL, copyToClipboard } from '@/lib/utils';
import { toast } from 'sonner';

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
  { name: "bronze",   emoji: "🥉", min: 0,   max: 9,    percent: 60,    display_order: 1 },
  { name: "prata",    emoji: "🥈", min: 10,  max: 24,   percent: 62.5,  display_order: 2 },
  { name: "ouro",     emoji: "🥇", min: 25,  max: 49,   percent: 65,    display_order: 3 },
  { name: "diamante", emoji: "💎", min: 50,  max: 99,   percent: 67.5,  display_order: 4 },
  { name: "lendario", emoji: "👑", min: 100, max: null, percent: 70,    display_order: 5 },
];

const TIER_LABEL: Record<string, string> = {
  bronze: "Bronze", prata: "Prata", ouro: "Ouro", diamante: "Diamante", lendario: "Lendário",
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

  useEffect(() => { load(); }, []);

  if (loading || !metrics) return <div className="min-h-[60vh] grid place-items-center"><LoaderRing /></div>;

  const saleUrl = reseller?.slug ? `https://pay.devsemlimites.site/c/${reseller.slug}` : null;
  const copyLink = async () => {
    if (!saleUrl) return;
    await copyToClipboard(saleUrl);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Calc projeção da meta personalizada
  const goalCents = (parseInt(goalAmount.replace(/\D/g, '')) || 0) * 100;
  const avgRevenuePerCustomer = metrics.active_customers > 0 ? Math.round(metrics.mrr_commission_cents / metrics.active_customers) : 6300;
  const customersNeeded = goalCents > 0 && avgRevenuePerCustomer > 0 ? Math.ceil(goalCents / avgRevenuePerCustomer) : 0;
  const customersToAdd = Math.max(0, customersNeeded - metrics.active_customers);
  const daysToReach = customersToAdd > 0 ? Math.ceil(customersToAdd) : 0; // 1 venda/dia base

  // Progress to next tier
  const tierProgress = metrics.next_tier
    ? Math.round(((metrics.active_customers - metrics.tier.min) / (metrics.next_tier.min - metrics.tier.min)) * 100)
    : 100;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2 flex items-center gap-3">
          <TrendingUp className="size-8 text-primary" /> Plano de Escala
        </h1>
        <p className="text-text-muted mb-8">Sua jornada de comissão no DSL — quanto mais clientes ativos, mais você ganha.</p>

        {/* Status atual */}
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          <div className="holo-card holo-permanent p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-text-muted text-xs uppercase tracking-wider">Tier atual</span>
                <h2 className="text-2xl font-bold mt-1">
                  <span className="text-3xl mr-2">{metrics.tier.emoji}</span>
                  {TIER_LABEL[metrics.tier.name]}
                </h2>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{metrics.tier.commission_percent}%</div>
                <div className="text-xs text-text-dim">comissão</div>
                {metrics.tier.is_override && <div className="text-[10px] text-accent-cyan">override admin</div>}
              </div>
            </div>

            <div className="text-sm text-text-muted mb-2">
              <Users size={14} className="inline mr-1" /> <strong className="text-text-primary">{metrics.active_customers}</strong> clientes ativos
            </div>

            {/* Progress bar to next tier */}
            {metrics.next_tier ? (
              <>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-text-muted">Próximo: {metrics.next_tier.emoji} {TIER_LABEL[metrics.next_tier.name]} ({metrics.next_tier.percent}%)</span>
                  <span className="text-primary font-semibold">faltam {metrics.next_tier.missing}</span>
                </div>
                <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent-cyan transition-all"
                    style={{ width: `${Math.min(100, tierProgress)}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Subir pra {TIER_LABEL[metrics.next_tier.name]} dá <strong className="text-primary">+{metrics.next_tier.extra_commission_percent.toFixed(1)}%</strong> sobre TODOS os seus clientes (não só novos).
                </p>
              </>
            ) : (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-center">
                <Crown className="size-6 text-amber-400 mx-auto mb-1" />
                <p className="text-sm text-amber-200 font-semibold">Você está no topo! 👑</p>
                <p className="text-xs text-amber-200/70">70% de comissão — máximo possível.</p>
              </div>
            )}
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3">
            <Stat label="MRR (sua parte)" value={formatBRL(metrics.mrr_commission_cents)} icon={DollarSign} highlight />
            <Stat label="Vendas 30d" value={String(metrics.total_sales_30d)} icon={Target} />
            <Stat label="Ticket médio" value={formatBRL(metrics.ticket_medio_cents)} icon={Sparkles} />
            <Stat label="Receita 30d" value={formatBRL(metrics.total_revenue_30d_cents)} icon={TrendingUp} />
          </div>
        </div>

        {/* Bônus Lendário pendente */}
        {metrics.lendario_bonus_pending && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="mb-6 rounded-2xl p-6 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-2 border-amber-500/40"
          >
            <div className="flex items-center gap-4">
              <Gift className="size-12 text-amber-300 shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-amber-100">🎉 Bônus de R$ 2.000 desbloqueado!</h3>
                <p className="text-amber-200/80 text-sm mt-1">Você atingiu 100+ clientes ativos (Lendário). Vamos transferir o bônus pra sua conta nos próximos dias úteis.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Sua jornada — visual de tiers */}
        <div className="holo-card p-6 mb-6">
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-primary" /> Sua jornada de comissão
          </h2>
          <div className="space-y-2">
            {ALL_TIERS.map(tier => {
              const isCurrent = tier.name === metrics.tier.name;
              const isAchieved = tier.display_order <= metrics.tier.display_order;
              return (
                <div key={tier.name} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                  isCurrent ? 'bg-primary/15 border border-primary/40' :
                  isAchieved ? 'bg-white/5' :
                  'opacity-50'
                }`}>
                  <div className="text-3xl">{tier.emoji}</div>
                  <div className="flex-1">
                    <div className={`font-semibold ${isCurrent ? 'text-primary' : ''}`}>
                      {TIER_LABEL[tier.name]} {isCurrent && '· você está aqui'}
                    </div>
                    <div className="text-xs text-text-muted">
                      {tier.min}{tier.max ? `–${tier.max}` : '+'} clientes ativos
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${isCurrent ? 'text-primary' : 'text-text-muted'}`}>
                    {tier.percent}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calculadora de meta */}
        <div className="holo-card p-6 mb-6">
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <Calculator size={18} className="text-primary" /> Calculadora de meta
          </h2>
          <p className="text-sm text-text-muted mb-4">
            Quanto você quer ganhar por mês? Calculamos quantos clientes precisa.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <label className="flex-1">
              <span className="block text-xs text-text-muted mb-1.5">Meta mensal (R$)</span>
              <input
                type="text"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="5000"
                className="input-dsl"
              />
            </label>
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 flex-1">
              {goalCents > 0 ? (
                <>
                  <div className="text-xs text-text-muted mb-1">Pra ganhar {formatBRL(goalCents)}/mês:</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {customersNeeded} clientes ativos
                  </div>
                  {customersToAdd > 0 && (
                    <div className="text-xs text-text-muted mt-1">
                      Faltam <strong className="text-primary">{customersToAdd}</strong> · vendendo 1/dia, {daysToReach} dias
                    </div>
                  )}
                  {customersToAdd === 0 && goalCents > 0 && (
                    <div className="text-xs text-emerald-400 mt-1">✅ Você já passou da meta!</div>
                  )}
                </>
              ) : (
                <div className="text-text-dim text-sm">Digite uma meta acima</div>
              )}
            </div>
          </div>
        </div>

        {/* Link de venda + copy */}
        {saleUrl && (
          <div className="holo-card p-6 mb-6">
            <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" /> Seu link único de venda
            </h2>
            <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3 mb-3">
              <code className="flex-1 text-sm font-mono text-emerald-400 break-all">{saleUrl}</code>
              <button onClick={copyLink} className="cta-ghost !py-2 !px-3 inline-flex items-center gap-1 text-xs">
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="text-xs text-text-muted">
              Compartilha esse link em qualquer lugar. Toda venda que vier por ele rende sua comissão automática.
            </p>
          </div>
        )}

        {/* Top 5 do mês */}
        {top.length > 0 && (
          <div className="holo-card p-6">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Medal size={18} className="text-amber-400" /> Top vendedores do mês
            </h2>
            <div className="space-y-2">
              {top.map(r => (
                <div key={r.position} className={`flex items-center gap-3 p-3 rounded-xl ${
                  r.position === 1 ? 'bg-amber-500/10 border border-amber-500/30' :
                  r.position <= 3 ? 'bg-white/5' :
                  'bg-white/[0.02]'
                }`}>
                  <div className="text-2xl w-10 text-center">
                    {r.medal || `#${r.position}`}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-xs text-text-muted">
                      {r.sales_in_month} {r.sales_in_month === 1 ? 'venda' : 'vendas'} · {r.active_customers} ativos
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-400">{formatBRL(r.revenue_cents)}</div>
                    <div className="text-xs text-text-dim">no mês</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-dim mt-4 text-center">
              🏆 Top 1 do mês ganha <strong className="text-amber-400">R$ 500 PIX bônus</strong>. Atualizado em tempo real.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, highlight = false }: { label: string; value: string; icon: any; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-white/5'}`}>
      <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
        <Icon size={11} className={highlight ? 'text-emerald-400' : ''} /> {label}
      </div>
      <div className={`text-lg font-bold ${highlight ? 'text-emerald-400' : 'text-text-primary'}`}>{value}</div>
    </div>
  );
}
