"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStockStore } from "@/store/useStockStore";
import { useSalesStore } from "@/store/useSalesStore";
import type { StockItem } from "@/types/stock";
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package2, TrendingDown, TrendingUp, AlertCircle, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function DashboardPage() {
  const stockData: StockItem[] = useStockStore((state) => state.stockData);
  const salesData = useSalesStore((state) => state.salesData);
  const [brandFilter, setBrandFilter] = useState("");
  const [productCodeFilter, setProductCodeFilter] = useState("");
  const [showLowStockFilter, setShowLowStockFilter] = useState(false);
  const [showHighStockFilter, setShowHighStockFilter] = useState(false);
  const [showNoStockFilter, setShowNoStockFilter] = useState(false);
  const [highStockBrandFilter, setHighStockBrandFilter] = useState("");
  const [highStockProductCodeFilter, setHighStockProductCodeFilter] = useState("");
  const [noStockBrandFilter, setNoStockBrandFilter] = useState("");
  const [noStockProductCodeFilter, setNoStockProductCodeFilter] = useState("");
  const [showProductGroupFilter, setShowProductGroupFilter] = useState(false);
  const [productGroupNameFilter, setProductGroupNameFilter] = useState("");

  // Toplam stok ve benzersiz ürün sayıları
  const totalInventory = stockData.reduce((sum, item) => sum + (parseInt(item.Envanter) || 0), 0);
  const uniqueProducts = new Set(stockData.map(item => item["Ürün Kodu"])).size;

  // Stok durumu analizleri - Birbirinden bağımsız hesaplamalar
  const lowStock = stockData.filter(item => {
    const stock = parseInt(item.Envanter) || 0;
    return stock >= 1 && stock <= 3;
  });

  const highStock = stockData.filter(item => {
    const stock = parseInt(item.Envanter) || 0;
    return stock >= 4 && stock <= 9;
  });

  const mediumStock = stockData.filter(item => {
    const stock = parseInt(item.Envanter) || 0;
    return stock >= 5 && stock <= 8;
  });

  // Her bir durum için toplam ürün sayısına göre yüzde hesaplama
  const totalProducts = stockData.length;
  const lowStockPercentage = ((lowStock.length / totalProducts) * 100).toFixed(1);
  const highStockPercentage = ((highStock.length / totalProducts) * 100).toFixed(1);
  const mediumStockPercentage = ((mediumStock.length / totalProducts) * 100).toFixed(1);

  // Marka bazında envanter dağılımı - Tüm ürünleri dahil et
  const brandInventory = stockData.reduce((acc, item) => {
    const brand = item.Marka;
    const inventory = parseInt(item.Envanter) || 0;
    acc[brand] = (acc[brand] || 0) + inventory;
    return acc;
  }, {} as Record<string, number>);

  // Marka bazında envanter dağılımı için Nivo formatı
  const pieChartData = Object.entries(brandInventory).map(([brand, total]) => ({
    id: brand,
    label: brand,
    value: total
  }));

  // Sezon bazında dağılım analizi
  const seasonData = stockData.reduce((acc, item) => {
    const season = item.Sezon || 'Belirtilmemiş';
    if (!acc[season]) {
      acc[season] = {
        total: 0,
        brands: {}
      };
    }
    const inventory = parseInt(item.Envanter) || 0;
    acc[season].total += inventory;

    // Marka bazında dağılımı hesapla
    const brand = item.Marka;
    if (!acc[season].brands[brand]) {
      acc[season].brands[brand] = {
        total: 0,
        uniqueProducts: new Set(),
        count: 0
      };
    }
    acc[season].brands[brand].total += inventory;
    acc[season].brands[brand].uniqueProducts.add(item["Ürün Kodu"]);
    acc[season].brands[brand].count = acc[season].brands[brand].uniqueProducts.size;

    return acc;
  }, {} as Record<string, {
    total: number;
    brands: Record<string, { 
      total: number; 
      uniqueProducts: Set<string>;
      count: number;
    }>;
  }>);

  // Sezon analizi için Nivo formatı
  const seasonChartData = Object.entries(seasonData)
    .filter(([season]) => season !== 'Belirtilmemiş')
    .map(([season, data]) => ({
      id: season,
      label: season,
      value: data.total,
      brands: data.brands,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));

  // Sezon bazında ürün grubu dağılımı analizi
  const seasonGroupData = stockData.reduce((acc, item) => {
    const season = item.Sezon || 'Belirtilmemiş';
    const group = item["Ürün Grubu"] || 'Belirtilmemiş';
    
    if (!acc[season]) {
      acc[season] = {
        total: 0,
        groups: {}
      };
    }
    
    if (!acc[season].groups[group]) {
      acc[season].groups[group] = {
        total: 0,
        uniqueProducts: new Set(),
        count: 0
      };
    }
    
    const inventory = parseInt(item.Envanter) || 0;
    acc[season].total += inventory;
    acc[season].groups[group].total += inventory;
    acc[season].groups[group].uniqueProducts.add(item["Ürün Kodu"]);
    acc[season].groups[group].count = acc[season].groups[group].uniqueProducts.size;
    
    return acc;
  }, {} as Record<string, {
    total: number;
    groups: Record<string, { 
      total: number; 
      uniqueProducts: Set<string>;
      count: number;
    }>;
  }>);

  // Sezon bazında grup dağılımı için Nivo formatı
  const seasonGroupChartData = Object.entries(seasonGroupData)
    .filter(([season]) => season !== 'Belirtilmemiş')
    .map(([season, data]) => ({
      id: season,
      label: season,
      value: data.total,
      groups: data.groups,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));

  // Ürün grubu bazında envanter dağılımı
  const productGroupInventory = stockData.reduce((acc, item) => {
    const group = item["Ürün Grubu"] || 'Belirtilmemiş';
    const inventory = parseInt(item.Envanter) || 0;
    
    if (!acc[group]) {
      acc[group] = {
        total: 0,
        uniqueProducts: new Set()
      };
    }
    
    acc[group].total += inventory;
    acc[group].uniqueProducts.add(item["Ürün Kodu"]);
    
    return acc;
  }, {} as Record<string, {
    total: number;
    uniqueProducts: Set<string>;
  }>);

  // Ürün grubu bazında envanter dağılımı için Nivo formatı
  const productGroupPieData = Object.entries(productGroupInventory).map(([group, data]) => ({
    id: group,
    label: group,
    value: data.total,
    uniqueProducts: data.uniqueProducts.size
  }));

  // Marka bazında satış dağılımı analizi
  const brandSalesData = salesData.reduce((acc, item) => {
    const brand = item.Marka;
    let salesAmount = 0;
    
    try {
      if (typeof item["Satış (VD)"] === 'string') {
        salesAmount = parseFloat(item["Satış (VD)"].replace('.', '').replace(',', '.')) || 0;
      } else if (typeof item["Satış (VD)"] === 'number') {
        salesAmount = item["Satış (VD)"];
      }
    } catch (error) {
      console.error("Satış verisi dönüştürülemedi:", item["Satış (VD)"]);
    }

    acc[brand] = (acc[brand] || 0) + salesAmount;
    return acc;
  }, {} as Record<string, number>);

  // Marka bazında satış dağılımı için Nivo formatı
  const brandSalesPieData = Object.entries(brandSalesData).map(([brand, total]) => ({
    id: brand,
    label: brand,
    value: parseFloat(total.toFixed(2))
  }));

  // Sezon bazında satış dağılımı analizi
  const seasonSalesData = salesData.reduce((acc, item) => {
    const season = item.Sezon || 'Belirtilmemiş';
    let salesAmount = 0;
    
    try {
      if (typeof item["Satış (VD)"] === 'string') {
        salesAmount = parseFloat(item["Satış (VD)"].replace('.', '').replace(',', '.')) || 0;
      } else if (typeof item["Satış (VD)"] === 'number') {
        salesAmount = item["Satış (VD)"];
      }
    } catch (error) {
      console.error("Satış verisi dönüştürülemedi:", item["Satış (VD)"]);
    }

    acc[season] = (acc[season] || 0) + salesAmount;
    return acc;
  }, {} as Record<string, number>);

  // Ürün grubu bazında satış dağılımı analizi
  const productGroupSalesData = salesData.reduce((acc, item) => {
    const group = item["Ürün Grubu"] || 'Belirtilmemiş';
    let salesAmount = 0;
    
    try {
      if (typeof item["Satış (VD)"] === 'string') {
        salesAmount = parseFloat(item["Satış (VD)"].replace('.', '').replace(',', '.')) || 0;
      } else if (typeof item["Satış (VD)"] === 'number') {
        salesAmount = item["Satış (VD)"];
      }
    } catch (error) {
      console.error("Satış verisi dönüştürülemedi:", item["Satış (VD)"]);
    }

    acc[group] = (acc[group] || 0) + salesAmount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Stok Yönetim Paneli</h1>
      
      {/* Ana Metrikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Stok</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInventory}</div>
            <p className="text-xs text-muted-foreground">Tüm ürünlerin toplamı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">SKU (stok kodu adet)</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueProducts}</div>
            <p className="text-xs text-muted-foreground">Farklı ürün sayısı</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Düşük Stok</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStock.length}</div>
            <p className="text-xs text-orange-600">Toplam ürünlerin {lowStockPercentage}%'i</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Yüksek Stok</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{highStock.length}</div>
            <p className="text-xs text-green-600">Toplam ürünlerin {highStockPercentage}%'i</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Orta Adetli Stok</CardTitle>
            <Package2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{mediumStock.length}</div>
            <p className="text-xs text-blue-600">Toplam ürünlerin {mediumStockPercentage}%'i</p>
          </CardContent>
        </Card>
      </div>

      {/* Stok Durumu Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-orange-600" />
                Düşük Stok Uyarısı
              </CardTitle>
              <button
                onClick={() => setShowLowStockFilter(!showLowStockFilter)}
                className="p-2 hover:bg-orange-100 rounded-full transition-colors"
              >
                <Filter className={`h-4 w-4 ${showLowStockFilter ? 'text-orange-600' : 'text-gray-400'}`} />
              </button>
            </div>
            {showLowStockFilter && (
              <div className="mt-2 space-y-2">
                <Input
                  placeholder="Marka ara..."
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Ürün kodu ara..."
                  value={productCodeFilter}
                  onChange={(e) => setProductCodeFilter(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full pr-4">
              <div className="space-y-2">
                {lowStock
                  .filter(item => {
                    const brandMatch = !brandFilter || 
                      (item.Marka?.toString().toLowerCase() || "").includes(brandFilter.toLowerCase());
                    const productCodeMatch = !productCodeFilter || 
                      (item["Ürün Kodu"]?.toString().toLowerCase() || "").includes(productCodeFilter.toLowerCase());
                    return brandMatch && productCodeMatch;
                  })
                  .map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <div>
                      <p className="font-medium text-orange-900">{item.Marka}</p>
                      <div className="flex gap-2 text-sm text-orange-600">
                        <span>{item["Ürün Kodu"]}</span>
                        <span>•</span>
                        <span>{item["Ürün Grubu"]}</span>
                      </div>
                      <div className="flex gap-2 text-xs text-orange-500 mt-1">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Renk:</span>
                          {item["Renk Kodu"]}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Beden:</span>
                          {item.Beden}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-orange-100 text-orange-700">
                      {item.Envanter} adet
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Yüksek Stok Bildirimi
              </CardTitle>
              <button
                onClick={() => setShowHighStockFilter(!showHighStockFilter)}
                className="p-2 hover:bg-green-100 rounded-full transition-colors"
              >
                <Filter className={`h-4 w-4 ${showHighStockFilter ? 'text-green-600' : 'text-gray-400'}`} />
              </button>
            </div>
            {showHighStockFilter && (
              <div className="mt-2 space-y-2">
                <Input
                  placeholder="Marka ara..."
                  value={highStockBrandFilter}
                  onChange={(e) => setHighStockBrandFilter(e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Ürün kodu ara..."
                  value={highStockProductCodeFilter}
                  onChange={(e) => setHighStockProductCodeFilter(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full pr-4">
              <div className="space-y-2">
                {highStock
                  .filter(item => {
                    const brandMatch = !highStockBrandFilter || 
                      (item.Marka?.toString().toLowerCase() || "").includes(highStockBrandFilter.toLowerCase());
                    const productCodeMatch = !highStockProductCodeFilter || 
                      (item["Ürün Kodu"]?.toString().toLowerCase() || "").includes(highStockProductCodeFilter.toLowerCase());
                    return brandMatch && productCodeMatch;
                  })
                  .map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div>
                      <p className="font-medium text-green-900">{item.Marka}</p>
                      <div className="flex gap-2 text-sm text-green-600">
                        <span>{item["Ürün Kodu"]}</span>
                        <span>•</span>
                        <span>{item["Ürün Grubu"]}</span>
                      </div>
                      <div className="flex gap-2 text-xs text-green-500 mt-1">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Renk:</span>
                          {item["Renk Kodu"]}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Beden:</span>
                          {item.Beden}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      {item.Envanter} adet
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package2 className="h-5 w-5 text-blue-600" />
                Orta Adetli Stok Listesi
              </CardTitle>
              <button
                onClick={() => setShowNoStockFilter(!showNoStockFilter)}
                className="p-2 hover:bg-blue-100 rounded-full transition-colors"
              >
                <Filter className={`h-4 w-4 ${showNoStockFilter ? 'text-blue-600' : 'text-gray-400'}`} />
              </button>
            </div>
            {showNoStockFilter && (
              <div className="mt-2 space-y-2">
                <Input
                  placeholder="Marka ara..."
                  value={noStockBrandFilter}
                  onChange={(e) => setNoStockBrandFilter(e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Ürün kodu ara..."
                  value={noStockProductCodeFilter}
                  onChange={(e) => setNoStockProductCodeFilter(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full pr-4">
              <div className="space-y-2">
                {mediumStock
                  .filter(item => {
                    const brandMatch = !noStockBrandFilter || 
                      (item.Marka?.toString().toLowerCase() || "").includes(noStockBrandFilter.toLowerCase());
                    const productCodeMatch = !noStockProductCodeFilter || 
                      (item["Ürün Kodu"]?.toString().toLowerCase() || "").includes(noStockProductCodeFilter.toLowerCase());
                    return brandMatch && productCodeMatch;
                  })
                  .map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div>
                      <p className="font-medium text-blue-900">{item.Marka}</p>
                      <div className="flex gap-2 text-sm text-blue-600">
                        <span>{item["Ürün Kodu"]}</span>
                        <span>•</span>
                        <span>{item["Ürün Grubu"]}</span>
                      </div>
                      <div className="flex gap-2 text-xs text-blue-500 mt-1">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Renk:</span>
                          {item["Renk Kodu"]}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Beden:</span>
                          {item.Beden}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700">
                      {item.Envanter} adet
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Marka Bazında Satış Dağılımı</CardTitle>
              <p className="text-sm text-muted-foreground">
                Markaların toplam satış tutarı içindeki payları
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full pr-4">
                <div className="space-y-2">
                  {Object.entries(brandSalesData)
                    .sort(([, a], [, b]) => b - a)
                    .map(([brand, total], index) => {
                      const totalSales = Object.values(brandSalesData).reduce((sum, val) => sum + val, 0);
                      const percentage = ((total / totalSales) * 100).toFixed(1);
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div>
                            <p className="font-medium text-blue-900">{brand}</p>
                            <div className="flex gap-2 text-sm text-blue-600">
                              <span>{total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-blue-100 text-blue-700">
                            %{percentage}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sezon Bazında Satış Dağılımı</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sezonların toplam satış tutarı içindeki payları
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full pr-4">
                <div className="space-y-2">
                  {Object.entries(seasonSalesData)
                    .sort(([, a], [, b]) => b - a)
                    .map(([season, total], index) => {
                      const totalSales = Object.values(seasonSalesData).reduce((sum, val) => sum + val, 0);
                      const percentage = ((total / totalSales) * 100).toFixed(1);
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                          <div>
                            <p className="font-medium text-green-900">{season}</p>
                            <div className="flex gap-2 text-sm text-green-600">
                              <span>{total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-green-100 text-green-700">
                            %{percentage}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ürün Grubu Bazında Satış Dağılımı</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ürün gruplarının toplam satış tutarı içindeki payları
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full pr-4">
                <div className="space-y-2">
                  {Object.entries(productGroupSalesData)
                    .sort(([, a], [, b]) => b - a)
                    .map(([group, total], index) => {
                      const totalSales = Object.values(productGroupSalesData).reduce((sum, val) => sum + val, 0);
                      const percentage = ((total / totalSales) * 100).toFixed(1);
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <div>
                            <p className="font-medium text-purple-900">{group}</p>
                            <div className="flex gap-2 text-sm text-purple-600">
                              <span>{total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-purple-100 text-purple-700">
                            %{percentage}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Marka Bazında Stok Dağılımı</CardTitle>
              <p className="text-sm text-muted-foreground">
                Markaların toplam stok içindeki payları
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsivePie
                  data={pieChartData}
                  margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                  innerRadius={0.6}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  colors={{ scheme: 'nivo' }}
                  borderWidth={1}
                  borderColor={{
                    from: 'color',
                    modifiers: [['darker', 0.2]]
                  }}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor="#333333"
                  arcLinkLabelsThickness={2}
                  arcLinkLabelsColor={{ from: 'color' }}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={{
                    from: 'color',
                    modifiers: [['darker', 2]]
                  }}
                  tooltip={({ datum }) => {
                    const brandProducts = stockData.filter(item => item.Marka === datum.id);
                    const productGroups = brandProducts.reduce((acc, item) => {
                      const group = item["Ürün Grubu"];
                      if (!acc[group]) {
                        acc[group] = {
                          total: 0,
                          uniqueProducts: new Set(),
                          count: 0
                        };
                      }
                      acc[group].total += parseInt(item.Envanter) || 0;
                      acc[group].uniqueProducts.add(item["Ürün Kodu"]);
                      acc[group].count = acc[group].uniqueProducts.size;
                      return acc;
                    }, {} as Record<string, { 
                      total: number; 
                      uniqueProducts: Set<string>;
                      count: number;
                    }>);

                    return (
                      <div className="bg-white p-4 rounded-lg shadow-lg border">
                        <p className="font-medium text-gray-900 mb-2">{datum.id}</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: datum.color }} />
                            <span className="text-sm text-gray-600">Toplam Stok:</span>
                            <span className="text-sm font-medium">{datum.value} adet</span>
                          </div>
                          <div className="text-sm text-gray-600 mt-2 border-t pt-2">
                            <p className="font-medium mb-1">Ürün Grubu Dağılımı:</p>
                            <div className="space-y-1">
                              {Object.entries(productGroups).map(([group, data], index) => (
                                <div key={index} className="flex items-center justify-between">
                                  <span>{group}:</span>
                                  <div className="flex gap-2">
                                    <span className="text-gray-900">{data.total} adet</span>
                                    <span className="text-gray-500">({data.count} çeşit)</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sezon Bazında Stok Dağılımı</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sezonlara göre stok dağılımı
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsivePie
                  data={seasonChartData}
                  margin={{ top: 40, right: 120, bottom: 40, left: 120 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  colors={{ scheme: 'category10' }}
                  borderWidth={1}
                  borderColor={{
                    from: 'color',
                    modifiers: [['darker', 0.2]]
                  }}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor="#333333"
                  arcLinkLabelsThickness={2}
                  arcLinkLabelsColor={{ from: 'color' }}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={{
                    from: 'color',
                    modifiers: [['darker', 2]]
                  }}
                  legends={[
                    {
                      anchor: 'right',
                      direction: 'column',
                      justify: false,
                      translateX: 100,
                      translateY: 0,
                      itemsSpacing: 2,
                      itemWidth: 100,
                      itemHeight: 20,
                      itemDirection: 'left-to-right',
                      itemOpacity: 0.85,
                      symbolSize: 18,
                      symbolShape: 'circle'
                    }
                  ]}
                  tooltip={({ datum }: { datum: any }) => {
                    const brands = datum.data?.brands || {};
                    const totalProducts = Object.entries(brands).reduce((sum, [_, brand]) => sum + (brand as any).count, 0);

                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border min-w-[280px]">
                        {/* Başlık ve Toplam Bilgiler */}
                        <div className="border-b pb-2 mb-2">
                          <p className="font-medium text-gray-900">{datum.id} Sezonu</p>
                          <div className="flex items-center gap-4 text-sm mt-1">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: datum.color }} />
                              <span className="text-gray-600">{datum.value} adet</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-purple-500" />
                              <span className="text-gray-600">{totalProducts} çeşit</span>
                            </div>
                          </div>
                        </div>

                        {/* Marka Dağılımı - Kompakt Liste */}
                        <div className="text-sm space-y-1">
                          {Object.entries(brands)
                            .sort(([, a]: [string, any], [, b]: [string, any]) => b.total - a.total)
                            .map(([brand, data]: [string, any], index) => {
                              const percentage = (data.total / datum.value * 100).toFixed(1);
                              return (
                                <div key={index} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{brand}</span>
                                    <span className="text-xs text-gray-500">({data.count} çeşit)</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-900">{data.total} adet</span>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs py-0 h-4">
                                      %{percentage}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sezon Bazında Grup Dağılımı</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sezonlara göre ürün grubu dağılımı
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsivePie
                  data={seasonGroupChartData}
                  margin={{ top: 40, right: 120, bottom: 40, left: 120 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  colors={{ scheme: 'category10' }}
                  borderWidth={1}
                  borderColor={{
                    from: 'color',
                    modifiers: [['darker', 0.2]]
                  }}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor="#333333"
                  arcLinkLabelsThickness={2}
                  arcLinkLabelsColor={{ from: 'color' }}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={{
                    from: 'color',
                    modifiers: [['darker', 2]]
                  }}
                  legends={[
                    {
                      anchor: 'right',
                      direction: 'column',
                      justify: false,
                      translateX: 100,
                      translateY: 0,
                      itemsSpacing: 2,
                      itemWidth: 100,
                      itemHeight: 20,
                      itemDirection: 'left-to-right',
                      itemOpacity: 0.85,
                      symbolSize: 18,
                      symbolShape: 'circle'
                    }
                  ]}
                  tooltip={({ datum }: { datum: any }) => {
                    const groups = datum.data?.groups || {};
                    const totalProducts = Object.entries(groups).reduce((sum, [_, group]) => sum + (group as any).count, 0);

                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border min-w-[280px]">
                        {/* Başlık ve Toplam Bilgiler */}
                        <div className="border-b pb-2 mb-2">
                          <p className="font-medium text-gray-900">{datum.id} Sezonu</p>
                          <div className="flex items-center gap-4 text-sm mt-1">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: datum.color }} />
                              <span className="text-gray-600">{datum.value} adet</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-purple-500" />
                              <span className="text-gray-600">{totalProducts} çeşit</span>
                            </div>
                          </div>
                        </div>

                        {/* Grup Dağılımı - Kompakt Liste */}
                        <div className="text-sm space-y-1">
                          {Object.entries(groups)
                            .sort(([, a]: [string, any], [, b]: [string, any]) => b.total - a.total)
                            .map(([group, data]: [string, any], index) => {
                              const percentage = (data.total / datum.value * 100).toFixed(1);
                              return (
                                <div key={index} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{group}</span>
                                    <span className="text-xs text-gray-500">({data.count} çeşit)</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-900">{data.total} adet</span>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs py-0 h-4">
                                      %{percentage}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package2 className="h-5 w-5 text-purple-600" />
                  Ürün Grubu Bazında Stok Listesi
                </CardTitle>
                <button
                  onClick={() => setShowProductGroupFilter(!showProductGroupFilter)}
                  className="p-2 hover:bg-purple-100 rounded-full transition-colors"
                >
                  <Filter className={`h-4 w-4 ${showProductGroupFilter ? 'text-purple-600' : 'text-gray-400'}`} />
                </button>
              </div>
              {showProductGroupFilter && (
                <div className="mt-2 space-y-2">
                  <Input
                    placeholder="Ürün grubu ara..."
                    value={productGroupNameFilter}
                    onChange={(e) => setProductGroupNameFilter(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full pr-4">
                <div className="space-y-2">
                  {productGroupPieData
                    .filter(group => {
                      const nameMatch = !productGroupNameFilter || 
                        group.id.toLowerCase().includes(productGroupNameFilter.toLowerCase());
                      return nameMatch;
                    })
                    .sort((a, b) => b.value - a.value)
                    .map((group, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <div>
                        <p className="font-medium text-purple-900">{group.id}</p>
                        <div className="flex gap-2 text-sm text-purple-600">
                          <span>{group.value} adet stok</span>
                          <span>•</span>
                          <span>{group.uniqueProducts} çeşit ürün</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-purple-100 text-purple-700">
                        %{((group.value / stockData.reduce((sum, item) => sum + (parseInt(item.Envanter) || 0), 0)) * 100).toFixed(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 