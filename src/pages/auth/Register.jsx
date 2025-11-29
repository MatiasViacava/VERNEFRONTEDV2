// src/pages/auth/Register.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://vernebackendv1.onrender.com";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    usuario: "",
    correo: "",
    nombre: "",
    apellido: "",
    contrasenia: "",
    contrasenia2: "",
  });

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.usuario.trim()) e.usuario = "El usuario es obligatorio.";
    if (!form.correo.trim()) e.correo = "El correo es obligatorio.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) e.correo = "Correo inválido.";
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio.";
    if (!form.apellido.trim()) e.apellido = "El apellido es obligatorio.";

    if (!form.contrasenia) e.contrasenia = "La contraseña es obligatoria.";
    else if (form.contrasenia.length < 6) e.contrasenia = "Mínimo 6 caracteres.";
    if (form.contrasenia !== form.contrasenia2) e.contrasenia2 = "Las contraseñas no coinciden.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!validate()) return;

    setLoading(true);
    try {
      // 1) Registrar usuario
      const payload = {
        usuario: form.usuario.trim(),
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        correo: form.correo.trim(),
        contrasenia: form.contrasenia, // el backend ya hashea
      };

      const res = await fetch(`${API_URL}/api/usuario/insert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status !== 201) {
        let msg = "No se pudo registrar. Intenta de nuevo.";
        try {
          const data = await res.json();
          if (data?.detail) msg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
          if (data?.message) msg = data.message;
        } catch {
            // ignorar error al parsear JSON
        }
        throw new Error(msg);
      }

      // 2) (Opcional agradable) Login automático con las mismas credenciales
      try {
        const loginRes = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario: form.usuario, contrasenia: form.contrasenia }),
        });
        if (loginRes.ok) {
          const data = await loginRes.json().catch(() => ({}));
          if (data?.token) localStorage.setItem("token", data.token);
          if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));
          navigate("/dashboard");
          return;
        }
      } catch {
        // si algo falla en el auto-login, seguimos al login manual
      }

      setMsg("Registro exitoso. Inicia sesión con tus credenciales.");
      // Volvemos al login después de 1.2s
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setMsg(err.message || "Error de red o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-white text-neutral-900">
      {/* Izquierda (marca) */}
      <div className="hidden md:flex items-center justify-center bg-[color:#c5a485]">
        <div className="text-center">
          <div className="mx-auto mb-8 size-56 rounded-2xl bg-[color:#9a4f1b] grid place-items-center shadow-xl">
            <span className="text-white text-8xl font-extrabold font-display select-none">V</span>
          </div>
          <div className="font-display">
            <div className="text-[44px] leading-[1.1] font-extrabold tracking-[.18em] text-[#7a3f16]">VERNE</div>
            <div className="mt-1 text-[18px] tracking-[.45em] text-[#7a3f16]/80">SIP</div>
          </div>
        </div>
      </div>

      {/* Derecha (form) */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mb-8 text-center">
            Crear cuenta
          </h2>

          <div className="rounded-[28px] border border-black/10 shadow-[0_6px_0_#c1a387] p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Usuario */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
                <input
                  name="usuario"
                  value={form.usuario}
                  onChange={onChange}
                  placeholder="ej. jtafur"
                  autoComplete="username"
                  className={`w-full rounded-full border px-4 py-2.5 outline-none ${
                    errors.usuario ? "border-red-400" : "border-black/15 focus:border-amber-500"
                  }`}
                />
                {errors.usuario && <p className="text-xs text-red-600 mt-1">{errors.usuario}</p>}
              </div>

              {/* Correo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo</label>
                <input
                  name="correo"
                  type="email"
                  value={form.correo}
                  onChange={onChange}
                  placeholder="nombre@empresa.com"
                  autoComplete="email"
                  className={`w-full rounded-full border px-4 py-2.5 outline-none ${
                    errors.correo ? "border-red-400" : "border-black/15 focus:border-amber-500"
                  }`}
                />
                {errors.correo && <p className="text-xs text-red-600 mt-1">{errors.correo}</p>}
              </div>

              {/* Nombre y Apellido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={onChange}
                    autoComplete="given-name"
                    className={`w-full rounded-full border px-4 py-2.5 outline-none ${
                      errors.nombre ? "border-red-400" : "border-black/15 focus:border-amber-500"
                    }`}
                  />
                  {errors.nombre && <p className="text-xs text-red-600 mt-1">{errors.nombre}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
                  <input
                    name="apellido"
                    value={form.apellido}
                    onChange={onChange}
                    autoComplete="family-name"
                    className={`w-full rounded-full border px-4 py-2.5 outline-none ${
                      errors.apellido ? "border-red-400" : "border-black/15 focus:border-amber-500"
                    }`}
                  />
                  {errors.apellido && <p className="text-xs text-red-600 mt-1">{errors.apellido}</p>}
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                <div className="flex items-center gap-2 rounded-full border px-4 py-2.5 border-black/15">
                  <input
                    name="contrasenia"
                    type={showPwd ? "text" : "password"}
                    value={form.contrasenia}
                    onChange={onChange}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full bg-transparent outline-none border-0 focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="text-sm px-2 py-1 rounded-full hover:bg-black/5"
                  >
                    {showPwd ? "Ocultar" : "Ver"}
                  </button>
                </div>
                {errors.contrasenia && <p className="text-xs text-red-600 mt-1">{errors.contrasenia}</p>}
              </div>

              {/* Confirmar */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
                <input
                  name="contrasenia2"
                  type={showPwd ? "text" : "password"}
                  value={form.contrasenia2}
                  onChange={onChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full rounded-full border px-4 py-2.5 outline-none ${
                    errors.contrasenia2 ? "border-red-400" : "border-black/15 focus:border-amber-500"
                  }`}
                />
                {errors.contrasenia2 && <p className="text-xs text-red-600 mt-1">{errors.contrasenia2}</p>}
              </div>

              {/* Botón */}
              <button
                type="submit"
                disabled={loading}
                className="w-full !rounded-full bg-[color:#9f7f5f] text-white py-3 text-lg font-semibold
                           shadow-[0_6px_0_#b99f82] hover:translate-y-[1px] hover:shadow-[0_5px_0_#b99f82]
                           active:translate-y-[2px] active:shadow-[0_4px_0_#b99f82] transition
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Creando cuenta…" : "Registrarme"}
              </button>

              {/* Mensaje y link a login */}
              {msg && <p className="text-center text-sm mt-1">{msg}</p>}
              <div className="mt-6 text-center text-sm text-neutral-600">
                ¿Ya tienes cuenta?{" "}
                <Link to="/" className="font-semibold text-[color:#3d6fb6] hover:underline">
                  Inicia sesión
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
