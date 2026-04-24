import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, type ResellerPurchase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Check, Copy, Minus, Plus, QrCode, Sparkles, TrendingUp, X, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { LoaderRing } from '@/components/LoaderRing';
import { copyToClipboard, formatBRL, formatDateTime } from '@/lib/utils';

type PlanCode = '7dias' | '30dias' | 'vitalicio';

type PricingTier = {
  id: string;
  plan_code: string;
  min_qty: number;
  max_qty: number | null;
  unit_price_cents: number;
};

const planMeta: Record<PlanCode, { label: string; subtitle: string; retail: number; icon: any; color: string }> = {
  '7dias':     { label: '7 dias',    subtitle: 'Licença semanal',  retail: 4700,  icon: Zap,       color: '#22d3ee' },
  '30dias':    { label: '30 dias',   subtitle: 'Licença mensal',   retail: 9700,  icon: TrendingUp, color: '#fbbf24' },
  'vitalicio': { label: 'Vitalícia', subtitle: 'Pagamento único',  retail: 14700, icon: Sparkles,  color: '#22c55e' },
};

export default function ComprarChaves() {
  const { reseller } = useAuth();
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [purchases, setPurchases] = useState<ResellerPurchase[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanCode>('vitalicio');
  const minQty = reseller?.min_purchase_quantity || 2;
  const [quantity, setQuantity] = useState<number>(minQty);

  useEffect(() => { setQuantity(q => Math.max(minQty, q)); }, [minQty]);

  const [openSheet, setOpenSheet] = useState(false);
  const [paying, setPaying] = useState(false);
  const [pix, setPix] = useState<{ qr: string | null; text: string | null; purchaseId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadAll = async () => {
    const [{ data: t }, { data: pu }] = await Promise.all([
      supabase.from('reseller_pricing_tiers').select('*').eq('active', true).order('min_qty'),
      reseller
        ? supabase.from('reseller_purchases').select('*').eq('reseller_id', reseller.id).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] as ResellerPurchase[] }),
    ]);
    setTiers((t || []) as PricingTier[]);
    setPurchases((pu || []) as ResellerPurchase[]);
  };

  useEffect(() => { loadAll(); }, [reseller]);

  const tiersForPlan = useMemo(
    () => tiers.filter(t => t.plan_code === selectedPlan).sort((a, b) => a.min_qty - b.min_qty),
    [tiers, selectedPlan]
  );

  const currentTier = useMemo(() => {
    return tiersForPlan.find(t =>
      quantity >= t.min_qty && (t.max_qty === null || quantity <= t.max_qty)
    );
  }, [tiersForPlan, quantity]);

  const unitPrice = currentTier?.unit_price_cents || 0;
  const total = unitPrice * quantity;
  const retail = planMeta[selectedPlan].retail;
  const totalRetail = retail * quantity;
  const profit = totalRetail - total;
  const marginPct = total > 0 ? Math.round((profit / totalRetail) * 100) : 0;

  const nextTier = useMemo(() => {
    return tiersForPlan.find(t => t.min_qty > quantity);
  }, [tiersForPlan, quantity]);

  const qtyToNextTier = nextTier ? nextTier.min_qty - quantity : 0;

  const startPayment = async () => {
    if (!reseller) return;
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-reseller-payment', {
        body: { type: 'package', reseller_id: reseller.id, plan_code: selectedPlan, quantity },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || 'Falha ao gerar PIX');

      await loadAll();
      const { data: pu } = await supabase.from('reseller_purchases')
        .select('*').eq('payment_id', data.payment_id).single();

      setPix({ qr: data.qr_code_base64, text: data.qr_code_text, purchaseId: pu?.id || '' });

      const poll = window.setInterval(async () => {
        const { data: r } = await supabase.from('reseller_purchases')
          .select('payment_status').eq('id', pu?.id).single();
        if (r?.payment_status === 'paid') {
          clearInterval(poll);
          toast.success('Pagamento confirmado! Gerando chaves...');
          setTimeout(() => { window.location.href = '/minhas-chaves'; }, 1500);
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
    toast.success('Copiado!');
  };

  const closeSheet = () => { setOpenSheet(false); setPix(null); };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">Comprar chaves</h1>
      <p className="text-text-muted mb-10">
        Escolha o plano, a quantidade e pague via PIX. As chaves são geradas automaticamente após confirmação.
      </p>

      {/* ================= SELECTOR DE PLANO ================= */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {(Object.keys(planMeta) as PlanCode[]).map((code) => {
          const m = planMeta[code];
          const active = selectedPlan === code;
          return (
            <motion.button
              key={code}
              onClick={() => setSelectedPlan(code)}
              whileTap={{ scale: 0.98 }}
              className={`holo-card p-5 text-left transition-all ${active ? 'holo-permanent !border-primary/40' : ''}`}
              style={active ? { boxShadow: '0 20px 60px -10px rgba(16, 248, 144, 0.25)' } : {}}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${m.color}15`, border: `1px solid ${m.color}35` }}>
                  <m.icon size={18} style={{ color: m.color }} />
                </div>
                {active && (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check size={14} className="text-void" />
                  </div>
                )}
              </div>
              <div className="text-xl font-display font-bold mb-0.5">{m.label}</div>
              <div className="text-xs text-text-muted mb-3">{m.subtitle}</div>
              <div className="text-xs text-text-muted">
                Cliente paga <span className="font-mono font-tabular text-text-primary">{formatBRL(m.retail)}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ================= QUANTIDADE + PREÇO ================= */}
      <div className="grid md:grid-cols-[1fr_1.2fr] gap-6 mb-10">
        {/* Selector de quantidade */}
        <div className="holo-card holo-permanent p-6">
          <h3 className="font-display font-bold text-lg mb-1">Quantidade</h3>
          <p className="text-sm text-text-muted mb-5">
            Mínimo <span className="text-primary font-semibold">{minQty} {minQty === 1 ? 'chave' : 'chaves'}</span> · sem limite máximo
          </p>

          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => setQuantity(Math.max(minQty, quantity - 1))}
              className="h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all disabled:opacity-40"
              disabled={quantity <= minQty}
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              min={minQty}
              max={500}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(minQty, Math.min(500, parseInt(e.target.value) || minQty)))}
              className="input-dsl text-center text-2xl font-display font-bold font-tabular"
            />
            <button
              onClick={() => setQuantity(Math.min(500, quantity + 1))}
              className="h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Botões de atalho */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[minQty, 5, 10, 25, 50, 100].filter((v, i, a) => a.indexOf(v) === i).map(n => (
              <button
                key={n}
                onClick={() => setQuantity(n)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                  quantity === n ? 'bg-primary text-void font-semibold' : 'bg-white/5 text-text-muted hover:bg-white/10'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Próximo tier */}
          {nextTier && (
            <div className="text-xs p-3 rounded-lg bg-primary/5 border border-primary/20 text-text-muted">
              <span className="text-primary font-semibold">+{qtyToNextTier} chaves</span> e o preço/un cai pra{' '}
              <span className="font-mono font-tabular text-text-primary font-semibold">
                {formatBRL(nextTier.unit_price_cents)}
              </span>
            </div>
          )}
        </div>

        {/* Resumo do preço */}
        <div className="holo-card holo-permanent p-6 relative overflow-hidden">
          <div
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-30"
            style={{ background: `radial-gradient(circle, ${planMeta[selectedPlan].color}, transparent 70%)`, filter: 'blur(40px)' }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Seu custo</div>
                <div className="text-4xl sm:text-5xl font-display font-bold font-tabular mt-1">{formatBRL(total)}</div>
                <div className="text-xs text-text-muted mt-1 font-mono font-tabular">
                  {quantity}× {formatBRL(unitPrice)} · {planMeta[selectedPlan].label}
                </div>
              </div>
            </div>

            <div className="h-px my-4" style={{ background: 'rgba(255,255,255,0.06)' }} />

            <div className="space-y-2 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-text-muted">Valor de venda ({formatBRL(retail)}/un)</span>
                <span className="font-mono font-tabular font-semibold">{formatBRL(totalRetail)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Seu investimento</span>
                <span className="font-mono font-tabular text-red-400">-{formatBRL(total)}</span>
              </div>
              <div className="h-px my-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="flex justify-between items-center">
                <span className="font-semibold text-primary">Lucro potencial</span>
                <div className="text-right">
                  <div className="font-mono font-tabular font-bold text-primary text-xl">{formatBRL(profit)}</div>
                  <div className="text-xs text-primary/70">{marginPct}% de margem</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setOpenSheet(true)}
              disabled={quantity < minQty}
              className="cta-neon w-full flex items-center justify-center gap-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                <QrCode size={16} /> Pagar {formatBRL(total)} via PIX
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= TABELA DE TIERS ================= */}
      <div className="holo-card p-6 mb-10">
        <h3 className="font-display font-bold text-lg mb-4">Tabela de preços · {planMeta[selectedPlan].label}</h3>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-text-muted text-left text-xs uppercase tracking-wider" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <th className="p-3 font-medium">Quantidade</th>
                <th className="p-3 font-medium">Preço/un</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium text-right">Lucro potencial</th>
              </tr>
            </thead>
            <tbody>
              {tiersForPlan.map((t) => {
                const example = t.min_qty;
                const exampleTotal = t.unit_price_cents * example;
                const exampleRetail = retail * example;
                const exampleProfit = exampleRetail - exampleTotal;
                const isCurrent = currentTier?.id === t.id;
                return (
                  <tr
                    key={t.id}
                    className={`border-b transition-all ${isCurrent ? 'bg-primary/5' : 'hover:bg-white/5'}`}
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {t.min_qty}{t.max_qty ? `-${t.max_qty}` : '+'}
                        {isCurrent && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">atual</span>}
                      </div>
                    </td>
                    <td className="p-3 font-mono font-tabular">{formatBRL(t.unit_price_cents)}</td>
                    <td className="p-3 font-mono font-tabular text-text-muted">a partir de {formatBRL(exampleTotal)}</td>
                    <td className="p-3 font-mono font-tabular text-right text-primary">+{formatBRL(exampleProfit)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= HISTÓRICO ================= */}
      <h2 className="text-xl sm:text-2xl font-display font-bold mb-4">Histórico de compras</h2>
      <div className="holo-card overflow-hidden">
        {purchases.length === 0 ? (
          <p className="p-6 text-sm text-text-muted text-center">Nenhuma compra ainda.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-text-muted text-left text-xs uppercase tracking-wider" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <th className="p-4 font-medium">Data</th>
                  <th className="p-4 font-medium">Plano</th>
                  <th className="p-4 font-medium">Qtd</th>
                  <th className="p-4 font-medium">Valor</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="p-4 text-text-muted">{formatDateTime(p.created_at)}</td>
                    <td className="p-4 font-semibold">{planMeta[(p as any).plan_code as PlanCode]?.label || '—'}</td>
                    <td className="p-4 font-mono font-tabular">{p.package_size}</td>
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

      {/* ================= DRAWER PAGAMENTO ================= */}
      {openSheet && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={closeSheet}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-deep border-l h-full overflow-y-auto p-6"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <button onClick={closeSheet} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5">
              <X size={18} />
            </button>

            <h2 className="text-2xl font-display font-bold mb-1">
              {quantity}× chaves {planMeta[selectedPlan].label}
            </h2>
            <p className="text-sm text-text-muted mb-6">
              Total: <span className="text-primary font-semibold font-mono font-tabular">{formatBRL(total)}</span>
              {' · '}Lucro: <span className="text-primary font-semibold font-mono font-tabular">{formatBRL(profit)}</span>
            </p>

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
