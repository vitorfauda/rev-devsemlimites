export default function Termos() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="text-xs text-[var(--color-text-dim)] uppercase tracking-widest mb-3">Legal</div>
      <h1 className="text-4xl font-semibold tracking-tight mb-2">Termos de Uso</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-12">Última atualização: 26/04/2026</p>

      <article className="space-y-10 text-[var(--color-text-muted)] leading-relaxed">
        <Section title="1. Aceite dos Termos">
          <p>
            Ao acessar e usar a plataforma <Strong>Dev Sem Limites</Strong> ("DSL"), operada por{' '}
            <Strong>ID SERVIÇOS DIGITAIS LTDA</Strong> (CNPJ 54.107.510/0001-91), você ("Usuário")
            concorda integralmente com estes Termos de Uso. Se não concordar, não use o serviço.
          </p>
        </Section>

        <Section title="2. Descrição do Serviço">
          <p>
            A DSL oferece uma extensão de navegador (Chrome) que otimiza o consumo de créditos em
            ferramentas de geração de código com IA, especialmente Lovable.dev. O serviço é fornecido
            em modelo de assinatura (mensal ou anual) com renovação automática ou manual conforme
            método de pagamento escolhido.
          </p>
        </Section>

        <Section title="3. Planos e Pagamento">
          <Subtitle>3.1 Planos disponíveis</Subtitle>
          <List
            items={[
              <><Strong>1 Dia:</Strong> R$ 47, pagamento único, acesso por 24 horas</>,
              <><Strong>7 Dias:</Strong> R$ 67, pagamento único, acesso por 7 dias</>,
              <><Strong>Mensal:</Strong> R$ 97/mês com renovação automática</>,
              <><Strong>Anual:</Strong> R$ 397/ano (ou preço promocional vigente) com renovação automática</>,
            ]}
          />
          <Subtitle>3.2 Métodos de pagamento</Subtitle>
          <List
            items={[
              <><Strong>Cartão de crédito:</Strong> cobrança automática a cada ciclo, processada via Pagar.me</>,
              <><Strong>PIX:</Strong> nova cobrança gerada a cada ciclo, paga manualmente pelo Usuário</>,
            ]}
          />
          <Subtitle>3.3 Falhas de pagamento</Subtitle>
          <p>
            Caso 2 (duas) cobranças consecutivas falhem, a licença será{' '}
            <Strong>suspensa automaticamente</Strong>. Após 30 dias de inadimplência, a assinatura
            será <Strong>cancelada definitivamente</Strong>.
          </p>
        </Section>

        <Section title="4. Cancelamento e Reembolso">
          <Subtitle>4.1 Direito de arrependimento (Art. 49 CDC)</Subtitle>
          <p>
            Compras realizadas pelo site têm o direito de arrependimento de{' '}
            <Strong>7 (sete) dias corridos</Strong> a contar da contratação, conforme previsto no
            Código de Defesa do Consumidor.
          </p>
          <Subtitle>4.2 Após o período de arrependimento</Subtitle>
          <List
            items={[
              <><Strong>Plano Mensal:</Strong> cancela a renovação a qualquer momento, com acesso até o fim do ciclo já pago.</>,
              <><Strong>Plano Anual:</Strong> sendo pagamento único antecipado pelo período integral, <Strong>NÃO há direito a reembolso proporcional após o período de 7 dias</Strong>. Acesso permanece ativo até o término do ciclo.</>,
              <><Strong>Planos 1 Dia / 7 Dias:</Strong> sendo produtos digitais consumíveis em curto prazo, <Strong>NÃO há reembolso após início de uso</Strong>.</>,
            ]}
          />
          <Subtitle>4.3 Pagamentos via PIX</Subtitle>
          <p>
            Pagamentos via PIX <Strong>NÃO são reembolsáveis</Strong> pela natureza irreversível do
            meio, exceto em casos de cobrança comprovadamente indevida pelo sistema.
          </p>
        </Section>

        <Section title="5. Programa de Revendas">
          <Subtitle>5.1 Adesão</Subtitle>
          <p>Entrada via pagamento único de <Strong>R$ 9,90</Strong> não reembolsável.</p>
          <Subtitle>5.2 Comissões por tier</Subtitle>
          <List
            items={[
              'Bronze (0-9 clientes ativos): 60%',
              'Prata (10-24): 62,5%',
              'Ouro (25-49): 65%',
              'Diamante (50-99): 67,5%',
              'Lendário (100+): 70%',
            ]}
          />
          <Subtitle>5.3 Estornos</Subtitle>
          <p>
            Em caso de estorno ou chargeback, o valor da comissão é <Strong>debitado</Strong> da
            próxima cobrança ou diretamente do saldo do Revendedor (figura como <em>liable</em> nas
            regras de split Pagar.me).
          </p>
          <Subtitle>5.4 Bônus</Subtitle>
          <List
            items={[
              <><Strong>Bônus Lendário</Strong> (R$ 2.000): pago uma única vez ao Revendedor que atingir 100+ clientes ativos pela primeira vez.</>,
              <><Strong>Bônus Top 1 mensal</Strong> (R$ 500): pago ao Revendedor com maior receita gerada no mês anterior.</>,
            ]}
          />
        </Section>

        <Section title="6. Propriedade Intelectual">
          <p>
            A extensão DSL e todos os códigos são propriedade exclusiva da ID SERVIÇOS DIGITAIS LTDA.
            É <Strong>PROIBIDO</Strong>:
          </p>
          <List
            items={[
              'Engenharia reversa do código',
              'Redistribuição não autorizada',
              'Modificação ou clonagem do produto',
              'Uso comercial fora do programa de revendas oficial',
            ]}
          />
          <p className="text-xs text-[var(--color-text-dim)]">
            Violações sujeitam às sanções da Lei 9.609/98 e Lei 9.610/98.
          </p>
        </Section>

        <Section title="7. Limitação de Uso">
          <p>
            A licença é <Strong>pessoal e intransferível</Strong>. Cada licença permite até{' '}
            <Strong>1 (um) dispositivo</Strong>. Tentativas de burla acarretam
            suspensão imediata.
          </p>
        </Section>

        <Section title="8. Disponibilidade e Responsabilidade">
          <p>
            SLA de <Strong>99% mensal</Strong>. Interrupções de terceiros (Lovable, Supabase,
            Pagar.me) <Strong>não geram direito a reembolso</Strong>.
          </p>
          <p>
            A responsabilidade total fica limitada ao{' '}
            <Strong>valor pago pelo Usuário no ciclo atual</Strong>.
          </p>
        </Section>

        <Section title="9. Privacidade e LGPD">
          <p>
            O tratamento de dados segue nossa{' '}
            <a href="/privacidade" className="text-[var(--color-primary)] hover:underline">
              Política de Privacidade
            </a>
            , em conformidade com a Lei 13.709/2018 (LGPD).
          </p>
        </Section>

        <Section title="10. Alterações dos Termos">
          <p>
            A DSL pode alterar estes Termos com aviso prévio de <Strong>30 dias</Strong> por email.
            Uso continuado após o prazo implica aceite.
          </p>
        </Section>

        <Section title="11. Contato">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm">
            <div className="text-[var(--color-text)] font-medium">ID SERVIÇOS DIGITAIS LTDA</div>
            <div className="mt-2 space-y-1 text-[var(--color-text-muted)]">
              <div>CNPJ 54.107.510/0001-91</div>
              <div>
                <a href="mailto:contato@devsemlimites.site" className="text-[var(--color-primary)] hover:underline">
                  contato@devsemlimites.site
                </a>
              </div>
              <div>WhatsApp +55 27 99266-0736</div>
            </div>
          </div>
        </Section>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text)] mb-4">{title}</h2>
      <div className="space-y-3 text-sm">{children}</div>
    </section>
  );
}

function Subtitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[var(--color-text)] font-medium mt-5 mb-1.5">{children}</h3>;
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="text-[var(--color-text)] font-medium">{children}</strong>;
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-1.5 ml-5 list-disc marker:text-[var(--color-text-dim)]">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}
