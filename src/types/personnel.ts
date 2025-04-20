export interface SalesData {
  personelAdi: string;
  marka: string;
  urunKodu: string;
  renkKodu: string;
  satisAdeti: number;
  satisFiyati: number;
}

export interface ExcelRow {
  personelAdi: string | number;
  marka: string | number;
  urunKodu: string | number;
  renkKodu: string | number;
  satisAdeti: string | number;
  satisFiyati: string | number;
} 