// ============================================================
// "Meus Clientes" — subscriptions ativas (assinaturas recorrentes)
// ============================================================
// Conceito novo: lista de clientes que assinaram pelo seu link, com
// status de pagamento, próxima cobrança e comissão de cada um.
// (Arquivo mantém nome MinhasChaves.tsx pra rota legacy /minhas-chaves)
// ============================================================

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
  Users, Search, CheckCircle2, Clock, AlertTriangle, XCircle,
  Calendar, CreditCard, QrCode, ArrowRight, RefreshCw, TrendingUp, Filter,
} from 'lucide-react';
import { LoaderRing } from '@/components/LoaderRing';
import { formatBRL, formatDateTime } from '@/lib/utils';

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
  monthly: 'Mensal', yearly: 'Anual', '7dias': '7 Dias', '1dia': '1 Dia',
};

const STATUS_META: Record<SubStatus, { label: string; color: string; icon: any }> = {
  active:    { label: 'Ativo',          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  pending:   { label: 'Aguardando 1ª',  color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',     icon: Clock },
  past_due:  { label: 'Em atraso',      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: AlertTriangle },
  suspended: { label: 'Suspenso',       color: 'text-red-400 bg-red-500/10 border-red-500/20',         icon: XCircle },
  canceled:  { label: 'Cancelado',      color: 'text-text-dim bg-white/5 border-white/10',              icon: XCircle },
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

  useEffect(() => { load(); }, [reseller?.id]);

  const filtered = useMemo(() => {
    return subs.filter(s => {
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

  const counts = useMemo(() => ({
    all: subs.length,
    active: subs.filter(s => s.status === 'active').length,
    past_due: subs.filter(s => s.status === 'past_due').length,
    suspended: subs.filter(s => s.status === 'suspended').length,
    canceled: subs.filter(s => s.status === 'canceled').length,
  }), [subs]);

  // MRR estimado dos ativos (sua comissão)
  const mrrCommission = useMemo(() => {
    return subs
      .filter(s => s.status === 'active')
      .reduce((sum, s) => {
        const monthlyValue = s.plan_code === 'yearly' ? s.amount_cents / 12 : s.amount_cents;
        const commission = monthlyValue * ((s.commission_percent_at_sale || 60) / 100);
        return sum + commission;
      }, 0);
  }, [subs]);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Users className="size-7 text-primary" /> Meus Clientes
          </h1>
          <button onClick={load} className="cta-ghost !py-2 !px-3 text-sm inline-flex items-center gap-2">
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>
        <p className="text-text-muted mb-6 text-sm">
          Clientes que assinaram pelo seu link. Cada renovação gera comissão automática.
        </p>

        {/* Stats topo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total" value={String(counts.all)} icon={Users} />
          <StatCard label="Ativos" value={String(counts.active)} icon={CheckCircle2} highlight />
          <StatCard label="MRR (sua parte)" value={formatBRL(Math.round(mrrCommission))} icon={TrendingUp} highlight />
          <StatCard label="Em risco" value={String(counts.past_due + counts.suspended)} icon={AlertTriangle} warning={counts.past_due + counts.suspended > 0} />
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente por nome, email ou ID..."
              className="input-dsl !pl-9 !py-2 text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="input-dsl !py-2 text-sm !w-auto"
          >
            <option value="all">Todos ({counts.all})</option>
            <option value="active">Ativos ({counts.active})</option>
            <option value="past_due">Em atraso ({counts.past_due})</option>
            <option value="suspended">Suspensos ({counts.suspended})</option>
            <option value="canceled">Cancelados ({counts.canceled})</option>
          </select>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="grid place-items-center py-16"><LoaderRing /></div>
        ) : filtered.length === 0 ? (
          <EmptyState search={search} hasAny={subs.length > 0} />
        ) : (
          <div className="space-y-2">
            {filtered.map(sub => <SubscriptionRow key={sub.id} sub={sub} />)}
          </div>
        )}

        <p className="text-xs text-text-dim mt-6 text-center">
          💡 Os dados de cada cliente são privados — você só vê quem comprou pelo seu link.
        </p>
      </motion.div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, highlight = false, warning = false }: {
  label: string; value: string; icon: any; highlight?: boolean; warning?: boolean;
}) {
  const bg = warning ? 'bg-amber-500/10 border-amber-500/30' :
             highlight ? 'bg-emerald-500/10 border-emerald-500/30' :
             'bg-white/5 border-white/5';
  const valColor = warning ? 'text-amber-400' : highlight ? 'text-emerald-400' : 'text-text-primary';
  return (
    <div className={`rounded-xl p-3 border ${bg}`}>
      <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
        <Icon size={11} /> {label}
      </div>
      <div className={`text-xl font-bold ${valColor}`}>{value}</div>
    </div>
  );
}

function SubscriptionRow({ sub }: { sub: Subscription }) {
  const meta = STATUS_META[sub.status] || STATUS_META.active;
  const Icon = meta.icon;
  const customerName = sub.customers?.name || 'Cliente sem nome';
  const customerEmail = sub.customers?.email || '—';
  const planLabel = PLAN_LABEL[sub.plan_code] || sub.plan_code;
  const monthlyValue = sub.plan_code === 'yearly' ? sub.amount_cents / 12 : sub.amount_cents;
  const myCommission = Math.round(monthlyValue * ((sub.commission_percent_at_sale || 60) / 100));

  return (
    <div className="holo-card p-4 hover:border-primary/30 transition-all">
      <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
        {/* Avatar */}
        <div className="size-11 rounded-xl bg-primary/10 grid place-items-center text-base font-bold text-primary shrink-0">
          {customerName[0]?.toUpperCase()}
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <div className="font-semibold truncate">{customerName}</div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider inline-flex items-center gap-1 ${meta.color}`}>
              <Icon size={10} /> {meta.label}
            </span>
          </div>
          <div className="text-xs text-text-muted truncate">{customerEmail}</div>
          <div className="flex items-center gap-3 mt-2 text-xs text-text-dim flex-wrap">
            <span className="inline-flex items-center gap-1">
              {sub.payment_method === 'pix' ? <QrCode size={11} /> : <CreditCard size={11} />}
              {sub.payment_method === 'pix' ? 'PIX' : `Cartão ${sub.card_last_4 ? `••${sub.card_last_4}` : ''}`}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar size={11} />
              {sub.next_billing_at
                ? `Renova ${new Date(sub.next_billing_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`
                : '—'}
            </span>
          </div>
        </div>

        {/* Valores */}
        <div className="text-right shrink-0 pl-2">
          <div className="text-xs text-text-dim">{planLabel}</div>
          <div className="font-bold text-emerald-400 text-sm">+{formatBRL(myCommission)}</div>
          <div className="text-[10px] text-text-dim">/mês equiv.</div>
        </div>
      </div>

      {/* Aviso falhas */}
      {(sub.failed_charges_count || 0) > 0 && sub.status !== 'canceled' && (
        <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
          <AlertTriangle size={12} /> {sub.failed_charges_count} cobrança(s) falhada(s) — em retentativa automática
        </div>
      )}
    </div>
  );
}

function EmptyState({ search, hasAny }: { search: string; hasAny: boolean }) {
  if (search) {
    return (
      <div className="text-center py-12">
        <Search size={28} className="text-text-dim mx-auto mb-2" />
        <p className="text-text-muted text-sm">Nenhum cliente encontrado pra "{search}"</p>
      </div>
    );
  }
  if (hasAny) {
    return (
      <div className="text-center py-12">
        <Filter size={28} className="text-text-dim mx-auto mb-2" />
        <p className="text-text-muted text-sm">Nenhum cliente com esse filtro.</p>
      </div>
    );
  }
  return (
    <div className="text-center py-12 px-4">
      <div className="size-16 rounded-full bg-primary/10 grid place-items-center mx-auto mb-4">
        <Users size={28} className="text-primary" />
      </div>
      <h3 className="font-semibold mb-2">Você ainda não tem clientes</h3>
      <p className="text-text-muted text-sm mb-4 max-w-sm mx-auto">
        Compartilhe seu link de venda e quando alguém assinar, vai aparecer aqui.
      </p>
      <Link to="/comprar-chaves" className="cta-neon inline-flex items-center gap-2 text-sm !py-2">
        Ver meu link <ArrowRight size={14} />
      </Link>
    </div>
  );
}
