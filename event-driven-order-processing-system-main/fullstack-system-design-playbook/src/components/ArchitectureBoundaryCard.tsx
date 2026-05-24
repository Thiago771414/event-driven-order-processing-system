interface ArchitectureBoundaryCardProps {
  title: string;
  description: string;
  path: string;
}

export function ArchitectureBoundaryCard({
  title,
  description,
  path,
}: ArchitectureBoundaryCardProps) {
  return (
    <article className="boundary-card">
      <h3>{title}</h3>
      <p>{description}</p>
      <code>{path}</code>
    </article>
  );
}
