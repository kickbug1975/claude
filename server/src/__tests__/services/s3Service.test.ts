
import AWS from 'aws-sdk'
import fs from 'fs'
import {
    uploadToS3,
    uploadMultipleToS3,
    deleteFromS3,
    deleteMultipleFromS3,
    getSignedUrl,
    fileExistsInS3,
    uploadLocally,
    deleteLocally,
    storageService,
    isS3Configured
} from '../../services/s3Service'
import { env } from '../../config/env'

// Mocker logger
jest.mock('../../utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    }
}))
// Mocking AWS SDK
jest.mock('aws-sdk', () => {
    const mS3 = {
        upload: jest.fn().mockReturnThis(),
        deleteObject: jest.fn().mockReturnThis(),
        deleteObjects: jest.fn().mockReturnThis(),
        headObject: jest.fn().mockReturnThis(),
        getSignedUrl: jest.fn(),
        promise: jest.fn(),
    }
    return { S3: jest.fn(() => mS3) }
})

// Mocking fs
jest.mock('fs')

// Mocking uuid
jest.mock('uuid', () => ({
    v4: () => 'test-uuid'
}))

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
}))

describe('S3 Service', () => {
    const mockS3 = new AWS.S3() as any
    const mockFile = {
        buffer: Buffer.from('test content'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1234
    }

    beforeEach(() => {
        jest.clearAllMocks()
        // Reset configuration par défaut
        env.aws.accessKeyId = 'test-key'
        env.aws.secretAccessKey = 'test-secret'
        env.aws.s3Bucket = 'test-bucket'
    })

    describe('isS3Configured', () => {
        it('should return true if all AWS params are set', () => {
            expect(isS3Configured()).toBe(true)
        })

        it('should return false if any AWS param is missing', () => {
            env.aws.accessKeyId = ''
            expect(isS3Configured()).toBe(false)
        })
    })

    describe('S3 Mode', () => {
        it('should upload a file to S3', async () => {
            mockS3.promise.mockResolvedValueOnce({})

            const result = await uploadToS3(mockFile)

            expect(mockS3.upload).toHaveBeenCalledWith(expect.objectContaining({
                Bucket: 'test-bucket',
                Key: expect.stringContaining('.jpg'),
                ContentType: 'image/jpeg'
            }))
            expect(result.url).toContain('test-bucket.s3.test-region.amazonaws.com')
            expect(result.key).toContain('test-uuid.jpg')
        })

        it('should upload multiple files to S3', async () => {
            mockS3.promise.mockResolvedValue({})
            const files = [mockFile, { ...mockFile, originalname: 'test2.png' }]

            const results = await uploadMultipleToS3(files)

            expect(mockS3.upload).toHaveBeenCalledTimes(2)
            expect(results).toHaveLength(2)
        })

        it('should handle upload error', async () => {
            mockS3.promise.mockRejectedValueOnce(new Error('S3 Upload Error'))

            await expect(uploadToS3(mockFile)).rejects.toThrow('S3 Upload Error')
        })

        it('should delete a file from S3', async () => {
            mockS3.promise.mockResolvedValueOnce({})

            await deleteFromS3('test-key')

            expect(mockS3.deleteObject).toHaveBeenCalledWith({
                Bucket: 'test-bucket',
                Key: 'test-key'
            })
        })

        it('should delete multiple files from S3', async () => {
            mockS3.promise.mockResolvedValueOnce({})

            await deleteMultipleFromS3(['key1', 'key2'])

            expect(mockS3.deleteObjects).toHaveBeenCalledWith(expect.objectContaining({
                Delete: {
                    Objects: [{ Key: 'key1' }, { Key: 'key2' }]
                }
            }))
        })

        it('should not call deleteMultipleFromS3 if keys array is empty', async () => {
            await deleteMultipleFromS3([])
            expect(mockS3.deleteObjects).not.toHaveBeenCalled()
        })

        it('should handle delete error', async () => {
            mockS3.promise.mockRejectedValueOnce(new Error('Delete Error'))
            await expect(deleteFromS3('key')).rejects.toThrow('Delete Error')
        })

        it('should handle deleteMultiple error', async () => {
            mockS3.promise.mockRejectedValueOnce(new Error('Batch Delete Error'))
            await expect(deleteMultipleFromS3(['key'])).rejects.toThrow('Batch Delete Error')
        })

        it('should get a signed URL', () => {
            mockS3.getSignedUrl.mockReturnValue('https://signed-url.com')

            const url = getSignedUrl('test-key')

            expect(mockS3.getSignedUrl).toHaveBeenCalledWith('getObject', expect.objectContaining({
                Key: 'test-key'
            }))
            expect(url).toBe('https://signed-url.com')
        })

        it('should check if file exists (true)', async () => {
            mockS3.promise.mockResolvedValueOnce({})

            const exists = await fileExistsInS3('test-key')

            expect(exists).toBe(true)
        })

        it('should check if file exists (false)', async () => {
            mockS3.promise.mockRejectedValueOnce(new Error('Not Found'))

            const exists = await fileExistsInS3('test-key')

            expect(exists).toBe(false)
        })
    })

    describe('Local Mode (Fallback)', () => {
        it('should upload locally', async () => {
            ; (fs.existsSync as jest.Mock).mockReturnValue(false)

            const result = await uploadLocally(mockFile)

            expect(fs.mkdirSync).toHaveBeenCalled()
            expect(fs.writeFileSync).toHaveBeenCalledWith(expect.any(String), mockFile.buffer)
            expect(result.url).toBe('/uploads/uploads/test-uuid.jpg')
        })

        it('should delete locally', async () => {
            ; (fs.existsSync as jest.Mock).mockReturnValue(true)

            await deleteLocally('test-key')

            expect(fs.unlinkSync).toHaveBeenCalledWith(expect.any(String))
        })

        it('should not delete locally if file does not exist', async () => {
            ; (fs.existsSync as jest.Mock).mockReturnValue(false)

            await deleteLocally('test-key')

            expect(fs.unlinkSync).not.toHaveBeenCalled()
        })
    })

    describe('storageService delegation', () => {
        it('should delegate to S3 when configured', async () => {
            mockS3.promise.mockResolvedValue({})

            await storageService.upload(mockFile)
            expect(mockS3.upload).toHaveBeenCalled()
        })

        it('should delegate to Local when NOT configured', async () => {
            env.aws.accessKeyId = ''
                ; (fs.existsSync as jest.Mock).mockReturnValue(true)

            await storageService.upload(mockFile)
            expect(fs.writeFileSync).toHaveBeenCalled()
        })

        it('should delegate uploadMultiple to S3 when configured', async () => {
            mockS3.promise.mockResolvedValue({})
            await storageService.uploadMultiple([mockFile])
            expect(mockS3.upload).toHaveBeenCalled()
        })

        it('should delegate uploadMultiple to Local when NOT configured', async () => {
            env.aws.accessKeyId = ''
                ; (fs.existsSync as jest.Mock).mockReturnValue(true)
            await storageService.uploadMultiple([mockFile])
            expect(fs.writeFileSync).toHaveBeenCalled()
        })

        it('should delegate delete to S3 when configured', async () => {
            mockS3.promise.mockResolvedValue({})
            await storageService.delete('key')
            expect(mockS3.deleteObject).toHaveBeenCalled()
        })

        it('should delegate delete to Local when NOT configured', async () => {
            env.aws.accessKeyId = ''
                ; (fs.existsSync as jest.Mock).mockReturnValue(true)
            await storageService.delete('key')
            expect(fs.unlinkSync).toHaveBeenCalled()
        })

        it('should use signed URL when S3 configured', () => {
            mockS3.getSignedUrl.mockReturnValue('signed')
            expect(storageService.getUrl('key')).toBe('signed')
        })

        it('should use local path when S3 NOT configured', () => {
            env.aws.accessKeyId = ''
            expect(storageService.getUrl('key')).toBe('/uploads/key')
        })
    })
})
