import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4">404 - Sayfa Bulunamadı</h1>
      <p className="text-lg mb-6">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
      <Link 
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
} 