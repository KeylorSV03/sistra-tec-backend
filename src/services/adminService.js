const adminModel        = require("../models/adminModel");
const { getDonationById } = require("../models/donationModel");
const { hashPassword }  = require("../utils/hashUtil");
const { toInt, toStr, toOrder } = require("../utils/queryUtil");
const { dispatchNotification }  = require("../utils/notificationUtil");
const { sendEmail } = require("../utils/mailerUtil");
const { handleDbError } = require("../errors/dbErrorHandler");

// ─── Transportistas ───────────────────────────────────────────────────────────

const createTransporter = async (adminId, { name, email, password, phone_number }) => {
    try {
        const passwordHash = await hashPassword(password);
        const transporter  = await adminModel.createTransporter(name, email, passwordHash, phone_number ?? null);

        await dispatchNotification(
            transporter.id,
            "CUENTA_CREADA_TRANSPORTISTA",
            { user_name: transporter.name, email: transporter.email }
        );

        if (adminId) {
            await dispatchNotification(
                adminId,
                "CUENTA_CREADA_TRANSPORTISTA_ADMIN",
                { user_name: transporter.name, email: transporter.email }
            );
        }

        sendEmail({
            to: transporter.email,
            subject: "Tu cuenta de transportista en SISTRA-TEC",
            html: transporterAccountEmail(transporter.name, transporter.email, password),
        }).catch(() => {});

        return formatTransporter(transporter);
    } catch (error) {
        throw handleDbError(error);
    }
};

const getTransporters = async (query) => {
    const search = toStr(query.search);
    const limit  = toInt(query.limit,  20);
    const offset = toInt(query.offset,  0);

    try {
        const rows       = await adminModel.getTransporters(search, limit, offset);
        const totalCount = rows[0]?.total_count ?? 0;
        return { transporters: rows.map(formatTransporter), totalCount: Number(totalCount) };
    } catch (error) {
        throw handleDbError(error);
    }
};

const updateTransporterStatus = async (transporterId, isActive) => {
    try {
        const transporter = await adminModel.updateTransporterStatus(transporterId, isActive);
        return formatTransporter(transporter);
    } catch (error) {
        throw handleDbError(error);
    }
};

// ─── Entregas ─────────────────────────────────────────────────────────────────

const createDelivery = async (adminId, { donation_id, transporter_id, collection_address, destination, delivery_type }) => {
    try {
        const donation = await getDonationById(donation_id);
        const delivery = await adminModel.createDelivery(
            donation_id, transporter_id, adminId, collection_address, destination, delivery_type
        );

        dispatchNotification(
            transporter_id,
            "ENTREGA_ASIGNADA",
            { item_name: donation.item_name },
            donation_id
        );

        return formatDelivery(delivery);
    } catch (error) {
        if (error.isOperational) throw error;
        throw handleDbError(error);
    }
};

const getDeliveries = async (query) => {
    const statusId      = toInt(query.status_id,      null);
    const transporterId = toInt(query.transporter_id, null);
    const dateFrom      = toStr(query.date_from);
    const dateTo        = toStr(query.date_to);
    const search        = toStr(query.search);
    const order         = toOrder(query.order);
    const limit         = toInt(query.limit,  20);
    const offset        = toInt(query.offset,  0);

    try {
        const rows       = await adminModel.getDeliveries(statusId, transporterId, dateFrom, dateTo, search, order, limit, offset);
        const totalCount = rows[0]?.total_count ?? 0;
        return { deliveries: rows.map(formatDelivery), totalCount: Number(totalCount) };
    } catch (error) {
        throw handleDbError(error);
    }
};

const getTransporterDeliveries = async (transporterId, query) => {
    const statusId = toInt(query.status_id, null);
    const dateFrom = toStr(query.date_from);
    const dateTo   = toStr(query.date_to);
    const search   = toStr(query.search);
    const order    = toOrder(query.order);
    const limit    = toInt(query.limit,  20);
    const offset   = toInt(query.offset,  0);

    try {
        const rows       = await adminModel.getTransporterDeliveries(transporterId, statusId, dateFrom, dateTo, search, order, limit, offset);
        const totalCount = rows[0]?.total_count ?? 0;
        return { deliveries: rows.map(formatDelivery), totalCount: Number(totalCount) };
    } catch (error) {
        throw handleDbError(error);
    }
};

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatTransporter = (row) => ({
    id:                row.id,
    name:              row.name,
    email:             row.email,
    phoneNumber:       row.phone_number,
    profilePhotoUrl:   row.profile_photo_url,
    isActive:          row.is_active,
    activeAssignments: row.active_assignments !== undefined ? Number(row.active_assignments) : undefined,
});

const formatDelivery = (row) => ({
    deliveryId:         row.delivery_id,
    deliveryType:       row.delivery_type,
    assignedAt:         row.assigned_at,
    shippedAt:          row.shipped_at,
    deliveredAt:        row.delivered_at,
    donationId:         row.donation_id,
    itemName:           row.item_name,
    quantity:           row.quantity,
    unit:               row.unit,
    statusId:           row.status_id,
    statusName:         row.status_name,
    donorName:          row.donor_name,
    donorEmail:         row.donor_email,
    driverId:           row.driver_id,
    driverName:         row.driver_name,
    driverEmail:        row.driver_email,
    collectionAddress:  row.collection_address,
    destination:        row.destination,
});

const transporterAccountEmail = (name, email, password) => `
<!DOCTYPE html>
<html lang="es">
<body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 32px;">
    <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px;">
        <h2 style="color: #1e293b; margin-bottom: 8px;">Cuenta de transportista creada</h2>
        <p style="color: #475569;">Hola <strong>${name}</strong>,</p>
        <p style="color: #475569;">Se creo tu cuenta en SISTRA-TEC.</p>
        <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; color: #1e293b;">
            <p><strong>Correo:</strong> ${email}</p>
            <p><strong>Contrasena temporal:</strong> ${password}</p>
        </div>
        <p style="color: #64748b; font-size: 14px; margin-top: 16px;">
            Inicia sesion y revisa tus asignaciones desde el panel de transportista.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 11px; text-align: center;">SISTRA-TEC - Sistema de Trazabilidad de Donaciones</p>
    </div>
</body>
</html>`;

module.exports = {
    createTransporter,
    getTransporters,
    updateTransporterStatus,
    createDelivery,
    getDeliveries,
    getTransporterDeliveries,
};
