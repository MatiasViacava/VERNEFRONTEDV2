// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import Home from "./pages/Home";
import Register from "./pages/auth/Register"; // 👈 registro público

import Dashboard from "./pages/dashboard/dashboard";

import UsuarioRegistrar from "./pages/usuario/UsuarioRegistrar";
import UsuarioListar from "./pages/usuario/UsuarioListar";
import TipoUsuarioRegistrar from "./pages/tipoUsuario/TipoUsuarioRegistrar";
import TipoUsuarioListar from "./pages/tipoUsuario/TipoUsuarioListar";

import ProductoRegistrar from "./pages/producto/ProductoRegistrar";
import ProductoListar from "./pages/producto/ProductoListar";
import MarcaRegistrar from "./pages/marca/MarcaRegistrar";
import MarcaListar from "./pages/marca/MarcaListar";

import VentasListar from "./pages/venta/VentaListar";
import VentasRegistrar from "./pages/venta/VentaRegistrar";
import ClienteListar from "./pages/cliente/ClienteListar";
import ClienteRegistrar from "./pages/cliente/ClienteRegistrar";

import ABCXYZ from "./pages/analisis-abcxyz/ABCXYZ";
import ConfigABC from "./pages/analisis-abcxyz/ConfigABC";
import ResultABC from "./pages/analisis-abcxyz/ResultABC";

import PrediccionListar from "./pages/machine-learning/PrediccionListar";
import PrediccionVenta from "./pages/machine-learning/PrediccionVenta";

import AppLayout from "./layouts/AppLayout";

// ---- helpers de auth/roles ----
const getUser = () => JSON.parse(localStorage.getItem("user") || "{}");
const getRoles = () =>
  (getUser().roles || []).map((r) => String(r).toLowerCase());

function RequireAuth() {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  return <Outlet />;
}

function RequireRole({ allow = [] }) {
  const mine = getRoles();
  const ok = allow.length === 0 || allow.some((r) => mine.includes(r.toLowerCase()));
  return ok ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />

        {/* App protegida */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            {/* Acceso para cualquier logueado */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Solo ADMINISTRADOR */}
            <Route element={<RequireRole allow={["administrador"]} />}>
              {/* Usuarios */}
              <Route path="/usuarios/registrar" element={<UsuarioRegistrar />} />
              <Route path="/usuarios/listar" element={<UsuarioListar />} />
              <Route path="/usuarios/editar/:id" element={<UsuarioRegistrar />} />
              {/* Tipos de usuario */}
              <Route path="/tipo-usuarios/registrar" element={<TipoUsuarioRegistrar />} />
              <Route path="/tipo-usuarios/listar" element={<TipoUsuarioListar />} />
              <Route path="/tipo-usuarios/editar/:id" element={<TipoUsuarioRegistrar />} />
              {/* Productos/Marcas */}
              <Route path="/productos/registrar-productos" element={<ProductoRegistrar />} />
              <Route path="/productos/listar-productos" element={<ProductoListar />} />
              <Route path="/productos/editar-producto/:id" element={<ProductoRegistrar />} />
              <Route path="/productos/marca/registrar-marca" element={<MarcaRegistrar />} />
              <Route path="/productos/marca/listar-marca" element={<MarcaListar />} />
              <Route path="/productos/marca/editar-marca/:id" element={<MarcaRegistrar />} />
              {/* Ventas/Clientes */}
              <Route path="/ventas/listar-ventas" element={<VentasListar />} />
              <Route path="/ventas/registrar-ventas" element={<VentasRegistrar />} />
              <Route path="/ventas/editar-ventas/:id" element={<VentasRegistrar />} />
              <Route path="/ventas/cliente/listar-clientes" element={<ClienteListar />} />
              <Route path="/ventas/cliente/registrar-clientes" element={<ClienteRegistrar />} />
              <Route path="/ventas/cliente/editar-cliente/:id" element={<ClienteRegistrar />} />
                           
            </Route>

            {/* ADMINISTRADOR y USUARIO */}
            <Route element={<RequireRole allow={["administrador", "usuario"]} />}>
              {/* ABC-XYZ (incluye Configurar criterios y Resultados) */}
              <Route path="/abcxyz" element={<ABCXYZ />} />
              <Route path="/abcxyz/config" element={<ConfigABC />} />
              <Route path="/abcxyz/result" element={<ResultABC />} />
              {/* ML: listar resultados -> visible para ambos */}
              <Route path="/ml/prediccion-venta" element={<PrediccionVenta />} />
              <Route path="/ml/listar-predicciones" element={<PrediccionListar />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
