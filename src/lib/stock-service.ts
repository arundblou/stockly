import { supabase } from './supabase'
import { StockItem } from '@/types/stock'

export const stockService = {
  async addStockItems(items: StockItem[]) {
    try {
      // Veri tiplerini kontrol et ve dönüştür
      const formattedItems = items.map(item => ({
        marka: String(item.Marka || ''),
        urun_grubu: String(item["Ürün Grubu"] || ''),
        urun_kodu: String(item["Ürün Kodu"] || ''),
        renk_kodu: String(item["Renk Kodu"] || ''),
        beden: String(item.Beden || ''),
        envanter: String(item.Envanter || ''),
        barkod: String(item.Barkod || ''),
        sezon: String(item.Sezon || '')
      }))

      // Verileri ekle (çok sayıda kayıt için parçalara bölelim)
      const chunkSize = 500
      const allResults = []

      for (let i = 0; i < formattedItems.length; i += chunkSize) {
        const chunk = formattedItems.slice(i, i + chunkSize)
        const { data, error } = await supabase
          .from('stock_items')
          .insert(chunk)
          .select()

        if (error) {
          console.error('Supabase error:', error)
          throw new Error(`Veri eklenirken hata oluştu: ${error.message}`)
        }

        if (data) {
          allResults.push(...data)
        }
      }

      return allResults
    } catch (error) {
      console.error('Error in addStockItems:', error)
      throw error
    }
  },

  async getStockItems() {
    try {
      // Toplam kayıt sayısını al
      const { count, error: countError } = await supabase
        .from('stock_items')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        console.error('Supabase count error:', countError)
        throw new Error(`Kayıt sayısı alınırken hata oluştu: ${countError.message}`)
      }

      const totalCount = count || 0
      console.log(`Toplam kayıt sayısı: ${totalCount}`)

      if (totalCount === 0) return []

      // Parça parça tüm verileri çekelim
      const allItems: StockItem[] = []
      const pageSize = 1000 // Supabase'in varsayılan limiti
      const totalPages = Math.ceil(totalCount / pageSize)

      for (let page = 0; page < totalPages; page++) {
        const from = page * pageSize
        const to = from + pageSize - 1

        const { data, error } = await supabase
          .from('stock_items')
          .select('*')
          .range(from, to)
          .order('created_at', { ascending: false })

        if (error) {
          console.error(`Supabase error page ${page}:`, error)
          throw new Error(`Veriler alınırken hata oluştu: ${error.message}`)
        }

        if (data && data.length > 0) {
          const formattedData = data.map(item => ({
            Marka: item.marka,
            "Ürün Grubu": item.urun_grubu,
            "Ürün Kodu": item.urun_kodu,
            "Renk Kodu": item.renk_kodu,
            Beden: item.beden,
            Envanter: item.envanter,
            Barkod: item.barkod,
            Sezon: item.sezon
          })) as StockItem[]
          
          allItems.push(...formattedData)
        }
      }

      console.log(`Çekilen toplam veri sayısı: ${allItems.length}`)
      return allItems
    } catch (error) {
      console.error('Error in getStockItems:', error)
      throw error
    }
  },

  async clearStockItems() {
    try {
      const { error } = await supabase
        .from('stock_items')
        .delete()
        .neq('id', 0)

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Veriler silinirken hata oluştu: ${error.message}`)
      }
    } catch (error) {
      console.error('Error in clearStockItems:', error)
      throw error
    }
  }
} 