import { Router } from 'express';
import { prisma } from '../config/prisma';
import { authenticate } from '../middlewares/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/analytics/summary
 * Retourne les 4 cartes principales du dashboard
 */
router.get('/summary', authenticate, async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // 1. Chantiers en cours
        const chantiersEnCours = await prisma.chantier.count({
            where: { statut: 'EN_COURS', actif: true }
        });

        // 2. Feuilles en attente de validation (Fluidité)
        const feuillesEnAttente = await prisma.feuilleTravail.count({
            where: { statut: 'SOUMIS' }
        });

        // 3. Heures travaillées ce mois (Productivité)
        // Prisma aggregate pour sommer les heures
        const heuresMount = await prisma.feuilleTravail.aggregate({
            _sum: {
                heuresMatin: true,
                heuresApresMidi: true,
                heuresDeplace: true
            },
            where: {
                dateTravail: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });

        const totalHeures = (heuresMount._sum.heuresMatin || 0) +
            (heuresMount._sum.heuresApresMidi || 0);

        const totalDeplacement = heuresMount._sum.heuresDeplace || 0;

        // 4. Marge Estimée (Simulation simplifiée pour version 1)
        // Hypothèse: Facturation 65€/h, Coût Monteur 35€/h, Frais réels
        const fraisMonth = await prisma.frais.aggregate({
            _sum: { montant: true },
            where: {
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });

        const chiffreAffaires = totalHeures * 65;
        const coutMainOeuvre = (totalHeures + totalDeplacement) * 35; // On paie aussi le déplacement
        const coutFrais = fraisMonth._sum.montant || 0;
        const marge = chiffreAffaires - coutMainOeuvre - coutFrais;

        res.json({
            success: true,
            data: {
                chantiersActifs: chantiersEnCours,
                feuillesAttente: feuillesEnAttente,
                heuresMois: Math.round(totalHeures),
                margeEstimee: Math.round(marge)
            }
        });

    } catch (error: any) {
        logger.error('Error fetching analytics summary', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/analytics/hours
 * Données pour le graphiques "Heures Travaillées vs Déplacement" (Derniers 7 jours)
 */
router.get('/hours', authenticate, async (req, res) => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const feuilles = await prisma.feuilleTravail.findMany({
            where: {
                dateTravail: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                dateTravail: true,
                heuresMatin: true,
                heuresApresMidi: true,
                heuresDeplace: true
            },
            orderBy: { dateTravail: 'asc' }
        });

        // Regrouper par jour
        const dailyData = feuilles.reduce((acc: Record<string, any>, feuille) => {
            const dateKey = feuille.dateTravail.toISOString().split('T')[0];
            if (!acc[dateKey]) {
                acc[dateKey] = { date: dateKey, travail: 0, deplacement: 0 };
            }
            acc[dateKey].travail += (feuille.heuresMatin + feuille.heuresApresMidi);
            acc[dateKey].deplacement += feuille.heuresDeplace;
            return acc;
        }, {});

        res.json({
            success: true,
            data: Object.values(dailyData)
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/analytics/performance
 * Top 5 Monteurs ce mois-ci
 */
router.get('/performance', authenticate, async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const feuilles = await prisma.feuilleTravail.groupBy({
            by: ['monteurId'],
            _sum: {
                heuresMatin: true,
                heuresApresMidi: true
            },
            where: {
                dateTravail: { gte: startOfMonth }
            },
            orderBy: {
                _sum: {
                    heuresMatin: 'desc' // Tri approximatif, on affinera en JS
                }
            },
            take: 10
        });

        // Récupérer les noms des monteurs
        const performanceData = await Promise.all(feuilles.map(async (f: any) => {
            const monteur = await prisma.monteur.findUnique({
                where: { id: f.monteurId },
                select: { nom: true, prenom: true }
            });

            const totalHeures = (f._sum.heuresMatin || 0) + (f._sum.heuresApresMidi || 0);

            return {
                monteurId: f.monteurId,
                nom: monteur ? `${monteur.prenom} ${monteur.nom}` : 'Inconnu',
                heures: totalHeures
            };
        }));

        // Tri final exact (somme matin+aprem)
        performanceData.sort((a: any, b: any) => b.heures - a.heures);

        res.json({
            success: true,
            data: performanceData.slice(0, 5)
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
