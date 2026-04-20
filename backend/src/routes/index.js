import express from 'express';
import zoneRoutes from './zones.js';
import userRoutes from './users.js';
import aiRoutes from './ai.js';

const router = express.Router();

router.use('/zones', zoneRoutes);
router.use('/users', userRoutes);
router.use('/ai', aiRoutes);

export default router;
