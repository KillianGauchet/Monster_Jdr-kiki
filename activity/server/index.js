require('dotenv').config({ path: '../../.env' }); // Charge le .env racine

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Endpoint test pour l’activité
app.get('/test', (req, res) => {
  res.json({ message: 'API Activity Server UP' });
});

// Tu ajoutes ici d'autres endpoints pour fiche stats, dés, etc.

app.listen(3001, () => console.log('Activity server listening on port 3001'));
