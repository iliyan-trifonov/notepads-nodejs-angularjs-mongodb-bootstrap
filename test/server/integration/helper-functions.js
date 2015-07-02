'use strict';

import request from 'supertest';
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
        let urlFinal = `${this.url}${addUrlPart}?token=${accessToken}` + (addQueryPart ? `&${addQueryPart}` : '');
        return r(urlFinal);
    }
}
