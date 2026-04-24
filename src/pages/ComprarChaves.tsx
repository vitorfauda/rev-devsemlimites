import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, type ResellerPackage, type ResellerPurchase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Check, Copy, QrCode, X } from 'lucide-react';
import { toast } from 'sonner';
import { LoaderRing } from '@/components/LoaderRing';
import { copyToClipboard, formatBRL, formatDateTime } from '@/lib/utils';

export default function ComprarChaves() {
  const { reseller } = useAuth();
  const [pkgs, setPkgs] = useState<ResellerPackage[]>([]);
  const [purchases, setPurchases] = useState<ResellerPurchase[]>([]);
  const [selected, setSelected] = useState<ResellerPackage | null>(null);
  const [paying, setPaying] = useState(false);
  const [pix, setPix] = useState<{ qr: string | null; text: string | null; purchaseId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadAll = async () => {
    const [{ data: p }, { data: pu }] = await Promise.all([
      supabase.from('reseller_packages').select('*').eq('active', true).order('size'),
      reseller
        ? supabase.from('reseller_purchases').select('*').eq('reseller_id', reseller.id).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] as ResellerPurchase[] }),
    ]);
    setPkgs((p || []) as ResellerPackage[]);
    setPurchases((pu || []) as ResellerPurchase[]);
  };

  useEffect(() => { loadAll(); }, [reseller]);

  const startPayment = async () => {
    if (!reseller || !selected) return;
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-reseller-payment', {
        body: { type: 'package', reseller_id: reseller.id, package_size: selected.size, payment_method: 'pix' },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || 'Falha ao gerar PIX');

      // Busca purchase criada
      await loadAll();
      const { data: pu } = await supabase.from('reseller_purchases')
        .select('*').eq('payment_id', data.payment_id).single();

      setPix({ qr: data.qr_code_base64, text: data.qr_code_text, purchaseId: pu?.id || '' });

      // Polling
      const poll = window.setInterval(async () => {
        const { data: r } = await supabase.from('reseller_purchases')
          .select('payment_status').eq('id', pu?.id).single();
        if (r?.payment_status === 'paid') {
          clearInterval(poll);
          toast.success('Pagamento confirmado! Chaves estão sendo geradas...');
          setTimeout(() => {
            window.location.href = '/minhas-chaves';
          }, 1500);
        }
      }, 4000);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPaying(false);
    }
  };

  const handleCopy = async () => {
    if (!pix?.text) return;
    await copyToClipboard(pix.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const close = () => { setSelected(null); setPix(null); };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-4xl font-display font-bold mb-2">Comprar chaves</h1>
      <p className="text-text-muted mb-10">Escolha um pacote e pague via PIX. As chaves são geradas automaticamente após confirmação.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
        {pkgs.map((pkg, i) => {
          const profit = pkg.size * 14700 - pkg.total_cents;
          return (
            <motion.button
              key={pkg.id}
              onClick={() => setSelected(pkg)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`holo-card text-left p-6 ${pkg.is_popular ? 'holo-permanent' : ''}`}
            >
              {pkg.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold bg-gradient-to-r from-accent-gold to-amber-500 text-void shadow-lg shadow-amber-500/50">
                  🏆 MAIS VENDIDO
                </div>
              )}
              <div className="text-5xl font-display font-bold">{pkg.size}</div>
              <div className="text-sm text-text-muted mb-5">chaves</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-text-muted">Preço/un</span><span className="font-mono font-tabular font-semibold">{formatBRL(pkg.unit_price_cents)}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Total</span><span className="font-mono font-tabular font-semibold">{formatBRL(pkg.total_cents)}</span></div>
                <div className="flex justify-between pt-2 border-t mt-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-primary">Lucro R$147/un</span>
                  <span className="font-bold text-primary font-mono font-tabular">{formatBRL(profit)}</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Histórico */}
      <h2 className="text-2xl font-display font-bold mb-4">Histórico de compras</h2>
      <div className="holo-card overflow-hidden">
        {purchases.length === 0 ? (
          <p className="p-6 text-sm text-text-muted text-center">Nenhuma compra ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-text-muted text-left" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <th className="p-4 font-medium">Data</th>
                  <th className="p-4 font-medium">Pacote</th>
                  <th className="p-4 font-medium">Valor</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="p-4">{formatDateTime(p.created_at)}</td>
                    <td className="p-4 font-semibold">{p.package_size} chaves</td>
                    <td className="p-4 font-mono font-tabular">{formatBRL(p.total_cents)}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        p.payment_status === 'paid' ? 'bg-primary/15 text-primary' :
                        p.payment_status === 'pending' ? 'bg-accent-gold/15 text-accent-gold' :
                        'bg-red-500/15 text-red-400'
                      }`}>
                        {p.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer lateral */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={close}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-deep border-l h-full overflow-y-auto p-6"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <button onClick={close} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5">
              <X size={18} />
            </button>

            <h2 className="text-2xl font-display font-bold mb-2">Pacote {selected.size} chaves</h2>
            <p className="text-sm text-text-muted mb-6">Total: <span className="text-primary font-semibold font-mono font-tabular">{formatBRL(selected.total_cents)}</span></p>

            {!pix && (
              <button onClick={startPayment} disabled={paying} className="cta-neon w-full flex items-center justify-center gap-2">
                {paying ? <LoaderRing size={18} /> : <span className="relative z-10 flex items-center gap-2"><QrCode size={16} /> Gerar PIX</span>}
              </button>
            )}

            {pix && (
              <div className="space-y-4">
                {pix.qr && (
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-xl">
                      <img src={`data:image/png;base64,${pix.qr}`} alt="QR Code" className="w-56 h-56" />
                    </div>
                  </div>
                )}
                {pix.text && (
                  <div>
                    <label className="block text-sm text-text-muted mb-2">PIX Copia e Cola</label>
                    <div className="flex gap-2">
                      <input readOnly value={pix.text} className="input-dsl font-mono text-xs" />
                      <button onClick={handleCopy} className="cta-ghost !px-4 shrink-0">
                        {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-center gap-3 text-sm text-text-muted p-4 rounded-xl bg-white/5">
                  <LoaderRing size={16} />
                  Aguardando pagamento...
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
