const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/predict", async (req, res) => {
    try {
        const response = await axios.post(
            "http://127.0.0.1:6000/predict",
            req.body
        );

        res.json(response.data);

    } catch (error) {
        res.status(500).json({
            error: "ML Service not responding"
        });
    }
});

module.exports = router;