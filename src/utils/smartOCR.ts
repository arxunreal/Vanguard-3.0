import { OCRSpaceOCR, OCRService } from './externalOCR'

export interface OCRResult {
  text: string
  confidence: number
  service: string
  processingTime: number
}

export class SmartOCRManager {
  private services: OCRService[] = []

  constructor() {
    // Initialize OCR.space as the ONLY service
    const ocrSpace = new OCRSpaceOCR()
    console.log('🔍 OCR.space availability:', ocrSpace.isAvailable())
    
    if (ocrSpace.isAvailable()) {
      this.services.push(ocrSpace)
      console.log('✅ OCR.space configured as primary service')
    } else {
      console.warn('⚠️ OCR.space API key not found in environment')
    }

    console.log(`🎯 ${this.services.length} OCR service(s) configured`)
  }

  async extractText(imageFile: File): Promise<OCRResult> {
    const startTime = Date.now()
    
    if (this.services.length === 0) {
      throw new Error('OCR.space service is not available. Please configure the OCR.space API key.')
    }
    
    // Use OCR.space service
    const service = this.services[0]
    try {
      console.log(`🚀 Using ${service.name} for text extraction...`)
      const text = await service.extractText(imageFile)
      const processingTime = Date.now() - startTime
      
      console.log(`✅ ${service.name} succeeded in ${processingTime}ms`)
      console.log(`📝 Extracted ${text.length} characters`)
      
      return {
        text,
        confidence: 0.95,
        service: service.name,
        processingTime
      }
    } catch (error) {
      console.error(`❌ ${service.name} failed:`, error)
      throw new Error(`OCR.space service failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  getAvailableServices(): string[] {
    return this.services.map(s => s.name)
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