import Tesseract from 'tesseract.js'
import { GoogleVisionOCR, OpenAIVisionOCR, AzureVisionOCR, OCRSpaceOCR, OCRService } from './externalOCR'

export interface OCRResult {
  text: string
  confidence: number
  service: string
  processingTime: number
}

export class SmartOCRManager {
  private services: OCRService[] = []
  private fallbackService: OCRService

  constructor() {
    // Initialize external services
    const ocrSpace = new OCRSpaceOCR()
    const googleVision = new GoogleVisionOCR()
    const openAIVision = new OpenAIVisionOCR()
    const azureVision = new AzureVisionOCR()

    // Add available services in order of preference
    // OCR.space first as it's specifically configured
    if (ocrSpace.isAvailable()) {
      this.services.push(ocrSpace)
    }
    if (openAIVision.isAvailable()) {
      this.services.push(openAIVision)
    }
    if (googleVision.isAvailable()) {
      this.services.push(googleVision)
    }
    if (azureVision.isAvailable()) {
      this.services.push(azureVision)
    }

    // Fallback to Tesseract
    this.fallbackService = {
      name: 'Tesseract.js (Local)',
      isAvailable: () => true,
      extractText: this.tesseractExtract.bind(this)
    }
  }

  async extractText(imageFile: File): Promise<OCRResult> {
    const startTime = Date.now()
    
    // Try external services first
    for (const service of this.services) {
      try {
        console.log(`🔍 Trying ${service.name}...`)
        const text = await service.extractText(imageFile)
        const processingTime = Date.now() - startTime
        
        console.log(`✅ ${service.name} succeeded in ${processingTime}ms`)
        
        return {
          text,
          confidence: service.name === 'OCR.space' ? 0.92 : 0.95, // OCR.space gets high confidence
          service: service.name,
          processingTime
        }
      } catch (error) {
        console.warn(`⚠️ ${service.name} failed:`, error)
        continue
      }
    }

    // Fallback to Tesseract
    console.log('🔄 Falling back to Tesseract.js...')
    try {
      const text = await this.fallbackService.extractText(imageFile)
      const processingTime = Date.now() - startTime
      
      return {
        text,
        confidence: 0.7, // Lower confidence for Tesseract
        service: this.fallbackService.name,
        processingTime
      }
    } catch (error) {
      console.error('❌ All OCR services failed:', error)
      throw new Error('Failed to extract text from image using any available service')
    }
  }

  private async tesseractExtract(imageFile: File): Promise<string> {
    const { data: { text, confidence } } = await Tesseract.recognize(imageFile, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`📝 Tesseract Progress: ${Math.round(m.progress * 100)}%`)
        }
      }
    })
    
    console.log(`📊 Tesseract confidence: ${confidence}%`)
    return text.trim()
  }

  getAvailableServices(): string[] {
    const available = this.services.map(s => s.name)
    available.push(this.fallbackService.name)
    return available
  }

  hasExternalServices(): boolean {
    return this.services.length > 0
  }
}

// Export singleton instance
export const smartOCR = new SmartOCRManager()