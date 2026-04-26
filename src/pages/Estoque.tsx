// Estoque: chaves compradas pelo reseller (vendidas + em estoque)
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Key, Search, Copy, Check, ArrowRight, Filter, RefreshCw, Package, ShoppingCart, CheckCircle2,
} from 'lucide-react';
import { copyToClipboard, formatDateTime } from '@/lib/utils';
import { LoaderRing } from '@/components/LoaderRing';
import { Badge, Button, Card, PageHeader, Section, Stat, inputClass } from '@/components/ui';

interface LicenseRow {
  id: string;
  license_key: string;
  status: string;
  activated_at: string | null;
  expires_at: string | null;
  sold_at: string | null;
  created_at: string;
  notes: string | null;
  plans?: { code?: string; name?: string };
  customers?: { name?: string; phone?: string; email?: string };
}

const PLAN_LABEL: Record<string, string> = {
  '7dias': '7 dias',
  '30dias': '30 dias',
  vitalicio: 'Vitalícia',
};

export default function Estoque() {
  const { reseller } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'sold' | 'active' | 'expired'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    if (!reseller) return;
    setRefreshing(true);
    const { data } = await supabase
      .from('licenses')
      .select('*, plans(code,name), customers(name,phone,email)')
      .eq('reseller_id', reseller.id)
      .order('created_at', { ascending: false });
    setLicenses((data || []) as any);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reseller?.id]);

  const counts = useMemo(() => {
    const total = licenses.length;
    const sold = licenses.filter((l) => l.sold_at !== null).length;
    const available = total - sold;
    const active = licenses.filter(
      (l) => l.status === 'active' && (!l.expires_at || new Date(l.expires_at) > new Date()),
    ).length;
    const expired = licenses.filter((l) => l.expires_at && new Date(l.expires_at) <= new Date()).length;
    return { total, sold, available, active, expired };
  }, [licenses]);

  const filtered = useMemo(() => {
    return licenses.filter((l) => {
      if (filter === 'available' && l.sold_at) return false;
      if (filter === 'sold' && !l.sold_at) return false;
      if (filter === 'active' && !(l.status === 'active' && (!l.expires_at || new Date(l.expires_at) > new Date())))
        return false;
      if (filter === 'expired' && !(l.expires_at && new Date(l.expires_at) <= new Date())) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.license_key.toLowerCase().includes(q) ||
          l.customers?.name?.toLowerCase().includes(q) ||
          l.customers?.phone?.includes(q) ||
          l.customers?.email?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [licenses, filter, search]);

  const copyKey = async (id: string, key: string) => {
    await copyToClipboard(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    toast.success('Chave copiada');
  };

  if (loading)
    return (
      <div className="min-h-[60vh] grid place-items-center text-[var(--color-text-muted)]">
        <LoaderRing size={28} />
      </div>
    );

  return (
    <Section>
      <PageHeader
        title="Meu estoque"
        description="Chaves de licença compradas · disponíveis e vendidas"
        actions={
          <>
            <Button onClick={load} variant="secondary" size="sm" disabled={refreshing}>
              <RefreshCw size={13} className={refreshing ? 'spin' : ''} /> Atualizar
            </Button>
            <Link to="/loja">
              <Button size="sm">
                <ShoppingCart size={13} /> Comprar mais
              </Button>
            </Link>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Total" value={String(counts.total)} icon={Package} />
        <Stat label="Disponíveis" value={String(counts.available)} icon={Key} />
        <Stat label="Vendidas" value={String(counts.sold)} icon={CheckCircle2} />
        <Stat label="Expiradas" value={String(counts.expired)} icon={Filter} />
      </div>

      {licenses.length === 0 ? (
        <Card className="p-12 text-center">
          <Package size={28} className="text-[var(--color-text-dim)] mx-auto mb-3" />
          <div className="font-medium mb-1">Você ainda não tem chaves</div>
          <p className="text-sm text-[var(--color-text-muted)] max-w-sm mx-auto mb-5">
            Compre lotes de chaves com desconto progressivo e revenda pra seus clientes pelo preço que quiser.
          </p>
          <Link to="/loja">
            <Button>
              <ShoppingCart size={14} /> Ir pra loja <ArrowRight size={13} />
            </Button>
          </Link>
        </Card>
      ) : (
        <Card>
          <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 max-w-sm min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar chave, cliente, email…"
                className={inputClass + ' pl-9 h-9'}
              />
            </div>
            <div className="flex gap-1 ml-auto text-xs">
              {([
                ['all', `Todas (${counts.total})`],
                ['available', `Disponíveis (${counts.available})`],
                ['sold', `Vendidas (${counts.sold})`],
                ['active', `Ativas (${counts.active})`],
                ['expired', `Expiradas (${counts.expired})`],
              ] as const).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={
                    'px-3 py-1.5 rounded-md ' +
                    (filter === k
                      ? 'bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]')
                  }
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-[var(--color-text-muted)]">
              Nenhuma chave encontrada com esse filtro.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--color-text-dim)] border-b border-[var(--color-border)]">
                  <th className="font-normal py-3 pl-6">Chave</th>
                  <th className="font-normal">Plano</th>
                  <th className="font-normal">Cliente</th>
                  <th className="font-normal">Status</th>
                  <th className="font-normal">Compra</th>
                  <th className="font-normal w-12" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const expired = l.expires_at && new Date(l.expires_at) <= new Date();
                  const isSold = !!l.sold_at;
                  const planCode = l.plans?.code || '';
                  return (
                    <tr key={l.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)]/40">
                      <td className="py-3 pl-6">
                        <div className="flex items-center gap-2 group">
                          <Key size={12} className="text-[var(--color-text-dim)] shrink-0" />
                          <code className="font-mono text-xs">{l.license_key}</code>
                          <button
                            onClick={() => copyKey(l.id, l.license_key)}
                            className="opacity-0 group-hover:opacity-100 text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-opacity"
                            title="Copiar"
                          >
                            {copiedId === l.id ? <Check size={11} className="text-[var(--color-primary)]" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>
                      <td className="text-[var(--color-text-muted)]">{PLAN_LABEL[planCode] || planCode || '—'}</td>
                      <td>
                        {l.customers?.name ? (
                          <div>
                            <div className="text-sm">{l.customers.name}</div>
                            <div className="text-xs text-[var(--color-text-dim)]">{l.customers.phone || l.customers.email}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-text-dim)]">—</span>
                        )}
                      </td>
                      <td>
                        {!isSold ? (
                          <Badge>Em estoque</Badge>
                        ) : expired ? (
                          <Badge>Expirada</Badge>
                        ) : l.status === 'active' ? (
                          <Badge tone="success">Ativa</Badge>
                        ) : l.status === 'suspended' ? (
                          <Badge tone="danger">Suspensa</Badge>
                        ) : (
                          <Badge tone="warning">{l.status}</Badge>
                        )}
                      </td>
                      <td className="text-xs text-[var(--color-text-dim)] font-mono">
                        {formatDateTime(l.created_at)}
                      </td>
                      <td>
                        <button
                          onClick={() => copyKey(l.id, l.license_key)}
                          className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                          title="Copiar chave"
                        >
                          {copiedId === l.id ? <Check size={13} className="text-[var(--color-primary)]" /> : <Copy size={13} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      )}

      <p className="text-xs text-[var(--color-text-dim)] mt-6 text-center leading-relaxed">
        Chaves em estoque podem ser entregues pro cliente quando quiser — a contagem do plano só começa quando ele ativa na extensão.
      </p>
    </Section>
  );
}
