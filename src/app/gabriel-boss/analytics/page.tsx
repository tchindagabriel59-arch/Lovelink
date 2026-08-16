"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
  DollarSign,
  Calendar,
  Loader2,
  Clock,
  Share2,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AnalyticsData {
  inscriptions: Array<{
    date: string;
    label: string;
    total: number;
    male: number;
    female: number;
    other: number;
  }>;
  gender: Array<{
    name: string;
    value: number;
    percentage: string;
    color: string;
  }>;
  cities: Array<{
    city: string;
    count: number;
  }>;
  activity: Array<{
    hour: string;
    count: number;
    period: string;
  }>;
  sources: Array<{
    name: string;
    value: number;
    percentage: string;
    color: string;
  }>;
  revenue: {
    today: { amount: number; count: number };
    week: { amount: number; count: number };
    month: { amount: number; count: number };
    year: { amount: number; count: number };
    total: { amount: number; count: number };
  };
  totalUsers: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto" />
          <p className="mt-4 text-slate-400">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Erreur de chargement</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="p-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">📊 Analytics</h1>
            <p className="text-sm text-slate-400">
              Statistiques détaillées de LoveLink
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* ═══════════════════════════════════════ */}
        {/* 💰 REVENUS PAR PÉRIODE */}
        {/* ═══════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-bold">💰 Revenus par période</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <RevenueCard
              label="Aujourd'hui"
              amount={data.revenue.today.amount}
              count={data.revenue.today.count}
              color="from-green-500 to-emerald-500"
            />
            <RevenueCard
              label="7 derniers jours"
              amount={data.revenue.week.amount}
              count={data.revenue.week.count}
              color="from-blue-500 to-cyan-500"
            />
            <RevenueCard
              label="30 derniers jours"
              amount={data.revenue.month.amount}
              count={data.revenue.month.count}
              color="from-purple-500 to-pink-500"
            />
            <RevenueCard
              label="1 an"
              amount={data.revenue.year.amount}
              count={data.revenue.year.count}
              color="from-amber-500 to-orange-500"
            />
            <RevenueCard
              label="Total (tous temps)"
              amount={data.revenue.total.amount}
              count={data.revenue.total.count}
              color="from-rose-500 to-red-500"
              featured
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════ */}
        {/* 📈 GRAPHIQUE INSCRIPTIONS 30 JOURS */}
        {/* ═══════════════════════════════════════ */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold">📈 Inscriptions - 30 derniers jours</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6">
            Évolution quotidienne avec répartition Hommes / Femmes
          </p>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.inscriptions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  style={{ fontSize: "12px" }}
                  tickMargin={10}
                />
                <YAxis
                  stroke="#64748b"
                  style={{ fontSize: "12px" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#a855f7" }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#a855f7"
                  strokeWidth={3}
                  name="Total"
                  dot={{ fill: "#a855f7", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="female"
                  stroke="#ec4899"
                  strokeWidth={2}
                  name="Femmes"
                  dot={{ fill: "#ec4899", r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="male"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Hommes"
                  dot={{ fill: "#3b82f6", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ═══════════════════════════════════════ */}
        {/* 📊 RATIO H/F + TOP VILLES */}
        {/* ═══════════════════════════════════════ */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Ratio H/F */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-pink-400" />
              <h2 className="text-xl font-bold">👥 Répartition par genre</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Total : <strong className="text-white">{data.totalUsers}</strong> utilisateurs
            </p>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.gender}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ percentage }) => `${percentage}%`}
                    labelLine={false}
                  >
                    {data.gender.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                    }}
                    formatter={(value: number, name: string) => [
                      `${value} utilisateurs`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Légende détaillée */}
            <div className="mt-4 space-y-2">
              {data.gender.map((g) => (
                <div
                  key={g.name}
                  className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: g.color }}
                    />
                    <span className="text-sm font-medium">{g.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">{g.value}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      ({g.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Alerte déséquilibre */}
            {data.gender.find(
              (g) => g.name === "Hommes" && parseFloat(g.percentage) > 70
            ) && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-sm text-amber-400 font-semibold flex items-center gap-2">
                  ⚠️ Ratio déséquilibré
                </p>
                <p className="text-xs text-amber-300/80 mt-1">
                  Trop d&apos;hommes vs femmes. Boostez la campagne FEMMES !
                </p>
              </div>
            )}
          </section>

          {/* Top villes */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold">🌍 Top 10 villes</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Répartition géographique des utilisateurs
            </p>

            {data.cities.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Aucune donnée de ville disponible
              </div>
            ) : (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.cities}
                    layout="vertical"
                    margin={{ left: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      type="number"
                      stroke="#64748b"
                      style={{ fontSize: "12px" }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="city"
                      stroke="#64748b"
                      style={{ fontSize: "12px" }}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                      }}
                      formatter={(value: number) => [`${value} utilisateurs`, ""]}
                    />
                    <Bar
                      dataKey="count"
                      fill="#06b6d4"
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </div>
{/* ═══════════════════════════════════════ */}
{/* ⏰ HEURES D'ACTIVITÉ + 📱 SOURCES */}
{/* ═══════════════════════════════════════ */}
<div className="grid lg:grid-cols-2 gap-6">
  {/* Heures d'activité */}
  <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
    <div className="flex items-center gap-2 mb-4">
      <Clock className="w-5 h-5 text-amber-400" />
      <h2 className="text-xl font-bold">⏰ Heures d&apos;activité</h2>
    </div>
    <p className="text-sm text-slate-400 mb-4">
      Quand tes utilisateurs sont connectés (7 derniers jours)
    </p>

    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.activity}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="hour"
            stroke="#64748b"
            style={{ fontSize: "11px" }}
            interval={2}
          />
          <YAxis
            stroke="#64748b"
            style={{ fontSize: "11px" }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "12px",
            }}
            labelStyle={{ color: "#f59e0b" }}
            formatter={(value: number) => [`${value} utilisateurs`, "Actifs"]}
          />
          <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Info pic d'activité */}
    {data.activity.length > 0 && (
      <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <p className="text-sm text-amber-400 font-semibold">
          💡 Pic d&apos;activité :{" "}
          {
            data.activity.reduce((max, curr) =>
              curr.count > max.count ? curr : max
            ).hour
          }
        </p>
        <p className="text-xs text-amber-300/80 mt-1">
          C&apos;est le meilleur moment pour envoyer des notifications !
        </p>
      </div>
    )}
  </section>

  {/* Sources d'inscription */}
  <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
    <div className="flex items-center gap-2 mb-4">
      <Share2 className="w-5 h-5 text-emerald-400" />
      <h2 className="text-xl font-bold">📱 Sources d&apos;inscription</h2>
    </div>
    <p className="text-sm text-slate-400 mb-4">
      D&apos;où viennent tes utilisateurs
    </p>

    {data.sources.length === 0 ? (
      <div className="text-center py-12 text-slate-500">
        Aucune donnée disponible
      </div>
    ) : (
      <>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.sources}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ percentage }) => `${percentage}%`}
                labelLine={false}
              >
                {data.sources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                }}
                formatter={(value: number, name: string) => [
                  `${value} utilisateurs`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Légende */}
        <div className="mt-4 space-y-2">
          {data.sources.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-sm font-medium">{s.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold">{s.value}</span>
                <span className="text-xs text-slate-400 ml-2">
                  ({s.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </>
    )}
  </section>
</div>
        {/* Info footer */}
        <p className="text-center text-xs text-slate-600">
          🔄 Données mises à jour toutes les 60 secondes
        </p>
      </main>
    </div>
  );
}

// ══════════════════════════════════
// COMPOSANT RÉUTILISABLE
// ══════════════════════════════════
function RevenueCard({
  label,
  amount,
  count,
  color,
  featured,
}: {
  label: string;
  amount: number;
  count: number;
  color: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 border ${
        featured
          ? `bg-gradient-to-br ${color} border-transparent shadow-xl`
          : "bg-slate-900 border-slate-800"
      }`}
    >
      <p
        className={`text-xs ${
          featured ? "text-white/80" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <p
        className={`text-2xl font-black mt-2 ${
          featured ? "text-white" : ""
        }`}
      >
        {amount.toLocaleString()}
      </p>
      <p
        className={`text-xs mt-1 ${
          featured ? "text-white/70" : "text-slate-500"
        }`}
      >
        FCFA • {count} paiement{count > 1 ? "s" : ""}
      </p>
    </div>
  );
}
