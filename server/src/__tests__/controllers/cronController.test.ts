import { Request, Response } from 'express'
import { getAllJobs, toggleJobStatus, executeJob } from '../../controllers/cronController'
import { listJobs, toggleJob, runJobManually } from '../../services/cronService'

// Mock cronService
jest.mock('../../services/cronService', () => ({
    listJobs: jest.fn(),
    toggleJob: jest.fn(),
    runJobManually: jest.fn(),
}))

describe('Cron Controller', () => {
    let mockRequest: Partial<Request>
    let mockResponse: Partial<Response>

    beforeEach(() => {
        mockRequest = {
            body: {},
            params: {},
        }
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        }
        jest.clearAllMocks()
    })

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
            ]

                ; (listJobs as jest.Mock).mockReturnValue(mockJobs)

            await getAllJobs(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockJobs,
            })
        })

        it('should handle errors gracefully', async () => {
            ; (listJobs as jest.Mock).mockImplementation(() => {
                throw new Error('Service error')
            })

            await getAllJobs(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Erreur lors de la récupération des jobs',
            })
        })
    })

    describe('toggleJobStatus', () => {
        it('should enable a job successfully', async () => {
            ; (toggleJob as jest.Mock).mockReturnValue(true)

            mockRequest.params = { name: 'dailyReminders' }
            mockRequest.body = { enabled: true }

            await toggleJobStatus(mockRequest as Request, mockResponse as Response)

            expect(toggleJob).toHaveBeenCalledWith('dailyReminders', true)
            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Job "dailyReminders" activé',
            })
        })

        it('should disable a job successfully', async () => {
            ; (toggleJob as jest.Mock).mockReturnValue(true)

            mockRequest.params = { name: 'weeklyReports' }
            mockRequest.body = { enabled: false }

            await toggleJobStatus(mockRequest as Request, mockResponse as Response)

            expect(toggleJob).toHaveBeenCalledWith('weeklyReports', false)
            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Job "weeklyReports" désactivé',
            })
        })

        it('should return 400 if enabled is not a boolean', async () => {
            mockRequest.params = { name: 'dailyReminders' }
            mockRequest.body = { enabled: 'true' }

            await toggleJobStatus(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(400)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Le champ "enabled" doit être un booléen',
            })
        })

        it('should return 404 if job not found', async () => {
            ; (toggleJob as jest.Mock).mockReturnValue(false)

            mockRequest.params = { name: 'nonexistentJob' }
            mockRequest.body = { enabled: true }

            await toggleJobStatus(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(404)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Job "nonexistentJob" non trouvé',
            })
        })

        it('should handle errors gracefully', async () => {
            ; (toggleJob as jest.Mock).mockImplementation(() => {
                throw new Error('Service error')
            })

            mockRequest.params = { name: 'dailyReminders' }
            mockRequest.body = { enabled: true }

            await toggleJobStatus(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
        })
    })

    describe('executeJob', () => {
        it('should execute job successfully', async () => {
            ; (runJobManually as jest.Mock).mockResolvedValue(true)

            mockRequest.params = { name: 'dailyReminders' }

            await executeJob(mockRequest as Request, mockResponse as Response)

            expect(runJobManually).toHaveBeenCalledWith('dailyReminders')
            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Job "dailyReminders" exécuté avec succès',
            })
        })

        it('should return 404 if job not found', async () => {
            ; (runJobManually as jest.Mock).mockResolvedValue(false)

            mockRequest.params = { name: 'nonexistentJob' }

            await executeJob(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(404)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Job "nonexistentJob" non trouvé',
            })
        })

        it('should handle errors gracefully', async () => {
            ; (runJobManually as jest.Mock).mockRejectedValue(new Error('Execution error'))

            mockRequest.params = { name: 'dailyReminders' }

            await executeJob(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: "Erreur lors de l'exécution du job",
            })
        })
    })
})
