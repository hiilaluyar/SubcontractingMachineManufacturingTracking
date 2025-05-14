
/* Bu kod şunları yapıyor:

DOMContentLoaded olayını dinliyor, yani sayfa tamamen yüklendiğinde çalışıyor
Sayfada "detayModal" adlı bir element bulunup bulunmadığını kontrol ediyor
Eğer bu element bulunursa, ona bir MutationObserver ekliyor - bu observer DOM'daki değişiklikleri izliyor
Observer özellikle detayModal'ın stil özelliğindeki değişiklikleri izliyor
Eğer detayModal görünür hale gelirse (style.display = 'block') ve:

Eğer mevcut hammadde türü "boru" veya "mil" ise
"plakalar-tab" adlı sekmeyi gizler
"parcalar-tab" adlı sekmeye otomatik olarak tıklar



Basitçe ifade etmek gerekirse, bu kod, hammadde detay modalı açıldığında ve 
hammadde türü "boru" veya "mil" ise, otomatik olarak "plakalar" sekmesini gizleyip kullanıcı için "parçalar" 
sekmesini etkinleştiriyor. Bu da kullanıcı deneyimini iyileştiren otomatik bir özellik sağlıyor, çünkü boru ve 
mil tipleri için plaka değil sadece parça işlemleri yapılabiliyor. */



document.addEventListener('DOMContentLoaded', function() {
    const detayModal = document.getElementById('detayModal');
  
    if (detayModal) {
      const observer = new MutationObserver(function(mutations) {
        for (const mutation of mutations) {
          if (mutation.attributeName === 'style' && detayModal.style.display === 'block') {
            if (currentHammadde?.hammadde_turu === 'boru' || currentHammadde?.hammadde_turu === 'mil') {
              console.log('Boru/Mil için parçalar tabı seçiliyor...');
              
              const plakaTab = document.querySelector('.tab-button[data-tab="plakalar-tab"]');
              if (plakaTab) plakaTab.style.display = 'none';
  
              const parcaTab = document.querySelector('.tab-button[data-tab="parcalar-tab"]');
              if (parcaTab) parcaTab.click();
            }
          }
        }
      });
  
      observer.observe(detayModal, { attributes: true });
    }
  });




// Add event listeners when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Add event listener for part process modal
  const parcaIslemModal = document.getElementById('parcaIslemModal');
  if (parcaIslemModal) {
      // When modal is being shown, load projects
      parcaIslemModal.addEventListener('show', function() {
          loadProjesForParcaIslemModal();
      });
  }
  
  // Event listener for calculate button
  const hesaplaParcaKalanParcaBtn = document.getElementById('hesaplaParcaKalanParcaBtn');
  if (hesaplaParcaKalanParcaBtn) {
      hesaplaParcaKalanParcaBtn.addEventListener('click', hesaplaParcaKalanParca);
  }
  
  // Event listener for save button
  const parcaIslemKaydetBtn = document.getElementById('parcaIslemKaydetBtn');
  if (parcaIslemKaydetBtn) {
      parcaIslemKaydetBtn.addEventListener('click', saveParcaIslem);
  }
  
  // Event listener for new project button
  const parcaYeniProjeEkleBtn = document.getElementById('parcaYeniProjeEkleBtn');
  if (parcaYeniProjeEkleBtn) {
      parcaYeniProjeEkleBtn.addEventListener('click', function() {
          openYeniProjeModal('parcaIslemModal');
      });
  }
  
  // Fix for the yeni proje form submission
  const yeniProjeForm = document.getElementById('yeniProjeForm');
  if (yeniProjeForm) {
      yeniProjeForm.addEventListener('submit', saveYeniProje);
  }
});

