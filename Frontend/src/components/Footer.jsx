import React from 'react';
import './Footer.css';

function Footer({ onLoginClick }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Formulario de contacto enviado (simulación).");
  };

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-column">
          <div className="info-box">
            <h3>NAOMI</h3>
            <p>
              <strong>Lunes a sábado:</strong><br />
              12:00 pm. – 22:00 pm.
            </p>
            <p>
              <strong>Domingo:</strong><br />
              16:00 pm. – 22:00 pm.
            </p>
          </div>
          <button onClick={onLoginClick} className="personal-link">Personal</button>
        </div>

        <div className="footer-column">
          <h3>Menú</h3>
          <div className="footer-title-underline"></div>
          <ul className="footer-links">
            <li><a href="#platos">{'>'} Platos</a></li>
            <li><a href="#postres">{'>'} Postres</a></li>
            <li><a href="#bebidas">{'>'} Bebidas</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>Contáctanos</h3>
          <div className="footer-title-underline"></div>
          <form className="contact-form" onSubmit={handleSubmit}>
            <input type="text" placeholder="Nombres" required />
            <input type="email" placeholder="Correo Electrónico" required />
            <input type="tel" placeholder="Celular" />
            <textarea placeholder="Asunto" required></textarea>
            <button type="submit">Enviar</button>
          </form>
        </div>
      </div>
    </footer>
  );
}

export default Footer;