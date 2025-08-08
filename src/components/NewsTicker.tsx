import React from "react";

export type NewsTickerProps = {
  items?: string[];
  speedSeconds?: number; // default 20s
};

const defaultItems = [
  "Nova parceria reduz custos em 8%",
  "Unidade B bate recorde de eficiência no mês",
  "Projeto de automação reduz perda de minutos",
  "Relatório mensal: tendência de custo em queda",
];

export default function NewsTicker({ items = defaultItems, speedSeconds = 20 }: NewsTickerProps) {
  return (
    <aside aria-label="Últimas notícias" className="bg-ticker text-ticker-foreground py-2 overflow-hidden">
      <div className="container">
        <div className="relative flex gap-12 whitespace-nowrap">
          <div className="flex gap-12 animate-marquee [animation-duration:var(--speed,20s)] will-change-transform" style={{ ['--speed' as any]: `${speedSeconds}s` }}>
            {items.map((t, i) => (
              <span key={`t1-${i}`} className="font-medium">
                {t}
              </span>
            ))}
          </div>
          <div className="flex gap-12 animate-marquee [animation-duration:var(--speed,20s)] will-change-transform" style={{ ['--speed' as any]: `${speedSeconds}s` }} aria-hidden="true">
            {items.map((t, i) => (
              <span key={`t2-${i}`} className="font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
