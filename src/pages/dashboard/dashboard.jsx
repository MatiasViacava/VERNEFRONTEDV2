// src/pages/dashboard/dashboard.jsx
import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://vernebackendv1.onrender.com";

/* -------------------- Helpers de fecha (FUERA del componente) -------------------- */

// YYYY-MM-DD desde un Date LOCAL
function keyLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function labelLocal(d) {
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" });
}

function isYMD(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// Normaliza lo que venga de la API a una clave YYYY-MM-DD en LOCAL
function keyFromApiDate(f) {
  if (!f) return "";
  if (isYMD(f)) return f; // viene como DATE puro → usar tal cual
  const d = new Date(f);
  if (isNaN(d)) return String(f).slice(0, 10); // fallback
  d.setHours(0, 0, 0, 0);
  return keyLocal(d);
}

// Formato amigable para la tabla (evita desfasar un día)
function formatDateUI(f) {
  if (!f) return "—";
  if (isYMD(f)) {
    const [y, m, d] = f.split("-");
    return `${d}/${m}/${y}`;
  }
  const d = new Date(f);
  return isNaN(d) ? String(f) : d.toLocaleDateString("es-PE");
}

/* -------------------------------------------------------------------------------- */

export default function Dashboard() {
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // "ingresos" | "unidades"
  const [metric, setMetric] = useState(
    () => localStorage.getItem("dash_metric") || "ingresos"
  );
  useEffect(() => {
    localStorage.setItem("dash_metric", metric);
  }, [metric]);

  const formatMoney = (v) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
      typeof v === "number" ? v : parseFloat(v ?? 0)
    );

  const fetchAll = async () => {
    setLoading(true);
    setErr("");
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch(`${API_URL}/api/venta/listar`),
        fetch(`${API_URL}/api/producto/listar`),
        fetch(`${API_URL}/api/cliente/listar`),
      ]);
      const [j1, j2, j3] = await Promise.all([r1.json(), r2.json(), r3.json()]);
      setVentas(Array.isArray(j1) ? j1 : []);
      setProductos(Array.isArray(j2) ? j2 : []);
      setClientes(Array.isArray(j3) ? j3 : []);
    } catch (e) {
      console.error(e);
      setErr("No se pudieron cargar los datos del dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Diccionarios id -> entidad (para mostrar nombres)
  const prodMap = useMemo(() => {
    const m = new Map();
    for (const p of productos) m.set(p.id_producto, p);
    return m;
  }, [productos]);

  const cliMap = useMemo(() => {
    const m = new Map();
    for (const c of clientes) m.set(c.id_cliente, c);
    return m;
  }, [clientes]);

  // KPIs
  const kpis = useMemo(() => {
    const ingresos = ventas.reduce(
      (acc, v) => acc + (parseFloat(v.importe_total ?? 0) || 0),
      0
    );
    return {
      ingresos,
      totalVentas: ventas.length,
      totalProductos: productos.length,
      totalClientes: clientes.length,
    };
  }, [ventas, productos, clientes]);

  // Ventas últimos 7 días (LOCAL) — ahora con selector de métrica
  const serie7d = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [...Array(7)].map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i)); // 6 días atrás … hoy
      return { key: keyLocal(d), label: labelLocal(d), total: 0 };
    });

    const index = Object.fromEntries(days.map((d, i) => [d.key, i]));

    for (const v of ventas) {
      const kv = keyFromApiDate(v.fecha); // normalizado
      const i = index[kv];
      if (i !== undefined) {
        const val =
          metric === "ingresos"
            ? (parseFloat(v.importe_total ?? 0) || 0)
            : (parseInt(v.cantidad ?? 0) || 0);
        days[i].total += val;
      }
    }
    return days;
  }, [ventas, metric]);

  const maxBar = Math.max(1, ...serie7d.map((d) => d.total));
  const hayBarras = serie7d.some((d) => d.total > 0);

  // Ventas recientes (con nombres)
  const recientes = useMemo(() => {
    const key = (x) => keyFromApiDate(x); // ordena por YYYY-MM-DD
    return [...ventas]
      .sort((a, b) => key(b.fecha).localeCompare(key(a.fecha)))
      .slice(0, 6)
      .map((v) => ({
        ...v,
        cliente_nombre:
          cliMap.get(v.id_cliente)?.nombre_empresa ??
          v.cliente_nombre ??
          `#${v.id_cliente}`,
        producto_nombre:
          prodMap.get(v.id_producto)?.nombre_producto ??
          v.producto_nombre ??
          `#${v.id_producto}`,
      }));
  }, [ventas, cliMap, prodMap]);

  const metricLabel =
    metric === "ingresos" ? "Ingresos (S/)" : "Unidades (uds)";
  const valueText = (n) => (metric === "ingresos" ? formatMoney(n) : `${n} uds`);

  return (
    <section className="w-full">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">
            Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAll}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
            >
              Actualizar
            </button>
          </div>
        </div>

        {err && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Ingresos" value={formatMoney(kpis.ingresos)} hint="Total acumulado" />
          <KPICard title="Ventas" value={kpis.totalVentas} hint="Comprobantes" />
          <KPICard title="Clientes" value={kpis.totalClientes} hint="Activos" />
          <KPICard title="Productos" value={kpis.totalProductos} hint="Catálogo" />
        </div>

        {/* Gráficos + tabla */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Barras 7 días */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">Ventas últimos 7 días</h3>
                <div className="text-xs text-slate-500 mt-1">Mostrando: {metricLabel}</div>
              </div>

              {/* Toggle de métrica */}
              <div className="inline-flex rounded-md border border-slate-300 overflow-hidden">
                <button
                  onClick={() => setMetric("ingresos")}
                  className={`px-3 py-1 text-sm ${
                    metric === "ingresos"
                      ? "bg-slate-900 text-white"
                      : "bg-white hover:bg-slate-50"
                  }`}
                >
                  Ingresos
                </button>
                <button
                  onClick={() => setMetric("unidades")}
                  className={`px-3 py-1 text-sm ${
                    metric === "unidades"
                      ? "bg-slate-900 text-white"
                      : "bg-white hover:bg-slate-50"
                  }`}
                >
                  Unidades
                </button>
              </div>
            </div>

            <div className="mt-4">
              {loading ? (
                <div className="text-slate-500">Cargando…</div>
              ) : (
                <div className="h-56 flex items-end gap-3">
                  {serie7d.map((d) => {
                    const h = Math.round((d.total / maxBar) * 100);
                    return (
                      <div
                        key={d.key}
                        className="flex-1 h-full flex flex-col justify-end items-center gap-1"
                      >
                        {/* valor arriba de la barra */}
                        <div className="text-[11px] text-slate-600 font-mono tabular-nums">
                          {valueText(d.total)}
                        </div>
                        <div
                          className="w-full max-w-[38px] rounded-md bg-amber-500 hover:bg-amber-600 transition"
                          style={{ height: `${Math.max(6, h)}%` }}
                          title={`${d.label}: ${valueText(d.total)}`}
                        />
                        <div className="text-xs text-slate-500">{d.label}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!loading && !hayBarras && (
                <div className="mt-3 text-sm text-slate-500">
                  No hay ventas en los últimos 7 días.
                </div>
              )}
            </div>
          </div>

          {/* Top productos */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-800">Top productos (por cantidad)</h3>
            <TopProductos ventas={ventas} prodMap={prodMap} />
          </div>

          {/* Ventas recientes */}
          <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Ventas recientes</h3>
              <span className="text-xs text-slate-500">
                Mostrando {recientes.length} de {ventas.length}
              </span>
            </div>

            <div className="mt-3 overflow-x-auto">
              {loading ? (
                <div className="text-slate-500">Cargando…</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-4 py-3">Cantidad</th>
                      <th className="px-4 py-3">Importe</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recientes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                          Sin registros.
                        </td>
                      </tr>
                    ) : (
                      recientes.map((v) => (
                        <tr key={v.id_venta} className="border-t last:border-b">
                          <td className="px-4 py-3">{formatDateUI(v.fecha)}</td>
                          <td className="px-4 py-3">
                            {cliMap.get(v.id_cliente)?.nombre_empresa ?? `#${v.id_cliente}`}
                          </td>
                          <td className="px-4 py-3">
                            {prodMap.get(v.id_producto)?.nombre_producto ?? `#${v.id_producto}`}
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums">{v.cantidad}</td>
                          <td className="px-4 py-3 font-mono tabular-nums">
                            {formatMoney(v.importe_total)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge status={v.estado} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------- Subcomponentes ----------------- */

function KPICard({ title, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-2 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

function Badge({ status }) {
  const ok = Number(status) === 1 || String(status).toLowerCase() === "pagado";
  const cls = ok
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-amber-50 text-amber-700 border-amber-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}>
      {ok ? "Pagado" : "Pendiente"}
    </span>
  );
}

function TopProductos({ ventas, prodMap }) {
  const agregados = useMemo(() => {
    const map = new Map();
    for (const v of ventas) {
      const id = v.id_producto;
      const nombre = prodMap.get(id)?.nombre_producto ?? `#${id}`;
      const q = Number(v.cantidad) || 0;
      const prev = map.get(id) || { name: nombre, qty: 0 };
      prev.qty += q;
      map.set(id, prev);
    }
    const arr = [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
    const max = Math.max(1, ...arr.map((x) => x.qty));
    return arr.map((x) => ({ ...x, pct: Math.round((x.qty / max) * 100) }));
  }, [ventas, prodMap]);

  if (agregados.length === 0) {
    return <div className="mt-3 text-slate-500 text-sm">Sin datos suficientes.</div>;
  }

  return (
    <div className="mt-4 space-y-3">
      {agregados.map((p) => (
        <div key={p.name}>
          <div className="flex items-center justify-between text-sm">
            <div className="text-slate-700">{p.name}</div>
            <div className="text-slate-500 font-mono tabular-nums">{p.qty} uds</div>
          </div>
          <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${p.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
