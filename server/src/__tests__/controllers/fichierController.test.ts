import { Request, Response } from 'express'
import {
    uploadFiles,
    getFilesByFeuille,
    getFileById,
    deleteFile,
    attachFileToFeuille,
    getStorageInfo,
} from '../../controllers/fichierController'
import { prisma } from '../../config/database'
import { storageService, isS3Configured } from '../../services/s3Service'

// Mock s3Service
jest.mock('../../services/s3Service', () => ({
    storageService: {
        uploadMultiple: jest.fn(),
        getUrl: jest.fn(),
        delete: jest.fn(),
    },
    isS3Configured: jest.fn(),
}))

describe('Fichier Controller', () => {
    let mockRequest: Partial<Request>
    let mockResponse: Partial<Response>

    beforeEach(() => {
        mockRequest = {
            body: {},
            params: {},
            files: undefined,
        }
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        }
        jest.clearAllMocks()
    })

    describe('uploadFiles', () => {
        it('should upload files successfully', async () => {
            const mockFiles = [
                {
                    buffer: Buffer.from('test'),
                    originalname: 'test.pdf',
                    mimetype: 'application/pdf',
                    size: 1024,
                },
            ] as Express.Multer.File[]

            const mockUploadedFiles = [
                {
                    key: 'documents/test.pdf',
                    url: 'https://example.com/test.pdf',
                    originalName: 'test.pdf',
                    mimeType: 'application/pdf',
                    size: 1024,
                },
            ]

                ; (storageService.uploadMultiple as jest.Mock).mockResolvedValue(mockUploadedFiles)
                ; (prisma.fichier.create as jest.Mock).mockResolvedValue({
                    id: 'fichier-1',
                    nom: 'test.pdf',
                    cle: 'documents/test.pdf',
                    url: 'https://example.com/test.pdf',
                    mimeType: 'application/pdf',
                    taille: 1024,
                })

            mockRequest.files = mockFiles
            mockRequest.body = { description: 'Test file' }

            await uploadFiles(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(201)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: '1 fichier(s) uploadé(s) avec succès',
                })
            )
        })

        it('should return 400 if no files provided', async () => {
            mockRequest.files = []

            await uploadFiles(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(400)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Aucun fichier fourni',
            })
        })

        it('should return 404 if feuille not found', async () => {
            const mockFiles = [
                {
                    buffer: Buffer.from('test'),
                    originalname: 'test.pdf',
                    mimetype: 'application/pdf',
                    size: 1024,
                },
            ] as Express.Multer.File[]

                ; (prisma.feuilleTravail.findUnique as jest.Mock).mockResolvedValue(null)

            mockRequest.files = mockFiles
            mockRequest.body = { feuilleId: 'nonexistent' }

            await uploadFiles(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(404)
        })
    })

    describe('getFilesByFeuille', () => {
        it('should return files for a feuille', async () => {
            const mockFichiers = [
                {
                    id: 'fichier-1',
                    nom: 'test.pdf',
                    cle: 'feuilles/123/test.pdf',
                    url: 'https://example.com/test.pdf',
                    mimeType: 'application/pdf',
                    taille: 1024,
                },
            ]

                ; (prisma.fichier.findMany as jest.Mock).mockResolvedValue(mockFichiers)
                ; (storageService.getUrl as jest.Mock).mockReturnValue('https://signed-url.com/test.pdf')

            mockRequest.params = { feuilleId: 'feuille-1' }

            await getFilesByFeuille(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'fichier-1',
                        downloadUrl: 'https://signed-url.com/test.pdf',
                    }),
                ]),
            })
        })
    })

    describe('getFileById', () => {
        it('should return file when found', async () => {
            const mockFichier = {
                id: 'fichier-1',
                nom: 'test.pdf',
                cle: 'documents/test.pdf',
                url: 'https://example.com/test.pdf',
                mimeType: 'application/pdf',
                taille: 1024,
            }

                ; (prisma.fichier.findUnique as jest.Mock).mockResolvedValue(mockFichier)
                ; (storageService.getUrl as jest.Mock).mockReturnValue('https://signed-url.com/test.pdf')

            mockRequest.params = { id: 'fichier-1' }

            await getFileById(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    id: 'fichier-1',
                    downloadUrl: 'https://signed-url.com/test.pdf',
                }),
            })
        })

        it('should return 404 when file not found', async () => {
            ; (prisma.fichier.findUnique as jest.Mock).mockResolvedValue(null)

            mockRequest.params = { id: 'nonexistent' }

            await getFileById(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(404)
        })
    })

    describe('deleteFile', () => {
        it('should delete file successfully', async () => {
            const mockFichier = {
                id: 'fichier-1',
                nom: 'test.pdf',
                cle: 'documents/test.pdf',
            }

                ; (prisma.fichier.findUnique as jest.Mock).mockResolvedValue(mockFichier)
                ; (storageService.delete as jest.Mock).mockResolvedValue(true)
                ; (prisma.fichier.delete as jest.Mock).mockResolvedValue(mockFichier)

            mockRequest.params = { id: 'fichier-1' }

            await deleteFile(mockRequest as Request, mockResponse as Response)

            expect(storageService.delete).toHaveBeenCalledWith('documents/test.pdf')
            expect(mockResponse.status).toHaveBeenCalledWith(200)
        })

        it('should return 404 when file not found', async () => {
            ; (prisma.fichier.findUnique as jest.Mock).mockResolvedValue(null)

            mockRequest.params = { id: 'nonexistent' }

            await deleteFile(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(404)
        })
    })

    describe('attachFileToFeuille', () => {
        it('should attach file to feuille successfully', async () => {
            ; (prisma.fichier.findUnique as jest.Mock).mockResolvedValue({ id: 'fichier-1' })
                ; (prisma.feuilleTravail.findUnique as jest.Mock).mockResolvedValue({ id: 'feuille-1' })
                ; (prisma.fichier.update as jest.Mock).mockResolvedValue({
                    id: 'fichier-1',
                    feuilleId: 'feuille-1',
                })

            mockRequest.params = { id: 'fichier-1' }
            mockRequest.body = { feuilleId: 'feuille-1' }

            await attachFileToFeuille(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
        })

        it('should return 404 if file not found', async () => {
            ; (prisma.fichier.findUnique as jest.Mock).mockResolvedValue(null)

            mockRequest.params = { id: 'nonexistent' }
            mockRequest.body = { feuilleId: 'feuille-1' }

            await attachFileToFeuille(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(404)
        })

        it('should return 404 if feuille not found', async () => {
            ; (prisma.fichier.findUnique as jest.Mock).mockResolvedValue({ id: 'fichier-1' })
                ; (prisma.feuilleTravail.findUnique as jest.Mock).mockResolvedValue(null)

            mockRequest.params = { id: 'fichier-1' }
            mockRequest.body = { feuilleId: 'nonexistent' }

            await attachFileToFeuille(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(404)
        })
    })

    describe('getStorageInfo', () => {
        it('should return S3 storage info when configured', async () => {
            ; (isS3Configured as jest.Mock).mockReturnValue(true)

            await getStorageInfo(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    storageType: 'S3',
                    configured: true,
                },
            })
        })

        it('should return local storage info when not configured', async () => {
            ; (isS3Configured as jest.Mock).mockReturnValue(false)

            await getStorageInfo(mockRequest as Request, mockResponse as Response)

            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    storageType: 'local',
                    configured: false,
                },
            })
        })
    })
})
