// plakaGrubuProcessSystem.js - Sadece Plaka Grupları için İşleme Alma Sistemi

// Global değişken - işlemde olan plaka gruplarını tutacak
let islemdekiPlakaGruplari = [];

document.addEventListener('DOMContentLoaded', function() {
  // Plaka grubu işleme alma sistemi kur
  setupPlakaGrubuIslemAlSistemi();
  
  // İşlemdeki plaka gruplarını yükle
  loadIslemdekiPlakaGruplari();
});

// Mevcut loadPlakaGruplari fonksiyonunu güncelle
function setupPlakaGrubuIslemAlSistemi() {
  const originalLoadPlakaGruplari = window.loadPlakaGruplari;
  
  window.loadPlakaGruplari = async function(hammaddeId) {
    try {
      const result = await window.electronAPI.invoke.database.getPlakaGruplariByHammaddeId(hammaddeId);
      
      const plakalarTable = document.getElementById('plakalarTable');
      const tableBody = plakalarTable.getElementsByTagName('tbody')[0];
      tableBody.innerHTML = '';
      
      // Toplu işlem butonlarını içerecek div
      let bulkActionsDiv = document.getElementById('plaka-grubu-bulk-actions');
      if (!bulkActionsDiv) {
        bulkActionsDiv = document.createElement('div');
        bulkActionsDiv.id = 'plaka-grubu-bulk-actions';
        bulkActionsDiv.className = 'bulk-actions';
        bulkActionsDiv.innerHTML = `
          <button id="bulk-isleme-al-plaka-grubu" class="btn-primary">
            <i class="fas fa-tasks"></i> Seçili Plaka Gruplarını İşleme Al (<span id="plaka-grubu-selected-count">0</span>)
          </button>
        `;
        plakalarTable.parentNode.insertBefore(bulkActionsDiv, plakalarTable.nextSibling);
        
        // Butona tıklama olayı ekle
        document.getElementById('bulk-isleme-al-plaka-grubu').addEventListener('click', openPlakaGrubuIslemAlModal);
      }
      
      bulkActionsDiv.style.display = 'none';
      
      // Seçili plaka gruplarını sıfırla
      if (!window.selectedPlakaGruplari) {
        window.selectedPlakaGruplari = [];
      }
      window.selectedPlakaGruplari = [];
      updateSelectedPlakaGruplarıCount();
      
      if (!result.success || !result.gruplar || result.gruplar.length === 0) {
        const row = tableBody.insertRow();
        row.innerHTML = '<td colspan="9" class="text-center">Plaka grubu bulunamadı</td>';
        return;
      }
      
      // İşlemdeki plaka gruplarını kontrol et
      const islemdekiPlakaGruplarıResult = await window.electronAPI.invoke.database.getAllIslemdekiPlakaGruplari();
      const islemdekiPlakaGrubuIdleri = islemdekiPlakaGruplarıResult.success ? 
        islemdekiPlakaGruplarıResult.data.map(item => item.plaka_grubu_id) : [];
      
      // Tabloda header'ı güncelle - checkbox ekle
      const headerRow = plakalarTable.querySelector('thead tr');
      if (headerRow && !headerRow.querySelector('.select-all-wrapper')) {
        const selectAllCell = document.createElement('th');
        selectAllCell.width = '40px';
        selectAllCell.innerHTML = `
          <div class="select-all-wrapper">
            <input type="checkbox" id="select-all-plaka-gruplari" class="select-all-checkbox">
          </div>
        `;
        headerRow.insertBefore(selectAllCell, headerRow.firstChild);
        
        // Tümünü seç/kaldır olayını ekle
        document.getElementById('select-all-plaka-gruplari').addEventListener('change', function() {
          const isChecked = this.checked;
          document.querySelectorAll('.plaka-grubu-checkbox').forEach(checkbox => {
            const row = checkbox.closest('tr');
            const islemdeMi = row.classList.contains('islemde-olan-plaka-grubu');
            const kalanPlakaCell = row.cells[6]; // "Kalan Plaka" sütunu
            const kalanPlakaSayisi = parseInt(kalanPlakaCell.textContent) || 0;
            
            if (!islemdeMi && kalanPlakaSayisi > 0) {
              checkbox.checked = isChecked;
              const plakaGrubuId = parseInt(checkbox.getAttribute('data-plaka-grubu-id'));
              togglePlakaGrubuSelection(plakaGrubuId, isChecked);
            }
          });
        });
      }
      
      // Her bir plaka grubunu tabloya ekle
      result.gruplar.forEach(grup => {
        const row = tableBody.insertRow();
        
        // Plaka grubu işlemde mi kontrol et
        const islemdeMi = islemdekiPlakaGrubuIdleri.includes(grup.id);
        if (islemdeMi) {
          row.classList.add('islemde-olan-plaka-grubu');
        }
        
        // Seçim hücresi ekle
        const selectCell = row.insertCell(0);
        const kalanPlakaSayisi = grup.kalan_plaka_sayisi || 0;
        
        if (!islemdeMi && kalanPlakaSayisi > 0) {
          selectCell.innerHTML = `
            <input type="checkbox" class="plaka-grubu-checkbox" data-plaka-grubu-id="${grup.id}">
          `;
          
          const checkbox = selectCell.querySelector('.plaka-grubu-checkbox');
          checkbox.addEventListener('change', function() {
            const plakaGrubuId = parseInt(this.getAttribute('data-plaka-grubu-id'));
            togglePlakaGrubuSelection(plakaGrubuId, this.checked);
          });
        } else {
          selectCell.innerHTML = '<span class="disabled-checkbox">-</span>';
        }
        
        // Plaka No (Stok Kodu)
       const plakaNoCell = row.insertCell(1);
    if (islemdeMi) {
  // İşlemdeki plaka sayısını bul
  const islemdekiItem = islemdekiPlakaGruplarıResult.data?.find(item => item.plaka_grubu_id === grup.id);
  const islemdekiPlakaSayisi = islemdekiItem ? islemdekiItem.isleme_alinan_adet : 0;
  
  plakaNoCell.innerHTML = `#${grup.stok_kodu} <span class="islemde-badge">İŞLEMDE (${islemdekiPlakaSayisi})</span>`;
} else {
  plakaNoCell.textContent = `#${grup.stok_kodu}`;
}
        
        // En x Boy
        row.insertCell(2).textContent = `${grup.en} x ${grup.boy} mm`;
        
        // Toplam Kilo
        row.insertCell(3).textContent = `${Number(grup.toplam_kilo).toFixed(2)} kg`;
        
        // Kalan Kilo
        const plakaAgirligi = grup.toplam_plaka_sayisi > 0 ? 
          Number(grup.toplam_kilo) / grup.toplam_plaka_sayisi : 0;
        const kalanPlakaKilosu = grup.kalan_plaka_sayisi * plakaAgirligi;
        row.insertCell(4).textContent = `${kalanPlakaKilosu.toFixed(2)} kg`;
        
        // Toplam Plaka
        row.insertCell(5).textContent = grup.toplam_plaka_sayisi;
        
        // Kalan Plaka
        row.insertCell(6).textContent = grup.kalan_plaka_sayisi;
        
        // Toplam Parça
        row.insertCell(7).textContent = grup.parca_sayisi || 0;
        
        // İşlemler
        const islemlerCell = row.insertCell(8);
        
        if (grup.kalan_plaka_sayisi > 0) {
          islemlerCell.innerHTML = `
            <div class="action-buttons">
              <button class="action-btn process" title="İşlem Yap" onclick="openPlakaGrubuIslemModal(${grup.id})">
                <i class="fas fa-cut"></i>
              </button>
              <button class="action-btn view" title="Parçaları Gör" onclick="loadPlakaGrubuParcalar(${grup.id})">
                <i class="fas fa-list"></i>
              </button>
            </div>
          `;
        } else {
          islemlerCell.innerHTML = `
            <div class="action-buttons">
              <button class="action-btn view" title="Parçaları Gör" onclick="loadPlakaGrubuParcalar(${grup.id})">
                <i class="fas fa-list"></i>
              </button>
            </div>
          `;
        }
      });
    } catch (error) {
      console.error('Plaka grupları yükleme hatası:', error);
      const plakalarTable = document.getElementById('plakalarTable');
      const tableBody = plakalarTable.getElementsByTagName('tbody')[0];
      tableBody.innerHTML = '';
      const row = tableBody.insertRow();
      row.innerHTML = '<td colspan="9" class="text-center">Plaka grupları yüklenirken hata oluştu</td>';
    }
  };
}

