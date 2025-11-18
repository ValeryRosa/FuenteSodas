import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { FaShoppingBag } from "react-icons/fa";
import "./PedidosFiltro.css";
import { API_BASE_URL } from '../utils/constants';

const API_PEDIDOS_URL = `${API_BASE_URL}/pedidos`;

const formatCurrency = (value) => {
    return value.toLocaleString('es-PE', { 
        style: 'currency', 
        currency: 'PEN', 
        minimumFractionDigits: 0 
    });
}

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    // Formato local (ej: DD/MM/YYYY en muchos países de habla hispana)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (e) {
    console.error("Error al formatear la fecha:", e);
    return dateString.substring(0, 10); // Retorna solo la parte YYYY-MM-DD
  }
};



const PedidosFiltro = () => {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filterState, setFilterState] = useState('todos'); // Estado seleccionado para filtrar

    // ** NUEVOS ESTADOS DE PEDIDO **
    const estadosDisponibles = useMemo(() => ([
        { value: 'enviado', label: 'Pendiente' },
        { value: 'en preparacion', label: 'En Preparación' },
        { value: 'pedido listo', label: 'Pedido Listo' },
        { value: 'entregado', label: 'Entregado' },
        { value: 'cancelado', label: 'Cancelado' },
    ]), []);
    
    // Opciones para el filtro principal (incluye 'todos')
    const filterOptions = useMemo(() => ([
        { value: 'todos', label: 'Todos los Pedidos' },
        ...estadosDisponibles
    ]), [estadosDisponibles]);


    // Función para obtener la lista de pedidos, con filtro por estado
    const fetchPedidos = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const url = new URL(API_PEDIDOS_URL);
            if (filterState !== 'todos') {
                // Asegurar que el backend espera el parámetro 'estado'
                url.searchParams.append('estado', filterState);
            }
            
            // Implementación de Backoff para la llamada a la API
            let response = null;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts) {
                try {
                    response = await fetch(url);
                    if (response.ok) break; // Sale del bucle si es exitoso
                } catch (e) {
                    // console.warn(`Intento ${attempts + 1} fallido. Reintentando en ${Math.pow(2, attempts)}s...`);
                    if (attempts < maxAttempts - 1) {
                         await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
                    }
                }
                attempts++;
            }
            
            if (!response || !response.ok) {
                const errorData = response ? await response.json() : {};
                throw new Error(errorData.message || 'Fallo al cargar los pedidos después de varios intentos.');
            }
            
            const data = await response.json();
            
            const processedData = data.map(p => ({
                ...p,
                // Asegurar que total_pago sea numérico para el formateo
                total: typeof p.total === 'number' ? p.total : parseFloat(p.total || 0),
            }));

            setPedidos(processedData);
            
        } catch (err) {
            console.error("Error al cargar pedidos:", err);
            setError(`Error al cargar la lista de pedidos: ${err.message}`);
            setPedidos([]);
        } finally {
            setLoading(false);
        }
    }, [filterState]); // Dependencia del estado de filtro

    // Efecto para cargar los pedidos cuando cambia el filtro
    useEffect(() => {
        fetchPedidos();
    }, [fetchPedidos]);

    // ** NO SE NECESITA handleUpdateEstado YA QUE SOLO SE REQUIERE FILTRAR **


    return (
        <div className="filtro-pedidos-container">
            
            {/* Encabezado */}
            <div className="filtro-pedidos-header">
                <h1 className="filtro-pedidos-title">
                    <FaShoppingBag className="filtro-pedidos-icon" />
                    Gestión de Pedidos
                </h1>
            </div>

            {/* Control de Filtro por Estado */}
            <div className="filter-controls">
                <label htmlFor="estado-filtro" className="filter-label">
                    Filtrar por Estado:
                </label>
                <select
                    id="estado-filtro"
                    value={filterState}
                    onChange={(e) => setFilterState(e.target.value)}
                    className="filter-select"
                    disabled={loading}
                >
                    {filterOptions.map(estado => (
                        <option key={estado.value} value={estado.value}>
                            {estado.label}
                        </option>
                    ))}
                </select>
            </div>


            {/* Mensajes de Notificación */}
            {error && (
                <div 
                    className="notification-message msg-error" 
                    role="alert"
                >
                    <span>⚠️ Error al cargar: {error}</span>
                </div>
            )}
            
            {/* Tabla de Pedidos */}
            <div className="pedidos-table-wrapper">
                <table className="pedidos-table">
                    <thead className="table-header">
                        <tr>
                            <th className="table-th">ID Pedido</th>
                            <th className="table-th">Cliente</th>
                            <th className="table-th">Fecha</th>
                            <th className="table-th text-right">Total</th>
                            <th className="table-th">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="table-body">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="table-td text-center loading-row">
                                    Cargando pedidos...
                                </td>
                            </tr>
                        ) : pedidos.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="table-td text-center no-data-row">
                                    No hay pedidos que coincidan con este estado '{filterOptions.find(e => e.value === filterState)?.label}'.
                                </td>
                            </tr>
                        ) : (
                            pedidos.map((pedido) => (
                                <tr key={pedido.id_pedido} className="table-row">
                                    <td className="table-td text-id">#{pedido.idPedido}</td>
                                    <td className="table-td">{pedido.nombre_cliente}</td>
                                    <td className="table-td">{formatDate(pedido.fecha)}</td>
                                    <td className="table-td text-left text-total">
                                        {formatCurrency(pedido.total)}
                                    </td>
                                    <td className="table-td">
                                        {/* Mostrar el estado actual sin selector */}
                                        <span className={`status-display status-${pedido.estado.toLowerCase().replace(/\s/g, '-')}`}>
                                            {estadosDisponibles.find(e => e.value === pedido.estado.toLowerCase())?.label || pedido.estado}
                                        </span>
                                    </td>          
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
        </div>
    );
};

export default PedidosFiltro;