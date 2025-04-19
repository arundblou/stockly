import { create } from 'zustand'
import { StockItem } from '@/types/stock'
import { stockService } from '@/lib/stock-service'

interface StockStore {
  stockData: StockItem[]
  searchQuery: string
  filterField: keyof StockItem | ''
  filterValue: string
  setStockData: (data: StockItem[]) => Promise<void>
  clearStockData: () => Promise<void>
  setSearchQuery: (query: string) => void
  setFilter: (field: keyof StockItem | '', value: string) => void
  getFilteredData: () => StockItem[]
  loadStockData: () => Promise<void>
}

export const useStockStore = create<StockStore>((set, get) => ({
  stockData: [],
  searchQuery: '',
  filterField: '',
  filterValue: '',

  setStockData: async (data) => {
    try {
      await stockService.addStockItems(data)
      const updatedData = await stockService.getStockItems()
      set({ stockData: updatedData })
    } catch (error) {
      console.error('Error setting stock data:', error)
      throw error
    }
  },

  clearStockData: async () => {
    try {
      await stockService.clearStockItems()
      set({ stockData: [] })
    } catch (error) {
      console.error('Error clearing stock data:', error)
      throw error
    }
  },

  loadStockData: async () => {
    try {
      const data = await stockService.getStockItems()
      set({ stockData: data })
    } catch (error) {
      console.error('Error loading stock data:', error)
      throw error
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setFilter: (field, value) => set({ filterField: field, filterValue: value }),

  getFilteredData: () => {
    const { stockData, searchQuery, filterField, filterValue } = get()
    
    let filteredData = [...stockData]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filteredData = filteredData.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(query)
        )
      )
    }

    if (filterField && filterValue) {
      filteredData = filteredData.filter(item =>
        String(item[filterField]).toLowerCase().includes(filterValue.toLowerCase())
      )
    }

    return filteredData
  }
})) 