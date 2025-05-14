//processRawMaterial.js

// Global değişken - işlemde olan plakaları tutacak
let islemdekiPlakalar = [];

document.addEventListener('DOMContentLoaded', function() {
  // Hammadde listesi için tab sistemi kur
  setupHammaddeListesiTabs();
  
  // İşleme Al butonunu ekle
  setupIslemAlButton();
  
  // İşlemdeki plakaları yükle
  loadIslemdekiPlakalar();
  
  // Hammadde sayacı stillerini ekle
  addHammaddeCounterStyles();
});

// setupHammaddeListesiTabs fonksiyonunu güncelle
function setupHammaddeListesiTabs() {
  // Hammadde-listesi sayfasını al
  const hammaddeListesiPage = document.getElementById('hammadde-listesi');
  if (!hammaddeListesiPage) return;
  
  // Tab container'ı oluştur
  const tabContainer = document.createElement('div');
  tabContainer.className = 'tab-container hammadde-tabs';
  
  // Tab başlık kısmını oluştur
  const tabHeader = document.createElement('div');
  tabHeader.className = 'tab-header';
  
  // Tabları oluştur
  const hammaddeListTab = document.createElement('div');
  hammaddeListTab.className = 'tab-button active';
  hammaddeListTab.dataset.tab = 'hammadde-list-tab';
  hammaddeListTab.textContent = 'Hammadde Listesi';
  
  const islemdekiHammaddeTab = document.createElement('div');
  islemdekiHammaddeTab.className = 'tab-button';
  islemdekiHammaddeTab.dataset.tab = 'islemdeki-hammadde-tab';
  islemdekiHammaddeTab.textContent = 'İşlemde Olan Hammaddeler';
  
  // Tabları başlığa ekle
  tabHeader.appendChild(hammaddeListTab);
  tabHeader.appendChild(islemdekiHammaddeTab);
  
  // Tab içerik alanlarını oluştur
  const hammaddeListContent = document.createElement('div');
  hammaddeListContent.id = 'hammadde-list-tab';
  hammaddeListContent.className = 'tab-content active';
  
  const islemdekiHammaddeContent = document.createElement('div');
  islemdekiHammaddeContent.id = 'islemdeki-hammadde-tab';
  islemdekiHammaddeContent.className = 'tab-content';
  
  // "İşlemdeki hammadde" içeriğini ayarla
  islemdekiHammaddeContent.innerHTML = `
    <h3>İşlemde Olan Hammaddeler</h3>
    <div class="table-container">
      <table id="islemdekiHammaddeTable">
        <thead>
          <tr>
            <th>Stok Kodu</th>
            <th>Malzeme Bilgisi</th>
            <th>Miktar</th>
            <th>Kalan</th>
            <th>Barkod</th>
            <th>İşlemdeki Parçalar</th>
            <th>Durumu</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <!-- İşlemdeki hammaddeler burada listelenecek -->
          <tr>
            <td colspan="8" class="text-center">İşlemde olan hammadde bulunamadı</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  
  // Mevcut hammadde listesi içeriğini tab içeriğine taşı
  const existingContent = hammaddeListesiPage.innerHTML;
  hammaddeListContent.innerHTML = existingContent;
  
  // Orijinal içeriği temizle
  hammaddeListesiPage.innerHTML = '';
  
  // Tab sistemini sayfaya ekle
  tabContainer.appendChild(tabHeader);
  tabContainer.appendChild(hammaddeListContent);
  tabContainer.appendChild(islemdekiHammaddeContent);
  
  // Tab container'ı sayfaya ekle
  hammaddeListesiPage.appendChild(tabContainer);
  
  // Tab geçiş fonksiyonalitesini kur
  const tabButtons = document.querySelectorAll('.hammadde-tabs .tab-button');
  const tabContents = document.querySelectorAll('.hammadde-tabs .tab-content');
  
  // Aktif tab'ı global değişkene kaydet
  window.activeHammaddeTab = 'hammadde-list-tab';
  
  // Tab etkinleştirme fonksiyonu oluştur
  window.setActiveTab = function(tabId) {
    window.activeHammaddeTab = tabId;
    
    // Tüm butonlardan active sınıfını kaldır
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // İlgili butona active sınıfını ekle
    const targetButton = document.querySelector(`.hammadde-tabs .tab-button[data-tab="${tabId}"]`);
    if (targetButton) targetButton.classList.add('active');
    
    // Tüm tab içeriklerini gizle
    tabContents.forEach(content => content.classList.remove('active'));
    
    // İlgili tab içeriğini göster
    const targetContent = document.getElementById(tabId);
    if (targetContent) targetContent.classList.add('active');
    
    // İşlemde olan hammaddeler tabı seçildiyse sayacı güncelle
    if (tabId === 'islemdeki-hammadde-tab') {
      updateIslemdekiHammaddeCounter();
    }
  };
  
  // Tab butonlarına tıklama olayı ekle
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      window.setActiveTab(tabId);
    });
  });
  
  // Sayfa yüklendiğinde çalışacak kontrol fonksiyonu oluştur
  function checkTabState() {
    // Aktif tab yok mu?
    const activeTabExists = document.querySelector('.hammadde-tabs .tab-button.active');
    if (!activeTabExists && document.querySelector('.hammadde-tabs')) {
      // Aktif tab yoksa, son bilinen aktif tab'ı etkinleştir veya varsayılan olarak hammadde-list-tab
      window.setActiveTab(window.activeHammaddeTab || 'hammadde-list-tab');
    }
  }
  
  // Düzenli kontrol için interval ekle
  setInterval(checkTabState, 300);
  
  // Modallar ve butonlar için event listener ekle
  document.addEventListener('click', function(event) {
    // Modal kapanınca ve işlem butonlarına basılınca tab durumunu kontrol et
    setTimeout(checkTabState, 100);
  });
  
  // Event listener'ları yeniden ekle
  reattachEventListeners();
  
  // Stil ekle
  addHammaddeCounterStyles();
}

// Event listener'ları yeniden ekle
function reattachEventListeners() {
  // Hammadde arama butonuna event listener ekle
  const hammaddeAraBtn = document.getElementById('hammaddeAraBtn');
  if (hammaddeAraBtn) {
    const newHammaddeAraBtn = hammaddeAraBtn.cloneNode(true);
    hammaddeAraBtn.parentNode.replaceChild(newHammaddeAraBtn, hammaddeAraBtn);
    newHammaddeAraBtn.addEventListener('click', searchHammadde);
  }
  
  // Arama input'una keyup event ekle
  const hammaddeAraInput = document.getElementById('hammaddeAra');
  if (hammaddeAraInput) {
    const newHammaddeAraInput = hammaddeAraInput.cloneNode(true);
    hammaddeAraInput.parentNode.replaceChild(newHammaddeAraInput, hammaddeAraInput);
    newHammaddeAraInput.addEventListener('keyup', function(event) {
      if (event.key === 'Enter') {
        searchHammadde();
      }
    });
  }
  
  // Select elemanlarına change event ekle
  const hammaddeTipSecimi = document.getElementById('hammaddeTipSecimi');
  if (hammaddeTipSecimi) {
    const newHammaddeTipSecimi = hammaddeTipSecimi.cloneNode(true);
    hammaddeTipSecimi.parentNode.replaceChild(newHammaddeTipSecimi, hammaddeTipSecimi);
    newHammaddeTipSecimi.addEventListener('change', searchHammadde);
  }
  
  const hammaddeDurumSecimi = document.getElementById('hammaddeDurumSecimi');
  if (hammaddeDurumSecimi) {
    const newHammaddeDurumSecimi = hammaddeDurumSecimi.cloneNode(true);
    hammaddeDurumSecimi.parentNode.replaceChild(newHammaddeDurumSecimi, hammaddeDurumSecimi);
    newHammaddeDurumSecimi.addEventListener('change', searchHammadde);
  }
  
}

// İşleme Al butonunu eklemek için MutationObserver ile detay modal'ını izle
function setupIslemAlButton() {
  const detayModal = document.getElementById('detayModal');
  if (!detayModal) return;
  
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'style' && detayModal.style.display === 'block') {
        // Modal açıldığında bir süre bekle, sonra butonu ekle
        setTimeout(addIslemAlButtonToBulkActions, 300);
      }
    });
  });
  
  observer.observe(detayModal, { attributes: true });
}

// Bulk actions bar'a İşleme Al butonu ekle
function addIslemAlButtonToBulkActions() {
  const bulkActionsBar = document.getElementById('plaka-bulk-actions');
  
  if (bulkActionsBar && !document.getElementById('isleme-al-button')) {
    // İşleme Al butonunu oluştur
    const islemeAlButton = document.createElement('button');
    islemeAlButton.id = 'isleme-al-button';
    islemeAlButton.className = 'btn-primary';
    islemeAlButton.innerHTML = `
      <i class="fas fa-tasks"></i> Seçilenleri İşleme Al
    `;
    
    // Seçili plakalar butonunun önüne ekle
    const bulkProcessButton = bulkActionsBar.querySelector('#bulk-process-plaka');
    if (bulkProcessButton) {
      bulkActionsBar.insertBefore(islemeAlButton, bulkProcessButton);
    } else {
      bulkActionsBar.appendChild(islemeAlButton);
    }
    
    // Butona tıklama olayı ekle
    islemeAlButton.addEventListener('click', islemeAlPlakalari);
  }
}

// İşlemdeki plakaları veritabanından yükle
async function loadIslemdekiPlakalar() {
  try {
    const result = await window.electronAPI.invoke.database.getAllIslemdekiPlakalar();
    console.log('İşlemdeki plakalar sonuç:', result);
    
    if (result.success && result.data) {
      // Global değişkeni temizle
      islemdekiPlakalar = [];
      
      // Her bir plaka için aktif parça sayısını hesapla
      for (const plaka of result.data) {
        // Parçaları al
        const parcaResult = await window.electronAPI.invoke.database.getPlakaParcalariByPlakaId(plaka.plaka_id);
        const activeParts = parcaResult.success ? 
          parcaResult.parcalar.filter(parca => parca.durum !== 'TUKENDI').length : 0;
        
        // İşlemdeki plakalar listesine ekle
        islemdekiPlakalar.push({
          id: plaka.id,
          plaka: {
            id: plaka.plaka_id,
            stok_kodu: plaka.stok_kodu,
            durum: plaka.durum,
            en: plaka.en,
            boy: plaka.boy,
            kalinlik: plaka.kalinlik,
            kalan_kilo: plaka.kalan_kilo
          },
          hammadde: {
            id: plaka.hammadde_id,
            stok_kodu: plaka.hammadde_stok_kodu,
            malzeme_adi: plaka.malzeme_adi,
            hammadde_turu: plaka.hammadde_turu,
            kalinlik: plaka.hammadde_kalinlik,
            cap: plaka.cap,
            uzunluk: plaka.uzunluk,
            toplam_kilo: plaka.toplam_kilo,
            kalan_kilo: plaka.hammadde_kalan_kilo,
            barkod: plaka.barkod,
            durum: plaka.hammadde_durum
          },
          activeParts: activeParts
        });
      }
      
      // Tabloyu güncelle
      updateIslemdekiHammaddeTable();
    }
  } catch (error) {
    console.error('İşlemdeki plakalar yüklenirken hata:', error);
  }
}


// Plakaları işleme alma fonksiyonu
async function islemeAlPlakalari() {
  // Doğrudan DOM'dan seçili plakaların checkbox'larını alalım
  const selectedCheckboxes = document.querySelectorAll('.plaka-checkbox:checked');
  
  if (selectedCheckboxes.length === 0) {
    showToast('Lütfen işleme almak için plaka seçin.', 'warning');
    return;
  }
  
  try {
    // Checkbox'lardan plaka ID'lerini alalım
    const plakaIds = Array.from(selectedCheckboxes).map(checkbox => {
      return parseInt(checkbox.getAttribute('data-plaka-id'));
    });
    
    // Her plaka için bilgileri alalım
    for (const plakaId of plakaIds) {
      // Plaka bilgilerini al
      const plakaResult = await window.electronAPI.invoke.database.getPlakaById(plakaId);
      
      if (!plakaResult.success) {
        console.error(`Plaka ${plakaId} bilgileri alınamadı:`, plakaResult.message);
        continue;
      }
      
      const plaka = plakaResult.plaka;
      
      // Veritabanına plakayı işleme al
      await window.electronAPI.invoke.database.addPlakaToIslemde(
        plakaId, 
        plaka.hammadde_id, 
        currentUser.id
      );
    }
    
    // İşlemdeki plakaları tekrar yükle
    await loadIslemdekiPlakalar();
    
    // Seçili plakaları temizle
    clearSelectedPlakas();
    
    // Detay modalını kapat
    closeModal('detayModal');
    
    // İşlemdeki hammaddeler tabına geç
    const islemdekiTab = document.querySelector('.tab-button[data-tab="islemdeki-hammadde-tab"]');
    if (islemdekiTab) {
      islemdekiTab.click();
    }
    
    showToast(`${plakaIds.length} plaka işleme alındı.`, 'success');
    
  } catch (error) {
    console.error('Plaka işleme alma hatası:', error);
    showToast('Plakalar işleme alınırken bir hata oluştu.', 'error');
  }
}

// Checkbox seçimlerini temizle
function clearSelectedPlakas() {
  // Checkboxları temizle
  document.querySelectorAll('.plaka-checkbox:checked').forEach(checkbox => {
    checkbox.checked = false;
  });
  
  // Tümünü seç checkbox'ını temizle
  const selectAllCheckbox = document.getElementById('select-all-plakas');
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = false;
  }
  
  // selectedPlakas global değişkenini temizle
  if (window.selectedPlakas) {
    window.selectedPlakas = [];
  }
  
  // Sayaç elemanını temizle
  const countSpan = document.getElementById('plaka-selected-count');
  if (countSpan) {
    countSpan.textContent = '0';
  }
  
  // Bulk actions bar'ı gizle
  const bulkActionsBar = document.getElementById('plaka-bulk-actions');
  if (bulkActionsBar) {
    bulkActionsBar.style.display = 'none';
  }
}

function updateIslemdekiHammaddeTable() {
  const islemdekiTable = document.getElementById('islemdekiHammaddeTable');
  if (!islemdekiTable) return;
  
  const tableBody = islemdekiTable.querySelector('tbody');
  tableBody.innerHTML = '';
  
  // Hammadde sayacını güncelle
  updateIslemdekiHammaddeCounter();
  
  if (islemdekiPlakalar.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="8" class="text-center">İşlemde olan hammadde bulunamadı</td>';
    tableBody.appendChild(emptyRow);
    return;
  }
  
  // Hammaddeleri gruplama - aynı hammaddeye ait plakalar için
  const hammaddeGroups = {};
  
  islemdekiPlakalar.forEach(item => {
    const hammaddeId = item.hammadde.id;
    
    if (!hammaddeGroups[hammaddeId]) {
      hammaddeGroups[hammaddeId] = {
        hammadde: item.hammadde,
        plakalar: [],
        totalActiveParts: 0
      };
    }
    
    hammaddeGroups[hammaddeId].plakalar.push(item.plaka);
    hammaddeGroups[hammaddeId].totalActiveParts += item.activeParts;
  });
  
  // Her hammadde grubu için satır oluştur ve numaralandır
  let counter = 1;
  Object.values(hammaddeGroups).forEach(group => {
    const row = document.createElement('tr');
    row.setAttribute('data-hammadde-id', group.hammadde.id);
    
    // Durum sınıfı ve metni oluştur
    let durumClass = '';
    let durumText = '';
    
    switch (group.hammadde.durum) {
      case 'STOKTA_VAR':
        durumClass = 'stokta-var';
        durumText = 'STOKTA VAR';
        break;
      case 'AZ_KALDI':
        durumClass = 'az-kaldi';
        durumText = 'AZ KALDI';
        break;
      case 'STOKTA_YOK':
        durumClass = 'stokta-yok';
        durumText = 'STOKTA YOK';
        break;
      default:
        durumText = group.hammadde.durum || 'Belirtilmemiş';
    }
    
    // Malzeme bilgisi metni oluştur
    let malzemeBilgisi = group.hammadde.malzeme_adi || 'Belirtilmemiş';
    
    if (group.hammadde.hammadde_turu === 'sac') {
      malzemeBilgisi += ` Sac ${group.hammadde.kalinlik} mm`;
    } else if (group.hammadde.hammadde_turu === 'boru') {
      malzemeBilgisi += ` Boru Ø${group.hammadde.cap}x${group.hammadde.kalinlik}x${group.hammadde.uzunluk} mm`;
    } else if (group.hammadde.hammadde_turu === 'mil') {
      malzemeBilgisi += ` Mil Ø${group.hammadde.cap}x${group.hammadde.uzunluk} mm`;
    }
    
    // İşlemdeki parçalar metni oluştur
    const islemdekiParcalarText = `${group.plakalar.length} plaka, ${group.totalActiveParts} parça`;
    
    // Plaka numaralarını göster
    const plakaNumaralari = group.plakalar.map(plaka => `#${plaka.stok_kodu}`).join(', ');
    
    // Satırı oluştur - İlk sütuna numara ekleyerek
    row.innerHTML = `
      <td><span class="hammadde-counter">${counter}</span></td>
      <td>${group.hammadde.stok_kodu}</td>
      <td>${malzemeBilgisi}</td>
      <td>${Number(group.hammadde.toplam_kilo).toFixed(2)} kg</td>
      <td>${Number(group.hammadde.kalan_kilo).toFixed(2)} kg</td>
      <td>${group.hammadde.barkod || '-'}</td>
      <td>
        ${islemdekiParcalarText}
        <div class="plaka-list">
          <small>Plakalar: ${plakaNumaralari}</small>
        </div>
      </td>
      <td><span class="${durumClass}">${durumText}</span></td>
      <td>
        <div class="action-buttons">
          <button class="action-btn view" title="Detay" onclick="viewHammaddeDetail(${group.hammadde.id})">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn delete" title="İşlemden Çıkar" onclick="removeFromProcess(${group.hammadde.id})">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
    counter++; // Sayacı artır
  });
}

// Tablo başlığını güncelle ve sayaç sütunu ekle
function updateIslemdekiHammaddeTableHeader() {
  const islemdekiTable = document.getElementById('islemdekiHammaddeTable');
  if (!islemdekiTable) return;
  
  const headerRow = islemdekiTable.querySelector('thead tr');
  
  // Eğer zaten sayaç sütunu eklenmiş ise tekrar ekleme
  if (headerRow.querySelector('th:first-child').textContent === '#') return;
  
  // Sayaç sütununu ilk sıraya ekle
  const countHeader = document.createElement('th');
  countHeader.textContent = '#';
  countHeader.style.width = '40px';
  headerRow.insertBefore(countHeader, headerRow.firstChild);
}

// İşlemdeki hammadde sayacını güncelle
function updateIslemdekiHammaddeCounter() {
  // Sayıyı hesapla
  const hammaddeGroups = {};
  islemdekiPlakalar.forEach(item => {
    hammaddeGroups[item.hammadde.id] = true;
  });
  const hammaddeCount = Object.keys(hammaddeGroups).length;
  
  // Tab başlığını güncelle
  const islemdekiHammaddeTab = document.querySelector('.tab-button[data-tab="islemdeki-hammadde-tab"]');
  if (islemdekiHammaddeTab) {
    islemdekiHammaddeTab.innerHTML = `İşlemde Olan Hammaddeler <span class="hammadde-count">${hammaddeCount}</span>`;
  }
  
  // İşlemdeki hammaddeler sayfasındaki başlık
  const islemdekiHammaddeContent = document.getElementById('islemdeki-hammadde-tab');
  if (islemdekiHammaddeContent) {
    const baslik = islemdekiHammaddeContent.querySelector('h3');
    if (baslik) {
      baslik.innerHTML = `İşlemde Olan Hammaddeler <span class="hammadde-count">${hammaddeCount}</span>`;
    }
  }
  
  // Tablo başlığını güncelle
  updateIslemdekiHammaddeTableHeader();
}

// Stil ekle
function addHammaddeCounterStyles() {
  const styleId = 'hammadde-counter-styles';
  
  // Eğer stil zaten eklendiyse, tekrar ekleme
  if (document.getElementById(styleId)) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Hammadde Sayacı Stilleri */
    .hammadde-count {
      display: inline-block;
      background-color: #e74c3c;
      color: white;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 10px;
      margin-left: 5px;
      font-weight: 500;
      position: relative;
      top: -8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7);
      }
      70% {
        box-shadow: 0 0 0 6px rgba(231, 76, 60, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(231, 76, 60, 0);
      }
    }
    
    .hammadde-counter {
      display: inline-block;
      background-color: #3498db;
      color: white;
      font-size: 12px;
      padding: 3px 7px;
      border-radius: 50%;
      text-align: center;
      font-weight: 500;
      min-width: 22px;
      box-shadow: 0 2px 3px rgba(0,0,0,0.1);
    }
  `;
  
  document.head.appendChild(style);
}


