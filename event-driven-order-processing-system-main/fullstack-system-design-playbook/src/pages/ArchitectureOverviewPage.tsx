import { ArchitectureBoundaryCard } from '../components/ArchitectureBoundaryCard';
import { AiOperationsConsole } from '../components/ai-ops/AiOperationsConsole';
import { ArchitectureConsole } from '../components/architecture/ArchitectureConsole';
import {
  MiniShopTrustOperationsConsole,
  TrustOperationsErrorBoundary,
} from '../components/trust/MiniShopTrustOperationsConsole';
import { RequestFlowPreview } from '../components/RequestFlowPreview';
import { architectureConsoleService } from '../services/architectureConsoleService';

const boundaries = [
  {
    title: 'Componentes',
    description:
      'Renderizam dados e capturam intencao do usuario. Nao conhecem fetch, Kafka, Redis ou PostgreSQL.',
    path: 'src/components',
  },
  {
    title: 'Hooks',
    description:
      'Coordenam comportamento de tela, estado local e chamadas aos servicos de dominio.',
    path: 'src/hooks',
  },
  {
    title: 'Servicos',
    description:
      'Encapsulam contratos HTTP e retornam modelos tipados para a experiencia React.',
    path: 'src/services',
  },
  {
    title: 'Estado',
    description:
      'Guarda estado temporario do cliente, como carrinho de sessao e ciclo de vida do pedido.',
    path: 'src/state',
  },
  {
    title: 'Storage',
    description:
      'Persistencia local do navegador para preferencias, drafts e cache offline controlado.',
    path: 'src/storage',
  },
  {
    title: 'Tipos',
    description:
      'Contratos TypeScript que mantem a fronteira entre UI, API e sistemas distribuidos clara.',
    path: 'src/types',
  },
];

export function ArchitectureOverviewPage() {
  const architectureSnapshot = architectureConsoleService.getSnapshot();
  const sagaWorkflow = architectureConsoleService.getSagaWorkflow();

  return (
    <main>
      <section className="page-shell">
        <div className="intro">
          <p className="eyebrow">AI Ops + MCP secure orchestration</p>
          <h1>MiniShop Reliability Command Center</h1>
          <p className="lead">
            Plataforma interna de operacoes com IA para interpretar sinais de
            Prometheus, Jaeger, Kafka, DLQ, workers e canary em linguagem
            natural. A IA nunca toca a infraestrutura diretamente: tudo passa
            por ferramentas MCP seguras, tipadas e com politica deny-by-default.
          </p>
        </div>

        <AiOperationsConsole />

        <TrustOperationsErrorBoundary>
          <MiniShopTrustOperationsConsole />
        </TrustOperationsErrorBoundary>

        <ArchitectureConsole
          snapshot={architectureSnapshot}
          workflow={sagaWorkflow}
        />

        <div className="section-heading section-heading--spaced">
          <span className="eyebrow">Boundaries</span>
          <h2>Fronteiras do frontend</h2>
          <p>
            O console reforca as mesmas fronteiras do playbook: componentes
            renderizam modelos, hooks coordenam telas e servicos encapsulam
            contratos.
          </p>
        </div>

        <div className="grid" aria-label="Fronteiras de arquitetura">
          {boundaries.map((boundary) => (
            <ArchitectureBoundaryCard key={boundary.path} {...boundary} />
          ))}
        </div>

        <RequestFlowPreview />
      </section>
    </main>
  );
}
