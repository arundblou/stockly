"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileSpreadsheet, InfoIcon, Loader2, Search, Trash2 } from "lucide-react"
import * as XLSX from 'xlsx'
import { useStockStore } from "@/store/useStockStore"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StockItem } from "@/types/stock"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function StockPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const { 
    stockData,
    setStockData,
    clearStockData,
    searchQuery,
    setSearchQuery,
    filterField,
    filterValue,
    setFilter,
    getFilteredData,
    loadStockData
  } = useStockStore()

  useEffect(() => {
    const logProgress = (message: string) => {
      console.log(message)
      setLoadingMessage(message)
    }

    const fetchStockData = async () => {
      try {
        setIsLoading(true)
        logProgress('Veritabanı ile bağlantı kuruluyor...')
        
        // Konsola ilerleme bilgisi eklemek için bir dinleyici ekleyelim
        const originalConsoleLog = console.log
        console.log = (message, ...args) => {
          originalConsoleLog(message, ...args)
          if (typeof message === 'string' && 
              (message.includes('Toplam kayıt sayısı') || 
               message.includes('Çekilen toplam veri sayısı'))) {
            setLoadingMessage(message)
          }
        }
        
        await loadStockData()
        
        // Konsol fonksiyonunu eski haline getirelim
        console.log = originalConsoleLog
      } catch (error) {
        console.error('Error loading stock data:', error)
        toast.error('Stok verilerini yüklerken bir hata oluştu')
      } finally {
        setIsLoading(false)
        setLoadingMessage('')
      }
    }

    fetchStockData()
  }, [loadStockData])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        setIsLoading(true)
        setLoadingMessage('Excel dosyası okunuyor...')
        const reader = new FileReader()
        
        reader.onload = async (e) => {
          try {
            const data = e.target?.result
            if (!data) {
              throw new Error('Dosya okunamadı')
            }
            
            setLoadingMessage('Excel verisi işleniyor...')
            const workbook = XLSX.read(data, { type: 'binary' })
            const sheetName = workbook.SheetNames[0]
            if (!sheetName) {
              throw new Error('Excel sayfası bulunamadı')
            }
            
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as StockItem[]
            
            if (jsonData.length === 0) {
              throw new Error('Excel dosyası boş veya geçersiz format')
            }
            
            setLoadingMessage(`${jsonData.length} ürün veritabanına kaydediliyor...`)
            await setStockData(jsonData)
            toast.success(`${jsonData.length} ürün başarıyla yüklendi`)
          } catch (error) {
            console.error('Error processing file:', error)
            toast.error(`Excel işlenirken hata oluştu`)
          } finally {
            setIsLoading(false)
            setLoadingMessage('')
          }
        }
        
        reader.onerror = () => {
          toast.error('Dosya okunurken bir hata oluştu')
          setIsLoading(false)
          setLoadingMessage('')
        }
        
        reader.readAsBinaryString(file)
      } catch (error) {
        console.error('Error uploading file:', error)
        toast.error(`Dosya yüklenirken hata oluştu`)
        setIsLoading(false)
        setLoadingMessage('')
      }
    }
    
    // Input'u sıfırla ki aynı dosyayı tekrar seçebilsin
    event.target.value = ''
  }

  const handleClearData = async () => {
    if (window.confirm('Tüm stok verilerini silmek istediğinize emin misiniz?')) {
      try {
        setIsLoading(true)
        setLoadingMessage('Veriler siliniyor...')
        await clearStockData()
        toast.success('Tüm stok verileri başarıyla silindi')
      } catch (error) {
        console.error('Error clearing data:', error)
        toast.error('Veriler silinirken hata oluştu')
      } finally {
        setIsLoading(false)
        setLoadingMessage('')
      }
    }
  }

  const filteredData = getFilteredData()

  const filterOptions = [
    { value: 'none', label: 'Filtre Seçin' },
    { value: 'Marka', label: 'Marka' },
    { value: 'Ürün Grubu', label: 'Ürün Grubu' },
    { value: 'Ürün Kodu', label: 'Ürün Kodu' },
    { value: 'Renk Kodu', label: 'Renk Kodu' },
    { value: 'Beden', label: 'Beden' },
    { value: 'Barkod', label: 'Barkod' },
    { value: 'Sezon', label: 'Sezon' },
  ]

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stok Sorgula</h1>
        <div className="flex gap-2">
          <input
            type="file"
            id="excel-upload"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
          <label htmlFor="excel-upload">
            <Button variant="outline" className="gap-2" asChild disabled={isLoading}>
              <span>
                <FileSpreadsheet className="h-4 w-4" />
                {isLoading ? 'İşlem Yapılıyor...' : 'Excel Dosyası Yükle'}
              </span>
            </Button>
          </label>
          {stockData.length > 0 && (
            <Button
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={handleClearData}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
              {isLoading ? 'İşlem Yapılıyor...' : 'Verileri Temizle'}
            </Button>
          )}
        </div>
      </div>

      {/* Yükleme mesajı */}
      {isLoading && loadingMessage && (
        <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-md flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>{loadingMessage}</p>
        </div>
      )}

      {stockData.length > 0 && (
        <>
          <div className="mb-4 p-4 bg-muted rounded-md flex items-center gap-2">
            <InfoIcon className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm">
                <strong>Toplam Veri:</strong> {stockData.length} ürün
                {searchQuery || filterField ? (
                  <> | <strong>Filtrelenmiş Sonuç:</strong> {filteredData.length} ürün</>
                ) : null}
              </p>
            </div>
          </div>

          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tüm alanlarda ara..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={filterField || 'none'}
                onValueChange={(value: string) => setFilter(value === 'none' ? '' : value as keyof StockItem, filterValue)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtre Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filterField && (
                <Input
                  placeholder="Filtre değeri..."
                  value={filterValue}
                  onChange={(e) => setFilter(filterField, e.target.value)}
                  className="w-[200px]"
                  disabled={isLoading}
                />
              )}
            </div>
          </div>
        </>
      )}

      <Card className="mt-4">
        <ScrollArea className="h-[600px] rounded-md">
          <div className="relative">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[150px]">Marka</TableHead>
                  <TableHead className="w-[150px]">Ürün Grubu</TableHead>
                  <TableHead className="w-[150px]">Ürün Kodu</TableHead>
                  <TableHead className="w-[150px]">Renk Kodu</TableHead>
                  <TableHead className="w-[100px]">Beden</TableHead>
                  <TableHead className="w-[100px]">Envanter</TableHead>
                  <TableHead className="w-[150px]">Barkod</TableHead>
                  <TableHead className="w-[100px]">Sezon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-[450px] text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p>{loadingMessage || 'Veriler yükleniyor...'}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{item.Marka}</TableCell>
                      <TableCell>{item["Ürün Grubu"]}</TableCell>
                      <TableCell>{item["Ürün Kodu"]}</TableCell>
                      <TableCell>{item["Renk Kodu"]}</TableCell>
                      <TableCell>{item.Beden}</TableCell>
                      <TableCell>{item.Envanter}</TableCell>
                      <TableCell>{item.Barkod}</TableCell>
                      <TableCell>{item.Sezon}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-[450px] text-center text-muted-foreground">
                      {stockData.length === 0
                        ? "Excel dosyası yükleyerek stok verilerini görüntüleyebilirsiniz."
                        : "Arama kriterlerine uygun sonuç bulunamadı."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
} 