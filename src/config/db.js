const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tienda_tecnologica_db',
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const memoryStore = {
  users: [
    { idUsuario: 1, correo: 'admin@ventas.com', password: '123456', rol: 'Administrador' }
  ],
  products: [
    {
      idProducto: 1,
      nombre: 'Smartphone X',
      marca: 'TechNova',
      modelo: 'SN-100',
      descripcion: 'Smartphone de gama media',
      precio: 799.99,
      stock: 15,
      imagen: 'https://example.com/product.png',
      categoria: 'Celulares',
      estado: 'Disponible'
    }
  ],
  categories: [
    'Celulares', 'Cargadores', 'Auriculares', 'Cámaras Digitales', 'Accesorios', 'Smartwatch', 'Parlantes', 'Memorias USB'
  ],
  customers: [
    { idCliente: 1, nombres: 'Carlos', apellidos: 'Pérez', dni: '12345678', telefono: '912345678', direccion: 'Lima' }
  ],
  sales: []
};

let pool = null;
let connected = false;

async function connectDatabase() {
  if (connected && pool) {
    return true;
  }

  try {
    pool = mysql.createPool(dbConfig);
    await pool.query('SELECT 1');
    connected = true;
    console.log('MySQL conectado.');
    return true;
  } catch (error) {
    connected = false;
    console.warn('MySQL no disponible. Se usará almacenamiento en memoria.');
    return false;
  }
}

async function ensureConnection() {
  return await connectDatabase();
}

function mapProductRow(row) {
  return {
    idProducto: row.idProducto ?? row.id_producto,
    nombre: row.nombre,
    marca: row.marca,
    modelo: row.modelo,
    descripcion: row.descripcion,
    precio: Number(row.precio),
    stock: Number(row.stock),
    imagen: row.imagen,
    categoria: row.categoria ?? row.nombre_categoria,
    estado: row.estado
  };
}

async function getCategories() {
  await ensureConnection();
  if (connected && pool) {
    const [rows] = await pool.query('SELECT nombre FROM categoria ORDER BY nombre');
    return rows.map((row) => row.nombre);
  }
  return memoryStore.categories;
}

async function getProducts() {
  await ensureConnection();
  if (connected && pool) {
    const [rows] = await pool.query(`
      SELECT p.id_producto AS idProducto, p.nombre, p.marca, p.modelo, p.descripcion,
             p.precio, p.stock, p.imagen, c.nombre AS categoria, p.estado
      FROM producto p
      INNER JOIN categoria c ON c.id_categoria = p.id_categoria
      ORDER BY p.id_producto ASC
    `);
    return rows.map(mapProductRow);
  }

  return memoryStore.products;
}

async function getProductById(id) {
  await ensureConnection();
  if (connected && pool) {
    const [rows] = await pool.query(`
      SELECT p.id_producto AS idProducto, p.nombre, p.marca, p.modelo, p.descripcion,
             p.precio, p.stock, p.imagen, c.nombre AS categoria, p.estado
      FROM producto p
      INNER JOIN categoria c ON c.id_categoria = p.id_categoria
      WHERE p.id_producto = ?
    `, [id]);
    return rows[0] ? mapProductRow(rows[0]) : null;
  }

  return memoryStore.products.find((item) => item.idProducto === Number(id)) || null;
}

