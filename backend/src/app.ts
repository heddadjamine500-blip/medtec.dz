import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import appointmentRoutes from './routes/appointment.routes';
import prescriptionRoutes from './routes/prescription.routes';
import pharmacyRoutes from './routes/pharmacy.routes';
import clinicalRoutes from './routes/clinical.routes';

const app = express();

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root Landing & API Status Dashboard
app.get('/', (req: Request, res: Response) => {
  // If requested by a client expecting JSON
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.json({
      name: 'MEDTEC Medical Platform API',
      status: 'operational',
      version: '1.0.0',
      database: 'SQLite (dev.db)',
      frontendUrl: process.env.CLIENT_URL || 'http://localhost:5173',
      endpoints: {
        health: 'GET /api/health',
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
      },
    });
    return;
  }

  // Friendly, modern HTML landing page for browser visits
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MEDTEC - Serveur API Backend</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: rgba(22, 30, 49, 0.75);
      --card-border: rgba(255, 255, 255, 0.08);
      --primary: #2563eb;
      --primary-glow: rgba(37, 99, 235, 0.35);
      --accent: #10b981;
      --accent-glow: rgba(16, 185, 129, 0.35);
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: var(--bg);
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(37, 99, 235, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 85% 85%, rgba(16, 185, 129, 0.12) 0%, transparent 40%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1.5rem;
    }
    .container {
      width: 100%;
      max-width: 860px;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #34d399;
      padding: 0.35rem 0.9rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    h1 {
      font-size: 2.75rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #93c5fd 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: var(--text-muted);
      font-size: 1.1rem;
      max-width: 580px;
      margin: 0 auto 1.5rem auto;
    }
    .btn-frontend {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      text-decoration: none;
      padding: 0.85rem 1.75rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.98rem;
      box-shadow: 0 10px 25px -5px var(--primary-glow);
      transition: all 0.2s ease;
    }
    .btn-frontend:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 30px -5px rgba(37, 99, 235, 0.5);
      background: linear-gradient(135deg, #3b82f6, #2563eb);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
      gap: 1.25rem;
      margin-top: 1.5rem;
    }
    .card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 1.5rem;
      transition: border-color 0.2s;
    }
    .card:hover {
      border-color: rgba(255, 255, 255, 0.16);
    }
    .card-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.6rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .endpoint {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 0.75rem;
      background: rgba(11, 15, 25, 0.6);
      border-radius: 8px;
      margin-bottom: 0.5rem;
      font-family: monospace;
      font-size: 0.85rem;
    }
    .method-get { color: #34d399; font-weight: bold; }
    .method-post { color: #60a5fa; font-weight: bold; }
    .endpoint a {
      color: #93c5fd;
      text-decoration: none;
    }
    .endpoint a:hover {
      text-decoration: underline;
    }
    .demo-account {
      background: rgba(11, 15, 25, 0.6);
      border-radius: 10px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      font-size: 0.88rem;
    }
    .demo-role {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      display: inline-block;
      margin-bottom: 0.3rem;
    }
    .role-patient { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
    .role-doctor { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; }
    .role-pharmacy { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
    .demo-email { color: #e2e8f0; font-family: monospace; }
    .demo-pass { color: var(--text-muted); font-size: 0.8rem; }
    .footer {
      text-align: center;
      margin-top: 2rem;
      color: #64748b;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">
        <span class="badge-dot"></span>
        API MEDTEC Opérationnelle &bull; Port 10000
      </div>
      <h1>Serveur Backend MEDTEC</h1>
      <p class="subtitle">
        Ce serveur héberge l'API REST, l'authentification sécurisée (JWT + bcrypt) et la base de données médicale SQLite locale.
      </p>
      <a href="http://localhost:5173" class="btn-frontend" target="_blank">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
        Ouvrir le Portail Frontend (Port 5173)
      </a>
    </div>

    <div class="grid">
      <!-- Card: API Endpoints -->
      <div class="card">
        <div class="card-title">
          <span>📡</span> Endpoints de l'API
        </div>
        <div class="endpoint">
          <span><span class="method-get">GET</span> /api/health</span>
          <a href="/api/health" target="_blank">Tester ↗</a>
        </div>
        <div class="endpoint">
          <span><span class="method-post">POST</span> /api/auth/register</span>
          <span style="color: var(--text-muted)">Inscription</span>
        </div>
        <div class="endpoint">
          <span><span class="method-post">POST</span> /api/auth/login</span>
          <span style="color: var(--text-muted)">Connexion</span>
        </div>
        <div class="endpoint">
          <span><span class="method-get">GET</span> /api/auth/me</span>
          <span style="color: var(--text-muted)">Profil (JWT)</span>
        </div>
        <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.8rem;">
          Base de données : <strong>SQLite (dev.db)</strong> connectée avec Prisma 7.
        </p>
      </div>

      <!-- Card: Demo Accounts -->
      <div class="card">
        <div class="card-title">
          <span>🔑</span> Comptes de Démonstration (Mot de passe : password123)
        </div>
        <div class="demo-account">
          <span class="demo-role role-patient">Patient</span>
          <div class="demo-email">patient@medtec.com</div>
          <div class="demo-pass">Alice Dupont &bull; Mot de passe: password123</div>
        </div>
        <div class="demo-account">
          <span class="demo-role role-doctor">Médecin</span>
          <div class="demo-email">doctor@medtec.com</div>
          <div class="demo-pass">Dr. Marc Aison (Cardiologue) &bull; Mot de passe: password123</div>
        </div>
        <div class="demo-account">
          <span class="demo-role role-pharmacy">Pharmacie</span>
          <div class="demo-email">pharmacy@medtec.com</div>
          <div class="demo-pass">Pharmacie Saint-Germain &bull; Mot de passe: password123</div>
        </div>
      </div>
    </div>

    <div class="footer">
      MEDTEC &copy; 2026 &bull; Plateforme de Santé Intelligente
    </div>
  </div>
</body>
</html>`;

  res.send(html);
});

// Basic healthcheck route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Medical API Server Running' });
});

// Modular routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/clinical', clinicalRoutes);

export default app;
