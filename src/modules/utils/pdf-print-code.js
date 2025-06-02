//pdf-print-code.js
function deferPDFButtonInit() {
    // PDF buton eklemeyi defer et
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(addPDFButtons, 100);
        });
    } else {
        setTimeout(addPDFButtons, 100);
    }
}

// BONUS: Memory optimization
function optimizeTableMemory() {
    // Büyük tablolarda garbage collection'ı tetikle
    if (performance.memory && performance.memory.usedJSHeapSize > 50000000) { // 50MB
        console.log('Memory cleanup yapılıyor...');
        // Force garbage collection (dev tools'da çalışır)
        if (window.gc) window.gc();
    }
}


// Tüm liste sayfaları için PDF önizleme butonu ekleyen ana fonksiyon
function initPrintButtons() {
    // Her sayfa için butonları ekle
    addPreviewButtonTo('sarf-malzeme-listesi', 'sarfMalzemeTable', 'Sarf Malzeme Listesi');
    addPreviewButtonTo('hammadde-listesi', 'hammaddeTable', 'Hammadde Listesi');
    addPreviewButtonTo('yari-mamul-listesi', 'yariMamulTable', 'Yarı Mamul Listesi');
    addPreviewButtonTo('ikincil-stoklar', 'ikincilStokTable', 'İkincil Stok Listesi');
    
    console.log('Tüm sayfalara PDF Görüntüle butonları eklendi');
  }
  
  // Belirtilen sayfaya PDF önizleme butonu ekleyen fonksiyon
  function addPreviewButtonTo(pageId, tableId, pageTitle) {
    // Sayfa elementini bul
    const page = document.getElementById(pageId);
    if (!page) {
      console.log(`${pageId} sayfası bulunamadı, düğme eklenemedi`);
      return;
    }
    
    // Mevcut arama çubuğunu bul
    const searchBar = page.querySelector('.search-bar');
    
    if (!searchBar) {
      console.log(`${pageId} sayfasında arama çubuğu elementi bulunamadı`);
      return;
    }
    
    // Eğer buton zaten varsa çık
    if (searchBar.querySelector('#preview-button-' + pageId)) {
      return;
    }
    
    // PDF Önizleme butonu oluştur
    const previewButton = document.createElement('button');
    previewButton.id = 'preview-button-' + pageId;
    previewButton.className = 'preview-button';
    previewButton.innerHTML = '<i class="fas fa-file-pdf"></i> PDF Görüntüle';
    previewButton.onclick = function() {
      prepareAndPreviewTable(tableId, pageTitle);
    };
    
    // Butonu arama çubuğuna ekle
    const searchRow = searchBar.querySelector('.search-row');
    if (searchRow) {
      searchRow.appendChild(previewButton);
    } else {
      searchBar.appendChild(previewButton);
    }
    
    console.log(`${pageTitle} sayfasına PDF Görüntüle butonu eklendi`);
  }


