// server.js
// MedVault Portal backend - login, upload (to File Server via FTPS),
// records (from RDS), archive status, and admin user management.

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcrypt');
const multer = require('multer');

const os = require('os');
const axios = require('axios');

const pool = require('./src/db');
const { requireAuth, requireRole } = require('./src/auth');
const { uploadFileToFileServer } = require('./src/ftpUpload');
const { generateSignedUrl } = require('./src/cloudfrontSign');

const app = express();
const upload = multer({ dest: path.join(__dirname, 'tmp-uploads') });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session store lives in RDS (table created manually - see the setup guide,
// Step 3) rather than in memory, so any Portal instance behind the ALB can
// serve any request without needing "sticky sessions."
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  createDatabaseTable: false,
});

app.use(
  session({
    key: 'medvault_sid',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }, // 8 hours
  })
);

// Make the logged-in user available to every view without repeating it
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ---------- Auth ----------

app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM portal_users WHERE username = ? AND active = 1',
      [username]
    );
    if (rows.length === 0) {
      return res.render('login', { error: 'Invalid username or password.' });
    }
    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) {
      return res.render('login', { error: 'Invalid username or password.' });
    }
    req.session.user = {
      id: rows[0].id,
      username: rows[0].username,
      full_name: rows[0].full_name,
      role: rows[0].role,
    };
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { error: 'Login temporarily unavailable. Please try again.' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/', (req, res) => res.redirect(req.session.user ? '/dashboard' : '/login'));

// ---------- Dashboard ----------

app.get('/dashboard', requireAuth, async (req, res) => {
  try {

    // EC2 Instance Information
    let instanceId = "Unknown";

    try {
      const token = await axios.put(
        "http://169.254.169.254/latest/api/token",
        null,
        {
          headers: {
            "X-aws-ec2-metadata-token-ttl-seconds": "21600"
          }
        }
      );

      instanceId = (
        await axios.get(
          "http://169.254.169.254/latest/meta-data/instance-id",
          {
            headers: {
              "X-aws-ec2-metadata-token": token.data
            }
          }
        )
      ).data;

    } catch (e) {
      console.log("Metadata unavailable");
    }

    const hostname = os.hostname();

    const interfaces = os.networkInterfaces();

    let privateIp = "";

    Object.keys(interfaces).forEach(name => {
      interfaces[name].forEach(net => {
        if (net.family === "IPv4" && !net.internal) {
          privateIp = net.address;
        }
      });
    });

    // Existing Dashboard Queries

    const [[totalRow]] = await pool.query('SELECT COUNT(*) AS total FROM patient_files');

    const [[pendingRow]] = await pool.query(
      "SELECT COUNT(*) AS pending FROM patient_files WHERE storage_status = 'uploaded'"
    );

    const [[archivedRow]] = await pool.query(
      "SELECT COUNT(*) AS archived FROM patient_files WHERE storage_status = 'archived'"
    );

    const [[doctorsRow]] = await pool.query(
      "SELECT COUNT(*) AS doctors FROM portal_users WHERE role='doctor' AND active=1"
    );

    const [recent] = await pool.query(
      `SELECT pf.file_name,pf.storage_status,al.event_type,al.event_detail,al.event_time
       FROM upload_audit_log al
       LEFT JOIN patient_files pf ON pf.file_id=al.file_id
       ORDER BY al.event_time DESC LIMIT 8`
    );

    res.render("dashboard", {
      stats: {
        total: totalRow.total,
        pending: pendingRow.pending,
        archived: archivedRow.archived,
        doctors: doctorsRow.doctors,
      },

      recent,

      instanceInfo: {
        instanceId,
        hostname,
        privateIp
      }

    });

  } catch (err) {

    console.error(err);

    res.render("error", {
      message: "Could not load dashboard data.",
      user: req.session.user
    });

  }

});

// ---------- Upload ----------

app.get('/upload', requireAuth, requireRole('doctor', 'itadmin'), (req, res) => {
  res.render('upload', { message: null, error: null });
});

app.post(
  '/upload',
  requireAuth,
  requireRole('doctor', 'itadmin'),
  upload.single('file'),
  async (req, res) => {
    const { patient_ref, notes } = req.body;
    const file = req.file;

    if (!file) {
      return res.render('upload', { error: 'Please choose a file.', message: null });
    }

    const allowedExt = ['pdf', 'jpg', 'jpeg', 'png', 'docx'];
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (!allowedExt.includes(ext)) {
      fs.unlinkSync(file.path);
      return res.render('upload', {
        error: `File type .${ext} is not allowed. Allowed: ${allowedExt.join(', ')}`,
        message: null,
      });
    }

    try {
      // 1. Push the file to the File Server over FTPS - lands in
      //    /medvault/uploads, exactly where Phase 6/7's validation and
      //    cron pipeline already expects new files to appear.
      await uploadFileToFileServer(file.path, file.originalname);

      // 2. Record the initial metadata row immediately via the Phase 10
      //    API Gateway endpoint, so it shows up in Records right away
      //    with status "uploaded" (the bash validation script will later
      //    flip it to "validated" once its cron cycle runs).
      await fetch(process.env.API_METADATA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_ref: patient_ref || 'UNSPECIFIED',
          file_name: file.originalname,
          file_type: ext,
          file_size_bytes: file.size,
          uploaded_by: req.session.user.username,
          storage_status: 'uploaded',
        }),
      });

      res.render('upload', { message: `${file.originalname} uploaded successfully.`, error: null });
    } catch (err) {
      console.error('Upload error:', err);
      res.render('upload', {
        error: 'Upload failed. The file server may be unreachable - check with IT.',
        message: null,
      });
    } finally {
      fs.unlink(file.path, () => {});
    }
  }
);

