import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Image as ImageIcon, Video, MessageCircle, Copy, Check, Download } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';
import { toast } from 'sonner';

const copys = [
  {
    title: 'Story Instagram',
    text: '🚀 Quer usar o Lovable SEM limite de créditos? Eu descobri uma forma ✨\n\nExtensão oficial + licença vitalícia por R$147\n\nChama no DM que te passo 👇',
  },
  {
    title: 'WhatsApp Status',
    text: 'Galera, parei de pagar R$100/mês pro Lovable. Uso uma extensão que libera tudo.\nValor único: R$147. Interessado? Responde aí 📲',
  },
  {
    title: 'Grupo / Comunidade',
    text: 'Pra quem usa Lovable.dev e quer economizar 💰\n\nExtensão Dev Sem Limites libera:\n✅ Prompts ilimitados (sem consumir crédito)\n✅ Funciona em qualquer conta\n✅ Licença vitalícia\n\nR$147 pagamento único (vs R$100/mês do PRO)\n\nMe chama no PV que te mando',
  },
  {
    title: 'Anúncio pago (Meta Ads)',
    text: 'HEADLINE: Lovable Ilimitado — Sem pagar mensalidade\n\nCORPO:\nA extensão oficial que libera prompts ilimitados no Lovable.dev, sem consumir créditos da sua conta.\n\n• Licença vitalícia (pagamento único)\n• Funciona em qualquer conta Lovable\n• Instalação em 2 minutos\n• Suporte dedicado via WhatsApp\n\nDe R$197 por R$147 (oferta de lançamento)\n\nCTA: Garanta sua licença',
  },
];

export default function Materiais() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, text: string) => {
    await copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copiado!');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-4xl font-display font-bold mb-2">Kit de divulgação</h1>
      <p className="text-text-muted mb-10">Textos, imagens e vídeos prontos pra você usar nas suas redes.</p>

      {/* Imagens/Vídeos (placeholder) */}
      <div className="grid md:grid-cols-3 gap-5 mb-12">
        <PlaceholderCard icon={ImageIcon} title="Imagens Instagram" desc="8-10 artes em diferentes formatos" />
        <PlaceholderCard icon={Video} title="Vídeos/Reels" desc="MP4 prontos pra postar" />
        <PlaceholderCard icon={FileText} title="PDF de apresentação" desc="Pra grupos profissionais" />
      </div>

      {/* Textos */}
      <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
        <MessageCircle size={22} className="text-primary" /> Textos prontos
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        {copys.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="holo-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">{c.title}</h3>
              <button onClick={() => copy(c.title, c.text)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                {copied === c.title ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
              </button>
            </div>
            <div className="text-sm text-text-muted whitespace-pre-line p-3 rounded-lg bg-void/50 border border-white/5 font-mono">
              {c.text}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PlaceholderCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="holo-card p-6 text-center">
      <Icon size={32} className="text-primary mx-auto mb-3" />
      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-xs text-text-muted mb-4">{desc}</p>
      <button className="cta-ghost text-sm w-full flex items-center justify-center gap-2" disabled>
        <Download size={14} /> Em breve
      </button>
    </div>
  );
}
