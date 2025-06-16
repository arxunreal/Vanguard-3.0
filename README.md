# Vanguard Feedback System

A modern, AI-powered feedback collection system for Vanguard candidates with advanced text extraction capabilities.

## Features

- **Modern UI/UX**: Beautiful, responsive design with smooth animations
- **AI-Powered OCR**: Multiple AI services for accurate text extraction from images
- **Smart Text Parsing**: Automatically parse structured feedback from extracted text
- **Real-time Analytics**: Visual feedback statistics and progress tracking
- **Secure Database**: Supabase integration with row-level security

## AI Text Extraction

The system supports multiple AI services for optimal text recognition:

### Supported Services (in order of preference):
1. **OpenAI GPT-4 Vision** (Recommended) - Best for handwritten text and complex layouts
2. **Google Cloud Vision API** - Excellent for printed text and documents
3. **Azure Computer Vision** - Alternative enterprise option
4. **Tesseract.js** - Local fallback (no API key required)

### Setup Instructions

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd vanguard-feedback
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Configure your environment variables in `.env`:
   ```env
   # Supabase (Required)
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # AI Services (Optional - for enhanced OCR)
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_GOOGLE_VISION_API_KEY=your_google_vision_api_key
   VITE_AZURE_VISION_API_KEY=your_azure_vision_api_key
   VITE_AZURE_VISION_ENDPOINT=your_azure_vision_endpoint
   ```

3. **Database Setup**
   - Click "Connect to Supabase" in the app
   - The database schema will be automatically created

4. **Start Development**
   ```bash
   npm run dev
   ```

## AI Service Setup

### OpenAI GPT-4 Vision (Recommended)
1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to `.env`: `VITE_OPENAI_API_KEY=sk-...`
3. Best for: Handwritten text, complex layouts, mixed content

### Google Cloud Vision
1. Create project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Vision API
3. Create API key
4. Add to `.env`: `VITE_GOOGLE_VISION_API_KEY=...`
5. Best for: Printed text, documents, high accuracy

### Azure Computer Vision
1. Create resource in [Azure Portal](https://portal.azure.com/)
2. Get API key and endpoint
3. Add to `.env`:
   ```
   VITE_AZURE_VISION_API_KEY=...
   VITE_AZURE_VISION_ENDPOINT=https://...
   ```
4. Best for: Enterprise environments, batch processing

## Supported Text Formats

The system automatically parses various feedback formats:

```
##Positive## Great leadership skills shown during the session
##Needs Improvement## Could work on time management
##Observational## Actively participated in group discussions

#Good# Excellent communication
[Bad] Needs to focus more
Positive: Shows great empathy
**Observational** Takes initiative well
```

## Usage

1. **Select Candidate**: Choose from the candidate list
2. **Choose Class Type**: Inside Class (modules) or Outside Class
3. **Add Feedback**: 
   - Manual entry, or
   - Upload image with AI text extraction
4. **Review Analytics**: View feedback statistics and trends

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **3D Graphics**: Three.js, React Three Fiber
- **Database**: Supabase (PostgreSQL)
- **AI/OCR**: OpenAI GPT-4V, Google Vision, Azure CV, Tesseract.js
- **Build Tool**: Vite

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## License

This project is licensed under the MIT License.