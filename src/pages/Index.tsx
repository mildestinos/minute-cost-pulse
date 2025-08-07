import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useMemo, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Clock, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function useCanonical() {
  const location = useLocation();
  const canonical = typeof window !== "undefined" ? `${window.location.origin}${location.pathname}` : location.pathname;
  return canonical;
}

type Period = "24h" | "mensal";

type Point = { label: string; value: number };

const unidades = ["Todas", "Unidade A", "Unidade B", "Unidade C"] as const;

type Unidade = typeof unidades[number];

function seedFrom(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = Math.imul(31, h) + text.charCodeAt(i) | 0;
  return (i: number) => {
    const x = Math.sin(h + i) * 10000;
    return x - Math.floor(x);
  };
}

function generateData(period: Period, unidade: Unidade): Point[] {
  const rand = seedFrom(unidade);

  if (period === "24h") {
    return Array.from({ length: 24 }).map((_, i) => ({
      label: `${i}h`,
      value: 0.18 + rand(i + 1) * 0.25, // custo/min
    }));
  }
  // mensal: últimos 12 meses
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return Array.from({ length: 12 }).map((_, i) => ({
    label: meses[i],
    value: 0.17 + rand(i + 21) * 0.3,
  }));
}

function formatCurrencyBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(v);
}

const Index = () => {
  const canonical = useCanonical();
  const [period, setPeriod] = useState<Period>("24h");
  const [unidade, setUnidade] = useState<Unidade>("Todas");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const data = useMemo(() => generateData(period, unidade), [period, unidade]);
  const avg = useMemo(() => data.reduce((a, b) => a + b.value, 0) / data.length, [data]);
  const minutesPerBucket = useMemo(() => (period === "24h" ? 60 : 30 * 24 * 60), [period]); // hora x mês (30 dias)
  const total = useMemo(() => data.reduce((acc, p) => acc + p.value * minutesPerBucket, 0), [data, minutesPerBucket]);
  const peak = useMemo(() => Math.max(...data.map((d) => d.value)), [data]);
  const trendUp = data[data.length - 1].value >= data[0].value;

  // Indicador: Perda de minutos (estimativa protótipo)
  const lossRate = unidade === "Todas" ? 0.02 : 0.025; // 2% geral, 2.5% por unidade
  const buckets = data.length;
  const lossMinutes = useMemo(() => Math.round(buckets * minutesPerBucket * lossRate), [buckets, minutesPerBucket, lossRate]);

  const topDrivers = useMemo(
    () => [
      { name: "Atendimento", cpm: 0.26, share: 0.38 },
      { name: "Infraestrutura", cpm: 0.21, share: 0.27 },
      { name: "Licenças", cpm: 0.19, share: 0.2 },
      { name: "Treinamento", cpm: 0.16, share: 0.15 },
    ],
    []
  );

  const onMouseMove = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
  };

  return (
    <div ref={containerRef} onMouseMove={onMouseMove} className="min-h-screen ambient-spotlight">
      <Helmet>
        <title>Painel de Custo por Minuto | Indicadores</title>
        <meta name="description" content="Acompanhe custo por minuto, perdas de minutos, picos, tendência e centros de custo." />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Painel de Custo por Minuto" />
        <meta property="og:description" content="Indicadores de custo por minuto com tendências, perdas e KPIs." />
      </Helmet>

      <main className="container py-10">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Painel de Custo por Minuto</h1>
          <p className="text-muted-foreground mt-2">Visualize indicadores essenciais, perdas de minutos e tendências.</p>
        </header>

        <section className="mb-6">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex gap-3 flex-wrap">
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Últimas 24h</SelectItem>
                  <SelectItem value="mensal">Mensal (12 meses)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={unidade} onValueChange={(v) => setUnidade(v as Unidade)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 500); }} disabled={loading}>
              {loading ? "Aplicando..." : "Aplicar filtros"}
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Custo médio por min</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="text-2xl font-bold">{formatCurrencyBRL(avg)}</div>
              {trendUp ? <TrendingUp className="text-primary" /> : <TrendingDown className="text-destructive" />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Custo total (período)</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="text-2xl font-bold">{formatCurrencyBRL(total)}</div>
              <Clock className="text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pico de custo/min</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="text-2xl font-bold">{formatCurrencyBRL(peak)}</div>
              <Activity className="text-accent" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Perda de minutos (período)</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="text-2xl font-bold">{lossMinutes.toLocaleString("pt-BR")} min</div>
              {lossMinutes > 0 ? <TrendingDown className="text-destructive" /> : <TrendingUp className="text-primary" />}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tendência de custo por minuto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cpm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={`hsl(var(--primary))`} stopOpacity={0.5} />
                        <stop offset="95%" stopColor={`hsl(var(--primary))`} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={{ stroke: "hsl(var(--border))" }} />
                    <YAxis tickFormatter={(v) => `R$${Number(v).toFixed(2)}`} tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={{ stroke: "hsl(var(--border))" }} />
                    <Tooltip formatter={(v: number) => formatCurrencyBRL(v)} contentStyle={{ background: "hsl(var(--card))", border: `1px solid hsl(var(--border))` }} labelStyle={{ color: "hsl(var(--muted-foreground))" }} />
                    <Area type="monotone" dataKey="value" stroke={`hsl(var(--primary))`} fillOpacity={1} fill="url(#cpm)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Centros de custo</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Custo/min</TableHead>
                    <TableHead className="text-right">Contribuição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topDrivers.map((d) => (
                    <TableRow key={d.name}>
                      <TableCell>{d.name}</TableCell>
                      <TableCell className="text-right">{formatCurrencyBRL(d.cpm)}</TableCell>
                      <TableCell className="text-right">{(d.share * 100).toFixed(0)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Index;