// Kodu hemen çalıştır
(function() {
  // 1. Mevcut tüm PDF butonlarını temizle
  function cleanAllPdfButtons() {
    // Tüm PDF butonlarını bul (tüm olası sınıf adlarını kontrol et)
    const allButtons = document.querySelectorAll('.preview-button, .hammadde-pdf-button, button[id*="pdf"], button[id*="preview"]');
    
    // Her butonu kaldır
    allButtons.forEach(button => {
      console.log('Buton kaldırıldı:', button.id || button.className);
      button.remove();
    });
    
    console.log('Tüm PDF butonları temizlendi');
  }

  // İlk olarak mevcut butonları temizle
  cleanAllPdfButtons();
  
  // Tab değişimini dinle
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('tab-button') || 
        event.target.closest('.tab-button')) {
      // Önce butonları temizle
      setTimeout(function() {
        cleanAllPdfButtons();
      }, 200);
    }
  });
  
  console.log('Hammadde butonu temizleme kodu çalıştı');
})();


  function addPreviewButtonTo(pageId, tableId, pageTitle) {
    // Sayfa elementini bul
    const page = document.getElementById(pageId);
    if (!page) {
      console.log(`${pageId} sayfası bulunamadı, düğme eklenemedi`);
      return;
    }
    
    // Mevcut arama çubuğunu bul
    const searchBar = page.querySelector('.search-bar');
    
    if (!searchBar) {
      console.log(`${pageId} sayfasında arama çubuğu elementi bulunamadı`);
      return;
    }
    
    // Eğer buton zaten varsa çık
    if (searchBar.querySelector('#preview-button-' + pageId)) {
      return;
    }
    
    // PDF Önizleme butonu oluştur
    const previewButton = document.createElement('button');
    previewButton.id = 'preview-button-' + pageId;
    previewButton.className = 'preview-button';
    previewButton.innerHTML = '<i class="fas fa-file-pdf"></i> PDF Görüntüle';
    previewButton.onclick = function() {
      prepareAndPreviewTable(tableId, pageTitle);
    };
    
    // Butonu arama çubuğuna ekle
    const searchRow = searchBar.querySelector('.search-row');
    if (searchRow) {
      searchRow.appendChild(previewButton);
    } else {
      searchBar.appendChild(previewButton);
    }
    
    console.log(`${pageTitle} sayfasına PDF Görüntüle butonu eklendi`);
  }
  


  function prepareAndPreviewTable(tableId, pageTitle) {
  try {
    // Tabloyu kontrol et
    const tableEl = document.getElementById(tableId);
    if (!tableEl) {
      showToast('Görüntülenecek tablo bulunamadı', 'error');
      return;
    }
    
    // Sadece görünür satırları al (filtreleme yapılmışsa)
    const visibleRows = Array.from(tableEl.querySelectorAll('tbody tr')).filter(row => {
      return row.style.display !== 'none';
    });
    
    if (visibleRows.length === 0) {
      showToast('Görüntülenecek veri bulunamadı', 'warning');
      return;
    }
    
    // Tablo türüne göre doğru filtreleme elementlerini bul
    if (tableId === 'sarfMalzemeTable') {
      searchText = document.getElementById('sarfMalzemeAra')?.value || '';
      statusFilter = document.getElementById('sarfMalzemeDurumSecimi')?.value || '';
    } else if (tableId === 'hammaddeTable') {
      searchText = document.getElementById('hammaddeAra')?.value || '';
      statusFilter = document.getElementById('hammaddeDurumSecimi')?.value || '';
    } else if (tableId === 'yariMamulTable') {
      searchText = document.getElementById('yariMamulAra')?.value || '';
      statusFilter = document.getElementById('yariMamulDurumSecimi')?.value || '';
    } else if (tableId === 'ikincilStokTable') {
      searchText = document.getElementById('ikincilStokAra')?.value || '';
      statusFilter = document.getElementById('ikincilStokDurumSecimi')?.value || '';
    }
    
    // Tablo türüne göre uygun sütunları belirle
    const columnMap = getColumnMapForTable(tableId);
    
    // Tablo başlıklarını al
    const headerRow = tableEl.querySelector('thead tr');
    const headers = columnMap.map(index => {
      const header = headerRow.cells[index];
      return header ? header.textContent.trim() : '??';
    });
    
    // PDF HTML içeriğini oluştur
    const pdfContent = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <title>${pageTitle} - PDF Önizleme</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <!-- Google Fonts - Temel yazı tipleri -->
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
        <!-- jsPDF ve html2canvas kütüphaneleri -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js"></script>
        <style>
          body {
            font-family: 'Open Sans', 'Roboto', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f0f0f0;
            font-size: 12px;
            line-height: 1.4;
            -webkit-text-size-adjust: 100%;
          }
          
          /* Metin seçilebilme özelliği - önemli! */
          * {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
            cursor: text;
          }
          
          /* PDF içeriğini seçilebilir hale getir */
          body, table, td, th, div, p, span {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
          }
          
          /* A4 boyutu ayarları: 210mm x 297mm (dikey/portrait) */
          .pdf-content {
            width: 210mm;
            min-height: 297mm;
            padding: 10mm 20mm;
            margin: 10mm auto;
            background-color: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            position: relative;
            box-sizing: border-box;
          }
          
          .pdf-header {
            display: flex;
            justify-content: flex-start; /* Sola yasla */
            align-items: center;
            margin-top: 15px; /* Üstten boşluk ekledim */
            margin-bottom: 15px;
            padding: 10px 25px; /* Sağdan soldan daha fazla iç boşluk */
            background-color: #6A0C0D;
            color: white;
            border-radius: 4px;
            width: calc(100% - 10px); /* Tabloyla aynı genişlikte olması için */
            margin-left: auto; /* Ortalamak için */
            margin-right: auto; /* Ortalamak için */
            height: 65px; /* Yüksekliği sabitleyerek logoyu tam sığdır */
          }
          
          .pdf-logo {
            max-width: 120px;
            max-height: 45px;
          }
          
          .header-text {
            text-align: right;
            font-weight: 600;
          }
          
          .table-title {
            font-size: 16px; /* Boyutu küçülttüm */
            font-weight: bold;
            margin-bottom: 15px; /* Üst başlık ile arasındaki boşluğu azalttım */
            color: #6A0C0D;
            text-align: left; /* Sola yasla */
            padding: 5px 0;
            border-bottom: 1px solid #eee;
          }
          
          .pdf-table-wrapper {
            overflow-x: auto;
          }
          
          .pdf-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            table-layout: auto;
          }
          
          /* Kalan sütunu için genişlik */
          .pdf-table th.kalan-column, .pdf-table td.kalan-column {
            min-width: 70px; /* Kalan sütununa minimum genişlik */
            width: 15%; /* Toplam genişliğin %15'i */
          }
          
          /* Stok Kodu sütunu için genişlik */
          .pdf-table th.stok-kodu-column, .pdf-table td.stok-kodu-column {
            min-width: 80px; /* Stok Kodu sütununa minimum genişlik */
            width: 15%; /* Toplam genişliğin %15'i */
          }
          
          .pdf-table th {
            background-color: #f2f2f2;
            text-align: left;
            padding: 8px;
            border: 1px solid #ddd;
            font-weight: bold;
            font-size: 11px;
          }
          
          .pdf-table td {
            padding: 6px 8px;
            border: 1px solid #ddd;
            font-size: 11px;
            vertical-align: top;
          }
          
          .pdf-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          .pdf-footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 8px;
            position: absolute;
            bottom: 15mm;
            left: 20mm;
            right: 20mm;
            line-height: 1.5;
          }
          
          .status-stokta-var {
            color: #28a745;
            font-weight: bold;
          }
          
          .status-az-kaldi {
            color: #ffc107;
            font-weight: bold;
          }
          
          .status-stokta-yok {
            color: #dc3545;
            font-weight: bold;
          }
          
          .print-actions {
            text-align: center;
            margin: 20px 0;
            position: sticky;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            padding: 10px;
            border-top: 1px solid #eee;
          }
          
          .print-actions button {
            background-color: #6A0D0C;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 0 5px;
            font-size: 13px;
            transition: background-color 0.2s;
            font-family: 'Noto Sans TR', sans-serif;
          }
          
          .print-actions button:hover {
            background-color: #8B1411;
          }
          
          .page-counter {
            position: absolute;
            bottom: 5mm;
            right: 20mm;
            font-size: 10px;
            color: #666;
          }
          
          /* Orta kaynağa sahip tablo hücreleri */
          .pdf-table td.center, .pdf-table th.center {
            text-align: center;
          }
          
          /* Sayısal değerler için sağa yaslı hücreler */
          .pdf-table td.numeric, .pdf-table th.numeric {
            text-align: right;
          }
          
          /* Yazdırma için stil ayarları */
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm 0;
            }
            
            body {
              background-color: white;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .pdf-content {
              width: 100%;
              height: auto;
              padding: 10mm 20mm;
              margin: 0;
              box-shadow: none;
            }
            
            .print-actions {
              display: none;
            }
  
            .pdf-header {
              background-color: #6A0C0D !important;
              color: white !important;
              margin-top: 15px !important; /* Üstten boşluğu yazdırırken de koru */
              width: calc(100% - 10px) !important; /* Tabloyla aynı genişlikte olması için */
              height: 85px !important; /* Yüksekliği sabitleyerek logoyu tam sığdır */
            }
            
            .pdf-table th {
              background-color: #f2f2f2 !important;
            }
            
            .pdf-table tr:nth-child(even) {
              background-color: #f9f9f9 !important;
            }
            
            /* PDF'te metin seçmeyi koruyalım */
            * {
              -webkit-user-select: text !important;
              -moz-user-select: text !important;
              -ms-user-select: text !important;
              user-select: text !important;
            }
            
            /* Sayfa sonlarında tabloyu bölme durumu */
            .pdf-table {
              page-break-inside: auto;
            }
            
            .pdf-table tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            
            .pdf-table thead {
              display: table-header-group;
            }
            
            .pdf-footer {
              position: fixed;
              bottom: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="pdf-content">
          <div class="pdf-header">
            <img src="../../logo/karatas-makine-logo.png" alt="Karataş Makine Logo" class="pdf-logo">
          </div>
          
          <div class="table-title">${pageTitle}</div>
          
          <div class="pdf-table-wrapper">
            <table class="pdf-table">
              <thead>
                <tr>
                  ${headers.map((header, idx) => {
                    // Miktar, fiyat gibi sayısal sütunlar için sağa yaslama
                    const isNumeric = header.toLowerCase().includes('miktar') || 
                                    header.toLowerCase().includes('fiyat') || 
                                    header.toLowerCase().includes('tutar') ||
                                    header.toLowerCase().includes('kalan');
                    
                    // Kalan sütunu sınıfını ekle
                    const isKalan = header.toLowerCase().includes('kalan');
                    
                    // Stok Kodu sütunu sınıfını ekle
                    const isStokKodu = header.toLowerCase().includes('stok kodu') || 
                                      header.toLowerCase().includes('stok') &&
                                      header.toLowerCase().includes('kodu');
                    
                    const classes = `${isNumeric ? 'numeric' : ''} ${isKalan ? 'kalan-column' : ''} ${isStokKodu ? 'stok-kodu-column' : ''}`;
                    
                    return `<th class="${classes}">${header}</th>`;
                  }).join('')}
                </tr>
              </thead>
              <tbody>
                ${visibleRows.map(row => {
                  // Sadece istenen sütunları al
                  return `
                    <tr>
                      ${columnMap.map((colIndex, idx) => {
                        const cellContent = row.cells[colIndex].textContent;
                        // Miktar, fiyat gibi sayısal hücreler için sağa yaslama
                        const isNumeric = headers[idx].toLowerCase().includes('miktar') || 
                                        headers[idx].toLowerCase().includes('fiyat') || 
                                        headers[idx].toLowerCase().includes('tutar') ||
                                        headers[idx].toLowerCase().includes('kalan');
                        
                        // Kalan sütunu sınıfını ekle
                        const isKalan = headers[idx].toLowerCase().includes('kalan');
                        
                        // Stok Kodu sütunu sınıfını ekle
                        const isStokKodu = headers[idx].toLowerCase().includes('stok kodu') || 
                                          (headers[idx].toLowerCase().includes('stok') &&
                                          headers[idx].toLowerCase().includes('kodu'));
                        
                        const classes = `${isNumeric ? 'numeric' : ''} ${isKalan ? 'kalan-column' : ''} ${isStokKodu ? 'stok-kodu-column' : ''}`;
                        
                        return `<td class="${classes}">${cellContent}</td>`;
                      }).join('')}
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="pdf-footer">
            <p>© ${new Date().getFullYear()} Karataş Makine - Tüm Hakları Saklıdır</p>
          </div>
          
          <div class="page-counter">Sayfa 1</div>
          
          <div class="print-actions">
            <button onclick="generateSeachablePDF()">PDF Olarak İndir</button>
            <button onclick="generateExcel()" style="background-color: #1D6F42;">Excel Oluştur</button>
             <button onclick="window.close()">Kapat</button>
          </div>
        </div>
        
        <script>
         
          // jsPDF ile metinlerin seçilebilir olduğu PDF oluşturma
          function generateSeachablePDF() {
            // Önce logoyu al ve base64 formatına dönüştür
            const logoImage = document.querySelector('.pdf-logo');
            
            // Logo yüklenmeden önce işlem yapma
            if (!logoImage || !logoImage.complete) {
              alert('Logo yükleniyor, lütfen biraz bekleyin ve tekrar deneyin.');
              return;
            }
            
            // Canvas kullanarak logoyu base64 formatına dönüştür
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = logoImage.naturalWidth;
            canvas.height = logoImage.naturalHeight;
            ctx.drawImage(logoImage, 0, 0);
            const logoBase64 = canvas.toDataURL('image/png');
            
            // jsPDF'i global değişkenden al
            const { jsPDF } = window.jspdf;
            
            // Tablo verilerini al
            const table = document.querySelector('.pdf-table');
            const tableHeader = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
            
            const tableRows = [];
            table.querySelectorAll('tbody tr').forEach(row => {
              const rowData = [];
              row.querySelectorAll('td').forEach(cell => {
                rowData.push(cell.textContent.trim());
              });
              tableRows.push(rowData);
            });
            
            try {
              // PDF dökümanı oluştur - A4 boyutunda ve dikey (portrait)
              const doc = new jsPDF({
                orientation: 'portrait', 
                unit: 'mm',
                format: 'a4',
                putOnlyUsedFonts: true,
                floatPrecision: 16
              });
              
              // PDF meta bilgilerini ayarla
              doc.setProperties({
                title: '${pageTitle}',
                subject: 'Karataş Makine - ${pageTitle}',
                author: 'Karataş Makine',
                keywords: 'stok, rapor, karataş makine',
                creator: 'Karataş Makine Stok Takip Sistemi'
              });
              
              // Türkçe karakterleri düzgün işlemek için
              const cleanSpecialChars = (text) => {
                return text
                  .replace(/ı/g, 'i')
                  .replace(/İ/g, 'I')
                  .replace(/ğ/g, 'g')
                  .replace(/Ğ/g, 'G')
                  .replace(/ü/g, 'u')
                  .replace(/Ü/g, 'U')
                  .replace(/ş/g, 's')
                  .replace(/Ş/g, 'S')
                  .replace(/ç/g, 'c')
                  .replace(/Ç/g, 'C')
                  .replace(/ö/g, 'o')
                  .replace(/Ö/g, 'O');
              };
              
              // Tabloları Türkçe karakterler olmadan hazırla
              const cleanTableHeader = tableHeader.map(header => cleanSpecialChars(header));
              const cleanTableRows = tableRows.map(row => 
                row.map(cell => cleanSpecialChars(cell))
              );
              
              // Sayfa genişliğini al - birçok hesaplama için kullanılacak
              const pageWidth = doc.internal.pageSize.getWidth();
              
              // İlk sayfada logo ekle
              try {
                // Kırmızı başlık arka planı - kenarlardan boşluk bırakarak
                const headerWidth = pageWidth - 10; // Kenarlardan 5mm boşluk bırak (daha az boşluk)
                const headerLeft = 5; // Soldan boşluk (daha az boşluk)
                
                // Kırmızı şerit için yükseklik ve konum ayarlaması
                const headerHeight = 20; // Yüksekliği 20mm olarak ayarlandı
                const headerTop = 5; // Üstten mesafe (daha az boşluk)
                
                doc.setFillColor(106, 12, 13); // #6A0C0D
                doc.rect(headerLeft, headerTop, headerWidth, headerHeight, 'F'); 
                
                // Logo ekle - boyut ve konum ayarlaması
                const logoWidth = 30; // Logo genişliği
                const logoHeight = logoWidth * (logoImage.naturalHeight / logoImage.naturalWidth);
                // Logo konumu şerit içine tam sığacak şekilde ayarlandı
                const logoX = headerLeft + 5; // Şeritten 5mm içeride
                const logoY = headerTop + (headerHeight - logoHeight) / 2; // Şerit içinde dikey olarak ortalandı
                
                doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
                
              } catch (e) {
                console.error("Logo eklenirken hata:", e);
                // Hata durumunda devam et, sadece kırmızı şerit göster
                const headerWidth = pageWidth - 10;
                const headerLeft = 5;
                
                doc.setFillColor(106, 12, 13); // #6A0C0D
                doc.rect(headerLeft, 5, headerWidth, 20, 'F');
              }
              
              // PDF başlığı - liste adı için ayarlar
              doc.setFontSize(12); // Daha küçük başlık boyutu
              doc.setTextColor(106, 12, 13); // #6A0C0D
              
              // Başlık ve tablo arasındaki boşluğu azalt
              const titleY = 31; // Başlık Y konumu (daha az boşluk)
              doc.text(cleanSpecialChars('${pageTitle}'), 6, titleY, {align: 'left'});
              
              // Başlık altına ince çizgi ekle - başlık ve tablo arasına görsel ayrım
              doc.setDrawColor(220, 220, 220); // Açık gri çizgi rengi
              doc.setLineWidth(0.2);
              doc.line(5, titleY + 2, pageWidth - 5, titleY + 2);
              
              // Tablo oluştur - başlık sonrası daha az boşlukla
              doc.autoTable({
                head: [cleanTableHeader],
                body: cleanTableRows,
                startY: titleY + 5, // Başlıktan 5mm sonra tablo başlasın (boşluk azaltıldı)
                theme: 'grid',
                margin: { left: 5, right: 5, top: 5, bottom: 20 }, // Daha az kenar boşluğu
                headStyles: {
                  fillColor: [242, 242, 242],
                  textColor: [50, 50, 50],
                  fontStyle: 'bold',
                  halign: 'left',
                  font: 'helvetica',
                  fontSize: 9, // Tablo başlık font boyutu
                },
                styles: {
                  fontSize: 9,
                  cellPadding: 2, // Hücre iç boşluğu azaltıldı (daha kompakt tablo)
                  lineColor: [200, 200, 200],
                  lineWidth: 0.1,
                  font: 'helvetica',
                  overflow: 'linebreak'
                },
                // Sayısal sütunları sağa hizala ve Kalan sütununu genişlet
                columnStyles: (() => {
                  const styles = {};
                  tableHeader.forEach((header, index) => {
                    if (header.toLowerCase().includes('miktar') || 
                        header.toLowerCase().includes('fiyat') || 
                        header.toLowerCase().includes('tutar') ||
                        header.toLowerCase().includes('kalan')) {
                      styles[index] = {halign: 'right'};
                    }
                    
                    // Kalan sütununa ek genişlik ver
                    if (header.toLowerCase().includes('kalan')) {
                      styles[index] = {
                        ...styles[index],
                        cellWidth: 25 // mm cinsinden genişlik
                      };
                    }
                    
                    // Stok Kodu sütununa ek genişlik ver
                    if (header.toLowerCase().includes('stok kodu') || 
                      (header.toLowerCase().includes('stok') && 
                        header.toLowerCase().includes('kodu'))) {
                      styles[index] = {
                        ...styles[index],
                        cellWidth: 25 // mm cinsinden genişlik - daha da geniş
                      };
                    }
                  });
                  return styles;
                })(),
                // Türkçe karakter sorunu için encoding ayarı
                willDrawCell: function(data) {
                  // Burada özel bir işlem yapılmıyor
                },
                didDrawPage: function(data) {
                  // Sayfa alt bilgisi
                  doc.setFontSize(8);
                  doc.setTextColor(100, 100, 100);
                  const pageHeight = doc.internal.pageSize.getHeight();
                  
                  const footerText = '© ' + new Date().getFullYear() + ' Karatas Makine - Tum Haklari Saklidir';
                  doc.text(footerText, pageWidth / 2, pageHeight - 10, {align: 'center'});
                  
                  // Sayfa numarası
                  doc.text('Sayfa ' + doc.internal.getCurrentPageInfo().pageNumber + ' / ' + doc.internal.getNumberOfPages(), pageWidth - 10, pageHeight - 10);
                }
              });
              
              // Dosya ismini ayarla ve indir
              const fileName = '${pageTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().slice(0,10)}.pdf';
              doc.save(fileName);
              
            } catch (error) {
              console.error('PDF oluşturma hatası:', error);
              alert('PDF oluşturulurken bir hata meydana geldi: ' + error.message);
            }
          }
        </script>
      </body>
      </html>
    `;
    
    // Yeni pencere aç ve içeriği yazdır
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    // Excel oluşturma fonksiyonunu injecte et
    const excelScript = document.createElement('script');
    excelScript.textContent = generateExcel.toString();
    printWindow.document.head.appendChild(excelScript);
    
  } catch (error) {
    console.error('PDF önizleme hatası:', error);
    showToast('PDF önizleme hazırlanırken bir hata oluştu', 'error');
  }
}

// Excel oluşturma fonksiyonu - artık ana kodun içinde, string içinde değil
function generateExcel() {
  try {
    console.log('PDF formatı için optimize edilmiş Excel oluşturuluyor...');
    
    // Tablo elementini al
    const table = document.querySelector('.pdf-table');
    if (!table) {
      alert('Excel için tablo bulunamadı!');
      return;
    }
    
    // Sayfa başlığını al
    const pageTitle = document.querySelector('.table-title').textContent.trim();
    
    // Hammadde listesi mi kontrolü
    const isHammaddeList = pageTitle.toLowerCase().includes('hammadde');
    console.log('Hammadde listesi mi:', isHammaddeList);
    
    // Excel için tablonun başlık ve içeriğini al
    const headers = [];
    table.querySelectorAll('thead th').forEach(th => {
      headers.push(th.textContent.trim());
    });
    
    const rows = [];
    table.querySelectorAll('tbody tr').forEach(tr => {
      // Sadece görünür satırları ekle
      if (tr.style.display !== 'none') {
        const rowData = [];
        tr.querySelectorAll('td').forEach(td => {
          rowData.push(td.textContent.trim());
        });
        if (rowData.length > 0) {
          rows.push(rowData);
        }
      }
    });

    // ExcelJS ile yeni bir çalışma kitabı oluştur
    const workbook = new ExcelJS.Workbook();
    
    // Çalışma kitabı meta verilerini ayarla
    workbook.creator = 'Karataş Makine';
    workbook.lastModifiedBy = 'Stok Takip Sistemi';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Yeni bir çalışma sayfası ekle
    const sheetName = pageTitle.substring(0, 30).replace(/[\\\/\[\]\*\?:]/g, '');
    const worksheet = workbook.addWorksheet(sheetName || 'Rapor', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'portrait', // DİKEY düzen (normal A4)
        fitToPage: true,
        fitToWidth: 1, // Sayfa genişliğine sığdır
        fitToHeight: 0, // Yükseklik sınırı yok
        scale: 100, // %100 ölçek
        margins: {
          left: 0.15, // Çok dar sol kenar 
          right: 0.15, // Çok dar sağ kenar   
          top: 0.4, // Üst kenar 
          bottom: 0.4, // Alt kenar 
          header: 0.2, // Başlık kenarı
          footer: 0.2 // Alt bilgi kenarı
        },
        horizontalCentered: true, // Yatay ortala
        verticalCentered: false, // Dikey ortalama
        // PDF için yazdırma ayarları
        printArea: undefined, // Otomatik yazdırma alanı
        printTitlesRow: '3:3', // Başlık satırını her sayfada tekrarla
        blackAndWhite: false, // Renkli yazdırma
        draft: false, // Taslak değil
        cellComments: 'None', // Hücre yorumları gösterme
        errors: 'displayed' // Hataları göster
      }
    });
    
    // PDF dikey A4 için TAM SAYFA genişliği kullanacak sütun ayarları
    headers.forEach((header, idx) => {
      const column = worksheet.getColumn(idx + 1);
      const headerText = header.toLowerCase();
      
      let columnWidth;
      
      if (headerText.includes('açıklama') || 
          headerText.includes('tanım') || 
          headerText.includes('ad') || 
          headerText.includes('malzeme')) {
        columnWidth = 45; // Çok daha geniş malzeme sütunu
      } else if (headerText.includes('stok kodu')) {
        columnWidth = 18; // Stok kodu daha geniş
      } else if (headerText.includes('barkod')) {
        columnWidth = 25; // Barkod çok daha geniş
      } else if (headerText.includes('kalan')) {
        columnWidth = 18; // Kalan sütunu daha geniş
      } else if (headerText.includes('kod')) {
        columnWidth = 15; // Diğer kodlar
      } else if (headerText.includes('miktar') || 
                headerText.includes('adet')) {
        columnWidth = 12; // Miktar
      } else if (headerText.includes('fiyat') || 
                headerText.includes('tutar')) {
        columnWidth = 15; // Fiyat/tutar
      } else if (headerText.includes('durum')) {
        columnWidth = 15; // Durum sütunu
      } else if (headerText.includes('tarih')) {
        columnWidth = 15; // Tarih alanları
      } else {
        columnWidth = 12; // Diğer sütunlar
      }
      
      column.width = columnWidth;
    });
    
    // Hammadde listesi için Kalan sütunu indeksini bul
    let kalanColumnIndex = -1;
    if (isHammaddeList) {
      headers.forEach((header, index) => {
        const headerLower = header.toLowerCase();
        if (headerLower.includes('kalan')) {
          kalanColumnIndex = index;
        }
      });
    }
    
    // --- 1. LOGO ve BORDO ŞERİT (TAM SAYFA) ---
    
    // Bordo şerit satırı ekle - daha yüksek
    const headerRow = worksheet.addRow(['']);
    headerRow.height = 55; // Biraz daha yüksek
    
    // Şeridi tüm sütunlar boyunca genişlet
    worksheet.mergeCells(1, 1, 1, headers.length);
    
    // Bordo şerit için format
    const headerCell = headerRow.getCell(1);
    headerCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6A0C0D' } // Karataş bordo rengi
    };
    
    // Logo eklemek için logo elementini al
    const logoImage = document.querySelector('.pdf-logo');
    
    if (logoImage && logoImage.complete) {
      try {
        // Logo elementini canvas'a çiz ve base64 formatına dönüştür
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const logoWidth = 200; // PDF için daha küçük logo
        const logoHeight = logoWidth * (logoImage.naturalHeight / logoImage.naturalWidth);
        
        canvas.width = logoWidth;
        canvas.height = logoHeight;
        ctx.drawImage(logoImage, 0, 0, logoWidth, logoHeight);
        
        const logoBase64 = canvas.toDataURL('image/png').split(',')[1];
        
        // Logo'yu Excel'e ekle - PDF için optimize edilmiş boyut
        const logoId = workbook.addImage({
          base64: logoBase64,
          extension: 'png',
        });
        
        // Logo'yu başlık hücresine ekle - daha büyük
        worksheet.addImage(logoId, {
          tl: { col: 0, row: 0 },
          ext: { width: 120, height: 65 }, // Biraz daha büyük logo
          editAs: 'oneCell'
        });
        
        console.log('Logo Excel dosyasına eklendi');
      } catch (logoError) {
        console.error('Logo ekleme hatası:', logoError);
        headerCell.value = 'KARATAŞ MAKİNE';
        headerCell.font = {
          name: 'Arial',
          size: 14, // Daha büyük font
          bold: true,
          color: { argb: 'FFFFFFFF' }
        };
        headerCell.alignment = {
          vertical: 'middle',
          horizontal: 'left',
          indent: 1 // Daha az girinti
        };
      }
    } else {
      headerCell.value = 'KARATAŞ MAKİNE';
      headerCell.font = {
        name: 'Arial',
        size: 14, // Büyük font
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      headerCell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        indent: 1
      };
    }
    
    headerCell.border = {
      bottom: { style: 'thin', color: { argb: 'FF000000' } }
    };
    
    // --- 2. LISTE ADI (PDF için kompakt) ---
    
    const titleRow = worksheet.addRow([pageTitle]);
    titleRow.height = 25; // Normal yükseklik
    
    worksheet.mergeCells(2, 1, 2, headers.length);
    
    const titleCell = titleRow.getCell(1);
    titleCell.font = {
      name: 'Arial',
      size: 12, // Normal font
      bold: true,
      color: { argb: 'FF000000' }
    };
    
    titleCell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
      indent: 1
    };
    
    titleCell.border = {
      bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } }
    };
    
    // --- 3. TABLO BAŞLIKLARI (PDF için optimize) ---
    
    const tableHeaderRow = worksheet.addRow(headers);
    tableHeaderRow.height = 22; // Normal başlık yüksekliği
    
    // Başlık satırını formatla
    headers.forEach((header, idx) => {
      const cell = tableHeaderRow.getCell(idx + 1);
      
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
      
      cell.font = {
        name: 'Arial',
        size: 10, // Normal font boyutu
        bold: true,
        color: { argb: 'FF000000' }
      };
      
      const headerText = header.toLowerCase();
      cell.alignment = {
        vertical: 'middle',
        horizontal: headerText.includes('miktar') || 
                   headerText.includes('fiyat') || 
                   headerText.includes('tutar') ||
                   headerText.includes('kalan') ||
                   headerText.includes('kg değeri') ? 'right' : 'left',
        wrapText: true
      };
      
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };
    });
    
    // --- 4. TABLO VERİLERİ (PDF için optimize) ---
    
    // Hammadde listesi için sütun indekslerini bul
    let barkodIndex = -1;
    let kalanIndex = -1;
    
    if (isHammaddeList) {
      headers.forEach((header, index) => {
        const headerLower = header.toLowerCase();
        if (headerLower.includes('barkod')) {
          barkodIndex = index;
        }
        if (headerLower.includes('kalan')) {
          kalanIndex = index;
        }
      });
    }
    
    rows.forEach((rowData, rowIdx) => {
      const dataRow = worksheet.addRow(rowData);
      dataRow.height = 20; // Normal satır yüksekliği
      
      // Zebra çizgisi
      const bgColor = rowIdx % 2 === 0 ? 'FFFFFFFF' : 'FFF9F9F9';
      
      rowData.forEach((cellData, cellIdx) => {
        const cell = dataRow.getCell(cellIdx + 1);
        
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
        
        const headerText = headers[cellIdx].toLowerCase();
        
        // Durum sütunu için renk kodlaması
        if (headerText.includes('durum')) {
          const statusText = cellData.toLowerCase();
          
          if (statusText.includes('var') || statusText.includes('yeterli')) {
            cell.font = {
              name: 'Arial',
              size: 10, // Normal font
              bold: true,
              color: { argb: 'FF008000' }
            };
          } else if (statusText.includes('az') || statusText.includes('kritik')) {
            cell.font = {
              name: 'Arial',
              size: 10,
              bold: true,
              color: { argb: 'FFFF8C00' }
            };
          } else if (statusText.includes('yok') || statusText.includes('tükendi')) {
            cell.font = {
              name: 'Arial',
              size: 10,
              bold: true,
              color: { argb: 'FFFF0000' }
            };
          } else {
            cell.font = {
              name: 'Arial',
              size: 10,
              color: { argb: 'FF000000' }
            };
          }
        } else {
          cell.font = {
            name: 'Arial',
            size: 10, // Normal font
            color: { argb: 'FF000000' }
          };
        }
        
        // Hammadde listesi için Kalan sütununu özel işle
        if (isHammaddeList && cellIdx === kalanIndex) {
          // Kalan sütunundaki kg değerini çıkar ve sadece sayısal değer olarak kaydet
          let kgValue = 0;
          const kalanText = cellData || '';
          
          try {
            // Parantez içindeki kg değerini kontrol et
            if (kalanText.includes('(') && kalanText.includes(')') && kalanText.toLowerCase().includes('kg')) {
              const parantezIcindeki = kalanText.substring(
                kalanText.indexOf('(') + 1, 
                kalanText.indexOf(')')
              );
              
              const numMatch = parantezIcindeki.match(/(\d+[.,]\d+|\d+)/);
              if (numMatch) {
                kgValue = parseFloat(numMatch[0].replace(',', '.'));
              }
            } 
            // Direkt kg değerini kontrol et
            else if (kalanText.toLowerCase().includes('kg')) {
              const numMatch = kalanText.match(/(\d+[.,]\d+|\d+)/);
              if (numMatch) {
                kgValue = parseFloat(numMatch[0].replace(',', '.'));
              }
            }
          } catch (err) {
            console.error(`Satır ${rowIdx} KG hesaplama hatası:`, err);
          }
          
          // Sadece sayısal kg değerini hücreye yaz
          cell.value = kgValue;
          cell.numFmt = '#,##0.00 "kg"';
          
          // Kalan sütunu için normal arka plan (zebra çizgisi ile aynı)
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgColor } // Normal zebra çizgisi rengi
          };
          
          cell.font = {
            name: 'Arial',
            size: 10,
            bold: true,
            color: { argb: 'FF000000' }
          };
          
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'right',
            wrapText: true
          };
        }
        // Diğer sütunlar için normal işleme
        else {
          // Hücre hizalama
          cell.alignment = {
            vertical: 'middle',
            horizontal: headerText.includes('miktar') || 
                       headerText.includes('fiyat') || 
                       headerText.includes('tutar') ||
                       headerText.includes('kalan') ? 'right' : 'left',
            wrapText: true
          };
          
          // Sayısal değerleri formatlama
          if ((headerText.includes('miktar') || headerText.includes('adet')) && 
              !isNaN(parseFloat(cellData))) {
            cell.numFmt = '#,##0.00';
            cell.value = parseFloat(cellData);
          } else if ((headerText.includes('fiyat') || headerText.includes('tutar')) && 
                    !isNaN(parseFloat(cellData))) {
            cell.numFmt = '#,##0.00 ₺';
            cell.value = parseFloat(cellData);
          }
        }
        
        // PDF için ince kenarlıklar
        cell.border = {
          top: { style: 'hair', color: { argb: 'FFDDDDDD' } },
          left: { style: 'hair', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'hair', color: { argb: 'FFDDDDDD' } },
          right: { style: 'hair', color: { argb: 'FFDDDDDD' } }
        };
      });
    });
    
    // Hammadde listesi için EXCEL FORMÜLLER ile dinamik toplam hesaplama
    if (isHammaddeList && kalanIndex !== -1 && barkodIndex !== -1) {
      const dataStartRow = 4; // Tablo verileri 4. satırdan başlıyor
      const lastDataRow = dataStartRow + rows.length - 1;
      const kalanColumnLetter = String.fromCharCode(65 + kalanIndex); // A, B, C, ... formatında sütun harfi
      const barkodColumnLetter = String.fromCharCode(65 + barkodIndex);
      
      // Boş satır
      worksheet.addRow([]);
      
      // Başlık satırı - normal font boyutu
      const summaryHeaderRow = worksheet.addRow(['MALZEME TÜRÜNE GÖRE TOPLAM AĞIRLIK BİLGİLERİ (DİNAMİK HESAPLAMA)']);
      worksheet.mergeCells(worksheet.rowCount, 1, worksheet.rowCount, headers.length);
      
      const summaryHeaderCell = summaryHeaderRow.getCell(1);
      summaryHeaderCell.font = {
        name: 'Arial',
        size: 12, // Normal font boyutu
        bold: true,
        color: { argb: 'FF6A0C0D' }
      };
      
      summaryHeaderCell.alignment = {
        vertical: 'middle',
        horizontal: 'left'
      };
      
      summaryHeaderCell.border = {
        bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } }
      };
      
      // SAC toplam - EXCEL FORMÜLÜ
      const sacRow = worksheet.addRow(['SAC Toplam:', '', { formula: `SUMIF(${barkodColumnLetter}${dataStartRow}:${barkodColumnLetter}${lastDataRow},"S*",${kalanColumnLetter}${dataStartRow}:${kalanColumnLetter}${lastDataRow})` }]);
      sacRow.height = 20; // Normal yükseklik
      sacRow.getCell(1).font = { name: 'Arial', size: 10, bold: true };
      sacRow.getCell(3).font = { name: 'Arial', size: 10, bold: true };
      sacRow.getCell(3).numFmt = '#,##0.00 "kg"';
      sacRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };
      
      // MİL toplam - EXCEL FORMÜLÜ
      const milRow = worksheet.addRow(['MİL Toplam:', '', { formula: `SUMIF(${barkodColumnLetter}${dataStartRow}:${barkodColumnLetter}${lastDataRow},"M*",${kalanColumnLetter}${dataStartRow}:${kalanColumnLetter}${lastDataRow})` }]);
      milRow.height = 20;
      milRow.getCell(1).font = { name: 'Arial', size: 10, bold: true };
      milRow.getCell(3).font = { name: 'Arial', size: 10, bold: true };
      milRow.getCell(3).numFmt = '#,##0.00 "kg"';
      milRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };
      
      // BORU toplam - EXCEL FORMÜLÜ
      const boruRow = worksheet.addRow(['BORU Toplam:', '', { formula: `SUMIF(${barkodColumnLetter}${dataStartRow}:${barkodColumnLetter}${lastDataRow},"B*",${kalanColumnLetter}${dataStartRow}:${kalanColumnLetter}${lastDataRow})` }]);
      boruRow.height = 20;
      boruRow.getCell(1).font = { name: 'Arial', size: 10, bold: true };
      boruRow.getCell(3).font = { name: 'Arial', size: 10, bold: true };
      boruRow.getCell(3).numFmt = '#,##0.00 "kg"';
      boruRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };
      
      // GENEL TOPLAM - EXCEL FORMÜLÜ (tüm KG değerlerinin toplamı)
      const totalRow = worksheet.addRow(['GENEL TOPLAM:', '', { formula: `SUM(${kalanColumnLetter}${dataStartRow}:${kalanColumnLetter}${lastDataRow})` }]);
      totalRow.height = 22;
      totalRow.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF6A0C0D' } };
      totalRow.getCell(3).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF6A0C0D' } };
      totalRow.getCell(3).numFmt = '#,##0.00 "kg"';
      totalRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };
      
      totalRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
    }
    
    // PDF için optimize edilmiş görünüm ayarları
    worksheet.views = [
      { 
        state: 'frozen', 
        xSplit: 0, 
        ySplit: 3, 
        topLeftCell: 'A4', 
        activeCell: 'A4',
        showGridLines: true, // PDF'de grid çizgileri göster
        showRowColHeaders: false, // Satır/sütun başlıklarını gizle
        zoomScale: 100, // %100 zoom
        zoomScaleNormal: 100,
        zoomScalePageLayoutView: 100
      }
    ];
    
    // PDF için yazdırma alanını otomatik ayarla
    const lastRow = worksheet.rowCount;
    const lastCol = headers.length;
    const lastColLetter = String.fromCharCode(64 + lastCol); // A=65, B=66, vs.
    
    worksheet.pageSetup.printArea = `A1:${lastColLetter}${lastRow}`;
    
    // --- EXCEL DOSYASINI OLUŞTUR VE İNDİR ---
    
    const fileName = 'hammadde_listesi_' + 
                    new Date().toISOString().slice(0, 10) + '.xlsx';
    
    workbook.xlsx.writeBuffer().then(function(buffer) {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      
      setTimeout(function() {
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Excel dosyası başarıyla oluşturuldu:', fileName);
      console.log('Özet bölümü normal font boyutlarıyla düzenlendi!');
    });
    
  } catch (error) {
    console.error('Excel oluşturma hatası:', error);
    alert('Excel oluşturulurken bir hata oluştu: ' + error.message);
  }
}


  // Her tablo türü için gösterilecek sütunların indekslerini döndüren yardımcı fonksiyon
  function getColumnMapForTable(tableId) {
    // Her tablo türü için gösterilecek sütunların indekslerini belirle
    switch (tableId) {
      case 'sarfMalzemeTable':
        // Stok Kodu, Malzeme Adı, Kalan Miktar, Barkod
        return [0, 1, 2, 3];
      case 'hammaddeTable':
        // Stok Kodu, Malzeme Bilgisi, Kalan, Barkod
        return [0, 1, 3, 4];
      case 'yariMamulTable':
        // Stok Kodu, Malzeme Adı, Kalan Miktar, Barkod
        return [0, 1, 2, 3];
      case 'ikincilStokTable':
        // Stok Kodu, Malzeme Adı, Miktar, Barkod
        return [0, 1, 2, 3]; 
      default:
        // Varsayılan olarak ilk 4 sütunu göster
        return [0, 1, 2, 3];
    }
}
  
  // Butonu HTML yapısına bağlama olayları
  document.addEventListener('DOMContentLoaded', function() {
    // Tüm sayfalara PDF butonları ekle
    initPrintButtons();
    
    // Sayfa geçişlerinde butonların yeniden eklenmesi için olay dinleyicisi
    // NavLinks tıklama olaylarını dinle
    const navLinks = document.querySelectorAll('.nav-links li a');
    
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        // Sayfa geçişinden sonra düğmeleri güncellemek için küçük bir gecikme ekle
        setTimeout(() => {
          initPrintButtons();
        }, 300);
      });
    });
  });
  
