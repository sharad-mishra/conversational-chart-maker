import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import chartRoutes from './src/routes/chartRoutes.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/chart', chartRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`)
})
