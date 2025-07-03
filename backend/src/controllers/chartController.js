import { processChartRequest } from '../services/chartService.js'

export async function generateChartConfig(req, res) {
  try {
    const { message, data } = req.body
    const config = await processChartRequest(message, data)
    res.json({ config })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
