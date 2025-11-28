// src/pages/cliente/ClienteRegistrar.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL, authHeader } from "../../lib/api";

// Rutas usadas en este módulo
const LIST_PATH = "/ventas/cliente/listar-clientes";
// CREATE_PATH: "/ventas/cliente/registrar-clientes"
// EDIT_PATH:   "/ventas/cliente/editar-cliente/:id"

export default function ClienteRegistrar() {
  const navigate = useNavigate();
  const { id } = useParams(); // /ventas/cliente/editar-cliente/:id
  const isEditing = Boolean(id);

  const [form, setForm] = useState({
    nombre_empresa: "",
    ruc: "",
    direccion: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);

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

  // Cargar cliente si es edición
  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      try {
        setLoadingRecord(true);
        const res = await guardedFetch(`${API_URL}/api/cliente/${id}`);
        const ct = res.headers.get("content-type") || "";
        if (!res.ok) {
          let msg = "No se pudo cargar el cliente.";
          if (ct.includes("application/json")) {
            const j = await res.json().catch(() => null);
            if (j?.message) msg = j.message;
          }
          throw new Error(msg);
        }
        const data = ct.includes("application/json") ? await res.json() : {};
        if (data?.id_cliente) {
          setForm({
            nombre_empresa: data.nombre_empresa ?? "",
            ruc: String(data.ruc ?? ""),
            direccion: data.direccion ?? "",
          });
        } else {
          setServerError("No se encontró el cliente.");
        }
      } catch (err) {
        console.error(err);
        setServerError(
          err.message?.includes("No autorizado")
            ? "No autorizado: inicia sesión nuevamente."
            : "No se pudo cargar el cliente."
        );
      } finally {
        setLoadingRecord(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]);

  const onChange = (e) => {
    const { name, value } = e.target;
    // RUC: solo dígitos, máx. 11
    const v =
      name === "ruc" ? value.replace(/\D/g, "").slice(0, 11) : value;
    setForm((f) => ({ ...f, [name]: v }));
  };

  const validate = () => {
    const e = {};
    if (!form.nombre_empresa.trim())
      e.nombre_empresa = "El nombre de la empresa es obligatorio.";
    if (!/^\d{11}$/.test(form.ruc.trim()))
      e.ruc = "El RUC debe tener exactamente 11 dígitos.";
    if (!form.direccion.trim())
      e.direccion = "La dirección es obligatoria.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        nombre_empresa: form.nombre_empresa.trim(),
        ruc: form.ruc.trim(),
        direccion: form.direccion.trim(),
      };

      const url = isEditing
        ? `${API_URL}/api/cliente/update/${id}`
        : `${API_URL}/api/cliente/insert`;
      const method = isEditing ? "PUT" : "POST";

      const res = await guardedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const ok =
        (!isEditing && res.status === 201) ||
        (isEditing && res.status === 204);
      if (ok) {
        navigate(LIST_PATH);
        return;
      }

      let msg = isEditing
        ? "No se pudo actualizar el cliente."
        : "No se pudo registrar el cliente.";
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        try {
          const data = await res.json();
          if (data?.detail)
            msg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
          if (data?.message) msg = data.message;
        } catch {
          /* cuerpo vacío o no json */
        }
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
          {isEditing ? "Modificar Cliente" : "Registrar Cliente"}
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
            className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm"
          >
            {/* Nombre empresa */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre de la empresa
              </label>
              <input
                name="nombre_empresa"
                value={form.nombre_empresa}
                onChange={onChange}
                placeholder="Ej. Compañía XYZ S.A.C."
                className={`w-full rounded-md border px-3 py-2 outline-none ${
                  errors.nombre_empresa
                    ? "border-red-400"
                    : "border-slate-300 focus:border-amber-500"
                }`}
              />
              {errors.nombre_empresa && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.nombre_empresa}
                </p>
              )}
            </div>

            {/* RUC */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                RUC
              </label>
              <input
                name="ruc"
                value={form.ruc}
                onChange={onChange}
                inputMode="numeric"
                maxLength={11}
                placeholder="11 dígitos"
                className={`w-full rounded-md border px-3 py-2 outline-none ${
                  errors.ruc
                    ? "border-red-400"
                    : "border-slate-300 focus:border-amber-500"
                }`}
              />
              {errors.ruc && (
                <p className="text-red-600 text-xs mt-1">{errors.ruc}</p>
              )}
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Dirección
              </label>
              <input
                name="direccion"
                value={form.direccion}
                onChange={onChange}
                placeholder="Calle/Av. y número"
                className={`w-full rounded-md border px-3 py-2 outline-none ${
                  errors.direccion
                    ? "border-red-400"
                    : "border-slate-300 focus:border-amber-500"
                }`}
              />
              {errors.direccion && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.direccion}
                </p>
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
                onClick={() => navigate(LIST_PATH)}
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
