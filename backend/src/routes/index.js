import express from 'express';
import zoneRoutes from './zones.js';
import userRoutes from './users.js';

const router = express.Router();

router.use('/zones', zoneRoutes);
router.use('/users', userRoutes);

export default router;
