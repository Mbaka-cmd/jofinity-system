const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Basic auth middleware
function basicAuth(req, res, next) {
  const validUser = process.env.ADMIN_USERNAME;
  const validPass = process.env.ADMIN_PASSWORD;

  // Fail closed if credentials aren't configured, instead of falling back
  // to a hardcoded default that would sit exposed in source control.
  if (!validUser || !validPass) {
    console.error('ADMIN_USERNAME / ADMIN_PASSWORD are not set in .env — admin panel is locked until they are.');
    return res.status(503).send('Admin panel is not configured.');
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
    return res.status(401).send('Authentication required');
  }
  const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  if (user !== validUser || pass !== validPass) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
    return res.status(401).send('Invalid credentials');
  }
  next();
}

// GET /admin - Admin dashboard
router.get('/', basicAuth, async (req, res) => {
  let messages = [];
  
  try {
    const Contact = require('../config/Contact');
    messages = await Contact.find().sort({ createdAt: -1 }).limit(100);
  } catch(e) {
    try {
      const filePath = path.join(__dirname, '../data/messages.json');
      if (fs.existsSync(filePath)) {
        messages = JSON.parse(fs.readFileSync(filePath, 'utf8')).reverse();
      }
    } catch(e2) {}
  }

  const newCount = messages.filter(m => m.status === 'new').length;
  
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Panel - Jofinitycore Systems</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
  .header { background: #1e293b; padding: 20px 40px; border-bottom: 2px solid #00d4ff; display: flex; align-items: center; justify-content: space-between; }
  .header h1 { font-size: 20px; color: #00d4ff; }
  .header span { font-size: 13px; color: #94a3b8; }
  .stats { display: flex; gap: 20px; padding: 30px 40px 10px; }
  .stat { background: #1e293b; border-radius: 10px; padding: 20px 30px; border-left: 4px solid #00d4ff; }
  .stat .num { font-size: 32px; font-weight: 700; color: #00d4ff; }
  .stat .label { font-size: 12px; color: #94a3b8; margin-top: 4px; }
  .content { padding: 20px 40px; }
  .table-wrap { background: #1e293b; border-radius: 12px; overflow: hidden; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #0f172a; padding: 14px 16px; text-align: left; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 14px 16px; border-bottom: 1px solid #0f172a; font-size: 14px; vertical-align: top; max-width: 300px; }
  tr:hover td { background: rgba(0,212,255,0.05); }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge.new { background: #00d4ff20; color: #00d4ff; border: 1px solid #00d4ff40; }
  .badge.read { background: #64748b20; color: #94a3b8; border: 1px solid #64748b40; }
  .msg-preview { color: #94a3b8; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 280px; }
  .empty { text-align: center; padding: 60px; color: #475569; font-size: 16px; }
  @media(max-width:768px) { .stats { flex-wrap: wrap; } .content,.header,.stats { padding-left: 16px; padding-right: 16px; } }
</style>
</head>
<body>
<div class="header">
  <h1>&#128274; Jofinitycore Admin Panel</h1>
  <span>Contact Messages Dashboard</span>
</div>
<div class="stats">
  <div class="stat"><div class="num">${messages.length}</div><div class="label">Total Messages</div></div>
  <div class="stat"><div class="num">${newCount}</div><div class="label">Unread Messages</div></div>
  <div class="stat"><div class="num">${messages.length - newCount}</div><div class="label">Read Messages</div></div>
</div>
<div class="content">
  <div class="table-wrap">
    ${messages.length === 0 ? '<div class="empty">No messages yet</div>' : `
    <table>
      <thead><tr><th>Date</th><th>Name</th><th>Email</th><th>Phone</th><th>Service</th><th>Message</th><th>Status</th></tr></thead>
      <tbody>
        ${messages.map(m => `
        <tr>
          <td style="white-space:nowrap; color:#94a3b8; font-size:12px;">${new Date(m.createdAt).toLocaleDateString('en-KE')}<br>${new Date(m.createdAt).toLocaleTimeString('en-KE', {hour:'2-digit',minute:'2-digit'})}</td>
          <td><strong>${m.name}</strong></td>
          <td><a href="mailto:${m.email}" style="color:#00d4ff; text-decoration:none;">${m.email}</a></td>
          <td>${m.phone || '-'}</td>
          <td style="color:#94a3b8; font-size:12px;">${m.service || 'General'}</td>
          <td><div class="msg-preview" title="${m.message}">${m.message}</div></td>
          <td><span class="badge ${m.status}">${m.status}</span></td>
        </tr>`).join('')}
      </tbody>
    </table>`}
  </div>
</div>
</body></html>`);
});

module.exports = router;