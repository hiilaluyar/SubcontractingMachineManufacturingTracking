
/* 
// Modalı açtığında projeleri yükle
async function openPlakaIslemModal(plakaId) {
    try {
      // Global değişkeni ayarla
      currentPlakaId = plakaId;
      
      // Plaka bilgilerini al
      const result = await window.electronAPI.invoke.database.getPlakaById(plakaId);
      
      if (result.success) {
        currentPlaka = result.plaka;
        
        // Modal başlığını ayarla
        const plakaHeader = document.getElementById('plakaHeader');
        if (plakaHeader) {
          plakaHeader.textContent = `#${result.plaka.stok_kodu || ''}`;
        }
        
        // Modal formunu sıfırla
        resetPlakaIslemForm();
        
        // Projeleri yükle - bu fonksiyonun tanımlı olduğundan emin olun
        try {
          await loadProjeler();
          console.log('Plaka işlem modalı için projeler yüklendi');
        } catch (error) {
          console.error('Projeler yüklenirken hata:', error);
        }
        
        // Müşterileri yükle
        try {
          await loadMusteriler();
          console.log('Müşteriler yüklendi');
        } catch (error) {
          console.error('Müşteriler yüklenirken hata:', error);
        }
        
        // Çalışanları yükle
        try {
          await loadCalisanlar();
          console.log('Çalışanlar yüklendi');
        } catch (error) {
          console.error('Çalışanlar yüklenirken hata:', error);
        }
        
        // Form alanlarını güncelle
        togglePlakaFormSections();
        
        // Önemli: detay modalını kapat, plaka işlem modalını aç
        closeModal('detayModal');
        
        // Önce mevcut herhangi bir açık modalı kapat, böylece çakışmayı önle
        document.querySelectorAll('.modal').forEach(modal => {
          if (modal.style.display === 'block' && modal.id !== 'detayModal') {
            closeModal(modal.id);
          }
        });
        
        // İşlem modalını aç
        setTimeout(() => {
          openModal('plakaIslemModal');
          console.log('Plaka işlem modalı açıldı');
          
          // Select elementlerinin stil düzeltmesi
          setTimeout(() => {
            const projectSelect = document.getElementById('plakaProjeSecimi');
            if (projectSelect) {
              projectSelect.style.color = '#333';
              Array.from(projectSelect.options).forEach(option => {
                option.style.color = '#333';
                option.style.backgroundColor = '#fff';
              });
            }
          }, 200);
        }, 300);
        
      } else {
        showToast('Plaka bilgileri alınamadı: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Plaka işlem modalı açma hatası:', error);
      showToast('Plaka işlem modalı açılırken bir hata oluştu.', 'error');
    }
  }  */


   /* async function openCorrectIslemModal(parcaId, parcaNo) {
        try {
            // Önce parça bilgisini alın ve hangi tabloda olduğunu kontrol edin
            const result = await window.electronAPI.invoke.database.getParcaById(parcaId);
            
            if (!result.success) {
                showToast('Parça bilgisi alınamadı: ' + result.message, 'error');
                return;
            }
            
            // Tip bilgisine göre doğru modal'ı açın
            if (result.tip === 'plaka') {
                // Plaka parçası için plaka işlem modal'ını açın
                await openParcaIslemModal(parcaId, parcaNo);
            } else {
                // Parcalar tablosundaki boru veya mil için orijinal işlem modal'ını açın
                await openIslemModal(parcaId, parcaNo);
            }
        } catch (error) {
            console.error('Modal açma hatası:', error);
            showToast('İşlem modalı açılırken bir hata oluştu', 'error');
        }
    }  */


        // Toplu işlem modalını aç





  // Plaka işlemi için müşteri modalını açma
  function openYeniMusteriModal(sourceModal = null) {
    // Modal içeriğini sıfırla
    document.getElementById('musteriAdi').value = '';
    
    // Hata ve başarı alanlarını temizle
    const errorArea = document.getElementById('yeniMusteriModal-error');
    const successArea = document.getElementById('yeniMusteriModal-success');
    if (errorArea) errorArea.textContent = '';
    if (successArea) successArea.textContent = '';
    
    // Modalı aç
    openModal('yeniMusteriModal');
    
    // Kaynak modalı kapatma
    if (sourceModal) {
      closeModal(sourceModal);
    }
  }


  
// Yeni proje modalını açma fonksiyonu
function openYeniProjeModal(sourceModal = null) {
  // Modal içeriğini sıfırla
  const projeAdiInput = document.getElementById('projeAdi');
  if (projeAdiInput) projeAdiInput.value = '';
  
  // Hata ve başarı alanlarını temizle
  const errorArea = document.getElementById('yeniProjeModal-error');
  const successArea = document.getElementById('yeniProjeModal-success');
  
  if (errorArea) errorArea.textContent = '';
  if (successArea) successArea.textContent = '';
  
  // Modalı aç
  openModal('yeniProjeModal');
  
  // Kaynak modalı kapatma
  if (sourceModal) {
      closeModal(sourceModal);
  }
}





function onPlakaModalClose() {
  resetPlakaModal();
  window.isProcessingPlakaSubmit = false;
}


// Modal açma fonksiyonu

function openModal(modalId) {
  document.getElementById(modalId).style.display = 'block';
  document.body.style.overflow = 'hidden'; // Scroll'u engelle
  
  // Eğer bu modal tab sistemi içeriyorsa, tab sistemini sıfırla ve kur
  const modal = document.getElementById(modalId);
  if (modal.querySelector('.tab-container')) {
      resetTabSystem();
      setupTabSystem();
  }
}

// Modal kapatma fonksiyonu
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
  document.body.style.overflow = 'auto'; // Scroll'a izin ver
}


function openYeniPlakaModalWithSelection(hammaddeId) {
  // Hammadde bilgilerini set etmek için önce detayı yükle
  viewHammaddeDetail(hammaddeId);
  
  // Küçük bir gecikme ile modal aç
  setTimeout(() => {
      openYeniPlakaModal();
  }, 100);
}










window.openYeniMusteriModal = openYeniMusteriModal;
window.openYeniProjeModal = openYeniProjeModal;
window.onPlakaModalClose = onPlakaModalClose;
window.openModal = openModal;
window.closeModal = closeModal;
window.openYeniPlakaModalWithSelection=openYeniPlakaModalWithSelection;
