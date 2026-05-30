const transporterModel = require("../models/transporterModel");
const { dispatchNotification } = require("../utils/notificationUtil");
const { handleDbError } = require("../errors/dbErrorHandler");
const { toInt, toStr, toOrder } = require("../utils/queryUtil");
const AppError = require("../errors/AppError");

const getTransporterDeliveries = async (transporterId, query) => {
	const statusId = toInt(query.status_id, null);
	const dateFrom = toStr(query.date_from);
	const dateTo = toStr(query.date_to);
	const search = toStr(query.search);
	const order = toOrder(query.order);
	const limit = toInt(query.limit, 20);
	const offset = toInt(query.offset, 0);

	try {
		const rows = await transporterModel.getTransporterDeliveries(
			transporterId,
			statusId,
			dateFrom,
			dateTo,
			search,
			order,
			limit,
			offset
		);

		const totalCount = rows[0]?.total_count ?? 0;
		return { deliveries: rows.map(formatDelivery), totalCount: Number(totalCount) };
	} catch (error) {
		throw handleDbError(error);
	}
};

const getTransporterDeliveryDetail = async (donationId) => {
	try {
		const delivery = await transporterModel.getTransporterDeliveryDetail(donationId);
		if (!delivery) {
			throw new AppError("Entrega no encontrada.", 404);
		}
		return formatDeliveryDetail(delivery);
	} catch (error) {
		if (error.isOperational) throw error;
		throw handleDbError(error);
	}
};

const confirmPickup = async (donationId, transporterId) => {
	try {
		const delivery = await transporterModel.getTransporterDeliveryDetail(donationId);
		if (!delivery) {
			throw new AppError("Entrega no encontrada.", 404);
		}

		if (delivery.driver_id !== transporterId) {
			throw new AppError("No tenés permiso para confirmar esta entrega.", 403);
		}

		const updated = await transporterModel.updateDonationStatus(donationId, 3, "Transportista");

		dispatchNotification(
			transporterId,
			"ENTREGA_RECOGIDA",
			{ item_name: updated.item_name },
			donationId
		);

		return formatDelivery(updated);
	} catch (error) {
		if (error.isOperational) throw error;
		throw handleDbError(error);
	}
};

const confirmDelivery = async (donationId, transporterId) => {
	try {
		const delivery = await transporterModel.getTransporterDeliveryDetail(donationId);
		if (!delivery) {
			throw new AppError("Entrega no encontrada.", 404);
		}

		if (delivery.driver_id !== transporterId) {
			throw new AppError("No tenés permiso para confirmar esta entrega.", 403);
		}

		const updated = await transporterModel.updateDonationStatus(donationId, 5, "Transportista");

		return formatDelivery(updated);
	} catch (error) {
		if (error.isOperational) throw error;
		throw handleDbError(error);
	}
};

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatDelivery = (row) => ({
	deliveryId: row.delivery_id,
	deliveryType: row.delivery_type,
	assignedAt: row.assigned_at,
	shippedAt: row.shipped_at,
	deliveredAt: row.delivered_at,
	donationId: row.donation_id,
	itemName: row.item_name,
	quantity: row.quantity,
	unit: row.unit,
	statusId: row.status_id,
	statusName: row.status_name,
	donorName: row.donor_name,
	donorEmail: row.donor_email,
	collectionAddress: row.collection_address,
	destination: row.destination,
});

const formatDeliveryDetail = (row) => ({
	...formatDelivery(row),
	donorPhone: row.donor_phone,
});

module.exports = {
	getTransporterDeliveries,
	getTransporterDeliveryDetail,
	confirmPickup,
	confirmDelivery,
};
