import React, { useState, useEffect, useCallback } from "react"; 
import axios from 'axios';
import "./OperadorLayout.css"; 
import GestionPedidos from "./GestionPedidos.jsx";
import { API_BASE_URL } from '../utils/constants';


const API_PEDIDOS_NUEVOS_COUNT_URL = `${API_BASE_URL}/orden/estado/PENDIENTE/count`;
const API_MARCAR_VISTOS_URL = `${API_BASE_URL}/orden/marcar-nuevos-como-vistos`; 


function OperadorLayout({ currentUser, onLogout }) {
    const [activeView, setActiveView] = useState("pedidos"); 
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0); 
    const [loadingCount, setLoadingCount] = useState(false);



    const fetchNewOrdersCount = useCallback(async () => {
        setLoadingCount(true);
        try {
            const response = await axios.get(API_PEDIDOS_NUEVOS_COUNT_URL);
            const count = response.data.count || 0;
            
            setPendingOrdersCount(count); 
        } catch (error) {
            console.error("Error al obtener conteo de pedidos NUEVOS (PENDIENTES):", error);
            setPendingOrdersCount(0); 
        } finally {
            setLoadingCount(false);
        }
    }, []); 
    
    // MARCAR LOS PEDIDOS COMO VISTOS
    const markNewOrdersAsSeen = useCallback(async () => {
        if (pendingOrdersCount > 0) {
            try {
                await axios.post(API_MARCAR_VISTOS_URL, {
                    operadorId: currentUser.id
                });
                console.log("Pedidos nuevos marcados como vistos (EN PROCESO).");
                setPendingOrdersCount(0); 
            } catch (error) {
                console.error("Error al marcar pedidos como vistos:", error);
            }
        }
    }, [pendingOrdersCount, currentUser]);


    useEffect(() => {
        fetchNewOrdersCount();

        const intervalId = setInterval(fetchNewOrdersCount, 30000); 

        return () => clearInterval(intervalId);
    }, [fetchNewOrdersCount]);


    const handleViewChange = (viewName) => {
        setActiveView(viewName);
        
        if (viewName === "pedidos" && pendingOrdersCount > 0) {
            markNewOrdersAsSeen(); 
        }
    };

    return (
        <div className="admin-layout">
            {/* BARRA LATERAL IZQUIERDA */}
            <aside className="admin-sidebar">
                <h3>Panel Operador</h3>
                <ul className="admin-menu">
                    
                    <li>
                        <span
                            className={activeView === "pedidos" ? "active" : ""}
                            onClick={() => handleViewChange("pedidos")}
                        >
                            Pedidos
                            {/* Mostrar solo si pendingOrdersCount es mayor a 0 */}
                            {pendingOrdersCount > 0 && (
                                <span className="notification-badge">
                                    {pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
                                </span>
                            )}
                        </span>
                    </li>
                    <li>
                        <span onClick={onLogout} style={{ cursor: "pointer" }}>
                            Cerrar Sesión
                        </span>
                    </li>
                </ul>
            </aside>

            {/* CONTENIDO PRINCIPAL (DERECHA) */}
            <main className="admin-content">
                {activeView === "pedidos" && (
                    <GestionPedidos currentUser={currentUser} />
                )}

            </main>
        </div>
    );
}

export default OperadorLayout;