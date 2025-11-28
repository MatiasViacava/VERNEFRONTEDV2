// src/pages/analisis-abcxyz/ResultABC.jsx
import { useMemo, useState } from "react";

const PEN = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export default function ResultABC({ result }) {
  const { months = [], rows = [], matrix = {}, totals = {}, top_series = [] } =
    result || {};

  const abcBase = totals?.revenue > 0 ? "Ingresos" : "Cantidades";

  // Filtros y búsqueda
  const [fABC, setFABC] = useState("ALL"); // A/B/C/ALL
  const [fXYZ, setFXYZ] = useState("ALL"); // X/Y/Z/ALL
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ key: "total_revenue", dir: "desc" });

  const filteredRows = useMemo(() => {
    let x = rows;
    if (fABC !== "ALL") x = x.filter((r) => r.ABC === fABC);
    if (fXYZ !== "ALL") x = x.filter((r) => r.XYZ === fXYZ);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      x = x.filter(
        (r) =>
          String(r.id_producto).includes(s) ||
          (r.producto || "").toLowerCase().includes(s)
      );
    }
    const k = sort.key;
    const dir = sort.dir === "asc" ? 1 : -1;
    x = [...x].sort((a, b) => {
      const av = a[k] ?? 0;
      const bv = b[k] ?? 0;
      if (typeof av === "string") return av.localeCompare(bv) * dir;
      return (av - bv) * dir;
    });
    return x;
  }, [rows, fABC, fXYZ, q, sort]);

  const grid = matrix?.grid || { A: { X: 0, Y: 0, Z: 0 }, B: { X: 0, Y: 0, Z: 0 }, C: { X: 0, Y: 0, Z: 0 } };
  const percent = matrix?.percent || { A: { X: 0, Y: 0, Z: 0 }, B: { X: 0, Y: 0, Z: 0 }, C: { X: 0, Y: 0, Z: 0 } };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Items clasificados" value={rows.length} hint="Productos con ABC-XYZ" />
        <KPICard
          title={`Base ABC: ${abcBase}`}
          value={abcBase === "Ingresos" ? PEN.format(totals?.revenue || 0) : `${sum(rows, "total_qty")} uds`}
          hint={abcBase === "Ingresos" ? "Suma de ingresos anuales" : "Suma de cantidades anuales"}
        />
        <KPICard title="Meses considerados" value={months.length} hint={months.join(" · ")} />
      </div>

      {/* Matriz + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Matriz ABC-XYZ</h3>
            <button
              className="text-xs text-slate-500 hover:underline"
              onClick={() => {
                setFABC("ALL");
                setFXYZ("ALL");
              }}
            >
              Limpiar filtros
            </button>
          </div>

          <Matrix
            grid={grid}
            percent={percent}
            onPick={(a, x) => {
              setFABC(a);
              setFXYZ(x);
            }}
          />
        </div>

        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-800">Gráfico de ventas (Top productos)</h3>
          <TinySeries months={months} series={top_series} />
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-800">Detalle por producto</h3>
            <div className="text-xs text-slate-500 mt-1">
              Filtros activos: ABC {fABC}, XYZ {fXYZ}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={fABC}
              onChange={(e) => setFABC(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="ALL">ABC: Todos</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
            <select
              value={fXYZ}
              onChange={(e) => setFXYZ(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="ALL">XYZ: Todos</option>
              <option value="X">X</option>
              <option value="Y">Y</option>
              <option value="Z">Z</option>
            </select>
            <input
              placeholder="Buscar producto/código…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th cur={sort} setCur={setSort} id="id_producto" label="Código" />
                <Th cur={sort} setCur={setSort} id="producto" label="Producto" />
                <Th cur={sort} setCur={setSort} id="ABC" label="ABC" />
                <Th cur={sort} setCur={setSort} id="XYZ" label="XYZ" />
                <Th cur={sort} setCur={setSort} id="total_qty" label="Cant. anual" align="right" />
                <Th cur={sort} setCur={setSort} id="total_revenue" label="Ingreso anual" align="right" />
                <Th cur={sort} setCur={setSort} id="cv" label="CV" align="right" />
                <th className="px-4 py-3">ABC-XYZ</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    Sin resultados.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => (
                  <tr key={r.id_producto} className="border-t last:border-b">
                    <td className="px-4 py-2">{r.id_producto}</td>
                    <td className="px-4 py-2">{r.producto}</td>
                    <td className="px-4 py-2">{r.ABC}</td>
                    <td className="px-4 py-2">{r.XYZ}</td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums">{r.total_qty}</td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums">
                      {PEN.format(r.total_revenue || 0)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums">
                      {r.cv?.toFixed(2)}
                    </td>
                    <td className="px-4 py-2">{r.ABCXYZ}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** ----------------- UI helpers en este mismo archivo ----------------- */

function KPICard({ title, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-2 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

function Th({ id, label, align = "left", cur, setCur }) {
  const active = cur.key === id;
  const dir = active ? cur.dir : "asc";
  return (
    <th
      className={`px-4 py-3 cursor-pointer select-none ${align === "right" ? "text-right" : ""}`}
      onClick={() =>
        setCur((s) => ({ key: id, dir: active ? (s.dir === "asc" ? "desc" : "asc") : "asc" }))
      }
      title="Ordenar"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (dir === "asc" ? "▲" : "▼")}
      </span>
    </th>
  );
}

function sum(arr, key) {
  return arr.reduce((a, r) => a + (Number(r[key]) || 0), 0);
}

/** Matriz 3x3 clicable */
function Matrix({ grid, percent, onPick }) {
  const cells = [
    { a: "A", x: "X" },
    { a: "A", x: "Y" },
    { a: "A", x: "Z" },
    { a: "B", x: "X" },
    { a: "B", x: "Y" },
    { a: "B", x: "Z" },
    { a: "C", x: "X" },
    { a: "C", x: "Y" },
    { a: "C", x: "Z" },
  ];
  return (
    <div className="mt-3 grid grid-cols-3 gap-3">
      {cells.map(({ a, x }) => {
        const n = grid?.[a]?.[x] || 0;
        const p = percent?.[a]?.[x] || 0;
        const bg =
          a === "A" && x === "Z"
            ? "bg-rose-50"
            : a === "C" && x === "X"
            ? "bg-emerald-50"
            : "bg-slate-50";
        return (
          <button
            key={`${a}${x}`}
            onClick={() => onPick?.(a, x)}
            className={`rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-100 ${bg}`}
            title={`Filtrar ${a}${x}`}
          >
            <div className="text-sm font-medium">
              {a}-{x}
            </div>
            <div className="text-2xl font-semibold">{n}</div>
            <div className="text-xs text-slate-500">{p.toFixed(1)}%</div>
          </button>
        );
      })}
    </div>
  );
}

/** Mini gráfico SVG sencillo (líneas) para top_series */
function TinySeries({ months, series }) {
  if (!series || series.length === 0)
    return <div className="mt-3 text-slate-500 text-sm">Sin datos suficientes.</div>;

  // Normalizar a [0,1]
  const max = Math.max(
    1,
    ...series.flatMap((s) => s.qty ?? []).map((v) => Number(v) || 0)
  );
  const W = 640;
  const H = 220;
  const pad = 24;

  const x = (i) => pad + (i * (W - pad * 2)) / Math.max(1, months.length - 1);
  const y = (v) => H - pad - ((Number(v) || 0) / max) * (H - pad * 2);

  const palette = ["#ef4444", "#0ea5e9", "#22c55e"]; // 3 colores neutros (rojo, azul, verde)

  return (
    <div className="mt-3 overflow-x-auto">
      <svg width={W} height={H}>
        {/* ejes */}
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#cbd5e1" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#cbd5e1" />

        {series.map((s, si) => {
          const pts = (s.qty || []).map((v, i) => `${x(i)},${y(v)}`).join(" ");
          return (
            <g key={si}>
              <polyline
                fill="none"
                stroke={palette[si % palette.length]}
                strokeWidth="2"
                points={pts}
              />
              {(s.qty || []).map((v, i) => (
                <circle
                  key={i}
                  cx={x(i)}
                  cy={y(v)}
                  r="3"
                  fill={palette[si % palette.length]}
                />
              ))}
            </g>
          );
        })}

        {/* labels X */}
        {months.map((m, i) => (
          <text key={m} x={x(i)} y={H - 6} fontSize="10" textAnchor="middle" fill="#64748b">
            {m.slice(5)}
          </text>
        ))}
      </svg>

      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
        {series.map((s, si) => (
          <span key={si} className="inline-flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ background: palette[si % palette.length] }}
            />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}