const jwt = require('jsonwebtoken');
const { getUserByCredentials } = require('../config/db');
const { SECRET_KEY } = require('../middleware/auth');

async function login(req, res, next) {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ success: false, message: 'Correo y contraseña son obligatorios' });
    }

    const user = await getUserByCredentials(correo, password);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ idUsuario: user.idUsuario, correo: user.correo, rol: user.rol }, SECRET_KEY, { expiresIn: '8h' });

    res.json({
      success: true,
      token,
      user: { idUsuario: user.idUsuario, correo: user.correo, rol: user.rol }
    });
  } catch (error) {
    next(error);
  }
}

function profile(req, res) {
  res.json({ success: true, user: req.user });
}

module.exports = { login, profile };
