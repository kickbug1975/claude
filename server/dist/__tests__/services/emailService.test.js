"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Mock nodemailer - must be before imports due to hoisting
const mockSendMail = jest.fn();
const mockVerify = jest.fn();
jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: mockSendMail,
        verify: mockVerify,
    })),
}));
const emailService_1 = require("../../services/emailService");
// Mock env
jest.mock('../../config/env', () => ({
    env: {
        smtp: {
            host: 'smtp.test.com',
            port: 587,
            user: 'test@test.com',
            password: 'testpassword',
            from: 'noreply@test.com',
        },
        clientUrl: 'http://localhost:3000',
        nodeEnv: 'test',
    },
}));
describe('Email Service', () => {
    const mockFeuilleData = {
        id: 'abc12345-6789-0def-ghij-klmnopqrstuv',
        monteurNom: 'Dupont',
        monteurPrenom: 'Jean',
        monteurEmail: 'jean.dupont@test.com',
        chantierNom: 'Renovation Batiment A',
        chantierReference: 'CHT-001',
        dateTravail: new Date('2026-01-13'),
        heureDebut: '08:00',
        heureFin: '17:00',
        heuresTotales: 8,
        descriptionTravail: 'Installation des gaines de ventilation',
        totalFrais: 45.50,
    };
    beforeEach(() => {
        jest.clearAllMocks();
        mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });
        mockVerify.mockResolvedValue(true);
    });
    describe('verifyEmailConfig', () => {
        it('should return true when SMTP is configured and verified', async () => {
            mockVerify.mockResolvedValue(true);
            const result = await (0, emailService_1.verifyEmailConfig)();
            expect(result).toBe(true);
        });
        it('should return false when verification fails', async () => {
            mockVerify.mockRejectedValue(new Error('Connection failed'));
            const result = await (0, emailService_1.verifyEmailConfig)();
            expect(result).toBe(false);
        });
    });
    describe('notifySubmission', () => {
        it('should send emails to monteur and superviseurs', async () => {
            const superviseurs = [
                { email: 'sup1@test.com', nom: 'Superviseur 1' },
                { email: 'sup2@test.com', nom: 'Superviseur 2' },
            ];
            await emailService_1.emailService.notifySubmission(mockFeuilleData, superviseurs);
            // Should send 3 emails: 1 to monteur + 2 to superviseurs
            expect(mockSendMail).toHaveBeenCalledTimes(3);
            // First call should be to monteur
            expect(mockSendMail).toHaveBeenNthCalledWith(1, expect.objectContaining({
                to: 'jean.dupont@test.com',
                subject: expect.stringContaining('Feuille soumise'),
            }));
            // Second and third calls should be to superviseurs
            expect(mockSendMail).toHaveBeenNthCalledWith(2, expect.objectContaining({
                to: 'sup1@test.com',
                subject: expect.stringContaining('Nouvelle feuille a valider'),
            }));
            expect(mockSendMail).toHaveBeenNthCalledWith(3, expect.objectContaining({
                to: 'sup2@test.com',
                subject: expect.stringContaining('Nouvelle feuille a valider'),
            }));
        });
        it('should include monteur name in email content', async () => {
            await emailService_1.emailService.notifySubmission(mockFeuilleData, []);
            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                html: expect.stringContaining('Jean'),
            }));
        });
        it('should include chantier name in subject', async () => {
            await emailService_1.emailService.notifySubmission(mockFeuilleData, []);
            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                subject: expect.stringContaining('Renovation Batiment A'),
            }));
        });
    });
    describe('notifyValidation', () => {
        it('should send validation email to monteur', async () => {
            await emailService_1.emailService.notifyValidation(mockFeuilleData, 'supervisor@test.com');
            expect(mockSendMail).toHaveBeenCalledTimes(1);
            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'jean.dupont@test.com',
                subject: expect.stringContaining('Feuille validee'),
            }));
        });
        it('should include validator info in email content', async () => {
            await emailService_1.emailService.notifyValidation(mockFeuilleData, 'manager@test.com');
            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                html: expect.stringContaining('manager@test.com'),
            }));
        });
        it('should include success badge in email', async () => {
            await emailService_1.emailService.notifyValidation(mockFeuilleData, 'supervisor@test.com');
            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                html: expect.stringContaining('VALIDEE'),
            }));
        });
    });
    describe('notifyRejection', () => {
        it('should send rejection email to monteur', async () => {
            await emailService_1.emailService.notifyRejection(mockFeuilleData, 'supervisor@test.com');
            expect(mockSendMail).toHaveBeenCalledTimes(1);
            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'jean.dupont@test.com',
                subject: expect.stringContaining('Feuille rejetee'),
            }));
        });
        it('should include rejection reason when provided', async () => {
            const motif = 'Description incomplete';
            await emailService_1.emailService.notifyRejection(mockFeuilleData, 'supervisor@test.com', motif);
            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                html: expect.stringContaining('Description incomplete'),
            }));
        });
        it('should work without rejection reason', async () => {
            await emailService_1.emailService.notifyRejection(mockFeuilleData, 'supervisor@test.com');
            expect(mockSendMail).toHaveBeenCalledTimes(1);
            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                html: expect.stringContaining('REJETEE'),
            }));
        });
        it('should include action required in subject', async () => {
            await emailService_1.emailService.notifyRejection(mockFeuilleData, 'supervisor@test.com');
            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                subject: expect.stringContaining('[Action requise]'),
            }));
        });
    });
    describe('Email content', () => {
        it('should format reference with uppercase ID prefix', async () => {
            await emailService_1.emailService.notifyValidation(mockFeuilleData, 'supervisor@test.com');
            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                html: expect.stringContaining('FT-ABC12345'),
            }));
        });
        it('should include work hours in email', async () => {
            await emailService_1.emailService.notifySubmission(mockFeuilleData, []);
            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                html: expect.stringContaining('8h'),
            }));
        });
        it('should include expenses when present in supervisor notification', async () => {
            const superviseurs = [{ email: 'sup@test.com' }];
            await emailService_1.emailService.notifySubmission(mockFeuilleData, superviseurs);
            // The second call is to the supervisor and should contain expenses
            expect(mockSendMail).toHaveBeenNthCalledWith(2, expect.objectContaining({
                html: expect.stringContaining('45.50'),
            }));
        });
        it('should include from address in email', async () => {
            await emailService_1.emailService.notifyValidation(mockFeuilleData, 'supervisor@test.com');
            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                from: expect.stringContaining('noreply@test.com'),
            }));
        });
    });
    describe('Error handling', () => {
        it('should handle sendMail errors gracefully', async () => {
            mockSendMail.mockRejectedValue(new Error('SMTP error'));
            // Should not throw
            await expect(emailService_1.emailService.notifyValidation(mockFeuilleData, 'supervisor@test.com')).resolves.not.toThrow();
        });
    });
});
//# sourceMappingURL=emailService.test.js.map