import nodemailer from 'nodemailer';

// Configure email transporter
let transporter = null;

function initializeMailer() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
    console.warn('⚠️ Email configuration incomplete. Stock alerts disabled.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: parseInt(smtpPort) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  console.log('✅ Email service initialized');
  return transporter;
}

/**
 * Send low stock alert email
 * @param {string} productName - Product name
 * @param {string} category - Product category
 * @param {number} currentStock - Current stock level
 * @param {number} threshold - Alert threshold
 * @returns {Promise<boolean>} Success status
 */
async function sendStockAlert(productName, category, currentStock, threshold) {
  if (!process.env.ENABLE_STOCK_ALERTS || process.env.ENABLE_STOCK_ALERTS === 'false') {
    console.log('📧 Stock alerts disabled');
    return false;
  }

  if (!transporter) {
    transporter = initializeMailer();
  }

  if (!transporter) {
    console.error('❌ Email transporter not configured');
    return false;
  }

  const alertEmail = process.env.ALERT_EMAIL;
  if (!alertEmail) {
    console.error('❌ ALERT_EMAIL not configured');
    return false;
  }

  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: alertEmail,
      subject: `⚠️ Stock Bajo: ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #d84848 0%, #c63636 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">⚠️ ALERTA DE STOCK BAJO</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">BRO'S BRUGER Y LOMOS</p>
          </div>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #d84848; margin-top: 0;">Detalles del Producto</h2>
            
            <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
              <p style="margin: 8px 0;"><strong>Producto:</strong> ${productName}</p>
              <p style="margin: 8px 0;"><strong>Categoría:</strong> ${category}</p>
              <p style="margin: 8px 0;">
                <strong>Stock Actual:</strong> 
                <span style="color: #d84848; font-weight: bold; font-size: 16px;">${currentStock} unidades</span>
              </p>
              <p style="margin: 8px 0;"><strong>Umbral de Alerta:</strong> ${threshold} unidades</p>
            </div>

            <div style="background: #ffe8e8; border-left: 4px solid #d84848; padding: 12px; border-radius: 4px;">
              <p style="margin: 0; color: #333;">
                ⏰ <strong>Acción requerida:</strong> Stock por debajo del nivel mínimo. Considera reponer este producto pronto.
              </p>
            </div>
          </div>

          <div style="font-size: 12px; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 15px;">
            <p>Este es un mensaje automático del Sistema de Control de Stock</p>
            <p>${new Date().toLocaleString('es-AR')}</p>
          </div>
        </div>
      `,
      text: `ALERTA DE STOCK BAJO\n\nProducto: ${productName}\nCategoría: ${category}\nStock Actual: ${currentStock} unidades\nUmbral: ${threshold} unidades\n\nConsiderá reponer este producto pronto.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Alerta enviada: ${productName} (${category}) - Stock: ${currentStock}/${threshold}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending stock alert email:', error.message);
    return false;
  }
}

/**
 * Test email configuration
 * @returns {Promise<boolean>} Success status
 */
async function testEmailConfiguration() {
  if (!transporter) {
    transporter = initializeMailer();
  }

  if (!transporter) {
    console.error('❌ Email transporter not configured');
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
}

export {
  initializeMailer,
  sendStockAlert,
  testEmailConfiguration,
};
