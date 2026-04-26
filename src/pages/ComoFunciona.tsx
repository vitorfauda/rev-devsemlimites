import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ButtonLink, Card, PageHeader, Section } from '@/components/ui';

export default function ComoFunciona() {
  return (
    <Section className="max-w-[800px]">
      <PageHeader
        title="Como funciona"
        description="O programa de revenda DSL em 4 passos simples"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { n: '01', t: 'Cadastra', d: 'R$ 9,90 entrada única. Configura sua conta de recebimento Pagar.me em 3 minutos.' },
          { n: '02', t: 'Compartilha seu link', d: 'Link único pay.devsemlimites.site/c/seunome. Posta em WhatsApp, IG, TikTok, grupos.' },
          { n: '03', t: 'Cliente assina', d: 'Você não faz nada. Checkout cuida e cobra todo mês automaticamente.' },
          { n: '04', t: 'Você recebe', d: 'Comissão cai no seu Pagar.me a cada renovação. Saca quando quiser.' },
        ].map((s) => (
          <Card key={s.n} className="p-6">
            <div className="text-xs text-[var(--color-text-dim)] font-mono mb-2">{s.n}</div>
            <div className="font-medium mb-1.5">{s.t}</div>
            <div className="text-sm text-[var(--color-text-muted)] leading-relaxed">{s.d}</div>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link to="/cadastrar">
          <ButtonLink size="lg">
            Quero ser revenda <ArrowRight size={16} />
          </ButtonLink>
        </Link>
      </div>
    </Section>
  );
}
