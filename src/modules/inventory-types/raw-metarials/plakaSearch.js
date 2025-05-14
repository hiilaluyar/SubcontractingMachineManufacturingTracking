// plakaSearch.js - İşlemdeki plaka filtresi sorunu düzeltildi
let filteredPlakaIds = [];

document.addEventListener('DOMContentLoaded', function() {
    // Hammadde detay modalını izle
    setupPlakaSearchPanel();
});
  
// Detay modalı her açıldığında veya kapandığında izle
function setupPlakaSearchPanel() {
    const detayModal = document.getElementById('detayModal');
    if (!detayModal) return;
    
    const observer = new MutationObserver(function(mutations) {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'style') {
          // Modal açıldıysa, plakalar tabını kontrol et
          if (detayModal.style.display === 'block') {
            // Bekleme süresi olmadan hemen arama panelini ekle ve filtreleme yap
            addSearchPanelToPlakaTab();
          } 
          // Modal kapandıysa, arama kriterlerini reset et
          else if (detayModal.style.display === 'none') {
            resetSearchPanel();
          }
        }
      }
    });
    
    observer.observe(detayModal, { attributes: true });
}
  
// Modal kapandığında arama panelini sıfırla
function resetSearchPanel() {
    // Arama form elemanlarını temizle
    const searchInputs = [
      'plakaEnMin', 'plakaEnMax', 'plakaBoyMin', 'plakaBoyMax', 'plakaDurumFilter'
    ];
    
    searchInputs.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        if (id === 'plakaDurumFilter') {
          element.value = 'TAM'; // Durum filtresini TAM'a resetle
        } else {
          element.value = ''; // Diğer alanları temizle
        }
      }
    });
    
    // Ayrıca global değişken olarak arama durumunu takip et
    window.lastPlakaSearchCriteria = {
      enMin: 0,
      enMax: Number.MAX_SAFE_INTEGER,
      boyMin: 0,
      boyMax: Number.MAX_SAFE_INTEGER,
      durum: 'TAM'
    };
}
  
