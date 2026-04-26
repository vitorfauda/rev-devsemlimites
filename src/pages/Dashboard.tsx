import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp, Users, Target, ArrowRight, Wallet, ShieldCheck,
  Copy, Check, Zap,
} from 'lucide-react';
import { formatBRL, copyToClipboard } from '@/lib/utils';
import { LoaderRing } from '@/components/LoaderRing';
import { Badge, Button, ButtonLink, Card, PageHeader, Section, Stat } from '@/components/ui';
import { toast } from 'sonner';

interface Metrics {
  tier: { name: string; emoji: string; commission_percent: number };
  next_tier: { name: string; emoji: string; missing: number; extra_commission_percent: number } | null;
  active_customers: number;
  mrr_commission_cents: number;
  total_sales_30d: number;
  ticket_medio_cents: number;
  total_revenue_30d_cents: number;
  lendario_bonus_pending: boolean;
}

interface Balance {
  available_amount: number;
  waiting_funds: number;
  kyc_pending?: boolean;
}

const TIER_LABEL: Record<string, string> = {
  bronze: 'Bronze', prata: 'Prata', ouro: 'Ouro', diamante: 'Diamante', lendario: 'Lendário',
};

export default function Dashboard() {
  const { reseller, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!reseller) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [m, b] = await Promise.all([
          supabase.functions.invoke('get-reseller-metrics'),
          supabase.functions.invoke('get-reseller-balance'),
        ]);
        if (cancelled) return;
        if (m.data?.ok) setMetrics(m.data);
        if (b.data?.ok) setBalance(b.data);
      } catch {}
      finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reseller, authLoading]);

  if (loading || authLoading)
    return (
      <div className="min-h-[60vh] grid place-items-center text-[var(--color-text-muted)]">
        <LoaderRing size={28} />
      </div>
    );
  if (!reseller)
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <p className="text-sm text-[var(--color-text-muted)]">Carregando…</p>
      </div>
    );

  const saleUrl = reseller.slug ? `https://pay.devsemlimites.site/c/${reseller.slug}` : null;
  const copyLink = async () => {
    if (!saleUrl) return;
    await copyToClipboard(saleUrl);
    setCopied(true);
    toast.success('Link copiado');
    setTimeout(() => setCopied(false), 1500);
  };

  const firstName = reseller.name?.split(' ')[0] || 'campeão';
  const onboardingPending =
    !reseller.pagarme_recipient_id || reseller.pagarme_kyc_status !== 'approved';

  const progressPercent = metrics?.next_tier
    ? Math.min(
        100,
        ((metrics.active_customers - 0) / (metrics.active_customers + metrics.next_tier.missing)) * 100,
      )
    : 0;

  return (
    <Section>
      <PageHeader
        title={`Olá, ${firstName}`}
        description={
          metrics
            ? `${TIER_LABEL[metrics.tier.name]} · ${metrics.tier.commission_percent}% de comissão`
            : 'Visão geral da sua operação'
        }
        actions={
          metrics && <Badge tone="success">{TIER_LABEL[metrics.tier.name]}</Badge>
        }
      />

      {/* Onboarding banner */}
      {onboardingPending && reseller.entry_paid && (
        <Card className="mb-6 p-5 border-amber-500/30">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-md bg-amber-500/10 border border-amber-500/20 grid place-items-center shrink-0">
              <ShieldCheck size={16} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="font-medium mb-0.5">Configure sua conta de recebimento</div>
              <p className="text-sm text-[var(--color-text-muted)] mb-3">
                Pra começar a receber comissões, precisamos cadastrar sua conta no Pagar.me. Leva 3
                minutos.
              </p>
              <Link to="/onboarding-pagarme">
                <Button size="sm">
                  Configurar agora <ArrowRight size={13} />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Bonus */}
      {metrics?.lendario_bonus_pending && (
        <Card className="mb-6 p-5 border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-md bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 grid place-items-center shrink-0">
              <Zap size={16} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <div className="font-medium">Bônus de R$ 2.000 desbloqueado</div>
              <div className="text-sm text-[var(--color-text-muted)]">
                Você é Lendário. Cai na conta nos próximos dias úteis.
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Clientes ativos" value={String(metrics?.active_customers || 0)} icon={Users} />
        <Stat
          label="MRR (sua parte)"
          value={formatBRL(metrics?.mrr_commission_cents || 0)}
          icon={TrendingUp}
        />
        <Stat label="Vendas 30d" value={String(metrics?.total_sales_30d || 0)} icon={Target} />
        <Stat label="Saldo disponível" value={formatBRL(balance?.available_amount || 0)} icon={Wallet} />
      </div>

      {/* Sale link */}
      {saleUrl && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <div className="text-sm font-medium mb-3">Seu link único de venda</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-10 px-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center font-mono text-xs text-[var(--color-text-muted)] truncate">
                  {saleUrl}
                </div>
                <Button onClick={copyLink} variant="secondary">
                  {copied ? (
                    <>
                      <Check size={13} className="text-[var(--color-primary)]" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Copiar
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-3">
                Compartilhe em qualquer lugar. Toda venda gera comissão automática.
              </p>
            </div>
            <Link to="/comprar-chaves" className="shrink-0">
              <Button>
                Como divulgar <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Próximo tier */}
      {metrics?.next_tier && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <div className="text-sm font-medium">Próximo tier</div>
            <span className="text-xs text-[var(--color-text-muted)]">
              Faltam <span className="text-[var(--color-text)] font-medium">{metrics.next_tier.missing}</span>{' '}
              clientes pra {TIER_LABEL[metrics.next_tier.name]}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden mb-3">
            <div
              className="h-full bg-[var(--color-primary)] rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            Subir pra {TIER_LABEL[metrics.next_tier.name]} dá{' '}
            <span className="text-[var(--color-primary)] font-medium">
              +{metrics.next_tier.extra_commission_percent.toFixed(1)}% de comissão
            </span>{' '}
            sobre TODOS os seus clientes.
          </p>
          <Link
            to="/escala"
            className="text-xs text-[var(--color-primary)] mt-3 inline-flex items-center gap-1 hover:underline"
          >
            Ver plano de escala completo <ArrowRight size={11} />
          </Link>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-3">
        <QuickAction to="/comprar-chaves" icon={ArrowRight} title="Meus links" description="Material de divulgação" />
        <QuickAction to="/minhas-chaves" icon={Users} title="Meus clientes" description={`${metrics?.active_customers || 0} ativos`} />
        <QuickAction
          to="/extrato"
          icon={Wallet}
          title="Extrato e saque"
          description={balance?.available_amount ? `${formatBRL(balance.available_amount)} disponível` : 'Sem saldo ainda'}
        />
      </div>
    </Section>
  );
}

function QuickAction({ to, icon: Icon, title, description }: { to: string; icon: any; title: string; description: string }) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:bg-[var(--color-surface-2)] transition-colors flex items-center gap-3 group"
    >
      <div className="size-9 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] grid place-items-center shrink-0">
        <Icon size={15} className="text-[var(--color-primary)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-[var(--color-text-dim)] truncate">{description}</div>
      </div>
      <ArrowRight size={13} className="text-[var(--color-text-dim)] group-hover:text-[var(--color-text)] shrink-0" />
    </Link>
  );
}
