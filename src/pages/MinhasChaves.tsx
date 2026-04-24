import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, type License } from '@/lib/supabase';
import { Check, Copy, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard, formatBRL, formatDate, maskPhone } from '@/lib/utils';
import { motion } from 'framer-motion';
import { LoaderRing } from '@/components/LoaderRing';

type Tab = 'all' | 'available' | 'sold';

export default function MinhasChaves() {
  const { reseller } = useAuth();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sellModal, setSellModal] = useState<License | null>(null);

  const load = async () => {
    if (!reseller) return;
    setLoading(true);
    const { data } = await supabase.from('licenses')
      .select('*').eq('reseller_id', reseller.id)
      .order('created_at', { ascending: false });
    setLicenses((data || []) as License[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [reseller]);

  const filtered = licenses.filter(l => {
    if (tab === 'available' && l.sold_at) return false;
    if (tab === 'sold' && !l.sold_at) return false;
    if (search && !l.license_key?.toLowerCase().includes(search.toLowerCase()) && !l.sold_to_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: licenses.length,
    available: licenses.filter(l => !l.sold_at).length,
    sold: licenses.filter(l => l.sold_at).length,
  };

  const handleCopy = async (id: string, key: string) => {
    await copyToClipboard(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Chave copiada!');
  };

  const exportCSV = () => {
    const lines = ['chave,status,cliente,whatsapp,vendida_em,valor'];
    licenses.forEach(l => {
      lines.push([
        l.license_key,
        l.sold_at ? 'vendida' : 'disponivel',
        l.sold_to_name || '',
        l.sold_to_whatsapp || '',
        l.sold_at || '',
        l.sold_price_cents ? (l.sold_price_cents / 100).toFixed(2) : '',
      ].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `chaves-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><LoaderRing size={40} /></div>;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Minhas chaves</h1>
          <p className="text-text-muted">Gerencie suas licenças e marque as vendidas</p>
        </div>
        <button onClick={exportCSV} className="cta-ghost text-sm">Exportar CSV</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {([
          ['all', `Todas (${counts.all})`],
          ['available', `Disponíveis (${counts.available})`],
          ['sold', `Vendidas (${counts.sold})`],
        ] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as Tab)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            tab === k ? 'bg-primary text-void' : 'bg-white/5 text-text-muted hover:text-text-primary'
          }`}>
            {l}
          </button>
        ))}
      </div>

      {/* Busca */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por chave ou cliente..."
          className="input-dsl pl-10"
        />
      </div>

      {/* Tabela */}
      <div className="holo-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            {licenses.length === 0 ? 'Você ainda não tem chaves. Compre um pacote!' : 'Nenhuma chave encontrada.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-text-muted text-left" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <th className="p-4 font-medium">Chave</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Cliente</th>
                  <th className="p-4 font-medium">Vendida em</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="p-4 font-mono text-xs">{l.license_key}</td>
                    <td className="p-4">
                      {l.sold_at ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-accent-gold/15 text-accent-gold">Vendida</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary">Disponível</span>
                      )}
                    </td>
                    <td className="p-4 text-text-muted">{l.sold_to_name || '—'}</td>
                    <td className="p-4 text-text-muted">{formatDate(l.sold_at)}</td>
                    <td className="p-4 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => handleCopy(l.id, l.license_key)} className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center">
                          {copiedId === l.id ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                        </button>
                        {!l.sold_at && (
                          <button onClick={() => setSellModal(l)} className="text-xs px-3 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                            Marcar vendida
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {sellModal && <SellModal license={sellModal} onClose={() => setSellModal(null)} onDone={() => { setSellModal(null); load(); }} />}
    </div>
  );
}

function SellModal({ license, onClose, onDone }: { license: License; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [price, setPrice] = useState('147.00');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) { toast.error('Informe o nome do cliente'); return; }
    setSaving(true);
    const priceCents = Math.round(parseFloat(price.replace(',', '.')) * 100);
    const { error } = await supabase.from('licenses').update({
      sold_to_name: name.trim(),
      sold_to_whatsapp: whatsapp.replace(/\D/g, ''),
      sold_at: new Date().toISOString(),
      sold_price_cents: priceCents,
    }).eq('id', license.id);
    setSaving(false);
    if (error) { toast.error('Erro ao salvar: ' + error.message); return; }
    toast.success('Chave marcada como vendida!');
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="holo-card holo-permanent relative w-full max-w-md p-6"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5">
          <X size={18} />
        </button>
        <h3 className="text-xl font-display font-bold mb-1">Marcar como vendida</h3>
        <p className="text-xs text-text-muted font-mono mb-5">{license.license_key}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-2">Nome do cliente</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input-dsl" placeholder="João Silva" />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-2">WhatsApp (opcional)</label>
            <input value={whatsapp} onChange={e => setWhatsapp(maskPhone(e.target.value))} maxLength={15} className="input-dsl" placeholder="(27) 99999-9999" />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-2">Valor vendido (R$)</label>
            <input value={price} onChange={e => setPrice(e.target.value)} className="input-dsl font-mono" placeholder="147.00" />
            <div className="text-xs text-text-muted mt-1">Sugerido: {formatBRL(14700)}</div>
          </div>
          <button onClick={save} disabled={saving} className="cta-neon w-full">
            <span className="relative z-10">{saving ? 'Salvando...' : 'Confirmar venda'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
