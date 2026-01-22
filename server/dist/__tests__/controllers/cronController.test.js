"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cronController_1 = require("../../controllers/cronController");
const cronService_1 = require("../../services/cronService");
// Mock cronService
jest.mock('../../services/cronService', () => ({
    listJobs: jest.fn(),
    toggleJob: jest.fn(),
    runJobManually: jest.fn(),
}));
describe('Cron Controller', () => {
    let mockRequest;
    let mockResponse;
    beforeEach(() => {
        mockRequest = {
            body: {},
            params: {},
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });
    describe('getAllJobs', () => {
        it('should return list of all cron jobs', async () => {
            const mockJobs = [
                {
                    name: 'dailyReminders',
                    schedule: '0 8 * * *',
                    enabled: true,
                    lastRun: new Date(),
                },
                {
                    name: 'weeklyReports',
                    schedule: '0 9 * * 1',
                    enabled: true,
                    lastRun: null,
                },
            ];
            cronService_1.listJobs.mockReturnValue(mockJobs);
            await (0, cronController_1.getAllJobs)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockJobs,
            });
        });
        it('should handle errors gracefully', async () => {
            ;
            cronService_1.listJobs.mockImplementation(() => {
                throw new Error('Service error');
            });
            await (0, cronController_1.getAllJobs)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Erreur lors de la récupération des jobs',
            });
        });
    });
    describe('toggleJobStatus', () => {
        it('should enable a job successfully', async () => {
            ;
            cronService_1.toggleJob.mockReturnValue(true);
            mockRequest.params = { name: 'dailyReminders' };
            mockRequest.body = { enabled: true };
            await (0, cronController_1.toggleJobStatus)(mockRequest, mockResponse);
            expect(cronService_1.toggleJob).toHaveBeenCalledWith('dailyReminders', true);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Job "dailyReminders" activé',
            });
        });
        it('should disable a job successfully', async () => {
            ;
            cronService_1.toggleJob.mockReturnValue(true);
            mockRequest.params = { name: 'weeklyReports' };
            mockRequest.body = { enabled: false };
            await (0, cronController_1.toggleJobStatus)(mockRequest, mockResponse);
            expect(cronService_1.toggleJob).toHaveBeenCalledWith('weeklyReports', false);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Job "weeklyReports" désactivé',
            });
        });
        it('should return 400 if enabled is not a boolean', async () => {
            mockRequest.params = { name: 'dailyReminders' };
            mockRequest.body = { enabled: 'true' };
            await (0, cronController_1.toggleJobStatus)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Le champ "enabled" doit être un booléen',
            });
        });
        it('should return 404 if job not found', async () => {
            ;
            cronService_1.toggleJob.mockReturnValue(false);
            mockRequest.params = { name: 'nonexistentJob' };
            mockRequest.body = { enabled: true };
            await (0, cronController_1.toggleJobStatus)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Job "nonexistentJob" non trouvé',
            });
        });
        it('should handle errors gracefully', async () => {
            ;
            cronService_1.toggleJob.mockImplementation(() => {
                throw new Error('Service error');
            });
            mockRequest.params = { name: 'dailyReminders' };
            mockRequest.body = { enabled: true };
            await (0, cronController_1.toggleJobStatus)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });
    describe('executeJob', () => {
        it('should execute job successfully', async () => {
            ;
            cronService_1.runJobManually.mockResolvedValue(true);
            mockRequest.params = { name: 'dailyReminders' };
            await (0, cronController_1.executeJob)(mockRequest, mockResponse);
            expect(cronService_1.runJobManually).toHaveBeenCalledWith('dailyReminders');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Job "dailyReminders" exécuté avec succès',
            });
        });
        it('should return 404 if job not found', async () => {
            ;
            cronService_1.runJobManually.mockResolvedValue(false);
            mockRequest.params = { name: 'nonexistentJob' };
            await (0, cronController_1.executeJob)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Job "nonexistentJob" non trouvé',
            });
        });
        it('should handle errors gracefully', async () => {
            ;
            cronService_1.runJobManually.mockRejectedValue(new Error('Execution error'));
            mockRequest.params = { name: 'dailyReminders' };
            await (0, cronController_1.executeJob)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: "Erreur lors de l'exécution du job",
            });
        });
    });
});
//# sourceMappingURL=cronController.test.js.map