// Plaka grubu seçim işlevi
function togglePlakaGrubuSelection(plakaGrubuId, isSelected) {
  if (!window.selectedPlakaGruplari) {
    window.selectedPlakaGruplari = [];
  }
  
  if (isSelected) {
    if (!window.selectedPlakaGruplari.includes(plakaGrubuId)) {
      window.selectedPlakaGruplari.push(plakaGrubuId);
    }
  } else {
    const index = window.selectedPlakaGruplari.indexOf(plakaGrubuId);
    if (index > -1) {
      window.selectedPlakaGruplari.splice(index, 1);
    }
  }
  
  updateSelectedPlakaGruplarıCount();
}

// Seçili plaka grupları sayısını güncelle
function updateSelectedPlakaGruplarıCount() {
  const count = window.selectedPlakaGruplari ? window.selectedPlakaGruplari.length : 0;
  const countSpan = document.getElementById('plaka-grubu-selected-count');
  if (countSpan) {
    countSpan.textContent = count.toString();
  }
  
  const bulkActionsBar = document.getElementById('plaka-grubu-bulk-actions');
  if (bulkActionsBar) {
    bulkActionsBar.style.display = count > 0 ? 'block' : 'none';
  }
}

// Plaka grubu işleme alma modalını aç
async function openPlakaGrubuIslemAlModal() {
  if (!window.selectedPlakaGruplari || window.selectedPlakaGruplari.length === 0) {
    showToast('Lütfen işleme almak için plaka grubu seçin.', 'warning');
    return;
  }
  
  const modalHTML = `
    <div id="plakaGrubuIslemAlModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Plaka Gruplarını İşleme Al</h3>
          <span class="close" onclick="closeModal('plakaGrubuIslemAlModal')">&times;</span>
        </div>
        <div class="modal-body">
          <div class="plaka-grubu-islem-al-content">
            <p><strong>Seçili Plaka Grubu Sayısı:</strong> ${window.selectedPlakaGruplari.length}</p>
            
            <div id="plakaGrubuDetaylar" class="plaka-grubu-detaylar">
              <!-- Plaka grubu detayları buraya gelecek -->
            </div>
            
            <div class="form-group">
              <label for="toplamIslemePlakaAdedi">Toplam İşleme Alınacak Plaka Adedi</label>
              <input type="number" id="toplamIslemePlakaAdedi" min="1" value="1" readonly>
              <small class="form-text">Bu sayı otomatik hesaplanır</small>
            </div>
            
            <div id="plakaGrubuIslemAlDetaylar" class="plaka-grubu-islem-detaylar">
              <!-- Her plaka grubu için adet girişi buraya gelecek -->
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" onclick="closeModal('plakaGrubuIslemAlModal')">İptal</button>
          <button type="button" class="btn-primary" onclick="islemeAlPlakaGruplari()">İşleme Al</button>
        </div>
      </div>
    </div>
  `;
  
  const existingModal = document.getElementById('plakaGrubuIslemAlModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  await loadPlakaGrubuDetaylarForIslemAl();
  openModal('plakaGrubuIslemAlModal');
}

// İşleme alınacak plaka grupları detaylarını yükle
async function loadPlakaGrubuDetaylarForIslemAl() {
  const detaylarContainer = document.getElementById('plakaGrubuIslemAlDetaylar');
  const plakaGrubuDetaylar = document.getElementById('plakaGrubuDetaylar');
  
  let toplamPlakaAdedi = 0;
  let detaylarHTML = '';
  let grupDetayHTML = '';
  
  for (const plakaGrubuId of window.selectedPlakaGruplari) {
    try {
      const result = await window.electronAPI.invoke.database.getPlakaGrubuById(plakaGrubuId);
      
      if (result.success) {
        const grup = result.plaka_grubu;
        const maxAdet = grup.kalan_plaka_sayisi;
        
        grupDetayHTML += `
          <div class="plaka-grubu-detay-item">
            <strong>#${grup.stok_kodu}</strong> - ${grup.en}x${grup.boy}mm 
            (Kalan: ${maxAdet} plaka)
          </div>
        `;
        
        detaylarHTML += `
          <div class="plaka-grubu-adet-input">
            <label for="plakaAdet_${plakaGrubuId}">
              <strong>#${grup.stok_kodu}</strong> için alınacak plaka adedi:
            </label>
            <input type="number" 
                   id="plakaAdet_${plakaGrubuId}" 
                   min="1" 
                   max="${maxAdet}" 
                   value="1" 
                   data-plaka-grubu-id="${plakaGrubuId}"
                   onchange="updateToplamPlakaAdedi()">
            <small class="form-text">Maksimum: ${maxAdet} plaka</small>
          </div>
        `;
        
        toplamPlakaAdedi += 1;
      }
    } catch (error) {
      console.error(`Plaka grubu ${plakaGrubuId} detayları alınırken hata:`, error);
    }
  }
  
  plakaGrubuDetaylar.innerHTML = grupDetayHTML;
  detaylarContainer.innerHTML = detaylarHTML;
  document.getElementById('toplamIslemePlakaAdedi').value = toplamPlakaAdedi;
}

// Toplam plaka adedini güncelle
function updateToplamPlakaAdedi() {
  let toplam = 0;
  document.querySelectorAll('[id^="plakaAdet_"]').forEach(input => {
    toplam += parseInt(input.value) || 0;
  });
  document.getElementById('toplamIslemePlakaAdedi').value = toplam;
}

// Plaka gruplarını işleme al
async function islemeAlPlakaGruplari() {
  try {
    const plakaGrubuIslemBilgileri = [];
    
    for (const plakaGrubuId of window.selectedPlakaGruplari) {
      const adetInput = document.getElementById(`plakaAdet_${plakaGrubuId}`);
      const adet = parseInt(adetInput.value) || 0;
      
      if (adet > 0) {
        plakaGrubuIslemBilgileri.push({
          plaka_grubu_id: plakaGrubuId,
          adet: adet
        });
      }
    }
    
    if (plakaGrubuIslemBilgileri.length === 0) {
      showToast('Lütfen en az bir plaka grubu için geçerli adet girin.', 'error');
      return;
    }
    
    for (const islemBilgisi of plakaGrubuIslemBilgileri) {
      await window.electronAPI.invoke.database.addPlakaGrubuToIslemde(
        islemBilgisi.plaka_grubu_id,
        islemBilgisi.adet,
        currentUser.id
      );
    }
    
    await loadIslemdekiPlakaGruplari();
    clearSelectedPlakaGruplari();
    closeModal('plakaGrubuIslemAlModal');
    closeModal('detayModal');
    
    // İşlemdeki hammaddeler tabına geç
    const islemdekiTab = document.querySelector('.tab-button[data-tab="islemdeki-hammadde-tab"]');
    if (islemdekiTab) {
      islemdekiTab.click();
    }
    
    const toplamGrup = plakaGrubuIslemBilgileri.length;
    const toplamPlaka = plakaGrubuIslemBilgileri.reduce((sum, item) => sum + item.adet, 0);
    
    showToast(`${toplamGrup} plaka grubu (toplam ${toplamPlaka} plaka) işleme alındı.`, 'success');
    
  } catch (error) {
    console.error('Plaka grupları işleme alma hatası:', error);
    showToast('Plaka grupları işleme alınırken bir hata oluştu.', 'error');
  }
}

// Seçimleri temizle
function clearSelectedPlakaGruplari() {
  document.querySelectorAll('.plaka-grubu-checkbox:checked').forEach(checkbox => {
    checkbox.checked = false;
  });
  
  const selectAllCheckbox = document.getElementById('select-all-plaka-gruplari');
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = false;
  }
  
  window.selectedPlakaGruplari = [];
  updateSelectedPlakaGruplarıCount();
}

