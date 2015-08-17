'use strict';

import User from '../models/user';
import Category from '../models/category';
import Notepad from '../models/notepad';
import HttpStatus from 'http-status';
import express from 'express';
import { pluck } from 'lodash';
import co from 'co';
import { checkAuth } from '../notepadsUtils';

let app = express(),
    router = express.Router();

//protect this resource to the logged in user
router.use(checkAuth);


//handlers start

/**
 * Returns the categories of the current user
 * @param req
 * @param res
 */
let getHandler = (req, res) => {
    co(function* () {
        let categories = yield Category.getByUserId(req.user.id);
        res.status(HttpStatus.OK).json(categories);
    }).catch(err => {
        console.error('categories route getHandler() error', err);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json([]);
    });
};

/**
 *
 * @param req
 * @param res
 */
let postHandler = (req, res) => {
    co(function* () {
        if (!req.body.name) {
            return res.status(HttpStatus.BAD_REQUEST).json({});
        }

        let cat = yield Category.add(req.body.name, req.user.id);

        yield User.addCategory(cat.user, cat._id);

        res.status(HttpStatus.CREATED).json(cat);
    }).catch(err => {
        console.error('categories route postHandler() error', err);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
    });
};

let getIdHandler = (req, res) => {
    co(function* () {
        if (!req.params.id) {
            return res.status(HttpStatus.BAD_REQUEST).json({});
        }

        let category = yield Category.getByIdForUser(req.params.id, req.user.id);

        if (!category) {
            console.error('categories route getIdHandler(): Category not found!');
            //throw new Error(msg);
            return res.status(HttpStatus.NOT_FOUND).json({});
        }

        res.status(HttpStatus.OK).json(category);
    }).catch(err => {
        console.error('categories route getIdHandler() error', err);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
    });
};

let putIdHandler = (req, res) => {
    co(function* () {
        if (!req.params.id || !req.body.name) {
            return res.status(HttpStatus.BAD_REQUEST).json({});
        }

        let category = yield Category.update(req.params.id, req.user.id, req.body.name);

        if (!category) {
            return res.status(HttpStatus.NOT_FOUND).json({});
        }

        res.status(HttpStatus.CREATED).json(category);
    }).catch(err => {
        console.error('categories route putIdHandler() error', err);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
    });
};

let deleteIdHandler = (req, res) => {
    co(function* () {
        //check if the current user has that Category
        let category = yield Category.getByIdForUser(req.params.id, req.user.id);

        if (!category) {
            console.error('categories route deleteIdHandler(): Category not found for user!');
            return res.status(HttpStatus.NOT_FOUND).json({});
        }

        category = yield Category.findByIdAndRemove(category._id).exec();

        let user = yield User.removeCategory(category.user, category._id);

        if (!user) {
            throw new Error('User with that category not found!');
        }

        //delete all orphaned notepads(if any) belonging to the deleted category
        //TODO: think about putting the notepads in Uncategorized category instead of deleting them
        let notepads = yield Notepad.find({ user: req.user.id, category: category._id }).exec();

        if (notepads) {
            let ns = pluck(notepads, '_id');
            yield Notepad.remove({ _id: { $in: ns } });
            //remove the notepads' ids from User.notepads too
            yield User.removeNotepads(req.user.id, ns);
        }

        return res.status(HttpStatus.NO_CONTENT).json({});
    }).catch(err => {
        console.error('categories route deleteIdHandler() error', err);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
    });
};
//handlers end

//base: /categories

// GET /categories
router.get('/', getHandler);

// POST /categories
router.post('/', postHandler);

// GET /categories/1234
router.get('/:id', getIdHandler);

// PUT /categories/1234
router.put('/:id', putIdHandler);

// DELETE /categories/1
router.delete('/:id', deleteIdHandler);

if (app.get('env') === 'test') {
    router.getHandler = exports.getHandler = getHandler;
    router.postHandler = exports.postHandler = postHandler;
    router.getIdHandler = exports.getIdHandler = getIdHandler;
    router.putIdHandler = exports.putIdHandler = putIdHandler;
    router.deleteIdHandler = exports.deleteIdHandler = deleteIdHandler;
}

//module.exports = exports = router;
export default router;
