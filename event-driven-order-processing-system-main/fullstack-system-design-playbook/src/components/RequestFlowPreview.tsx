const requestSteps = [
  'Componente coleta a intencao do usuario.',
  'Hook orquestra estado temporario e chama o servico.',
  'Servico traduz a acao em contrato de API tipado.',
  'API client aplica headers, timeout, rastreamento e retry seguro.',
  'Backend persiste no PostgreSQL e publica eventos via outbox + Kafka.',
  'Workers processam assincronamente e Redis acelera o backend.',
];

export function RequestFlowPreview() {
  return (
    <section className="flow" aria-labelledby="request-flow-title">
      <h2 id="request-flow-title">Fluxo de requisicao</h2>
      <ol>
        {requestSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}
