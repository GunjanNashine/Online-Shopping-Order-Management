// Authentication middleware for protecting customer and admin routes

function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.session.errorMessage = 'Please sign in to access your account and shopping cart.';
  return res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  req.session.errorMessage = 'Access denied. Administrative privileges required.';
  return res.redirect('/login');
}

function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'admin') {
      return res.redirect('/admin');
    }
    return res.redirect('/products');
  }
  return next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  redirectIfAuthenticated
};
