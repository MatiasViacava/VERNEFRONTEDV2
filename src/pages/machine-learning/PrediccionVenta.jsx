// src/pages/machine-learning/PrediccionVenta.jsx
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

const money = (v) =>
  typeof v === "number"
    ? v.toLocaleString("es-PE", {
        style: "currency",
        currency: "PEN",
        maximumFractionDigits: 2,
      })
    : "—";

// clave robusta (evita colisiones cuando id=0 en CSV)
const keyOf = (id, nombre) => `${id ?? 0}|${(nombre || "").toLowerCase().trim()}`;

export default function PrediccionVenta() {
  const [mode, setMode] = useState("db"); // "db" | "file"
  const navigate = useNavigate();

  // todos los productos cargados desde el último ABC-XYZ
  const [productos, setProductos] = useState([]);

  const [mes, setMes] = useState(""); // YYYY-MM
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [serverError, setServerError] = useState("");

  // filtros ABC / XYZ
  const [abcFilter, setAbcFilter] = useState({ A: true, B: false, C: false });
  const [xyzFilter, setXyzFilter] = useState({ X: true, Y: true, Z: false });

  // ----------------- cargar productos desde el ÚLTIMO análisis ABC-XYZ -----------------
  const loadFromLast = async (source) => {
    setServerError("");
    setLoadingProductos(true);
    try {
      // último análisis ABC-XYZ (DB o Excel)
      const abcRes = await guardedJson(
        await fetch(`${API_URL}/api/abcxyz/last?source=${source}`, {
          headers: { ...authHeader() },
        }),
        navigate
      );

      // mapa de marcas desde BD (opcional)
      let prodRes = [];
      try {
        prodRes = await guardedJson(
          await fetch(`${API_URL}/api/producto/listar-view`, {
            headers: { ...authHeader() },
          }),
          navigate
        );
      } catch {
        prodRes = [];
      }
      const marcaMap = new Map(
        (prodRes || []).map((p) => [p.id_producto, p.nombre_marca || ""])
      );

      const rows = abcRes.rows || [];
      const items = rows.map((r) => {
        const defaultSelected = r.ABC === "A" && (r.XYZ === "X" || r.XYZ === "Y");
        const marcaDesdeBd = marcaMap.get(r.id_producto);
        const marcaDesdeArchivo = r.marca; // viene de /api/abcxyz/import
        const marca =
          marcaDesdeBd && marcaDesdeBd.trim() !== ""
            ? marcaDesdeBd
            : marcaDesdeArchivo && marcaDesdeArchivo.trim() !== ""
            ? marcaDesdeArchivo
            : "Sin marca";

        const id = r.id_producto ?? 0;
        const producto = r.producto || "";
        return {
          id_producto: id,
          producto,
          marca,
          ABC: r.ABC,
          XYZ: r.XYZ,
          selected: defaultSelected,
          prediccion: null,
          _key: keyOf(id, producto),
        };
      });

      setProductos(items);
      // restablecer filtros por defecto
      setAbcFilter({ A: true, B: false, C: false });
      setXyzFilter({ X: true, Y: true, Z: false });
    } catch (e) {
      console.error(e);
      if (source === "db") {
        setServerError(
          "No se encontró un análisis ABC-XYZ reciente desde BD. Ejecuta el análisis en 'Análisis ABC-XYZ' (pestaña 'Desde BD')."
        );
      } else {
        setServerError(
          "No se encontró un análisis ABC-XYZ reciente desde archivo. Ejecuta el análisis en 'Análisis ABC-XYZ' (pestaña 'Importar Excel')."
        );
      }
    } finally {
      setLoadingProductos(false);
    }
  };

  // cuando cambia el modo, recargamos productos desde la fuente correspondiente
  useEffect(() => {
    setProductos([]);
    setServerError("");
    if (mode === "db") loadFromLast("db");
    else loadFromLast("excel");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ----------------- selección de productos -----------------
  const toggleOne = (_key) => {
    setProductos((prev) =>
      prev.map((p) => (p._key === _key ? { ...p, selected: !p.selected } : p))
    );
  };

  // productos visibles según filtros ABC/XYZ
  const filteredProductos = useMemo(
    () =>
      productos.filter(
        (p) => (abcFilter[p.ABC] ?? false) && (xyzFilter[p.XYZ] ?? false)
      ),
    [productos, abcFilter, xyzFilter]
  );

  const allSelected = useMemo(
    () => filteredProductos.length > 0 && filteredProductos.every((p) => p.selected),
    [filteredProductos]
  );

  const toggleAll = () => {
    const target = !allSelected;
    setProductos((prev) =>
      prev.map((p) =>
        (abcFilter[p.ABC] ?? false) && (xyzFilter[p.XYZ] ?? false)
          ? { ...p, selected: target }
          : p
      )
    );
  };

  // ----------------- llamada al backend de ML -----------------
  const handlePredict = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!mes) {
      setServerError("Selecciona el mes a predecir.               ");
      return;
    }

    const seleccionados = filteredProductos.filter((p) => p.selected);
    if (seleccionados.length === 0) {
      setServerError("Selecciona al menos un producto para predecir.");
      return;
    }

    const fecha_mes = `${mes}-01`; // YYYY-MM-01
    const payload = {
      origen: mode === "db" ? "abcxyz_db" : "abcxyz_csv",
      items: seleccionados.map((p) => ({
        id_producto: p.id_producto, // en CSV puede ser 0/NULL, backend ya lo maneja
        producto: p.producto,
        marca: p.marca,
        fecha_mes,
        pct_chg_1: 0.0,
        categoria_abc: p.ABC,
        categoria_xyz: p.XYZ,
      })),
    };

    setLoadingForecast(true);
    try {
      const res = await guardedJson(
        await fetch(`${API_URL}/api/forecast/xgb`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify(payload),
        }),
        navigate
      );

      // construir mapa por clave compuesta (id|producto)
      const predMap = new Map(
        (res || []).map((r) => [keyOf(r.id_producto, r.producto), r.prediccion])
      );

      setProductos((prev) =>
        prev.map((p) => ({
          ...p,
          prediccion: predMap.has(p._key) ? predMap.get(p._key) : p.prediccion,
        }))
      );
    } catch (e) {
      console.error(e);
      setServerError(`No se pudo calcular la predicción: ${e.message}`);
    } finally {
      setLoadingForecast(false);
    }
  };

  return (
    <section className="w-full">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Título */}
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Predicción de ventas (Machine Learning)
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Se usan los productos más importantes del análisis ABC-XYZ para
            predecir la venta mensual (en importe total) mediante el modelo XGBoost.
          </p>
        </header>

        {/* Toggle de fuente */}
        <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden">
          <button
            type="button"
            onClick={() => setMode("db")}
            className={`px-4 py-2 text-sm ${
              mode === "db"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Fuente: BD
          </button>
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`px-4 py-2 text-sm ${
              mode === "file"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Fuente: CSV/XLSX
          </button>
        </div>

        {/* Card explicación */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">
            Selección automática desde ABC-XYZ
          </h2>
          <p className="text-sm text-slate-600 max-w-3xl">
            Por defecto se cargan los productos con categoría A y tipo X/Y del
            último análisis ABC-XYZ ejecutado{" "}
            {mode === "db" ? "desde la base de datos." : "importando un CSV/XLSX."}{" "}
            Puedes incluir también B/C o Z usando los filtros ABC/XYZ de abajo.
          </p>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <button
              type="button"
              onClick={() => loadFromLast(mode === "db" ? "db" : "excel")}
              disabled={loadingProductos}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              {loadingProductos ? "Actualizando…" : "Actualizar desde último análisis"}
            </button>
            <span className="text-xs text-slate-500">
              Si modificas el análisis ABC-XYZ, vuelve a actualizar aquí para usar
              los nuevos productos.
            </span>
          </div>
        </div>

        {/* Mensaje de error superior */}
        {serverError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {/* Formulario de mes + tabla */}
        <form
          onSubmit={handlePredict}
          className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
        >
          {/* fila: mes + botón */}
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mes a predecir
              </label>
              <input
                type="month"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Se usará el día 1 del mes seleccionado como fecha objetivo.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loadingForecast || filteredProductos.length === 0}
                className="rounded-md bg-amber-600 px-5 py-2 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loadingForecast ? "Calculando..." : "Calcular predicción"}
              </button>
            </div>
          </div>

          {/* Filtros ABC / XYZ */}
          <div className="flex flex-wrap items-center gap-4 mb-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">ABC:</span>
              {["A", "B", "C"].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setAbcFilter((f) => ({ ...f, [k]: !f[k] }))}
                  className={`px-2 py-1 rounded-md border text-xs leading-none ${
                    abcFilter[k]
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">XYZ:</span>
              {["X", "Y", "Z"].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setXyzFilter((f) => ({ ...f, [k]: !f[k] }))}
                  className={`px-2 py-1 rounded-md border text-xs leading-none ${
                    xyzFilter[k]
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500">
              Productos visibles: {filteredProductos.length} / {productos.length}
            </span>
          </div>

          {/* Tabla de productos */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2 text-center">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                  </th>
                  <th className="px-4 py-2">Código</th>
                  <th className="px-4 py-2">Producto</th>
                  <th className="px-4 py-2">Marca</th>
                  <th className="px-4 py-2 text-center">ABC</th>
                  <th className="px-4 py-2 text-center">XYZ</th>
                  <th className="px-4 py-2 text-right">Predicción (importe)</th>
                </tr>
              </thead>
              <tbody>
                {loadingProductos ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                      Cargando productos…
                    </td>
                  </tr>
                ) : filteredProductos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                      No hay productos visibles con los filtros actuales.
                      Activa más categorías ABC/XYZ o actualiza el análisis ABC-XYZ.
                    </td>
                  </tr>
                ) : (
                  filteredProductos.map((p) => (
                    <tr key={p._key} className="border-t">
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={p.selected}
                          onChange={() => toggleOne(p._key)}
                        />
                      </td>
                      <td className="px-4 py-2">{p.id_producto}</td>
                      <td className="px-4 py-2">{p.producto}</td>
                      <td className="px-4 py-2">{p.marca}</td>
                      <td className="px-4 py-2 text-center">{p.ABC}</td>
                      <td className="px-4 py-2 text-center">{p.XYZ}</td>
                      <td className="px-4 py-2 text-right">
                        {p.prediccion != null ? money(p.prediccion) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </form>
      </div>
    </section>
  );
}
