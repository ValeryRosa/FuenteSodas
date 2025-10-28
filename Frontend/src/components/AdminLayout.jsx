import React, { useState } from "react";
import "./AdminLayout.css";
import CrearPersonalForm from "./Crearpersonal.jsx";
import GestionCategorias from "./GestionCategorias.jsx";
import GestionProductos from "./GestionProductos.jsx";

function AdminLayout({ currentUser }) {
  console.log("currentUser DENTRO de AdminLayout:", currentUser);
  const [activeView, setActiveView] = useState("productos");
  console.log("AdminLayout renderizando, activeView es:", activeView);

  const handleMenuClick = (viewName) => {
    console.log(`Intentando cambiar a la vista: ${viewName}`);
    setActiveView(viewName);
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h3>Panel Admin</h3>
        <ul className="admin-menu">
          <li>
            <a
              href="#productos"
              className={activeView === "productos" ? "active" : ""}
              onClick={() => setActiveView("productos")}
            >
              Productos
            </a>
          </li>
          <li>
            <a
              href="#categorias"
              className={activeView === "categorias" ? "active" : ""}
              onClick={() => setActiveView("categorias")}
            >
              Categorías
            </a>
          </li>
          <li>
            <a
              href="#personal"
              className={activeView === "personal" ? "active" : ""}
              onClick={() => setActiveView("personal")}
            >
              Personal
            </a>
          </li>
          <li>
            <a
              href="#clientes"
              className={activeView === "clientes" ? "active" : ""}
              onClick={() => setActiveView("clientes")}
            >
              Clientes
            </a>
          </li>
        </ul>
      </aside>

      <main className="admin-content">
        {activeView === "productos" && (
          <GestionProductos currentUser={currentUser} />
        )}

        {activeView === "categorias" && (
          <GestionCategorias currentUser={currentUser} />
        )}

        {activeView === "personal" && (
          <>
            <CrearPersonalForm />
          </>
        )}

        {activeView === "clientes" && (
          <div>
            <h2>Lista de Clientes</h2>
            <p>
              Aquí irá una tabla o lista de todos los usuarios con rol
              'cliente'.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminLayout;
