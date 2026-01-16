import { Request, Response } from 'express'
import {
    getSetupStatus,
    createInitialAdmin,
    updateCompanyInfo,
    finalizeSetup
} from '../../controllers/setupController'
import { prisma } from '../../config/database'

// Mock dependencies
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn()
}))

describe('Setup Controller', () => {
    let mockRequest: Partial<Request>
    let mockResponse: Partial<Response>

    beforeEach(() => {
        mockRequest = {
            body: {},
            user: undefined,
        }
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        }
        jest.clearAllMocks()
    })

    describe('getSetupStatus', () => {
        it('should return setup status when no company exists', async () => {
            ; (prisma.company.findFirst as jest.Mock).mockResolvedValue(null)
                ; (prisma.monteur.count as jest.Mock).mockResolvedValue(0)
                ; (prisma.chantier.count as jest.Mock).mockResolvedValue(0)
                ; (prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

            await getSetupStatus(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        isSetupComplete: false,
                        hasAdmin: false,
                        company: null
                    })
                })
            )
        })

        it('should return company info if setup is incomplete', async () => {
            const mockCompany = { id: 'comp-1', name: 'Test Co', isSetupComplete: false, active: true }
                ; (prisma.company.findFirst as jest.Mock).mockResolvedValue(mockCompany)
                ; (prisma.monteur.count as jest.Mock).mockResolvedValue(5)
                ; (prisma.chantier.count as jest.Mock).mockResolvedValue(3)
                ; (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'admin-1' })

            await getSetupStatus(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        isSetupComplete: false,
                        hasAdmin: true,
                        company: mockCompany,
                        counts: { monteurs: 5, chantiers: 3 }
                    })
                })
            )
        })
    })

    describe('createInitialAdmin', () => {
        it('should return 400 if email or password missing', async () => {
            mockRequest.body = { email: 'admin@test.com' }
            await createInitialAdmin(mockRequest as Request, mockResponse as Response)
            expect(mockResponse.status).toHaveBeenCalledWith(400)
        })

        it('should return 403 if an admin already exists', async () => {
            mockRequest.body = { email: 'admin@test.com', password: 'password' }
                ; (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-admin' })

            await createInitialAdmin(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(403)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false, message: 'Un administrateur existe déjà' })
            )
        })

        it('should create admin and return 201 if none exists', async () => {
            mockRequest.body = { email: 'newadmin@test.com', password: 'password' }
                ; (prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
                ; (prisma.company.findFirst as jest.Mock).mockResolvedValue({ id: 'comp-1' })
                ; (prisma.user.create as jest.Mock).mockResolvedValue({
                    id: 'user-123',
                    email: 'newadmin@test.com',
                    role: 'ADMIN',
                    companyId: 'comp-1'
                })

            await createInitialAdmin(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(201)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        user: expect.objectContaining({ email: 'newadmin@test.com' }),
                        token: expect.any(String)
                    })
                })
            )
        })
    })

    describe('updateCompanyInfo', () => {
        it('should create company and link user if none exists', async () => {
            mockRequest.user = { userId: 'admin-1', email: 'a@a.com', role: 'ADMIN' }
            mockRequest.body = { name: 'New Co', email: 'contact@newco.com' }

                ; (prisma.company.findFirst as jest.Mock).mockResolvedValue(null)
            const createdCompany = { id: 'new-comp-1', name: 'New Co' }
                ; (prisma.company.create as jest.Mock).mockResolvedValue(createdCompany)

            await updateCompanyInfo(mockRequest as Request, mockResponse as Response)

            expect(prisma.company.create).toHaveBeenCalled()
            expect(prisma.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'admin-1' },
                    data: { companyId: 'new-comp-1' }
                })
            )
            expect(mockResponse.status).toHaveBeenCalledWith(200)
        })
    })

    describe('finalizeSetup', () => {
        it('should update company isSetupComplete to true', async () => {
            ; (prisma.company.findFirst as jest.Mock).mockResolvedValue({ id: 'comp-1' })

            await finalizeSetup(mockRequest as Request, mockResponse as Response)

            expect(prisma.company.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'comp-1' },
                    data: { isSetupComplete: true }
                })
            )
            expect(mockResponse.status).toHaveBeenCalledWith(200)
        })
    })
})
