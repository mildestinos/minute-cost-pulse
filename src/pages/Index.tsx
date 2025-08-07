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

const currencySymbol: Record<string, string> = { BRL: "R$", USD: "$" };

function useCanonical() {
  const location = useLocation();
  const canonical = typeof window !== "undefined" ? `${window.location.origin}${location.pathname}` : location.pathname;
  return canonical;
}

type Period = "24h" | "7d" | "30d";

type Point = { label: string; value: number };

function generateData(period: Period): Point[] {
  const rand = (seed: number) => {
    // simple deterministic-ish PRNG per period for consistent UI
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  if (period === "24h") {
    return Array.from({ length: 24 }).map((_, i) => ({
      label: `${i}h`,
      value: 0.18 + rand(i + 1) * 0.25, // custo/min
    }));
  }
  if (period === "7d") {
    const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    return Array.from({ length: 7 }).map((_, i) => ({
      label: days[i],
      value: 0.2 + rand(i + 11) * 0.22,
    }));
  }
  return Array.from({ length: 30 }).map((_, i) => ({
    label: `${i + 1}`,
    value: 0.17 + rand(i + 21) * 0.28,
  }));
}

function formatCurrency(v: number, currency: "BRL" | "USD") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(v);
}

const Index = () => {
  const canonical = useCanonical();
  const [period, setPeriod] = useState<Period>("24h");
  const [currency, setCurrency] = useState<"BRL" | "USD">("BRL");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const data = useMemo(() => generateData(period), [period]);
  const rate = currency === "BRL" ? 1 : 1 / 5; // protótipo: ~R$5 por USD
  const avg = useMemo(() => data.reduce((a, b) => a + b.value, 0) / data.length, [data]);
  const total = useMemo(() => {
    const perBucketMinutes = period === "24h" ? 60 : 1440; // hora x dia
    return data.reduce((acc, p) => acc + p.value * perBucketMinutes, 0);
  }, [data, period]);
  const peak = useMemo(() => Math.max(...data.map((d) => d.value)), [data]);
  const trendUp = data[data.length - 1].value >= data[0].value;

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
        <meta name="description" content="Acompanhe custo por minuto, picos, tendência e centros de custo em um painel claro e responsivo." />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Painel de Custo por Minuto" />
        <meta property="og:description" content="Indicadores de custo por minuto com tendências e KPIs." />
      </Helmet>

      <main className="container py-10">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Painel de Custo por Minuto</h1>
          <p className="text-muted-foreground mt-2">Visualize indicadores essenciais e tendências de custo por minuto.</p>
        </header>

        <section className="mb-6">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex gap-3">
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Últimas 24h</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                </SelectContent>
              </Select>

              <Select value={currency} onValueChange={(v) => setCurrency(v as "BRL" | "USD")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Moeda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL (R$)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 600); }} disabled={loading}>
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
              <div className="text-2xl font-bold">{formatCurrency(avg * rate, currency)}</div>
              {trendUp ? <TrendingUp className="text-primary" /> : <TrendingDown className="text-destructive" />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Custo total (período)</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="text-2xl font-bold">{formatCurrency(total * rate, currency)}</div>
              <Clock className="text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pico de custo/min</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="text-2xl font-bold">{formatCurrency(peak * rate, currency)}</div>
              <Activity className="text-accent" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Tendência</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className={`text-2xl font-bold ${trendUp ? "text-primary" : "text-destructive"}`}>
                {trendUp ? "Alta" : "Baixa"}
              </div>
              {trendUp ? <TrendingUp className="text-primary" /> : <TrendingDown className="text-destructive" />}
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
                    <YAxis tickFormatter={(v) => `${currencySymbol[currency]}${v.toFixed(2)}`} tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={{ stroke: "hsl(var(--border))" }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v * rate, currency)} contentStyle={{ background: "hsl(var(--card))", border: `1px solid hsl(var(--border))` }} labelStyle={{ color: "hsl(var(--muted-foreground))" }} />
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
                      <TableCell className="text-right">{formatCurrency(d.cpm * rate, currency)}</TableCell>
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