// Hammaddeyi işlemden çıkar
async function removeFromProcess(hammaddeId) {
  try {
    // Hammaddeyi veritabanından işlemden çıkar
    await window.electronAPI.invoke.database.removeFromIslemde(hammaddeId);
    
    // İşlemdeki plakaları tekrar yükle
    await loadIslemdekiPlakalar();
    
    // Başarı mesajı göster
    showToast('Hammadde işlemden çıkarıldı.', 'success');
  } catch (error) {
    console.error('İşlemden çıkarma hatası:', error);
    showToast('Hammadde işlemden çıkarılırken bir hata oluştu.', 'error');
  }
}

// Orijinal viewHammaddeDetail fonksiyonunu geçersiz kıl
const originalViewHammaddeDetail = window.viewHammaddeDetail;
window.viewHammaddeDetail = async function(id) {
  // Orijinal fonksiyonu çağır
  const result = await originalViewHammaddeDetail(id);
  
  // Detay yüklendikten sonra İşleme Al butonunu ekle
  setTimeout(addIslemAlButtonToBulkActions, 300);
  
  return result;
};

async function isPlakaIslemde(plakaId) {
  try {
    const result = await window.electronAPI.invoke.database.getAllIslemdekiPlakalar();
    if (result.success && result.data) {
      // Plaka ID'si işlemdeki plakalar listesinde var mı kontrol et
      return result.data.some(item => item.plaka_id == plakaId);
    }
    return false;
  } catch (error) {
    console.error('İşlemdeki plakalar kontrolü sırasında hata:', error);
    return false;
  }
}


