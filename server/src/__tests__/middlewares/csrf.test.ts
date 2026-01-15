
import { Request, Response, NextFunction } from 'express'

// Mocker env pour avoir un secret stable
jest.mock('../../config/env', () => ({
    env: {
        jwtSecret: 'test-secret'
    }
}))

describe('CSRF Middleware', () => {
    let mockRequest: Partial<Request>
    let mockResponse: Partial<Response>
    let nextFunction: NextFunction = jest.fn()
    let generateCsrfToken: any
    let csrfProtection: any
    let csrfErrorHandler: any

    beforeAll(() => {
        jest.useFakeTimers()
        // Isoler le chargement du module pour capturer le setInterval avec des fake timers
        jest.isolateModules(() => {
            const csrf = require('../../middlewares/csrf')
            generateCsrfToken = csrf.generateCsrfToken
            csrfProtection = csrf.csrfProtection
            csrfErrorHandler = csrf.csrfErrorHandler
        })
    })

    afterAll(() => {
        jest.useRealTimers()
    })

    beforeEach(() => {
        mockRequest = {
            method: 'GET',
            ip: '127.0.0.1',
            headers: {
                'user-agent': 'jest-test'
            },
            socket: {} as any
        }
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        }
            ; (nextFunction as jest.Mock).mockClear()
    })

    describe('generateCsrfToken', () => {
        it('should generate a token and return it in JSON', () => {
            generateCsrfToken(mockRequest as Request, mockResponse as Response, nextFunction)

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    csrfToken: expect.any(String)
                })
            )
        })

        it('should return 500 if an error occurs during generation', () => {
            const crypto = require('crypto')
            const originalCreateHmac = crypto.createHmac
            crypto.createHmac = jest.fn().mockImplementation(() => {
                throw new Error('Crypto error')
            })

            generateCsrfToken(mockRequest as Request, mockResponse as Response, nextFunction)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Impossible de générer le token CSRF'
                })
            )

            // Restaurer createHmac
            crypto.createHmac = originalCreateHmac
        })

        it('should return 500 if an error occurs during generation (non-Error object)', () => {
            const crypto = require('crypto')
            const originalCreateHmac = crypto.createHmac
            crypto.createHmac = jest.fn().mockImplementation(() => {
                throw 'String error instead of Error object'
            })

            generateCsrfToken(mockRequest as Request, mockResponse as Response, nextFunction)

            expect(mockResponse.status).toHaveBeenCalledWith(500)
            crypto.createHmac = originalCreateHmac
        })

        it('should handle missing IP and User-Agent in getSessionId', () => {
            const minimalReq: any = {
                headers: {},
                socket: {}
            }
            generateCsrfToken(minimalReq, mockResponse as Response, nextFunction)
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
        })

        it('should use remoteAddress if ip is missing', () => {
            const reqWithRemoteAddr: any = {
                headers: { 'user-agent': 'test' },
                socket: { remoteAddress: '1.2.3.4' }
            }
            generateCsrfToken(reqWithRemoteAddr, mockResponse as Response, nextFunction)
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
        })
    })

    describe('csrfProtection', () => {
        it('should pass for safe methods (GET, HEAD, OPTIONS)', () => {
            ;['GET', 'HEAD', 'OPTIONS'].forEach((method) => {
                mockRequest.method = method
                csrfProtection(mockRequest as Request, mockResponse as Response, nextFunction)
                expect(nextFunction).toHaveBeenCalled()
            })
        })

        it('should reject POST request without token', () => {
            mockRequest.method = 'POST'
            mockRequest.headers = { 'user-agent': 'jest-test' }

            csrfProtection(mockRequest as Request, mockResponse as Response, nextFunction)

            expect(mockResponse.status).toHaveBeenCalledWith(403)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Token CSRF manquant'
                })
            )
        })

        it('should reject POST request with invalid token', () => {
            mockRequest.method = 'POST'
            mockRequest.headers = {
                'user-agent': 'jest-test',
                'x-csrf-token': 'invalid-token'
            }

            csrfProtection(mockRequest as Request, mockResponse as Response, nextFunction)

            expect(mockResponse.status).toHaveBeenCalledWith(403)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Token CSRF invalide ou expiré'
                })
            )
        })

        it('should accept POST request with valid token', () => {
            // 1. Générer un token
            let capturedToken = ''
            const resForGen = {
                json: jest.fn().mockImplementation((data) => {
                    capturedToken = data.csrfToken
                }),
                status: jest.fn().mockReturnThis()
            }

            generateCsrfToken(mockRequest as Request, resForGen as any, nextFunction)

            // 2. Utiliser le token pour la protection
            mockRequest.method = 'POST'
            mockRequest.headers = {
                'user-agent': 'jest-test',
                'x-csrf-token': capturedToken
            }

            csrfProtection(mockRequest as Request, mockResponse as Response, nextFunction)

            expect(nextFunction).toHaveBeenCalled()
        })

        it('should reject expired tokens', () => {
            // 1. Générer
            let capturedToken = ''
            const resForGen = {
                json: jest.fn().mockImplementation((data) => {
                    capturedToken = data.csrfToken
                }),
                status: jest.fn().mockReturnThis()
            }
            generateCsrfToken(mockRequest as Request, resForGen as any, nextFunction)

            // 2. Avancer le temps de 24.5 heures
            // Le setInterval tourne toutes les heures. À 24h le token n'est pas expirée (expires = now + 24h)
            // À 24.5h, il est expiré, et le setInterval n'a pas encore tourné pour le supprimer (prochain run à 25h)
            jest.advanceTimersByTime(24.5 * 60 * 60 * 1000)

            mockRequest.method = 'POST'
            mockRequest.headers = {
                'user-agent': 'jest-test',
                'x-csrf-token': capturedToken
            }

            csrfProtection(mockRequest as Request, mockResponse as Response, nextFunction)

            expect(mockResponse.status).toHaveBeenCalledWith(403)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Token CSRF invalide ou expiré'
                })
            )
        })

        it('should cover setInterval cleanup logic', () => {
            // 1. Générer un token
            generateCsrfToken(mockRequest as Request, mockResponse as Response, nextFunction)

            // 2. Avancer le temps de 25 heures au total pour que le token soit expiré
            jest.advanceTimersByTime(25 * 60 * 60 * 1000)

            // 3. Déclencher le setInterval (toutes les heures)
            jest.advanceTimersByTime(1 * 60 * 60 * 1000)

            mockRequest.method = 'POST'
            mockRequest.headers = {
                'user-agent': 'jest-test',
                'x-csrf-token': 'any'
            }

            csrfProtection(mockRequest as Request, mockResponse as Response, nextFunction)
            expect(mockResponse.status).toHaveBeenCalledWith(403)
        })

        it('should return false if no token is stored for session', () => {
            mockRequest.method = 'POST'
            mockRequest.headers = {
                'user-agent': 'different-user-agent',
                'x-csrf-token': 'any'
            }
            csrfProtection(mockRequest as Request, mockResponse as Response, nextFunction)
            expect(mockResponse.status).toHaveBeenCalledWith(403)
        })
    })

    describe('csrfErrorHandler', () => {
        it('should handle EBADCSRFTOKEN error code', () => {
            const error = { code: 'EBADCSRFTOKEN' }
            csrfErrorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction)

            expect(mockResponse.status).toHaveBeenCalledWith(403)
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Token CSRF invalide ou manquant'
                })
            )
        })

        it('should handle errors with "csrf" in message', () => {
            const error = new Error('Some csrf error')
            csrfErrorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction)

            expect(mockResponse.status).toHaveBeenCalledWith(403)
        })

        it('should call next for other errors', () => {
            const error = new Error('Other error')
            csrfErrorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction)

            expect(nextFunction).toHaveBeenCalledWith(error)
        })
    })
})
