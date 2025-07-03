import axios from 'axios'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function callGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not set in environment variables')
  }
  const headers = {
    'Content-Type': 'application/json'
  }
  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  }
  const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`
  const response = await axios.post(url, body, { headers })
  return response.data
}
