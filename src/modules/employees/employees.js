async function loadCalisanVerileri(options = { loadDropdowns: true, loadTable: true }) {
    try {
      console.log('Çalışan verileri yükleniyor...');
      
      // API kontrolü
      if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
        console.error('Database invoke metodu bulunamadı');
        
        if (options.loadTable) {
          const calisanTable = document.getElementById('calisanTable')?.getElementsByTagName('tbody')[0];
          if (calisanTable) {
            calisanTable.innerHTML = '<tr><td colspan="4" class="text-center">Veri yüklenirken hata oluştu</td></tr>';
          }
        }
        
        return { success: false, message: 'Database API bulunamadı' };
      }
  
      // Veritabanından çalışan listesini al - bir kez çağır
      const result = await window.electronAPI.invoke.database.getAllCalisan();
      
      // Dropdown menüleri doldur
      if (options.loadDropdowns) {
        // Çalışan seçim alanlarını bul
        const calisanSecimleri = [
          document.getElementById('plakaCalisanSecimi'),
          document.getElementById('parcaCalisanSecimi'),
          document.getElementById('sarfMalzemeCalisanSecimi'),
          document.getElementById('calisanSecimi')
          // Diğer çalışan seçim alanları da burada eklenebilir
        ];
        
        // Her çalışan seçim alanını doldur
        calisanSecimleri.forEach(select => {
          if (select) {
            // Önceki seçenekleri temizle
            select.innerHTML = '<option value="">-- Çalışan Seçin --</option>';
            
            // Çalışanları ekle
            if (result.success && result.calisanlar && result.calisanlar.length > 0) {
              result.calisanlar.forEach(calisan => {
                const option = document.createElement('option');
                option.value = calisan.id;
                option.textContent = `${calisan.ad} ${calisan.soyad}`;
                select.appendChild(option);
              });
            }
          }
        });
      }
      
      // Tabloyu doldur
      if (options.loadTable) {
        const calisanTable = document.getElementById('calisanTable')?.getElementsByTagName('tbody')[0];
        
        if (calisanTable) {
          calisanTable.innerHTML = '';
          
          if (!result.success || !result.calisanlar || result.calisanlar.length === 0) {
            const row = calisanTable.insertRow();
            row.innerHTML = '<tr><td colspan="4" class="text-center">Çalışan bulunamadı</td></tr>';
          } else {
            result.calisanlar.forEach(calisan => {
              const row = calisanTable.insertRow();
              
              // Ad
              row.insertCell(0).textContent = calisan.ad;
              
              // Soyad
              row.insertCell(1).textContent = calisan.soyad;
              
              // Oluşturma Tarihi
              const cell3 = row.insertCell(2);
              const date = new Date(calisan.olusturma_tarihi);
              cell3.textContent = date.toLocaleDateString('tr-TR');
              
              // İşlemler
              const islemlerCell = row.insertCell(3);
              islemlerCell.innerHTML = `
                <div class="action-buttons">
                  <button class="action-btn delete" onclick="deleteCalisan(${calisan.id})">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              `;
            });
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Çalışan verileri yükleme hatası:', error);
      
      if (options.loadTable) {
        const calisanTable = document.getElementById('calisanTable')?.getElementsByTagName('tbody')[0];
        if (calisanTable) {
          calisanTable.innerHTML = '<tr><td colspan="4" class="text-center">Veri yüklenirken hata oluştu</td></tr>';
        }
      }
      
      showToast?.('Çalışan verileri yüklenirken bir hata oluştu.', 'error');
      return { success: false, message: 'Çalışan verileri alınamadı.' };
    }
  }
  
  // Eski fonksiyonları korumak için yönlendirme
  async function loadCalisanlar() {
    return loadCalisanVerileri({ loadDropdowns: true, loadTable: false });
  }
  
  async function loadCalisanListesi() {
    loadCalisanVerileri({ loadDropdowns: false, loadTable: true });
  }



// Save new employee
async function saveCalisan(e) {
    if (e) e.preventDefault();
    
    const calisanAdi = document.getElementById('calisanAdi').value.trim();
    const calisanSoyadi = document.getElementById('calisanSoyadi').value.trim();
    
    if (!calisanAdi) {
        showToast('Lütfen çalışan adını girin.', 'error');
        return;
    }
    
    if (!calisanSoyadi) {
        showToast('Lütfen çalışan soyadını girin.', 'error');
        return;
    }
    
    try {
        // API kontrolü
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            showToast('Çalışan eklenemedi. API erişimi yok.', 'error');
            return;
        }

        const result = await window.electronAPI.invoke.database.addCalisan({ 
            ad: calisanAdi,
            soyad: calisanSoyadi 
        });
        
        if (result.success) {
            showToast(`Çalışan başarıyla eklendi.`, 'success');
            
            // Formu temizle
            document.getElementById('yeniCalisanForm').reset();
            
            // Yeni çalışan modalını kapat
            closeModal('yeniCalisanModal');
            
            // Çalışan listesini güncelle
            await loadCalisanListesi();
        } else {
            showToast('Hata: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Çalışan kaydetme hatası:', error);
        showToast('Çalışan kaydedilirken bir hata oluştu.', 'error');
    }
}


// Delete employee
async function deleteCalisan(id) {
    try {
        // Çalışan bilgilerini al
        const calisanResult = await window.electronAPI.invoke.database.getCalisanById(id);
        
        if (!calisanResult.success) {
            showToast('Çalışan bilgileri alınamadı: ' + calisanResult.message, 'error');
            return;
        }
        
        const calisan = calisanResult.calisan;
        
        // Şu anki kullanıcı bilgisini al (global değişkenden)
        if (!window.globalUserData) {
            showToast('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.', 'error');
            return;
        }
        
        // Yönetici kontrolü
        if (window.globalUserData.rol !== 'yonetici') {
            showToast('Bu işlem için yönetici yetkisi gereklidir.', 'error');
            return;
        }
        
        // Çalışan adını ve soyadını birleştir
        const calisanTamAd = `${calisan.ad} ${calisan.soyad}`;
        
        // Silme işlemi için Notiflix ile onay al
        Notiflix.Confirm.show(
            'Çalışan Silme',
            `"${calisanTamAd}" çalışanını silmek istediğinize emin misiniz?`,
            'Evet',
            'Hayır',
            async function() { 
                // Evet butonuna tıklandığında
                const result = await window.electronAPI.invoke.database.deleteCalisan(id);
                
                if (result.success) {
                    showToast('Çalışan başarıyla silindi.', 'success');
                    loadCalisanListesi();
                } else {
                    showToast('Hata: ' + result.message, 'error');
                }
            },
            function() {
                // Hayır butonuna tıklandığında (isteğe bağlı)
                // Burada bir şey yapmak isterseniz ekleyebilirsiniz
            }
        );
    } catch (error) {
        console.error('Çalışan silme hatası:', error);
        showToast('Çalışan silinirken bir hata oluştu.', 'error');
    }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Setup calisan page event listeners
    const calisanSayfasi = document.querySelector('a[data-page="calisan-listesi"]');
    if (calisanSayfasi) {
        calisanSayfasi.addEventListener('click', function() {
            loadCalisanListesi();
        });
    }
    
    // Yeni çalışan butonu
    const yeniCalisanBtn = document.getElementById('yeniCalisanBtn');
    if (yeniCalisanBtn) {
        yeniCalisanBtn.addEventListener('click', function() {
            openModal('yeniCalisanModal');
        });
    }
    
    // Yeni çalışan formu
    const yeniCalisanForm = document.getElementById('yeniCalisanForm');
    if (yeniCalisanForm) {
        yeniCalisanForm.addEventListener('submit', saveCalisan);
    }
    
    // Load employees when the page loads
    loadCalisanListesi();
});



// Çalışanları select box'a yükleme
async function loadCalisanlarForSelect(selectId) {
    try {
        const result = await window.electronAPI.invoke.database.getAllCalisan();
        
        if (result.success) {
            const selectElement = document.getElementById(selectId);
            
            // Mevcut seçenekleri temizle (ilk seçeneği koru)
            while (selectElement.options.length > 1) {
                selectElement.remove(1);
            }
            
            // Yeni çalışanları ekle
            result.calisanlar.forEach(calisan => {
                const option = document.createElement('option');
                option.value = calisan.id;
                option.textContent = `${calisan.ad} ${calisan.soyad}`;
                selectElement.appendChild(option);
            });
        } else {
            console.error('Çalışanlar alınamadı:', result.message);
        }
    } catch (error) {
        console.error('Çalışanlar yüklenirken hata:', error);
    }
}

  // Çalışan listesini yükleme
  async function loadCalisanlar() {
    try {
      // Veritabanından çalışan listesini al
      const result = await window.electronAPI.invoke.database.getAllCalisan();
      
      // Çalışan seçim alanlarını bul
      const calisanSecimleri = [
         document.getElementById('plakaCalisanSecimi'),
        document.getElementById('parcaCalisanSecimi'),
        document.getElementById('sarfMalzemeCalisanSecimi'),
        document.getElementById('calisanSecimi'),
        document.getElementById('yariMamulCalisanSecimi')
        // Diğer çalışan seçim alanları da burada eklenebilir
      ];
      
      // Her çalışan seçim alanını doldur
      calisanSecimleri.forEach(select => {
        if (select) {
          // Önceki seçenekleri temizle
          select.innerHTML = '<option value="">-- Çalışan Seçin --</option>';
          
          // Çalışanları ekle
          if (result.success && result.calisanlar && result.calisanlar.length > 0) {
            result.calisanlar.forEach(calisan => {
              const option = document.createElement('option');
              option.value = calisan.id;
              option.textContent = `${calisan.ad} ${calisan.soyad}`;
              select.appendChild(option);
            });
          }
        }
      });
      
      return result;
    } catch (error) {
      console.error('Çalışan listesi yükleme hatası:', error);
      showToast('Çalışan listesi yüklenirken bir hata oluştu.', 'error');
      return { success: false, message: 'Çalışan listesi alınamadı.' };
    }
  }


  
// Çalışanları select box'a yükleme
async function loadCalisanlarForSelect(selectId) {
  try {
      const result = await window.electronAPI.invoke.database.getAllCalisan();
      
      if (result.success) {
          const selectElement = document.getElementById(selectId);
          
          // Mevcut seçenekleri temizle (ilk seçeneği koru)
          while (selectElement.options.length > 1) {
              selectElement.remove(1);
          }
          
          // Yeni çalışanları ekle
          result.calisanlar.forEach(calisan => {
              const option = document.createElement('option');
              option.value = calisan.id;
              option.textContent = `${calisan.ad} ${calisan.soyad}`;
              selectElement.appendChild(option);
          });
      } else {
          console.error('Çalışanlar alınamadı:', result.message);
      }
  } catch (error) {
      console.error('Çalışanlar yüklenirken hata:', error);
  }
}



window.loadCalisanlar = loadCalisanlar;
window.loadCalisanListesi = loadCalisanListesi;
window.saveCalisan = saveCalisan;
window.deleteCalisan = deleteCalisan;
window.loadCalisanlarForSelect = loadCalisanlarForSelect;
window.loadCalisanVerileri = loadCalisanVerileri;
window.loadCalisanlarForSelect = loadCalisanlarForSelect;