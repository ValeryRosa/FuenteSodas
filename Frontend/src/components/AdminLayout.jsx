import React, { useState, useEffect, useCallback } from "react";
import "./AdminLayout.css";
import CrearPersonalForm from "./Crearpersonal.jsx";
import GestionCategorias from "./GestionCategorias.jsx";
import GestionProductos from "./GestionProductos.jsx";
import ClientDash from "./ClientDash.jsx";
import Dashboard from "./Dashboard.jsx";
import PedidosFiltro from "./PedidosFiltros.jsx";


function AdminLayout({ currentUser, onLogout }) {
  const [activeView, setActiveView] = useState("productos");


    const handleViewChange = (viewName) => {
        setActiveView(viewName);
    };

  return (
    <div className="admin-layout">
      {/*BARRA LATERAL IZQUIERDA*/}
      <aside className="admin-sidebar">
        <h3>Panel Admin</h3>
        <ul className="admin-menu">
          <li>
            <span
              className={activeView === "productos" ? "active" : ""}
              onClick={() => handleViewChange("productos")}
            >
              Productos
            </span>
          </li>
          <li>
            <span
              className={activeView === "categorias" ? "active" : ""}
              onClick={() => handleViewChange("categorias")}
            >
              Categorías
            </span>
          </li>
          <li>
            <span
              className={activeView === "personal" ? "active" : ""}
              onClick={() => handleViewChange("personal")}
            >
              Personal
            </span>
          </li>
          <li>
            <span
              className={activeView === "clientes" ? "active" : ""}
              onClick={() => handleViewChange("clientes")}
            >
              Clientes
            </span>
          </li>
          <li>
            <span
              className={activeView === "dashboard" ? "active" : ""}
              onClick={() => handleViewChange("dashboard")}
            >
              Dashboard
            </span>
          </li>        
          <li>
            <span
              className={activeView === "filtropedidos" ? "active" : ""}
              onClick={() => handleViewChange("filtropedidos")}
            >
              Filtrar Pedidos
            </span>
          </li>
          <li>
            <span onClick={onLogout} style={{ cursor: "pointer" }}>
              Cerrar Sesión
            </span>
          </li>
        </ul>
      </aside>

      {/*CONTENIDO PRINCIPAL (DERECHA)*/}
      <main className="admin-content">
        {activeView === "productos" && (
          <GestionProductos currentUser={currentUser} />
        )}

        {activeView === "categorias" && (
          <GestionCategorias currentUser={currentUser} />
        )}

        {activeView === "personal" && <CrearPersonalForm />}

        {activeView === "clientes" && (
          <ClientDash />
        )}
        {activeView === "dashboard" && (
          <Dashboard currentUser={currentUser} /> 
        )}
        {activeView === "filtropedidos" && (
          <PedidosFiltro currentUser={currentUser} /> 
        )}

        {(!activeView || activeView === "") && (
          <div>
              <h2>Seleccione una opción del menú.</h2>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminLayout;
