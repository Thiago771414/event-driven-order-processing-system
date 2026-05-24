import type { ArchitectureCardModel } from '../../types/architecture';

interface ArchitectureCardProps {
  card: ArchitectureCardModel;
}

export function ArchitectureCard({ card }: ArchitectureCardProps) {
  return (
    <article className={`architecture-card architecture-card--${card.health}`}>
      <div className="architecture-card__header">
        <span className="architecture-card__category">{card.category}</span>
        <span className="architecture-status">{card.statusLabel}</span>
      </div>
      <h3>{card.title}</h3>
      <p>{card.summary}</p>

      <div className="architecture-card__meta">
        <span>{card.owner}</span>
        <code>{card.signal}</code>
      </div>

      <dl className="architecture-card__metrics">
        {card.metrics.map((metric) => (
          <div key={`${card.id}-${metric.label}`}>
            <dt>{metric.label}</dt>
            <dd className={`metric-tone metric-tone--${metric.tone}`}>
              {metric.value}
              {metric.trend ? <span>{metric.trend}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
