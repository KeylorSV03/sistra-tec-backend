const { obtenerPool } = require("../config/dbConfig");

const FALLBACK_TEMPLATES = {
    BIENVENIDA: {
        title: "Bienvenido a SISTRA-TEC",
        body: "Hola {user_name}, tu cuenta fue creada correctamente.",
    },
    CUENTA_CREADA_TRANSPORTISTA: {
        title: "Cuenta de transportista creada",
        body: "Hola {user_name}, ya tenes una cuenta de transportista en SISTRA-TEC con el correo {email}.",
    },
    CUENTA_CREADA_TRANSPORTISTA_ADMIN: {
        title: "Transportista creado",
        body: "Se creo la cuenta de transportista para {user_name} ({email}).",
    },
    DONACION_CREADA: {
        title: "Donacion registrada",
        body: "Tu donacion de {item_name} fue registrada correctamente.",
    },
    DONACION_NUEVA_ADMIN: {
        title: "Nueva donacion registrada",
        body: "{donor_name} registro {quantity} {unit} de {item_name}.",
    },
    ENTREGA_ASIGNADA: {
        title: "Nueva asignacion de entrega",
        body: "Se te asigno la entrega de {item_name}.",
    },
    ENTREGA_RECOGIDA: {
        title: "Recogida confirmada",
        body: "Se confirmo la recogida de {item_name}.",
    },
    ESTADO_RECIBIDO: {
        title: "Donacion recibida",
        body: "Tu donacion de {item_name} fue marcada como recibida.",
    },
    ESTADO_CLASIFICADO: {
        title: "Donacion clasificada",
        body: "Tu donacion de {item_name} fue clasificada.",
    },
    ESTADO_EN_TRANSITO: {
        title: "Donacion en transito",
        body: "Tu donacion de {item_name} esta en transito.",
    },
    ESTADO_ENTREGADO: {
        title: "Donacion entregada",
        body: "Tu donacion de {item_name} fue entregada.",
    },
};

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

        const tpl = tplResult.rows[0] ?? FALLBACK_TEMPLATES[eventType] ?? {
            title: "Notificacion SISTRA-TEC",
            body: "Hay una actualizacion en el sistema.",
        };

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
        return true;
    } catch {
        // Las notificaciones no deben interrumpir el flujo principal
        return false;
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
