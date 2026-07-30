const express = require('express');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const { listCustomers, listSalesController, getSale, create, update, remove } = require('../../controllers/saleController');

const router = express.Router();

router.get('/customers', listCustomers);
router.get('/sales', authenticateToken, listSalesController);
router.get('/sales/:id', authenticateToken, getSale);
router.post('/sales', authenticateToken, authorizeRoles('Administrador', 'Encargado'), create);
router.put('/sales/:id', authenticateToken, authorizeRoles('Administrador', 'Encargado'), update);
router.delete('/sales/:id', authenticateToken, authorizeRoles('Administrador', 'Encargado'), remove);

module.exports = router;
