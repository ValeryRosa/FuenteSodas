import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY); //Cambiar por tu api key de SendGrid

export async function sendPaymentConfirmation(userEmail, paymentItems) {
  
  const msg = {
    // IMPORTANTE: Usa el email que verificaste en SendGrid
    from: {
      name: 'Tu Fuente de Soda',
      email: 'bvislao95@gmail.com', // El email remitente verificado
    },
    to: userEmail, // El email del cliente
    subject: '¡Confirmación de tu pago!',
    text: `Hola, hemos recibido tu pago de S/ ${paymentItems.amount}.`, // Texto plano
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>¡Gracias por tu compra!</h2>
        <p>Hola,</p>
        <p>Hemos recibido exitosamente tu pago por:</p>
        <ul>
          <li><strong>Monto:</strong> $${paymentItems.amount}</li>
        </ul>
        <p>Gracias por confiar en nosotros.</p>
      </div>
    `, // HTML
  };

  try {
    // 3. Enviar el correo
    await sgMail.send(msg);
    console.log('Correo de confirmación enviado exitosamente a:', userEmail);
  } catch (error) {
    console.error('Error al enviar el correo de confirmación:', error);

    // Manejo de errores más detallado de SendGrid (opcional pero útil)
    if (error.response) {
      console.error('Error Body:', error.response.body);
    }
    throw new Error('Error al enviar el correo.');
  }
}