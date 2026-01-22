"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.version = exports.validate = exports.v1 = exports.v4 = void 0;
exports.v4 = jest.fn(() => 'test-uuid-v4');
exports.v1 = jest.fn(() => 'test-uuid-v1');
exports.validate = jest.fn(() => true);
exports.version = jest.fn(() => 4);
//# sourceMappingURL=uuid.js.map