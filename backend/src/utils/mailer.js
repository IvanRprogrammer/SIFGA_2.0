const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendPasswordResetEmail = async (correo, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Password Reset] Token para ${correo}: ${token}`);
    console.log(`[Password Reset] URL: ${resetUrl}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@sifga.com',
    to: correo,
    subject: 'SIFGA - Restablecimiento de Contraseña',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0d6efd; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">SIFGA</h2>
          <p style="color: white; margin: 5px 0 0;">Sistema Integrado de Facturación y Gestión de Agua</p>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <p>Ha solicitado restablecer su contraseña.</p>
          <p>Haga clic en el siguiente botón para continuar:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background: #0d6efd; color: white; padding: 12px 30px;
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="color: #6c757d; font-size: 0.9em;">
            Este enlace expirará en 1 hora.
          </p>
          <p style="color: #6c757d; font-size: 0.9em;">
            Si no solicitó este cambio, ignore este mensaje.
          </p>
        </div>
      </div>
    `
  });
};

module.exports = { sendPasswordResetEmail };
