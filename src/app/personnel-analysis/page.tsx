"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ResponsivePie } from "@nivo/pie";
import { Package2, Upload, Loader2, InfoIcon } from "lucide-react";
import { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { personnelService } from "@/lib/personnel-service";
import { SalesData, ExcelRow } from "@/types/personnel";

export default function PersonnelAnalysisPage() {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Verileri yükle
  useEffect(() => {
    const logProgress = (message: string) => {
      console.log(message);
      setLoadingMessage(message);
    };

    const fetchPersonnelData = async () => {
      try {
        setIsLoading(true);
        logProgress('Veritabanı ile bağlantı kuruluyor...');
        
        // Konsola ilerleme bilgisi eklemek için bir dinleyici ekleyelim
        const originalConsoleLog = console.log;
        console.log = (message, ...args) => {
          originalConsoleLog(message, ...args);
          if (typeof message === 'string' && 
              (message.includes('Toplam personel veri sayısı') || 
               message.includes('Çekilen toplam personel veri sayısı'))) {
            setLoadingMessage(message);
          }
        };
        
        const data = await personnelService.getPersonnelData();
        setSalesData(data);
        
        // Konsol fonksiyonunu eski haline getirelim
        console.log = originalConsoleLog;
      } catch (error) {
        console.error('Error loading personnel data:', error);
        toast.error('Personel verilerini yüklerken bir hata oluştu');
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
    };

    fetchPersonnelData();
  }, []);

  // Excel dosyasını işleme fonksiyonu
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setIsLoading(true);
        setLoadingMessage('Excel dosyası okunuyor...');
        
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = e.target?.result;
            if (!data) {
              throw new Error('Dosya okunamadı');
            }
            
            setLoadingMessage('Excel verisi işleniyor...');
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            if (!sheetName) {
              throw new Error('Excel sayfası bulunamadı');
            }
            
            const worksheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];
            
            if (rawData.length === 0) {
              throw new Error('Excel dosyası boş veya geçersiz format');
            }
            
            // Verileri doğru formata dönüştür
            const formattedData = rawData.map(row => ({
              personelAdi: String(row.personelAdi || ''),
              marka: String(row.marka || ''),
              urunKodu: String(row.urunKodu || ''),
              renkKodu: String(row.renkKodu || ''),
              satisAdeti: Number(row.satisAdeti) || 0,
              satisFiyati: Number(row.satisFiyati) || 0
            }));

            setLoadingMessage(`${formattedData.length} personel verisi veritabanına ekleniyor...`);
            await personnelService.addPersonnelData(formattedData);
            const updatedData = await personnelService.getPersonnelData();
            setSalesData(updatedData);
            toast.success(`${formattedData.length} personel kaydı başarıyla yüklendi`);
          } catch (error) {
            console.error('Error processing file:', error);
            toast.error(`Excel işlenirken hata oluştu`);
          } finally {
            setIsLoading(false);
            setLoadingMessage('');
          }
        };
        
        reader.onerror = () => {
          toast.error('Dosya okunurken bir hata oluştu');
          setIsLoading(false);
          setLoadingMessage('');
        };
        
        reader.readAsBinaryString(file);
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(`Dosya yüklenirken hata oluştu`);
        setIsLoading(false);
        setLoadingMessage('');
      }
    }
    
    // Input'u sıfırla ki aynı dosyayı tekrar seçebilsin
    event.target.value = '';
  };

  // Verileri temizleme fonksiyonu
  const handleClearData = async () => {
    if (window.confirm('Tüm personel verileri silinecek. Emin misiniz?')) {
      try {
        setIsLoading(true);
        setLoadingMessage('Veriler siliniyor...');
        await personnelService.clearPersonnelData();
        setSalesData([]);
        toast.success('Tüm personel verileri başarıyla silindi');
      } catch (error) {
        console.error('Error clearing data:', error);
        toast.error('Veriler silinirken hata oluştu');
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
    }
  };

  // İstatistikleri hesaplama
  const statistics = {
    totalSales: salesData.reduce((sum, item) => sum + (Number(item.satisFiyati) || 0), 0),
    totalQuantity: salesData.reduce((sum, item) => sum + (Number(item.satisAdeti) || 0), 0),
    topBrand: (() => {
      const brandCounts = salesData.reduce((acc, item) => {
        const count = Number(item.satisAdeti) || 0;
        acc[item.marka] = (acc[item.marka] || 0) + count;
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(brandCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || '-';
    })(),
  };

  // Marka bazlı satış dağılımı
  const brandDistribution = salesData.reduce((acc, item) => {
    acc[item.marka] = (acc[item.marka] || 0) + item.satisAdeti;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(brandDistribution)
    .filter(([brand, count]) => brand && count > 0)
    .map(([brand, count]) => ({
      id: brand,
      label: brand,
      value: count
    }));

  // Personel bazlı satış performansı
  const personnelPerformance = salesData.reduce((acc, item) => {
    const personelAdi = item.personelAdi;
    if (!acc[personelAdi]) {
      acc[personelAdi] = {
        totalSales: 0,
        totalQuantity: 0
      };
    }
    acc[personelAdi].totalSales += Number(item.satisFiyati) || 0;
    acc[personelAdi].totalQuantity += Number(item.satisAdeti) || 0;
    return acc;
  }, {} as Record<string, { totalSales: number; totalQuantity: number }>);

  const performanceBarData = Object.entries(personnelPerformance)
    .filter(([name, data]) => name && (data.totalSales > 0 || data.totalQuantity > 0))
    .map(([name, data]) => ({
      name,
      "Satış Tutarı": Math.round(data.totalSales * 100) / 100,
      "Satış Adedi": data.totalQuantity
    }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Personel Analiz Raporu</h1>
        <div className="flex gap-4">
          <input
            id="fileInput"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
          <Button onClick={() => document.getElementById('fileInput')?.click()} disabled={isLoading}>
            <Upload className="mr-2 h-4 w-4" />
            {isLoading ? 'İşlem Yapılıyor...' : 'Excel Yükle'}
          </Button>
          {salesData.length > 0 && (
            <Button variant="destructive" onClick={handleClearData} disabled={isLoading}>
              <Package2 className="mr-2 h-4 w-4" />
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

      {/* Veri istatistik bilgisi */}
      {salesData.length > 0 && (
        <div className="mb-4 p-4 bg-muted rounded-md flex items-center gap-2">
          <InfoIcon className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-sm">
              <strong>Toplam Veri:</strong> {salesData.length} personel kaydı
            </p>
          </div>
        </div>
      )}

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Toplam Satış Tutarı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="text-2xl font-bold">
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
                  .format(statistics.totalSales)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Toplam Satış Adedi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="text-2xl font-bold">{statistics.totalQuantity}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">En Çok Satan Marka</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="text-2xl font-bold">{statistics.topBrand}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Marka Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-muted-foreground">{loadingMessage || 'Yükleniyor...'}</p>
                </div>
              ) : pieData.length > 0 ? (
                <ResponsivePie
                  data={pieData}
                  margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  colors={{ scheme: 'paired' }}
                  borderWidth={1}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor="#333333"
                  arcLinkLabelsThickness={2}
                  arcLinkLabelsColor={{ from: 'color' }}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                  tooltip={({ datum }) => (
                    <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200">
                      <div className="font-bold mb-2">{datum.label}</div>
                      <div className="text-sm mb-1">
                        Toplam Satış: {new Intl.NumberFormat('tr-TR').format(datum.value)} adet
                      </div>
                      <div className="text-sm text-primary font-medium">
                        Oran: {((datum.value / statistics.totalQuantity) * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                  legends={[
                    {
                      anchor: 'bottom',
                      direction: 'row',
                      justify: false,
                      translateY: 56,
                      itemsSpacing: 0,
                      itemWidth: 100,
                      itemHeight: 18,
                      itemTextColor: '#999',
                      itemDirection: 'left-to-right',
                      itemOpacity: 1,
                      symbolSize: 18,
                      symbolShape: 'circle'
                    }
                  ]}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Veri yüklenmedi
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Satış Tutarı Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-muted-foreground">{loadingMessage || 'Yükleniyor...'}</p>
                </div>
              ) : performanceBarData.length > 0 ? (
                <div className="space-y-3">
                  {(() => {
                    const totalAmount = performanceBarData.reduce((sum, item) => sum + item["Satış Tutarı"], 0);
                    return performanceBarData
                      .sort((a, b) => b["Satış Tutarı"] - a["Satış Tutarı"])
                      .map((item, index) => {
                        const percentage = (item["Satış Tutarı"] / totalAmount) * 100;
                        return (
                          <div
                            key={index}
                            className="relative p-4 bg-secondary/5 rounded-lg hover:bg-secondary/10 transition-colors"
                          >
                            {/* Progress bar arka planı */}
                            <div 
                              className="absolute left-0 top-0 h-full bg-primary/5 rounded-lg transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                            
                            {/* İçerik */}
                            <div className="relative flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                  <span className="text-sm font-bold">{index + 1}</span>
                                </div>
                                <div>
                                  <h3 className="font-medium">{item.name}</h3>
                                  <div className="text-sm text-muted-foreground">
                                    {new Intl.NumberFormat('tr-TR').format(item["Satış Adedi"])} adet satış
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2">
                                  <div className="text-xl font-bold text-green-600">
                                    {new Intl.NumberFormat('tr-TR', { 
                                      style: 'currency', 
                                      currency: 'TRY',
                                      maximumFractionDigits: 0 
                                    }).format(item["Satış Tutarı"])}
                                  </div>
                                  <div className="text-sm font-semibold text-primary">
                                    {percentage.toFixed(1)}%
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Ortalama: {new Intl.NumberFormat('tr-TR', { 
                                    style: 'currency', 
                                    currency: 'TRY',
                                    maximumFractionDigits: 0 
                                  }).format(item["Satış Tutarı"] / item["Satış Adedi"])} / adet
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Veri yüklenmedi
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Satış Adedi Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-muted-foreground">{loadingMessage || 'Yükleniyor...'}</p>
                  </div>
                ) : performanceBarData.length > 0 ? (
                  <ResponsivePie
                    data={performanceBarData.map(item => ({
                      id: item.name,
                      label: item.name,
                      value: item["Satış Adedi"],
                      personelData: salesData.reduce((acc, sale) => {
                        if (sale.personelAdi === item.name) {
                          if (!acc[sale.marka]) {
                            acc[sale.marka] = 0;
                          }
                          acc[sale.marka] += sale.satisAdeti;
                        }
                        return acc;
                      }, {} as Record<string, number>)
                    }))}
                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    colors={{ scheme: 'paired' }}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#333333"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                    tooltip={({ datum }) => (
                      <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200">
                        <div className="font-bold mb-2">{datum.label}</div>
                        <div className="text-sm mb-1">Toplam Satış: {new Intl.NumberFormat('tr-TR').format(datum.value)}</div>
                        <div className="border-t border-gray-200 mt-2 pt-2">
                          <div className="font-semibold mb-1">Marka Bazlı Dağılım:</div>
                          {Object.entries(datum.data.personelData).map(([marka, adet]) => (
                            <div key={marka} className="flex justify-between text-sm">
                              <span>{marka}:</span>
                              <span className="ml-4 font-medium">{new Intl.NumberFormat('tr-TR').format(adet)} adet</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    legends={[
                      {
                        anchor: 'bottom',
                        direction: 'row',
                        justify: false,
                        translateY: 56,
                        itemsSpacing: 0,
                        itemWidth: 100,
                        itemHeight: 18,
                        itemTextColor: '#999',
                        itemDirection: 'left-to-right',
                        itemOpacity: 1,
                        symbolSize: 18,
                        symbolShape: 'circle'
                      }
                    ]}
                    valueFormat={value => 
                      new Intl.NumberFormat('tr-TR').format(value)
                    }
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Veri yüklenmedi
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>En Çok Satan 5 Marka</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-muted-foreground">{loadingMessage || 'Yükleniyor...'}</p>
                  </div>
                ) : Object.keys(brandDistribution).length > 0 ? (
                  <div className="space-y-3">
                    {(() => {
                      const sortedBrands = Object.entries(brandDistribution)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5);

                      return sortedBrands.map(([brand, quantity], index) => {
                        const percentage = (quantity / statistics.totalQuantity) * 100;
                        const brandDetails = salesData.filter(sale => sale.marka === brand).reduce((acc, sale) => {
                          acc.totalAmount += sale.satisFiyati;
                          if (!acc.personelSales[sale.personelAdi]) {
                            acc.personelSales[sale.personelAdi] = 0;
                          }
                          acc.personelSales[sale.personelAdi] += sale.satisAdeti;
                          return acc;
                        }, { totalAmount: 0, personelSales: {} as Record<string, number> });

                        const topSeller = Object.entries(brandDetails.personelSales)
                          .sort(([,a], [,b]) => b - a)[0];

                        return (
                          <div
                            key={brand}
                            className="relative p-4 bg-secondary/5 rounded-lg hover:bg-secondary/10 transition-colors"
                          >
                            {/* Progress bar arka planı */}
                            <div 
                              className="absolute left-0 top-0 h-full bg-primary/5 rounded-lg transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                            
                            {/* İçerik */}
                            <div className="relative flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                  <span className="text-sm font-bold">{index + 1}</span>
                                </div>
                                <div>
                                  <h3 className="font-medium">{brand}</h3>
                                  <div className="text-sm text-muted-foreground">
                                    En çok satan: {topSeller?.[0]} ({new Intl.NumberFormat('tr-TR').format(topSeller?.[1] || 0)} adet)
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2">
                                  <div className="text-xl font-bold text-green-600">
                                    {new Intl.NumberFormat('tr-TR').format(quantity)} adet
                                  </div>
                                  <div className="text-sm font-semibold text-primary">
                                    {percentage.toFixed(1)}%
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Ciro: {new Intl.NumberFormat('tr-TR', { 
                                    style: 'currency', 
                                    currency: 'TRY',
                                    maximumFractionDigits: 0 
                                  }).format(brandDetails.totalAmount)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Veri yüklenmedi
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 