// ---------- Records ----------

app.get('/records', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM patient_files ORDER BY uploaded_at DESC LIMIT 100'
    );
    console.log(rows);
    console.log(rows);

    res.render('records', {
        records: rows
    });
  } catch (err) {
    console.error('Records error:', err);
    res.render('error', { message: 'Could not load patient records.', user: req.session.user });
  }
});

app.get('/download/:fileId', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM patient_files WHERE file_id = ?', [
      req.params.fileId,
    ]);
    if (rows.length === 0 || !rows[0].s3_object_key) {
      return res.status(404).send('File not available yet - it may still be syncing to S3.');
    }
    const objectPath = `/${rows[0].s3_object_key}`.replace('//', '/');
    const signedUrl = generateSignedUrl(objectPath, 15);
    res.redirect(signedUrl);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).send('Could not generate a download link.');
  }
});

// ---------- Archive status ----------

app.get('/archive', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM patient_files WHERE storage_status = 'archived' ORDER BY archived_at DESC LIMIT 50"
    );
    const [[countRow]] = await pool.query(
      "SELECT COUNT(*) AS c FROM patient_files WHERE storage_status = 'archived'"
    );
    res.render('archive', { files: rows, count: countRow.c });
  } catch (err) {
    console.error('Archive error:', err);
    res.render('error', { message: 'Could not load archive status.', user: req.session.user });
  }
});

// ---------- Admin ----------

app.get('/admin', requireAuth, requireRole('itadmin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, full_name, role, active, created_at FROM portal_users ORDER BY created_at DESC'
    );
    res.render('admin', { users: rows, message: null, error: null });
  } catch (err) {
    console.error('Admin error:', err);
    res.render('error', { message: 'Could not load users.', user: req.session.user });
  }
});

app.post('/admin/users', requireAuth, requireRole('itadmin'), async (req, res) => {
  const { username, full_name, role, password } = req.body;
  try {
    const password_hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO portal_users (username, full_name, role, password_hash, active) VALUES (?, ?, ?, ?, 1)',
      [username, full_name, role, password_hash]
    );
    const [rows] = await pool.query(
      'SELECT id, username, full_name, role, active, created_at FROM portal_users ORDER BY created_at DESC'
    );
    res.render('admin', { users: rows, message: `User ${username} created.`, error: null });
  } catch (err) {
    console.error('Create user error:', err);
    const [rows] = await pool.query(
      'SELECT id, username, full_name, role, active, created_at FROM portal_users ORDER BY created_at DESC'
    );
    res.render('admin', { users: rows, message: null, error: 'Could not create user (username may already exist).' });
  }
});

app.post('/admin/users/:id/toggle', requireAuth, requireRole('itadmin'), async (req, res) => {
  await pool.query('UPDATE portal_users SET active = NOT active WHERE id = ?', [req.params.id]);
  res.redirect('/admin');
});

// ---------- Health check (for the ALB target group) ----------

app.get('/health', (req, res) => res.status(200).send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`MedVault Portal backend listening on 127.0.0.1:${PORT}`);
});