function addHistoricalReportButtons() {
  // Her sayfa için tarihli rapor butonları ekle
  addHistoricalButtonTo('sarf-malzeme-listesi', 'sarfMalzemeTable', 'Sarf Malzeme Listesi', 'sarf-malzeme');
  addHistoricalButtonTo('hammadde-listesi', 'hammaddeTable', 'Hammadde Listesi', 'hammadde');
  addHistoricalButtonTo('yari-mamul-listesi', 'yariMamulTable', 'Yarı Mamul Listesi', 'yari-mamul');
  
  console.log('Tüm sayfalara Tarihli Rapor butonları eklendi');
}

function addHistoricalButtonTo(pageId, tableId, pageTitle, reportType) {
  // Sayfa elementini bul
  const page = document.getElementById(pageId);
  if (!page) {
    console.log(`${pageId} sayfası bulunamadı, tarihli rapor düğmesi eklenemedi`);
    return;
  }
  
  // Mevcut arama çubuğunu bul
  const searchBar = page.querySelector('.search-bar');
  
  if (!searchBar) {
    console.log(`${pageId} sayfasında arama çubuğu elementi bulunamadı`);
    return;
  }
  
  // Eğer buton zaten varsa çık
  if (searchBar.querySelector('#historical-button-' + pageId)) {
    return;
  }
  
  // Tarihli Rapor butonu oluştur
  const historicalButton = document.createElement('button');
  historicalButton.id = 'historical-button-' + pageId;
  historicalButton.className = 'historical-report-button';
  historicalButton.innerHTML = '<i class="fas fa-history"></i> Tarihli Rapor';
  historicalButton.style.cssText = `
    background-color: #28a745;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-left: 10px;
    font-size: 13px;
    transition: background-color 0.2s;
  `;
  
  historicalButton.onmouseover = function() {
    this.style.backgroundColor = '#218838';
  };
  
  historicalButton.onmouseout = function() {
    this.style.backgroundColor = '#28a745';
  };
  
  historicalButton.onclick = function() {
    openHistoricalReportModal(reportType, pageTitle);
  };
  
  // Butonu arama çubuğuna ekle
  const searchRow = searchBar.querySelector('.search-row');
  if (searchRow) {
    searchRow.appendChild(historicalButton);
  } else {
    searchBar.appendChild(historicalButton);
  }
  
  console.log(`${pageTitle} sayfasına Tarihli Rapor butonu eklendi`);
}

