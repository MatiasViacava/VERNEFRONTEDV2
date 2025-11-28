// src/pages/tipoUsuario/TipoUsuarioRegistrar.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL, authHeader } from "../../lib/api";

export default function TipoUsuarioRegistrar() {
  const navigate = useNavigate();
  const { id } = useParams(); // si vienes de /tipo-usuarios/editar/:id
  const isEditing = Boolean(id);

  const [form, setForm] = useState({
    tipo_usuario: "",
    id_usuario: "",
  });

  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRecord, setLoadingRecord] = useState(false);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // helper: agrega token y maneja 401/403
  const guardedFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
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

  // Cargar usuarios para el <select>
  useEffect(() => {
    (async () => {
      try {
        setLoadingUsers(true);
        const res = await guardedFetch(`${API_URL}/api/usuario/usuarios`, {
          // GET sin body
          headers: { ...authHeader() },
        });
        const data = await res.json();
        setUsuarios(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setServerError(
          err.message?.includes("No autorizado")
            ? "No autorizado: inicia sesión nuevamente."
            : "No se pudieron cargar los usuarios."
        );
      } finally {
        setLoadingUsers(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si es edición, cargar el tipo_usuario
  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      try {
        setLoadingRecord(true);
        const res = await guardedFetch(`${API_URL}/api/tipo-usuario/${id}`, {
          headers: { ...authHeader() },
        });
        const tu = await res.json();
        if (tu?.id_tipousuario) {
          setForm({
            tipo_usuario: tu.tipo_usuario || "",
            id_usuario: String(tu.id_usuario ?? ""),
          });
        } else {
          setServerError("No se encontró el tipo de usuario.");
        }
      } catch (err) {
        console.error(err);
        setServerError(
          err.message?.includes("No autorizado")
            ? "No autorizado: inicia sesión nuevamente."
            : "No se pudo cargar el tipo de usuario."
        );
      } finally {
        setLoadingRecord(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const e = {};
    if (!form.tipo_usuario.trim()) e.tipo_usuario = "El nombre del tipo es obligatorio.";
    if (!form.id_usuario) e.id_usuario = "Debes seleccionar un usuario.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        tipo_usuario: form.tipo_usuario.trim(),
        id_usuario: Number(form.id_usuario),
      };

      const url = isEditing
        ? `${API_URL}/api/tipo-usuario/update/${id}`
        : `${API_URL}/api/tipo-usuario/insert`;
      const method = isEditing ? "PUT" : "POST";

      const res = await guardedFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const ok = (!isEditing && res.status === 201) || (isEditing && res.status === 204);
      if (ok) {
        navigate("/tipo-usuarios/listar");
      } else {
        let msg = isEditing
          ? "No se pudo actualizar el tipo de usuario."
          : "No se pudo registrar el tipo de usuario.";

        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          try {
            const data = await res.json();
            if (data?.detail) msg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
            if (data?.message) msg = data.message;
          } catch {
            /* body vacío o no-JSON */
          }
        }
        setServerError(msg);
      }
    } catch (err) {
      console.error(err);
      setServerError(
        err.message?.includes("No autorizado")
          ? "No autorizado: inicia sesión nuevamente."
          : "Error de red o servidor."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-full">
      <div className="mx-auto max-w-3xl lg:max-w-4xl space-y-6 lg:space-y-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
          {isEditing ? "Modificar Tipo de Usuario" : "Registrar Tipo de Usuario"}
        </h1>

        {serverError && (
          <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm">
            {serverError}
          </div>
        )}

        {loadingRecord ? (
          <div className="text-slate-500">Cargando datos…</div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm"
          >
            {/* Tipo de usuario */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de usuario
              </label>
              <input
                name="tipo_usuario"
                value={form.tipo_usuario}
                onChange={onChange}
                placeholder="Ej. Administrador, Vendedor, Analista…"
                className={`w-full rounded-md border px-3 py-2 outline-none ${
                  errors.tipo_usuario ? "border-red-400" : "border-slate-300 focus:border-amber-500"
                }`}
              />
              {errors.tipo_usuario && (
                <p className="text-red-600 text-xs mt-1">{errors.tipo_usuario}</p>
              )}
            </div>

            {/* Usuario (select) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Usuario
              </label>
              <select
                name="id_usuario"
                value={form.id_usuario}
                onChange={onChange}
                disabled={loadingUsers || usuarios.length === 0}
                className={`w-full rounded-md border px-3 py-2 outline-none bg-white ${
                  errors.id_usuario ? "border-red-400" : "border-slate-300 focus:border-amber-500"
                }`}
              >
                <option value="">Selecciona un usuario…</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.usuario
                      ? `${u.usuario} - ${u.nombre} ${u.apellido}`
                      : `${u.nombre} ${u.apellido}`}
                  </option>
                ))}
              </select>
              {errors.id_usuario && (
                <p className="text-red-600 text-xs mt-1">{errors.id_usuario}</p>
              )}
              {loadingUsers && (
                <p className="text-slate-500 text-xs mt-1">Cargando usuarios…</p>
              )}
              {!loadingUsers && usuarios.length === 0 && (
                <p className="text-slate-500 text-xs mt-1">No hay usuarios para asignar.</p>
              )}
            </div>

            {/* Botones centrados */}
            <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2 justify-center">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-amber-600 px-5 py-2 text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {submitting
                  ? "Guardando…"
                  : isEditing
                  ? "Guardar cambios"
                  : "Registrar"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/tipo-usuarios/listar")}
                className="rounded-md border border-slate-300 px-5 py-2 text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
