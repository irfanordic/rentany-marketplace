const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Admin Panel is working');
});

// THIS IS THE LINE YOU ARE LIKELY MISSING
module.exports = router;