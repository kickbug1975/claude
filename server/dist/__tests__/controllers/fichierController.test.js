"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fichierController_1 = require("../../controllers/fichierController");
const database_1 = require("../../config/database");
const s3Service_1 = require("../../services/s3Service");
// Mock s3Service
jest.mock('../../services/s3Service', () => ({
    storageService: {
        uploadMultiple: jest.fn(),
        getUrl: jest.fn(),
        delete: jest.fn(),
    },
    isS3Configured: jest.fn(),
}));
describe('Fichier Controller', () => {
    let mockRequest;
    let mockResponse;
    beforeEach(() => {
        mockRequest = {
            body: {},
            params: {},
            files: undefined,
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });
    describe('uploadFiles', () => {
        it('should upload files successfully', async () => {
            const mockFiles = [
                {
                    buffer: Buffer.from('test'),
                    originalname: 'test.pdf',
                    mimetype: 'application/pdf',
                    size: 1024,
                },
            ];
            const mockUploadedFiles = [
                {
                    key: 'documents/test.pdf',
                    url: 'https://example.com/test.pdf',
                    originalName: 'test.pdf',
                    mimeType: 'application/pdf',
                    size: 1024,
                },
            ];
            s3Service_1.storageService.uploadMultiple.mockResolvedValue(mockUploadedFiles);
            database_1.prisma.fichier.create.mockResolvedValue({
                id: 'fichier-1',
                nom: 'test.pdf',
                cle: 'documents/test.pdf',
                url: 'https://example.com/test.pdf',
                mimeType: 'application/pdf',
                taille: 1024,
            });
            mockRequest.files = mockFiles;
            mockRequest.body = { description: 'Test file' };
            await (0, fichierController_1.uploadFiles)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: '1 fichier(s) uploadé(s) avec succès',
            }));
        });
        it('should return 400 if no files provided', async () => {
            mockRequest.files = [];
            await (0, fichierController_1.uploadFiles)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Aucun fichier fourni',
            });
        });
        it('should return 404 if feuille not found', async () => {
            const mockFiles = [
                {
                    buffer: Buffer.from('test'),
                    originalname: 'test.pdf',
                    mimetype: 'application/pdf',
                    size: 1024,
                },
            ];
            database_1.prisma.feuilleTravail.findUnique.mockResolvedValue(null);
            mockRequest.files = mockFiles;
            mockRequest.body = { feuilleId: 'nonexistent' };
            await (0, fichierController_1.uploadFiles)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });
    });
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
            ];
            database_1.prisma.feuilleTravail.findUnique.mockResolvedValue({ id: 'feuille-1' });
            database_1.prisma.fichier.findMany.mockResolvedValue(mockFichiers);
            s3Service_1.storageService.getUrl.mockReturnValue('https://signed-url.com/test.pdf');
            mockRequest.params = { feuilleId: 'feuille-1' };
            await (0, fichierController_1.getFilesByFeuille)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'fichier-1',
                        downloadUrl: 'https://signed-url.com/test.pdf',
                    }),
                ]),
            });
        });
    });
    describe('getFileById', () => {
        it('should return file when found', async () => {
            const mockFichier = {
                id: 'fichier-1',
                nom: 'test.pdf',
                cle: 'documents/test.pdf',
                url: 'https://example.com/test.pdf',
                mimeType: 'application/pdf',
                taille: 1024,
            };
            database_1.prisma.fichier.findUnique.mockResolvedValue(mockFichier);
            s3Service_1.storageService.getUrl.mockReturnValue('https://signed-url.com/test.pdf');
            mockRequest.params = { id: 'fichier-1' };
            await (0, fichierController_1.getFileById)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    id: 'fichier-1',
                    downloadUrl: 'https://signed-url.com/test.pdf',
                }),
            });
        });
        it('should return 404 when file not found', async () => {
            ;
            database_1.prisma.fichier.findUnique.mockResolvedValue(null);
            mockRequest.params = { id: 'nonexistent' };
            await (0, fichierController_1.getFileById)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });
    });
    describe('deleteFile', () => {
        it('should delete file successfully', async () => {
            const mockFichier = {
                id: 'fichier-1',
                nom: 'test.pdf',
                cle: 'documents/test.pdf',
            };
            database_1.prisma.fichier.findUnique.mockResolvedValue(mockFichier);
            s3Service_1.storageService.delete.mockResolvedValue(true);
            database_1.prisma.fichier.delete.mockResolvedValue(mockFichier);
            mockRequest.params = { id: 'fichier-1' };
            await (0, fichierController_1.deleteFile)(mockRequest, mockResponse);
            expect(s3Service_1.storageService.delete).toHaveBeenCalledWith('documents/test.pdf');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
        it('should return 404 when file not found', async () => {
            ;
            database_1.prisma.fichier.findUnique.mockResolvedValue(null);
            mockRequest.params = { id: 'nonexistent' };
            await (0, fichierController_1.deleteFile)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });
    });
    describe('attachFileToFeuille', () => {
        it('should attach file to feuille successfully', async () => {
            ;
            database_1.prisma.fichier.findUnique.mockResolvedValue({ id: 'fichier-1' });
            database_1.prisma.feuilleTravail.findUnique.mockResolvedValue({ id: 'feuille-1' });
            database_1.prisma.fichier.update.mockResolvedValue({
                id: 'fichier-1',
                feuilleId: 'feuille-1',
            });
            mockRequest.params = { id: 'fichier-1' };
            mockRequest.body = { feuilleId: 'feuille-1' };
            await (0, fichierController_1.attachFileToFeuille)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
        it('should return 404 if file not found', async () => {
            ;
            database_1.prisma.fichier.findUnique.mockResolvedValue(null);
            mockRequest.params = { id: 'nonexistent' };
            mockRequest.body = { feuilleId: 'feuille-1' };
            await (0, fichierController_1.attachFileToFeuille)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });
        it('should return 404 if feuille not found', async () => {
            ;
            database_1.prisma.fichier.findUnique.mockResolvedValue({ id: 'fichier-1' });
            database_1.prisma.feuilleTravail.findUnique.mockResolvedValue(null);
            mockRequest.params = { id: 'fichier-1' };
            mockRequest.body = { feuilleId: 'nonexistent' };
            await (0, fichierController_1.attachFileToFeuille)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });
    });
    describe('getStorageInfo', () => {
        it('should return S3 storage info when configured', async () => {
            ;
            s3Service_1.isS3Configured.mockReturnValue(true);
            await (0, fichierController_1.getStorageInfo)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    storageType: 'S3',
                    configured: true,
                },
            });
        });
        it('should return local storage info when not configured', async () => {
            ;
            s3Service_1.isS3Configured.mockReturnValue(false);
            await (0, fichierController_1.getStorageInfo)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    storageType: 'local',
                    configured: false,
                },
            });
        });
    });
});
//# sourceMappingURL=fichierController.test.js.map