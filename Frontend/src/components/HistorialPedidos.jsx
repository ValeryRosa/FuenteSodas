import React, { useEffect, useState, useCallback } from 'react';
import './HistorialPedidos.css';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const API_BASE_URL = "http://localhost:3001/api"; 

const PedidoCard = ({ pedido, isExpanded, onToggleDetails }) => {

    const getStatusInfo = (estado) => {
        const normalizedEstado = (estado || '').toUpperCase();
        
        switch (normalizedEstado) {
            case 'ENTREGADO':
                return { statusClass: 'delivered', statusIcon: FaCheckCircle, display: 'Entregado' };
            case 'CANCELADO':
                return { statusClass: 'cancelled', statusIcon: FaTimesCircle, display: 'Cancelado' };
            case 'EN PREPARACIÓN':
            case 'RECIBIDO':
            case 'PEDIDO LISTO':
                return { statusClass: 'in-progress', statusIcon: FaHourglassHalf, display: normalizedEstado };
            case 'PENDIENTE':
            default:
                return { statusClass: 'pending', statusIcon: FaHourglassHalf, display: 'Pendiente' };
        }
    };


    const statusInfo = getStatusInfo(pedido.estado);
    const StatusIconComponent = statusInfo.statusIcon; 

    // Mostrar el resumen de los productos
    const productos = pedido.productos || pedido.DetallePedido || [];
    let resumenArticulos;

    if (productos && productos.length > 0) {
        const totalArticulos = productos.reduce((sum, item) => sum + item.cantidad, 0);
        const primerProducto = productos[0];
        
        const nombreProducto = primerProducto.nombre || primerProducto.producto;
        const otrosArticulos = totalArticulos - primerProducto.cantidad;

        resumenArticulos = 
            `${primerProducto.cantidad}x ${nombreProducto}` + 
            (otrosArticulos > 0 ? ` y ${otrosArticulos} artículo(s) más.` : '');
    } else {
        resumenArticulos = "No hay artículos listados para este pedido."; 
    }
    
    // Formateo de fecha
    const fechaFormateada = pedido.fecha ? new Date(pedido.fecha).toLocaleDateString('es-ES', { 
        year: 'numeric', month: '2-digit', day: '2-digit'
    }) : 'Fecha no disponible';

    const ChevronIconComponent = isExpanded ? FaChevronUp : FaChevronDown;

    return (
        <div className="pedido-card">
            <div className="pedido-header">
                <span className={`pedido-status ${statusInfo.statusClass}`}>
                    <StatusIconComponent style={{marginRight: '5px'}}/> {statusInfo.display}
                </span>
                <span className="pedido-id">Pedido #{pedido.id}</span>
            </div>
            <div className="pedido-body">
                <p><strong>Fecha:</strong> {fechaFormateada}</p>
                <p><strong>Resumen:</strong> {resumenArticulos}</p> 
            </div>
            <div className="pedido-footer">
                <span className="pedido-total">Total: S/ {parseFloat(pedido.total || 0).toFixed(2)}</span>
                <button className="btn-details" onClick={() => onToggleDetails(pedido.id)}>
                    <ChevronIconComponent style={{marginRight: '5px'}}/> {isExpanded ? 'Ocultar' : 'Ver'} Detalles
                </button>
            </div>

            {/* Detalles expandidos */}
            {isExpanded && (
                <div className="detalle-expandido">
                    <h4>Detalle de Artículos</h4>
                    <ul className="lista-productos-detalle">
                        {(productos || []).map((item, index) => {
                            const itemName = item.nombre || item.producto || 'Producto Desconocido';
                            const itemSubtotal = parseFloat(item.subtotal || (item.precio_u * item.cantidad) || 0).toFixed(2);
                            return (
                                <li key={index} className="producto-item-detalle">
                                    <span className="producto-nombre">
                                        {item.cantidad}x {itemName}
                                    </span>
                                    <span className="producto-info">
                                        S/ {itemSubtotal}
                                    </span>
                                </li>
                            );
                            
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};


// Componente principal
function HistorialPedidos({ currentUser, onNavigate, views }) {
    const [pedidos, setPedidos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedPedidoId, setExpandedPedidoId] = useState(null);

    const userId = currentUser?.id || 1; 
    const userName = currentUser?.nombre || "Cliente";

    const ArrowLeftIcon = FaArrowLeft;

    const fetchHistorial = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const url = `${API_BASE_URL}/cliente/pedidos/${userId}`;
            console.log('[FETCH] Llamando a historial:', url);
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(errorData.message || "Fallo al cargar el historial de pedidos.");
            }

            let data = await response.json();
            console.log('[FETCH] Pedidos recibidos:', data);
            
            if (Array.isArray(data)) {
                data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
                setPedidos(data);
            } else {
                 setPedidos([]);
            }
        } catch (err) {
            let errorMessage = err.message;
            if (err.message.includes('fetch')) {
                 errorMessage = `No se pudo conectar al servidor de pedidos en ${API_BASE_URL}`;
            }
            setError(`Error al cargar el historial: ${err.message}`);
            console.error("Error al obtener historial:", err);
        } finally {
            setIsLoading(false);
        }
    }, [userId]); 

    useEffect(() => {
        fetchHistorial();
    }, [fetchHistorial]);

    const handleToggleDetails = (pedidoId) => {
        setExpandedPedidoId(prevId => (prevId === pedidoId ? null : pedidoId));
    };


    if (error) {
        return <div className="historial-pedidos-cliente"><div className="historial-error">Error: {error}</div></div>;
    }

    if (isLoading) {
        return <div className="historial-pedidos-cliente"><div className="historial-loading">Cargando historial de pedidos...</div></div>;
    }
    
    return (
        <div className="historial-pedidos-cliente">
            <header className="historial-header">
                {onNavigate && views && (
                    <button 
                        className="btn-back"
                        onClick={() => onNavigate(views.CATALOGO)}
                    >
                        <ArrowLeftIcon style={{marginRight: '5px'}}/> Volver a La Carta
                    </button>
                )}
                <h1>Historial de Pedidos de {userName}</h1>
                <p>Revisa el estado y detalles de tus compras anteriores.</p>
                <div className="divider"></div>
            </header>

            <div className="pedidos-list">
                {pedidos.length === 0 ? (
                    <div className="no-pedidos">Aún no tienes pedidos registrados.</div>
                ) : (
                    pedidos.map(pedido => (
                        <PedidoCard 
                            key={pedido.id} 
                            pedido={pedido} 
                            isExpanded={expandedPedidoId === pedido.id}
                            onToggleDetails={handleToggleDetails}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default HistorialPedidos;