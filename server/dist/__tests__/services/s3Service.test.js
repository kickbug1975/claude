"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const fs_1 = __importDefault(require("fs"));
const s3Service_1 = require("../../services/s3Service");
const env_1 = require("../../config/env");
// Mocker logger
jest.mock('../../utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    }
}));
// Mocking AWS SDK
jest.mock('aws-sdk', () => {
    const mS3 = {
        upload: jest.fn().mockReturnThis(),
        deleteObject: jest.fn().mockReturnThis(),
        deleteObjects: jest.fn().mockReturnThis(),
        headObject: jest.fn().mockReturnThis(),
        getSignedUrl: jest.fn(),
        promise: jest.fn(),
    };
    return { S3: jest.fn(() => mS3) };
});
// Mocking fs
jest.mock('fs');
// Mocking uuid
jest.mock('uuid', () => ({
    v4: () => 'test-uuid'
}));
// Mocking env
jest.mock('../../config/env', () => ({
    env: {
        aws: {
            accessKeyId: 'test-key',
            secretAccessKey: 'test-secret',
            region: 'test-region',
            s3Bucket: 'test-bucket'
        }
    }
}));
describe('S3 Service', () => {
    const mockS3 = new aws_sdk_1.default.S3();
    const mockFile = {
        buffer: Buffer.from('test content'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1234
    };
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset configuration par défaut
        env_1.env.aws.accessKeyId = 'test-key';
        env_1.env.aws.secretAccessKey = 'test-secret';
        env_1.env.aws.s3Bucket = 'test-bucket';
    });
    describe('isS3Configured', () => {
        it('should return true if all AWS params are set', () => {
            expect((0, s3Service_1.isS3Configured)()).toBe(true);
        });
        it('should return false if any AWS param is missing', () => {
            env_1.env.aws.accessKeyId = '';
            expect((0, s3Service_1.isS3Configured)()).toBe(false);
        });
    });
    describe('S3 Mode', () => {
        it('should upload a file to S3', async () => {
            mockS3.promise.mockResolvedValueOnce({});
            const result = await (0, s3Service_1.uploadToS3)(mockFile);
            expect(mockS3.upload).toHaveBeenCalledWith(expect.objectContaining({
                Bucket: 'test-bucket',
                Key: expect.stringContaining('.jpg'),
                ContentType: 'image/jpeg'
            }));
            expect(result.url).toContain('test-bucket.s3.test-region.amazonaws.com');
            expect(result.key).toContain('test-uuid.jpg');
        });
        it('should upload multiple files to S3', async () => {
            mockS3.promise.mockResolvedValue({});
            const files = [mockFile, { ...mockFile, originalname: 'test2.png' }];
            const results = await (0, s3Service_1.uploadMultipleToS3)(files);
            expect(mockS3.upload).toHaveBeenCalledTimes(2);
            expect(results).toHaveLength(2);
        });
        it('should handle upload error', async () => {
            mockS3.promise.mockRejectedValueOnce(new Error('S3 Upload Error'));
            await expect((0, s3Service_1.uploadToS3)(mockFile)).rejects.toThrow('S3 Upload Error');
        });
        it('should delete a file from S3', async () => {
            mockS3.promise.mockResolvedValueOnce({});
            await (0, s3Service_1.deleteFromS3)('test-key');
            expect(mockS3.deleteObject).toHaveBeenCalledWith({
                Bucket: 'test-bucket',
                Key: 'test-key'
            });
        });
        it('should delete multiple files from S3', async () => {
            mockS3.promise.mockResolvedValueOnce({});
            await (0, s3Service_1.deleteMultipleFromS3)(['key1', 'key2']);
            expect(mockS3.deleteObjects).toHaveBeenCalledWith(expect.objectContaining({
                Delete: {
                    Objects: [{ Key: 'key1' }, { Key: 'key2' }]
                }
            }));
        });
        it('should not call deleteMultipleFromS3 if keys array is empty', async () => {
            await (0, s3Service_1.deleteMultipleFromS3)([]);
            expect(mockS3.deleteObjects).not.toHaveBeenCalled();
        });
        it('should handle delete error', async () => {
            mockS3.promise.mockRejectedValueOnce(new Error('Delete Error'));
            await expect((0, s3Service_1.deleteFromS3)('key')).rejects.toThrow('Delete Error');
        });
        it('should handle deleteMultiple error', async () => {
            mockS3.promise.mockRejectedValueOnce(new Error('Batch Delete Error'));
            await expect((0, s3Service_1.deleteMultipleFromS3)(['key'])).rejects.toThrow('Batch Delete Error');
        });
        it('should get a signed URL', () => {
            mockS3.getSignedUrl.mockReturnValue('https://signed-url.com');
            const url = (0, s3Service_1.getSignedUrl)('test-key');
            expect(mockS3.getSignedUrl).toHaveBeenCalledWith('getObject', expect.objectContaining({
                Key: 'test-key'
            }));
            expect(url).toBe('https://signed-url.com');
        });
        it('should check if file exists (true)', async () => {
            mockS3.promise.mockResolvedValueOnce({});
            const exists = await (0, s3Service_1.fileExistsInS3)('test-key');
            expect(exists).toBe(true);
        });
        it('should check if file exists (false)', async () => {
            mockS3.promise.mockRejectedValueOnce(new Error('Not Found'));
            const exists = await (0, s3Service_1.fileExistsInS3)('test-key');
            expect(exists).toBe(false);
        });
    });
    describe('Local Mode (Fallback)', () => {
        it('should upload locally', async () => {
            ;
            fs_1.default.existsSync.mockReturnValue(false);
            const result = await (0, s3Service_1.uploadLocally)(mockFile);
            expect(fs_1.default.mkdirSync).toHaveBeenCalled();
            expect(fs_1.default.writeFileSync).toHaveBeenCalledWith(expect.any(String), mockFile.buffer);
            expect(result.url).toBe('/uploads/uploads/test-uuid.jpg');
        });
        it('should delete locally', async () => {
            ;
            fs_1.default.existsSync.mockReturnValue(true);
            await (0, s3Service_1.deleteLocally)('test-key');
            expect(fs_1.default.unlinkSync).toHaveBeenCalledWith(expect.any(String));
        });
        it('should not delete locally if file does not exist', async () => {
            ;
            fs_1.default.existsSync.mockReturnValue(false);
            await (0, s3Service_1.deleteLocally)('test-key');
            expect(fs_1.default.unlinkSync).not.toHaveBeenCalled();
        });
    });
    describe('storageService delegation', () => {
        it('should delegate to S3 when configured', async () => {
            mockS3.promise.mockResolvedValue({});
            await s3Service_1.storageService.upload(mockFile);
            expect(mockS3.upload).toHaveBeenCalled();
        });
        it('should delegate to Local when NOT configured', async () => {
            env_1.env.aws.accessKeyId = '';
            fs_1.default.existsSync.mockReturnValue(true);
            await s3Service_1.storageService.upload(mockFile);
            expect(fs_1.default.writeFileSync).toHaveBeenCalled();
        });
        it('should delegate uploadMultiple to S3 when configured', async () => {
            mockS3.promise.mockResolvedValue({});
            await s3Service_1.storageService.uploadMultiple([mockFile]);
            expect(mockS3.upload).toHaveBeenCalled();
        });
        it('should delegate uploadMultiple to Local when NOT configured', async () => {
            env_1.env.aws.accessKeyId = '';
            fs_1.default.existsSync.mockReturnValue(true);
            await s3Service_1.storageService.uploadMultiple([mockFile]);
            expect(fs_1.default.writeFileSync).toHaveBeenCalled();
        });
        it('should delegate delete to S3 when configured', async () => {
            mockS3.promise.mockResolvedValue({});
            await s3Service_1.storageService.delete('key');
            expect(mockS3.deleteObject).toHaveBeenCalled();
        });
        it('should delegate delete to Local when NOT configured', async () => {
            env_1.env.aws.accessKeyId = '';
            fs_1.default.existsSync.mockReturnValue(true);
            await s3Service_1.storageService.delete('key');
            expect(fs_1.default.unlinkSync).toHaveBeenCalled();
        });
        it('should use signed URL when S3 configured', () => {
            mockS3.getSignedUrl.mockReturnValue('signed');
            expect(s3Service_1.storageService.getUrl('key')).toBe('signed');
        });
        it('should use local path when S3 NOT configured', () => {
            env_1.env.aws.accessKeyId = '';
            expect(s3Service_1.storageService.getUrl('key')).toBe('/uploads/key');
        });
    });
});
//# sourceMappingURL=s3Service.test.js.map