document.addEventListener('DOMContentLoaded', function() {
  // Yeni proje formu submit event listener
  const yeniProjeForm = document.getElementById('yeniProjeForm');
  if (yeniProjeForm) {
      yeniProjeForm.addEventListener('submit', saveYeniProje);
  }
  
  // Proje ekleme butonlarına click event listener
  const yeniProjeEkleBtnler = [
      document.getElementById('plakaYeniProjeEkleBtn'),
      document.getElementById('yeniProjeBtn'),
      document.getElementById('parcaYeniProjeEkleBtn'),
      document.getElementById('sarfMalzemeYeniProjeEkleBtn'),
      document.getElementById('yariMamulYeniProjeEkleBtn'),
      document.getElementById('ikincilStokYeniProjeEkleBtn')
  ];
  
  yeniProjeEkleBtnler.forEach(btn => {
      if (btn) {
          btn.addEventListener('click', function() {
              const sourceModalId = btn.closest('.modal')?.id || null;
              openYeniProjeModal(sourceModalId);
          });
      }
  });
  
  // Sayfa yüklendiğinde proje listesini yükle
  loadProjeler();
});

/** **************************************************** */


  
  // Sayfa yüklendiğinde olayları bağlama
  document.addEventListener('DOMContentLoaded', function() {
    // Modalleri ve olaylarını bağla
    setupIslemModals();
    
    // Yeni müşteri formunu bağla
    const yeniMusteriForm = document.getElementById('yeniMusteriForm');
    if (yeniMusteriForm) {
      yeniMusteriForm.addEventListener('submit', saveYeniMusteri);
    }
    
    // Müşteri ekleme butonlarını bağla
    const musteriEkleButtons = [
      document.getElementById('parcaYeniMusteriEkleBtn'),
      document.getElementById('plakaYeniMusteriEkleBtn')
    ];
    
    musteriEkleButtons.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', function() {
          const sourceModalId = this.closest('.modal')?.id;
          openYeniMusteriModal(sourceModalId);
        });
      }
    });
    
    // İşlem alanı değişikliğinde formları güncelle
    const kullanimAlaniSelects = [
      document.getElementById('plakaKullanimAlani'),
      document.getElementById('parcaKullanimAlani')
    ];
    
    kullanimAlaniSelects.forEach(select => {
      if (select) {
        const id = select.id;
        const toggleFunction = id === 'plakaKullanimAlani' ? togglePlakaFormSections : toggleParcaFormSections;
        select.addEventListener('change', toggleFunction);
      }
    });
  });
  
  // İşlem modallarını kurulum
  function setupIslemModals() {
    // Plaka işlem düğmelerini bağla
    document.getElementById('plakaIslemKaydetBtn')?.addEventListener('click', savePlakaIslem);
    
    // Parça işlem düğmelerini bağla
    document.getElementById('parcaIslemKaydetBtn')?.addEventListener('click', saveParcaIslem);
  }


  
// Sayfa yüklendiğinde kalan parça için event listener'ları kur
document.addEventListener('DOMContentLoaded', function() {
  // Hesaplama butonları
  const hesaplaKalanParcaBtn = document.getElementById('hesaplaKalanParcaBtn');
  const hesaplaParcaKalanParcaBtn = document.getElementById('hesaplaParcaKalanParcaBtn');
  
  if (hesaplaKalanParcaBtn) {
      hesaplaKalanParcaBtn.addEventListener('click', calculatePlakaWithKalanParca);
  }
  
  if (hesaplaParcaKalanParcaBtn) {
      hesaplaParcaKalanParcaBtn.addEventListener('click', hesaplaParcaKalanParca);
  }
  
  // Parça ekleme butonları
  const ekleKalanParcaBtn = document.getElementById('ekleKalanParcaBtn');
  const ekleParcaKalanParcaBtn = document.getElementById('ekleParcaKalanParcaBtn');
  
  if (ekleKalanParcaBtn) {
      ekleKalanParcaBtn.addEventListener('click', addKalanParca);
  }
  
  if (ekleParcaKalanParcaBtn) {
      ekleParcaKalanParcaBtn.addEventListener('click', addParcaKalanParca);
  }
  
  // Kullanılan miktar değişim handler'ları
  setupKullanilanMiktarChangeHandlers();
  
  // Kalan parça switch handler'ları
  setupKalanParcaSwitchHandlers();
  
  // İşlem formları submit handler'ları
  setupIslemFormHandlers();
  

});



