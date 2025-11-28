// src/pages/producto/ProductoRegistrar.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL, authHeader } from "../../lib/api";

// ⬇️ ajusta si tu backend usa otra ruta para listar marcas
const API_MARCAS_LIST = `${API_URL}/api/marca/listar`;

export default function ProductoRegistrar() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [form, setForm] = useState({
    nombre_producto: "",
    id_marca: "",
    precio_unitario: "",
    stock: "",
  });

  const [marcas, setMarcas] = useState([]);
  const [loadingMarcas, setLoadingMarcas] = useState(true);
  const [loadingRecord, setLoadingRecord] = useState(false);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- helper auth + 401/403 ---
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

  // Utilidad: parsea precio (permite coma o punto)
  const parsePrecio = (val) => {
    if (val === "" || val === null || val === undefined) return NaN;
    const num = Number(String(val).replace(",", "."));
    return Number.isFinite(num) ? Number(num.toFixed(2)) : NaN;
  };

  // Cargar marcas
  useEffect(() => {
    (async () => {
      try {
        setLoadingMarcas(true);
        const res = await guardedFetch(API_MARCAS_LIST);
        const ct = res.headers.get("content-type") || "";
        const data = ct.includes("application/json") ? await res.json() : [];
        setMarcas(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setServerError(
          e.message?.includes("No autorizado")
            ? "No autorizado: inicia sesión nuevamente."
            : "No se pudieron cargar las marcas."
        );
      } finally {
        setLoadingMarcas(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si es edición, cargar producto
  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      try {
        setLoadingRecord(true);
        const res = await guardedFetch(`${API_URL}/api/producto/${id}`);
        const ct = res.headers.get("content-type") || "";
        if (!res.ok) {
          let msg = "No se pudo cargar el producto.";
          if (ct.includes("application/json")) {
            const j = await res.json().catch(() => null);
            if (j?.message) msg = j.message;
          }
          throw new Error(msg);
        }
        const p = ct.includes("application/json") ? await res.json() : {};
        if (p?.id_producto) {
          setForm({
            nombre_producto: p.nombre_producto ?? "",
            id_marca: String(p.id_marca ?? ""),
            precio_unitario:
              p.precio_unitario !== null && p.precio_unitario !== undefined
                ? String(p.precio_unitario)
                : "",
            stock:
              p.stock !== null && p.stock !== undefined ? String(p.stock) : "",
          });
        } else {
          setServerError("No se encontró el producto.");
        }
      } catch (e) {
        console.error(e);
        setServerError(
          e.message?.includes("No autorizado")
            ? "No autorizado: inicia sesión nuevamente."
            : "No se pudo cargar el producto."
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
    if (!form.nombre_producto.trim())
      e.nombre_producto = "El nombre es obligatorio.";

    if (!form.id_marca) e.id_marca = "Selecciona una marca.";

    const precio = parsePrecio(form.precio_unitario);
    if (Number.isNaN(precio)) e.precio_unitario = "Ingresa un precio válido.";
    else if (precio < 0) e.precio_unitario = "El precio no puede ser negativo.";

    const stk = Number(form.stock);
    if (!Number.isInteger(stk)) e.stock = "El stock debe ser un entero.";
    else if (stk < 0) e.stock = "El stock no puede ser negativo.";

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
        nombre_producto: form.nombre_producto.trim(),
        id_marca: Number(form.id_marca),
        precio_unitario: parsePrecio(form.precio_unitario),
        stock: Number(form.stock),
      };

      const url = isEditing
        ? `${API_URL}/api/producto/update/${id}`
        : `${API_URL}/api/producto/insert`;
      const method = isEditing ? "PUT" : "POST";

      const res = await guardedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const ok =
        (!isEditing && res.status === 201) || (isEditing && res.status === 204);
      if (ok) {
        navigate("/productos/listar-productos");
        return;
      }

      let msg = isEditing
        ? "No se pudo actualizar el producto."
        : "No se pudo registrar el producto.";
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json().catch(() => null);
        if (data?.detail)
          msg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
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

  // Formatea a 2 decimales al salir del campo precio
  const handlePrecioBlur = () => {
    const precio = parsePrecio(form.precio_unitario);
    if (!Number.isNaN(precio)) {
      setForm((f) => ({ ...f, precio_unitario: precio.toFixed(2) }));
    }
  };

  return (
    <section className="w-full">
      <div className="mx-auto max-w-3xl lg:max-w-4xl space-y-6 lg:space-y-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
          {isEditing ? "Modificar Producto" : "Registrar Producto"}
        </h1>

        {serverError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm">
            {serverError}
          </div>
        )}

        {loadingRecord ? (
          <div className="text-slate-500">Cargando datos…</div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-3 md:mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm"
          >
            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre del producto
              </label>
              <input
                name="nombre_producto"
                value={form.nombre_producto}
                onChange={onChange}
                placeholder="Ej. Descontaminador, Gabinete DMT, etc."
                className={`w-full rounded-md border px-3 py-2 outline-none ${
                  errors.nombre_producto
                    ? "border-red-400"
                    : "border-slate-300 focus:border-amber-500"
                }`}
              />
              {errors.nombre_producto && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.nombre_producto}
                </p>
              )}
            </div>

            {/* Marca */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Marca
              </label>
              <select
                name="id_marca"
                value={form.id_marca}
                onChange={onChange}
                disabled={loadingMarcas || marcas.length === 0}
                className={`w-full rounded-md border px-3 py-2 outline-none bg-white ${
                  errors.id_marca
                    ? "border-red-400"
                    : "border-slate-300 focus:border-amber-500"
                }`}
              >
                <option value="">Selecciona una marca…</option>
                {marcas.map((m) => (
                  <option key={m.id_marca ?? m.id} value={m.id_marca ?? m.id}>
                    {m.nombre_marca ?? m.nombre}
                  </option>
                ))}
              </select>
              {errors.id_marca && (
                <p className="text-red-600 text-xs mt-1">{errors.id_marca}</p>
              )}
              {loadingMarcas && (
                <p className="text-slate-500 text-xs mt-1">Cargando marcas…</p>
              )}
              {!loadingMarcas && marcas.length === 0 && (
                <p className="text-slate-500 text-xs mt-1">
                  No hay marcas disponibles.
                </p>
              )}
            </div>

            {/* Precio */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Precio unitario
              </label>
              <input
                name="precio_unitario"
                inputMode="decimal"
                value={form.precio_unitario}
                onChange={onChange}
                onBlur={handlePrecioBlur}
                placeholder="0.00"
                className={`w-full rounded-md border px-3 py-2 outline-none ${
                  errors.precio_unitario
                    ? "border-red-400"
                    : "border-slate-300 focus:border-amber-500"
                }`}
              />
              {errors.precio_unitario && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.precio_unitario}
                </p>
              )}
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Stock
              </label>
              <input
                name="stock"
                type="number"
                step="1"
                min="0"
                value={form.stock}
                onChange={onChange}
                placeholder="0"
                className={`w-full rounded-md border px-3 py-2 outline-none ${
                  errors.stock
                    ? "border-red-400"
                    : "border-slate-300 focus:border-amber-500"
                }`}
              />
              {errors.stock && (
                <p className="text-red-600 text-xs mt-1">{errors.stock}</p>
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
                onClick={() => navigate("/productos/listar-productos")}
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
