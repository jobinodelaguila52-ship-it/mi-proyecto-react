const express = require('express');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const { listCategories, listProducts, getProduct, create, update, remove } = require('../../controllers/productController');

const router = express.Router();

router.get('/categories', listCategories);
router.get('/products', listProducts);
router.get('/products/:id', getProduct);
router.post('/products', authenticateToken, authorizeRoles('Administrador', 'Encargado'), create);
router.put('/products/:id', authenticateToken, authorizeRoles('Administrador', 'Encargado'), update);
router.delete('/products/:id', authenticateToken, authorizeRoles('Administrador'), remove);

module.exports = router;
