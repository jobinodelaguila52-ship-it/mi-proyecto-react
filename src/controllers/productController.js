const { getCategories, getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../config/db');

async function listCategories(req, res, next) {
  try {
    const categories = await getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

async function listProducts(req, res, next) {
  try {
    const products = await getProducts();
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const { nombre, marca, modelo, descripcion, precio, stock, categoria, imagen } = req.body;

    if (!nombre || !marca || !precio || !categoria) {
      return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
    }

    const product = await createProduct({ nombre, marca, modelo, descripcion, precio, stock, categoria, imagen });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const product = await updateProduct(req.params.id, req.body);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await deleteProduct(req.params.id);
    res.json({ success: true, message: 'Producto eliminado' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listCategories, listProducts, getProduct, create, update, remove };
