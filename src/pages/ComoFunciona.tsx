import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { formatBRL } from '@/lib/utils';

const steps = [
  {
    title: 'Cadastro inicial — R$ 9,90',
    desc: 'Pagamento único de ativação. Acesso vitalício ao painel de revenda, materiais de divulgação e grupo VIP.',
    points: ['Sem mensalidade', 'Sem fidelidade', 'Acesso imediato após pagamento'],
  },
  {
    title: 'Escolha plano e quantidade',
    desc: '3 planos disponíveis (7 dias, 30 dias, vitalícia) e compra desde 1 chave. Preço escala por volume.',
    points: ['7 dias: R$ 12,90 – R$ 22,90/un', '30 dias: R$ 19,90 – R$ 39,90/un', 'Vitalícia: R$ 34,90 – R$ 54,90/un', 'Sem mínimo de compra'],
  },
  {
    title: 'Entrega automática',
    desc: 'Assim que o PIX é confirmado, as chaves aparecem no seu painel prontas para uso.',
    points: ['Chaves vitalícias', 'Ativação automática na primeira validação', 'Sem data de expiração'],
  },
  {
    title: 'Revenda e lucro',
    desc: 'Venda cada chave por até R$ 147 (preço oficial). Você define o preço. Lucro direto.',
    points: ['Margem de até 73%', 'Controle total sobre seu negócio', 'Painel pra acompanhar tudo'],
  },
];

export default function ComoFunciona() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <div className="text-sm font-semibold text-primary mb-3">COMO FUNCIONA</div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold mb-4">O programa completo</h1>
          <p className="text-lg text-text-muted">Tudo que você precisa saber antes de entrar</p>
        </motion.div>

        <div className="space-y-6">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="holo-card p-8"
            >
              <div className="flex gap-6">
                <div className="text-5xl font-display font-bold text-gradient shrink-0 w-16">0{i + 1}</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{s.title}</h3>
                  <p className="text-text-muted mb-5">{s.desc}</p>
                  <ul className="space-y-2">
                    {s.points.map((p, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <Check size={16} className="text-primary mt-0.5 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Exemplo de lucro */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="holo-card holo-permanent p-8 mt-10">
          <h3 className="text-2xl font-display font-bold mb-6 text-center">Exemplo real — Pacote 50 chaves</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-center mb-6">
            <div>
              <div className="text-sm text-text-muted mb-1">Você paga</div>
              <div className="text-2xl font-display font-bold font-mono font-tabular">{formatBRL(199500)}</div>
              <div className="text-xs text-text-muted">R$ 39,90/chave</div>
            </div>
            <div>
              <div className="text-sm text-text-muted mb-1">Você vende</div>
              <div className="text-2xl font-display font-bold font-mono font-tabular">{formatBRL(735000)}</div>
              <div className="text-xs text-text-muted">R$ 147/chave × 50</div>
            </div>
            <div>
              <div className="text-sm text-primary mb-1">Seu lucro</div>
              <div className="text-2xl font-display font-bold font-mono font-tabular text-primary">{formatBRL(535500)}</div>
              <div className="text-xs text-primary">+268%</div>
            </div>
          </div>
        </motion.div>

        <div className="text-center mt-12">
          <Link to="/cadastrar" className="cta-neon inline-flex items-center gap-2 text-lg !px-10 !py-4">
            <span className="relative z-10 flex items-center gap-2">Começar agora <ArrowRight size={20} /></span>
          </Link>
        </div>
      </div>
    </div>
  );
}
