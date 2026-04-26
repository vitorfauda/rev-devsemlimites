import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
  Users, Search, CheckCircle2, AlertTriangle, Calendar, CreditCard, QrCode,
  ArrowRight, RefreshCw, TrendingUp, Filter,
} from 'lucide-react';
import { LoaderRing } from '@/components/LoaderRing';
import { formatBRL } from '@/lib/utils';
import { Badge, Button, Card, PageHeader, Section, Stat, inputClass } from '@/components/ui';

type SubStatus = 'active' | 'past_due' | 'canceled' | 'pending' | 'suspended';

interface Subscription {
  id: string;
  plan_code: string;
  payment_method: string;
  status: SubStatus;
  amount_cents: number;
  commission_percent_at_sale: number;
  next_billing_at: string | null;
  current_period_end: string | null;
  created_at: string;
  card_brand?: string | null;
  card_last_4?: string | null;
  failed_charges_count?: number;
  customers?: { id: string; name?: string; email?: string; phone?: string } | null;
}

const PLAN_LABEL: Record<string, string> = {
  monthly: 'Mensal', yearly: 'Anual', '7dias': '7 dias', '1dia': '1 dia',
};

const STATUS_TONE: Record<SubStatus, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  active: 'success', pending: 'warning', past_due: 'warning', suspended: 'danger', canceled: 'neutral',
};

const STATUS_LABEL: Record<SubStatus, string> = {
  active: 'Ativo', pending: 'Aguardando', past_due: 'Em atraso', suspended: 'Suspenso', canceled: 'Cancelado',
};

export default function MeusClientes() {
  const { reseller } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | SubStatus>('all');

  const load = async () => {
    if (!reseller) return;
    setLoading(true);
    const { data } = await supabase
      .from('subscriptions')
      .select('*, customers(id, name, email, phone)')
      .eq('reseller_id', reseller.id)
      .order('created_at', { ascending: false });
    setSubs((data || []) as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reseller?.id]);

  const filtered = useMemo(() => {
    return subs.filter((s) => {
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.customers?.name?.toLowerCase().includes(q) ||
        s.customers?.email?.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });
  }, [subs, filterStatus, search]);

  const counts = useMemo(
    () => ({
      all: subs.length,
      active: subs.filter((s) => s.status === 'active').length,
      past_due: subs.filter((s) => s.status === 'past_due').length,
      suspended: subs.filter((s) => s.status === 'suspended').length,
      canceled: subs.filter((s) => s.status === 'canceled').length,
    }),
    [subs],
  );

  const mrrCommission = useMemo(() => {
    return subs
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => {
        const monthlyValue = s.plan_code === 'yearly' ? s.amount_cents / 12 : s.amount_cents;
        const commission = monthlyValue * ((s.commission_percent_at_sale || 60) / 100);
        return sum + commission;
      }, 0);
  }, [subs]);

  return (
    <Section>
      <PageHeader
        title="Meus clientes"
        description="Clientes que assinaram pelo seu link · Cada renovação gera comissão"
        actions={
          <Button onClick={load} variant="secondary" size="sm">
            <RefreshCw size={13} /> Atualizar
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Stat label="Total" value={String(counts.all)} icon={Users} />
        <Stat label="Ativos" value={String(counts.active)} icon={CheckCircle2} />
        <Stat label="MRR (sua parte)" value={formatBRL(Math.round(mrrCommission))} icon={TrendingUp} />
        <Stat label="Em risco" value={String(counts.past_due + counts.suspended)} icon={AlertTriangle} />
      </div>

      <Card>
        <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nome, email ou ID…"
              className={inputClass + ' pl-9 h-9'}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className={inputClass + ' h-9 w-auto'}
          >
            <option value="all">Todos ({counts.all})</option>
            <option value="active">Ativos ({counts.active})</option>
            <option value="past_due">Em atraso ({counts.past_due})</option>
            <option value="suspended">Suspensos ({counts.suspended})</option>
            <option value="canceled">Cancelados ({counts.canceled})</option>
          </select>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16 text-[var(--color-text-muted)]">
            <LoaderRing size={24} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState search={search} hasAny={subs.length > 0} />
        ) : (
          <div>
            {filtered.map((sub, i) => (
              <SubscriptionRow key={sub.id} sub={sub} last={i === filtered.length - 1} />
            ))}
          </div>
        )}
      </Card>

      <p className="text-xs text-[var(--color-text-dim)] mt-6 text-center">
        Os dados de cada cliente são privados — você só vê quem comprou pelo seu link.
      </p>
    </Section>
  );
}