// Plakalar tabına arama paneli ekle
function addSearchPanelToPlakaTab() {
    // Plakalar tabını bul
    const plakalarTab = document.getElementById('plakalar-tab');
    if (!plakalarTab) return;
    
    // Eğer arama paneli zaten eklenmişse, tekrar ekleme
    if (document.getElementById('plakaSearchPanel')) {
      // Mevcut panel varsa, sadece filtrelemeyi uygula
      document.getElementById('plakaDurumFilter').value = 'TAM';
      filterPlakalar();
      return;
    }
    
    console.log("Arama paneli ekleniyor...");
    
    // Arama panelini oluştur
    const searchPanel = document.createElement('div');
    searchPanel.id = 'plakaSearchPanel';
    searchPanel.className = 'plaka-search-panel';
    searchPanel.innerHTML = `
      <div class="search-panel-header">
        <h4>Plaka Arama</h4>
      </div>
      <div class="search-panel-body">
        <div class="search-row">
          <div class="search-group">
            <label for="plakaEnMin">En (mm)</label>
            <div class="range-inputs">
              <input type="number" id="plakaEnMin" placeholder="Min" min="0">
              <span>-</span>
              <input type="number" id="plakaEnMax" placeholder="Max" min="0">
            </div>
          </div>
          <div class="search-group">
            <label for="plakaBoyMin">Boy (mm)</label>
            <div class="range-inputs">
              <input type="number" id="plakaBoyMin" placeholder="Min" min="0">
              <span>-</span>
              <input type="number" id="plakaBoyMax" placeholder="Max" min="0">
            </div>
          </div>
          <div class="search-group">
            <label for="plakaDurumFilter">Durum</label>
            <select id="plakaDurumFilter">
              <option value="TAM">Tam</option>
              <option value="KISMEN_KULLANILDI">Kısmen Kullanıldı</option>
              <option value="ISLEMDE">İşlemde</option>
              <option value="ALL">Tümü</option>
            </select>
          </div>
        </div>
        <div class="search-actions">
          <button id="plakaAramaBtn" class="btn-primary">
            <i class="fas fa-search"></i> Ara
          </button>
          <button id="plakaAramaTemizleBtn" class="btn-secondary">
            <i class="fas fa-times"></i> Temizle
          </button>
        </div>
      </div>
    `;
    
    // Arama panelini action-bar'dan sonra, başlıktan önce ekle
    const actionBar = plakalarTab.querySelector('.action-bar');
    const heading = plakalarTab.querySelector('h3');
    
    if (actionBar && heading) {
      actionBar.parentNode.insertBefore(searchPanel, heading);
    } else {
      // Action bar yoksa, doğrudan başa ekle
      plakalarTab.insertBefore(searchPanel, plakalarTab.firstChild);
    }
    
    // CSS stillerini ekle
    addPlakaSearchStyles();
    
    // Input ve select field'lara her değişiklikte otomatik arama için event listener ekle
    const setupInputListeners = function() {
      // Arama butonuna event listener ekle
      const aramaBtn = document.getElementById('plakaAramaBtn');
      if (aramaBtn) {
        aramaBtn.addEventListener('click', filterPlakalar);
      }
      
      // Temizle butonuna event listener ekle
      const temizleBtn = document.getElementById('plakaAramaTemizleBtn');
      if (temizleBtn) {
        temizleBtn.addEventListener('click', clearPlakaSearch);
      }
      
      // Input ve select field'lar için otomatik arama
      const searchFields = [
        'plakaEnMin', 'plakaEnMax', 'plakaBoyMin', 'plakaBoyMax', 'plakaDurumFilter'
      ];
      
      searchFields.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          // Input'lara input ve change eventi ekle
          if (element.tagName === 'INPUT') {
            // Input eventi giriş yaparken sürekli tetiklenir
            element.addEventListener('input', function() {
              // Sadece her 300ms'de bir tetikle
              clearTimeout(element.searchTimeout);
              element.searchTimeout = setTimeout(filterPlakalar, 300);
            });
            
            // Change eventi ise alanın focus'u kaybolduğunda tetiklenir
            element.addEventListener('change', filterPlakalar);
          }
          // Select listesine change eventi ekle
          else if (element.tagName === 'SELECT') {
            element.addEventListener('change', filterPlakalar);
          }
        }
      });
      
      console.log("Event dinleyicileri eklendi.");
    };
    
    // Event listenerları ekle
    setupInputListeners();
    
    // İlk yüklemede TAM plakaları göster - artık bekleme süresi yok, hemen uygula
    const durumFilter = document.getElementById('plakaDurumFilter');
    if (durumFilter) {
      durumFilter.value = 'TAM';
    }
    
    // Filtrelemeyi hemen uygula
    filterPlakalar();
}

