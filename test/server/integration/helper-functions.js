'use strict';

import request from 'supertest-as-promised';
import app from '../../../src/app';

//helper functions to make the request and to make the testing code more dry

export default class RequestUrl {
    setUrl (newUrl) {
        this.url = newUrl;
    }

    setToken (token) {
        this.accessToken = token;
    }

    callUrl (options = {}) {
        let addUrlPart = options.addUrl || '';
        let addQueryPart = options.addQuery || '';
        let reqMethod = options.method ? options.method.toLowerCase() : null;

        let req = request(app);

        if (!reqMethod || !(reqMethod in req)) {
            reqMethod = 'get';
        }

        let r = req[reqMethod];

        let accessToken = options.token || this.accessToken;
        let accTokenInHeaders = options.tokenInHeaders || true;

        let urlFinal = `${this.url}${addUrlPart}`;
        let glue = '?';

        if (!accTokenInHeaders) {
            urlFinal += `?token=${accessToken}`;
            glue = '&';
        }
        urlFinal += addQueryPart ? `${glue}${addQueryPart}` : '';

        let result = r(urlFinal);
        if (accTokenInHeaders) {
            result= result.set({ 'x-access-token': accessToken });
        }

        return result;
    }
}

export let loadConfig = () => {
    let config;

    try {
        config = require('../../../config/app.conf.json');
    } catch (err) {
        config = require('../../../config/testing.json');
    }

    return config;
};
