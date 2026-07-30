const { getCustomers, listSales, getSaleById, createSale, updateSale, deleteSale } = require('../config/db');

async function listCustomers(req, res, next) {
  try {
    const customers = await getCustomers();
    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
}

async function listSalesController(req, res, next) {
  try {
    const sales = await listSales();
    res.json({ success: true, data: sales });
  } catch (error) {
    next(error);
  }
}

async function getSale(req, res, next) {
  try {
    const sale = await getSaleById(req.params.id);

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Venta no encontrada' });
    }

    res.json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const { idUsuario, idCliente, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Debe enviar al menos un item' });
    }

    const sale = await createSale({ idUsuario, idCliente, items }, req.user.idUsuario);
    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const { idCliente, items } = req.body;
    const sale = await updateSale(req.params.id, { idCliente, items }, req.user.idUsuario);
    res.json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await deleteSale(req.params.id);
    res.json({ success: true, message: 'Venta eliminada' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listCustomers, listSalesController, getSale, create, update, remove };
