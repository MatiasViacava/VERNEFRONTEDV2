// src/pages/analisis-abcxyz/ABCXYZ.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ResultABC from "./ResultABC";
import { API_URL, authHeader } from "../../lib/api";

/** ---------------------- Helpers ---------------------- */
async function guardedJson(res, navigate) {
  if (res.status === 401 || res.status === 403) {
    // sin autorización -> volvemos al login
    navigate("/", { replace: true });
    throw new Error("No autorizado");
  }
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `HTTP ${res.status}`);
  }
  return res.json();
}

/** ======================================================
 *  Página contenedora: pestañas "Desde BD" y "Importar Excel"
 *  ====================================================== */
export default function ABCXYZ() {
  const [tab, setTab] = useState("db"); // 'db' | 'excel'
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  // Limpiar resultados al cambiar de tab
  useEffect(() => {
    setResult(null);
    setErr("");
  }, [tab]);

  // Ejecutar análisis desde BD
  const handleRun = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/abcxyz/run`, {
        method: "POST",
        headers: { ...authHeader() },
      });
      const data = await guardedJson(res, navigate);
      setResult(data);
    } catch (e) {
      setErr(`No se pudo ejecutar el análisis: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Callback para cuando se importa archivo
  const handleImported = (res) => {
    setResult(res);
  };

  return (
    <section className="w-full">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">
            Análisis ABC-XYZ
          </h1>
          <Link
            to="/abcxyz/config"
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-slate-50"
            title="Configurar cortes de A/B y X/Y"
          >
            Configuración
          </Link>
        </div>

        {/* Tabs */}
        <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden mb-4">
          <button
            className={`px-4 py-2 text-sm ${
              tab === "db" ? "bg-slate-900 text-white" : "hover:bg-slate-50"
            }`}
            onClick={() => setTab("db")}
          >
            Desde BD
          </button>
          <button
            className={`px-4 py-2 text-sm ${
              tab === "excel" ? "bg-slate-900 text-white" : "hover:bg-slate-50"
            }`}
            onClick={() => setTab("excel")}
          >
            Importar Excel
          </button>
        </div>

        {/* Contenido por tab */}
        {tab === "db" ? (
          <Card className="mb-6">
            <h3 className="font-semibold text-slate-800 mb-3">
              Ejecutar con datos de la base
            </h3>
            <PrecheckCard onRun={handleRun} loading={loading} />
            {err && <ErrorBox text={err} />}
          </Card>
        ) : (
          <Card className="mb-6">
            <h3 className="font-semibold text-slate-800 mb-3">
              Importar archivo (CSV/XLSX)
            </h3>
            <UploadBox onImported={handleImported} />
            {err && <ErrorBox text={err} />}
          </Card>
        )}

        {/* Resultado */}
        {result && (
          <div className="mt-6">
            <ResultABC result={result} />
          </div>
        )}
      </div>
    </section>
  );
}

/** ---------------------- Subcomponentes locales ---------------------- */

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}>
      {children}
    </div>
  );
}

function ErrorBox({ text }) {
  return (
    <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {text}
    </div>
  );
}

/** Precheck (usa /api/abcxyz/precheck) + botón Ejecutar */
function PrecheckCard({ onRun, loading }) {
  const [check, setCheck] = useState(null);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    setErr("");
    try {
      const res = await fetch(`${API_URL}/api/abcxyz/precheck`, {
        headers: { ...authHeader() },
      });
      const data = await guardedJson(res, navigate);
      setCheck(data);
    } catch (e) {
      setErr(`No se pudo validar: ${e.message}`);
    }
  };

  useEffect(() => {
    load();
  }, );

  const ok = check?.ok;
  const reasons = check?.reasons || [];
  const cfg = check?.config || {};

  return (
    <>
      <div className="text-sm text-slate-600">
        {ok ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            Listo para ejecutar.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
              Aún faltan condiciones para ejecutar:
            </div>
            <ul className="list-disc pl-6 text-slate-500">
              {reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-slate-500">
        Cortes actuales: A ≤ {cfg.a_cut ?? 0} · B ≤ {cfg.b_cut ?? 0} · X ≤{" "}
        {cfg.x_cut ?? 0} · Y ≤ {cfg.y_cut ?? 0}
      </div>

      {err && <ErrorBox text={err} />}

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onRun}
          disabled={!ok || loading}
          className={`rounded-md px-3 py-2 text-sm ${
            ok
              ? "bg-slate-900 text-white hover:opacity-90"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          {loading ? "Ejecutando…" : "Ejecutar análisis"}
        </button>

        <button
          onClick={load}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
        >
          Revalidar
        </button>
      </div>
    </>
  );
}

/** Upload de CSV/XLSX (usa /template y /import) */
function UploadBox({ onImported }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const downloadTemplate = () => {
    // /api/abcxyz/template NO requiere auth; si la proteges, cambia a fetch+Blob.
    window.open(`${API_URL}/api/abcxyz/template`, "_blank");
  };

  const doImport = async () => {
    if (!file) {
      setErr("Selecciona un archivo CSV o XLSX.");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_URL}/api/abcxyz/import`, {
        method: "POST",
        headers: { ...authHeader() }, // solo Authorization (NO pongas Content-Type)
        body: fd,
      });
      const data = await guardedJson(res, navigate);
      onImported?.(data);

      // limpiar input para permitir re-subir el mismo archivo si se desea
      if (inputRef.current) inputRef.current.value = "";
      setFile(null);
    } catch (e) {
      setErr(`No se pudo importar: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-sm text-slate-600">
        Descarga la plantilla, llénala con tus productos y ventas de 12 meses,
        y luego impórtala.
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={downloadTemplate}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
        >
          Descargar plantilla
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block text-sm"
        />
        <button
          onClick={doImport}
          disabled={loading}
          className="rounded-md bg-slate-900 text-white px-3 py-2 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Importando…" : "Importar"}
        </button>
      </div>
      {file && (
        <div className="mt-2 text-xs text-slate-500">
          Archivo seleccionado: <b>{file.name}</b>
        </div>
      )}
      {err && <ErrorBox text={err} />}
    </>
  );
}
