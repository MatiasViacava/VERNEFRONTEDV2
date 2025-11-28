// src/pages/analisis-abcxyz/ConfigABC.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api"; // <- usa el helper con Authorization

export default function ConfigABC() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    a_cut: 0.8,
    b_cut: 0.95,
    x_cut: 0.5,
    y_cut: 0.9,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Cargar config guardada
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const j = await api.get("/api/abcxyz/config");
        setForm({
          a_cut: Number(j?.a_cut ?? 0.8),
          b_cut: Number(j?.b_cut ?? 0.95),
          x_cut: Number(j?.x_cut ?? 0.5),
          y_cut: Number(j?.y_cut ?? 0.9),
        });
      } catch (e) {
        const status = e?.status;
        if (status === 401 || status === 403) {
          // token inválido o faltante → vuelve al login
          navigate("/", { replace: true });
          return;
        }
        setErr("No se pudo cargar la configuración.");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const onChange = (k, v) =>
    setForm((s) => ({ ...s, [k]: Number.isFinite(v) ? v : 0 }));

  const save = async () => {
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      const { a_cut, b_cut, x_cut, y_cut } = form;
      if (!(0 < a_cut && a_cut < b_cut && b_cut < 1))
        throw new Error("Relación inválida: requiere 0 < A < B < 1");
      if (!(0 < x_cut && x_cut < y_cut))
        throw new Error("Relación inválida: requiere 0 < X < Y");

      const saved = await api.put("/api/abcxyz/config", {
        a_cut: Number(a_cut),
        b_cut: Number(b_cut),
        x_cut: Number(x_cut),
        y_cut: Number(y_cut),
      });
      // reflejamos lo que devolvió el backend
      setForm({
        a_cut: Number(saved.a_cut),
        b_cut: Number(saved.b_cut),
        x_cut: Number(saved.x_cut),
        y_cut: Number(saved.y_cut),
      });
      setMsg("Configuración guardada correctamente ✅");
    } catch (e) {
      const status = e?.status;
      if (status === 401 || status === 403) {
        navigate("/", { replace: true });
        return;
      }
      setErr(e?.message || "Error guardando configuración.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="w-full">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">
            Configuración de criterios ABC-XYZ
          </h1>
          <Link
            to="/abcxyz"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Regresar
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          {loading ? (
            <div className="text-slate-500">Cargando…</div>
          ) : (
            <>
              <h3 className="font-semibold text-slate-800 mb-3">ABC</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field
                  label="A (importancia alta)"
                  value={form.a_cut}
                  onChange={(v) => onChange("a_cut", v)}
                />
                <Field
                  label="B (importancia media)"
                  value={form.b_cut}
                  onChange={(v) => onChange("b_cut", v)}
                />
                <Field label="C (importancia baja)" value={1} disabled hint="Siempre 1.0" />
              </div>

              <h3 className="font-semibold text-slate-800 mt-6 mb-3">XYZ</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field
                  label="X (regular)"
                  value={form.x_cut}
                  onChange={(v) => onChange("x_cut", v)}
                />
                <Field
                  label="Y (estacional)"
                  value={form.y_cut}
                  onChange={(v) => onChange("y_cut", v)}
                />
                <Field label="Z (irregular)" value={1} disabled hint="> Y" />
              </div>

              {err && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {err}
                </div>
              )}
              {msg && (
                <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {msg}
                </div>
              )}

              <div className="mt-5">
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, disabled = false, hint }) {
  return (
    <label className="block">
      <div className="text-sm text-slate-600 mb-1">{label}</div>
      <input
        type="number"
        step="any"
        min="0"
        max="1"
        disabled={disabled}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange?.(parseFloat(e.target.value || "0"))}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
      />
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </label>
  );
}
