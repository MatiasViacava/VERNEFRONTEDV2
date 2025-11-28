// src/pages/venta/VentaRegistrar.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL, authHeader } from "../../lib/api";

// ---- fecha local YYYY-MM-DD (NUNCA toISOString aquí)
const ymdLocal = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function VentaRegistrar() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  // NO mandamos importe_total; lo calcula el backend
  const [form, setForm] = useState({
    id_cliente: "",
    id_producto: "",
    fecha: ymdLocal(), // 👈 local
    cantidad: "1",
  });

  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState({});

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

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const formatMoney = (v) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" })
      .format(Number.isFinite(+v) ? +v : 0);

  // Cargar clientes y productos (con fallback listar-view → listar)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const rc = await guardedFetch(`${API_URL}/api/cliente/listar`);
        const clientesCt = rc.headers.get("content-type") || "";
        const clientesJson = clientesCt.includes("application/json")
          ? await rc.json()
          : [];
        setClientes(Array.isArray(clientesJson) ? clientesJson : []);

        // intentamos listar-view (trae nombre_marca); si falla, usamos listar
        let productosJson = [];
        try {
          const rp1 = await guardedFetch(`${API_URL}/api/producto/listar-view`);
          if (rp1.ok) {
            productosJson = await rp1.json();
          } else {
            const rp2 = await guardedFetch(`${API_URL}/api/producto/listar`);
            productosJson = await rp2.json();
          }
        } catch {
          const rp2 = await guardedFetch(`${API_URL}/api/producto/listar`);
          productosJson = await rp2.json();
        }
        setProductos(Array.isArray(productosJson) ? productosJson : []);
      } catch (err) {
        console.error(err);
        setServerError(
          err.message?.includes("No autorizado")
            ? "No autorizado: inicia sesión nuevamente."
            : "No se pudieron cargar clientes/productos."
        );
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Precargar si editas (usa la fecha tal cual "YYYY-MM-DD")
  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      try {
        setLoadingRecord(true);
        const res = await guardedFetch(`${API_URL}/api/venta/${id}`);
        const ct = res.headers.get("content-type") || "";
        const v = ct.includes("application/json") ? await res.json() : {};
        if (v?.id_venta) {
          setForm({
            id_cliente: String(v.id_cliente ?? ""),
            id_producto: String(v.id_producto ?? ""),
            fecha: v.fecha ? String(v.fecha).slice(0, 10) : ymdLocal(),
            cantidad: String(v.cantidad ?? "1"),
          });
        } else {
          setServerError("No se encontró la venta.");
        }
      } catch (err) {
        console.error(err);
        setServerError(
          err.message?.includes("No autorizado")
            ? "No autorizado: inicia sesión nuevamente."
            : "No se pudo cargar la venta."
        );
      } finally {
        setLoadingRecord(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]);

  // Preview importe
  const selectedProduct = useMemo(
    () => productos.find(p => String(p.id_producto) === String(form.id_producto)),
    [productos, form.id_producto]
  );
  const unitPrice = selectedProduct?.precio_unitario != null
    ? Number(selectedProduct.precio_unitario)
    : null;
  const qty = Number(form.cantidad || 0);
  const importePreview = (unitPrice != null && qty > 0) ? unitPrice * qty : 0;

  // Validaciones
  const validate = () => {
    const e = {};
    if (!form.id_cliente) e.id_cliente = "Selecciona un cliente.";
    if (!form.id_producto) e.id_producto = "Selecciona un producto.";

    if (!form.fecha) {
      e.fecha = "La fecha es obligatoria.";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.fecha)) {
      e.fecha = "Formato de fecha inválido (YYYY-MM-DD).";
    }

    if (!form.cantidad || Number(form.cantidad) <= 0 || !Number.isInteger(Number(form.cantidad))) {
      e.cantidad = "Cantidad debe ser un entero mayor a 0.";
    }
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
        id_cliente: Number(form.id_cliente),
        id_producto: Number(form.id_producto),
        fecha: form.fecha, // 👈 string YYYY-MM-DD (local)
        cantidad: Number(form.cantidad),
      };

      const url = isEditing
        ? `${API_URL}/api/venta/update/${id}`
        : `${API_URL}/api/venta/insert`;
      const method = isEditing ? "PUT" : "POST";

      const res = await guardedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const ok = (!isEditing && res.status === 201) || (isEditing && res.status === 204);
      if (ok) {
        navigate("/ventas/listar-ventas");
      } else {
        let msg = isEditing ? "No se pudo actualizar la venta." : "No se pudo registrar la venta.";
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          try {
            const data = await res.json();
            if (data?.detail) msg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
            if (data?.message) msg = data.message;
          } catch { /* ignorar */ }
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
          {isEditing ? "Modificar Venta" : "Registrar Venta"}
        </h1>

        {serverError && (
          <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm">
            {serverError}
          </div>
        )}

        {(loading || loadingRecord) ? (
          <div className="text-slate-500">Cargando…</div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm"
          >
            {/* Cliente */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
              <select
                name="id_cliente"
                value={form.id_cliente}
                onChange={onChange}
                disabled={clientes.length === 0}
                className={`w-full rounded-md border px-3 py-2 outline-none bg-white ${
                  errors.id_cliente ? "border-red-400" : "border-slate-300 focus:border-amber-500"
                }`}
              >
                <option value="">Selecciona un cliente…</option>
                {clientes.map((c) => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.nombre_empresa} {c.ruc ? `(RUC: ${c.ruc})` : ""}
                  </option>
                ))}
              </select>
              {errors.id_cliente && (
                <p className="text-red-600 text-xs mt-1">{errors.id_cliente}</p>
              )}
            </div>

            {/* Producto */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Producto</label>
              <select
                name="id_producto"
                value={form.id_producto}
                onChange={onChange}
                disabled={productos.length === 0}
                className={`w-full rounded-md border px-3 py-2 outline-none bg-white ${
                  errors.id_producto ? "border-red-400" : "border-slate-300 focus:border-amber-500"
                }`}
              >
                <option value="">Selecciona un producto…</option>
                {productos.map((p) => (
                  <option key={p.id_producto} value={p.id_producto}>
                    {p.nombre_producto}{p.nombre_marca ? ` — ${p.nombre_marca}` : ""}
                  </option>
                ))}
              </select>
              {errors.id_producto && (
                <p className="text-red-600 text-xs mt-1">{errors.id_producto}</p>
              )}
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
              <input
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={onChange}
                className={`w-full rounded-md border px-3 py-2 outline-none ${
                  errors.fecha ? "border-red-400" : "border-slate-300 focus:border-amber-500"
                }`}
              />
              {errors.fecha && <p className="text-red-600 text-xs mt-1">{errors.fecha}</p>}
            </div>

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
              <input
                type="number"
                name="cantidad"
                inputMode="numeric"
                min={1}
                step={1}
                value={form.cantidad}
                onChange={onChange}
                className={`w-full rounded-md border px-3 py-2 outline-none ${
                  errors.cantidad ? "border-red-400" : "border-slate-300 focus:border-amber-500"
                }`}
                placeholder="1"
              />
              {errors.cantidad && (
                <p className="text-red-600 text-xs mt-1">{errors.cantidad}</p>
              )}
            </div>

            {/* Precio unitario (solo lectura) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio unitario</label>
              <input
                readOnly
                value={unitPrice != null ? formatMoney(unitPrice) : "—"}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700"
              />
            </div>

            {/* Importe (preview) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Importe (automático)
              </label>
              <input
                readOnly
                value={formatMoney(importePreview)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                * Este valor es calculado por el sistema. No necesitas ingresarlo.
              </p>
            </div>

            {/* Botones */}
            <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2 justify-center">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-amber-600 px-5 py-2 text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {submitting ? "Guardando…" : isEditing ? "Guardar cambios" : "Registrar"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/ventas/listar-ventas")}
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
