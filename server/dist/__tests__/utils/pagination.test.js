"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../utils/pagination");
describe('Pagination Utils', () => {
    describe('getPaginationParams', () => {
        it('should return default pagination params when no query provided', () => {
            const result = (0, pagination_1.getPaginationParams)({});
            expect(result).toEqual({
                page: 1,
                limit: 10,
                skip: 0,
            });
        });
        it('should parse page and limit from query', () => {
            const result = (0, pagination_1.getPaginationParams)({ page: '2', limit: '20' });
            expect(result).toEqual({
                page: 2,
                limit: 20,
                skip: 20,
            });
        });
        it('should handle invalid page number', () => {
            const result = (0, pagination_1.getPaginationParams)({ page: 'invalid', limit: '10' });
            expect(result.page).toBe(1);
            expect(result.skip).toBe(0);
        });
        it('should enforce maximum limit', () => {
            const result = (0, pagination_1.getPaginationParams)({ page: '1', limit: '1000' });
            expect(result.limit).toBeLessThanOrEqual(100);
        });
        it('should enforce minimum values', () => {
            const result = (0, pagination_1.getPaginationParams)({ page: '0', limit: '0' });
            expect(result.page).toBeGreaterThanOrEqual(1);
            expect(result.limit).toBeGreaterThanOrEqual(1);
        });
    });
    describe('buildPaginatedResponse', () => {
        it('should build paginated response with data', () => {
            const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
            const result = (0, pagination_1.buildPaginatedResponse)(data, 10, 1, 10);
            expect(result).toEqual({
                data,
                pagination: {
                    page: 1,
                    pageSize: 10,
                    total: 10,
                    totalPages: 1,
                },
            });
        });
        it('should calculate total pages correctly', () => {
            const data = [{ id: 1 }, { id: 2 }];
            const result = (0, pagination_1.buildPaginatedResponse)(data, 25, 2, 10);
            expect(result.pagination.totalPages).toBe(3);
        });
        it('should handle empty data', () => {
            const result = (0, pagination_1.buildPaginatedResponse)([], 0, 1, 10);
            expect(result.data).toEqual([]);
            expect(result.pagination.total).toBe(0);
            expect(result.pagination.totalPages).toBe(0);
        });
        it('should handle single page', () => {
            const data = [{ id: 1 }, { id: 2 }];
            const result = (0, pagination_1.buildPaginatedResponse)(data, 2, 1, 10);
            expect(result.pagination.totalPages).toBe(1);
        });
    });
});
//# sourceMappingURL=pagination.test.js.map