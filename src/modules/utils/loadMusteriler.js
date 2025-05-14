
  // Müşteri listesini veritabanından yükleme
  async function loadMusteriler() {
    try {
      // Veritabanından müşteri listesini al
      const result = await window.electronAPI.invoke.database.getAllMusteriler();
      
      // Müşteri seçim alanlarını bul
      const musteriSecimleri = [
        document.getElementById('plakaMusteriSecimi'),
        document.getElementById('parcaMusteriSecimi'),
        document.getElementById('musteriSecimi')
        // Diğer müşteri seçim alanları da burada eklenebilir
      ];
      
      // Her müşteri seçim alanını doldur
      musteriSecimleri.forEach(select => {
        if (select) {
          // Önceki seçenekleri temizle
          select.innerHTML = '<option value="">-- Müşteri Seçin --</option>';
          
          // Müşterileri ekle
          if (result.success && result.musteriler && result.musteriler.length > 0) {
            result.musteriler.forEach(musteri => {
              const option = document.createElement('option');
              option.value = musteri.id;
              option.textContent = musteri.musteri_adi;
              select.appendChild(option);
            });
          }
        }
      });
      
      return result;
    } catch (error) {
      console.error('Müşteri listesi yükleme hatası:', error);
      showToast('Müşteri listesi yüklenirken bir hata oluştu.', 'error');
      return { success: false, message: 'Müşteri listesi alınamadı.' };
    }
  }
  
 window.loadMusteriler = loadMusteriler;