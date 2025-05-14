
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
    event.preventDefault();
    
    const projeAdi = document.getElementById('projeAdi').value.trim();
    const errorArea = document.getElementById('yeniProjeModal-error');
    const successArea = document.getElementById('yeniProjeModal-success');
    
    // Hata ve başarı alanlarını temizle
    if (errorArea) errorArea.textContent = '';
    if (successArea) successArea.textContent = '';
    
    // Validasyon
    if (!projeAdi) {
        if (errorArea) errorArea.textContent = 'Proje adı boş bırakılamaz.';
        return;
    }
    
    try {
        console.log("Proje ekleniyor:", projeAdi);
        
        // Projeyi kaydet - ekleyen_id kontrolü
        const ekleyenId = currentUser && currentUser.id ? parseInt(currentUser.id) : null;
        
        const result = await window.electronAPI.invoke.database.addProje({
            adi: projeAdi,
            proje_adi: projeAdi, // İki formatta da gönder
            ekleyen_id: ekleyenId
        });
        
        console.log("Proje ekleme sonucu:", result);
        
        if (result.success) {
            // Başarılı ise
            if (successArea) successArea.textContent = 'Proje başarıyla eklendi.';
            
            // Proje listesini güncelle
            await loadProjeler();
            
            // Gerekli alanlara yeni projeyi seç
            const projeSecimleri = [
                document.getElementById('plakaProjeSecimi'),
                document.getElementById('projeSecimi'),
                document.getElementById('parcaProjeSecimi'),
                document.getElementById('sarfMalzemeProjeSecimi'),
                document.getElementById('yariMamulProjeSecimi'),
                document.getElementById('ikincilStokProjeSecimi')
            ];
            
            projeSecimleri.forEach(select => {
                if (select) {
                    // Yeni eklenen projeyi seç
                    select.value = result.proje.id;
                    
                    // Stil düzeltmeleri
                    Array.from(select.options).forEach(option => {
                        option.style.color = '#333';
                        option.style.backgroundColor = '#fff';
                    });
                }
            });
            
            // Kısa bir süre sonra modalı kapat
            setTimeout(() => {
                closeModal('yeniProjeModal');
            }, 1000);
        } else {
            // Başarısız ise
            if (errorArea) errorArea.textContent = result.message || 'Proje eklenirken bir hata oluştu.';
        }
    } catch (error) {
        console.error('Proje ekleme hatası:', error);
        if (errorArea) errorArea.textContent = 'Proje eklenirken bir hata oluştu: ' + (error.message || '');
    }
}


/* 
// Mock fonksiyonları veritabanı API'sine ekle (geçici çözüm)
if (!window.electronAPI) {
    window.electronAPI = { invoke: { database: {} } };
}

window.electronAPI.invoke.database.getProjeler = async () => {
    const mockProjeler = [
        { id: 1, adi: 'Proje 1' },
        { id: 2, adi: 'Proje 2' },
        { id: 3, adi: 'Proje 3' }
    ];
    return { success: true, projeler: mockProjeler };
};

window.electronAPI.invoke.database.addProje = async (projeData) => {
    return {
        success: true,
        proje: {
            id: Math.floor(Math.random() * 1000) + 1,
            adi: projeData.adi
        }
    };
};
  */



// Proje kaydetme
async function saveProje(e) { 
  e.preventDefault();
  
  const projeAdi = document.getElementById('projeAdi').value.trim();
  
  if (!projeAdi) {
      showToast('Lütfen proje adını girin.', 'error'); // alert yerine showToast
      return;
  }
  
  try {
      // API kontrolü
      if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
          console.error('Database invoke metodu bulunamadı');
          showToast('Proje eklenemedi. API erişimi yok.', 'error');
          return;
      }

      const result = await window.electronAPI.invoke.database.addProje({ proje_adi: projeAdi });
      
      if (result.success) {
          showToast(`Proje başarıyla eklendi.\nProje Kodu: ${result.projeKodu}`, 'success');
          
          // Formu temizle
          document.getElementById('yeniProjeForm').reset();
          
          // Yeni proje modalını kapat
          closeModal('yeniProjeModal');
          
          // Proje listesini güncelle
          await loadProjeler();
          
          // Eğer işlem modalından geldiyse, işlem modalını tekrar aç
          if (currentParcaId) {
              openModal('islemModal');
              
              // Yeni projeyi seç
              document.getElementById('projeSecimi').value = result.projeId;
          }
      } else {
          showToast('Hata: ' + result.message, 'error');
      }
  } catch (error) {
      console.error('Proje kaydetme hatası:', error);
      showToast('Proje kaydedilirken bir hata oluştu.', 'error');
  }
}


window.saveYeniProje = saveYeniProje;
window.saveYeniMusteri = saveYeniMusteri;
window.saveProje = saveProje;