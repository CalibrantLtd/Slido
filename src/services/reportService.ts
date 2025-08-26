import { openDB } from 'idb'

interface ReportDB {
  reports: {
    key: string
    value: Report
  }
}

export interface Report {
  id: string
  name: string
  templateId: string
  templateName: string
  portfolioId: string
  portfolioName: string
  bounceId: string
  bounceName: string
  createdAt: Date
  pptData: Blob
  slideImages?: string[]
}

class ReportService {
  private db: any = null

  async initDB(): Promise<void> {
    if (this.db) return

    this.db = await openDB<ReportDB>('reports-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('reports')) {
          const store = db.createObjectStore('reports', { keyPath: 'id' })
          store.createIndex('templateId', 'templateId')
          store.createIndex('createdAt', 'createdAt')
        }
      },
    })
  }

  async saveReport(report: Omit<Report, 'id' | 'createdAt'>): Promise<string> {
    try {
      await this.initDB()
      
      const reportWithId: Report = {
        ...report,
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date()
      }

      await this.db!.put('reports', reportWithId)
      return reportWithId.id
    } catch (error) {
      console.error('Error saving report:', error)
      throw error
    }
  }

  async getAllReports(): Promise<Report[]> {
    try {
      await this.initDB()
      
      const reports = await this.db!.getAll('reports')
      return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      console.error('Error loading reports:', error)
      throw error
    }
  }

  async getReportById(id: string): Promise<Report | undefined> {
    await this.initDB()
    
    return await this.db!.get('reports', id)
  }

  async deleteReport(id: string): Promise<void> {
    await this.initDB()
    
    await this.db!.delete('reports', id)
  }

  async getReportsByTemplate(templateId: string): Promise<Report[]> {
    await this.initDB()
    
    const reports = await this.db!.getAllFromIndex('reports', 'templateId', templateId)
    return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

}

export const reportService = new ReportService()
