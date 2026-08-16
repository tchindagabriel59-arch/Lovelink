"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  Clock,
  TrendingUp,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

interface MonitoringData {
  summary: {
    totalRequests: number;
    totalErrors: number;
    errorRate: string;
    avgDuration: number;
  };
  recentErrors: Array<{
    id: number;
    endpoint: string;
    method: string;
    statusCode: number;
    durationMs: number;
    errorMessage: string | null;
    createdAt: string;
  }>;
  slowEndpoints: Array<{
    endpoint: string;
    method: string;
    avgDuration: number;
    maxDuration: number;
    callCount: number;
  }>;
  trafficData: Array<{
    hour: string;
    requests: number;
    errors: number;
  }>;
  statusData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  topEndpoints: Array<{
    endpoint: string;
    count: number;
  }>;
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/monitoring");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh toutes les 30 secondes
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function purgeOldLogs() {
    if (!confirm("Supprimer les logs de plus de 7 jours ?")) return;
    setPurging(true);
    try {
      const res = await fetch("/api/admin/monitoring", { method: "DELETE" });
      if (res.ok) {
        alert("✅ Vieux logs supprimés");
        fetchData();
      }
    } catch {
      alert("❌ Erreur");
    } finally {
      setPurging(false);
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}j`;
  }

  function getStatusColor(status: number) {
    if (status >= 500) return "text-red-400 bg-red-500/10 border-red-500/30";
    if (status >= 400) return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    if (status >= 300) return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    return "text-green-400 bg-green-500/10 border-green-500/30";
  }

  function getDurationColor(ms: number) {
    if (ms >= 2000) return "text-red-400";
    if (ms >= 1000) return "text-orange-400";
    if (ms >= 500) return "text-yellow-400";
    return "text-green-400";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto" />
          <p className="mt-4 text-slate-400">Chargement du monitoring...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <Activity className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400">
            Aucune donnée de monitoring disponible pour le moment.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Le logging va commencer à collecter des données au fur et à mesure des requêtes.
          </p>
        </div>
      </div>
    );
  }

  const healthStatus =
    parseFloat(data.summary.errorRate) < 1
      ? { text: "✅ Excellent", color: "text-green-400 bg-green-500/10 border-green-500/30" }
      : parseFloat(data.summary.errorRate) < 5
      ? { text: "⚠️ Correct", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" }
      : { text: "🚨 Critique", color: "text-red-400 bg-red-500/10 border-red-500/30" };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="p-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">📊 Monitoring</h1>
              <p className="text-sm text-slate-400">
                Surveillance des APIs et erreurs (24h)
              </p>
            </div>
          </div>

          {/* Statut global */}
          <div className={`px-4 py-2 rounded-xl border font-bold ${healthStatus.color}`}>
            {healthStatus.text}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* KPIs principaux */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<Zap className="w-6 h-6" />}
            label="Requêtes totales (24h)"
            value={data.summary.totalRequests.toLocaleString()}
            color="from-blue-500 to-cyan-500"
          />
          <KpiCard
            icon={<XCircle className="w-6 h-6" />}
            label="Erreurs (24h)"
            value={data.summary.totalErrors.toLocaleString()}
            color="from-red-500 to-pink-500"
            subtitle={`Taux : ${data.summary.errorRate}%`}
            alert={parseFloat(data.summary.errorRate) > 5}
          />
          <KpiCard
            icon={<Clock className="w-6 h-6" />}
            label="Durée moyenne"
            value={`${data.summary.avgDuration}ms`}
            color="from-amber-500 to-orange-500"
            alert={data.summary.avgDuration > 1000}
          />
          <KpiCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="Uptime"
            value="99.9%"
            color="from-green-500 to-emerald-500"
            subtitle="Vercel + Neon"
          />
        </div>

        {/* Trafic par heure */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold">📊 Trafic - 24 dernières heures</h2>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: "11px" }} />
                <YAxis stroke="#64748b" style={{ fontSize: "11px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#a855f7"
                  strokeWidth={3}
                  name="Requêtes"
                  dot={{ fill: "#a855f7", r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="errors"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Erreurs"
                  dot={{ fill: "#ef4444", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Répartition status codes */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold">📈 Codes de statut</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Répartition des réponses HTTP (24h)
            </p>

            {data.statusData.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Aucune donnée
              </div>
            ) : (
              <>
                <div className="w-full h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {data.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {data.statusData.map((s) => (
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
                      <span className="text-sm font-bold">{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Top endpoints */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold">🔥 Top endpoints</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Endpoints les plus utilisés (24h)
            </p>

            {data.topEndpoints.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Aucune donnée
              </div>
            ) : (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topEndpoints} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      type="number"
                      stroke="#64748b"
                      style={{ fontSize: "11px" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="endpoint"
                      stroke="#64748b"
                      style={{ fontSize: "10px" }}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                      }}
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

        {/* APIs les plus lentes */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold">⏱️ Top 10 APIs les plus lentes</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Endpoints avec le plus haut temps de réponse moyen (24h)
          </p>

          {data.slowEndpoints.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Aucune donnée de performance disponible
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="text-left p-3">Endpoint</th>
                    <th className="text-left p-3">Méthode</th>
                    <th className="text-right p-3">Moyenne</th>
                    <th className="text-right p-3">Max</th>
                    <th className="text-right p-3">Appels</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slowEndpoints.map((e, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30"
                    >
                      <td className="p-3 font-mono text-xs truncate max-w-xs">
                        {e.endpoint}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs font-bold">
                          {e.method}
                        </span>
                      </td>
                      <td
                        className={`p-3 text-right font-bold ${getDurationColor(
                          e.avgDuration
                        )}`}
                      >
                        {e.avgDuration}ms
                      </td>
                      <td className="p-3 text-right text-slate-400">
                        {e.maxDuration}ms
                      </td>
                      <td className="p-3 text-right text-slate-500">
                        {e.callCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Erreurs récentes */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-xl font-bold">🚨 Erreurs récentes (24h)</h2>
            </div>
            <button
              onClick={purgeOldLogs}
              disabled={purging}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs transition disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {purging ? "..." : "Purger vieux logs (7j+)"}
            </button>
          </div>

          {data.recentErrors.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-green-400 font-bold">Aucune erreur récente !</p>
              <p className="text-xs text-slate-500 mt-2">Ton API est en pleine forme 🎉</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {data.recentErrors.map((err) => (
                <div
                  key={err.id}
                  className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold border ${getStatusColor(
                        err.statusCode
                      )}`}
                    >
                      {err.statusCode}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs font-bold">
                      {err.method}
                    </span>
                    <span className="font-mono text-xs text-slate-300 truncate flex-1">
                      {err.endpoint}
                    </span>
                    <span className={`text-xs font-bold ${getDurationColor(err.durationMs)}`}>
                      {err.durationMs}ms
                    </span>
                    <span className="text-xs text-slate-500">
                      {timeAgo(err.createdAt)}
                    </span>
                  </div>
                  {err.errorMessage && (
                    <p className="text-xs text-red-300/80 mt-2 font-mono bg-red-500/5 p-2 rounded">
                      {err.errorMessage}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-xs text-slate-600">
          🔄 Actualisation automatique toutes les 30 secondes
        </p>
      </main>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  color,
  subtitle,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  subtitle?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`bg-slate-900 border rounded-2xl p-5 ${
        alert ? "border-red-500/50" : "border-slate-800"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}
      >
        {icon}
      </div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {subtitle && (
        <p className={`text-xs mt-1 ${alert ? "text-red-400" : "text-slate-500"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
