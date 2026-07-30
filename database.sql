CREATE DATABASE tienda_tecnologica_db;

USE tienda_tecnologica_db;

CREATE TABLE rol(
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE usuario(
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    estado ENUM('Activo','Inactivo') DEFAULT 'Activo',
    id_rol INT NOT NULL,
    CONSTRAINT fk_usuario_rol FOREIGN KEY(id_rol) REFERENCES rol(id_rol)
);

CREATE TABLE categoria(
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    descripcion VARCHAR(200)
);

CREATE TABLE producto(
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    marca VARCHAR(80) NOT NULL,
    modelo VARCHAR(80),
    descripcion VARCHAR(250),
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    imagen VARCHAR(255),
    estado ENUM('Disponible','Agotado') DEFAULT 'Disponible',
    id_categoria INT NOT NULL,
    CONSTRAINT fk_producto_categoria FOREIGN KEY(id_categoria) REFERENCES categoria(id_categoria)
);

CREATE TABLE cliente(
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    dni CHAR(8) UNIQUE,
    telefono VARCHAR(20),
    direccion VARCHAR(200)
);

CREATE TABLE proveedor(
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    ruc CHAR(11) UNIQUE,
    razon_social VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(200),
    correo VARCHAR(120)
);

CREATE TABLE compra(
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    id_proveedor INT NOT NULL,
    id_usuario INT NOT NULL,
    CONSTRAINT fk_compra_proveedor FOREIGN KEY(id_proveedor) REFERENCES proveedor(id_proveedor),
    CONSTRAINT fk_compra_usuario FOREIGN KEY(id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE detalle_compra(
    id_detalle_compra INT AUTO_INCREMENT PRIMARY KEY,
    cantidad INT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    id_compra INT NOT NULL,
    id_producto INT NOT NULL,
    CONSTRAINT fk_detalle_compra FOREIGN KEY(id_compra) REFERENCES compra(id_compra),
    CONSTRAINT fk_detalle_producto_compra FOREIGN KEY(id_producto) REFERENCES producto(id_producto)
);

CREATE TABLE venta(
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    id_usuario INT NOT NULL,
    id_cliente INT,
    CONSTRAINT fk_venta_usuario FOREIGN KEY(id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_venta_cliente FOREIGN KEY(id_cliente) REFERENCES cliente(id_cliente)
);

CREATE TABLE detalle_venta(
    id_detalle_venta INT AUTO_INCREMENT PRIMARY KEY,
    cantidad INT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    CONSTRAINT fk_detalle_venta FOREIGN KEY(id_venta) REFERENCES venta(id_venta),
    CONSTRAINT fk_detalle_producto FOREIGN KEY(id_producto) REFERENCES producto(id_producto)
);

INSERT INTO rol(nombre) VALUES ('Administrador'), ('Encargado');

INSERT INTO categoria(nombre, descripcion) VALUES
('Celulares', 'Telefonía móvil'),
('Cargadores', 'Cargadores para dispositivos'),
('Auriculares', 'Auriculares con cable y bluetooth'),
('Cámaras Digitales', 'Cámaras fotográficas'),
('Accesorios', 'Accesorios tecnológicos'),
('Smartwatch', 'Relojes inteligentes'),
('Parlantes', 'Parlantes bluetooth'),
('Memorias USB', 'Dispositivos de almacenamiento');

INSERT INTO usuario (nombres, apellidos, correo, password, telefono, id_rol)
VALUES ('Administrador', 'Principal', 'admin@ventas.com', '123456', '999999999', 1);

INSERT INTO cliente (nombres, apellidos, dni, telefono, direccion)
VALUES ('Carlos', 'Pérez', '12345678', '912345678', 'Lima');
