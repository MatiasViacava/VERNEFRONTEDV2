// src/components/navigation/SidebarVerne.jsx
import { useState, useMemo, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  HiChevronLeft, HiChevronRight, HiMenu, HiX,
  HiHome, HiUsers, HiCog, HiClipboardList,
  HiCube, HiCreditCard, HiTrendingUp, HiChip,
  HiLogout, HiUserCircle
} from "react-icons/hi";

// --- UTILIDADES ---
const getUser = () => JSON.parse(localStorage.getItem("user") || "{}");
const getRoles = () => (getUser().roles || []).map(r => String(r).toLowerCase());

// Nombre completo (Nombre + Apellido)
const getUserName = () => {
  const user = getUser();
  if (user.nombre && user.apellido) return `${user.nombre} ${user.apellido}`;
  return user.nombre || "Juan Pérez"; 
};

const can = (mine, allowed) => !allowed || allowed.some(r => mine.includes(String(r).toLowerCase()));

// --- DATA DE NAVEGACIÓN ---
const RAW_NAV = [
  {
    label: "Usuarios", icon: HiUsers, children: [
      { label: "Listar Usuarios", to: "/usuarios/listar", icon: HiClipboardList, roles: ["administrador"] },
      { label: "Registrar Usuario", to: "/usuarios/registrar", icon: HiUsers, roles: ["administrador"] },
    ]
  },
  {
    label: "Tipos de Usuarios", icon: HiCog, children: [
      { label: "Listar Tipos de Usuarios", to: "/tipo-usuarios/listar", icon: HiClipboardList, roles: ["administrador"] },
      { label: "Registrar Tipo de Usuario", to: "/tipo-usuarios/registrar", icon: HiCog, roles: ["administrador"] },
    ]
  },
  {
    label: "Productos", icon: HiCube, children: [
      { label: "Listar Productos", to: "/productos/listar-productos", icon: HiClipboardList, roles: ["administrador"] },
      { label: "Registrar Productos", to: "/productos/registrar-productos", icon: HiCube, roles: ["administrador"] },
      { label: "Listar Marca", to: "/productos/marca/listar-marca", icon: HiClipboardList, roles: ["administrador"] },
      { label: "Registrar Marca", to: "/productos/marca/registrar-marca", icon: HiCube, roles: ["administrador"] },
    ]
  },
  {
    label: "Ventas", icon: HiCreditCard, children: [
      { label: "Listar Ventas", to: "/ventas/listar-ventas", icon: HiClipboardList, roles: ["administrador"] },
      { label: "Registrar Ventas", to: "/ventas/registrar-ventas", icon: HiCreditCard, roles: ["administrador"] },
      { label: "Listar Clientes", to: "/ventas/cliente/listar-clientes", icon: HiClipboardList, roles: ["administrador"] },
      { label: "Registrar Clientes", to: "/ventas/cliente/registrar-clientes", icon: HiUsers, roles: ["administrador"] },
    ]
  },
  {
    label: "Análisis ABC-XYZ", icon: HiTrendingUp, children: [
      { label: "Ejecutar análisis", to: "/abcxyz", icon: HiTrendingUp, roles: ["administrador", "usuario"], end: true },
      { label: "Configurar criterios", to: "/abcxyz/config", icon: HiCog, roles: ["administrador", "usuario"] },
    ]
  },
  {
    label: "Predicciones ML", icon: HiChip, children: [
      { label: "Listar Predicciones", to: "/ml/listar-predicciones", icon: HiClipboardList, roles: ["administrador", "usuario"] },
      { label: "Predicción de Venta", to: "/ml/prediccion-venta", icon: HiChip, roles: ["administrador", "usuario"] },
    ]
  },
];

// ---------- Subcomponente ItemLink ----------
function ItemLink({ to, icon: Icon, label, collapsed, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      style={{ textDecoration: "none" }}
      className={({ isActive }) =>
        [
          "block rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 ring-amber-400/40 transition-colors duration-200",
          "hover:no-underline no-underline",
          isActive 
            ? "bg-amber-500/15 !text-amber-300 font-medium" 
            : "!text-slate-200 hover:bg-white/5 hover:!text-amber-300",
        ].join(" ")
      }
    >
      <div className="flex items-center gap-3">
        {/* AGREGADO: shrink-0 para evitar que el icono se aplaste */}
        {Icon && <Icon className="text-lg shrink-0" />}
        <span className={`truncate ${collapsed ? "hidden" : "block"}`}>{label}</span>
      </div>
    </NavLink>
  );
}

