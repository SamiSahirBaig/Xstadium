import express from 'express';
import zoneRoutes from './zones.js';
import userRoutes from './users.js';
import aiRoutes from './ai.js';
import alertRoutes from './alerts.js';

import venueRoutes from './venue.js';

const router = express.Router();

router.use('/zones', zoneRoutes);
router.use('/users', userRoutes);
router.use('/ai', aiRoutes);
router.use('/alerts', alertRoutes);
router.use('/venue', venueRoutes);

export default router;
