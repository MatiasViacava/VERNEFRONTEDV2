import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  HiChevronLeft, HiChevronRight, HiMenu, HiX,
  HiHome, HiUsers, HiCog, HiClipboardList,
  HiCube, HiCreditCard, HiTrendingUp, HiChip
} from "react-icons/hi";

const NAV = [
  { label: "Dashboard", to: "/dashboard", icon: HiHome },

  {
    label: "Usuarios", icon: HiUsers, children: [
      { label: "Listar Usuarios", to: "/usuarios/listar", icon: HiClipboardList },
      { label: "Registrar Usuario", to: "/usuarios/registrar", icon: HiUsers },
    ]
  },

  {
    label: "Tipos de Usuarios", icon: HiCog, children: [
      { label: "Listar Tipos de Usuarios", to: "/tipo-usuarios/listar", icon: HiClipboardList },
      { label: "Registrar Tipo de Usuario", to: "/tipo-usuarios/registrar", icon: HiCog },
    ]
  },

  {
    label: "Productos", icon: HiCube, children: [
      { label: "Listar Productos", to: "/productos/listar-productos", icon: HiClipboardList },
      { label: "Registrar Productos", to: "/productos/registrar-productos", icon: HiCube },
      { label: "Listar Marca", to: "/productos/marca/listar-marca", icon: HiClipboardList },
      { label: "Registrar Marca", to: "/productos/marca/registrar-marca", icon: HiCube },
    ]
  },

  {
    label: "Ventas", icon: HiCreditCard, children: [
      { label: "Listar Ventas", to: "/ventas/listar-ventas", icon: HiClipboardList },
      { label: "Registrar Ventas", to: "/ventas/registrar-ventas", icon: HiCreditCard },
      { label: "Listar Clientes", to: "/ventas/cliente/listar-clientes", icon: HiClipboardList },
      { label: "Registrar Clientes", to: "/ventas/cliente/registrar-clientes", icon: HiUsers },
    ]
  },

  {
    label: "Análisis ABC-XYZ", icon: HiTrendingUp, children: [
      { label: "Config. ABC-XYZ", to: "/abcxyz/config-abcxyz", icon: HiCog },
      { label: "Resultados ABC-XYZ", to: "/abcxyz/result-abcxyz", icon: HiTrendingUp },
    ]
  },

  {
    label: "Predicciones ML", icon: HiChip, children: [
      { label: "Listar Predicciones", to: "/ml/listar-predicciones", icon: HiClipboardList },
      { label: "Predicción de Venta", to: "/ml/prediccion-venta", icon: HiChip },
    ]
  },
];


function ItemLink({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          "block no-underline rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 ring-amber-400/40",
          // 👇 forzamos nuestros colores (sin azul)
          isActive ? "bg-amber-500/15 !text-amber-300" : "!text-slate-200 hover:bg-white/5 hover:!text-amber-300",
          // 👇 forzamos visited/active/hover sin subrayado ni azul
          "visited:!text-slate-200 active:!text-amber-300 hover:!no-underline !no-underline",
        ].join(" ")
      }
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="text-lg" />}
        <span className={`truncate ${collapsed ? "hidden" : "block"}`}>{label}</span>
      </div>
    </NavLink>
  );
}

