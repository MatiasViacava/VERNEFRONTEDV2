// src/components/navigation/Breadcrumbs.jsx
import { Link, useLocation } from "react-router-dom";
import { HiChevronRight } from "react-icons/hi";

// Etiquetas bonitas para los segmentos
const LABELS = {
  dashboard: "Dashboard",
  usuarios: "Usuarios",
  "tipo-usuarios": "Tipos de Usuarios",
  productos: "Productos",
  marca: "Marca",
  ventas: "Ventas",
  abcxyz: "Análisis ABC-XYZ",
  ml: "Predicciones ML",

  // genéricos
  listar: "Listar",
  registrar: "Registrar",

  // productos
  "listar-productos": "Listar Productos",
  "registrar-productos": "Registrar Productos",

  // marca
  "listar-marca": "Listar Marca",
  "registrar-marca": "Registrar Marca",

  // ventas / clientes
  "listar-ventas": "Listar Ventas",
  "registrar-ventas": "Registrar Ventas",
  "listar-clientes": "Listar Clientes",
  "registrar-clientes": "Registrar Clientes",

  // ABC-XYZ (rutas nuevas)
  config: "Config. ABC-XYZ",
  result: "Resultados ABC-XYZ",

  // ABC-XYZ (compatibilidad con rutas antiguas)
  "config-abcxyz": "Config. ABC-XYZ",
  "result-abcxyz": "Resultados ABC-XYZ",

  // ML
  "listar-predicciones": "Listar Predicciones",
  "prediccion-venta": "Predicción de Venta",
};

// Prefijo → ruta "válida" dentro del layout
const CANONICAL = {
  "/dashboard": "/dashboard",
  "/usuarios": "/usuarios/listar",
  "/tipo-usuarios": "/tipo-usuarios/listar",
  "/productos": "/productos/listar-productos",
  "/productos/marca": "/productos/marca/listar-marca",
  "/ventas": "/ventas/listar-ventas",
  "/ventas/cliente": "/ventas/cliente/listar-clientes",

  // ABC-XYZ (ahora el destino canónico es /abcxyz/config)
  "/abcxyz": "/abcxyz/config",

  // compatibilidad: si el camino intermedio es el antiguo, canoniza al nuevo
  "/abcxyz/config-abcxyz": "/abcxyz/config",
  "/abcxyz/result-abcxyz": "/abcxyz/result",

  "/ml": "/ml/listar-predicciones",
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);

  const crumbs = parts.map((seg, idx) => {
    const rawPath = "/" + parts.slice(0, idx + 1).join("/");
    const to = CANONICAL[rawPath] || rawPath; // si existe prefijo canonizado, lo usamos
    const label = LABELS[seg] || seg.replace(/-/g, " ");
    const isLast = idx === parts.length - 1;
    return { to, label, isLast };
  });

  if (!crumbs.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
        {/* Inicio siempre a /dashboard */}
        <li>
          <Link to="/dashboard" className="hover:text-amber-600 no-underline">
            Dashboard
          </Link>
        </li>

        {crumbs.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            <HiChevronRight className="text-slate-400" />
            {c.isLast ? (
              <span aria-current="page" className="text-slate-700 font-medium">
                {c.label}
              </span>
            ) : (
              <Link to={c.to} className="hover:text-amber-600 no-underline">
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
