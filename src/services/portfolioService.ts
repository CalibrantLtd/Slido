import { api } from './api'
import axios from 'axios'

export interface Portfolio {
  id: string
  name: string
  type?: string
  tree?: any
}

export interface Bounce {
  id: string
  name: string
  isFormal: boolean
  date: string
  user: string
  parent_id?: string
  displayName?: string
}

export interface PortfolioListResponse {
  portfolios: Portfolio[]
  mirrored_portfolio: any[]
  draft_list: { [portfolioId: string]: Bounce[] }
}

class PortfolioService {
  async fetchPortfolios(): Promise<PortfolioListResponse> {
    try {
      const response = await api.get('portfolio/list_portfolio')
      return response.data.data
    } catch (error) {
      throw new Error('Failed to fetch portfolios')
    }
  }

  extractBouncesFromTree(tree: any): Bounce[] {
    const bounces: Bounce[] = []
    
    if (!tree) return bounces
    
    const processNode = (node: any) => {
      if (node.name && node.nodeID) {
        const parsed = this.parseBounceName(node.name)
        bounces.push({
          id: node.nodeID,
          name: node.name,
          isFormal: parsed.isFormal,
          date: parsed.date,
          user: parsed.user,
          displayName: parsed.displayName,
          parent_id: node.parent_id
        })
      }
      
      if (node.val && node.val.name && node.val.nodeID) {
        const parsed = this.parseBounceName(node.val.name)
        bounces.push({
          id: node.val.nodeID,
          name: node.val.name,
          isFormal: parsed.isFormal,
          date: parsed.date,
          user: parsed.user,
          displayName: parsed.displayName,
          parent_id: node.parent_id
        })
      }
      
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => processNode(child))
      }
    }
    
    processNode(tree)
    return bounces
  }

  /**
   * Parse bounce name to extract information
   */
  parseBounceName(bounceName: string): {
    isFormal: boolean
    date: string
    user: string
    displayName: string
  } {
    try {
      const parts = bounceName.split('-')
      
      if (parts[0] === 'DRAFT') {
        // Draft format: DRAFT-YYYYMMDD-USER-DisplayName
        return {
          isFormal: false,
          date: parts[1] || '',
          user: parts[2] || '',
          displayName: parts[3] || bounceName
        }
      } else {
        // Check if any part contains 'F' (formal indicator)
        const isFormal = parts.some(part => part.includes('F'))
        
        if (isFormal) {
          // Formal format: YYYYMM-YYYYMMDDHHMMSSF-USER-DisplayName
          return {
            isFormal: true,
            date: parts[0] || '',
            user: parts[2] || '',
            displayName: parts[3] || bounceName
          }
        } else {
          // Non-formal format: YYYYMM-YYYYMMDDHHMMSS-USER-DisplayName
          return {
            isFormal: false,
            date: parts[0] || '',
            user: parts[2] || '',
            displayName: parts[3] || bounceName
          }
        }
      }
    } catch (error) {
      return {
        isFormal: false,
        date: '',
        user: '',
        displayName: bounceName
      }
    }
  }


  formatDate(dateString: string): string {
    try {
      if (dateString.length === 8) {
        // Format: YYYYMMDD
        const year = dateString.slice(0, 4)
        const month = dateString.slice(4, 6)
        const day = dateString.slice(6, 8)
        return `${day}/${month}/${year}`
      } else if (dateString.length === 6) {
        // Format: YYYYMM
        const year = dateString.slice(0, 4)
        const month = dateString.slice(4, 6)
        return `${month}/${year}`
      }
      return dateString
    } catch {
      return dateString
    }
  }


  async getBouncesForPortfolio(portfolioId: string, portfolios: Portfolio[]): Promise<Bounce[]> {
    const allBounces: Bounce[] = []
    
    const portfolio = portfolios.find(p => p.id === portfolioId)
    
    if (portfolio && portfolio.tree) {
      // Get formal bounces from portfolio tree data
      const formalBounces = this.extractBouncesFromTree(portfolio.tree)
      allBounces.push(...formalBounces)
    }
    
    return allBounces
  }

  /**
   * Fetch complete portfolio data for a specific bounce
   */
  async fetchCompletePortfolioData(portfolioId: string, bounceId: string): Promise<any> {
    try {
      const response = await api.get('portfolio/load-portfolio', {
        params: {
          bounce_id: bounceId
        }
      })
      
      const portfolioData = response.data.data
      
      // Fetch the dictionary separately (same as main app)
      let dictionary = {}
      if (portfolioData.signed_dictionary) {
        try {
          // Use a separate axios instance without credentials for public URLs
          const dictResponse = await axios.get(portfolioData.signed_dictionary, {
            withCredentials: false
          })
          dictionary = dictResponse.data
        } catch (dictError) {
          console.warn('Could not fetch dictionary (CORS issue expected):', dictError)
        }
      }
      
      // Create normaliseSelection array (same logic as main app)
      const claimsNature = portfolioData.parameters?.claims_nature || ['ATTRITIONAL', 'LARGE']
      const normaliseSelection: boolean[] = []
      for (let i = 0; i < claimsNature.length - 1; i++) {
        normaliseSelection.push(true)
      }
      
      // Transform to match the expected PortfolioData structure (same as main app's storeCurrentPortfolio)
      return {
        portfolioId: portfolioId,
        portfolioName: '', // Will be set from portfolio list
        bounceId: bounceId,
        bounceName: '', // Will be parsed from bounce name
        bounceDate: '', // Will be parsed from bounce name
        bounceFullName: '', // Will be set from bounce name
        timestamp: Date.now(),
        currentMonth: portfolioData.current_month || '',
        selectedLineSize: portfolioData.parameters?.line_size?.[0] || '',
        uwAcc: 'uw',
        includeProjections: false, // Default value
        yearsOfProjections: 0, // Default value
        isAve: false, // Default value
        claimsNature: claimsNature,
        exposure: portfolioData.parameters?.exposure || [
          { name: 'Total Risk Count', method: 'sum' },
          { name: 'Average GWP', method: 'average' }
        ],
        normaliseSelection: normaliseSelection,
        filterOptions: dictionary,
        parameters: {
          claims_nature: claimsNature,
          exposure: portfolioData.parameters?.exposure || [
            { name: 'Total Risk Count', method: 'sum' },
            { name: 'Average GWP', method: 'average' }
          ],
          // Include other parameters that might be needed
          ...portfolioData.parameters
        }
      }
    } catch (error) {
      console.error('Error fetching complete portfolio data:', error)
      throw new Error(`Failed to fetch portfolio data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export const portfolioService = new PortfolioService()