// Tarihli rapor modalını aç
function openHistoricalReportModal(reportType, pageTitle) {
  // Modal HTML'i oluştur
  const modalHTML = `
    <div id="historical-report-modal" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    ">
      <div style="
        background: white;
        border-radius: 8px;
        padding: 30px;
        width: 500px;
        max-width: 90%;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #6A0C0D;
        ">
          <h2 style="
            color: #6A0C0D;
            margin: 0;
            font-size: 20px;
          ">
            <i class="fas fa-history"></i>
            Tarihli ${pageTitle} Raporu
          </h2>
          <button onclick="closeHistoricalReportModal()" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
          ">&times;</button>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
          ">Rapor Tarihi Seçin:</label>
          <input type="date" id="historical-date-input" style="
            width: 100%;
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          " max="${new Date().toISOString().split('T')[0]}">
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
          ">Rapor Formatı:</label>
          <div style="display: flex; gap: 10px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="radio" name="report-format" value="excel" checked style="margin-right: 8px;">
              <i class="fas fa-file-excel" style="color: #28a745; margin-right: 5px;"></i>
              Excel
            </label>
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="radio" name="report-format" value="pdf" style="margin-right: 8px;">
              <i class="fas fa-file-pdf" style="color: #dc3545; margin-right: 5px;"></i>
              PDF
            </label>
          </div>
        </div>
        
        <div id="historical-loading" style="
          display: none;
          text-align: center;
          padding: 20px;
          color: #6A0C0D;
        ">
          <i class="fas fa-spinner fa-spin fa-2x"></i>
          <p style="margin-top: 10px;">Rapor hazırlanıyor...</p>
        </div>
        
        <div style="
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 25px;
        ">
          <button onclick="closeHistoricalReportModal()" style="
            background: #6c757d;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          ">İptal</button>
          <button onclick="generateHistoricalReport('${reportType}')" style="
            background: #6A0C0D;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          ">
            <i class="fas fa-download"></i>
            Raporu Oluştur
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Modal'ı body'ye ekle
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Bugünün tarihini varsayılan olarak ayarla
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('historical-date-input').value = today;
}

// Modal'ı kapat
function closeHistoricalReportModal() {
  const modal = document.getElementById('historical-report-modal');
  if (modal) {
    modal.remove();
  }
}

// Tarihli rapor oluştur
async function generateHistoricalReport(reportType) {
  const dateInput = document.getElementById('historical-date-input');
  const formatRadios = document.querySelectorAll('input[name="report-format"]');
  const loadingDiv = document.getElementById('historical-loading');
  
  if (!dateInput.value) {
    showToast('Lütfen bir tarih seçin', 'warning');
    return;
  }
  
  const selectedDate = dateInput.value;
  const selectedFormat = Array.from(formatRadios).find(radio => radio.checked)?.value || 'excel';
  
  try {
    // Loading göster
    loadingDiv.style.display = 'block';
    
    console.log(`${selectedDate} tarihi için ${reportType} raporu oluşturuluyor...`);
    
    let result;
    
    // Doğru API metodunu çağır - preload.js'deki yapıya uygun
    switch(reportType) {
      case 'hammadde':
        result = await window.electronAPI.invoke.database.getAllHammaddeAtDate(selectedDate);
        break;
      case 'sarf-malzeme':
        result = await window.electronAPI.invoke.database.getAllSarfMalzemeAtDate(selectedDate);
        break;
      case 'yari-mamul':
        result = await window.electronAPI.invoke.database.getAllYariMamulAtDate(selectedDate);
        break;
      default:
        throw new Error('Geçersiz rapor türü');
    }
    
    if (result.success) {
      if (selectedFormat === 'excel') {
        await generateHistoricalExcel(result, reportType, selectedDate);
      } else {
        generateHistoricalPDF(result, reportType, selectedDate);
      }
      
      showToast('Rapor başarıyla oluşturuldu', 'success');
      closeHistoricalReportModal();
    } else {
      showToast('Rapor oluşturulamadı: ' + result.message, 'error');
    }
    
  } catch (error) {
    console.error('Tarihli rapor oluşturma hatası:', error);
    showToast('Rapor oluşturulurken hata oluştu: ' + error.message, 'error');
  } finally {
    // Loading gizle
    loadingDiv.style.display = 'none';
  }
}

// Tarihli Excel raporu oluştur
async function generateHistoricalExcel(data, reportType, selectedDate) {
  try {
    // ExcelJS kütüphanesinin yüklü olduğundan emin ol
    if (typeof ExcelJS === 'undefined') {
      throw new Error('ExcelJS kütüphanesi yüklü değil');
    }
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Karataş Makine';
    workbook.created = new Date();
    
    let worksheet;
    let sheetData;
    let sheetTitle;
    
    switch(reportType) {
      case 'hammadde':
        sheetData = data.hammaddeler || [];
        sheetTitle = 'Hammadde Stok Raporu';
        worksheet = workbook.addWorksheet('Hammaddeler');
        setupHistoricalHammaddeSheet(worksheet, sheetData, selectedDate);
        break;
      case 'sarf-malzeme':
        sheetData = data.sarfMalzemeler || [];
        sheetTitle = 'Sarf Malzeme Stok Raporu';
        worksheet = workbook.addWorksheet('Sarf Malzemeler');
        setupHistoricalSarfMalzemeSheet(worksheet, sheetData, selectedDate);
        break;
      case 'yari-mamul':
        sheetData = data.yariMamuller || [];
        sheetTitle = 'Yarı Mamul Stok Raporu';
        worksheet = workbook.addWorksheet('Yarı Mamüller');
        setupHistoricalYariMamulSheet(worksheet, sheetData, selectedDate);
        break;
    }
    
    // Dosya adı oluştur
    const formattedDate = selectedDate.replace(/-/g, '_');
    const fileName = `${sheetTitle.replace(/\s+/g, '_')}_${formattedDate}.xlsx`;
    
    // Excel dosyasını oluştur ve indir
    const buffer = await workbook.xlsx.writeBuffer();
    downloadHistoricalFile(buffer, fileName);
    
  } catch (error) {
    console.error('Tarihli Excel oluşturma hatası:', error);
    throw error;
  }
}

// Hammadde için tarihli Excel sheet ayarla
function setupHistoricalHammaddeSheet(sheet, data, selectedDate) {
  // Başlık satırı
  const headerRow = sheet.addRow(['KARATAŞ MAKİNE - HAMMADDE STOK RAPORU (TARİHLİ)']);
  sheet.mergeCells(1, 1, 1, 5);
  headerRow.font = { size: 16, bold: true };
  headerRow.alignment = { horizontal: 'center' };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6A0C0D' } };
  headerRow.font = { color: { argb: 'FFFFFFFF' }, size: 16, bold: true };
  
  // Tarih satırı
  const dateRow = sheet.addRow([`Rapor Tarihi: ${formatHistoricalDate(selectedDate)}`]);
  sheet.mergeCells(2, 1, 2, 5);
  dateRow.font = { size: 12, bold: true };
  dateRow.alignment = { horizontal: 'center' };
  
  // Oluşturma tarihi
  const createdRow = sheet.addRow([`Oluşturma Tarihi: ${formatHistoricalDate(new Date().toISOString().split('T')[0])}`]);
  sheet.mergeCells(3, 1, 3, 5);
  createdRow.font = { size: 10 };
  createdRow.alignment = { horizontal: 'center' };
  
  // Boş satır
  sheet.addRow([]);
  
  // Tablo başlıkları
  const headers = ['Stok Kodu', 'Malzeme Adı', 'Kalan (kg)', 'Barkod', 'Durum'];
  const headerRow2 = sheet.addRow(headers);
  headerRow2.font = { bold: true };
  headerRow2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
  
  // Veri satırları
  data.forEach(item => {
    const row = sheet.addRow([
      item.stok_kodu || '',
      item.malzeme_adi || '',
      parseFloat(item.kalan_kilo || 0),
      item.barkod || '',
      getHistoricalDurumText(item.durum)
    ]);
    
    // Durum sütununa renk ekle
    const durumCell = row.getCell(5);
    switch(item.durum) {
      case 'STOKTA_VAR':
        durumCell.font = { color: { argb: 'FF28a745' }, bold: true };
        break;
      case 'AZ_KALDI':
        durumCell.font = { color: { argb: 'FFffc107' }, bold: true };
        break;
      case 'STOKTA_YOK':
        durumCell.font = { color: { argb: 'FFdc3545' }, bold: true };
        break;
    }
  });
  
  // Sütun genişliklerini ayarla
  sheet.columns = [
    { width: 15 }, // Stok Kodu
    { width: 40 }, // Malzeme Adı
    { width: 15 }, // Kalan
    { width: 20 }, // Barkod
    { width: 15 }  // Durum
  ];
  
  // Tabloya border ekle
  const lastRow = sheet.rowCount;
  for (let i = 5; i <= lastRow; i++) {
    for (let j = 1; j <= 5; j++) {
      const cell = sheet.getCell(i, j);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  }
}

// Sarf malzeme için tarihli Excel sheet ayarla
function setupHistoricalSarfMalzemeSheet(sheet, data, selectedDate) {
  // Başlık satırı
  const headerRow = sheet.addRow(['KARATAŞ MAKİNE - SARF MALZEME STOK RAPORU (TARİHLİ)']);
  sheet.mergeCells(1, 1, 1, 6);
  headerRow.font = { size: 16, bold: true };
  headerRow.alignment = { horizontal: 'center' };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6A0C0D' } };
  headerRow.font = { color: { argb: 'FFFFFFFF' }, size: 16, bold: true };
  
  // Tarih satırları
  const dateRow = sheet.addRow([`Rapor Tarihi: ${formatHistoricalDate(selectedDate)}`]);
  sheet.mergeCells(2, 1, 2, 6);
  dateRow.font = { size: 12, bold: true };
  dateRow.alignment = { horizontal: 'center' };
  
  const createdRow = sheet.addRow([`Oluşturma Tarihi: ${formatHistoricalDate(new Date().toISOString().split('T')[0])}`]);
  sheet.mergeCells(3, 1, 3, 6);
  createdRow.font = { size: 10 };
  createdRow.alignment = { horizontal: 'center' };
  
  // Boş satır
  sheet.addRow([]);
  
  // Tablo başlıkları
  const headers = ['Stok Kodu', 'Malzeme Adı', 'Kalan Miktar', 'Birim', 'Barkod', 'Durum'];
  const headerRow2 = sheet.addRow(headers);
  headerRow2.font = { bold: true };
  headerRow2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
  
  // Veri satırları
  data.forEach(item => {
    const row = sheet.addRow([
      item.stok_kodu || '',
      item.malzeme_adi || '',
      parseFloat(item.kalan_miktar || 0),
      item.birim || '',
      item.barkod || '',
      getHistoricalDurumText(item.durum)
    ]);
    
    // Durum sütununa renk ekle
    const durumCell = row.getCell(6);
    switch(item.durum) {
      case 'STOKTA_VAR':
        durumCell.font = { color: { argb: 'FF28a745' }, bold: true };
        break;
      case 'AZ_KALDI':
        durumCell.font = { color: { argb: 'FFffc107' }, bold: true };
        break;
      case 'STOKTA_YOK':
        durumCell.font = { color: { argb: 'FFdc3545' }, bold: true };
        break;
    }
  });
  
  // Sütun genişliklerini ayarla
  sheet.columns = [
    { width: 15 }, // Stok Kodu
    { width: 40 }, // Malzeme Adı
    { width: 15 }, // Kalan Miktar
    { width: 10 }, // Birim
    { width: 20 }, // Barkod
    { width: 15 }  // Durum
  ];
}

// Yarı mamul için tarihli Excel sheet ayarla
function setupHistoricalYariMamulSheet(sheet, data, selectedDate) {
  // Hammadde sheet'i ile aynı yapı, sadece başlık farklı
  const headerRow = sheet.addRow(['KARATAŞ MAKİNE - YARI MAMUL STOK RAPORU (TARİHLİ)']);
  sheet.mergeCells(1, 1, 1, 6);
  headerRow.font = { size: 16, bold: true };
  headerRow.alignment = { horizontal: 'center' };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6A0C0D' } };
  headerRow.font = { color: { argb: 'FFFFFFFF' }, size: 16, bold: true };
  
  const dateRow = sheet.addRow([`Rapor Tarihi: ${formatHistoricalDate(selectedDate)}`]);
  sheet.mergeCells(2, 1, 2, 6);
  dateRow.font = { size: 12, bold: true };
  dateRow.alignment = { horizontal: 'center' };
  
  const createdRow = sheet.addRow([`Oluşturma Tarihi: ${formatHistoricalDate(new Date().toISOString().split('T')[0])}`]);
  sheet.mergeCells(3, 1, 3, 6);
  createdRow.font = { size: 10 };
  createdRow.alignment = { horizontal: 'center' };
  
  sheet.addRow([]);
  
  const headers = ['Stok Kodu', 'Malzeme Adı', 'Kalan Miktar', 'Birim', 'Barkod', 'Durum'];
  const headerRow2 = sheet.addRow(headers);
  headerRow2.font = { bold: true };
  headerRow2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
  
  data.forEach(item => {
    const row = sheet.addRow([
      item.stok_kodu || '',
      item.malzeme_adi || '',
      parseFloat(item.kalan_miktar || 0),
      item.birim || '',
      item.barkod || '',
      getHistoricalDurumText(item.durum)
    ]);
    
    const durumCell = row.getCell(6);
    switch(item.durum) {
      case 'STOKTA_VAR':
        durumCell.font = { color: { argb: 'FF28a745' }, bold: true };
        break;
      case 'AZ_KALDI':
        durumCell.font = { color: { argb: 'FFffc107' }, bold: true };
        break;
      case 'STOKTA_YOK':
        durumCell.font = { color: { argb: 'FFdc3545' }, bold: true };
        break;
    }
  });
  
  sheet.columns = [
    { width: 15 }, { width: 40 }, { width: 15 }, 
    { width: 10 }, { width: 20 }, { width: 15 }
  ];
}

// Tarihli PDF raporu oluştur
function generateHistoricalPDF(data, reportType, selectedDate) {
  const pdfContent = createHistoricalPDFContent(data, reportType, selectedDate);
  const printWindow = window.open('', '_blank');
  printWindow.document.write(pdfContent);
  printWindow.document.close();
}

// Tarihli PDF içeriği oluştur
function createHistoricalPDFContent(data, reportType, selectedDate) {
  let title = '';
  let tableContent = '';
  
  switch(reportType) {
    case 'hammadde':
      title = 'HAMMADDE STOK RAPORU';
      tableContent = createHistoricalPDFHammaddeTable(data.hammaddeler || []);
      break;
    case 'sarf-malzeme':
      title = 'SARF MALZEME STOK RAPORU';
      tableContent = createHistoricalPDFSarfMalzemeTable(data.sarfMalzemeler || []);
      break;
    case 'yari-mamul':
      title = 'YARI MAMUL STOK RAPORU';
      tableContent = createHistoricalPDFYariMamulTable(data.yariMamuller || []);
      break;
  }
  
  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <title>${title} - ${formatHistoricalDate(selectedDate)}</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          color: #333;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 3px solid #6A0C0D;
          padding-bottom: 20px;
        }
        .header h1 { 
          color: #6A0C0D; 
          margin: 0; 
          font-size: 24px;
        }
        .header p { 
          margin: 5px 0; 
          font-size: 14px;
        }
        .date-info {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 5px;
          margin: 10px 0;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 20px; 
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left; 
        }
        th { 
          background-color: #6A0C0D; 
          color: white; 
          font-weight: bold;
        }
        .durum-stokta-var { color: #28a745; font-weight: bold; }
        .durum-az-kaldi { color: #ffc107; font-weight: bold; }
        .durum-stokta-yok { color: #dc3545; font-weight: bold; }
        .footer {
          margin-top: 30px;
          text-align: center;
          border-top: 1px solid #ddd;
          padding-top: 15px;
          font-size: 12px;
          color: #666;
        }
        @media print {
          .print-btn { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>KARATAŞ MAKİNE ${title}</h1>
        <div class="date-info">
          <p><strong>Rapor Tarihi:</strong> ${formatHistoricalDate(selectedDate)}</p>
          <p><strong>Oluşturma Tarihi:</strong> ${formatHistoricalDate(new Date().toISOString().split('T')[0])}</p>
        </div>
      </div>
      
      ${tableContent}
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} Karataş Makine - Tüm Hakları Saklıdır</p>
        <p>Bu rapor sistem tarafından otomatik olarak oluşturulmuştur.</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <button class="print-btn" onclick="window.print()" style="
          background: #6A0C0D; 
          color: white; 
          border: none; 
          padding: 10px 20px; 
          border-radius: 5px; 
          cursor: pointer;
          margin-right: 10px;
        ">
          PDF Olarak Yazdır
        </button>
        <button class="print-btn" onclick="window.close()" style="
          background: #666; 
          color: white; 
          border: none; 
          padding: 10px 20px; 
          border-radius: 5px; 
          cursor: pointer;
        ">
          Kapat
        </button>
      </div>
    </body>
    </html>
  `;
}

