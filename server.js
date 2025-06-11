const express = require('express');
const path = require('path');
const axios = require('axios');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Config Strava ---
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI || 'http://localhost:3000/strava/callback';

app.use(express.static(path.join(__dirname, 'app')));
app.use(session({ secret: 'strava_secret', resave: false, saveUninitialized: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

// --- Strava OAuth2 login ---
app.get('/strava/login', (req, res) => {
  const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT_URI)}&approval_prompt=auto&scope=activity:read_all`;
  res.redirect(url);
});

// --- Strava OAuth2 callback ---
app.get('/strava/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send('Erreur OAuth Strava');
  try {
    const tokenRes = await axios.post('https://www.strava.com/oauth/token', null, {
      params: {
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      },
    });
    req.session.strava_token = tokenRes.data.access_token;
    res.redirect('/');
  } catch (e) {
    res.send('Erreur lors de la récupération du token Strava');
  }
});

// --- API pour récupérer les activités Strava ---
app.get('/strava/activities', async (req, res) => {
  const token = req.session.strava_token;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  const page = parseInt(req.query.page) || 1;
  const per_page = parseInt(req.query.per_page) || 50;
  try {
    const actRes = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${token}` },
      params: { per_page, page },
    });
    res.json(actRes.data);
  } catch (e) {
    res.status(500).json({ error: 'Erreur lors de la récupération des activités' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});
