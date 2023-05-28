const express = require('express');
const router = express.Router();
const notFound = require('../../controllers/not-found/not-found.controller');

router.use(notFound);

module.exports = router;