function Group({ icon: Icon, label, children, collapsed, onExpand }) {
  const [open, setOpen] = useState(false);
  const toggle = () => {
    if (collapsed) onExpand?.();      // si está colapsado, primero expandimos el sidebar
    else setOpen(v => !v);
  };
  return (
    <div className="px-2">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        title={collapsed ? label : undefined}
        className={[
          "w-full rounded-md px-3 py-2 text-left text-sm flex items-center gap-3",
          open ? "bg-amber-500/15 text-amber-300" : "text-slate-200 hover:bg-white/5 hover:text-amber-300",
          "focus-visible:outline-none focus-visible:ring-2 ring-amber-400/40"
        ].join(" ")}
      >
        {Icon && <Icon className="text-lg" />}
        <span className={`flex-1 ${collapsed ? "hidden" : "block"}`}>{label}</span>
        {!collapsed && (
          <HiChevronRight className={`text-lg transition-transform ${open ? "rotate-90" : ""}`} />
        )}
      </button>

      {!collapsed && (
        <div className={`grid transition-[grid-template-rows,opacity] duration-200 ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}>
          <div className="overflow-hidden pl-7 py-1 space-y-1">{children}</div>
        </div>
      )}
    </div>
  );
}

export default function ProNavCollapsedHover() {
  const [collapsed, setCollapsed] = useState(false);     // estado del sidebar (desktop)
  const [hovering, setHovering] = useState(false);       // expande al pasar mouse
  const [mobileOpen, setMobileOpen] = useState(false);   // drawer móvil

  // ¿colapsado efectivo? (solo si está colapsado y NO se está haciendo hover)
  const isCollapsed = collapsed && !hovering;
  const asideWidth = isCollapsed ? "w-16" : "w-72";

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Botón flotante móvil */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 rounded-md bg-[#0f1a2a] text-white p-2"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
      >
        <HiMenu className="text-2xl" />
      </button>

      {/* SIDEBAR desktop (hover para expandir) */}
      <aside
        onMouseEnter={() => collapsed && setHovering(true)}
        onMouseLeave={() => collapsed && setHovering(false)}
        className={`${asideWidth} hidden md:block transition-[width] duration-300
                    bg-[#0f1a2a] text-white border-r border-slate-800/60 sticky top-0 h-screen`}
      >
        {/* Brand + toggle (botón MÁS GRANDE) */}
        <div className="flex items-center justify-between px-3 h-16 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-amber-500 grid place-items-center text-slate-900 font-bold">V</div>
            {!isCollapsed && (
              <div className="leading-tight">
                <div className="text-white text-sm font-semibold">VERNE</div>
                <div className="text-slate-400 text-[11px]">SIP</div>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(v => !v)}
            className="grid place-items-center h-9 w-9 rounded-md hover:bg-white/10"
            aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
            title={isCollapsed ? "Expandir" : "Colapsar"}
          >
            {isCollapsed ? <HiChevronRight className="text-xl" /> : <HiChevronLeft className="text-xl" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="py-3">
          {!isCollapsed && (
            <div className="px-4 pb-2 text-[11px] font-semibold tracking-wider text-slate-400">
              MENÚ PRINCIPAL
            </div>
          )}
          <div className="px-2 mb-2">
            <ItemLink to="/dashboard" icon={HiHome} label="Dashboard" collapsed={isCollapsed} />
          </div>

          {NAV.filter(n => n.children).map(g => (
            <Group
              key={g.label}
              icon={g.icon}
              label={g.label}
              collapsed={isCollapsed}
              onExpand={() => setCollapsed(false)}
            >
              {g.children.map(c => (
                <ItemLink key={c.label} to={c.to} icon={c.icon} label={c.label} />
              ))}
            </Group>
          ))}
        </nav>
      </aside>

      {/* DRAWER móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-[#0f1a2a] text-white shadow-xl">
            <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-amber-500 grid place-items-center text-slate-900 font-bold">V</div>
                <div className="leading-tight">
                  <div className="text-white text-sm font-semibold">VERNE</div>
                  <div className="text-slate-400 text-[11px]">SIP</div>
                </div>
              </div>
              <button className="p-2 rounded-md hover:bg-white/10" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
                <HiX className="text-xl" />
              </button>
            </div>

            <nav className="py-3">
              <div className="px-2 mb-2">
                <ItemLink to="/dashboard" icon={HiHome} label="Dashboard" />
              </div>
              {NAV.filter(n => n.children).map(g => (
                <Group key={g.label} icon={g.icon} label={g.label}>
                  {g.children.map(c => (
                    <ItemLink key={c.label} to={c.to} icon={c.icon} label={c.label} />
                  ))}
                </Group>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* CONTENIDO */}
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-semibold">Contenido</h1>
        <p className="text-slate-500 mt-2">Aquí va tu página…</p>
      </main>
    </div>
  );
}
