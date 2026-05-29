const toInt = (val, fallback = null) => {
    const n = parseInt(val, 10);
    return isNaN(n) ? fallback : n;
};

const toStr = (val, fallback = null) => {
    if (val === undefined || val === null || val === "") return fallback;
    return String(val);
};

const toOrder = (val) =>
    val === "ASC" || val === "DESC" ? val : "DESC";

module.exports = { toInt, toStr, toOrder };