async function filterPlakalar() {
    console.log("Filtreleme başlıyor...");
    
    // Arama kriterlerini al ve konsola yazdır (debug için)
    const enMin = parseFloat(document.getElementById('plakaEnMin').value) || 0;
    const enMax = parseFloat(document.getElementById('plakaEnMax').value) || Number.MAX_SAFE_INTEGER;
    const boyMin = parseFloat(document.getElementById('plakaBoyMin').value) || 0;
    const boyMax = parseFloat(document.getElementById('plakaBoyMax').value) || Number.MAX_SAFE_INTEGER;
    const durumFilter = document.getElementById('plakaDurumFilter').value;
    
    console.log(`Arama Kriterleri: En(${enMin}-${enMax}), Boy(${boyMin}-${boyMax}), Durum: ${durumFilter}`);
    
    // Plakalar tablosunu bul
    const plakalarTable = document.getElementById('plakalarTable');
    if (!plakalarTable) {
        console.error("Plakalar tablosu bulunamadı!");
        return;
    }
    
    // Tüm satırları al
    const rows = plakalarTable.querySelectorAll('tbody tr');
    console.log(`Toplam ${rows.length} satır bulundu`);
    
    // Görünür satır sayacı
    let visibleRowCount = 0;
    
    // Önce tüm bildirim satırlarını kaldır
    const tbody = plakalarTable.querySelector('tbody');
    if (!tbody) {
        console.error("Tablo gövdesi bulunamadı!");
        return;
    }
    
    const notificationRows = tbody.querySelectorAll('tr#noResultRow, tr.notification-row');
    notificationRows.forEach(row => row.remove());
    
    // Filtrelenen plaka ID'lerini sıfırla
    filteredPlakaIds = [];
    
    // İşlemdeki plakaları getir (ISLEMDE filtresi için)
    let islemdekiPlakaIdleri = [];
    if (durumFilter === 'ISLEMDE') {
        try {
            // İşlemdeki plakalar veritabanından alınır
            const islemdekiResult = await window.electronAPI.invoke.database.getAllIslemdekiPlakalar();
            if (islemdekiResult.success && islemdekiResult.data) {
                islemdekiPlakaIdleri = islemdekiResult.data.map(item => item.plaka_id);
                console.log("İşlemdeki plaka ID'leri:", islemdekiPlakaIdleri);
            }
        } catch (error) {
            console.error("İşlemdeki plakalar alınırken hata:", error);
        }
    }
    
    // Her satırı kontrol et
    rows.forEach((row, index) => {
        // Boş satır veya hata satırı kontrolü
        if (row.cells.length <= 1) {
            row.style.display = 'none';
            return;
        }
        
        // "Plaka bulunamadı" gibi bildirim satırlarını atla
        if (row.cells[0] && row.cells[0].colSpan && row.cells[0].colSpan > 1) {
            row.style.display = 'none';
            return;
        }
        
        // TUKENDI durumundaki plakaları hiç gösterme (eğer TÜMÜ seçili değilse)
        const durumCell = row.querySelector('td:nth-child(4)'); // Durum hücresi
        if (!durumCell) {
            console.warn(`Satır ${index}: Durum hücresi bulunamadı`);
            row.style.display = 'none';
            return;
        }
        
        if (durumCell.textContent.includes('TÜKENDİ') && durumFilter !== 'ALL') {
            row.style.display = 'none';
            return;
        }
        
        // Plaka ID'sini al (checkbox'tan)
        const checkbox = row.querySelector('.plaka-checkbox');
        let plakaId = null;
        if (checkbox) {
            plakaId = parseInt(checkbox.getAttribute('data-plaka-id'));
        }
        
        // En ve Boy değerlerini al
        const boyutCell = row.querySelector('td:nth-child(3)'); // En x Boy hücresi
        if (!boyutCell) {
            console.warn(`Satır ${index}: Boyut hücresi bulunamadı`);
            row.style.display = 'none';
            return;
        }
        
        // Boyut hücresindeki metni al ve düzgünce temizle
        const boyutText = boyutCell.textContent.trim();
        
        // "100 x 200 mm" formatından değerleri çıkar
        const boyutMatch = boyutText.match(/(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)/);
        
        if (!boyutMatch) {
            console.warn(`Satır ${index}: Boyut formatı eşleşmedi:`, boyutText);
            row.style.display = 'none';
            return;
        }
        
        // Boyut değerlerini al
        const en = parseFloat(boyutMatch[1]);
        const boy = parseFloat(boyutMatch[2]);
        
        // Durum kontrolü
        let isDurumMatch = true;
        if (durumFilter !== 'ALL') {
            // İşlemde filtresi için özel kontrol
            if (durumFilter === 'ISLEMDE') {
                // Plaka ID işlemdeki plakalar listesinde var mı?
                isDurumMatch = islemdekiPlakaIdleri.includes(plakaId);
                console.log(`Plaka ID ${plakaId} işlemde mi: ${isDurumMatch}`);
            } else {
                const durumText = durumCell.textContent.trim();
                
                // Normal durum kontrolü
                if (durumFilter === 'TAM') {
                    isDurumMatch = durumText.includes('TAM') && !durumText.includes('KISMEN') && !durumText.includes('İŞLEMDE');
                } else if (durumFilter === 'KISMEN_KULLANILDI') {
                    isDurumMatch = durumText.includes('KISMEN KULLANILDI');
                }
            }
        }
        
        // Ölçü aralığı kontrolü
        const isEnMatch = en >= enMin && en <= enMax;
        const isBoyMatch = boy >= boyMin && boy <= boyMax;
        
        // Sonucu uygula
        if (isEnMatch && isBoyMatch && isDurumMatch) {
            row.style.display = '';
            visibleRowCount++;
            
            // Plaka ID'sini al ve filtrelenmiş listeye ekle
            if (plakaId && !isNaN(plakaId)) {
                filteredPlakaIds.push(plakaId);
            }
        } else {
            row.style.display = 'none';
        }
    });
    
    console.log(`Filtreleme sonucu: ${visibleRowCount} satır görüntüleniyor`);
    console.log('Filtrelenen plaka ID\'leri:', filteredPlakaIds);
    
    // Eğer hiç sonuç yoksa, mesaj göster
    if (visibleRowCount === 0 && rows.length > 0) {
        const noResultRow = document.createElement('tr');
        noResultRow.id = 'noResultRow';
        noResultRow.className = 'notification-row';
        noResultRow.innerHTML = '<td colspan="8" class="text-center">Arama kriterlerine uygun plaka bulunamadı</td>';
        tbody.appendChild(noResultRow);
    }
    
    // Seçim durumunu da güncelle
    updateSelectAllCheckboxState();
    
    // "Hepsini Seç" checkbox'ını yenile
    const selectAllCheckbox = document.getElementById('select-all-plakas');
    if (selectAllCheckbox) {
        // Önceki event listener'ları kaldır
        const newSelectAllCheckbox = selectAllCheckbox.cloneNode(true);
        selectAllCheckbox.parentNode.replaceChild(newSelectAllCheckbox, selectAllCheckbox);
        
        // Yeni event listener ekle - filtrelenen plakaları seçmek için
        newSelectAllCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            
            // Sadece görünür checkboxları seç
            document.querySelectorAll('.plaka-checkbox').forEach(checkbox => {
                const row = checkbox.closest('tr');
                // Checkbox aktif ve satır görünür ise işlem yap
                if (!checkbox.disabled && row && row.style.display !== 'none') {
                    checkbox.checked = isChecked;
                    
                    // Plaka seçimini güncelle
                    const plakaId = parseInt(checkbox.getAttribute('data-plaka-id'));
                    if (!isNaN(plakaId)) {
                        togglePlakaSelection(plakaId, isChecked);
                    }
                }
            });
        });
    }
}