const originalSavePlakaIslem = window.savePlakaIslem;
window.savePlakaIslem = async function() {
  // Çift çalışmayı önle - FLAG'İ BAŞTA KONTROL ET
  if (window.isRunningPlakaIslem) {
    console.log('savePlakaIslem zaten çalışıyor, işlem atlanıyor...');
    return;
  }
  
  // İLK ÖNCE FLAG'İ SET ET
  window.isRunningPlakaIslem = true;
  
  // Çoklu işlem mi kontrol et
  const isBulkOperation = window.currentBulkPlakas && 
                         window.currentBulkPlakas.plakaIds && 
                         window.currentBulkPlakas.plakaIds.length > 0;
  
  // Plaka ID'sini bulmak için farklı yöntemler deneyelim
  let plakaIds = [];
  
  if (isBulkOperation) {
    // Çoklu işlem durumunda tüm plaka ID'lerini al
    plakaIds = window.currentBulkPlakas.plakaIds;
    console.log('Çoklu işlem - plaka ID\'leri:', plakaIds);
  } else {
    // Tekli işlem durumunda tek plaka ID'si bul
    let plakaId = null;
    
    // Global değişkenlerden plaka ID'sini al
    if (window.currentPlaka && window.currentPlaka.id) {
      plakaId = window.currentPlaka.id;
      console.log('currentPlaka global değişkeninden plakaId bulundu:', plakaId);
    }
    
    // Modaldan plaka ID'sini al
    if (!plakaId) {
      const plakaIslemModal = document.getElementById('plakaIslemModal');
      if (plakaIslemModal && plakaIslemModal.style.display === 'block') {
        plakaId = plakaIslemModal.getAttribute('data-plaka-id');
        console.log('plakaIslemModal özniteliğinden plakaId bulundu:', plakaId);
      }
    }
    
    // DOM'da data-plaka-id özniteliği olan herhangi bir öğeyi ara
    if (!plakaId) {
      const possibleElements = document.querySelectorAll('[data-plaka-id]');
      if (possibleElements.length > 0) {
        plakaId = possibleElements[0].getAttribute('data-plaka-id');
        console.log('DOM öğesinden plakaId bulundu:', plakaId);
      }
    }
    
    if (plakaId) {
      plakaIds = [plakaId];
    }
  }
  
  // Plaka ID'lerini kaydedelim
  if (plakaIds.length > 0) {
    console.log(`İşlem başlamadan önce plakaIds kaydedildi: ${plakaIds.join(', ')}`);
    window.lastProcessedPlakaIds = plakaIds;
  } else {
    console.log('Uyarı: İşlem başlamadan önce plakaId bulunamadı');
  }
  
  try {
    // Orijinal savePlakaIslem fonksiyonunu çağır
    await originalSavePlakaIslem.apply(this, arguments);
    
    // İşlem tamamlandıktan sonra, sadece plaka ID'leri varsa ve işlemdeyse işlemden çıkar
    if (plakaIds.length > 0) {
      setTimeout(async function() {
        try {
          // Her plaka için işlemden çıkarma işlemi yap
          for (const plakaId of plakaIds) {
            // Plaka işlemde mi kontrol et
            const islemdeMi = await isPlakaIslemde(plakaId);
            
            if (islemdeMi) {
              console.log(`İşlem tamamlandı, Plaka #${plakaId} işlemden çıkarılıyor...`);
              const removeResult = await window.electronAPI.invoke.database.removePlakaFromIslemde(plakaId);
              
              if (removeResult.success) {
                console.log(`Plaka #${plakaId} işlemden çıkarıldı.`);
              } else {
                console.log(`Plaka #${plakaId} işlemden çıkarılamadı: ${removeResult.message}`);
              }
            } else {
              console.log(`Plaka #${plakaId} zaten işlemde değil, işlemden çıkarma atlanıyor.`);
            }
          }
          
          // Tüm plakalar işlendikten sonra plakaları yükle
          await loadIslemdekiPlakalar();
          
        } catch (error) {
          console.error('Plakayı işlemden çıkarma hatası:', error);
        } finally {
          // İşlemdeki plakaları yükle
          loadIslemdekiPlakalar();
        }
      }, 1000); // 1 saniye bekle
    }
  } catch (error) {
    console.error('Plaka işlemi sırasında hata:', error);
  } finally {
    // İşlem tamamlandığında flag'i sıfırla
    window.isRunningPlakaIslem = false;
  }
};