// PDF için hammadde tablosu oluştur
function createHistoricalPDFHammaddeTable(data) {
  if (!data || data.length === 0) {
    return '<p style="text-align: center; color: #666; padding: 20px;">Veri bulunamadı.</p>';
  }
  
  const rows = data.map(item => `
    <tr>
      <td>${item.stok_kodu || ''}</td>
      <td>${item.malzeme_adi || ''}</td>
      <td style="text-align: right;">${formatHistoricalNumber(item.kalan_kilo)} kg</td>
      <td>${item.barkod || ''}</td>
      <td class="durum-${item.durum?.toLowerCase().replace('_', '-')}">${getHistoricalDurumText(item.durum)}</td>
    </tr>
  `).join('');
  
  return `
    <table>
      <thead>
        <tr>
          <th>Stok Kodu</th>
          <th>Malzeme Adı</th>
          <th>Kalan (kg)</th>
          <th>Barkod</th>
          <th>Durum</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

// PDF için yarı mamul tablosu oluştur
function createHistoricalPDFYariMamulTable(data) {
  if (!data || data.length === 0) {
    return '<p style="text-align: center; color: #666; padding: 20px;">Veri bulunamadı.</p>';
  }
  
  const rows = data.map(item => `
    <tr>
      <td>${item.stok_kodu || ''}</td>
      <td>${item.malzeme_adi || ''}</td>
      <td style="text-align: right;">${formatHistoricalNumber(item.kalan_miktar)}</td>
      <td>${item.birim || ''}</td>
      <td>${item.barkod || ''}</td>
      <td class="durum-${item.durum?.toLowerCase().replace('_', '-')}">${getHistoricalDurumText(item.durum)}</td>
    </tr>
  `).join('');
  
  return `
    <table>
      <thead>
        <tr>
          <th>Stok Kodu</th>
          <th>Malzeme Adı</th>
          <th>Kalan Miktar</th>
          <th>Birim</th>
          <th>Barkod</th>
          <th>Durum</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

// Yardımcı fonksiyonlar
function formatHistoricalDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR');
}