async function createProduct(payload) {
  await ensureConnection();
  if (connected && pool) {
    const [categoryRows] = await pool.query('SELECT id_categoria FROM categoria WHERE nombre = ?', [payload.categoria]);
    if (!categoryRows.length) {
      throw new Error('La categoría indicada no existe');
    }

    const [result] = await pool.query(
      `INSERT INTO producto (nombre, marca, modelo, descripcion, precio, stock, imagen, estado, id_categoria)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.nombre,
        payload.marca,
        payload.modelo || '',
        payload.descripcion || '',
        Number(payload.precio),
        Number(payload.stock || 0),
        payload.imagen || '',
        Number(payload.stock || 0) > 0 ? 'Disponible' : 'Agotado',
        categoryRows[0].id_categoria
      ]
    );

    const [rows] = await pool.query(`
      SELECT p.id_producto AS idProducto, p.nombre, p.marca, p.modelo, p.descripcion,
             p.precio, p.stock, p.imagen, c.nombre AS categoria, p.estado
      FROM producto p
      INNER JOIN categoria c ON c.id_categoria = p.id_categoria
      WHERE p.id_producto = ?
    `, [result.insertId]);

    return mapProductRow(rows[0]);
  }

  const nextId = memoryStore.products.length ? memoryStore.products[memoryStore.products.length - 1].idProducto + 1 : 1;
  const product = {
    idProducto: nextId,
    nombre: payload.nombre,
    marca: payload.marca,
    modelo: payload.modelo || '',
    descripcion: payload.descripcion || '',
    precio: Number(payload.precio),
    stock: Number(payload.stock || 0),
    imagen: payload.imagen || 'https://example.com/default.png',
    categoria: payload.categoria,
    estado: Number(payload.stock || 0) > 0 ? 'Disponible' : 'Agotado'
  };

  memoryStore.products.push(product);
  return product;
}

async function updateProduct(id, payload) {
  await ensureConnection();
  const product = await getProductById(id);
  if (!product) {
    throw new Error('Producto no encontrado');
  }

  if (connected && pool) {
    const [categoryRows] = await pool.query('SELECT id_categoria FROM categoria WHERE nombre = ?', [payload.categoria || product.categoria]);
    const [result] = await pool.query(
      `UPDATE producto
       SET nombre = ?, marca = ?, modelo = ?, descripcion = ?, precio = ?, stock = ?, estado = ?, id_categoria = ?
       WHERE id_producto = ?`,
      [
        payload.nombre || product.nombre,
        payload.marca || product.marca,
        payload.modelo ?? product.modelo,
        payload.descripcion ?? product.descripcion,
        Number(payload.precio ?? product.precio),
        Number(payload.stock ?? product.stock),
        Number(payload.stock ?? product.stock) > 0 ? 'Disponible' : 'Agotado',
        categoryRows[0].id_categoria,
        id
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error('No se pudo actualizar el producto');
    }

    return await getProductById(id);
  }

  Object.assign(product, {
    nombre: payload.nombre || product.nombre,
    marca: payload.marca || product.marca,
    modelo: payload.modelo ?? product.modelo,
    descripcion: payload.descripcion ?? product.descripcion,
    precio: Number(payload.precio ?? product.precio),
    stock: Number(payload.stock ?? product.stock),
    categoria: payload.categoria || product.categoria,
    estado: Number(payload.stock ?? product.stock) > 0 ? 'Disponible' : 'Agotado'
  });

  return product;
}

async function deleteProduct(id) {
  await ensureConnection();
  if (connected && pool) {
    const [result] = await pool.query('DELETE FROM producto WHERE id_producto = ?', [id]);
    if (result.affectedRows === 0) {
      throw new Error('Producto no encontrado');
    }
    return true;
  }

  const index = memoryStore.products.findIndex((item) => item.idProducto === Number(id));
  if (index === -1) {
    throw new Error('Producto no encontrado');
  }

  memoryStore.products.splice(index, 1);
  return true;
}

async function getCustomers() {
  await ensureConnection();
  if (connected && pool) {
    const [rows] = await pool.query('SELECT * FROM cliente');
    return rows;
  }

  return memoryStore.customers;
}

async function getSaleById(id) {
  await ensureConnection();
  if (connected && pool) {
    const [rows] = await pool.query(`
      SELECT v.id_venta AS idVenta, v.fecha, v.total, v.id_usuario AS idUsuario, v.id_cliente AS idCliente
      FROM venta v
      WHERE v.id_venta = ?
    `, [id]);

    if (!rows.length) return null;
    const sale = rows[0];

    const [details] = await pool.query(`
      SELECT dv.id_producto AS idProducto, dv.cantidad, dv.precio, dv.subtotal
      FROM detalle_venta dv
      WHERE dv.id_venta = ?
    `, [id]);

    sale.items = details.map((item) => ({
      idProducto: item.idProducto,
      cantidad: Number(item.cantidad),
      precio: Number(item.precio),
      subtotal: Number(item.subtotal)
    }));

    return sale;
  }

  return memoryStore.sales.find((sale) => sale.idVenta === Number(id)) || null;
}

async function updateSale(id, payload, requestUserId) {
  await ensureConnection();
  const existingSale = await getSaleById(id);
  if (!existingSale) {
    throw new Error('Venta no encontrada');
  }

  if (connected && pool) {
    if (payload.idCliente !== undefined) {
      const [clientRows] = await pool.query('SELECT id_cliente FROM cliente WHERE id_cliente = ?', [payload.idCliente]);
      if (!clientRows.length) {
        throw new Error('Cliente no encontrado');
      }
    }

    const saleItems = [];
    let total = 0;

    if (payload.items && Array.isArray(payload.items)) {
      const currentItemsRows = await pool.query('SELECT id_producto, cantidad FROM detalle_venta WHERE id_venta = ?', [id]);
      const currentItems = currentItemsRows[0];

      for (const item of currentItems) {
        await pool.query('UPDATE producto SET stock = stock + ? WHERE id_producto = ?', [item.cantidad, item.id_producto]);
      }

      for (const item of payload.items) {
        const product = await getProductById(item.idProducto);
        if (!product) {
          throw new Error(`Producto ${item.idProducto} no encontrado`);
        }
        if (product.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para ${product.nombre}`);
        }

        const subtotal = Number(product.precio) * Number(item.cantidad);
        total += subtotal;
        saleItems.push({ idProducto: product.idProducto, cantidad: Number(item.cantidad), precio: Number(product.precio), subtotal });
      }

      await pool.query('DELETE FROM detalle_venta WHERE id_venta = ?', [id]);
      for (const item of saleItems) {
        await pool.query('INSERT INTO detalle_venta (cantidad, precio, subtotal, id_venta, id_producto) VALUES (?, ?, ?, ?, ?)', [item.cantidad, item.precio, item.subtotal, id, item.idProducto]);
        await pool.query('UPDATE producto SET stock = stock - ? WHERE id_producto = ?', [item.cantidad, item.idProducto]);
      }
    }

    const updatedTotal = payload.items && Array.isArray(payload.items) ? total : existingSale.total;
    await pool.query('UPDATE venta SET total = ?, id_cliente = ?, id_usuario = ? WHERE id_venta = ?', [updatedTotal, payload.idCliente || existingSale.idCliente, Number(payload.idUsuario || requestUserId), id]);
    return await getSaleById(id);
  }

  const sale = memoryStore.sales.find((item) => item.idVenta === Number(id));
  if (!sale) {
    throw new Error('Venta no encontrada');
  }

  if (payload.idCliente !== undefined) {
    const customer = memoryStore.customers.find((item) => item.idCliente === Number(payload.idCliente));
    if (!customer) {
      throw new Error('Cliente no encontrado');
    }
    sale.idCliente = Number(payload.idCliente);
  }

  if (payload.items && Array.isArray(payload.items)) {
    for (const currentItem of sale.items) {
      const product = memoryStore.products.find((p) => p.idProducto === currentItem.idProducto);
      if (product) {
        product.stock += Number(currentItem.cantidad);
      }
    }

    const updatedItems = [];
    let updatedTotal = 0;
    for (const item of payload.items) {
      const product = memoryStore.products.find((p) => p.idProducto === Number(item.idProducto));
      if (!product) {
        throw new Error(`Producto ${item.idProducto} no encontrado`);
      }
      if (product.stock < Number(item.cantidad)) {
        throw new Error(`Stock insuficiente para ${product.nombre}`);
      }
      product.stock -= Number(item.cantidad);
      const subtotal = Number(product.precio) * Number(item.cantidad);
      updatedTotal += subtotal;
      updatedItems.push({ idProducto: Number(item.idProducto), cantidad: Number(item.cantidad), precio: Number(product.precio), subtotal });
    }

    sale.items = updatedItems;
    sale.total = updatedTotal;
  }

  sale.idUsuario = Number(payload.idUsuario || requestUserId);
  return sale;
}

