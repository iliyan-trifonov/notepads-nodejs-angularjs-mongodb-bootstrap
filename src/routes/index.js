'use strict';

//module.exports.index = exports.index = ...
export let index = (req, res) => {
    if (req.user && req.user.facebookId) {
        req.user.photo = `//graph.facebook.com/${req.user.facebookId}/picture?width=50&height=50`;
    }
    res.render('index', { user: req.user });
};
