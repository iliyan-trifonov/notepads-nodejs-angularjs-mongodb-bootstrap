'use strict';

import express from 'express';
import graph from 'fbgraph';
import * as notepadsUtils from '../notepadsUtils';
import Promise from 'bluebird';
import HttpStatus from 'http-status';
import co from 'co';
import User from '../models/user';

let app = express(),
    router = express.Router(),
    config;

Promise.promisify(graph.get);

//if the graph.get cannot be promisified the usual way; also helps mocking the object:
if (!graph.getAsync) {
    graph.getAsync = Promise.promisify(graph.get);
}

//base: /users

//TODO: instead of returning only the app's accessToken in some places, always return the whole user object
let postAuthHandler = (req, res) => {
    co(function* () {
        let fbUserId = req.body.fbId,
            fbAccessToken = req.body.fbAccessToken,
            accessToken = req.body.accessToken;

        //check if all required params are given
        if (!accessToken && (!fbUserId || !fbAccessToken)) {
            console.error('API /auth: not enough params!', fbUserId, fbAccessToken, accessToken);
            return res.status(HttpStatus.BAD_REQUEST).json({});
        }

        //find a user by his accessToken
        if (accessToken) {
            let user = yield User.getByAccessToken(accessToken);

            if (!user) {
                console.error('Invalid Access Token!');
                return res.status(HttpStatus.UNAUTHORIZED).json({});
            }

            //returns user name and photo to be used by the front-end client
            return res.status(HttpStatus.OK).json(user);
        } else {
            //find a user by his FB access token
            graph.setAppSecret(config.facebook.app.secret);
            graph.setAccessToken(fbAccessToken);

            let graphUser = yield graph.getAsync('me?fields=id,name,picture');

            //when the given fb id and token mismatch:
            if (!graphUser || graphUser.id !== fbUserId) {
                console.error("Invalid user from fbAccessToken!");
                return res.status(HttpStatus.UNAUTHORIZED).json({});
            }

            let user = yield User.fb(fbUserId);

            if (user) {
                //user found by his FB access token, return the app's custom token
                return res.status(HttpStatus.OK).json({ accessToken: user.accessToken });
            } else {
                //create a new user
                user = yield User.createAsync({
                    facebookId: graphUser.id,
                    name: graphUser.name,
                    photo: graphUser.picture.data.url
                });

                //pre-populate only for new users
                yield notepadsUtils.prepopulate(user._id);

                //success, return the app's custom token
                return res.status(HttpStatus.CREATED).json({ accessToken: user.accessToken });
            }
        }
    }).catch(err => {
        console.error(err);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
    });
};

//assign the handler to POST /users/auth
router.post('/auth', postAuthHandler);

router.setAppConfig = cnf => {
    config = cnf;
};

if (app.get('env') === 'test') {
    router.postAuthHandler = postAuthHandler;
    router.getAppConfig = () => config;
}

//module.exports = exports = router;
export default router;
