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

export default function UsuarioListar() {
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const navigate = useNavigate();

  // modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null); // { id, usuario? }
  const [deleting, setDeleting] = useState(false);

  // helper 401/403
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // listado de usuarios (en tu backend no requiere rol; aun así mandamos token)
      const res = await guardedFetch(`${API_URL}/api/usuario/usuarios`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (error) {
      console.error(error);
      setErr(
        error.message?.includes("No autorizado")
          ? "No autorizado: inicia sesión nuevamente."
          : "No se pudieron cargar los usuarios."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data;
    return data.filter((u) =>
      [u.usuario, u.nombre, u.apellido, u.correo].some((v) =>
        String(v || "").toLowerCase().includes(term)
      )
    );
  }, [q, data]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  // Abrir modal
  const askDelete = (user) => {
    setToDelete(user);
    setConfirmOpen(true);
  };

  // Confirmar eliminación
  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await guardedFetch(`${API_URL}/api/usuario/delete/${toDelete.id}`, {
        method: "DELETE",
      });
      if (res.status === 204) {
        setData((d) => d.filter((x) => x.id !== toDelete.id));
      } else {
        alert("No se pudo eliminar.");
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
          <h1 className="text-2xl md:text-3xl font-semibold">Lista de Usuarios</h1>

          <Link
            to="/usuarios/registrar"
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
            placeholder="Buscar por usuario, nombre, apellido o correo…"
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
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Apellido</th>
                  <th className="px-4 py-3">Correo</th>
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
                {pageItems.map((u, i) => (
                  <tr key={u.id} className="border-t last:border-b">
                    <td className="px-4 py-3">{(page - 1) * pageSize + i + 1}</td>
                    <td className="px-4 py-3">{u.usuario}</td>
                    <td className="px-4 py-3">{u.nombre}</td>
                    <td className="px-4 py-3">{u.apellido}</td>
                    <td className="px-4 py-3">{u.correo}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => navigate(`/usuarios/editar/${u.id}`)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => askDelete(u)}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
        title="Eliminar usuario"
        message={
          toDelete
            ? `¿Seguro que deseas eliminar al usuario "${toDelete.usuario}"? Esta acción no se puede deshacer.`
            : "¿Seguro que deseas eliminar este usuario?"
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