function formatHistoricalNumber(number) {
  return parseFloat(number || 0).toFixed(2);
}

function getHistoricalDurumText(durum) {
  switch(durum) {
    case 'STOKTA_VAR': return 'Stokta Var';
    case 'AZ_KALDI': return 'Az Kaldı';
    case 'STOKTA_YOK': return 'Stokta Yok';
    default: return 'Bilinmiyor';
  }
}

function downloadHistoricalFile(buffer, fileName) {
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Ana sayfa yüklendiğinde tarihli rapor butonlarını ekle
(function() {
  // Sayfa yüklendiğinde ve tab değişikliklerinde butonları ekle
  function initHistoricalButtons() {
    // Önceki butonları temizle
    document.querySelectorAll('.historical-report-button').forEach(btn => btn.remove());
    
    // Yeni butonları ekle
    setTimeout(() => {
      addHistoricalReportButtons();
    }, 500);
  }
  
  // Sayfa yüklendiğinde
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHistoricalButtons);
  } else {
    initHistoricalButtons();
  }
  
  // Tab değişikliklerini dinle
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('tab-button') || 
        event.target.closest('.tab-button')) {
      setTimeout(initHistoricalButtons, 300);
    }
  });
})();

// Global scope'a fonksiyonları ekle
window.openHistoricalReportModal = openHistoricalReportModal;
window.closeHistoricalReportModal = closeHistoricalReportModal;
window.generateHistoricalReport = generateHistoricalReport;
window.addHistoricalReportButtons = addHistoricalReportButtons;


window.initPrintButtons = initPrintButtons;
window.addPreviewButtonTo = addPreviewButtonTo;
window.prepareAndPreviewTable = prepareAndPreviewTable;
window.getColumnMapForTable = getColumnMapForTable;