async function deleteSale(id) {
  await ensureConnection();
  const sale = await getSaleById(id);
  if (!sale) {
    throw new Error('Venta no encontrada');
  }

  if (connected && pool) {
    const [details] = await pool.query('SELECT id_producto, cantidad FROM detalle_venta WHERE id_venta = ?', [id]);
    for (const item of details) {
      await pool.query('UPDATE producto SET stock = stock + ? WHERE id_producto = ?', [item.cantidad, item.id_producto]);
    }

    await pool.query('DELETE FROM detalle_venta WHERE id_venta = ?', [id]);
    await pool.query('DELETE FROM venta WHERE id_venta = ?', [id]);
    return true;
  }

  for (const item of sale.items) {
    const product = memoryStore.products.find((p) => p.idProducto === Number(item.idProducto));
    if (product) {
      product.stock += Number(item.cantidad);
    }
  }

  const index = memoryStore.sales.findIndex((item) => item.idVenta === Number(id));
  if (index === -1) {
    throw new Error('Venta no encontrada');
  }

  memoryStore.sales.splice(index, 1);
  return true;
}

async function getUserByCredentials(correo, password) {
  await ensureConnection();
  if (connected && pool) {
    const [rows] = await pool.query(
      `SELECT u.id_usuario AS idUsuario, u.correo, u.password, r.nombre AS rol
       FROM usuario u
       INNER JOIN rol r ON r.id_rol = u.id_rol
       WHERE u.correo = ? AND u.password = ?`,
      [correo, password]
    );

    if (!rows.length) {
      return null;
    }

    return {
      idUsuario: rows[0].idUsuario,
      correo: rows[0].correo,
      password: rows[0].password,
      rol: rows[0].rol
    };
  }

  return memoryStore.users.find((user) => user.correo === correo && user.password === password) || null;
}

