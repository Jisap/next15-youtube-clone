"use strict";
exports.__esModule = true;
exports.db = void 0;
var neon_http_1 = require("drizzle-orm/neon-http");
exports.db = (0, neon_http_1.drizzle)(process.env.DATABASE_URL);
