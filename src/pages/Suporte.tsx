import { useState } from 'react';
import { MessageCircle, Users, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const faqs = [
  { q: 'Como usar as chaves?', a: 'Cada chave é uma licença vitalícia. Depois que o cliente recebe, ele insere a chave na extensão Dev Sem Limites. A chave ativa automaticamente na primeira validação.' },
  { q: 'Como divulgar?', a: 'Use os materiais prontos em /materiais. Foque em grupos de devs, Instagram e WhatsApp status. O público que usa Lovable é muito receptivo.' },
  { q: 'E se cliente pedir reembolso?', a: 'Se a chave ainda não foi ativada, você pode desmarcar como vendida e revendê-la. Chaves já ativadas não têm reembolso.' },
  { q: 'Como atualizar meus dados?', a: 'Vá em /perfil e edite as informações. Nome, WhatsApp e chave PIX são editáveis.' },
];

export default function Suporte() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 max-w-3xl">
      <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">Central de suporte</h1>
      <p className="text-text-muted mb-10">Estamos aqui pra te ajudar a vender mais</p>

      {/* WhatsApp */}
      <div className="holo-card holo-permanent p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-green-500 flex items-center justify-center shrink-0">
            <MessageCircle size={28} className="text-void" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">Fale com nosso time</h2>
            <p className="text-text-muted mb-5">Atendimento em dias úteis das 9h às 20h</p>
            <a
              href="https://wa.me/5527992660736?text=Sou%20revendedor%20DSL,%20preciso%20de%20ajuda"
              target="_blank"
              rel="noreferrer"
              className="cta-neon inline-flex items-center gap-2"
            >
              <span className="relative z-10 flex items-center gap-2"><MessageCircle size={16} /> Falar agora</span>
            </a>
          </div>
        </div>
      </div>

      {/* Grupo VIP */}
      <div className="holo-card p-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent-gold/15 flex items-center justify-center">
            <Users size={22} className="text-accent-gold" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">Grupo VIP de revendedores</h3>
            <p className="text-sm text-text-muted">Troca de experiências, dicas de vendas e novidades em primeira mão</p>
          </div>
          <a
            href="https://chat.whatsapp.com/JxfO7n9OCXe8EY4LIaLh9H?mode=gi_t"
            target="_blank" rel="noreferrer"
            className="cta-ghost text-sm"
          >
            Entrar
          </a>
        </div>
      </div>

      {/* FAQ */}
      <h2 className="text-2xl font-display font-bold mb-4">Dúvidas frequentes</h2>
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="holo-card overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
              <span className="font-semibold">{f.q}</span>
              <ChevronDown size={18} className={`transition-transform ${open === i ? 'rotate-180 text-primary' : 'text-text-muted'}`} />
            </button>
            <motion.div
              initial={false}
              animate={{ height: open === i ? 'auto' : 0, opacity: open === i ? 1 : 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 text-text-muted">{f.a}</div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}
