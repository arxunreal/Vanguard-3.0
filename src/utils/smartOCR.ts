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
  private fallbackService: OCRService | null = null

  constructor() {
    // Initialize OCR.space as PRIMARY service
    const ocrSpace = new OCRSpaceOCR()
    console.log('🔍 OCR.space availability:', ocrSpace.isAvailable())
    
    if (ocrSpace.isAvailable()) {
      this.services.push(ocrSpace)
      console.log('✅ OCR.space configured as primary service')
    } else {
      console.warn('⚠️ OCR.space API key not found in environment')
    }

    // Add other external services as secondary options
    const openAIVision = new OpenAIVisionOCR()
    const googleVision = new GoogleVisionOCR()
    const azureVision = new AzureVisionOCR()

    if (openAIVision.isAvailable()) {
      this.services.push(openAIVision)
    }
    if (googleVision.isAvailable()) {
      this.services.push(googleVision)
    }
    if (azureVision.isAvailable()) {
      this.services.push(azureVision)
    }

    // Only use Tesseract as absolute last resort if NO external services are available
    if (this.services.length === 0) {
      console.warn('⚠️ No external OCR services available, falling back to Tesseract')
      this.fallbackService = {
        name: 'Tesseract.js (Local Fallback)',
        isAvailable: () => true,
        extractText: this.tesseractExtract.bind(this)
      }
    } else {
      console.log(`🎯 ${this.services.length} external OCR service(s) configured`)
    }
  }

  async extractText(imageFile: File): Promise<OCRResult> {
    const startTime = Date.now()
    
    if (this.services.length === 0) {
      throw new Error('No OCR services available. Please configure at least one external OCR service.')
    }
    
    // Try external services in order of preference
    for (const service of this.services) {
      try {
        console.log(`🚀 Using ${service.name} for text extraction...`)
        const text = await service.extractText(imageFile)
        const processingTime = Date.now() - startTime
        
        console.log(`✅ ${service.name} succeeded in ${processingTime}ms`)
        console.log(`📝 Extracted ${text.length} characters`)
        
        // Higher confidence for OCR.space
        const confidence = service.name.includes('OCR.space') ? 0.95 : 0.92
        
        return {
          text,
          confidence,
          service: service.name,
          processingTime
        }
      } catch (error) {
        console.error(`❌ ${service.name} failed:`, error)
        
        // If this is the last service and it failed, throw error
        if (service === this.services[this.services.length - 1]) {
          throw new Error(`All configured OCR services failed. Last error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
        
        continue
      }
    }

    // This should never be reached due to the check above
    throw new Error('No OCR services available')
  }

  private async tesseractExtract(imageFile: File): Promise<string> {
    console.log('🔄 Using Tesseract.js as absolute fallback...')
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
    if (this.fallbackService && this.services.length === 0) {
      available.push(this.fallbackService.name)
    }
    return available
  }

  hasExternalServices(): boolean {
    return this.services.length > 0
  }

  isPrimaryServiceOCRSpace(): boolean {
    return this.services.length > 0 && this.services[0].name.includes('OCR.space')
  }
}

// Export singleton instance
export const smartOCR = new SmartOCRManager()