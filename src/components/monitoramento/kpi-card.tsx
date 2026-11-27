import type { ReactNode } from "react";

interface KpiCardProps {
  rotulo: string;
  valor: ReactNode;
  nota?: string;
}

export function KpiCard({ rotulo, valor, nota }: KpiCardProps) {
  return (
    <article className="card kpi">
      <p className="label">{rotulo}</p>
      <p className="value">
        {valor}
        <span>{nota}</span>
      </p>
    </article>
  );
}
