const router = require('express').Router();

const authCheck = (req,res,next) => {
    console.log(req.user)
    if(!req.user) {
        res.redirect('/auth/login');
    } else {
        console.log(req.user)
        next();
    }
};

router.get('/', authCheck, (req,res) => {
    res.render('profile', {user:req.user});
});

module.exports = router;