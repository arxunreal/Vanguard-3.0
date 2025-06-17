// External AI OCR services integration
export interface OCRService {
  name: string
  extractText: (imageFile: File) => Promise<string>
  isAvailable: () => boolean
}

// OCR.space API integration
export class OCRSpaceOCR implements OCRService {
  name = 'OCR.space'
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_OCRSPACE_API_KEY || ''
  }

  isAvailable(): boolean {
    return !!this.apiKey
  }

  async extractText(imageFile: File): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('OCR.space API key not configured')
    }

    try {
      const formData = new FormData()
      formData.append('file', imageFile)
      formData.append('apikey', this.apiKey)
      formData.append('language', 'eng')
      formData.append('isOverlayRequired', 'false')
      formData.append('detectOrientation', 'true')
      formData.append('isTable', 'true')
      formData.append('scale', 'true')
      formData.append('OCREngine', '2') // Use OCR Engine 2 for better accuracy

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`OCR.space API error: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.IsErroredOnProcessing) {
        throw new Error(`OCR.space processing error: ${result.ErrorMessage || 'Unknown error'}`)
      }

      if (result.ParsedResults && result.ParsedResults.length > 0) {
        const extractedText = result.ParsedResults[0].ParsedText
        if (extractedText && extractedText.trim()) {
          return extractedText.trim()
        }
      }
      
      throw new Error('No text detected in image')
    } catch (error) {
      console.error('OCR.space error:', error)
      throw error
    }
  }
}

// Google Cloud Vision API integration
export class GoogleVisionOCR implements OCRService {
  name = 'Google Cloud Vision'
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_GOOGLE_VISION_API_KEY || ''
  }

  isAvailable(): boolean {
    return !!this.apiKey
  }

  async extractText(imageFile: File): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Google Vision API key not configured')
    }

    try {
      // Convert file to base64
      const base64Image = await this.fileToBase64(imageFile)
      
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: base64Image
            },
            features: [{
              type: 'TEXT_DETECTION',
              maxResults: 1
            }]
          }]
        })
      })

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.responses?.[0]?.textAnnotations?.[0]?.description) {
        return result.responses[0].textAnnotations[0].description
      }
      
      throw new Error('No text detected in image')
    } catch (error) {
      console.error('Google Vision OCR error:', error)
      throw error
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}

// OpenAI GPT-4 Vision integration
export class OpenAIVisionOCR implements OCRService {
  name = 'OpenAI GPT-4 Vision'
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_OPENAI_API_KEY || ''
  }

  isAvailable(): boolean {
    return !!this.apiKey
  }

  async extractText(imageFile: File): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      const base64Image = await this.fileToBase64(imageFile)
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please extract ALL text from this image. This appears to be feedback notes that may contain structured feedback in formats like:
                - ##Positive## feedback text
                - ##Needs Improvement## feedback text  
                - ##Observational## feedback text
                
                Please preserve the exact formatting and structure. Extract every word, including headers, labels, and feedback content. Be very precise and don't summarize or interpret - just extract the raw text exactly as it appears.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }],
          max_tokens: 4000,
          temperature: 0
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.choices?.[0]?.message?.content) {
        return result.choices[0].message.content.trim()
      }
      
      throw new Error('No text extracted from image')
    } catch (error) {
      console.error('OpenAI Vision OCR error:', error)
      throw error
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}

// Azure Computer Vision integration
export class AzureVisionOCR implements OCRService {
  name = 'Azure Computer Vision'
  private apiKey: string
  private endpoint: string

  constructor(apiKey?: string, endpoint?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_AZURE_VISION_API_KEY || ''
    this.endpoint = endpoint || import.meta.env.VITE_AZURE_VISION_ENDPOINT || ''
  }

  isAvailable(): boolean {
    return !!(this.apiKey && this.endpoint)
  }

  async extractText(imageFile: File): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Azure Vision API key or endpoint not configured')
    }

    try {
      const arrayBuffer = await imageFile.arrayBuffer()
      
      const response = await fetch(`${this.endpoint}/vision/v3.2/read/analyze`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
          'Content-Type': 'application/octet-stream'
        },
        body: arrayBuffer
      })

      if (!response.ok) {
        throw new Error(`Azure Vision API error: ${response.statusText}`)
      }

      const operationLocation = response.headers.get('Operation-Location')
      if (!operationLocation) {
        throw new Error('No operation location returned from Azure')
      }

      // Poll for results
      let result
      let attempts = 0
      const maxAttempts = 30

      do {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const resultResponse = await fetch(operationLocation, {
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey
          }
        })

        if (!resultResponse.ok) {
          throw new Error(`Azure Vision result error: ${resultResponse.statusText}`)
        }

        result = await resultResponse.json()
        attempts++
      } while (result.status === 'running' && attempts < maxAttempts)

      if (result.status !== 'succeeded') {
        throw new Error('Azure Vision analysis failed or timed out')
      }

      // Extract text from results
      let extractedText = ''
      if (result.analyzeResult?.readResults) {
        for (const page of result.analyzeResult.readResults) {
          for (const line of page.lines) {
            extractedText += line.text + '\n'
          }
        }
      }

      return extractedText.trim()
    } catch (error) {
      console.error('Azure Vision OCR error:', error)
      throw error
    }
  }
}