// İşlemdeki plaka gruplarını yükle
async function loadIslemdekiPlakaGruplari() {
  try {
    const result = await window.electronAPI.invoke.database.getAllIslemdekiPlakaGruplari();
    console.log('İşlemdeki plaka grupları sonuç:', result);
    
    if (result.success && result.data) {
      islemdekiPlakaGruplari = result.data;
      updateIslemdekiHammaddeTableForPlakaGruplari();
    }
  } catch (error) {
    console.error('İşlemdeki plaka grupları yüklenirken hata:', error);
  }
}

// İşlemdeki hammaddeler tablosunu sadece plaka grupları için güncelle
function updateIslemdekiHammaddeTableForPlakaGruplari() {
  const islemdekiTable = document.getElementById('islemdekiHammaddeTable');
  if (!islemdekiTable) return;
  
  const tableBody = islemdekiTable.querySelector('tbody');
  tableBody.innerHTML = '';
  
  // Hammadde sayacını güncelle
  updateIslemdekiHammaddeCounter();
  
  if (!islemdekiPlakaGruplari || islemdekiPlakaGruplari.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="9" class="text-center">İşlemde olan hammadde bulunamadı</td>'; // 9 sütun
    tableBody.appendChild(emptyRow);
    return;
  }
  
  // Hammaddeleri gruplama
  const hammaddeGroups = {};
  
  islemdekiPlakaGruplari.forEach(item => {
    const hammaddeId = item.hammadde_id;
    
    if (!hammaddeGroups[hammaddeId]) {
      hammaddeGroups[hammaddeId] = {
        hammadde: {
          id: item.hammadde_id,
          stok_kodu: item.hammadde_stok_kodu,
          malzeme_adi: item.malzeme_adi,
          hammadde_turu: item.hammadde_turu,
          kalinlik: item.hammadde_kalinlik,
          cap: item.cap,
          uzunluk: item.uzunluk,
          toplam_kilo: item.hammadde_toplam_kilo,
          kalan_kilo: item.hammadde_kalan_kilo,
          barkod: item.barkod,
          durum: item.hammadde_durum
        },
        plakaGruplari: [],
        totalPlakalar: 0
      };
    }
    
    hammaddeGroups[hammaddeId].plakaGruplari.push({
      id: item.plaka_grubu_id,
      stok_kodu: item.stok_kodu,
      en: item.en,
      boy: item.boy,
      isleme_alinan_adet: item.isleme_alinan_adet || 1
    });
    hammaddeGroups[hammaddeId].totalPlakalar += item.isleme_alinan_adet || 1;
  });
  
  // Her hammadde grubu için satır oluştur
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
    
    // İşlemdeki plaka grupları metni oluştur
    const islemdekiPlakaGruplarıText = `${group.plakaGruplari.length} grup, ${group.totalPlakalar} plaka`;
    
    // Plaka grubu numaralarını göster
    const plakaGrubuNumaralari = group.plakaGruplari.map(grup => `#${grup.stok_kodu} (${grup.isleme_alinan_adet} plaka)`).join(', ');
    
    // Satırı oluştur
    row.innerHTML = `
      <td><span class="hammadde-counter">${counter}</span></td>
      <td>${group.hammadde.stok_kodu}</td>
      <td>${malzemeBilgisi}</td>
      <td>${Number(group.hammadde.toplam_kilo).toFixed(2)} kg</td>
      <td>${Number(group.hammadde.kalan_kilo).toFixed(2)} kg</td>
      <td>${group.hammadde.barkod || '-'}</td>
      <td>
        ${islemdekiPlakaGruplarıText}
        <div class="plaka-list">
          <small>Gruplar: ${plakaGrubuNumaralari}</small>
        </div>
      </td>
      <td><span class="${durumClass}">${durumText}</span></td>
      <td>
        <div class="action-buttons">
          <button class="action-btn view" title="Detay" onclick="viewHammaddeDetail(${group.hammadde.id})">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn delete" title="İşlemden Çıkar" onclick="removeFromProcessPlakaGruplari(${group.hammadde.id})">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
    counter++;
  });
}

// Hammadde sayacını güncelle (sadece plaka grupları için)
function updateIslemdekiHammaddeCounter() {
  const hammaddeGroups = {};
  islemdekiPlakaGruplari.forEach(item => {
    hammaddeGroups[item.hammadde_id] = true;
  });
  const hammaddeCount = Object.keys(hammaddeGroups).length;
  
  const islemdekiHammaddeTab = document.querySelector('.tab-button[data-tab="islemdeki-hammadde-tab"]');
  if (islemdekiHammaddeTab) {
    islemdekiHammaddeTab.innerHTML = `İşlemde Olan Hammaddeler <span class="hammadde-count">${hammaddeCount}</span>`;
  }
  
  const islemdekiHammaddeContent = document.getElementById('islemdeki-hammadde-tab');
  if (islemdekiHammaddeContent) {
    const baslik = islemdekiHammaddeContent.querySelector('h3');
    if (baslik) {
      baslik.innerHTML = `İşlemde Olan Hammaddeler <span class="hammadde-count">${hammaddeCount}</span>`;
    }
  }
  
  updateIslemdekiHammaddeTableHeader();
}

// Plaka gruplarını işlemden çıkar
async function removeFromProcessPlakaGruplari(hammaddeId) {
  try {
    await window.electronAPI.invoke.database.removePlakaGruplarıFromIslemdeByHammadde(hammaddeId);
    await loadIslemdekiPlakaGruplari();
    showToast('Hammadde işlemden çıkarıldı.', 'success');
  } catch (error) {
    console.error('İşlemden çıkarma hatası:', error);
    showToast('Hammadde işlemden çıkarılırken bir hata oluştu.', 'error');
  }
}

// CSS stilleri ekle
function addPlakaGrubuIslemAlStyles() {
  const styleId = 'plaka-grubu-islem-al-styles';
  
  if (document.getElementById(styleId)) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .plaka-grubu-detaylar {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    
    .plaka-grubu-detay-item {
      padding: 5px 0;
      border-bottom: 1px solid #dee2e6;
    }
    
    .plaka-grubu-detay-item:last-child {
      border-bottom: none;
    }
    
    .plaka-grubu-adet-input {
      margin: 15px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
      background: #fff;
    }
    
    .plaka-grubu-adet-input label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: #333;
    }
    
    .plaka-grubu-adet-input input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .plaka-grubu-adet-input small {
      display: block;
      margin-top: 5px;
      color: #666;
      font-size: 12px;
    }
    
    .islemde-olan-plaka-grubu {
      background-color: #e8f4ff !important;
      border-left: 3px solid #4a90e2;
    }
    
    .disabled-checkbox {
      color: #ccc;
      font-weight: bold;
    }
    
    #plaka-grubu-bulk-actions {
      margin: 10px 0;
      padding: 10px;
      background: #f0f0f0;
      border-radius: 5px;
      display: none;
    }
    
    #bulk-isleme-al-plaka-grubu {
      background-color: #5c6bc0;
      border-color: #3f51b5;
      color: #fff;
      padding: 8px 16px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
    }
    
    #bulk-isleme-al-plaka-grubu:hover {
      background-color: #3f51b5;
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
    
    .plaka-list {
      margin-top: 5px;
      font-size: 12px;
      color: #666;
    }
    
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
    
    /* Plaka Grubu Tab Sistemi */
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
      background-color: #f0f0f0;
      color: #333;
      margin-right: 5px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 300;
    }
    
    .hammadde-tabs .tab-button:hover {
      background-color: #e0e0e0;
    }
    
    .hammadde-tabs .tab-button.active {
      background-color: #444;
      color: #fff;
      border-bottom: 1px solid #444;
      margin-bottom: -1px;
      font-weight: 400;
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
  `;
  
  document.head.appendChild(style);
}