function SubscriptionRow({ sub, last }: { sub: Subscription; last: boolean }) {
  const customerName = sub.customers?.name || 'Cliente sem nome';
  const customerEmail = sub.customers?.email || '—';
  const planLabel = PLAN_LABEL[sub.plan_code] || sub.plan_code;
  const monthlyValue = sub.plan_code === 'yearly' ? sub.amount_cents / 12 : sub.amount_cents;
  const myCommission = Math.round(monthlyValue * ((sub.commission_percent_at_sale || 60) / 100));

  return (
    <div
      className={
        'p-4 hover:bg-[var(--color-surface-2)]/40 transition-colors ' +
        (!last ? 'border-b border-[var(--color-border)]' : '')
      }
    >
      <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
        <div className="size-9 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] grid place-items-center text-sm font-medium shrink-0">
          {customerName[0]?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <div className="font-medium truncate">{customerName}</div>
            <Badge tone={STATUS_TONE[sub.status]}>{STATUS_LABEL[sub.status]}</Badge>
          </div>
          <div className="text-xs text-[var(--color-text-dim)] truncate mt-0.5">{customerEmail}</div>
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-text-muted)] flex-wrap">
            <span className="inline-flex items-center gap-1">
              {sub.payment_method === 'pix' ? <QrCode size={11} /> : <CreditCard size={11} />}
              {sub.payment_method === 'pix' ? 'PIX' : `Cartão ${sub.card_last_4 ? `••${sub.card_last_4}` : ''}`}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar size={11} />
              {sub.next_billing_at
                ? `Renova ${new Date(sub.next_billing_at).toLocaleDateString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                  })}`
                : '—'}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0 pl-2">
          <div className="text-xs text-[var(--color-text-dim)]">{planLabel}</div>
          <div className="font-mono text-sm text-[var(--color-primary)]">+{formatBRL(myCommission)}</div>
          <div className="text-[10px] text-[var(--color-text-dim)]">/mês equiv.</div>
        </div>
      </div>

      {(sub.failed_charges_count || 0) > 0 && sub.status !== 'canceled' && (
        <div className="mt-3 p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
          <AlertTriangle size={12} /> {sub.failed_charges_count} cobrança(s) falhada(s) — retentativa automática
        </div>
      )}
    </div>
  );
}

function EmptyState({ search, hasAny }: { search: string; hasAny: boolean }) {
  if (search)
    return (
      <div className="text-center py-12 text-[var(--color-text-muted)]">
        <Search size={22} className="text-[var(--color-text-dim)] mx-auto mb-2" />
        <p className="text-sm">Nenhum cliente para "{search}"</p>
      </div>
    );

  if (hasAny)
    return (
      <div className="text-center py-12 text-[var(--color-text-muted)]">
        <Filter size={22} className="text-[var(--color-text-dim)] mx-auto mb-2" />
        <p className="text-sm">Nenhum cliente com esse filtro</p>
      </div>
    );

  return (
    <div className="text-center py-16 px-4">
      <Users size={28} className="text-[var(--color-text-dim)] mx-auto mb-3" />
      <div className="font-medium mb-1">Você ainda não tem clientes</div>
      <p className="text-sm text-[var(--color-text-muted)] max-w-sm mx-auto mb-5">
        Compartilhe seu link e quando alguém assinar, vai aparecer aqui.
      </p>
      <Link to="/comprar-chaves">
        <Button size="sm">
          Ver meu link <ArrowRight size={13} />
        </Button>
      </Link>
    </div>
  );
}
