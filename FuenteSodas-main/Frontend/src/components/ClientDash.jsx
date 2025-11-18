import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {FaUser, FaSyncAlt, FaMobileAlt } from "react-icons/fa";
import './ClientDash.css'; 
import { API_BASE_URL } from '../utils/constants';


const ClientDash = () => {
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/usuarios/clientes`); 
                setClients(response.data); 
                setError(null);
            } catch (err) {
                console.error("Error al obtener la lista de clientes:", err);
                setError("No se pudo cargar la lista de clientes. Verifique la conexión al servidor (puerto 3001) y el estado del backend.");
                setClients([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchClients();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString); 
            // Formato: DD/MM/YYYY
            return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) {
            return dateString;
        }
    };

    const renderTableBody = () => {
        if (isLoading) {
            return (
                <tr>
                    <td colSpan="6" className="loading-cell">
                        <FaSyncAlt />
                        <p className="loading-text">Cargando datos de clientes...</p>
                    </td>
                </tr>
            );
        }

        if (error) {
            return (
                <tr>
                    <td colSpan="6" className="error-cell">
                        {error}
                    </td>
                </tr>
            );
        }

        if (clients.length === 0) {
            return (
                <tr>
                    <td colSpan="6" className="no-data-cell">
                        No hay clientes registrados en la base de datos con el rol 'cliente'.
                    </td>
                </tr>
            );
        }

        return clients.map((client) => (
            <tr key={client.id} className="client-table-row">
                <td className="client-table-data table-id">{client.id}</td>
                <td className="client-table-data table-nombre">
                    <FaUser />
                    {client.nombre}
                </td>
                <td className="client-table-data table-correo">
                    {client.email}</td>
                <td className="client-table-data table-rol">
                    <span className={`rol-badge ${client.rol === 'admin' ? 'badge-admin' : 'badge-cliente'}`}>
                        {client.rol || 'N/A'}
                    </span>
                </td>
                <td className="client-table-data table-celular">
                    {client.celular ? (<><FaMobileAlt />{client.celular}</>) : 'N/A'}
                </td>
                <td className="client-table-data table-fecharegistro">
                    {formatDate(client.fecha_registro)}
                </td>
            </tr>
        ));
    };



    return (
    <div className="client-dashboard-container">
                <h1 className="dashboard-title">
                    Panel de Clientes Registrados
                </h1>
                <p className="dashboard-subtitle">
                    Listado de todos los usuarios con rol "cliente" en la aplicación.
                </p>

                <div className="table-responsive-wrapper">
                    <table className="client-table">
                        <thead>
                            <tr>
                                <th className="client-table-header w-1/12">ID</th>
                                <th className="client-table-header w-2/12">Nombre</th>
                                <th className="client-table-header w-3/12">Correo Electrónico</th>
                                <th className="client-table-header w-1/12">Rol</th>
                                <th className="client-table-header w-2/12">Celular</th>
                                <th className="client-table-header w-2/12">Fecha Registro</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderTableBody()}
                        </tbody>
                    </table>
                </div>

                <div className="client-count">
                    Total de Clientes: <span className="client-count-number">{clients.length}</span>
                </div>
            </div>
    );
};

export default ClientDash;