// Plaka hesaplama fonksiyonları
document.addEventListener('DOMContentLoaded', function() {
  // Plaka Hesaplama butonuna event listener ekle
  const hesaplaPlakaBtn = document.getElementById('hesaplaPlakaBtn');
  if (hesaplaPlakaBtn) {
      hesaplaPlakaBtn.addEventListener('click', calculatePlakaWithTolerance);
  }
  
  // Plaka Kaydet butonuna event listener ekle
  const plakaKaydetBtn = document.getElementById('plakaKaydetBtn');
  if (plakaKaydetBtn) {
      plakaKaydetBtn.addEventListener('click', savePlakaMultiple);
  }
});

// Yeni Plaka Modalı açıldığında event listener
document.addEventListener('DOMContentLoaded', function() {
  const yeniPlakaModal = document.getElementById('yeniPlakaModal');
  const closeModalBtn = yeniPlakaModal?.querySelector('.close');
  
  // Modal kapatma butonuna tıklandığında
  if (closeModalBtn) {
      closeModalBtn.addEventListener('click', function() {
          resetPlakaModal();
      });
  }
  
  // Modal dışına tıklandığında
  window.addEventListener('click', function(event) {
      if (event.target === yeniPlakaModal) {
          resetPlakaModal();
      }
  });
});




// Event listener'ları düzgün kurmak için sayfa yüklendiğinde çağrılacak fonksiyon
document.addEventListener('DOMContentLoaded', function() {
  setupPlakaKaydetEventListener();
  
  // Plaka modalı kapandığında temizleme yapılmasını sağla
  const yeniPlakaModal = document.getElementById('yeniPlakaModal');
  if (yeniPlakaModal) {
      yeniPlakaModal.addEventListener('close', onPlakaModalClose);
  }
});

// Mock elektron API tanımlama (geliştirme sırasında)
if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
  window.electronAPI = window.electronAPI || {};
  window.electronAPI.invoke = window.electronAPI.invoke || {};
  window.electronAPI.invoke.database = window.electronAPI.invoke.database || {};
  
  // Mock addPlaka fonksiyonu
  window.electronAPI.invoke.database.addPlaka = async (plakaData) => {
      console.log('Mock addPlaka çağrıldı:', plakaData);
      
      return {
          success: true,
          plakaId: Math.floor(Math.random() * 1000) + 1,
          stokKodu: 'PL' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
          barkod: plakaData.barkod || ('SL' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0'))
      };
  };
}



