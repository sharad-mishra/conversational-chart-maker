import { callGemini } from '../utils/geminiApi.js'

// Basic NLP and fallback chart config generator
function guessChartType(message) {
  const msg = message.toLowerCase()
  if (msg.includes('bar')) return 'bar'
  if (msg.includes('line')) return 'line'
  if (msg.includes('pie')) return 'pie'
  if (msg.includes('scatter')) return 'scatter'
  return 'bar'
}

function guessLabels(message) {
  const msg = message.toLowerCase()
  if (msg.includes('month')) {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
  }
  if (msg.includes('week')) {
    return ['Week 1', 'Week 2', 'Week 3', 'Week 4']
  }
  if (msg.includes('day')) {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  }
  if (msg.includes('demographic')) {
    return ['18-24', '25-34', '35-44', '45-54', '55+']
  }
  if (msg.includes('traffic')) {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  }
  return ['A', 'B', 'C', 'D']
}

function guessData(labels, message) {
  if (message.toLowerCase().includes('sales')) {
    return labels.map(() => Math.floor(Math.random() * 2000) + 1000)
  }
  if (message.toLowerCase().includes('traffic')) {
    return labels.map(() => Math.floor(Math.random() * 10000) + 5000)
  }
  if (message.toLowerCase().includes('demographic')) {
    return labels.map(() => Math.floor(Math.random() * 1000) + 100)
  }
  return labels.map(() => Math.floor(Math.random() * 100) + 10)
}

function tryParseChartConfigFromGemini(response) {
  // Try to extract a Chart.js config object from Gemini's response
  if (!response || !response.candidates || !response.candidates.length) return null;
  const text = response.candidates[0].content.parts[0].text;
  // Try to find a code block with json or js
  const match = text.match(/```(?:json|js)?\s*([\s\S]+?)```/i);
  let jsonStr = match ? match[1] : text;
  try {
    // Try to parse as JSON
    return JSON.parse(jsonStr);
  } catch {
    // Try to eval as JS object (dangerous, but Gemini often returns JS not JSON)
    try {
      // eslint-disable-next-line no-eval
      return eval('(' + jsonStr + ')');
    } catch {
      return null;
    }
  }
}

export async function processChartRequest(message, data) {
  // 1. If data is a full chart.js config (complex input), use it directly
  if (data && data.datasets && Array.isArray(data.datasets)) {
    const type = data.type || guessChartType(message)
    const labels = data.labels || undefined
    const datasets = data.datasets
    const options = data.options || {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: message }
      }
    }
    return {
      type,
      data: { labels, datasets },
      options
    }
  }

  // 2. If data is simple (labels/values or points), use fallback logic
  const type = guessChartType(message)
  let labels, datasetData

  if (data && Array.isArray(data.labels) && Array.isArray(data.values)) {
    labels = data.labels
    datasetData = data.values
    let dataset = {
      label: 'Data',
      data: datasetData,
      backgroundColor: type === 'pie'
        ? ['#36a2eb', '#ff6384', '#ffcd56', '#4bc0c0', '#9966ff', '#ff9f40', '#c9cbcf']
        : '#36a2eb',
      borderColor: type === 'line' ? '#36a2eb' : undefined,
      fill: type === 'line'
    }
    return {
      type,
      data: {
        labels: type === 'scatter' ? undefined : labels,
        datasets: [dataset]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: message }
        }
      }
    }
  }

  // 3. If data is points (scatter), use fallback logic
  if (type === 'scatter' && data && Array.isArray(data.points)) {
    return {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Scatter Data',
          data: data.points,
          backgroundColor: '#36a2eb'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: message }
        }
      }
    }
  }

  // 4. If no file data, try Gemini for advanced prompt-based chart config
  try {
    const geminiPrompt = `
You are an expert chart generator. Given the following user request, generate a valid Chart.js configuration object (not code, just the object) for a React app. 
Respond ONLY with a single JSON object, no explanation, no markdown, no extra text.

User request: "${message}"
`
    const geminiResponse = await callGemini(geminiPrompt)
    const chartConfig = tryParseChartConfigFromGemini(geminiResponse)
    if (chartConfig && chartConfig.type && chartConfig.data && chartConfig.data.datasets) {
      // Add a fallback title if missing
      if (!chartConfig.options) chartConfig.options = {}
      if (!chartConfig.options.plugins) chartConfig.options.plugins = {}
      if (!chartConfig.options.plugins.title) {
        chartConfig.options.plugins.title = { display: true, text: message }
      }
      return chartConfig
    }
  } catch (err) {
    // If Gemini fails, fallback to basic config below
  }

  // 5. Fallback: basic prompt-based configuration
  labels = guessLabels(message)
  datasetData = guessData(labels, message)
  let dataset = {
    label: 'Data',
    data: datasetData,
    backgroundColor: type === 'pie'
      ? ['#36a2eb', '#ff6384', '#ffcd56', '#4bc0c0', '#9966ff', '#ff9f40', '#c9cbcf']
      : '#36a2eb',
    borderColor: type === 'line' ? '#36a2eb' : undefined,
    fill: type === 'line'
  }
  if (type === 'scatter') {
    dataset = {
      label: 'Scatter Data',
      data: Array.from({ length: 10 }, () => ({
        x: Math.floor(Math.random() * 100),
        y: Math.floor(Math.random() * 100)
      })),
      backgroundColor: '#36a2eb'
    }
  }
  return {
    type,
    data: {
      labels: type === 'scatter' ? undefined : labels,
      datasets: [dataset]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: message }
      }
    }
  }
}
