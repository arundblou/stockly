import { supabase } from './supabase'
import { SalesData } from '@/types/personnel'

export const personnelService = {
  async addPersonnelData(items: SalesData[]) {
    try {
      // Veri tiplerini kontrol et ve dönüştür
      const formattedItems = items.map(item => ({
        personel_adi: String(item.personelAdi || ''),
        marka: String(item.marka || ''),
        urun_kodu: String(item.urunKodu || ''),
        renk_kodu: String(item.renkKodu || ''),
        satis_adeti: Number(item.satisAdeti) || 0,
        satis_fiyati: Number(item.satisFiyati) || 0
      }))

      // Verileri ekle (çok sayıda kayıt için parçalara bölelim)
      const chunkSize = 500
      const allResults = []

      for (let i = 0; i < formattedItems.length; i += chunkSize) {
        const chunk = formattedItems.slice(i, i + chunkSize)
        const { data, error } = await supabase
          .from('personnel_data')
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
      console.error('Error in addPersonnelData:', error)
      throw error
    }
  },

  async getPersonnelData() {
    try {
      // Toplam kayıt sayısını al
      const { count, error: countError } = await supabase
        .from('personnel_data')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        console.error('Supabase count error:', countError)
        throw new Error(`Kayıt sayısı alınırken hata oluştu: ${countError.message}`)
      }

      const totalCount = count || 0
      console.log(`Toplam personel veri sayısı: ${totalCount}`)

      if (totalCount === 0) return []

      // Parça parça tüm verileri çekelim
      const allItems: SalesData[] = []
      const pageSize = 1000 // Supabase'in varsayılan limiti
      const totalPages = Math.ceil(totalCount / pageSize)

      for (let page = 0; page < totalPages; page++) {
        const from = page * pageSize
        const to = from + pageSize - 1

        const { data, error } = await supabase
          .from('personnel_data')
          .select('*')
          .range(from, to)
          .order('created_at', { ascending: false })

        if (error) {
          console.error(`Supabase error page ${page}:`, error)
          throw new Error(`Veriler alınırken hata oluştu: ${error.message}`)
        }

        if (data && data.length > 0) {
          const formattedData = data.map(item => ({
            personelAdi: item.personel_adi,
            marka: item.marka,
            urunKodu: item.urun_kodu,
            renkKodu: item.renk_kodu,
            satisAdeti: item.satis_adeti,
            satisFiyati: item.satis_fiyati
          })) as SalesData[]
          
          allItems.push(...formattedData)
        }
      }

      console.log(`Çekilen toplam personel veri sayısı: ${allItems.length}`)
      return allItems
    } catch (error) {
      console.error('Error in getPersonnelData:', error)
      throw error
    }
  },

  async clearPersonnelData() {
    try {
      const { error } = await supabase
        .from('personnel_data')
        .delete()
        .neq('id', 0)

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Veriler silinirken hata oluştu: ${error.message}`)
      }
    } catch (error) {
      console.error('Error in clearPersonnelData:', error)
      throw error
    }
  }
} 