// CSS Ekleme
// CSS Ekleme
function addHammaddeTabStyles() {
  const styleId = 'hammadde-tab-styles';
  
  // Eğer stil zaten eklendiyse, tekrar ekleme
  if (document.getElementById(styleId)) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Hammadde Tab Sistemi */
    .hammadde-tabs {
      margin-top: 20px;
    }
    
    .hammadde-tabs .tab-header {
      display: flex;
      border-bottom: 1px solid #ddd;
    }
    
    .hammadde-tabs .tab-button {
      padding: 10px 20px;
      border: 1px solid #ddd;
      border-bottom: none;
      border-radius: 5px 5px 0 0;
      background-color: #f0f0f0; /* Açık gri */
      color: #333; /* Siyah-gri yazı */
      margin-right: 5px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 300; /* İnce yazı */
    }
    
    .hammadde-tabs .tab-button:hover {
      background-color: #e0e0e0; /* Hover durumunda biraz daha koyu gri */
    }
    
    .hammadde-tabs .tab-button.active {
      background-color: #444; /* Koyu gri */
      color: #fff; /* Beyaz yazı */
      border-bottom: 1px solid #444;
      margin-bottom: -1px;
      font-weight: 400; /* Normal kabaca */
    }
    
    .hammadde-tabs .tab-content {
      display: none;
      padding: 20px;
      border: 1px solid #ddd;
      border-top: none;
      background-color: #fff;
    }
    
    .hammadde-tabs .tab-content.active {
      display: block;
    }
    
    /* İşleme Al Butonu */
    #isleme-al-button {
      margin-right: 10px;
      background-color: #5c6bc0;
      border-color: #3f51b5;
      color: #fff;
    }
    
    #isleme-al-button:hover {
      background-color: #3f51b5;
    }
    
    /* Plaka Listesi */
    .plaka-list {
      margin-top: 5px;
      font-size: 12px;
      color: #666;
    }
  `;
  
  document.head.appendChild(style);
}

// Sayfa yüklendiğinde CSS stillerini ekle
document.addEventListener('DOMContentLoaded', function() {
  addHammaddeTabStyles();
});

// CSS stillerini ekleyin
function addIslemdekiPlakaStyles() {
  const styleId = 'islemdeki-plaka-styles';
  
  // Eğer stil zaten eklendiyse, tekrar ekleme
  if (document.getElementById(styleId)) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* İşlemdeki plaka stili */
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
  console.log('İşlemdeki plaka CSS stilleri eklendi');
}

// Sayfa yüklendiğinde stilleri ekle
document.addEventListener('DOMContentLoaded', function() {
  addIslemdekiPlakaStyles();
});

if (typeof window.originalLoadPlakaList !== 'function') {
  window.originalLoadPlakaList = window.loadPlakaList;
}

// Yeni loadPlakaList fonksiyonu tanımlayalım
let isLoadingPlakalar = false;

window.loadPlakaList = async function(hammaddeId) {

   // Zaten yükleme yapılıyorsa, çift çağrılmayı engelle
   if (isLoadingPlakalar) {
    console.log("Plaka listesi zaten yükleniyor, işlem atlanıyor...");
    return;
  }
  isLoadingPlakalar = true;
  try {
    const result = await window.electronAPI.invoke.database.getPlakaListByHammaddeId(hammaddeId);
    
    const plakalarTable = document.getElementById('plakalarTable');
    const tableBody = plakalarTable.getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';
    
    // Toplu işlem butonlarını içerecek div - başlangıçta gizlenir
    let bulkActionsDiv = document.getElementById('plaka-bulk-actions');
    if (!bulkActionsDiv) {
        bulkActionsDiv = document.createElement('div');
        bulkActionsDiv.id = 'plaka-bulk-actions';
        bulkActionsDiv.className = 'bulk-actions';
        bulkActionsDiv.innerHTML = `
            <button id="bulk-process-plaka" class="btn-primary">
                <i class="fas fa-cut"></i> Seçili Plakalara İşlem Yap (<span id="plaka-selected-count">0</span>)
            </button>
        `;
        // Tablodan sonra ekle
        plakalarTable.parentNode.insertBefore(bulkActionsDiv, plakalarTable.nextSibling);
        
        // Butona tıklama olayı ekle
        document.getElementById('bulk-process-plaka').addEventListener('click', processBulkPlakas);
    }
    
    // Görünürlüğü sıfırla
    bulkActionsDiv.style.display = 'none';
    
    // Seçili plakaları sıfırla
    selectedPlakas = [];
    updateSelectedPlakasCount();
    
    if (!result.success || !result.plakalar || result.plakalar.length === 0) {
        const row = tableBody.insertRow();
        row.innerHTML = '<td colspan="8" class="text-center">Plaka bulunamadı</td>';
        return;
    }
    
    // İşlemdeki plakaları kontrol et
    const islemdekiPlakalarResult = await window.electronAPI.invoke.database.getAllIslemdekiPlakalar();
    const islemdekiPlakaIdleri = islemdekiPlakalarResult.success ? 
      islemdekiPlakalarResult.data.map(item => item.plaka_id) : [];
    
    // Filter out plates with status "TUKENDI"
    const activePlakas = result.plakalar.filter(plaka => plaka.durum !== 'TUKENDI');
    
    // If no active plates left after filtering
    if (activePlakas.length === 0) {
        const row = tableBody.insertRow();
        row.innerHTML = '<td colspan="8" class="text-center">Aktif plaka bulunamadı</td>';
        return;
    }
    
    // Tablo başlık satırını güncelle - checkbox ekle
    const headerRow = plakalarTable.querySelector('thead tr');
    if (headerRow && !headerRow.querySelector('.select-all-wrapper')) {
        const selectAllCell = document.createElement('th');
        selectAllCell.width = '40px';
        selectAllCell.innerHTML = `
            <div class="select-all-wrapper">
                <input type="checkbox" id="select-all-plakas" class="select-all-checkbox">
            </div>
        `;
        headerRow.insertBefore(selectAllCell, headerRow.firstChild);
        
        // Tümünü seç/kaldır olayını ekle
        document.getElementById('select-all-plakas').addEventListener('change', function() {
            const isChecked = this.checked;
            document.querySelectorAll('.plaka-checkbox').forEach(checkbox => {
                checkbox.checked = isChecked;
                
                // Plaka seçimini güncelle
                const plakaId = parseInt(checkbox.getAttribute('data-plaka-id'));
                togglePlakaSelection(plakaId, isChecked);
            });
        });
    }
    
    // Display only active plates
    activePlakas.forEach(plaka => {
        const row = tableBody.insertRow();
        
        // Plaka işlemde mi kontrol et ve gerekirse satır sınıfını ekle
        const islemdeMi = islemdekiPlakaIdleri.includes(plaka.id);
        if (islemdeMi) {
            row.classList.add('islemde-olan-plaka');
        }
        
        // Seçim hücresi ekle
        const selectCell = row.insertCell(0);
        selectCell.innerHTML = `
            <input type="checkbox" class="plaka-checkbox" data-plaka-id="${plaka.id}">
        `;
        
        // Plaka No
        const plakaNoCell = row.insertCell(1);
        
        // İşlemde olan plakalara işaret ekle
        if (islemdeMi) {
            plakaNoCell.innerHTML = `#${plaka.stok_kodu} <span class="islemde-badge">İŞLEMDE</span>`;
        } else {
            plakaNoCell.textContent = `#${plaka.stok_kodu}`;
        }
        
        // En x Boy
        row.insertCell(2).textContent = `${plaka.en} x ${plaka.boy} mm`;
        
        // Durum
        const durumCell = row.insertCell(3);
        let durumText = '';
        let durumClass = '';
        
        switch (plaka.durum) {
            case 'TAM':
                durumText = 'TAM';
                durumClass = 'stokta-var';
                break;
            case 'KISMEN_KULLANILDI':
                durumText = 'KISMEN KULLANILDI';
                durumClass = 'az-kaldi';
                break;
        }
        
        durumCell.innerHTML = `<span class="${durumClass}">${durumText}</span>`;
        durumCell.style.verticalAlign = 'middle';
        
        // Orijinal Kilo
        row.insertCell(4).textContent = `${Number(plaka.toplam_kilo).toFixed(2)} kg`;
        
        // Kalan Kilo
        row.insertCell(5).textContent = `${Number(plaka.kalan_kilo).toFixed(2)} kg`;
        
        // Kullanım Oranı
        row.insertCell(6).textContent = `%${Number(plaka.kullanim_orani).toFixed(2)}`;
        
        // İşlemler
        const islemlerCell = row.insertCell(7);
        if (plaka.durum !== 'TUKENDI') {
            islemlerCell.innerHTML = `
                <div class="action-buttons">
                    <button class="action-btn view" title="Parçaları Gör" onclick="loadPlakaParcalar(${plaka.id})">
                        <i class="fas fa-list"></i>
                    </button>
                </div>
            `;
        } else {
            islemlerCell.textContent = 'Tükenmiş';
        }
        
        // Checkbox olayını dinle
        const checkbox = selectCell.querySelector('.plaka-checkbox');
        checkbox.addEventListener('change', function() {
            const plakaId = parseInt(this.getAttribute('data-plaka-id'));
            togglePlakaSelection(plakaId, this.checked);
        });
    });
    
    // Sadece tükenmeyen plakaları checkbox ile seçilebilir yap
    document.querySelectorAll('.plaka-checkbox').forEach(checkbox => {
        const row = checkbox.closest('tr');
        const durumCell = row.cells[3];
        if (durumCell.textContent.includes('TÜKENDİ')) {
            checkbox.disabled = true;
            row.classList.add('disabled-row');
        }
    });
  } catch (error) {
      console.error('Plaka listesi yükleme hatası:', error);
      
      const plakalarTable = document.getElementById('plakalarTable');
      const tableBody = plakalarTable.getElementsByTagName('tbody')[0];
      tableBody.innerHTML = '';
      
      const row = tableBody.insertRow();
      row.innerHTML = '<td colspan="8" class="text-center">Plaka listesi yüklenirken hata oluştu</td>';
  } finally {
    // Yükleme işlemi bittikten sonra flag'i sıfırla
    isLoadingPlakalar = false; 
  }
};


