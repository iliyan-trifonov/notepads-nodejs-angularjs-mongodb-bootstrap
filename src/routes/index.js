'use strict';

//module.exports.index = exports.index = ...
export let index = (req, res) => {
    res.render('index', { user: req.user });
};
