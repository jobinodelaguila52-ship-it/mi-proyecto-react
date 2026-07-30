const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'secret-clave-tiempo';

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token requerido' });
  }

  jwt.verify(token, SECRET_KEY, (err, payload) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token inválido o expirado' });
    }

    req.user = payload;
    next();
  });
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ success: false, message: 'No tiene permisos para esta acción' });
    }

    next();
  };
}

module.exports = { authenticateToken, authorizeRoles, SECRET_KEY };
