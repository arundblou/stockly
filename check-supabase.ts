import { createClient } from '@supabase/supabase-js';

// Supabase URL ve Anahtar değerlerini kontrol et
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? 'Mevcut' : 'Eksik');
console.log('Supabase Key:', supabaseKey ? 'Mevcut' : 'Eksik');

// URL ve Key mevcutsa, bağlantıyı test et
if (supabaseUrl && supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Tablo varlığını kontrol et
  async function checkTables() {
    console.log('Tablolar kontrol ediliyor...');
    
    // personnel_data tablosunu kontrol et
    const { data: personnelData, error: personnelError } = await supabase
      .from('personnel_data')
      .select('*', { count: 'exact', head: true });
      
    if (personnelError) {
      console.error('Personnel_data tablosunda hata:', personnelError.message);
    } else {
      console.log('Personnel_data tablosu mevcut.');
    }
    
    // stock_items tablosunu kontrol et
    const { data: stockData, error: stockError } = await supabase
      .from('stock_items')
      .select('*', { count: 'exact', head: true });
      
    if (stockError) {
      console.error('Stock_items tablosunda hata:', stockError.message);
    } else {
      console.log('Stock_items tablosu mevcut.');
    }
    
    // sales_items tablosunu kontrol et
    const { data: salesData, error: salesError } = await supabase
      .from('sales_items')
      .select('*', { count: 'exact', head: true });
      
    if (salesError) {
      console.error('Sales_items tablosunda hata:', salesError.message);
    } else {
      console.log('Sales_items tablosu mevcut.');
    }
  }
  
  checkTables();
} else {
  console.error('Supabase bağlantısı için gerekli çevre değişkenleri eksik.');
} 