// src/pages/machine-learning/PrediccionListar.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, authHeader } from "../../lib/api";

async function guardedJson(res, navigate) {
  if (res.status === 401 || res.status === 403) {
    navigate("/", { replace: true });
    throw new Error("No autorizado");
  }
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `HTTP ${res.status}`);
  }
  return res.json();
}

const MODEL_LABELS = {
  baseline_csv: "XGBoost", // ← cambia este texto
  xgboost: "XGBoost",
  // agrega más si quieres
};
const modelLabel = (code) => MODEL_LABELS[code] ?? code;

const formatCurrency = (v) => {
  if (v == null || isNaN(v)) return "-";
  return v.toLocaleString("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 2,
  });
};

const formatDate = (s) => {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString(); // respeta la zona horaria local del navegador
};

export default function PrediccionListar() {
  const navigate = useNavigate();

  const [runs, setRuns] = useState([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [runsError, setRunsError] = useState("");

  const [selectedRun, setSelectedRun] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [detallesError, setDetallesError] = useState("");

  // paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5); // 5, 10, 20, 50

  const totalPages = useMemo(
    () => (runs.length > 0 ? Math.ceil(runs.length / pageSize) : 1),
    [runs, pageSize]
  );

  const pageRuns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return runs.slice(start, start + pageSize);
  }, [runs, currentPage, pageSize]);

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const goPrev = () => {
    if (canPrev) setCurrentPage((p) => p - 1);
  };

  const goNext = () => {
    if (canNext) setCurrentPage((p) => p + 1);
  };

  const handlePageSizeChange = (e) => {
    const value = Number(e.target.value) || 10;
    setPageSize(value);
    setCurrentPage(1); // reset a la primera página
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [runs.length]);

  // --------- cargar corridas ---------
  const loadRuns = async () => {
    setLoadingRuns(true);
    setRunsError("");
    try {
      const data = await guardedJson(
        await fetch(`${API_URL}/api/forecast/history`, {
          headers: { ...authHeader() },
        }),
        navigate
      );
      setRuns(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setRunsError(
        e.message?.includes("No autorizado")
          ? "No autorizado: inicia sesión nuevamente."
          : `No se pudo cargar el historial: ${e.message}`
      );
    } finally {
      setLoadingRuns(false);
    }
  };

  useEffect(() => {
    loadRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------- eliminar corrida ---------
  const handleDeleteRun = async (run) => {
    const ok = window.confirm(
      `¿Seguro que deseas eliminar la corrida #${run.id_run}?`
    );
    if (!ok) return;

    try {
      await guardedJson(
        await fetch(`${API_URL}/api/forecast/history/${run.id_run}`, {
          method: "DELETE",
          headers: { ...authHeader() },
        }),
        navigate
      );

      if (selectedRun && selectedRun.id_run === run.id_run) {
        setSelectedRun(null);
        setDetalles([]);
        setDetallesError("");
      }

      await loadRuns();
    } catch (e) {
      console.error(e);
      alert(
        e.message?.includes("No autorizado")
          ? "No autorizado: vuelve a iniciar sesión."
          : `No se pudo eliminar la corrida: ${e.message}`
      );
    }
  };

  // --------- cargar detalle de una corrida ---------
  const loadDetalle = async (run) => {
    setSelectedRun(run);
    setDetalles([]);
    setDetallesError("");
    setLoadingDetalles(true);
    try {
      const data = await guardedJson(
        await fetch(`${API_URL}/api/forecast/history/${run.id_run}`, {
          headers: { ...authHeader() },
        }),
        navigate
      );
      setDetalles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setDetallesError(
        e.message?.includes("No autorizado")
          ? "No autorizado: inicia sesión nuevamente."
          : `No se pudo cargar el detalle: ${e.message}`
      );
    } finally {
      setLoadingDetalles(false);
    }
  };

  return (
    <section className="w-full">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Título */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">
              Historial de predicciones
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Aquí puedes revisar todas las corridas de predicción realizadas con
              el modelo de machine learning.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRuns}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Actualizar
          </button>
        </div>

        {/* Tabla de corridas + paginación */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          {runsError && (
            <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {runsError}
            </div>
          )}

          {loadingRuns ? (
            <div className="text-sm text-slate-500">Cargando historial…</div>
          ) : runs.length === 0 ? (
            <div className="text-sm text-slate-500">
              No hay corridas de predicción registradas.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Creado en</th>
                      <th className="px-3 py-2">Origen</th>
                      <th className="px-3 py-2">Modelo</th>
                      <th className="px-3 py-2">Versión</th>
                      <th className="px-3 py-2">Periodo</th>
                      <th className="px-3 py-2 text-center">Horizonte</th>
                      <th className="px-3 py-2 text-center w-[180px]">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRuns.map((r) => (
                      <tr key={r.id_run} className="border-t last:border-b">
                        <td className="px-3 py-2">{r.id_run}</td>
                        <td className="px-3 py-2">{formatDate(r.creado_en)}</td>
                        <td className="px-3 py-2">{r.origen}</td>
                        <td className="px-3 py-2">{modelLabel(r.modelo)}</td>
                        <td className="px-3 py-2">{r.modelo_version}</td>
                        <td className="px-3 py-2">
                          {r.periodo_inicio} → {r.periodo_fin}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {r.horizonte_meses}
                        </td>
                        <td className="px-3 py-2 text-center space-x-2">
                          <button
                            type="button"
                            onClick={() => loadDetalle(r)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            Ver detalle
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRun(r)}
                            className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Controles de paginación */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pt-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span>Mostrando</span>
                  <select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs outline-none focus:border-amber-500 bg-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>corridas por página</span>
                </div>

                <div className="flex items-center gap-3 md:ml-auto">
                  <span>
                    Página <span className="font-semibold">{currentPage}</span>{" "}
                    de <span className="font-semibold">{totalPages}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={goPrev}
                      disabled={!canPrev}
                      className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-xs"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={!canNext}
                      className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-xs"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detalle de la corrida seleccionada */}
        {selectedRun && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Detalle de la corrida #{selectedRun.id_run}
                </h2>
                <p className="text-xs text-slate-500">
                  Periodo: {selectedRun.periodo_inicio} →{" "}
                  {selectedRun.periodo_fin} · Horizonte:{" "}
                  {selectedRun.horizonte_meses}{" "}
                  {selectedRun.horizonte_meses === 1 ? "mes" : "meses"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRun(null);
                  setDetalles([]);
                  setDetallesError("");
                }}
                className="text-xs text-slate-500 hover:underline"
              >
                Cerrar detalle
              </button>
            </div>

            {detallesError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {detallesError}
              </div>
            )}

            {loadingDetalles ? (
              <div className="text-sm text-slate-500">Cargando detalle…</div>
            ) : detalles.length === 0 ? (
              <div className="text-sm text-slate-500">
                No hay registros de detalle para esta corrida.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm mb-2">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Producto</th>
                      <th className="px-3 py-2">Fecha (mes)</th>
                      <th className="px-3 py-2 text-right">Predicción</th>
                      <th className="px-3 py-2 text-right">Baseline</th>
                      <th className="px-3 py-2 text-center">ABC</th>
                      <th className="px-3 py-2 text-center">XYZ</th>
                      <th className="px-3 py-2 text-center">ABC-XYZ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((d) => (
                      <tr key={d.id_detalle} className="border-t last:border-b">
                        <td className="px-3 py-2">{d.producto || "—"}</td>
                        <td className="px-3 py-2">{d.fecha_mes}</td>
                        <td className="px-3 py-2 text-right">
                          {formatCurrency(d.venta_predicha)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatCurrency(d.baseline)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {d.categoria_abc || "—"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {d.categoria_xyz || "—"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {d.categoria_abcxyz || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
