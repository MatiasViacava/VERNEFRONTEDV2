// src/pages/Home.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../lib/api"; // ⬅️ usamos tu helper centralizado

function Home() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      // usamos api.post que ya maneja JSON y errores
      const data = await api.post("/api/auth/login", { usuario, contrasenia });

      if (data?.token) {
        localStorage.setItem("token", data.token);
      }
      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setMsg("Inicio de sesión correcto ✅");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      // api.post ya construye un mensaje con detail/message si viene del backend
      setMsg(err.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-white text-neutral-900">
      {/* LADO IZQUIERDO (marca) */}
      <div className="hidden md:flex items-center justify-center bg-[color:#c5a485]">
        <div className="text-center">
          {/* Cuadro con “V” */}
          <div className="mx-auto mb-8 size-56 rounded-2xl bg-[color:#9a4f1b] grid place-items-center shadow-xl">
            <span className="text-white text-8xl font-extrabold font-display select-none">V</span>
          </div>

          {/* VERNE / SIP refinado */}
          <div className="font-display">
            <div className="text-[44px] leading-[1.1] font-extrabold tracking-[.18em] text-[#7a3f16]">
              VERNE
            </div>
            <div className="mt-1 text-[18px] tracking-[.45em] text-[#7a3f16]/80">
              SIP
            </div>
          </div>
        </div>
      </div>

      {/* LADO DERECHO (formulario) */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mb-8 text-center">
            Iniciar Sesión
          </h2>

          <div className="rounded-[28px] border border-black/10 shadow-[0_6px_0_#c1a387] p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Usuario */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Usuario</label>
                <div className="flex items-center gap-3 rounded-full border border-black/15 bg-white px-4 py-2.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-5 opacity-60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 4.84V21h16v-2.16C20 16.17 16.33 14 12 14Z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Usuario"
                    autoComplete="username"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="w-full bg-transparent placeholder:text-neutral-400
                               appearance-none !border-0 outline-none focus:!border-0 focus:!ring-0"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
                <div className="flex items-center gap-3 rounded-full border border-black/15 bg-white px-4 py-2.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-5 opacity-60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1a5 5 0 0 0-5 5v2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a5 5 0 0 0-5-5Zm3 7H9V6a3 3 0 0 1 6 0Z" />
                  </svg>
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder="Contraseña"
                    autoComplete="current-password"
                    minLength={4}
                    value={contrasenia}
                    onChange={(e) => setContrasenia(e.target.value)}
                    className="w-full bg-transparent placeholder:text-neutral-400
                               appearance-none !border-0 outline-none focus:!border-0 focus:!ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="text-sm px-2 py-1 rounded-full hover:bg-black/5"
                    aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPwd ? "Ocultar" : "Ver"}
                  </button>
                </div>
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
                {loading ? "Ingresando…" : "ACEPTAR"}
              </button>

              {/* Mensaje */}
              {msg && <p className="text-center text-sm mt-1">{msg}</p>}

              {/* Enlace registro */}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-neutral-600">
                <span className="inline-flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-4 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a6 6 0 0 0-6 6v3H4a2 2 0 0 0-2 2v7h20v-7a2 2 0 0 0-2-2h-2V8a6 6 0 0 0-6-6Z" />
                  </svg>
                  ¿No tienes cuenta?
                </span>
                <Link to="/register" className="font-semibold text-[color:#3d6fb6] hover:underline">
                  Regístrate ahora
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
