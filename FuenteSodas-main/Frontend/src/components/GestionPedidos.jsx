import React, { useState, useEffect, useCallback } from "react";
import "./GestionPedidos.css"

const API_BASE_URL = "http://localhost:3001/api/admin"; 

const CustomModal = ({ title, message, onConfirm, onClose, showCancel = false, children }) => {
    if (!message && !children) return null;

    return (
        <div className="custom-modal-backdrop">
            <div className="custom-modal-content">
                <h3 className="custom-modal-title">{title}</h3>
                {message && <p className="custom-modal-message">{message}</p>}
                {children}
                <div className="custom-modal-actions">
                    {showCancel && (
                        <button onClick={onClose} className="btn btn-cancel">
                            Cancelar
                        </button>
                    )}
                    <button onClick={onConfirm} className="btn btn-confirm">
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    );
};


function GestionPedidos({ currentUser }) {
    const [pedidosNuevos, setPedidosNuevos] = useState([]);
    const [otrosPedidos, setOtrosPedidos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedPedidoId, setExpandedPedidoId] = useState(null); 
    
    const [modal, setModal] = useState({ visible: false, title: '', message: '', action: null, showCancel: false });

    const showAlert = (message) => {
        setModal({
            visible: true,
            title: "Alerta",
            message,
            action: () => setModal({ visible: false }),
            showCancel: false,
            onClose: () => setModal({ visible: false }),
        });
    };

    const showConfirm = (title, message, onConfirm) => {
        setModal({
            visible: true,
            title,
            message,
            action: onConfirm,
            showCancel: true,
            onClose: () => setModal({ visible: false })
        });
    };

    const fetchPedidos = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [resNuevos, resOtros] = await Promise.all([
                fetch(`${API_BASE_URL}/pedidos/nuevos`),
                fetch(`${API_BASE_URL}/pedidos/otros`),
            ]);

            if (!resNuevos.ok || !resOtros.ok) {
                const errorData = await (resNuevos.ok ? resOtros : resNuevos).json().catch(() => ({ message: "Respuesta de servidor fallida." }));
                throw new Error(`Fallo al cargar los datos: ${errorData.message || 'Error desconocido'}`);
            }

            const dataNuevos = await resNuevos.json();
            const dataOtros = await resOtros.json();
            
            setPedidosNuevos(dataNuevos);
            setOtrosPedidos(dataOtros);

        } catch (err) {
            setError(`Error al cargar los pedidos: ${err.message}`);
            console.error("Error al obtener pedidos:", err);
        } finally {
            setIsLoading(false);
        }
    }, []); 

    useEffect(() => {
        fetchPedidos();
    }, [fetchPedidos]);

    const updateStatusAPI = useCallback(async (pedidoId, nuevoEstado) => {
        try {
            const response = await fetch(`${API_BASE_URL}/pedidos/${pedidoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nuevoEstado }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Fallo en la actualización del estado.");
            }

            showAlert(data.message);
            fetchPedidos();

        } catch (err) {
            showAlert(`Error al actualizar estado: ${err.message}`);
            console.error("Fallo al actualizar estado:", err);
        }
    }, [fetchPedidos]);
    

    const handleUpdateStatus = (pedidoId, nuevoEstado) => {
        showConfirm(
            "Confirmar Cambio de Estado",
            `¿Está seguro de cambiar el estado del pedido ${pedidoId} a "${nuevoEstado}"?`,
            () => {
                setModal({ visible: false }); 
                updateStatusAPI(pedidoId, nuevoEstado);
            }
        );
    };


    const estadosDisponibles = ['PENDIENTE', 'EN PREPARACIÓN', 'PEDIDO LISTO', 'ENTREGADO', 'CANCELADO'];
    const estadosFinales = ['ENTREGADO', 'CANCELADO'];

    const renderStatusSelector = (pedidoId, estadoActual) => {
        if (estadosFinales.includes(estadoActual)) {
            return (
                <span className={`status-${estadoActual.toLowerCase().replace(' ', '-')}`}>
                    {estadoActual}
                </span>
            );
        }

        const estadosPermitidos = estadosDisponibles.filter(e => e !== estadoActual && e !== 'PENDIENTE');
        
        return (
            <select 
                value={estadoActual} 
                onChange={(e) => handleUpdateStatus(pedidoId, e.target.value)}
                className="status-selector"
            >
                <option value={estadoActual} disabled>Actual: {estadoActual}</option>
                {estadosPermitidos.map(estado => (
                    <option key={estado} value={estado}>{estado}</option>
                ))}
            </select>
        );
    };

    const renderTable = (pedidos, isNew) => {
        return (
            <div className="tabla-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Fecha</th>
                            <th>Cant. Total</th> 
                            <th>Productos</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pedidos.map(pedido => (
                            <React.Fragment key={pedido.ID}>
                                <tr className={isNew ? 'pedido-nuevo-row' : ''}>
                                    <td>{pedido.ID}</td>
                                    <td>{pedido.Cliente}</td>
                                    <td>
                                        {new Date(pedido.Fecha).toLocaleDateString('es-ES', { 
                                            year: 'numeric', month: '2-digit', day: '2-digit', 
                                            hour: '2-digit', minute: '2-digit' 
                                        })}
                                    </td>
                                    <td className="pedido-cantidad-total">{pedido.CantidadTotalProductos}</td>
                                    {/* Expandir Productos */}
                                    <td>
                                        <button 
                                            onClick={() => setExpandedPedidoId(expandedPedidoId === pedido.ID ? null : pedido.ID)}
                                            className="btn-ver-detalles"
                                        >
                                            {expandedPedidoId === pedido.ID ? 'Ocultar Detalles' : `Ver ${pedido.Productos?.length || 0} Artículo(s)`}
                                        </button>
                                    </td>
                                    
                                    <td>S/.{parseFloat(pedido.Total).toFixed(2)}</td> 
                                    
                                    <td>
                                        <span className={`status-${pedido.Estado.toLowerCase().replace(' ', '-')}`}>
                                            {pedido.Estado}
                                        </span>
                                    </td>
                                    <td>
                                        {isNew ? (
                                            <button 
                                                onClick={() => handleUpdateStatus(pedido.ID, 'EN PREPARACIÓN')}
                                                className="btn btn-iniciar-prep"
                                            >
                                                Iniciar Preparación
                                            </button>
                                        ) : (
                                            renderStatusSelector(pedido.ID, pedido.Estado)
                                        )}
                                    </td>
                                </tr>
                                {/* Fila Expandible para Detalles del Producto */}
                                {expandedPedidoId === pedido.ID && (
                                    <tr className="detalle-productos-row">
                                        <td colSpan="8" className="detalle-productos-cell">
                                            <h5 className="detalle-productos-titulo">Detalles del Pedido #{pedido.ID}</h5>
                                            <ul className="lista-productos">
                                                {pedido.Productos.map((producto, index) => (
                                                    <li key={index} className="producto-item">
                                                        <span className="producto-nombre">
                                                            {producto.NombreProducto}
                                                        </span>
                                                        <span className="producto-info">
                                                            x{producto.Cantidad} (S/.{parseFloat(producto.PrecioUnitario).toFixed(2)} c/u)
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };


    if (isLoading) {
        return <div className="loading-state">Cargando pedidos...</div>;
    }

    if (error) {
        return <div className="error-state">Error: {error}</div>;
    }

    return (
        <div className="gestion-pedidos">
            <header>
                <h2>Gestión de Pedidos</h2>
            </header>

            <section className="pedidos-nuevos-section">
                <h3>🚨 ¡Pedidos Nuevos Pendientes! ({pedidosNuevos.length})</h3>
                {renderTable(pedidosNuevos, true)}
            </section>

            <section className="otros-pedidos-section">
                <h3>Otros Pedidos ({otrosPedidos.length})</h3>
                {renderTable(otrosPedidos, false)}
            </section>
            
            {modal.visible && (
                <CustomModal
                    title={modal.title}
                    message={modal.message}
                    onConfirm={modal.action}
                    onClose={modal.onClose}
                    showCancel={modal.showCancel}
                />
            )}
        </div>
    );
}

export default GestionPedidos;