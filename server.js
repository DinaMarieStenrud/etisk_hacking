const express = require('express');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const app = express();

// Godta både text/plain, JSON og form (for sikkerhets skyld)
app.use(express.text({ type: '*/*', limit: '100kb' }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

const ALERT_FILE = path.join(__dirname, 'alerts.txt');

// Sjekk at vi kan skrive til katalogen
(async () => {
  try {
    await fsp.access(__dirname, fs.constants.W_OK);
  } catch {
    console.error('⚠️  Mangler skrivetilgang i prosjektmappen!');
  }
})();

// Motta og lagre alert-teksten
app.post('/log', async (req, res) => {
  try {
    // Støtt både ren tekst og JSON {message:"..."}
    const body = typeof req.body === 'string' ? req.body : (req.body?.message || '');
    const msg = String(body).trim();

    if (!msg) {
      console.warn('⚠️  Tom melding mottatt på /log');
      return res.status(400).send('Empty');
    }

    await fsp.appendFile(ALERT_FILE, msg + '\n', 'utf8');
    console.log('✅ Lagret alert:', JSON.stringify(msg));
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Klarte ikke å skrive til alerts.txt:', err);
    res.status(500).send('Write failed');
  }
});

// Tjen statiske filer (index.html i ./public)
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server kjører på http://localhost:${PORT}`);
  console.log(`Åpne http://localhost:${PORT} i nettleser`);
});
