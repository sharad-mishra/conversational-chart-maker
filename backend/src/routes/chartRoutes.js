import { Router } from 'express'
import { generateChartConfig } from '../controllers/chartController.js'

const router = Router()

router.post('/generate', generateChartConfig)

export default router
