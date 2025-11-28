// src/pages/venta/VentaListar.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL, authHeader } from "../../lib/api";

/* Modal de confirmación reutilizable */
function ConfirmModal({ open, title, message, onCancel, onConfirm, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-11/12 max-w-md rounded-xl bg-white p-5 shadow-lg"
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VentaListar() {
  const navigate = useNavigate();

  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // --- fetch con auth + redirección 401/403 ---
  const guardedFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...authHeader(),
        ...(options.headers || {}),
      },
    });
    if (res.status === 401 || res.status === 403) {
      navigate("/", { replace: true });
      throw new Error("No autorizado");
    }
    return res;
  };

  const formatMoney = (v) =>
    new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(Number.isFinite(+v) ? +v : 0);

  // Evitar desfase: si viene "YYYY-MM-DD" lo muestro como DD/MM/YYYY sin parsear Date
  const formatDate = (s) => {
    if (!s) return "";
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    const d = new Date(s);
    return isNaN(d) ? String(s) : d.toLocaleDateString("es-PE");
  };

  // Cargar ventas + clientes + productos
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [rv, rc, rp] = await Promise.all([
        guardedFetch(`${API_URL}/api/venta/listar`),
        guardedFetch(`${API_URL}/api/cliente/listar`),
        guardedFetch(`${API_URL}/api/producto/listar`),
      ]);

      const [vJson, cJson, pJson] = await Promise.all([
        rv.json().catch(() => []),
        rc.json().catch(() => []),
        rp.json().catch(() => []),
      ]);
      setVentas(Array.isArray(vJson) ? vJson : []);
      setClientes(Array.isArray(cJson) ? cJson : []);
      setProductos(Array.isArray(pJson) ? pJson : []);
    } catch (error) {
      console.error(error);
      setErr(
        error.message?.includes("No autorizado")
          ? "No autorizado: inicia sesión nuevamente."
          : "No se pudieron cargar las ventas."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resetear a página 1 cuando cambie el término de búsqueda
  useEffect(() => {
    setPage(1);
  }, [q]);

  // Mapas para etiquetas
  const clienteMap = useMemo(() => {
    const m = {};
    for (const c of clientes) m[c.id_cliente] = c.nombre_empresa;
    return m;
  }, [clientes]);

  // Sin marca: solo nombre del producto y precio unitario
  const productoMap = useMemo(() => {
    const m = {};
    for (const p of productos) {
      m[p.id_producto] = {
        nombre: p.nombre_producto,
        precio: Number(p.precio_unitario ?? 0),
      };
    }
    return m;
  }, [productos]);

  // Filtro (cliente, producto, cantidad, fecha, importe)
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return ventas;
    return ventas.filter((v) => {
      const cli = clienteMap[v.id_cliente] || String(v.id_cliente || "");
      const prod = productoMap[v.id_producto]?.nombre || String(v.id_producto || "");
      const cantidad = String(v.cantidad ?? "");
      const fecha = String(v.fecha ?? "");
      const importe = String(v.importe_total ?? "");
      return [cli, prod, cantidad, fecha, importe].join(" ").toLowerCase().includes(term);
    });
  }, [q, ventas, clienteMap, productoMap]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  // Modal eliminar
  const askDelete = (row) => {
    setToDelete(row);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await guardedFetch(`${API_URL}/api/venta/delete/${toDelete.id_venta}`, {
        method: "DELETE",
      });
      if (res.status === 204) {
        setVentas((d) => d.filter((x) => x.id_venta !== toDelete.id_venta));
      } else {
        const ct = res.headers.get("content-type") || "";
        let msg = "No se pudo eliminar.";
        if (ct.includes("application/json")) {
          const j = await res.json().catch(() => null);
          if (j?.message) msg = j.message; // p.ej., restricción/validación server
        }
        alert(msg);
      }
    } catch (error) {
      console.error(error);
      alert(
        error.message?.includes("No autorizado")
          ? "No autorizado: vuelve a iniciar sesión."
          : "Error de red."
      );
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  return (
    <section className="w-full">
      <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold">Lista de Ventas</h1>

          <Link
            to="/ventas/registrar-ventas"
            className="w-full sm:w-auto rounded-md bg-amber-600 px-4 py-2 text-center text-white hover:bg-amber-700 !no-underline"
          >
            + Registrar
          </Link>
        </div>

        {/* Búsqueda */}
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por cliente, producto, fecha…"
            className="w-full md:w-96 rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-amber-500"
          />
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}

        {loading ? (
          <div className="text-slate-500">Cargando…</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Cant.</th>
                  <th className="px-4 py-3">P. Unitario</th>
                  <th className="px-4 py-3">Importe</th>
                  <th className="px-4 py-3 text-center w-[160px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                      Sin resultados.
                    </td>
                  </tr>
                )}

                {pageItems.map((v, i) => {
                  const prod = productoMap[v.id_producto] || {};
                  const cli = clienteMap[v.id_cliente] || v.id_cliente;

                  const prodLabel = prod.nombre || v.id_producto;
                  const unit = Number(prod.precio ?? 0);
                  const importe =
                    v.importe_total != null
                      ? Number(v.importe_total)
                      : unit * Number(v.cantidad ?? 0);

                  return (
                    <tr key={v.id_venta} className="border-t last:border-b">
                      <td className="px-4 py-3">{(page - 1) * pageSize + i + 1}</td>
                      <td className="px-4 py-3">{formatDate(v.fecha)}</td>
                      <td className="px-4 py-3">{cli}</td>
                      <td className="px-4 py-3">{prodLabel}</td>
                      <td className="px-4 py-3">{v.cantidad}</td>
                      <td className="px-4 py-3">{formatMoney(unit)}</td>
                      <td className="px-4 py-3">{formatMoney(importe)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => navigate(`/ventas/editar-ventas/${v.id_venta}`)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => askDelete(v)}
                            className="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Paginación */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 text-sm text-slate-600">
              <span>
                Página <strong>{page}</strong> de <strong>{totalPages}</strong> — Registros:{" "}
                <strong>{filtered.length}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <button
                  className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      <ConfirmModal
        open={confirmOpen}
        title="Eliminar venta"
        message={
          toDelete
            ? `¿Seguro que deseas eliminar la venta del ${formatDate(toDelete.fecha)}?`
            : "¿Seguro que deseas eliminar esta venta?"
        }
        onCancel={() => {
          setConfirmOpen(false);
          setToDelete(null);
        }}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </section>
  );
}
