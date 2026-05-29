const html = (name) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;padding:36px;text-align:center;">
              <img src="${process.env.LOGO_BLANCO_URL}" width="72" height="72"
                style="display:block;margin:0 auto 16px;" alt="SISTRA-TEC">
              <h1 style="color:#ffffff;font-size:22px;margin:0 0 6px;letter-spacing:1px;">SISTRA-TEC</h1>
              <p style="color:#94a3b8;font-size:12px;margin:0;letter-spacing:2px;text-transform:uppercase;">
                Sistema de Trazabilidad de Donaciones
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="color:#0f172a;font-size:22px;margin:0 0 12px;">
                ¡Bienvenido, ${name}! 👋
              </h2>
              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">
                Tu cuenta de donante en <strong>SISTRA-TEC</strong> fue creada exitosamente.
                Ya podés registrar tus donaciones y seguir su trayectoria en tiempo real,
                desde que se reciben hasta que llegan al beneficiario.
              </p>

              <!-- Cards -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#f8fafc;border-radius:8px;padding:20px;border-left:4px solid #6366f1;">
                    <p style="color:#0f172a;font-weight:bold;font-size:14px;margin:0 0 14px;">
                      ¿Qué podés hacer?
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:5px 0;color:#475569;font-size:14px;">
                          ✅ &nbsp;Registrar donaciones de bienes
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;color:#475569;font-size:14px;">
                          📦 &nbsp;Ver el estado en tiempo real
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;color:#475569;font-size:14px;">
                          🔔 &nbsp;Recibir notificaciones de cada cambio
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;color:#475569;font-size:14px;">
                          🚚 &nbsp;Saber quién entrega tu donación y cuándo
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <div style="text-align:center;">
                <a href="${process.env.FRONTEND_URL}"
                  style="display:inline-block;background-color:#6366f1;color:#ffffff;
                         text-decoration:none;font-size:15px;font-weight:bold;
                         padding:14px 40px;border-radius:8px;letter-spacing:0.5px;">
                  Ir a SISTRA-TEC
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 40px;
                       border-top:1px solid #e2e8f0;text-align:center;">
              <p style="color:#94a3b8;font-size:12px;margin:0 0 6px;">
                Este correo fue generado automáticamente.
                Si no creaste esta cuenta, ignorá este mensaje.
              </p>
              <p style="color:#cbd5e1;font-size:11px;margin:0;">
                SISTRA-TEC &mdash; Sistema de Trazabilidad de Donaciones &copy; 2025
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

module.exports = { html };