function updateSelectAllCheckboxState() {
    const selectAllCheckbox = document.getElementById('select-all-plakas');
    if (!selectAllCheckbox) return;
    
    const checkboxes = document.querySelectorAll('.plaka-checkbox:not([disabled])');
    const visibleCheckboxes = Array.from(checkboxes).filter(cb => {
        const row = cb.closest('tr');
        return row && row.style.display !== 'none';
    });
    
    // Görünür checkbox yoksa, "Hepsini Seç" checkbox'ını devre dışı bırak
    if (visibleCheckboxes.length === 0) {
        selectAllCheckbox.disabled = true;
        selectAllCheckbox.checked = false;
        return;
    }
    
    // Görünür checkbox varsa, etkinleştir
    selectAllCheckbox.disabled = false;
    
    const allChecked = visibleCheckboxes.length > 0 && visibleCheckboxes.every(cb => cb.checked);
    const someChecked = visibleCheckboxes.some(cb => cb.checked);
    
    selectAllCheckbox.checked = allChecked;
    selectAllCheckbox.indeterminate = someChecked && !allChecked;
}

// Arama kriterlerini temizle ve tüm plakaları göster
function clearPlakaSearch() {
    // Form elemanlarını temizle
    document.getElementById('plakaEnMin').value = '';
    document.getElementById('plakaEnMax').value = '';
    document.getElementById('plakaBoyMin').value = '';
    document.getElementById('plakaBoyMax').value = '';
    document.getElementById('plakaDurumFilter').value = 'TAM'; // TÜMÜ yerine TAM olarak değiştirildi
    
    // En son arama kriterlerini sıfırla
    window.lastPlakaSearchCriteria = {
      enMin: 0,
      enMax: Number.MAX_SAFE_INTEGER,
      boyMin: 0,
      boyMax: Number.MAX_SAFE_INTEGER,
      durum: 'TAM'
    };
    
    // Filtrelemeyi yeniden uygula (şimdi sadece TAM durumundakileri gösterecek)
    filterPlakalar();
}
  
