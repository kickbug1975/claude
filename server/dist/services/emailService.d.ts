export declare const verifyEmailConfig: () => Promise<boolean>;
interface FeuilleEmailData {
    id: string;
    monteurNom: string;
    monteurPrenom: string;
    monteurEmail: string;
    chantierNom: string;
    chantierReference: string;
    dateTravail: Date;
    heureDebut: string;
    heureFin: string;
    heuresTotales: number;
    descriptionTravail: string;
    totalFrais?: number;
}
interface SuperviseurData {
    email: string;
    nom?: string;
}
export declare const emailService: {
    notifySubmission: (data: FeuilleEmailData, superviseurs: SuperviseurData[]) => Promise<void>;
    notifyValidation: (data: FeuilleEmailData, validePar: string) => Promise<void>;
    notifyRejection: (data: FeuilleEmailData, rejetePar: string, motif?: string) => Promise<void>;
    sendPasswordReset: (email: string, resetToken: string) => Promise<boolean>;
};
export type { FeuilleEmailData, SuperviseurData };
//# sourceMappingURL=emailService.d.ts.map