// Sayfa yüklendiğinde stilleri ekle
document.addEventListener('DOMContentLoaded', function() {
  addPlakaGrubuIslemAlStyles();
});

// Tablo başlığını güncelle (mevcut fonksiyon varsa kullan, yoksa oluştur)
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

// Plaka grubu işlem sonrası otomatik işlemden çıkarma
const originalSavePlakaGrubuIslem = window.savePlakaGrubuIslem;
if (originalSavePlakaGrubuIslem) {
  window.savePlakaGrubuIslem = async function() {
    // Çift çalışmayı önle
    if (window.isRunningPlakaGrubuIslem) {
      console.log('savePlakaGrubuIslem zaten çalışıyor, işlem atlanıyor...');
      return;
    }
    
    window.isRunningPlakaGrubuIslem = true;
    
    // Plaka grubu ID'sini kaydet
    const plakaGrubuId = currentPlakaGrubuId;
    console.log(`İşlem başlamadan önce plakaGrubuId kaydedildi: ${plakaGrubuId}`);
    
    try {
      // Orijinal savePlakaGrubuIslem fonksiyonunu çağır
      await originalSavePlakaGrubuIslem.apply(this, arguments);
      
      // İşlem tamamlandıktan sonra, plaka grubu ID'si varsa ve işlemdeyse işlemden çıkar
      if (plakaGrubuId) {
        setTimeout(async function() {
          try {
            // Plaka grubu işlemde mi kontrol et
            const islemdeMi = await window.electronAPI.invoke.database.isPlakaGrubuIslemde(plakaGrubuId);
            
            if (islemdeMi) {
              console.log(`İşlem tamamlandı, Plaka Grubu #${plakaGrubuId} işlemden çıkarılıyor...`);
              const removeResult = await window.electronAPI.invoke.database.removePlakaGrubuFromIslemde(plakaGrubuId);
              
              if (removeResult.success) {
                console.log(`Plaka Grubu #${plakaGrubuId} işlemden çıkarıldı.`);
              } else {
                console.log(`Plaka Grubu #${plakaGrubuId} işlemden çıkarılamadı: ${removeResult.message}`);
              }
            } else {
              console.log(`Plaka Grubu #${plakaGrubuId} zaten işlemde değil, işlemden çıkarma atlanıyor.`);
            }
            
            // İşlemdeki plaka gruplarını yükle
            await loadIslemdekiPlakaGruplari();
            
          } catch (error) {
            console.error('Plaka grubunu işlemden çıkarma hatası:', error);
          }
        }, 1000); // 1 saniye bekle
      }
    } catch (error) {
      console.error('Plaka grubu işlemi sırasında hata:', error);
    } finally {
      // İşlem tamamlandığında flag'i sıfırla
      window.isRunningPlakaGrubuIslem = false;
    }
  };
}


