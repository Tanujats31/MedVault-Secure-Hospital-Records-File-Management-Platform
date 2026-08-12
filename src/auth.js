// src/auth.js
// Session-based auth helpers and role-gating middleware.

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/login');
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) return res.redirect('/login');
    if (!allowedRoles.includes(req.session.user.role)) {
      return res.status(403).render('error', {
        message: 'You do not have permission to view this page.',
        user: req.session.user,
      });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
