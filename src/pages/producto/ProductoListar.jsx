// src/pages/producto/ProductoListar.jsx
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

export default function ProductoListar() {
  const navigate = useNavigate();

  const [data, setData] = useState([]);          // productos
  const [marcas, setMarcas] = useState([]);      // marcas (para mapear id -> nombre)
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null); // { id_producto, nombre_producto? }
  const [deleting, setDeleting] = useState(false);

  // --- auth helper ---
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

  // --- Helpers ---
  const formatMoney = (v) => {
    const n =
      typeof v === "number"
        ? v
        : parseFloat(String(v ?? "0").replace(",", "."));
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(isNaN(n) ? 0 : n);
  };

  const getMarcaLabel = (p, map) =>
    p?.marca_nombre ||
    p?.nombre_marca ||
    map[p?.id_marca] ||
    p?.marca ||
    p?.id_marca ||
    "—";

  // --- Cargas ---
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await guardedFetch(`${API_URL}/api/producto/listar`);
      const ct = res.headers.get("content-type") || "";
      const json = ct.includes("application/json") ? await res.json() : [];
      // Esperado por fila: { id_producto, nombre_producto, id_marca, marca_nombre?, precio_unitario, stock }
      setData(Array.isArray(json) ? json : []);
    } catch (e) {
      console.error(e);
      setErr(
        e.message?.includes("No autorizado")
          ? "No autorizado: inicia sesión nuevamente."
          : "No se pudieron cargar los productos."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchMarcas = async () => {
    try {
      const res = await guardedFetch(`${API_URL}/api/marca/listar`);
      const ct = res.headers.get("content-type") || "";
      const json = ct.includes("application/json") ? await res.json() : [];
      setMarcas(Array.isArray(json) ? json : []);
    } catch (e) {
      console.error(e);
      // Vista sigue sin mapa de marcas si falla
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchMarcas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mapa: id_marca -> nombre_marca
  const marcaMap = useMemo(
    () => Object.fromEntries(marcas.map((m) => [m.id_marca ?? m.id, m.nombre_marca ?? m.nombre])),
    [marcas]
  );

  // Búsqueda (incluye nombre de marca resuelto)
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data;

    return data.filter((p) => {
      const nombre = String(p.nombre_producto || "").toLowerCase();
      const marca = String(getMarcaLabel(p, marcaMap)).toLowerCase();
      const precio = String(p.precio_unitario ?? "").toLowerCase();
      const stock = String(p.stock ?? "").toLowerCase();
      return [nombre, marca, precio, stock].some((v) => v.includes(term));
    });
  }, [q, data, marcaMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  // --- Eliminar ---
  const askDelete = (row) => {
    setToDelete(row);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await guardedFetch(
        `${API_URL}/api/producto/delete/${toDelete.id_producto}`,
        { method: "DELETE" }
      );
      if (res.status === 204) {
        setData((d) => d.filter((x) => x.id_producto !== toDelete.id_producto));
      } else {
        const ct = res.headers.get("content-type") || "";
        let msg = "No se pudo eliminar.";
        if (ct.includes("application/json")) {
          const j = await res.json().catch(() => null);
          if (j?.message) msg = j.message; // p.ej. FK constraint
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
      {/* Contenedor CENTRADO */}
      <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
        {/* Encabezado: título + botón */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold">Lista de Productos</h1>

          <Link
            to="/productos/registrar-productos"
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
            placeholder="Buscar por nombre, marca, precio o stock…"
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
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Marca</th>
                  <th className="px-4 py-3">Precio unitario</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3 text-center w-[160px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                      Sin resultados.
                    </td>
                  </tr>
                )}

                {pageItems.map((p, i) => {
                  const marcaLabel = getMarcaLabel(p, marcaMap);
                  return (
                    <tr key={p.id_producto} className="border-t last:border-b">
                      <td className="px-4 py-3">{(page - 1) * pageSize + i + 1}</td>
                      <td className="px-4 py-3">{p.nombre_producto}</td>
                      <td className="px-4 py-3">{marcaLabel}</td>
                      <td className="px-4 py-3">{formatMoney(p.precio_unitario)}</td>
                      <td className="px-4 py-3">{p.stock}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() =>
                              navigate(`/productos/editar-producto/${p.id_producto}`)
                            }
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => askDelete(p)}
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
        title="Eliminar producto"
        message={
          toDelete
            ? `¿Seguro que deseas eliminar el producto "${toDelete.nombre_producto}"?`
            : "¿Seguro que deseas eliminar este producto?"
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