// CSS stillerini ekle
function addPlakaSearchStyles() {
    const styleId = 'plaka-search-styles';
    
    // Eğer stil zaten eklenmişse, tekrar ekleme
    if (document.getElementById(styleId)) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Plaka Arama Paneli Stilleri */
      .plaka-search-panel {
        background-color: #f5f9ff;
        border: 1px solid #d1e1fd;
        border-radius: 5px;
        margin: 15px 0;
        padding: 15px;
      }
      
      .search-panel-header {
        margin-bottom: 10px;
      }
      
      .search-panel-header h4 {
        margin: 0;
        color: #0056b3;
        font-size: 16px;
        font-weight: 600;
      }
      
      .search-row {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        margin-bottom: 15px;
      }
      
      .search-group {
        flex: 1;
        min-width: 200px;
      }
      
      .search-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #333;
      }
      
      .range-inputs {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      
      .range-inputs input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        width: 100%;
      }
      
      .range-inputs span {
        color: #666;
      }
      
      .search-group select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        background-color: #fff;
        color: #333;
      }
      
      .search-actions {
        display: flex;
        gap: 10px;
      }
      
      .search-actions button {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 8px 15px;
      }
      
      /* Responsive ayarlamalar */
      @media (max-width: 992px) {
        .search-row {
          flex-direction: column;
          gap: 10px;
        }
        
        .search-group {
          width: 100%;
        }
      }
      
      /* İşlemde olan satırların görselleştirilmesi */
      tr.islemde-olan-plaka {
        background-color: #e8f4ff !important; /* Açık mavi arka plan */
        border-left: 3px solid #4a90e2; /* Sol kenar çizgisi */
      }
      
      .islemde-badge {
        display: inline-block;
        background-color: #4a90e2;
        color: white;
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 10px;
        margin-left: 5px;
        font-weight: 500;
      }
    `;
    
    document.head.appendChild(style);
}
  
// Tab değiştiğinde arama panelini ekle
// Tab değiştiğinde arama panelini ekle
document.addEventListener('click', function(event) {
  // Tab butonlarına tıklanmışsa
  if (event.target.closest('.tab-button')) {
    const tabButton = event.target.closest('.tab-button');
    const tabId = tabButton.getAttribute('data-tab');
    
    // Eğer plakalar tabı tıklanmışsa, arama panelini ekle
    if (tabId === 'plakalar-tab') {
      // Bekleme süresi kaldırıldı - hemen ekle
      addSearchPanelToPlakaTab();
      
      // EKLENEN: Tab değiştiğinde filtrelemeyi yeniden uygula
      setTimeout(() => {
        // Durum filtresini TAM olarak ayarla
        const durumFilter = document.getElementById('plakaDurumFilter');
        if (durumFilter) {
          durumFilter.value = 'TAM';
        }
        
        // Filtrelemeyi yeniden uygula
        filterPlakalar();
      }, 200);
    }
  }
});
  
// Modal kapatma butonuna tıklandığında reset olayı
document.addEventListener('click', function(event) {
    // Modaldaki x butonlarına tıklanırsa
    if (event.target.closest('.modal .close')) {
      // Arama panelini sıfırla
      resetSearchPanel();
    }
});
  
// Plakalar tabı ilk açıldığında arama panelini ekle
window.addEventListener('load', function() {
    // Tab butonlarını bul
    const tabButtons = document.querySelectorAll('.tab-button');
    
    // Plakalar tabı butonunu bul
    tabButtons.forEach(button => {
      if (button.getAttribute('data-tab') === 'plakalar-tab' && button.classList.contains('active')) {
        // Plakalar tabı aktifse arama panelini ekle - bekleme süresi kaldırıldı
        addSearchPanelToPlakaTab();
      }
    });
});
  
// Orijinal loadPlakaList fonksiyonu çağrıldığında TAM filtresini uygula
const originalLoadPlakaList = window.loadPlakaList;
if (originalLoadPlakaList) {
    window.loadPlakaList = function() {
      // Orijinal fonksiyonu çağır
      const result = originalLoadPlakaList.apply(this, arguments);
      
      // Şimdi bekleme süresi olmadan hemen filtreleme yap
      // Arama paneli eklenmediyse, ekle
      addSearchPanelToPlakaTab();
      
      // Durum filtresi TAM olarak ayarla
      const durumFilter = document.getElementById('plakaDurumFilter');
      if (durumFilter) {
        durumFilter.value = 'TAM';
      }
      
      // Filtrelemeyi uygula
      filterPlakalar();
      
      return result;
    };
}