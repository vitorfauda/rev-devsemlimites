import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Key, CheckCircle2, TrendingUp, DollarSign, ArrowRight, ShoppingBag, Image, KeyRound } from 'lucide-react';
import { formatBRL, formatDateTime } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LoaderRing } from '@/components/LoaderRing';

export default function Dashboard() {
  const { reseller } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ bought: 0, available: 0, sold: 0, potential: 0 });
  const [chart, setChart] = useState<{ date: string; vendas: number }[]>([]);
  const [activity, setActivity] = useState<{ type: string; text: string; when: string }[]>([]);

  useEffect(() => {
    if (!reseller) return;
    (async () => {
      const [{ data: lic }, { data: purchases }] = await Promise.all([
        supabase.from('licenses').select('id, sold_at, sold_price_cents, created_at, license_key').eq('reseller_id', reseller.id),
        supabase.from('reseller_purchases').select('id, package_size, payment_status, created_at').eq('reseller_id', reseller.id).order('created_at', { ascending: false }).limit(5),
      ]);

      const all = lic || [];
      const soldArr = all.filter(l => l.sold_at);
      const availableArr = all.filter(l => !l.sold_at);
      setStats({
        bought: all.length,
        available: availableArr.length,
        sold: soldArr.length,
        potential: availableArr.length * 14700,
      });

      // Gráfico: últimos 30 dias
      const days: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        days[d.toISOString().slice(0, 10)] = 0;
      }
      soldArr.forEach((l) => {
        if (!l.sold_at) return;
        const k = l.sold_at.slice(0, 10);
        if (k in days) days[k]++;
      });
      setChart(Object.entries(days).map(([date, vendas]) => ({ date: date.slice(5), vendas })));

      // Atividade
      const acts: { type: string; text: string; when: string }[] = [];
      (purchases || []).forEach((p) => {
        acts.push({ type: 'purchase', text: `Compra de ${p.package_size} chaves · ${p.payment_status}`, when: p.created_at });
      });
      soldArr.slice(-5).reverse().forEach((l) => {
        acts.push({ type: 'sale', text: `Chave vendida: ${l.license_key?.substring(0, 14)}...`, when: l.sold_at! });
      });
      setActivity(acts.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()).slice(0, 8));

      setLoading(false);
    })();
  }, [reseller]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><LoaderRing size={40} /></div>;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="text-sm text-text-muted">Olá,</div>
          <div className={`text-xs px-2 py-0.5 rounded-full border ${reseller?.tier === 'ouro' ? 'text-accent-gold border-accent-gold/40' : reseller?.tier === 'prata' ? 'text-text-primary border-white/30' : 'text-amber-600 border-amber-600/30'}`}>
            {reseller?.tier?.toUpperCase()}
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-8">{reseller?.name?.split(' ')[0]} 👋</h1>
      </motion.div>

      {/* Métricas */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Metric icon={Key} label="Chaves compradas" value={stats.bought.toString()} color="#22d3ee" delay={0} />
        <Metric icon={CheckCircle2} label="Disponíveis" value={stats.available.toString()} color="#22c55e" delay={0.05} />
        <Metric icon={TrendingUp} label="Vendidas" value={stats.sold.toString()} color="#fbbf24" delay={0.1} />
        <Metric icon={DollarSign} label="Receita potencial" value={formatBRL(stats.potential)} color="#d946ef" delay={0.15} />
      </div>

      {/* Gráfico */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="holo-card p-6 mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Vendas dos últimos 30 dias</h3>
          <div className="text-sm text-text-muted">{stats.sold} vendas totais</div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="fillGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#0a0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Area type="monotone" dataKey="vendas" stroke="#22c55e" strokeWidth={2} fill="url(#fillGreen)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Atalhos */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <Shortcut to="/comprar-chaves" icon={ShoppingBag} title="Comprar chaves" desc="Pacotes a partir de R$ 34,90/un" />
        <Shortcut to="/minhas-chaves" icon={KeyRound} title="Minhas chaves" desc={`${stats.available} disponíveis`} />
        <Shortcut to="/materiais" icon={Image} title="Materiais" desc="Kit de divulgação" />
      </div>

      {/* Atividade */}
      <div className="holo-card p-6">
        <h3 className="font-bold mb-4">Atividade recente</h3>
        {activity.length === 0 ? (
          <p className="text-sm text-text-muted py-4">Nenhuma atividade ainda. Compre seu primeiro pacote!</p>
        ) : (
          <div className="space-y-3">
            {activity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${a.type === 'sale' ? 'bg-accent-gold/10 text-accent-gold' : 'bg-primary/10 text-primary'}`}>
                  {a.type === 'sale' ? <TrendingUp size={14} /> : <ShoppingBag size={14} />}
                </div>
                <div className="flex-1 text-sm">{a.text}</div>
                <div className="text-xs text-text-dim">{formatDateTime(a.when)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, color, delay }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="holo-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div className="text-3xl font-display font-bold font-tabular mb-1">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </motion.div>
  );
}

function Shortcut({ to, icon: Icon, title, desc }: any) {
  return (
    <Link to={to} className="holo-card p-6 block group">
      <Icon size={24} className="text-primary mb-3" />
      <h4 className="font-bold mb-1 flex items-center justify-between">
        {title}
        <ArrowRight size={16} className="text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </h4>
      <p className="text-sm text-text-muted">{desc}</p>
    </Link>
  );
}
