import React, { useState } from "react";
import "./AdminLayout.css";
import CrearPersonalForm from "./Crearpersonal.jsx";
import GestionCategorias from "./GestionCategorias.jsx";
import GestionProductos from "./GestionProductos.jsx";

function AdminLayout({ currentUser, onLogout }) {
  //Por defecto mostrar'productos'.
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
          <div>
            <h2>Lista de Clientes</h2>
            <p>
              Aquí irá una tabla o lista de todos los usuarios con rol
              'cliente'.
            </p>
          </div>
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