document.addEventListener('DOMContentLoaded', function() {
  // Global event listener ekle
  document.addEventListener('click', function(event) {
    // Plaka işlem düğmelerine tıklama
    if (event.target.closest('.action-btn.process') && 
        event.target.closest('[onclick*="openPlakaIslemModal"]')) {
      // İşlem gerçekleşmeden önce projeleri yükle
      loadProjeler().then(() => {
        console.log('Plaka işlem modalı için projeler yüklendi');
      }).catch(err => {
        console.error('Projeler yüklenirken hata:', err);
      });
    }
    
    // Parça işlem düğmelerine tıklama
    if (event.target.closest('.action-btn.process') && 
        event.target.closest('[onclick*="openParcaIslemModal"]')) {
      // İşlem gerçekleşmeden önce projeleri yükle
      loadProjeler().then(() => {
        console.log('Parça işlem modalı için projeler yüklendi');
      }).catch(err => {
        console.error('Projeler yüklenirken hata:', err);
      });
    }
  });
  
  // DOMContentLoaded'da hemen bir kez projeleri yükle
  if (typeof loadProjeler === 'function') {
    loadProjeler().then(() => {
      console.log('Sayfa yüklenirken projeler yüklendi');
    }).catch(err => {
      console.error('Başlangıç proje yüklemesinde hata:', err);
    });
  } else {
    console.warn('loadProjeler fonksiyonu henüz tanımlanmamış');
  }
  
  // Modal açıldığında projeleri yükleme
  const setupModalProjectLoading = function() {
    const modalOpenFuncs = [
      { funcName: 'openPlakaIslemModal', selectId: 'plakaProjeSecimi' },
      { funcName: 'openParcaIslemModal', selectId: 'parcaProjeSecimi' }
    ];
    
    modalOpenFuncs.forEach(item => {
      // Orijinal fonksiyonu yedekle
      const originalFunc = window[item.funcName];
      if (typeof originalFunc === 'function') {
        window[item.funcName] = async function() {
          // Orijinal fonksiyonu çağır
          const result = originalFunc.apply(this, arguments);
          
          // Modalın tamamen açılmasını bekle
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Projeleri yükle
          try {
            const projectResult = await loadProjeler();
            console.log(`Projeler ${item.funcName} için yüklendi`);
            
            // Select elementine stil ekle
            const selectElement = document.getElementById(item.selectId);
            if (selectElement) {
              // Stil ayarları
              selectElement.style.color = '#333';
              
              // Tüm option elementlerine stil ekle
              Array.from(selectElement.options).forEach(option => {
                option.style.color = '#333';
                option.style.backgroundColor = '#fff';
              });
            }
          } catch (error) {
            console.error(`${item.funcName} için proje yükleme hatası:`, error);
          }
          
          return result;
        };
      }
    });
  };
  
  // Setup fonksiyonunu çağır
  setupModalProjectLoading();
  
  // Modal açılma olaylarını dinle
  document.querySelectorAll('.modal').forEach(modal => {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'style' && 
            modal.style.display === 'block') {
          // Modal açıldığında projeleri yükle
          if (modal.id === 'plakaIslemModal' || modal.id === 'parcaIslemModal') {
            loadProjeler().then(() => {
              console.log(`${modal.id} için projeler yüklendi`);
              
              // Proje seçim alanlarını bul ve stil ekle
              const selectId = modal.id === 'plakaIslemModal' ? 'plakaProjeSecimi' : 'parcaProjeSecimi';
              const selectElement = document.getElementById(selectId);
              
              if (selectElement) {
                // Stil uygulamaları
                selectElement.style.color = '#333';
                Array.from(selectElement.options).forEach(option => {
                  option.style.color = '#333';
                  option.style.backgroundColor = '#fff';
                });
              }
            });
          }
        }
      });
    });
    
    observer.observe(modal, { attributes: true });
  });
});

document.addEventListener('DOMContentLoaded', function () {
  setupModalEvents();

  // İskarta Ürünler sayfası yükleme eventi
  const iskartaUrunLink = document.querySelector('a[data-page="iskarta-urunler"]');
  if (iskartaUrunLink) {
      iskartaUrunLink.addEventListener('click', function () {
          console.log('Iskarta ürünler sayfası yükleniyor...');
          loadIskartaUrunler();
      });
  }

  // Sayfa geçiş linkleri için event listener ekleme
  const navLinks = document.querySelectorAll('.nav-links li a');
  navLinks.forEach(link => {
      link.addEventListener('click', function () {
          const pageName = this.getAttribute('data-page');
          if (pageName === 'iskarta-urunler') {
              console.log('Iskarta ürünler sayfası yükleniyor...');
              loadIskartaUrunler();
          }
      });
  });
});


document.addEventListener('DOMContentLoaded', function() {
  // Dashboard CSS'i ekle
  const dashboardStyle = document.createElement('style');
  dashboardStyle.textContent = /* CSS içeriği buraya gelecek */
  document.head.appendChild(dashboardStyle);
  
  // Dashboard verilerini yükle
  updateDashboard();
});