document.addEventListener('DOMContentLoaded', function() {
  // Hammadde listesi için tab sistemi kur
  setupHammaddeListesiTabs();
  
  // Plaka grubu işleme alma sistemi kur
  setupPlakaGrubuIslemAlSistemi();
  
  // İşlemdeki plaka gruplarını yükle
  loadIslemdekiPlakaGruplari();
  
  // Hammadde sayacı stillerini ekle
  addHammaddeCounterStyles();
});

// Tab sistemini kuran fonksiyon
function setupHammaddeListesiTabs() {
  // Hammadde-listesi sayfasını al
  const hammaddeListesiPage = document.getElementById('hammadde-listesi');
  if (!hammaddeListesiPage) return;
  
  // Eğer zaten tab sistemi kurulmuşsa tekrar kurma
  if (hammaddeListesiPage.querySelector('.hammadde-tabs')) {
    return;
  }
  
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
  islemdekiHammaddeTab.innerHTML = 'İşlemde Olan Hammaddeler <span class="hammadde-count">0</span>';
  
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
    <h3>İşlemde Olan Hammaddeler <span class="hammadde-count">0</span></h3>
    <div class="table-container">
      <table id="islemdekiHammaddeTable">
        <thead>
          <tr>
            <th>#</th>
            <th>Stok Kodu</th>
            <th>Malzeme Bilgisi</th>
            <th>Toplam Kilo</th>
            <th>Kalan Kilo</th>
            <th>Barkod</th>
            <th>İşlemdeki Detaylar</th>
            <th>Durum</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="9" class="text-center">İşlemde olan hammadde bulunamadı</td>
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


// Hammadde sayacını güncelle (sadece plaka grupları için)
function updateIslemdekiHammaddeCounter() {
  if (!islemdekiPlakaGruplari) {
    islemdekiPlakaGruplari = [];
  }
  
  const hammaddeGroups = {};
  islemdekiPlakaGruplari.forEach(item => {
    hammaddeGroups[item.hammadde_id] = true;
  });
  const hammaddeCount = Object.keys(hammaddeGroups).length;
  
  const islemdekiHammaddeTab = document.querySelector('.tab-button[data-tab="islemdeki-hammadde-tab"]');
  if (islemdekiHammaddeTab) {
    islemdekiHammaddeTab.innerHTML = `İşlemde Olan Hammaddeler <span class="hammadde-count">${hammaddeCount}</span>`;
  }
  
  const islemdekiHammaddeContent = document.getElementById('islemdeki-hammadde-tab');
  if (islemdekiHammaddeContent) {
    const baslik = islemdekiHammaddeContent.querySelector('h3');
    if (baslik) {
      baslik.innerHTML = `İşlemde Olan Hammaddeler <span class="hammadde-count">${hammaddeCount}</span>`;
    }
  }
}

// Plaka gruplarını işlemden çıkar
async function removeFromProcessPlakaGruplari(hammaddeId) {
  try {
    await window.electronAPI.invoke.database.removePlakaGruplarıFromIslemdeByHammadde(hammaddeId);
    await loadIslemdekiPlakaGruplari();
    showToast('Hammadde işlemden çıkarıldı.', 'success');
  } catch (error) {
    console.error('İşlemden çıkarma hatası:', error);
    showToast('Hammadde işlemden çıkarılırken bir hata oluştu.', 'error');
  }
}

// CSS stilleri ekle
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
      background-color: #f0f0f0;
      color: #333;
      margin-right: 5px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 300;
    }
    
    .hammadde-tabs .tab-button:hover {
      background-color: #e0e0e0;
    }
    
    .hammadde-tabs .tab-button.active {
      background-color: #444;
      color: #fff;
      border-bottom: 1px solid #444;
      margin-bottom: -1px;
      font-weight: 400;
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
    
    .plaka-list {
      margin-top: 5px;
      font-size: 12px;
      color: #666;
    }
  `;
  
  document.head.appendChild(style);
}

// Global fonksiyonları ekle
window.setupHammaddeListesiTabs = setupHammaddeListesiTabs;
window.updateIslemdekiHammaddeTableForPlakaGruplari = updateIslemdekiHammaddeTableForPlakaGruplari;
window.updateIslemdekiHammaddeCounter = updateIslemdekiHammaddeCounter;

// Global fonksiyonları ekle
window.togglePlakaGrubuSelection = togglePlakaGrubuSelection;
window.updateToplamPlakaAdedi = updateToplamPlakaAdedi;
window.islemeAlPlakaGruplari = islemeAlPlakaGruplari;
window.openPlakaGrubuIslemAlModal = openPlakaGrubuIslemAlModal;
window.clearSelectedPlakaGruplari = clearSelectedPlakaGruplari;
window.loadIslemdekiPlakaGruplari = loadIslemdekiPlakaGruplari;
window.removeFromProcessPlakaGruplari = removeFromProcessPlakaGruplari;