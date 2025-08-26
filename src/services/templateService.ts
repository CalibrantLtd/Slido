import { nanoid } from 'nanoid'

interface TemplateData {
  id?: string
  name: string
  slides: any[]
  metadata?: {
    createdAt: string
    updatedAt: string
    version: string
    author?: string
  }
}

class TemplateService {
  private dbName = 'SlidoTemplates'
  private version = 2

  constructor() {
    this.initDatabase()
  }

  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const oldVersion = event.oldVersion
        
        // Handle database migrations
        if (oldVersion < 1) {
          // Initial version - create templates store
          if (!db.objectStoreNames.contains('templates')) {
            const store = db.createObjectStore('templates', { keyPath: 'id' })
            store.createIndex('name', 'name', { unique: false })
            store.createIndex('createdAt', 'metadata.createdAt', { unique: false })
          }
        }
        
        if (oldVersion < 2) {
          // Version 2 - add any new stores or indexes here
          // For now, just ensure templates store exists
          if (!db.objectStoreNames.contains('templates')) {
            const store = db.createObjectStore('templates', { keyPath: 'id' })
            store.createIndex('name', 'name', { unique: false })
            store.createIndex('createdAt', 'metadata.createdAt', { unique: false })
          }
        }
      }
    })
  }

  async saveTemplate(templateData: Omit<TemplateData, 'id' | 'metadata'>): Promise<TemplateData> {
    // Deep clone and serialize the slides to remove Vue reactivity
    const serializedSlides = JSON.parse(JSON.stringify(templateData.slides))
    
    const template: TemplateData = {
      id: `template_${nanoid(10)}`,
      name: templateData.name,
      slides: serializedSlides,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0'
      }
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['templates'], 'readwrite')
        const store = transaction.objectStore('templates')
        
        const addRequest = store.add(template)
        
        addRequest.onsuccess = () => {
          console.log('Template saved to database:', template.id)
          resolve(template)
        }
        addRequest.onerror = () => reject(addRequest.error)
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async loadTemplates(): Promise<TemplateData[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['templates'], 'readonly')
        const store = transaction.objectStore('templates')
        const index = store.index('createdAt')
        
        const getAllRequest = index.openCursor(null, 'prev') // Sort by newest first
        const templates: TemplateData[] = []
        
        getAllRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor) {
            templates.push(cursor.value)
            cursor.continue()
          } else {
            resolve(templates)
          }
        }
        
        getAllRequest.onerror = () => reject(getAllRequest.error)
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  // Load specific template by ID
  async loadTemplate(templateId: string): Promise<TemplateData | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['templates'], 'readonly')
        const store = transaction.objectStore('templates')
        
        const getRequest = store.get(templateId)
        
        getRequest.onsuccess = () => resolve(getRequest.result || null)
        getRequest.onerror = () => reject(getRequest.error)
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async updateTemplate(templateId: string, templateData: Partial<TemplateData>): Promise<boolean> {
    const existingTemplate = await this.loadTemplate(templateId)
    if (!existingTemplate) return false

    // Deep clone and serialize slides if they exist in templateData
    const serializedSlides = templateData.slides 
      ? JSON.parse(JSON.stringify(templateData.slides))
      : existingTemplate.slides

    const updatedTemplate = {
      ...existingTemplate,
      ...templateData,
      slides: serializedSlides,
      metadata: {
        ...existingTemplate.metadata,
        updatedAt: new Date().toISOString()
      }
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['templates'], 'readwrite')
        const store = transaction.objectStore('templates')
        
        const putRequest = store.put(updatedTemplate)
        
        putRequest.onsuccess = () => {
          resolve(true)
        }
        putRequest.onerror = () => reject(putRequest.error)
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['templates'], 'readwrite')
        const store = transaction.objectStore('templates')
        
        const deleteRequest = store.delete(templateId)
        
        deleteRequest.onsuccess = () => {
          console.log('Template deleted:', templateId)
          resolve(true)
        }
        deleteRequest.onerror = () => reject(deleteRequest.error)
      }
      
      request.onerror = () => reject(request.error)
    })
  }
}

// Export singleton instance
export const templateService = new TemplateService()
export default TemplateService