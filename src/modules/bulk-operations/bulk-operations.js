/* function setupBulkPlakaProcessing() {
    console.log('Toplu plaka işleme özelliği kurulum başlatılıyor...');
    
    // CSS stil ekleme
    addBulkPlakaStyles();
    
    // Plaka işlemi için original fonksiyonu yedekle
    if (typeof window.openPlakaIslemModal === 'function' && !window.originalOpenPlakaIslemModal) {
        console.log('Original openPlakaIslemModal fonksiyonu yedekleniyor...');
        window.originalOpenPlakaIslemModal = window.openPlakaIslemModal;
        
        // Fonksiyonu geçersiz kıl
        window.openPlakaIslemModal = async function(plakaId) {
            // Global değişkeni temizle
            window.currentBulkPlakas = null;
            
            // Orijinal fonksiyonu çağır - tek plaka işlemi
            return window.originalOpenPlakaIslemModal(plakaId);
        };
    }
    
    console.log('Toplu plaka işleme özelliği kurulumu tamamlandı.');
  }


  
document.addEventListener('DOMContentLoaded', function() {
    setupBulkPlakaProcessing();
  });    


  window.setupBulkPlakaProcessing = setupBulkPlakaProcessing;   */


// Tab sistemi kurulduğunda, plaka listesini yükleme fonksiyonunu geçersiz kıl
/* function setupTabSystemWithBulkActions() {
    // Tab butonlarına click olayı ekle
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Eğer plakalar tab'ı seçildiyse, plaka listesini güncelle
            if (tabId === 'plakalar-tab') {
                // Hammadde ID'si mevcut ise
                if (currentHammaddeId) {
                    // Plaka listesini yükle - yeni toplu işlem versiyonu ile
                    loadPlakaList(currentHammaddeId);
                }
            }
        });
    });
    
    console.log('Tab sistem entegrasyonu tamamlandı.');
  }
  
  // Hammadde detay modalı açıldığında olayı dinle
  document.addEventListener('click', function(event) {
    // viewHammaddeDetail fonksiyonuna tıklandıysa
    if (event.target.closest('[onclick*="viewHammaddeDetail"]')) {
        // Mod al açıldıktan sonra tab sistemini kur
        setTimeout(() => {
            setupTabSystemWithBulkActions();
        }, 500);
    }
  }); */
  

  

function togglePlakaSelection(plakaId, isSelected) {
    if (isSelected) {
        // Eğer plaka zaten seçiliyse, tekrar ekleme
        if (!selectedPlakas.includes(plakaId)) {
            selectedPlakas.push(plakaId);
        }
    } else {
        // Plakayı listeden çıkar
        selectedPlakas = selectedPlakas.filter(id => id !== plakaId);
    }
    
    // Seçili plaka sayısını güncelle
    updateSelectedPlakasCount();
    
    // Toplu işlem butonlarının görünürlüğünü güncelle
    const bulkActionsDiv = document.getElementById('plaka-bulk-actions');
    if (bulkActionsDiv) {
        bulkActionsDiv.style.display = selectedPlakas.length > 0 ? 'flex' : 'none';
    }
  }
  
  function updateSelectedPlakasCount() {
    const countSpan = document.getElementById('plaka-selected-count');
    if (countSpan) {
        countSpan.textContent = selectedPlakas.length;
    }
  }
  



