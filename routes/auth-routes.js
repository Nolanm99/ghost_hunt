const router = require('express').Router();
//const { response } = require('express');
const passport = require('passport');


router.get('/login', (req, res) => {
    res.render('login', { user: req.user });
});

router.get('/logout', (req, res) => {
    //handle with passport
    req.logout();
    res.redirect('/')
});

router.get('/google', passport.authenticate('google', {
    scope:['profile']
}));

router.get('/google/redirect', passport.authenticate('google'), (req,res) => {
    //res.send(req.user);
    res.redirect('/profile');
});

module.exports = router;