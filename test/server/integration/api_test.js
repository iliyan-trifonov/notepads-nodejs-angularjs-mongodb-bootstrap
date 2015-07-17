'use strict';

import HttpStatus from 'http-status';
import request from 'supertest-as-promised';
import app from '../../../src/app';
import { loadConfig } from './helper-functions';

let req = request(app);
let config = loadConfig();

describe('headers set for API endpoints', () => {
    it('should return status OK(200) for method OPTIONS', () =>
        req.options(config.apiBase)
            .expect(HttpStatus.OK)
    );

    it('should have set Access-Control-Allow-Origin header to *', () =>
        req.options(config.apiBase)
            .expect(HttpStatus.OK)
            .expect('Access-Control-Allow-Origin', '*')
    );

    it('should have set Access-Control-Allow-Methods header to OPTIONS, GET, POST, PUT, DELETE', () =>
        req.options(config.apiBase)
            .expect(HttpStatus.OK)
            .expect('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE')
    );

    it('should have set Access-Control-Allow-Headers header to X-Requested-With,content-type,x-access-token', () =>
        req.options(config.apiBase)
            .expect(HttpStatus.OK)
            .expect('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-access-token')
    );
});