document.addEventListener('DOMContentLoaded', function() {

  
  // Kullanım alanı değiştiğinde yarı mamül alanlarının görünürlüğünü güncelle
  const kullanimAlaniSelect = document.getElementById('kullanimAlani');
  if (kullanimAlaniSelect) {
      kullanimAlaniSelect.addEventListener('change', toggleYariMamulPanelIki);
  }

  // Yeni müşteri ekleme butonu
  const yeniMusteriEkleBtn = document.getElementById('yeniMusteriEkleBtn');
  if (yeniMusteriEkleBtn) {
      yeniMusteriEkleBtn.addEventListener('click', function() {
          closeModal('islemModal');
          openModal('yeniMusteriModal');
      });
  }
  
  // İşlem formu kaydetme butonuna event listener ekleme
  const islemKaydetBtn = document.getElementById('islemKaydetBtn');
  if (islemKaydetBtn) {
      islemKaydetBtn.addEventListener('click', saveIslem);
  }
});




document.addEventListener('DOMContentLoaded', function() {
  // Kullanım alanı değiştiğinde yarı mamül alanlarının görünürlüğünü güncelle
  const kullanimAlaniSelect = document.getElementById('kullanimAlani');
  if (kullanimAlaniSelect) {
      kullanimAlaniSelect.addEventListener('change', toggleYariMamulPanelIki);
  }

  // Yeni müşteri ekleme butonu
  const yeniMusteriEkleBtn = document.getElementById('yeniMusteriEkleBtn');
  if (yeniMusteriEkleBtn) {
      yeniMusteriEkleBtn.addEventListener('click', function() {
          closeModal('islemModal');
          openModal('yeniMusteriModal');
      });
  }
});



document.addEventListener('DOMContentLoaded', function() {

  
  // Form kayıt butonlarını kur
  setupSaveButtonHandlers();
  
  // Kullanım alanı değiştiğinde yarı mamül alanlarının görünürlüğünü güncelle
  const kullanimAlaniSelect = document.getElementById('kullanimAlani');
  if (kullanimAlaniSelect) {
      // Varolan olay dinleyiciyi temizleyelim önce
      kullanimAlaniSelect.removeEventListener('change', toggleYariMamulPanel);
      kullanimAlaniSelect.addEventListener('change', toggleYariMamulPanelIki);
  }

  // Yeni müşteri ekleme butonu
  const yeniMusteriEkleBtn = document.getElementById('yeniMusteriEkleBtn');
  if (yeniMusteriEkleBtn) {
      yeniMusteriEkleBtn.addEventListener('click', function() {
          closeModal('islemModal');
          openModal('yeniMusteriModal');
      });
  }

  // Yeni müşteri formu olaylarını kur
  const yeniMusteriForm = document.getElementById('yeniMusteriForm');
  if (yeniMusteriForm) {
      yeniMusteriForm.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const musteriAdi = document.getElementById('musteriAdi').value.trim();
          
          if (!musteriAdi) {
              document.getElementById('yeniMusteriModal-error').textContent = 'Lütfen müşteri adı girin.';
              return;
          }
          
          try {
              const result = await window.electronAPI.invoke.database.addMusteri({
                  musteri_adi: musteriAdi,  // musteri_adi olarak değiştirildi (sizin API'nize bağlı olarak)
                  ekleyen_id: currentUser.id
              });
              
              if (result.success) {
                  document.getElementById('yeniMusteriModal-success').textContent = 'Müşteri başarıyla eklendi.';
                  
                  // Formu sıfırla
                  yeniMusteriForm.reset();
                  
                  // Biraz bekleyip modalı kapat
                  setTimeout(() => {
                      closeModal('yeniMusteriModal');
                      
                      // İşlem modalını yeniden aç ve müşteri listesini güncelle
                      openIslemModal(currentParcaId, currentParcaNo);
                  }, 1000);
              } else {
                  document.getElementById('yeniMusteriModal-error').textContent = 'Hata: ' + result.message;
              }
          } catch (error) {
              console.error('Müşteri ekleme hatası:', error);
              document.getElementById('yeniMusteriModal-error').textContent = 'Müşteri eklenirken bir hata oluştu.';
          }
      });
  }
});


