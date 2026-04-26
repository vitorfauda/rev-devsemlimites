import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ButtonLink, Section } from '@/components/ui';

// Legacy /landing-antiga — redireciona pra /seja-revenda visualmente
export default function Landing() {
  return (
    <Section className="max-w-[700px]">
      <div className="text-center py-20">
        <div className="text-xs text-[var(--color-text-dim)] uppercase tracking-widest mb-3">Landing legada</div>
        <h1 className="text-4xl font-semibold tracking-tight mb-4">
          Esta página foi atualizada
        </h1>
        <p className="text-[var(--color-text-muted)] mb-8">
          O programa de revenda DSL agora tem uma nova página principal. Acesse:
        </p>
        <Link to="/seja-revenda">
          <ButtonLink size="lg">
            Ver nova página <ArrowRight size={16} />
          </ButtonLink>
        </Link>
      </div>
    </Section>
  );
}
