"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setupController_1 = require("../../controllers/setupController");
const database_1 = require("../../config/database");
// Mock dependencies
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn()
}));
describe('Setup Controller', () => {
    let mockRequest;
    let mockResponse;
    beforeEach(() => {
        mockRequest = {
            body: {},
            user: undefined,
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });
    describe('getSetupStatus', () => {
        it('should return setup status when no company exists', async () => {
            ;
            database_1.prisma.company.findFirst.mockResolvedValue(null);
            database_1.prisma.monteur.count.mockResolvedValue(0);
            database_1.prisma.chantier.count.mockResolvedValue(0);
            database_1.prisma.user.findFirst.mockResolvedValue(null);
            await (0, setupController_1.getSetupStatus)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    isSetupComplete: false,
                    hasAdmin: false,
                    company: null
                })
            }));
        });
        it('should return company info if setup is incomplete', async () => {
            const mockCompany = { id: 'comp-1', name: 'Test Co', isSetupComplete: false, active: true };
            database_1.prisma.company.findFirst.mockResolvedValue(mockCompany);
            database_1.prisma.monteur.count.mockResolvedValue(5);
            database_1.prisma.chantier.count.mockResolvedValue(3);
            database_1.prisma.user.findFirst.mockResolvedValue({ id: 'admin-1' });
            await (0, setupController_1.getSetupStatus)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    isSetupComplete: false,
                    hasAdmin: true,
                    company: mockCompany,
                    counts: { monteurs: 5, chantiers: 3 }
                })
            }));
        });
    });
    describe('createInitialAdmin', () => {
        it('should return 400 if email or password missing', async () => {
            mockRequest.body = { email: 'admin@test.com' };
            await (0, setupController_1.createInitialAdmin)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });
        it('should return 403 if an admin already exists', async () => {
            mockRequest.body = { email: 'admin@test.com', password: 'password' };
            database_1.prisma.user.findFirst.mockResolvedValue({ id: 'existing-admin' });
            await (0, setupController_1.createInitialAdmin)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Un administrateur existe déjà' }));
        });
        it('should create admin and return 201 if none exists', async () => {
            mockRequest.body = { email: 'newadmin@test.com', password: 'password' };
            database_1.prisma.user.findFirst.mockResolvedValue(null);
            database_1.prisma.company.findFirst.mockResolvedValue({ id: 'comp-1' });
            database_1.prisma.user.create.mockResolvedValue({
                id: 'user-123',
                email: 'newadmin@test.com',
                role: 'ADMIN',
                companyId: 'comp-1'
            });
            await (0, setupController_1.createInitialAdmin)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    user: expect.objectContaining({ email: 'newadmin@test.com' }),
                    token: expect.any(String)
                })
            }));
        });
    });
    describe('updateCompanyInfo', () => {
        it('should create company and link user if none exists', async () => {
            mockRequest.user = { userId: 'admin-1', email: 'a@a.com', role: 'ADMIN' };
            mockRequest.body = { name: 'New Co', email: 'contact@newco.com' };
            database_1.prisma.company.findFirst.mockResolvedValue(null);
            const createdCompany = { id: 'new-comp-1', name: 'New Co' };
            database_1.prisma.company.create.mockResolvedValue(createdCompany);
            await (0, setupController_1.updateCompanyInfo)(mockRequest, mockResponse);
            expect(database_1.prisma.company.create).toHaveBeenCalled();
            expect(database_1.prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'admin-1' },
                data: { companyId: 'new-comp-1' }
            }));
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
    });
    describe('finalizeSetup', () => {
        it('should update company isSetupComplete to true', async () => {
            ;
            database_1.prisma.company.findFirst.mockResolvedValue({ id: 'comp-1' });
            await (0, setupController_1.finalizeSetup)(mockRequest, mockResponse);
            expect(database_1.prisma.company.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'comp-1' },
                data: { isSetupComplete: true }
            }));
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
    });
});
//# sourceMappingURL=setupController.test.js.map