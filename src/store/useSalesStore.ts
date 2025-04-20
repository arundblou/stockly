import { create } from 'zustand';
import { salesService } from '@/lib/sales-service';

export interface SalesItem {
  Marka: string;
  "Ürün Grubu": string;
  "Ürün Kodu": string;
  "Renk Kodu": string;
  Beden: string;
  Envanter: string;
  Sezon: string;
  "Satış Miktarı": number;
  "Satış (VD)": string;
}

interface SalesStore {
  salesData: SalesItem[];
  searchQuery: string;
  filterField: string;
  filterValue: string;
  setSalesData: (data: SalesItem[]) => Promise<void>;
  clearSalesData: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilter: (field: string, value: string) => void;
  getFilteredData: () => SalesItem[];
  loadSalesData: () => Promise<void>;
}

export const useSalesStore = create<SalesStore>((set, get) => ({
  salesData: [],
  searchQuery: '',
  filterField: '',
  filterValue: '',

  setSalesData: async (data) => {
    try {
      await salesService.addSalesItems(data);
      const updatedData = await salesService.getSalesItems();
      set({ salesData: updatedData });
    } catch (error) {
      console.error('Error setting sales data:', error);
      throw error;
    }
  },

  clearSalesData: async () => {
    try {
      await salesService.clearSalesItems();
      set({ salesData: [] });
    } catch (error) {
      console.error('Error clearing sales data:', error);
      throw error;
    }
  },

  loadSalesData: async () => {
    try {
      const data = await salesService.getSalesItems();
      set({ salesData: data });
    } catch (error) {
      console.error('Error loading sales data:', error);
      throw error;
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setFilter: (field, value) => set({ filterField: field, filterValue: value }),

  getFilteredData: () => {
    const { salesData, searchQuery, filterField, filterValue } = get();
    
    let filteredData = [...salesData];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter(item =>
        Object.values(item).some(value =>
          value != null && String(value).toLowerCase().includes(query)
        )
      );
    }

    if (filterField && filterValue) {
      filteredData = filteredData.filter(item => {
        const itemValue = item[filterField as keyof SalesItem];
        return itemValue != null && String(itemValue).toLowerCase().includes(filterValue.toLowerCase());
      });
    }

    return filteredData;
  }
})); 