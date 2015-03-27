'use strict';

exports.index = function (req, res) {
    //TODO: passport gives: req.user when logged in
    res.render('index', {});
};
