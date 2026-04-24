import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, TrendingUp, Package, HeadphonesIcon, Image, Smartphone, ChevronDown, Star, Sparkles } from 'lucide-react';
import { Hero3D } from '@/components/Hero3D';
import { formatBRL } from '@/lib/utils';
import { useState } from 'react';

// Preview dos planos (dados reais vem do banco em /comprar-chaves)
const plans = [
  {
    code: '7dias',
    label: '7 dias',
    icon: Zap,
    color: '#22d3ee',
    retail: 4700,
    priceFrom: 1290,
    priceTo: 2290,
    popular: false,
  },
  {
    code: '30dias',
    label: '30 dias',
    icon: TrendingUp,
    color: '#fbbf24',
    retail: 9700,
    priceFrom: 1990,
    priceTo: 3990,
    popular: false,
  },
  {
    code: 'vitalicio',
    label: 'Vitalícia',
    icon: Sparkles,
    color: '#22c55e',
    retail: 14700,
    priceFrom: 3490,
    priceTo: 5490,
    popular: true,
  },
];

const benefits = [
  { icon: TrendingUp, title: 'Alta margem', desc: 'Até 73% de lucro por venda' },
  { icon: Zap, title: 'Produto digital', desc: 'Sem estoque, sem envio' },
  { icon: HeadphonesIcon, title: 'Suporte VIP', desc: 'Grupo exclusivo de revendedores' },
  { icon: Image, title: 'Kit pronto', desc: 'Artes, vídeos e copys liberados' },
  { icon: Package, title: 'Chaves pré-geradas', desc: 'Entrega instantânea após pagamento' },
  { icon: Smartphone, title: 'Painel próprio', desc: 'Gerencie tudo em um só lugar' },
];

const testimonials = [
  { name: 'João M.', role: 'Revendedor Ouro', text: 'Em 45 dias vendi 38 chaves. Lucrei mais de R$ 4 mil com o pacote de 50.', avatar: '👨‍💻' },
  { name: 'Marcos S.', role: 'Revendedor Prata', text: 'O painel é muito fácil, os materiais de divulgação são profissionais. Recomendo.', avatar: '🧑‍💼' },
  { name: 'Ana L.', role: 'Revendedora Ouro', text: 'Comecei com o pacote de 25 e já reinvesti no de 100. A demanda é absurda.', avatar: '👩‍💼' },
];