// Seçili plakalara toplu işlem yap
async function processBulkPlakas() {
    if (selectedPlakas.length === 0) {
        showToast('Lütfen en az bir plaka seçin.', 'warning');
        return;
    }
    
    try {
        // Seçilen plakaların bilgilerini al
        const plakaDetails = [];
        
        for (const plakaId of selectedPlakas) {
            const result = await window.electronAPI.invoke.database.getPlakaById(plakaId);
            if (result.success) {
                plakaDetails.push(result.plaka);
            }
        }
        
        if (plakaDetails.length === 0) {
            showToast('Seçilen plakalar bulunamadı.', 'error');
            return;
        }
        
        // Tüm plakalar aynı hammadde için olmalı, kontrol et
        const firstHammaddeId = plakaDetails[0].hammadde_id;
        const allSameHammadde = plakaDetails.every(plaka => plaka.hammadde_id === firstHammaddeId);
        
        if (!allSameHammadde) {
            showToast('Seçilen plakalar farklı hammaddelerden oluşuyor. Lütfen aynı hammaddeden plakaları seçin.', 'error');
            return;
        }
        
        // Tüm plakalar tükenmiş olmamalı
        const anyTukenmis = plakaDetails.some(plaka => plaka.durum === 'TUKENDI');
        if (anyTukenmis) {
            showToast('Seçilen plakalar arasında tükenmiş plakalar var. Lütfen sadece kullanılabilir plakaları seçin.', 'error');
            return;
        }
        
        // Toplam kalan ağırlık
        const totalRemainingWeight = plakaDetails.reduce((total, plaka) => total + parseFloat(plaka.kalan_kilo), 0);
        
        // Global değişkene seçilen plakaları ata
        window.currentBulkPlakas = {
            plakaIds: selectedPlakas,
            plakaDetails: plakaDetails,
            totalRemainingWeight: totalRemainingWeight
        };
        
        // İlk plakayı currentPlaka olarak ata (uyumluluk için)
        currentPlakaId = plakaDetails[0].id;
        currentPlaka = plakaDetails[0];
        
        // Toplu işlem modalını aç
        openBulkPlakaIslemModal();
    } catch (error) {
        console.error('Toplu plaka işlemi başlatma hatası:', error);
        showToast('Toplu plaka işlemi başlatılırken bir hata oluştu.', 'error');
    }
  }


  async function openBulkPlakaIslemModal() {
    try {
        if (!window.currentBulkPlakas || window.currentBulkPlakas.plakaDetails.length === 0) {
            showToast('Lütfen önce plakaları seçin.', 'warning');
            return;
        }
        
        const bulkPlakas = window.currentBulkPlakas;
        
        // Plaka işlem modalındaki başlığı güncelle
        const plakaHeader = document.getElementById('plakaHeader');
        if (plakaHeader) {
            const selectedCount = bulkPlakas.plakaIds.length;
            if (selectedCount === 1) {
                plakaHeader.textContent = `#${bulkPlakas.plakaDetails[0].stok_kodu}`;
            } else {
                plakaHeader.textContent = `${selectedCount} Plaka Seçildi`;
            }
        }
        
        // Bilgi alanı ekle
        const infoArea = document.createElement('div');
        infoArea.id = 'bulkPlakaInfo';
        infoArea.className = 'bulk-info-panel';
        infoArea.innerHTML = `
            <div class="info-item">
                <span class="info-label">Toplam Kalan Ağırlık:</span>
                <span class="info-value">${bulkPlakas.totalRemainingWeight.toFixed(2)} kg</span>
            </div>
            <div class="info-item">
                <span class="info-label">Seçilen Plaka Sayısı:</span>
                <span class="info-value">${bulkPlakas.plakaIds.length}</span>
            </div>
        `;
        
        // Formları sıfırla
        resetPlakaIslemForm();
        
        // Mevcut bilgi paneli varsa kaldır
        const existingInfoPanel = document.getElementById('bulkPlakaInfo');
        if (existingInfoPanel) {
            existingInfoPanel.remove();
        }
        
        // Bilgi panelini ekle - form başlangıcına
        const form = document.querySelector('#plakaIslemModal .plaka-islem-form');
        if (form) {
            form.insertBefore(infoArea, form.firstChild);
        }
        
        // Projeleri yükle
        await loadProjelerForPlakaIslemModal();
        
        // Müşteri listesini yükle
        await loadMusteriler();
        
        // Çalışan listesini yükle
        await loadCalisanlar();
        
        // Form alanlarını güncelle
        togglePlakaFormSections();
        
        // İşlem modalını aç
        openModal('plakaIslemModal');
        
        // Detay modalını kapat
        closeModal('detayModal');
        
        
    } catch (error) {
        console.error('Toplu plaka işlem modalı açma hatası:', error);
        showToast('Toplu plaka işlem modalı açılırken bir hata oluştu.', 'error');
    }
  }


  window.togglePlakaSelection=togglePlakaSelection;
  window.updateSelectedPlakasCount=updateSelectedPlakasCount;
  window.processBulkPlakas = processBulkPlakas;
  window.openBulkPlakaIslemModal = openBulkPlakaIslemModal;
