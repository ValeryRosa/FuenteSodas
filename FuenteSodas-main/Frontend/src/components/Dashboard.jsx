import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FaDownload, FaCalendarAlt, FaArrowRight} from "react-icons/fa";
import { FaArrowTrendUp } from "react-icons/fa6";
import "./Dashboard.css";
import { API_BASE_URL } from '../utils/constants';


const API_SALES_URL = `${API_BASE_URL}/reports/sales`;
const API_PDF_URL = `${API_SALES_URL}/pdf`;

const getCurrentDate = () => new Date().toISOString().split('T')[0];
const getOneMonthAgo = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().split('T')[0];
};


const DateInput = ({ label, value, onChange, icon: Icon }) => (
  <div className="date-input-group">
    <label className="date-label">
        {Icon && <Icon className="date-icon" />}
        {label}
    </label>
    <input
      type="date"
      value={value}
      onChange={onChange}
      className="date-field"
    />
  </div>
);

const Dashboard = () => {
  const [startDate, setStartDate] = useState(getOneMonthAgo());
  const [endDate, setEndDate] = useState(getCurrentDate());
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');

    if (new Date(startDate) > new Date(endDate)) {
      setError('La fecha de inicio no puede ser posterior a la fecha de fin.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(API_SALES_URL, {
        params: {
          startDate: startDate,
          endDate: endDate
        }
      });
      
      const data = response.data;
      setSalesData(data || []);

      if (data.length > 0) {
         setSuccessMessage(`Datos de ventas cargados para el rango: ${startDate} al ${endDate}.`);
      } else {
         setSuccessMessage('No se encontraron ventas para el rango seleccionado.');
      }

    } catch (err) {
      console.error("Error al cargar el dashboard:", err);
      const errorMessage = err.response?.data?.message || `Error de conexión: ${err.message}. Asegúrate que el backend esté corriendo.`;
      setError(`Fallo al cargar los datos: ${errorMessage}`);
      setSalesData([]);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(''), 5000);
      setTimeout(() => setError(null), 5000);
    }
  }, [startDate, endDate]); 

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);


  // Metricas

  //Total de Ventas Netas
  const totalSales = useMemo(() => {
    return salesData.reduce((sum, item) => sum + item.total, 0);
  }, [salesData]);
  
  //Total de Transacciones
  const totalTransactions = useMemo(() => {
    return salesData.reduce((sum, item) => sum + item.count, 0);
  }, [salesData]);

  //Venta Promedio
  const averageSale = useMemo(() => {
      return totalTransactions > 0 ? totalSales / totalTransactions : 0;
  }, [totalSales, totalTransactions]);


  //Exportar PDF
  
  const handleExport = () => {
    if (salesData.length === 0) {
      setError('No hay datos para exportar.');
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      setError('La fecha de inicio no puede ser posterior a la fecha de fin para exportar.');
      return;
    }
    
    setError(null);
    setSuccessMessage('Generando reporte PDF...');
    
    const url = `${API_PDF_URL}?startDate=${startDate}&endDate=${endDate}`;
    window.open(url, '_blank');
    
    setTimeout(() => {
        setSuccessMessage('Solicitud de reporte PDF enviada. La descarga comenzará en breve.');
    }, 500);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const formatCurrency = (value) => {
    return value.toLocaleString('es-PE', { 
        style: 'currency', 
        currency: 'PEN', 
        minimumFractionDigits: 0 
    });
  }

    const formatNumber = (value) => {
    return value.toLocaleString('es-PE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  return (
    <div className="dashboard-container">
      
      {/* Encabezado y Botón de Exportación */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <FaArrowTrendUp className="header-icon" />
          Dashboard de Ventas
        </h1>
        <button
          onClick={handleExport}
          className="export-button"
          disabled={loading || salesData.length === 0}
          title="Exportar Reporte PDF del rango filtrado"
        >
          <FaDownload className="button-icon" />
          Exportar PDF
        </button>
      </div>
      
      {/* Sección de Filtros y Mensajes */}
      <div className="filters-section">
        <h2 className="filters-title">Ajuste de Rango de Fechas</h2>
        
        <div className="filters-group">
          <DateInput
            label="Fecha de Inicio"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            icon={FaCalendarAlt}
          />
          <DateInput
            label="Fecha de Fin"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            icon={FaCalendarAlt}
          />

          <button
            onClick={fetchSalesData}
            disabled={loading}
            className="apply-filters-button"
          >
            {loading ? 'Cargando...' : 'Aplicar Filtros'}
          </button>
          
          <div className="report-type-indicator-wrapper">
            {startDate === endDate && (
                <span className="report-type-indicator">
                    Reporte Diario
                </span>
            )}
          </div>
        </div>
        
        {/* Mensajes de Notificación */}
        {error && (
          <div className="message-box error" role="alert">
            <span className="message-label">⚠️ Error:</span> {error}
          </div>
        )}
        {successMessage && !error && (
          <div className="message-box success" role="alert">
            <span className="message-label">✅ Éxito:</span> {successMessage}
          </div>
        )}
      </div>

      {/* Metricas */}
      <div className="metrics-grid">
        
        {/* Total de Ventas */}
        <div className="metric-card sales-metric">
          <p className="metric-label">Total de Ventas Netas</p>
          <p className="metric-value">
            {loading ? '...' : formatCurrency(totalSales)}
          </p>
          <p className="metric-period">
            Desde {startDate} <FaArrowRight className="period-arrow-icon" /> {endDate}
          </p>
        </div>
        
        {/* Transacciones */}
        <div className="metric-card transactions-metric">
          <p className="metric-label">Total de Transacciones</p>
          <p className="metric-value">
            {loading ? '...' : totalTransactions.toLocaleString('es-PE')}
          </p>
          <p className="metric-period">
             Número total de pedidos/ventas.
          </p>
        </div>
        
        {/* Venta Promedio */}
        <div className="metric-card average-metric">
          <p className="metric-label">Venta Promedio por Transacción</p>
          <p className="metric-value">
            {loading ? '...' : formatCurrency(averageSale)}
          </p>
          <p className="metric-period">
             Monto promedio de venta.
          </p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="chart-section">
        <h2 className="chart-title">Tendencia de Ventas Diarias (Monto)</h2>
        
        <div className="chart-wrapper">
          {loading ? (
            <div className="chart-loading-message">Cargando gráfico...</div>
          ) : salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={salesData}
                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => date.substring(5)} 
                />
                <YAxis
                  tickFormatter={(value) => value.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                />
                <Tooltip
                formatter={(value, name, props) => {
                        if (props.dataKey === 'total') {
                            return [formatCurrency(value), name]; // Con S/.
                        }
                        if (props.dataKey === 'count') {
                            return [formatNumber(value), name]; // Sin S/.
                        }
                        return [value, name];
                    }}
                labelFormatter={(label) => `Fecha: ${label}`}
                contentClassName="chart-tooltip"
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="blue"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  name="Venta Diaria"
                  className="chart-line-total"
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="green"
                  strokeWidth={1}
                  yAxisId={0}
                  name="# Transacciones"
                  dot={false}
                  className="chart-line-count"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-no-data-message">
              No hay datos para mostrar en el gráfico con los filtros actuales.
            </div>
          )}
        </div>
      </div>

      {/* Tabla de Datos Detallados */}
      <div className="table-section">
        <h2 className="table-title">
            Detalle de Ventas ({totalTransactions.toLocaleString('es-PE')} Transacciones)
        </h2>
        <div className="table-wrapper">
          <table className="sales-table">
            <thead>
              <tr className="table-header-row">
                <th className="table-header-cell">Fecha</th>
                <th className="table-header-cell text-right">Venta Diaria Total</th>
                <th className="table-header-cell text-right"># Transacciones</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((sale, index) => (
                <tr key={sale.date} className={`table-data-row ${index % 2 === 0 ? 'even' : 'odd'}`}>
                  <td className="table-data-cell date-cell">
                    {sale.date}
                  </td>
                  <td className="table-data-cell total-cell text-right">
                    <span className="total-value">{formatCurrency(sale.total)}</span>
                  </td>
                  <td className="table-data-cell count-cell text-right">
                    {sale.count.toLocaleString('es-PE')}
                  </td>
                </tr>
              ))}
              {salesData.length === 0 && (
                <tr>
                  <td colSpan="3" className="table-no-data-cell">
                    {loading ? 'Cargando...' : 'No hay detalles de ventas para mostrar.'}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="table-footer">
              <tr className="table-footer-row">
                <td className="table-footer-cell summary-label">TOTALES DEL RANGO</td>
                <td className="table-footer-cell summary-value sales-total-value">
                    {formatCurrency(totalSales)}
                </td>
                <td className="table-footer-cell summary-value transactions-total-value">
                    {totalTransactions.toLocaleString('es-PE')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;