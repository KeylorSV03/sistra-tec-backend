const { obtenerPool } = require("../config/dbConfig");

/**
 * Despacha una notificacion a un usuario.
 * Falla silenciosamente para no interrumpir el flujo principal.
 *
 * @param {number}  userId      - ID del usuario destinatario
 * @param {string}  eventType   - Nombre del event_type (ej: 'BIENVENIDA')
 * @param {object}  placeholders - Pares { clave: valor } para reemplazar en el template
 * @param {number|null} donationId - ID de la donacion relacionada (opcional)
 */
const dispatchNotification = async (userId, eventType, placeholders = {}, donationId = null) => {
    try {
        const pool = obtenerPool();

        const tplResult = await pool.query(
            "SELECT * FROM get_notification_template($1)",
            [eventType]
        );

        if (!tplResult.rows[0]) return;

        const tpl = tplResult.rows[0];
        let title = tpl.title;
        let body = tpl.body;

        Object.entries(placeholders).forEach(([key, value]) => {
            const regex = new RegExp(`\\{${key}\\}`, "g");
            title = title.replace(regex, value ?? "");
            body = body.replace(regex, value ?? "");
        });

        await pool.query(
            "SELECT * FROM create_notification($1, $2, $3, $4, $5)",
            [userId, eventType, title, body, donationId]
        );
    } catch {
        // Las notificaciones no deben interrumpir el flujo principal
    }
};

/**
 * Despacha una notificacion a multiples usuarios en paralelo.
 */
const dispatchNotificationToMany = async (userIds, eventType, placeholders = {}, donationId = null) => {
    await Promise.all(
        userIds.map((id) => dispatchNotification(id, eventType, placeholders, donationId))
    );
};

module.exports = { dispatchNotification, dispatchNotificationToMany };