async function listSales() {
  await ensureConnection();
  if (connected && pool) {
    const [rows] = await pool.query(`
      SELECT v.id_venta AS idVenta, v.fecha, v.total, v.id_usuario AS idUsuario, v.id_cliente AS idCliente
      FROM venta v
      ORDER BY v.id_venta DESC
    `);
    return rows;
  }

  return memoryStore.sales;
}

async function createSale(payload, requestUserId) {
  await ensureConnection();
  const clientId = payload.idCliente !== undefined && payload.idCliente !== null && payload.idCliente !== ''
    ? Number(payload.idCliente)
    : null;

  const customerId = clientId !== null ? clientId : null;

  if (connected && pool) {
    const saleItems = [];
    let total = 0;

    if (customerId !== null) {
      const [customerRows] = await pool.query('SELECT id_cliente FROM cliente WHERE id_cliente = ?', [customerId]);
      if (!customerRows.length) {
        throw new Error('Cliente no encontrado');
      }
    }

    for (const item of payload.items) {
      const product = await getProductById(item.idProducto);
      if (!product) {
        throw new Error(`Producto ${item.idProducto} no encontrado`);
      }

      const cantidad = Number(item.cantidad);
      if (product.stock < cantidad) {
        throw new Error(`Stock insuficiente para ${product.nombre}`);
      }

      const subtotal = Number(product.precio) * cantidad;
      total += subtotal;
      saleItems.push({
        idProducto: product.idProducto,
        cantidad,
        precio: Number(product.precio),
        subtotal
      });
    }

    const [saleResult] = await pool.query(
      'INSERT INTO venta (fecha, total, id_usuario, id_cliente) VALUES (NOW(), ?, ?, ?)',
      [Number(total), Number(payload.idUsuario || requestUserId), customerId]
    );

    const saleId = saleResult.insertId;
    for (const item of saleItems) {
      await pool.query(
        'INSERT INTO detalle_venta (cantidad, precio, subtotal, id_venta, id_producto) VALUES (?, ?, ?, ?, ?)',
        [item.cantidad, item.precio, item.subtotal, saleId, item.idProducto]
      );
      await pool.query('UPDATE producto SET stock = stock - ? WHERE id_producto = ?', [item.cantidad, item.idProducto]);
    }

    return {
      idVenta: saleId,
      fecha: new Date().toISOString(),
      total,
      idUsuario: Number(payload.idUsuario || requestUserId),
      idCliente: customerId,
      items: saleItems
    };
  }

  if (customerId !== null) {
    const customer = memoryStore.customers.find((item) => item.idCliente === customerId);
    if (!customer) {
      throw new Error('Cliente no encontrado');
    }
  }

  const saleItems = [];
  let total = 0;

  for (const item of payload.items) {
    const product = memoryStore.products.find((p) => p.idProducto === Number(item.idProducto));
    if (!product) {
      throw new Error(`Producto ${item.idProducto} no encontrado`);
    }
    if (product.stock < item.cantidad) {
      throw new Error(`Stock insuficiente para ${product.nombre}`);
    }

    const subtotal = Number(product.precio) * Number(item.cantidad);
    total += subtotal;
    product.stock -= Number(item.cantidad);
    saleItems.push({
      idProducto: product.idProducto,
      cantidad: Number(item.cantidad),
      precio: Number(product.precio),
      subtotal
    });
  }

  const sale = {
    idVenta: memoryStore.sales.length ? memoryStore.sales[memoryStore.sales.length - 1].idVenta + 1 : 1,
    fecha: new Date().toISOString(),
    total,
    idUsuario: Number(payload.idUsuario || requestUserId),
    idCliente: customerId,
    items: saleItems
  };

  memoryStore.sales.push(sale);
  return sale;
}

module.exports = {
  connectDatabase,
  getCategories,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCustomers,
  getUserByCredentials,
  listSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale
};
