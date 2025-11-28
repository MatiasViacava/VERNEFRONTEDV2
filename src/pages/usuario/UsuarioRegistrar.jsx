import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL, authHeader } from "../../lib/api";

export default function UsuarioRegistrar() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [form, setForm] = useState({
    usuario: "",
    nombre: "",
    apellido: "",
    correo: "",
    contrasenia: "",
    contrasenia2: "",
  });

  const [originalPass, setOriginalPass] = useState(""); // hash existente (no se muestra)
  const [loadingUser, setLoadingUser] = useState(false);

  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  // helper: manejar 401/403 y parseo de error
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

  // Cargar datos cuando es edición
  useEffect(() => {
    if (!isEditing) return;

    const load = async () => {
      try {
        setLoadingUser(true);
        const res = await guardedFetch(`${API_URL}/api/usuario/${id}`);
        const u = await res.json();
        setForm({
          usuario: u?.usuario || "",
          nombre: u?.nombre || "",
          apellido: u?.apellido || "",
          correo: u?.correo || "",
          contrasenia: "",
          contrasenia2: "",
        });
        // guardamos el hash original para reenviarlo si no cambian la clave
        setOriginalPass(u?.contrasenia || "");
      } catch (e) {
        console.error(e);
        setServerError(
          e.message?.includes("No autorizado")
            ? "No autorizado: inicia sesión nuevamente."
            : "No se pudo cargar el usuario."
        );
      } finally {
        setLoadingUser(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, id]);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const e = {};
    if (!form.usuario.trim()) e.usuario = "El usuario es obligatorio.";
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio.";
    if (!form.apellido.trim()) e.apellido = "El apellido es obligatorio.";
    if (!form.correo.trim()) e.correo = "El correo es obligatorio.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
      e.correo = "Correo inválido.";

    if (!isEditing) {
      if (!form.contrasenia) e.contrasenia = "La contraseña es obligatoria.";
      else if (form.contrasenia.length < 6)
        e.contrasenia = "Mínimo 6 caracteres.";
      if (form.contrasenia !== form.contrasenia2)
        e.contrasenia2 = "Las contraseñas no coinciden.";
    } else {
      if (form.contrasenia) {
        if (form.contrasenia.length < 6)
          e.contrasenia = "Mínimo 6 caracteres.";
        if (form.contrasenia !== form.contrasenia2)
          e.contrasenia2 = "Las contraseñas no coinciden.";
      }
    }

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
        usuario: form.usuario.trim(),
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        correo: form.correo.trim(),
        // En edición: si no escriben nueva, reenviamos el hash original (se mantiene).
        contrasenia: isEditing ? (form.contrasenia || originalPass) : form.contrasenia,
      };

      const url = isEditing
        ? `${API_URL}/api/usuario/update/${id}`
        : `${API_URL}/api/usuario/insert`;

      const method = isEditing ? "PUT" : "POST";

      const res = await guardedFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const ok =
        (!isEditing && res.status === 201) ||
        (isEditing && res.status === 204);

      if (ok) {
        navigate("/usuarios/listar");
      } else {
        let msg = isEditing
          ? "No se pudo actualizar el usuario."
          : "No se pudo registrar el usuario.";
        try {
          const data = await res.json();
          if (data?.detail) msg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
          if (data?.message) msg = data.message;
        } catch {
          /* body vacío */
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
          {isEditing ? "Modificar Usuario" : "Registrar Usuario"}
        </h1>

        {serverError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm">
            {serverError}
          </div>
        )}

        {loadingUser ? (
          <div className="text-slate-500">Cargando datos…</div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm"
          >
            {/* Usuario */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
              <input
                name="usuario"
                value={form.usuario}
                onChange={onChange}
                className={`w-full rounded-md border px-3 py-2 outline-none ${
                  errors.usuario ? "border-red-400" : "border-slate-300 focus:border-amber-500"
                }`}
                placeholder="ej. jtafurr"
                autoComplete="username"
              />
              {errors.usuario && <p className="text-red-600 text-xs mt-1">{errors.usuario}</p>}
            </div>

            {/* Correo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo</label>
              <input
                name="correo"
                type="email"
                value={form.correo}
                onChange={onChange}
                className={`w-full rounded-md border px-3 py-2 outline-none ${
                  errors.correo ? "border-red-400" : "border-slate-300 focus:border-amber-500"
                }`}
                placeholder="nombre@empresa.com"
                autoComplete="email"
              />
              {errors.correo && <p className="text-red-600 text-xs mt-1">{errors.correo}</p>}
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                className={`w-full rounded-md border px-3 py-2 outline-none ${
                  errors.nombre ? "border-red-400" : "border-slate-300 focus:border-amber-500"
                }`}
                placeholder="Juan"
                autoComplete="given-name"
              />
              {errors.nombre && <p className="text-red-600 text-xs mt-1">{errors.nombre}</p>}
            </div>

            {/* Apellido */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
              <input
                name="apellido"
                value={form.apellido}
                onChange={onChange}
                className={`w-full rounded-md border px-3 py-2 outline-none ${
                  errors.apellido ? "border-red-400" : "border-slate-300 focus:border-amber-500"
                }`}
                placeholder="Tafur"
                autoComplete="family-name"
              />
              {errors.apellido && <p className="text-red-600 text-xs mt-1">{errors.apellido}</p>}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {isEditing ? "Nueva contraseña (opcional)" : "Contraseña"}
              </label>
              <input
                name="contrasenia"
                type={showPass ? "text" : "password"}
                value={form.contrasenia}
                onChange={onChange}
                className={`w-full rounded-md border px-3 py-2 outline-none ${
                  errors.contrasenia ? "border-red-400" : "border-slate-300 focus:border-amber-500"
                }`}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {errors.contrasenia && <p className="text-red-600 text-xs mt-1">{errors.contrasenia}</p>}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {isEditing ? "Confirmar nueva contraseña" : "Confirmar contraseña"}
              </label>
              <input
                name="contrasenia2"
                type={showPass ? "text" : "password"}
                value={form.contrasenia2}
                onChange={onChange}
                className={`w-full rounded-md border px-3 py-2 outline-none ${
                  errors.contrasenia2 ? "border-red-400" : "border-slate-300 focus:border-amber-500"
                }`}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {errors.contrasenia2 && <p className="text-red-600 text-xs mt-1">{errors.contrasenia2}</p>}
            </div>

            {/* Mostrar contraseñas */}
            <div className="md:col-span-2">
              <label className="inline-flex items-center text-sm text-slate-600 select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={showPass}
                  onChange={(e) => setShowPass(e.target.checked)}
                />
                <span className="ml-3">Mostrar contraseñas</span>
              </label>
            </div>

            {/* Botones */}
            <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-4 justify-center">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-amber-600 px-5 py-2 text-white hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Guardando..." : isEditing ? "Guardar cambios" : "Registrar"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/usuarios/listar")}
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
