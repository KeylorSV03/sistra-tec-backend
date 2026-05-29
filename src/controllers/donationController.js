const donationService = require("../services/donationService");

const createDonation = async (req, res, next) => {
    try {
        const donation = await donationService.createDonation(
            req.user.userId, req.body, req.file ?? null
        );
        return res.status(201).json({
            status: "ok",
            message: "Donación registrada correctamente.",
            donation,
        });
    } catch (error) {
        next(error);
    }
};

const getDonations = async (req, res, next) => {
    try {
        const { donations, totalCount } = await donationService.getDonations(
            req.user.userId, req.query
        );
        return res.status(200).json({ status: "ok", donations, totalCount });
    } catch (error) {
        next(error);
    }
};

const getDonationById = async (req, res, next) => {
    try {
        const donation = await donationService.getDonationById(Number(req.params.id));
        return res.status(200).json({ status: "ok", donation });
    } catch (error) {
        next(error);
    }
};

const updateDonationStatus = async (req, res, next) => {
    try {
        const donation = await donationService.updateDonationStatus(
            Number(req.params.id), req.body.status_id, req.user.rolName
        );
        return res.status(200).json({
            status: "ok",
            message: "Estado actualizado correctamente.",
            donation,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createDonation, getDonations, getDonationById, updateDonationStatus };
