const passport = require('passport');

const checkAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err || !user) return res.status(401).json({ message: 'Unauthorized' });
    req.user = user;
    return next();
  }
  )(req, res, next);
};

const isAdmin = (req, res, next) => {
  // if user is not admin, return 403
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return next();
};

module.exports = { checkAuth, isAdmin }