const faqs = [
  { q: 'Como recebo as chaves?', a: 'Assim que o pagamento é confirmado, as chaves aparecem instantaneamente no seu painel em /minhas-chaves, prontas para serem repassadas aos seus clientes.' },
  { q: 'Posso vender por qualquer preço?', a: 'Sim! Você define o preço final. Sugerimos R$ 147 (preço oficial), mas pode praticar o que achar melhor para seu público.' },
  { q: 'E se o cliente pedir reembolso?', a: 'Chaves vitalícias já ativadas não têm reembolso. Caso não usada, você pode remarcar a chave como disponível e revendê-la.' },
  { q: 'Posso usar meu nome/marca?', a: 'Pode! Os materiais de divulgação são editáveis. Você vende como seu próprio negócio.' },
  { q: 'Qual o suporte que tenho?', a: 'Acesso ao grupo VIP no WhatsApp com outros revendedores + suporte direto com a nossa equipe nos dias úteis.' },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      {/* ======== HERO ======== */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center">
        {/* Mesh blobs */}
        <div className="mesh-blob" style={{ width: 600, height: 600, top: '-10%', left: '-10%', background: '#22c55e' }} />
        <div className="mesh-blob" style={{ width: 500, height: 500, bottom: '-10%', right: '-5%', background: '#22d3ee' }} />

        {/* 3D Canvas só em md+ */}
        <div className="hidden md:block">
          <Hero3D />
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-20 relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-xl"
          >
            <div className="badge-pulse mb-6">
              Programa oficial · vagas limitadas
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-[1] mb-6">
              Seja um<br />
              revendedor<br />
              <span className="text-gradient">Dev Sem Limites</span>
            </h1>
            <p className="text-lg text-text-muted mb-8 leading-relaxed">
              A extensão mais vendida pra Lovable ilimitado.<br />
              Margem de até <span className="text-primary font-semibold">R$ 100 por licença</span>.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <Link to="/cadastrar" className="cta-neon inline-flex items-center gap-2">
                <span className="relative z-10 flex items-center gap-2">
                  Quero ser revendedor <ArrowRight size={18} />
                </span>
              </Link>
              <Link to="/como-funciona" className="cta-ghost">
                Como funciona
              </Link>
            </div>
            <div className="flex items-center gap-6 text-sm text-text-muted">
              <div className="flex -space-x-2">
                {['🧑‍💻', '👨‍💼', '👩‍💼', '🧑‍🚀'].map((e, i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 flex items-center justify-center text-xl bg-deep" style={{ borderColor: '#05070d' }}>{e}</div>
                ))}
              </div>
              <div>
                <div className="font-semibold text-text-primary">+127 revendedores</div>
                <div className="text-xs">gerando renda agora</div>
              </div>
            </div>
          </motion.div>

          {/* Placeholder no mobile */}
          <div className="md:hidden relative h-80">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-48 w-48 rounded-full bg-gradient-to-br from-primary to-accent-cyan animate-float shadow-2xl shadow-primary/50" style={{ filter: 'blur(2px)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ======== COMO FUNCIONA ======== */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <div className="text-sm font-semibold text-primary mb-3">COMO FUNCIONA</div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">3 passos pra começar</h2>
            <p className="text-text-muted">Do cadastro à primeira venda em menos de 24 horas.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: '01', title: 'Cadastra-se por R$ 9,90', desc: 'Acesso vitalício ao painel de revenda. Pagamento único.' },
              { n: '02', title: 'Compra chaves em lote', desc: 'A partir de R$ 34,90 por chave. Entrega instantânea.' },
              { n: '03', title: 'Revende por até R$ 147', desc: 'Margem de ~R$ 107 por licença vendida. Lucro direto no seu bolso.' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="holo-card p-8"
              >
                <div className="text-5xl font-display font-bold text-gradient mb-4">{step.n}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-text-muted">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== PLANOS ======== */}
      <section className="py-24 relative">
        <div className="mesh-blob" style={{ width: 700, height: 700, top: '30%', left: '40%', background: '#22c55e', opacity: 0.08 }} />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <div className="text-sm font-semibold text-primary mb-3">PLANOS · QUANTIDADE CUSTOMIZÁVEL</div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Compre a partir de 1 chave</h2>
            <p className="text-text-muted">Escolha a duração da licença e a quantidade. Quanto mais chaves, menor o custo.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {plans.map((p, i) => (
              <motion.div
                key={p.code}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`holo-card p-7 relative ${p.popular ? 'holo-permanent lg:scale-105' : ''}`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold bg-gradient-to-r from-accent-gold to-amber-500 text-void shadow-lg shadow-amber-500/50">
                    🏆 MAIS VENDIDO
                  </div>
                )}

                <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${p.color}15`, border: `1px solid ${p.color}35` }}>
                  <p.icon size={22} style={{ color: p.color }} />
                </div>

                <div className="text-2xl font-display font-bold mb-1">{p.label}</div>
                <div className="text-sm text-text-muted mb-6">
                  Cliente final paga <span className="font-mono font-tabular text-text-primary font-semibold">{formatBRL(p.retail)}</span>
                </div>

                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between items-baseline">
                    <span className="text-text-muted">Seu preço/un</span>
                    <span className="font-mono font-tabular">
                      <span className="text-text-primary font-semibold">{formatBRL(p.priceFrom)}</span>
                      <span className="text-text-dim"> – {formatBRL(p.priceTo)}</span>
                    </span>
                  </div>
                  <div className="text-xs text-text-dim">
                    A partir de R$ {(p.priceFrom / 100).toFixed(2)} comprando 100+ chaves
                  </div>
                  <div className="h-px my-3" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="flex justify-between items-baseline">
                    <span className="text-primary font-semibold">Margem</span>
                    <span className="font-bold text-primary font-mono font-tabular">
                      até {Math.round(((p.retail - p.priceFrom) / p.retail) * 100)}%
                    </span>
                  </div>
                </div>

                <Link to="/cadastrar" className={p.popular ? 'cta-neon w-full block text-center' : 'cta-ghost w-full block text-center'}>
                  <span className="relative z-10">Começar agora</span>
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-text-muted mt-10">
            Preços escalonados · compre desde <span className="text-primary font-semibold">1 chave</span> até quantas quiser
          </p>
        </div>
      </section>

      {/* ======== BENEFITS ======== */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <div className="text-sm font-semibold text-primary mb-3">VANTAGENS</div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Por que ser revendedor?</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="holo-card p-6 flex gap-4"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <b.icon size={22} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">{b.title}</h3>
                  <p className="text-sm text-text-muted">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== DEPOIMENTOS ======== */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <div className="text-sm font-semibold text-primary mb-3">DEPOIMENTOS</div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Revendedores reais, resultados reais</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="holo-card p-6"
              >
                <div className="flex gap-1 mb-3 text-accent-gold">
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="currentColor" />)}
                </div>
                <p className="text-text-muted mb-5 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-accent-cyan/30 flex items-center justify-center text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-text-muted">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== FAQ ======== */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="text-sm font-semibold text-primary mb-3">FAQ</div>
            <h2 className="text-4xl sm:text-5xl font-bold">Dúvidas frequentes</h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="holo-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold">{f.q}</span>
                  <ChevronDown size={18} className={`transition-transform ${openFaq === i ? 'rotate-180 text-primary' : 'text-text-muted'}`} />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 text-text-muted">{f.a}</div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== CTA FINAL ======== */}
      <section className="py-24 relative overflow-hidden">
        <div className="mesh-blob" style={{ width: 800, height: 800, top: '-20%', left: '20%', background: '#22c55e', opacity: 0.12 }} />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="holo-card holo-permanent p-12 sm:p-16 text-center max-w-3xl mx-auto"
          >
            <h2 className="text-4xl sm:text-6xl font-display font-bold mb-4">
              Bora <span className="text-gradient">lucrar</span>?
            </h2>
            <p className="text-lg text-text-muted mb-8 max-w-xl mx-auto">
              R$ 9,90 únicos pra começar. Acesso vitalício ao painel.
            </p>
            <Link to="/cadastrar" className="cta-neon inline-flex items-center gap-2 text-lg !px-10 !py-4">
              <span className="relative z-10 flex items-center gap-2">
                Quero começar agora <ArrowRight size={20} />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
