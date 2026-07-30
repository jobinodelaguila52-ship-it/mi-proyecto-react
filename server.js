const path = require('path');
const express = require('express');
const cors = require('cors');
const { connectDatabase } = require('./src/config/db');
const routes = require('./src/routes');
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Sistema funcionando' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use('/api', routes);

app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
});

if (require.main === module) {
  connectDatabase().finally(() => {
    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`); 
    });
  });
}

module.exports = { app }; 
