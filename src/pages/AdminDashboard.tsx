import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, PageHeader, Section } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import {
  DollarSign, ShoppingCart, Users, Key, TrendingUp, Calendar, Award,
} from 'lucide-react';

interface AdminMetrics {
  total_revenue_cents: number;
  total_keys_sold: number;
  total_purchases: number;
  total_resellers_active: number;
  total_resellers_buyers: number;
  current_month_revenue_cents: number;
  current_month_purchases: number;
  current_month_keys: number;
  recent_purchases: Array<{
    id: string;
    reseller_name: string;
    plan_code: string;
    package_size: number;
    total_cents: number;
    paid_at: string;
    keys_generated: number;
  }>;
  top_resellers: Array<{
    resellerId: string;
    name: string;
    whatsapp: string | null;
    totalCents: number;
    keys: number;
    purchases: number;
    lastPurchase: string;
  }>;
  revenue_by_month: Array<{ month: string; revenueCents: number; purchases: number; keys: number }>;
  revenue_by_plan: Array<{ plan: string; revenueCents: number; keys: number; purchases: number }>;
}

const formatBRL = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

const planLabel = (code: string) =>
  ({ vitalicio: 'Vitalícia', '30dias': '30 dias', '7dias': '7 dias' } as Record<string, string>)[code] || code;

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-admin-metrics');
        if (error) throw error;
        if (!data?.ok) throw new Error(data?.error || 'Falha ao carregar métricas');
        setMetrics(data);
      } catch (e: any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin, authLoading]);

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  if (loading) {
    return (
      <Section>
        <PageHeader title="Dashboard Admin" />
        <Card className="p-8 text-center text-[var(--color-text-muted)]">Carregando métricas…</Card>
      </Section>
    );
  }

  if (err || !metrics) {
    return (
      <Section>
        <PageHeader title="Dashboard Admin" />
        <Card className="p-6 text-sm text-red-400">Erro: {err || 'sem dados'}</Card>
      </Section>
    );
  }

  return (
    <Section>
      <PageHeader title="Dashboard Admin" description="Receita das compras de chaves dos revendedores" />

      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat
          icon={DollarSign}
          label="Receita total"
          value={formatBRL(metrics.total_revenue_cents)}
          accent
        />
        <Stat
          icon={Key}
          label="Chaves vendidas"
          value={String(metrics.total_keys_sold)}
        />
        <Stat
          icon={ShoppingCart}
          label="Compras pagas"
          value={String(metrics.total_purchases)}
        />
        <Stat
          icon={Users}
          label="Compradores"
          value={`${metrics.total_resellers_buyers} / ${metrics.total_resellers_active}`}
          sub={`${metrics.total_resellers_active} revendedores ativos`}
        />
      </div>

      {/* Mês corrente */}
      <Card className="p-5 mb-6">
        <div className="flex items-center gap-2 mb-3 text-sm text-[var(--color-text-muted)]">
          <Calendar size={14} />
          <span>Mês corrente</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-[var(--color-text-muted)]">Receita</div>
            <div className="text-2xl font-mono text-[var(--color-primary)] mt-1">
              {formatBRL(metrics.current_month_revenue_cents)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-muted)]">Compras</div>
            <div className="text-2xl font-mono mt-1">{metrics.current_month_purchases}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-muted)]">Chaves</div>
            <div className="text-2xl font-mono mt-1">{metrics.current_month_keys}</div>
          </div>
        </div>
      </Card>

      {/* Top revendedores */}
      <Card className="p-5 mb-6">
        <div className="flex items-center gap-2 mb-4 text-sm text-[var(--color-text-muted)]">
          <Award size={14} />
          <span>Top revendedores (por valor)</span>
        </div>
        {metrics.top_resellers.length === 0 ? (
          <div className="text-sm text-[var(--color-text-muted)] py-4 text-center">
            Nenhuma compra registrada ainda.
          </div>
        ) : (
          <div className="space-y-2">
            {metrics.top_resellers.map((r, i) => (
              <div
                key={r.resellerId}
                className="flex items-center gap-3 p-2.5 rounded-md hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <div className="size-8 rounded-md bg-[var(--color-surface-2)] flex items-center justify-center text-xs font-mono text-[var(--color-text-muted)] shrink-0">
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.name}</div>
                  <div className="text-xs text-[var(--color-text-dim)] truncate">
                    {r.purchases} compra{r.purchases > 1 ? 's' : ''} · {r.keys} chave{r.keys > 1 ? 's' : ''} ·{' '}
                    {r.whatsapp ? `+${r.whatsapp}` : 'sem whatsapp'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-mono text-[var(--color-primary)]">
                    {formatBRL(r.totalCents)}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-dim)]">
                    {formatDate(r.lastPurchase)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Receita por plano */}
      <Card className="p-5 mb-6">
        <div className="flex items-center gap-2 mb-4 text-sm text-[var(--color-text-muted)]">
          <TrendingUp size={14} />
          <span>Receita por plano</span>
        </div>
        <div className="space-y-2">
          {metrics.revenue_by_plan.map((p) => {
            const pct = metrics.total_revenue_cents > 0 ? (p.revenueCents / metrics.total_revenue_cents) * 100 : 0;
            return (
              <div key={p.plan}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{planLabel(p.plan)}</span>
                  <span className="text-[var(--color-text-muted)] font-mono">
                    {formatBRL(p.revenueCents)} · {p.keys} chaves · {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Compras recentes */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4 text-sm text-[var(--color-text-muted)]">
          <ShoppingCart size={14} />
          <span>Últimas compras</span>
        </div>
        {metrics.recent_purchases.length === 0 ? (
          <div className="text-sm text-[var(--color-text-muted)] py-4 text-center">
            Nenhuma compra registrada ainda.
          </div>
        ) : (
          <div className="space-y-1">
            {metrics.recent_purchases.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-[var(--color-surface-2)] transition-colors text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.reseller_name}</div>
                  <div className="text-[10px] text-[var(--color-text-dim)]">{formatDate(p.paid_at)}</div>
                </div>
                <div className="text-[var(--color-text-muted)] shrink-0">
                  {p.package_size}× {planLabel(p.plan_code)}
                </div>
                <div className="font-mono text-[var(--color-primary)] shrink-0 text-right min-w-[70px]">
                  {formatBRL(p.total_cents)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-xs mb-2">
        <Icon size={12} />
        <span>{label}</span>
      </div>
      <div className={`text-xl font-mono ${accent ? 'text-[var(--color-primary)]' : ''}`}>{value}</div>
      {sub && <div className="text-[10px] text-[var(--color-text-dim)] mt-1">{sub}</div>}
    </Card>
  );
}
