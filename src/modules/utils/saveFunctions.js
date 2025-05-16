
async function saveYeniMusteri(event) {
    event.preventDefault();
    
    const musteriAdi = document.getElementById('musteriAdi').value.trim();
    const errorArea = document.getElementById('yeniMusteriModal-error');
    const successArea = document.getElementById('yeniMusteriModal-success');
    
    // Validasyon
    if (!musteriAdi) {
      errorArea.textContent = 'Müşteri adı boş bırakılamaz.';
      return;
    }
    
    try {
      // Müşteriyi kaydet
      const result = await window.electronAPI.invoke.database.addMusteri({
        musteri_adi: musteriAdi
      });
      
      if (result.success) {
        // Başarılı ise
        successArea.textContent = 'Müşteri başarıyla eklendi.';
        
        // Müşteri listesini güncelle
        await loadMusteriler();
        
        // Kısa bir süre sonra modalı kapat
        setTimeout(() => {
          closeModal('yeniMusteriModal');
        }, 1000);
      } else {
        // Başarısız ise
        errorArea.textContent = result.message || 'Müşteri eklenirken bir hata oluştu.';
      }
    } catch (error) {
      console.error('Müşteri ekleme hatası:', error);
      errorArea.textContent = 'Müşteri eklenirken bir hata oluştu.';
    }
  }


  async function saveYeniProje(event) {
  // Form gönderimini engelle (eğer bir event objesi gelirse)
  if (event && event.preventDefault) {
    event.preventDefault();
  }
  
  // İlgili DOM elementlerini bul
  const projeAdiInput = document.getElementById('projeAdi');
  const errorArea = document.getElementById('yeniProjeModal-error');
  const successArea = document.getElementById('yeniProjeModal-success');
  
  // Hata ve başarı alanlarını temizle (varsa)
  if (errorArea) errorArea.textContent = '';
  if (successArea) successArea.textContent = '';
  
  // Proje adını al
  const projeAdi = projeAdiInput ? projeAdiInput.value.trim() : '';
  
  // Validasyon
  if (!projeAdi) {
    // Toast bildirimi veya hata mesajı göster (hangisi varsa)
    if (errorArea) {
      errorArea.textContent = 'Proje adı boş bırakılamaz.';
    } else {
      showToast('Lütfen proje adını girin.', 'error');
    }
    return;
  }
  
  try {
    console.log("Proje ekleniyor:", projeAdi);
    
    // Projeyi kaydet - ekleyen_id kontrolü
    const ekleyenId = currentUser && currentUser.id ? parseInt(currentUser.id) : null;
    
    // API kontrolü
    if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
      console.error('Database invoke metodu bulunamadı');
      
      if (errorArea) {
        errorArea.textContent = 'Proje eklenemedi. API erişimi yok.';
      } else {
        showToast('Proje eklenemedi. API erişimi yok.', 'error');
      }
      return;
    }
    
    const result = await window.electronAPI.invoke.database.addProje({
      adi: projeAdi,
      proje_adi: projeAdi, // İki formatta da gönder
      ekleyen_id: ekleyenId
    });
    
    console.log("Proje ekleme sonucu:", result);
    
    if (result.success) {
      // Başarılı ise
      if (successArea) {
        successArea.textContent = 'Proje başarıyla eklendi.';
      } else {
        showToast(`Proje başarıyla eklendi.\nProje Kodu: ${result.proje?.proje_kodu || 'Oluşturuldu'}`, 'success');
      }
      
      // Formu temizle (varsa)
      if (projeAdiInput) {
        projeAdiInput.value = '';
      }
      
      // Gerekli alanlara yeni projeyi seç
      const projeSecimleri = [
        document.getElementById('plakaProjeSecimi'),
        document.getElementById('projeSecimi'),
        document.getElementById('parcaProjeSecimi'),
        document.getElementById('sarfMalzemeProjeSecimi'),
        document.getElementById('yariMamulProjeSecimi')
      ];
      
      projeSecimleri.forEach(select => {
        if (select) {
          // Yeni eklenen projeyi seç
          select.value = result.proje?.id || '';
          
          // Stil düzeltmeleri
          Array.from(select.options).forEach(option => {
            option.style.color = '#333';
            option.style.backgroundColor = '#fff';
          });
        }
      });
      
      // Proje listesini güncelle
      await loadProjeler();
      
      // Kısa bir süre sonra modalı kapat
      setTimeout(() => {
        closeModal('yeniProjeModal');
      }, 1000);
      
      // Eğer işlem modalından geldiyse, işlem modalını tekrar aç
      if (currentParcaId) {
        openModal('islemModal');
      }
    } else {
      // Başarısız ise
      if (errorArea) {
        errorArea.textContent = result.message || 'Proje eklenirken bir hata oluştu.';
      } else {
        showToast('Hata: ' + (result.message || 'Proje eklenirken bir hata oluştu.'), 'error');
      }
    }
  } catch (error) {
    console.error('Proje ekleme hatası:', error);
    
    if (errorArea) {
      errorArea.textContent = 'Proje eklenirken bir hata oluştu: ' + (error.message || '');
    } else {
      showToast('Proje kaydedilirken bir hata oluştu.', 'error');
    }
  }
}

// Eski fonksiyonları yeni fonksiyonla değiştir
window.saveYeniProje = saveYeniProje;
window.saveProje = saveYeniProje;



window.saveYeniMusteri = saveYeniMusteri;


document.addEventListener('DOMContentLoaded', function() {
  const yeniProjeForm = document.getElementById('yeniProjeForm');
  
  if (yeniProjeForm) {
    yeniProjeForm.removeEventListener('submit', saveProje); // Eski dinleyiciyi kaldır
    yeniProjeForm.removeEventListener('submit', saveYeniProje); // Eski dinleyiciyi kaldır
    yeniProjeForm.addEventListener('submit', saveYeniProje); // Yeni dinleyiciyi ekle
  }
});