const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const productsRoutes = require('../modules/products/products.routes');
const salesRoutes = require('../modules/sales/sales.routes');

const router = express.Router();

router.use('/', authRoutes);
router.use('/', productsRoutes);
router.use('/', salesRoutes);

module.exports = router;
