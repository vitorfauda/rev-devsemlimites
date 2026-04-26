export default function Privacidade() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="text-xs text-[var(--color-text-dim)] uppercase tracking-widest mb-3">Legal · LGPD</div>
      <h1 className="text-4xl font-semibold tracking-tight mb-2">Política de Privacidade</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-12">Última atualização: 26/04/2026</p>

      <article className="space-y-10 text-[var(--color-text-muted)] leading-relaxed">
        <Section title="1. Controlador de Dados">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm">
            <div className="text-[var(--color-text)] font-medium">Dev Sem Limites</div>
            <div className="mt-2 space-y-1 text-[var(--color-text-muted)]">
              <div>
                <a href="mailto:contato@devsemlimites.site" className="text-[var(--color-primary)] hover:underline">
                  contato@devsemlimites.site
                </a>
              </div>
              <div>Encarregado de Dados (DPO): contato@devsemlimites.site</div>
            </div>
          </div>
        </Section>

        <Section title="2. Dados Coletados">
          <Subtitle>2.1 Dados de cadastro</Subtitle>
          <List items={['Nome completo', 'Email', 'WhatsApp', 'CPF', 'Endereço completo', 'Data de nascimento']} />
          <p className="text-xs text-[var(--color-text-dim)]">Base legal: Execução de contrato (Art. 7º, V LGPD)</p>

          <Subtitle>2.2 Dados de pagamento</Subtitle>
          <List
            items={[
              'Tokens de cartão (NÃO armazenamos número completo — só os 4 últimos dígitos)',
              'Histórico de transações',
              'Chave PIX e dados bancários (apenas Revendedores)',
            ]}
          />
          <p className="text-xs text-[var(--color-text-dim)]">Processados por Pagar.me. Base legal: Execução de contrato.</p>

          <Subtitle>2.3 Dados de uso</Subtitle>
          <List items={['IP de acesso e User-Agent', 'Logs de uso da extensão', 'Métricas de venda (apenas Revendedores)']} />
          <p className="text-xs text-[var(--color-text-dim)]">Base legal: Legítimo interesse (segurança e prevenção de fraude)</p>
        </Section>

        <Section title="3. Finalidades do Tratamento">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--color-text-dim)] border-b border-[var(--color-border)]">
                  <th className="font-normal py-2.5 pl-5">Finalidade</th>
                  <th className="font-normal pr-5">Base legal</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Processar pagamentos e gerar licenças', 'Execução de contrato'],
                  ['Enviar comunicações transacionais', 'Execução de contrato'],
                  ['Calcular comissões de Revendedores', 'Execução de contrato'],
                  ['Detectar fraudes e abuso', 'Legítimo interesse'],
                  ['Cumprir obrigações fiscais', 'Obrigação legal'],
                  ['Marketing', 'Consentimento'],
                ].map(([f, b], i) => (
                  <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="py-2.5 pl-5 text-[var(--color-text)]">{f}</td>
                    <td className="pr-5 text-[var(--color-text-muted)]">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="4. Compartilhamento de Dados">
          <p>Compartilhamos dados estritamente necessários com operadores:</p>
          <List
            items={[
              <><Strong>Pagar.me</Strong> — processamento de pagamentos</>,
              <><Strong>Resend</Strong> — envio de emails transacionais</>,
              <><Strong>Evolution API</Strong> — envio de WhatsApp</>,
              <><Strong>Supabase</Strong> — hospedagem e infraestrutura</>,
            ]}
          />
          <p className="text-[var(--color-text)] font-medium">NÃO vendemos dados pessoais a terceiros.</p>
        </Section>

        <Section title="5. Retenção">
          <List
            items={[
              <><Strong>Dados cadastrais:</Strong> Conta ativa + 5 anos pós-encerramento (obrigação fiscal)</>,
              <><Strong>Histórico de transações:</Strong> 10 anos (CTN Art. 174)</>,
              <><Strong>Logs de uso:</Strong> 6 meses</>,
              <><Strong>Comunicações:</Strong> 12 meses</>,
              <><Strong>Backups criptografados:</Strong> 90 dias</>,
            ]}
          />
        </Section>

        <Section title="6. Direitos do Titular (LGPD Art. 18)">
          <p>Você pode, a qualquer momento:</p>
          <List
            items={[
              'Confirmar se tratamos seus dados',
              'Acessar, corrigir, anonimizar ou eliminar dados',
              'Solicitar portabilidade',
              'Revogar consentimento',
              'Excluir seus dados (sujeito a obrigações legais de retenção)',
            ]}
          />
          <p>
            Como exercer: envie email para{' '}
            <a href="mailto:contato@devsemlimites.site" className="text-[var(--color-primary)] hover:underline">
              contato@devsemlimites.site
            </a>{' '}
            com assunto <Strong>"LGPD - [seu pedido]"</Strong>. Respondemos em até 15 dias úteis.
          </p>
        </Section>

        <Section title="7. Segurança">
          <List
            items={[
              <><Strong>HTTPS</Strong> obrigatório</>,
              <>Senhas com hash <Strong>bcrypt</Strong></>,
              <>Dados sensíveis com <Strong>AES-256-GCM</Strong></>,
              <><Strong>2FA</Strong> disponível e obrigatório pra ações sensíveis</>,
              <><Strong>RLS</Strong> (Row Level Security) no Supabase</>,
              <><Strong>Logs de auditoria</Strong> em ações sensíveis</>,
              <><Strong>Backups criptografados</Strong> diários</>,
            ]}
          />
          <p className="text-xs text-[var(--color-text-dim)]">
            Em caso de incidente, comunicamos titulares e ANPD em até 72h (LGPD Art. 48).
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            Usamos cookies <Strong>essenciais</Strong> para autenticação.{' '}
            <Strong>NÃO usamos cookies de tracking de terceiros</Strong> (Google Analytics, Facebook Pixel, etc).
          </p>
        </Section>

        <Section title="9. Crianças e Adolescentes">
          <p>
            O serviço <Strong>NÃO é direcionado a menores de 18 anos</Strong>. Coleta inadvertida de
            dados de menor é eliminada imediatamente.
          </p>
        </Section>

        <Section title="10. Contato">
          <p>Dúvidas, reclamações ou solicitações:</p>
          <List
            items={[
              <>Email: <a href="mailto:contato@devsemlimites.site" className="text-[var(--color-primary)] hover:underline">contato@devsemlimites.site</a></>,
              <>WhatsApp: +55 27 99266-0736</>,
            ]}
          />
          <p>
            Em caso de não-resolução, contate a ANPD:{' '}
            <a href="https://www.gov.br/anpd" target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:underline">
              gov.br/anpd
            </a>
          </p>
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
