// src/pages/productos/marca/MarcaRegistrar.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL, authHeader } from "../../lib/api";

export default function MarcaRegistrar() {
  const navigate = useNavigate();
  const { id } = useParams();               // si vienes de /productos/marca/editar-marca/:id
  const isEditing = Boolean(id);

  const [form, setForm] = useState({ nombre_marca: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // helper: agrega token y maneja 401/403
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

  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      try {
        setLoadingRecord(true);
        const res = await guardedFetch(`${API_URL}/api/marca/${id}`);
        const ct = res.headers.get("content-type") || "";
        if (!res.ok) {
          let msg = "No se pudo cargar la marca.";
          if (ct.includes("application/json")) {
            const j = await res.json().catch(() => null);
            if (j?.message) msg = j.message;
          }
          throw new Error(msg);
        }
        const data = ct.includes("application/json") ? await res.json() : {};
        if (data?.id_marca) {
          setForm({ nombre_marca: data.nombre_marca ?? "" });
        } else {
          setServerError("No se encontró la marca.");
        }
      } catch (err) {
        console.error(err);
        setServerError(
          err.message?.includes("No autorizado")
            ? "No autorizado: inicia sesión nuevamente."
            : "No se pudo cargar la marca."
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
    if (!form.nombre_marca.trim()) e.nombre_marca = "El nombre de la marca es obligatorio.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = { nombre_marca: form.nombre_marca.trim() };
      const url = isEditing
        ? `${API_URL}/api/marca/update/${id}`
        : `${API_URL}/api/marca/insert`;
      const method = isEditing ? "PUT" : "POST";

      const res = await guardedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const ok = (!isEditing && res.status === 201) || (isEditing && res.status === 204);
      if (ok) {
        navigate("/productos/marca/listar-marca");
        return;
      }

      let msg = isEditing
        ? "No se pudo actualizar la marca."
        : "No se pudo registrar la marca.";

      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json().catch(() => null);
        if (data?.detail) msg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
        if (data?.message) msg = data.message;
      }
      setServerError(msg);
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
          {isEditing ? "Modificar Marca" : "Registrar Marca"}
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
            className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm"
          >
            {/* Nombre de la marca */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre de la marca
              </label>
              <input
                name="nombre_marca"
                value={form.nombre_marca}
                onChange={onChange}
                placeholder="Ej. Anphoterol, Nacional, etc."
                className={`w-full rounded-md border px-3 py-2 outline-none ${
                  errors.nombre_marca
                    ? "border-red-400"
                    : "border-slate-300 focus:border-amber-500"
                }`}
              />
              {errors.nombre_marca && (
                <p className="text-red-600 text-xs mt-1">{errors.nombre_marca}</p>
              )}
            </div>

            {/* Botones */}
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
                onClick={() => navigate("/productos/marca/listar-marca")}
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
