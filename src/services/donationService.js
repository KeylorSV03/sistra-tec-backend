const donationModel = require("../models/donationModel");
const { getAdmins } = require("../models/sharedModel");
const { uploadImage } = require("../utils/cloudinaryUtil");
const { dispatchNotification, dispatchNotificationToMany } = require("../utils/notificationUtil");
const { handleDbError } = require("../errors/dbErrorHandler");
const { toInt, toStr, toOrder } = require("../utils/queryUtil");
const AppError = require("../errors/AppError");

// Mapa estado → event type para notificaciones
const STATUS_EVENT_MAP = {
    Recibido:      "ESTADO_RECIBIDO",
    Clasificado:   "ESTADO_CLASIFICADO",
    "En Tránsito": "ESTADO_EN_TRANSITO",
    Entregado:     "ESTADO_ENTREGADO",
};

const createDonation = async (userId, body, file) => {
    if (!file) throw new AppError("La imagen del bien es obligatoria.", 400);

    try {
        const { item_name, description, quantity, unit } = body;

        const { url: imageUrl } = await uploadImage(file.buffer, "sistratec/donations");

        const donation = await donationModel.createDonation(
            userId, item_name, description ?? null, quantity, unit, imageUrl
        );

        // Notificacion al donante
        dispatchNotification(
            donation.giving_id,
            "DONACION_CREADA",
            { item_name: donation.item_name, quantity: donation.quantity, unit: donation.unit },
            donation.id
        );

        // Notificacion a todos los admins
        const admins = await getAdmins();
        dispatchNotificationToMany(
            admins.map((a) => a.id),
            "DONACION_NUEVA_ADMIN",
            { donor_name: donation.donor_name, item_name: donation.item_name, quantity: donation.quantity, unit: donation.unit },
            donation.id
        );

        return formatDonation(donation);
    } catch (error) {
        if (error.isOperational) throw error;
        throw handleDbError(error);
    }
};

const getDonations = async (userId, query) => {
    const statusId = toInt(query.status_id, null);
    const dateFrom = toStr(query.date_from);
    const dateTo   = toStr(query.date_to);
    const search   = toStr(query.search);
    const order    = toOrder(query.order);
    const limit    = toInt(query.limit,  20);
    const offset   = toInt(query.offset,  0);

    try {
        const rows = await donationModel.getDonations(
            userId, statusId, dateFrom, dateTo, search, order, limit, offset
        );

        const totalCount = rows[0]?.total_count ?? 0;
        return { donations: rows.map(formatDonation), totalCount: Number(totalCount) };
    } catch (error) {
        throw handleDbError(error);
    }
};

const getDonationById = async (donationId) => {
    try {
        const donation = await donationModel.getDonationById(donationId);
        return formatDonationDetail(donation);
    } catch (error) {
        throw handleDbError(error);
    }
};

const updateDonationStatus = async (donationId, statusId, rolName) => {
    if (rolName === "Donante") {
        throw new AppError("No tenés permiso para cambiar el estado de una donación.", 403);
    }

    try {
        const updated = await donationModel.updateDonationStatus(donationId, statusId, rolName);

        const eventType = STATUS_EVENT_MAP[updated.status_name];
        if (eventType) {
            dispatchNotification(
                updated.giving_id,
                eventType,
                { item_name: updated.item_name },
                donationId
            );
        }

        return formatDonation(updated);
    } catch (error) {
        if (error.isOperational) throw error;
        throw handleDbError(error);
    }
};

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatDonation = (row) => ({
    id:          row.id,
    givingId:    row.giving_id,
    donorName:   row.donor_name,
    donorEmail:  row.donor_email ?? undefined,
    statusId:    row.status_id,
    statusName:  row.status_name,
    date:        row.date,
    itemName:    row.item_name,
    description: row.description,
    quantity:    row.quantity,
    unit:        row.unit,
    imageUrl:    row.image_url,
});

const formatDonationDetail = (row) => ({
    ...formatDonation(row),
    statusDesc:  row.status_desc,
    donorPhone:  row.donor_phone,
});

module.exports = { createDonation, getDonations, getDonationById, updateDonationStatus };