// ---------- Subcomponente Group ----------
function Group({ icon: Icon, label, children, collapsed, onExpand, items }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (items && !collapsed) {
      const isParentOfActive = items.some(item => 
        location.pathname === item.to || location.pathname.startsWith(item.to + "/")
      );
      if (isParentOfActive) {
        setOpen(true);
      }
    }
  }, [location.pathname, items, collapsed]);

  const toggle = () => (collapsed ? onExpand?.() : setOpen(v => !v));

  return (
    <div className="px-2">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        title={collapsed ? label : undefined}
        className={[
          "w-full rounded-md px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 ring-amber-400/40",
          open ? "bg-amber-500/15 !text-amber-300" : "!text-slate-200 hover:bg-white/5 hover:!text-amber-300",
        ].join(" ")}
      >
        {/* AGREGADO: shrink-0 para evitar que el icono se aplaste */}
        {Icon && <Icon className="text-lg shrink-0" />}
        <span className={`flex-1 ${collapsed ? "hidden" : "block"}`}>{label}</span>
        {!collapsed && <HiChevronRight className={`text-lg transition-transform ${open ? "rotate-90" : ""}`} />}
      </button>

      {!collapsed && (
        <div className={`grid transition-[grid-template-rows,opacity] duration-200 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden pl-7 py-1 space-y-1">{children}</div>
        </div>
      )}
    </div>
  );
}

// ---------- Sidebar principal ----------
export default function SidebarVerne() {
  const navigate = useNavigate();
  const mine = useMemo(() => getRoles(), []);

  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isCollapsed = collapsed && !hovering;
  const asideWidth = isCollapsed ? "w-16" : "w-72";

  const NAV = useMemo(() => {
    return RAW_NAV
      .map(g => ({
        ...g,
        children: (g.children || []).filter(c => can(mine, c.roles)),
      }))
      .filter(g => Array.isArray(g.children) && g.children.length > 0);
  }, [mine]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setMobileOpen(false);
    navigate("/", { replace: true });
  };

  const UserFooter = ({ compact }) => (
    <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700/50 p-3 bg-[#0f1a2a]">
      <div className={`flex items-center ${compact ? "justify-center" : "gap-3"}`}>
        
        <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 shrink-0 border border-slate-600">
          <HiUserCircle className="text-3xl" />
        </div>
        
        {!compact && (
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-slate-100 truncate">{getUserName()}</p>
            <p className="text-xs text-amber-400 truncate capitalize font-semibold">{getRoles()[0] || "Usuario"}</p>
          </div>
        )}
        
        {!compact && (
           <button 
             onClick={handleLogout} 
             className="p-2 rounded-md hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors"
             title="Cerrar Sesión"
           >
             <HiLogout className="text-lg" />
           </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        className="md:hidden fixed top-3 left-3 z-50 rounded-md bg-[#0f1a2a] text-white p-2 border border-slate-700 shadow-lg"
        onClick={() => setMobileOpen(true)}
      >
        <HiMenu className="text-2xl" />
      </button>

      <aside
        onMouseEnter={() => collapsed && setHovering(true)}
        onMouseLeave={() => collapsed && setHovering(false)}
        className={`${asideWidth} hidden md:block transition-[width] duration-300 bg-[#0f1a2a] text-white border-r border-slate-800/60 sticky top-0 h-screen verne-sidebar relative z-40`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 h-16 border-b border-slate-800/60">
          <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? "justify-center w-full" : ""}`}>
            <div className="h-9 w-9 rounded-full bg-amber-500 grid place-items-center text-slate-900 font-bold shrink-0 shadow-md shadow-amber-500/20">V</div>
            {!isCollapsed && (
              <div className="leading-tight overflow-hidden whitespace-nowrap">
                <div className="text-white text-sm font-semibold tracking-wide">VERNE</div>
                <div className="text-slate-400 text-[11px] uppercase font-medium">SIP</div>
              </div>
            )}
          </div>
        </div>

        {/* Botón flotante para expandir/colapsar */}
        <button
            onClick={() => setCollapsed(v => !v)}
            className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-sm bg-amber-500 text-slate-900 shadow-md hover:bg-amber-400 focus:outline-none border-2 border-[#0f1a2a]"
            title={collapsed ? "Expandir" : "Colapsar"}
        >
            {collapsed ? <HiChevronRight className="text-[10px] stroke-[1px]" /> : <HiChevronLeft className="text-[10px] stroke-[1px]" />}
        </button>

        {/* Nav */}
        <nav className="py-3 overflow-y-auto h-[calc(100vh-8.5rem)] custom-scrollbar">
          {!isCollapsed && (
            <div className="px-4 pb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              Principal
            </div>
          )}

          <div className="px-2 mb-2">
            <ItemLink to="/dashboard" icon={HiHome} label="Dashboard" collapsed={isCollapsed} end={true} />
          </div>

          {!isCollapsed && (
            <div className="px-4 pt-2 pb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              Gestión
            </div>
          )}

          {NAV.map(g => (
            <Group
              key={g.label}
              icon={g.icon}
              label={g.label}
              items={g.children}
              collapsed={isCollapsed}
              onExpand={() => setCollapsed(false)}
            >
              {g.children.map(c => (
                <ItemLink key={c.to} {...c} />
              ))}
            </Group>
          ))}
        </nav>

        <UserFooter compact={isCollapsed} />
      </aside>

      {/* Drawer Móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-[#0f1a2a] text-white shadow-2xl verne-sidebar">
            <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800/60">
               <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 font-bold shrink-0">V</div>
                <div className="leading-tight">
                  <div className="text-white text-sm font-semibold">VERNE</div>
                  <div className="text-slate-400 text-[10px] uppercase font-medium">SIP System</div>
                </div>
              </div>
              <button className="p-2 rounded-md hover:bg-white/10" onClick={() => setMobileOpen(false)}>
                <HiX className="text-xl" />
              </button>
            </div>

            <nav className="py-3 pb-24 overflow-y-auto h-full">
              <div className="px-2 mb-2">
                <ItemLink to="/dashboard" icon={HiHome} label="Dashboard" end={true} />
              </div>
              {NAV.map(g => (
                <Group key={g.label} icon={g.icon} label={g.label} items={g.children} collapsed={false}>
                  {g.children.map(c => <ItemLink key={c.to} {...c} />)}
                </Group>
              ))}
            </nav>

            <UserFooter compact={false} />
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>
    </>
  );
}