//plates.js

// Hammadde detay modalı açıldığında tab sistemini ve event listener'ları kur
function setupHammaddeDetailModal() {
    document.getElementById('detayModal').addEventListener('show', function() {
        // Tab sistemini kur
        setupTabSystem();
        
        // Plaka event listener'larını kur
        setupPlakaEventListeners();
    });
}





function setupModalEventListeners() {
    console.log('Modal Event Listener\'lar ayarlanıyor...');
    
    // Plaka İşlem Modalı için
    const plakaKullanimAlaniSelect = document.getElementById('plakaKullanimAlani');
    if (plakaKullanimAlaniSelect) {
        console.log('Plaka Kullanım Alanı select elementi bulundu, event listener ekleniyor');
        
        // Mevcut onchange attribute'ını kaldır ve addEventListener ile ekle
        plakaKullanimAlaniSelect.removeAttribute('onchange');
        plakaKullanimAlaniSelect.addEventListener('change', function() {
            console.log('Plaka Kullanım Alanı değişti');
            toggleYariMamulPanel('plaka');
        });
        
        // Sayfa yüklendiğinde başlangıç durumunu ayarla
        toggleYariMamulPanel('plaka');
    }
    
    // Parça İşlem Modalı için
    const parcaKullanimAlaniSelect = document.getElementById('parcaKullanimAlani');
    if (parcaKullanimAlaniSelect) {
        console.log('Parça Kullanım Alanı select elementi bulundu, event listener ekleniyor');
        
        // Mevcut onchange attribute'ını kaldır ve addEventListener ile ekle
        parcaKullanimAlaniSelect.removeAttribute('onchange');
        parcaKullanimAlaniSelect.addEventListener('change', function() {
            console.log('Parça Kullanım Alanı değişti');
            toggleYariMamulPanel('parca');
        });
        
        // Sayfa yüklendiğinde başlangıç durumunu ayarla
        toggleYariMamulPanel('parca');
    }
}


// Modal açıldığında setup fonksiyonunu çağır
function setupModalOpeners() {
    // Plaka İşlem Modalı açıldığında event listener'ları ayarla
    const plakaIslemModal = document.getElementById('plakaIslemModal');
    if (plakaIslemModal) {
        const originalOpenPlakaIslemModal = window.openPlakaIslemModal;
        window.openPlakaIslemModal = function(plakaId) {
            originalOpenPlakaIslemModal(plakaId);
            
            // Modal açıldıktan sonra event listener'ları ayarla
            setTimeout(setupModalEventListeners, 100);
        };
    }
    
    // Parça İşlem Modalı açıldığında event listener'ları ayarla
    const parcaIslemModal = document.getElementById('parcaIslemModal');
    if (parcaIslemModal) {
        const originalOpenParcaIslemModal = window.openParcaIslemModal;
        window.openParcaIslemModal = function(parcaId, parcaNo) {
            originalOpenParcaIslemModal(parcaId, parcaNo);
            
            // Modal açıldıktan sonra event listener'ları ayarla
            setTimeout(setupModalEventListeners, 100);
        };
    }
}

// Sayfa yüklendiğinde modal açıcıları ayarla
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM yüklendi, modal açıcılar ayarlanıyor...');
    setupModalOpeners();
    
    // Ayrıca direkt olarak modalar varsa event listener'ları da ayarla
    setupModalEventListeners();
    
    // Plaka ve parça kullanimAlani select elementleri için manuel event listener'lar ekle
    ['plaka', 'parca'].forEach(prefix => {
        const select = document.getElementById(`${prefix}KullanimAlani`);
        if (select) {
            select.addEventListener('change', function() {
                console.log(`${prefix}KullanimAlani değişti, toggleYariMamulPanel('${prefix}') çağrılıyor`);
                toggleYariMamulPanel(prefix);
            });
        }
    });
});




  // Plaka İşlem modalı için özel düzeltme
  function fixPlakaIslemModal() {
    const plakaIslemModal = document.getElementById('plakaIslemModal');
    if (!plakaIslemModal) return;
    
    // Modal açıldığında stil ayarla
    plakaIslemModal.addEventListener('show', function() {
      setTimeout(() => {
        const projeSelect = document.getElementById('plakaProjeSecimi');
        if (projeSelect) {
          // Stil ayarları
          projeSelect.style.color = '#333';
          
          // Seçeneklere stil ekle
          Array.from(projeSelect.options).forEach(option => {
            option.style.color = '#333';
            option.style.backgroundColor = '#fff';
          });
        }
        
        // Projeleri yükle
        loadProjelerForPlates();
      }, 100);
    });
  }
  
  // Parça İşlem modalı için özel düzeltme
  function fixParcaIslemModal() {
    const parcaIslemModal = document.getElementById('parcaIslemModal');
    if (!parcaIslemModal) return;
    
    // Modal açıldığında stil ayarla
    parcaIslemModal.addEventListener('show', function() {
      setTimeout(() => {
        const projeSelect = document.getElementById('parcaProjeSecimi');
        if (projeSelect) {
          // Stil ayarları
          projeSelect.style.color = '#333';
          
          // Seçeneklere stil ekle
          Array.from(projeSelect.options).forEach(option => {
            option.style.color = '#333';
            option.style.backgroundColor = '#fff';
          });
        }
        
        // Projeleri yükle
        loadProjelerForPlates();
      }, 100);
    });
  }
  
  // Sayfa yüklendiğinde modal düzeltmelerini uygula
  document.addEventListener('DOMContentLoaded', function() {
    fixPlakaIslemModal();
    fixParcaIslemModal();
  });



  
async function loadPlakaParcalar(plakaId) {
    try {
        // Plaka bilgilerini al
        const plakaResult = await window.electronAPI.invoke.database.getPlakaById(plakaId);
        
        if (!plakaResult.success) {
            showToast('Plaka bilgileri alınamadı: ' + plakaResult.message, 'error');
            return;
        }
        
        // Parçaları al
        const parcalarResult = await window.electronAPI.invoke.database.getPlakaParcalariByPlakaId(plakaId);
        
        const parcalarTable = document.getElementById('parcalarTable');
        const tableBody = parcalarTable.getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
        
        if (!parcalarResult.success || !parcalarResult.parcalar || parcalarResult.parcalar.length === 0) {
            const row = tableBody.insertRow();
            row.innerHTML = '<td colspan="9" class="text-center">Bu plakada parça bulunamadı</td>';
            
            // Detay modalını aç/güncelle
            openModal('detayModal');
            
            // Parçalar tabına geç
            const parcalarTab = document.querySelector('.tab-button[data-tab="parcalar-tab"]');
            if (parcalarTab) parcalarTab.click();
            
            return;
        }
        
        // Hata ayıklama için
        console.log("Plaka parçaları:", parcalarResult.parcalar);
        
        // Parçaları listele
        parcalarResult.parcalar.forEach(parca => {
            const row = tableBody.insertRow();
            
            // Parça No
            row.insertCell(0).textContent = `#${parca.parca_no}`;
            
            // Barkod Kodu
            row.insertCell(1).textContent = parca.barkod_kodu || 'Belirtilmemiş';
            
            // Plaka No
            row.insertCell(2).textContent = `#${plakaResult.plaka.stok_kodu}`;
            
            // En x Boy - DÜZELTİLMİŞ KISIM
            const enBoyCell = row.insertCell(3);
            console.log(`Parça #${parca.parca_no} - En: ${parca.en}, Boy: ${parca.boy}`);
            
            if (parca.en != null && parca.boy != null) {
                enBoyCell.textContent = `${parca.en} x ${parca.boy} mm`;
            } else {
                enBoyCell.textContent = 'Belirtilmemiş';
            }
            
            // Durum
            const durumCell = row.insertCell(4);
            let durumText = '';
            let durumClass = '';
            
            switch (parca.durum) {
                case 'TAM':
                    durumText = 'TAM';
                    durumClass = 'stokta-var';
                    break;
                case 'KISMEN_KULLANILDI':
                    durumText = 'KISMEN KULLANILDI';
                    durumClass = 'az-kaldi';
                    break;
                case 'TUKENDI':
                    durumText = 'TÜKENDİ';
                    durumClass = 'stokta-yok';
                    break;
            }
            
            durumCell.innerHTML = `<span class="${durumClass}">${durumText}</span>`;
            durumCell.style.verticalAlign = 'middle';
            
            // Orijinal Kilo
            row.insertCell(5).textContent = `${Number(parca.orijinal_kilo).toFixed(2)} kg`;
            
            // Kalan Kilo
            row.insertCell(6).textContent = `${Number(parca.kalan_kilo).toFixed(2)} kg`;
            
            // Kullanım Oranı
            row.insertCell(7).textContent = `%${Number(parca.kullanim_orani).toFixed(2)}`;
            
            // İşlemler
            const islemlerCell = row.insertCell(8);
            if (parca.durum !== 'TUKENDI') {
                islemlerCell.innerHTML = `
                    <div class="action-buttons">
                        <button class="action-btn process" title="İşlem Yap" onclick="openParcaIslemModal(${parca.id}, ${parca.parca_no})">
                            <i class="fas fa-cut"></i>
                        </button>
                    </div>
                `;
            } else {
                islemlerCell.textContent = 'Tükenmiş';
            }
        });
        
        // Detay modalını aç/güncelle
        openModal('detayModal');
        
        // Parçalar tabına geç
        const parcalarTab = document.querySelector('.tab-button[data-tab="parcalar-tab"]');
        if (parcalarTab) parcalarTab.click();
    } catch (error) {
        console.error('Plaka parçaları yükleme hatası:', error);
        showToast('Plaka parçaları yüklenirken bir hata oluştu.', 'error');
    }
}


// Plaka gruplarını görüntülemek için HTML ve JavaScript

async function loadPlakaGruplari(hammaddeId) {
  try {
    const result = await window.electronAPI.invoke.database.getPlakaGruplariByHammaddeId(hammaddeId);
    
    const plakalarTable = document.getElementById('plakalarTable');
    const tableBody = plakalarTable.getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';
    
    if (!result.success || !result.gruplar || result.gruplar.length === 0) {
      const row = tableBody.insertRow();
      row.innerHTML = '<td colspan="8" class="text-center">Plaka grubu bulunamadı</td>';
      return;
    }
    
    // Tabloda header'ı güncelle
    const headerRow = plakalarTable.querySelector('thead tr');
    if (headerRow) {
      headerRow.innerHTML = `
        <th>Plaka No</th>
        <th>En x Boy</th>
        <th>Toplam Kilo</th>
        <th>Kalan Kilo</th>
        <th>Toplam Plaka</th>
        <th>Kalan Plaka</th>
        <th>Toplam Parça</th>
        <th>İşlemler</th>
      `;
    }
    
    // Her bir plaka grubunu tabloya ekle
    result.gruplar.forEach(grup => {
      const row = tableBody.insertRow();
      
      // Plaka No (Stok Kodu)
      row.insertCell(0).textContent = `#${grup.stok_kodu}`;
      
      // En x Boy
      row.insertCell(1).textContent = `${grup.en} x ${grup.boy} mm`;
      
      // Toplam Kilo
      row.insertCell(2).textContent = `${Number(grup.toplam_kilo).toFixed(2)} kg`;
      
      // DÜZELTME: Kalan Kilo - Sadece kalan plaka sayısı * plaka ağırlığı
      const plakaAgirligi = grup.toplam_plaka_sayisi > 0 ? 
        Number(grup.toplam_kilo) / grup.toplam_plaka_sayisi : 0;
      const kalanPlakaKilosu = grup.kalan_plaka_sayisi * plakaAgirligi;
      
      row.insertCell(3).textContent = `${kalanPlakaKilosu.toFixed(2)} kg`;
      
      // Toplam Plaka
      row.insertCell(4).textContent = grup.toplam_plaka_sayisi;
      
      // Kalan Plaka
      row.insertCell(5).textContent = grup.kalan_plaka_sayisi;
      
      // Toplam Parça
      row.insertCell(6).textContent = grup.parca_sayisi || 0;
      
      // İşlemler
      const islemlerCell = row.insertCell(7);
      
      // Kalan plaka sayısı 0'dan büyükse işlem yapma butonunu göster
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
    row.innerHTML = '<td colspan="8" class="text-center">Plaka grupları yüklenirken hata oluştu</td>';
  }
}

// Plaka grubu parçalarını yükle
async function loadPlakaGrubuParcalar(grubuId) {
  try {
    // Plaka grubu bilgilerini al
    const grubuResult = await window.electronAPI.invoke.database.getPlakaGrubuById(grubuId);
    
    if (!grubuResult.success) {
      showToast('Plaka grubu bilgileri alınamadı: ' + grubuResult.message, 'error');
      return;
    }
    
    const plaka_grubu = grubuResult.plaka_grubu;
    
    // Parçaları al
    const parcalarResult = await window.electronAPI.invoke.database.getParcalarByPlakaGrubuId(grubuId);
    
    const parcalarTable = document.getElementById('parcalarTable');
    const tableBody = parcalarTable.getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';
    
    if (!parcalarResult.success || !parcalarResult.parcalar || parcalarResult.parcalar.length === 0) {
      const row = tableBody.insertRow();
      row.innerHTML = '<td colspan="8" class="text-center">Bu plaka grubunda parça bulunamadı</td>';
      
      // Detay modalını aç/güncelle
      openModal('detayModal');
      
      // Parçalar tabına geç
      const parcalarTab = document.querySelector('.tab-button[data-tab="parcalar-tab"]');
      if (parcalarTab) parcalarTab.click();
      
      return;
    }
    
    // Parçaları listele
    parcalarResult.parcalar.forEach(parca => {
      const row = tableBody.insertRow();
      
      // Parça No
      row.insertCell(0).textContent = `#${parca.parca_no}`;
      
      // Barkod Kodu
      row.insertCell(1).textContent = parca.barkod_kodu || 'Belirtilmemiş';
      
      // Plaka No
      row.insertCell(2).textContent = `#${plaka_grubu.stok_kodu}`;
      
      // En x Boy
      const enBoyCell = row.insertCell(3);
      if (parca.en != null && parca.boy != null) {
        enBoyCell.textContent = `${parca.en} x ${parca.boy} mm`;
      } else {
        enBoyCell.textContent = 'Belirtilmemiş';
      }
      
      // Durum
      const durumCell = row.insertCell(4);
      let durumText = '';
      let durumClass = '';
      
      switch (parca.durum) {
        case 'TAM':
          durumText = 'TAM';
          durumClass = 'stokta-var';
          break;
        case 'KISMEN_KULLANILDI':
          durumText = 'KISMEN KULLANILDI';
          durumClass = 'az-kaldi';
          break;
        case 'TUKENDI':
          durumText = 'TÜKENDİ';
          durumClass = 'stokta-yok';
          break;
      }
      
      durumCell.innerHTML = `<span class="${durumClass}">${durumText}</span>`;
      durumCell.style.verticalAlign = 'middle';
      
      // Orijinal Kilo
      row.insertCell(5).textContent = `${Number(parca.orijinal_kilo).toFixed(2)} kg`;
      
      // Kalan Kilo
      row.insertCell(6).textContent = `${Number(parca.kalan_kilo).toFixed(2)} kg`;
      
      // İşlemler
      const islemlerCell = row.insertCell(7);
      if (parca.durum !== 'TUKENDI') {
        islemlerCell.innerHTML = `
          <div class="action-buttons">
            <button class="action-btn process" title="İşlem Yap" onclick="openParcaIslemModal(${parca.id}, ${parca.parca_no})">
              <i class="fas fa-cut"></i>
            </button>
          </div>
        `;
      } else {
        islemlerCell.textContent = 'Tükenmiş';
      }
    });
    
    // Detay modalını aç/güncelle
    openModal('detayModal');
    
    // Parçalar tabına geç
    const parcalarTab = document.querySelector('.tab-button[data-tab="parcalar-tab"]');
    if (parcalarTab) parcalarTab.click();
  } catch (error) {
    console.error('Plaka grubu parçaları yükleme hatası:', error);
    showToast('Plaka grubu parçaları yüklenirken bir hata oluştu.', 'error');
  }
}


async function openYeniPlakaGrubuModal() {
  if (!currentHammaddeId || !currentHammadde) {
    showToast('Lütfen önce bir hammadde seçin.', 'error');
    return;
  }
  
  // Modal içeriğini sıfırla
  resetPlakaGrubuModal();
  
  // Tedarikçileri yükle
  await loadTedarikciListesiForPlakaGrubu();
  
  // Modalı aç
  openModal('yeniPlakaGrubuModal');
  
  // Detay modalını kapat
  closeModal('detayModal');
}


async function loadTedarikciListesiForPlakaGrubu() {
  try {
    const result = await window.electronAPI.invoke.database.getAllTedarikci();
    
    if (result.success && result.tedarikci) {
      // Tedarikçi input alanını datalist ile güncelle
      const tedarikciInput = document.getElementById('plakaGrubuTedarikci');
      const datalistId = 'plakaGrubuTedarikciListesi';
      
      // Mevcut datalist'i kaldır
      const mevcutDatalist = document.getElementById(datalistId);
      if (mevcutDatalist) {
        mevcutDatalist.remove();
      }
      
      // Yeni datalist oluştur
      const datalist = document.createElement('datalist');
      datalist.id = datalistId;
      
      // Tedarikçileri ekle
      result.tedarikci.forEach(tedarikci => {
        const option = document.createElement('option');
        option.value = tedarikci.tedarikci_adi;
        datalist.appendChild(option);
      });
      
      // Datalist'i input'a bağla
      tedarikciInput.setAttribute('list', datalistId);
      
      // Datalist'i DOM'a ekle
      tedarikciInput.parentNode.appendChild(datalist);
    }
  } catch (error) {
    console.error('Tedarikçi listesi yükleme hatası:', error);
  }
}

// Plaka Grubu modalını sıfırla
function resetPlakaGrubuModal() {
  // Form alanlarını temizle
  document.getElementById('plakaGrubuEn').value = '';
  document.getElementById('plakaGrubuBoy').value = '';
  document.getElementById('plakaGrubuPlakaSayisi').value = '';
  document.getElementById('plakaGrubuToplamKilo').value = '';
  document.getElementById('plakaGrubuTedarikci').value = '';
  document.getElementById('plakaGrubuBirimFiyat').value = '';
  
  // Hesaplama sonucunu gizle
  document.getElementById('plakaGrubuHesapSonucu').style.display = 'none';
  
  // Kaydet butonunu devre dışı bırak
  document.getElementById('plakaGrubuKaydetBtn').disabled = true;
}


// Plaka grubu hesaplama fonksiyonunu güncelle - otomatik plaka sayısı hesaplama ile
function calculatePlakaGrubu() {
  try {
    // Form değerlerini al
    const en = parseFloat(document.getElementById('plakaGrubuEn').value);
    const boy = parseFloat(document.getElementById('plakaGrubuBoy').value);
    const toplamKilo = parseFloat(document.getElementById('plakaGrubuToplamKilo').value);
    
    // Kalınlık ve yoğunluk değerlerini kontrol et
    if (!currentHammadde || !currentHammadde.kalinlik || !currentHammadde.yogunluk) {
      document.getElementById('plakaGrubuHesapSonucu').innerHTML = 
        '<div class="error">Hammadde bilgileri bulunamadı. Lütfen hammadde seçtiğinizden emin olun.</div>';
      document.getElementById('plakaGrubuHesapSonucu').style.display = 'block';
      document.getElementById('plakaGrubuKaydetBtn').disabled = true;
      return;
    }
    
    const kalinlik = parseFloat(currentHammadde.kalinlik);
    const yogunluk = parseFloat(currentHammadde.yogunluk);
    
    // Temel validasyon
    if (!en || !boy || !toplamKilo || 
        isNaN(en) || isNaN(boy) || isNaN(toplamKilo) ||
        toplamKilo <= 0) {
      document.getElementById('plakaGrubuHesapSonucu').innerHTML = 
        '<div class="error">Lütfen geçerli en, boy ve toplam kilo değerleri girin.</div>';
      document.getElementById('plakaGrubuHesapSonucu').style.display = 'block';
      document.getElementById('plakaGrubuKaydetBtn').disabled = true;
      return;
    }
    
    // Tek plaka ağırlığı hesapla (kg) - Teorik olarak
    const hacim = (en / 1000) * (boy / 1000) * (kalinlik / 1000); // m³
    const teorikPlakaAgirligi = hacim * yogunluk;
    
    // Plaka sayısını otomatik hesapla
    let plakaSayisi = Math.round(toplamKilo / teorikPlakaAgirligi);
    if (plakaSayisi < 1) plakaSayisi = 1;
    
    // Hesaplanan plaka sayısını form alanına yaz (sadece okunabilir)
    document.getElementById('plakaGrubuPlakaSayisi').value = plakaSayisi;
    
    // Toplam teorik ağırlık
    const teorikToplamAgirlik = teorikPlakaAgirligi * plakaSayisi;
    
    // Gerçek plaka ağırlığı (girilen toplam kiloya göre)
    const gercekPlakaAgirligi = toplamKilo / plakaSayisi;
    
    // Fark hesapla
    const farkYuzde = ((toplamKilo - teorikToplamAgirlik) / teorikToplamAgirlik) * 100;
    
    // Hata kontrolü - fark çok büyükse uyarı ver
    let hesaplamaDurumu = '';
    let kaydetButonuAktif = true;
    
    if (Math.abs(farkYuzde) > 10) {
      hesaplamaDurumu = '<div class="error">⚠️ Hesaplama uyarısı: Teorik ağırlık ile girilen ağırlık arasında %10\'dan fazla fark var. Lütfen değerleri kontrol edin.</div>';
      kaydetButonuAktif = false;
    } else if (Math.abs(farkYuzde) > 5) {
      hesaplamaDurumu = '<div class="warning">⚠️ Dikkat: Teorik ağırlık ile girilen ağırlık arasında %5\'ten fazla fark var.</div>';
    } else {
      hesaplamaDurumu = '<div class="success">✅ Hesaplama başarılı! Değerler uygun.</div>';
    }
    
    // Sonuçları göster
    document.getElementById('plakaGrubuHesapSonucu').innerHTML = `
      ${hesaplamaDurumu}
      <div class="calculation-details">
        <div class="detail-row">
          <span>En x Boy:</span>
          <span>${en} mm x ${boy} mm</span>
        </div>
        <div class="detail-row">
          <span>Kalınlık:</span>
          <span>${kalinlik} mm</span>
        </div>
        <div class="detail-row highlight">
          <span>Hesaplanan Plaka Sayısı:</span>
          <span>${plakaSayisi} adet</span>
        </div>
        <div class="detail-row">
          <span>Toplam Kilo:</span>
          <span>${toplamKilo.toFixed(2)} kg</span>
        </div>
        <div class="detail-row">
          <span>Teorik bir plaka ağırlığı:</span>
          <span>${teorikPlakaAgirligi.toFixed(2)} kg</span>
        </div>
        <div class="detail-row highlight">
          <span>Her plakaya atanacak ağırlık:</span>
          <span>${gercekPlakaAgirligi.toFixed(2)} kg</span>
        </div>
        <div class="detail-row">
          <span>Teorik toplam ağırlık:</span>
          <span>${teorikToplamAgirlik.toFixed(2)} kg</span>
        </div>
        <div class="detail-row ${Math.abs(farkYuzde) > 5 ? 'error-text' : 'success-text'}">
          <span>Fark:</span>
          <span>${farkYuzde.toFixed(2)}%</span>
        </div>
      </div>
    `;
    document.getElementById('plakaGrubuHesapSonucu').style.display = 'block';
    
    // Kaydet butonu durumunu güncelle
    document.getElementById('plakaGrubuKaydetBtn').disabled = !kaydetButonuAktif;
    
    // Hesaplama sonucunu global değişkende sakla
    window.plakaGrubuHesaplamaDetaylari = {
      en: en,
      boy: boy,
      kalinlik: kalinlik,
      plakaSayisi: plakaSayisi,
      plakaAgirligi: gercekPlakaAgirligi,
      toplamKilo: toplamKilo,
      teorikToplamAgirlik: teorikToplamAgirlik,
      farkYuzde: farkYuzde
    };
    
    return {
      plakaSayisi,
      plakaAgirligi: gercekPlakaAgirligi,
      toplamKilo
    };
  } catch (error) {
    console.error('Plaka grubu hesaplama hatası:', error);
    document.getElementById('plakaGrubuHesapSonucu').innerHTML = `
      <div class="error">Hesaplama sırasında bir hata oluştu: ${error.message}</div>
    `;
    document.getElementById('plakaGrubuHesapSonucu').style.display = 'block';
    document.getElementById('plakaGrubuKaydetBtn').disabled = true;
    return null;
  }
}


function openNewTedarikciModalForPlakaGrubu() {
  // Kaynak modalı belirle
  currentModalId = 'yeniPlakaGrubuModal';
  
  // Plaka grubu modalını kapat
  closeModal('yeniPlakaGrubuModal');
  
  // Yeni tedarikçi modalını aç
  openModal('yeniTedarikciModal');
}


// Plaka grubu kaydetme
async function savePlakaGrubu() {
  try {
    console.log('savePlakaGrubu çağrıldı - Normal ekleme modu');
    
    // Düzenleme modundaysa hata ver
    if (isEditMode) {
      console.error('HATA: savePlakaGrubu düzenleme modunda çağrıldı!');
      showToast('Hata: Düzenleme modunda ekleme fonksiyonu çağrıldı!', 'error');
      return;
    }
    
    // İşlem kontrolü
    if (window.isProcessingPlakaGrubuSubmit) {
      console.log('İşlem zaten devam ediyor, çıkılıyor...');
      return;
    }
    
    window.isProcessingPlakaGrubuSubmit = true;

    // Hesaplama detayları
    if (!window.plakaGrubuHesaplamaDetaylari) {
      showModalError('yeniPlakaGrubuModal', 'Lütfen önce hesaplama yapın.');
      window.isProcessingPlakaGrubuSubmit = false;
      return;
    }
    
    // Form değerlerini al
    const en = parseFloat(document.getElementById('plakaGrubuEn').value);
    const boy = parseFloat(document.getElementById('plakaGrubuBoy').value);
    const plakaSayisi = parseInt(document.getElementById('plakaGrubuPlakaSayisi').value);
    const toplamKilo = parseFloat(document.getElementById('plakaGrubuToplamKilo').value);
    const tedarikci = document.getElementById('plakaGrubuTedarikci').value.trim();
    const birimFiyat = parseFloat(document.getElementById('plakaGrubuBirimFiyat').value);
    const birimFiyatTuru = document.getElementById('plakaGrubuBirimFiyatTuru').value;
    const anaBarkod = document.getElementById('plakaGrubuAnaBarkod').value.trim();
    
    // Validasyon
    if (!tedarikci) {
      showModalError('yeniPlakaGrubuModal', 'Lütfen tedarikçi bilgisini girin.');
      window.isProcessingPlakaGrubuSubmit = false;
      return;
    }
    
    if (!birimFiyat || birimFiyat <= 0) {
      showModalError('yeniPlakaGrubuModal', 'Lütfen geçerli bir birim fiyat girin.');
      window.isProcessingPlakaGrubuSubmit = false;
      return;
    }
    
    // İşlem başlıyor mesajı
    showModalSuccess('yeniPlakaGrubuModal', 'Plaka grubu oluşturuluyor. Lütfen bekleyin...');
    
    // Plaka grubu verisi
    const plakaGrubuData = {
      hammadde_id: currentHammaddeId,
      en: en,
      boy: boy,
      plaka_sayisi: plakaSayisi,
      toplam_kilo: toplamKilo,
      tedarikci: tedarikci,
      birim_fiyat: birimFiyat,
      birim_fiyat_turu: birimFiyatTuru,
      ekleyen_id: currentUser.id,
      ana_barkod: anaBarkod
    };
    
    // Grubu kaydet
    const result = await window.electronAPI.invoke.database.addPlakaGrubu(plakaGrubuData);
    
    if (result.success) {
      showToast(`Plaka grubu başarıyla eklendi. Stok Kodu: ${result.stokKodu}`, 'success');
      
      // Modalı kapat ve sıfırla
      closeModal('yeniPlakaGrubuModal');
      resetModalState();
      
      // Dashboard'ı güncelle
      updateDashboard();
      
      // Hammadde listesini güncelle
      await loadHammaddeListesi();
      
      // Hammadde detayını yeniden yükle
      if (currentHammaddeId) {
        await viewHammaddeDetail(currentHammaddeId);
      }
    } else {
      showModalError('yeniPlakaGrubuModal', 'Hata: ' + result.message);
    }
    
    window.isProcessingPlakaGrubuSubmit = false;
  } catch (error) {
    console.error('Plaka grubu ekleme hatası:', error);
    showModalError('yeniPlakaGrubuModal', 'Plaka grubu eklenirken bir hata oluştu: ' + error.message);
    window.isProcessingPlakaGrubuSubmit = false;
  }
}


async function openPlakaGrubuIslemModal(grubuId) {
  try {
    // Global değişkene ata
    currentPlakaGrubuId = grubuId;
    
    // Plaka grubu bilgilerini al
    const result = await window.electronAPI.invoke.database.getPlakaGrubuById(grubuId);
    
    if (!result.success) {
      showToast('Plaka grubu bilgileri alınamadı: ' + result.message, 'error');
      return;
    }
    
    currentPlakaGrubu = result.plaka_grubu;
    
    // Başlığı güncelle
    const plakaGrubuHeader = document.getElementById('plakaGrubuIslemHeader');
    if (plakaGrubuHeader) {
      plakaGrubuHeader.textContent = `Plaka Grubu #${result.plaka_grubu.stok_kodu}`;
    }
    
    // Formları sıfırla
    resetPlakaGrubuIslemForm();
    
    // DÜZELTME: Sadece kalan plaka kg'sini hesapla
    const plakaAgirligi = result.plaka_grubu.toplam_plaka_sayisi > 0 ? 
      Number(result.plaka_grubu.toplam_kilo) / result.plaka_grubu.toplam_plaka_sayisi : 0;
    const kalanPlakaKilosu = result.plaka_grubu.kalan_plaka_sayisi * plakaAgirligi;
    
    // Bilgi alanını oluştur - DÜZELTME: Sadece kalan plaka kg'si
    const bilgiAlani = document.getElementById('plakaGrubuIslemModalBilgi');
    
    if (!bilgiAlani) {
      const yeniBilgiAlani = document.createElement('div');
      yeniBilgiAlani.id = 'plakaGrubuIslemModalBilgi';
      yeniBilgiAlani.className = 'form-info';
      yeniBilgiAlani.innerHTML = `
        <p><strong>Ölçüler:</strong> ${result.plaka_grubu.en} x ${result.plaka_grubu.boy} mm</p>
        <p><strong>Kalan Plaka Sayısı:</strong> ${result.plaka_grubu.kalan_plaka_sayisi}</p>
        <p><strong>Kalan Plaka Kilosu:</strong> ${kalanPlakaKilosu.toFixed(2)} kg</p>
      `;
      
      // Bilgi alanını forma ekle
      const form = document.querySelector('#plakaGrubuIslemModal .plaka-islem-form');
      if (form) {
        form.insertBefore(yeniBilgiAlani, form.firstChild);
      }
    } else {
      bilgiAlani.innerHTML = `
        <p><strong>Ölçüler:</strong> ${result.plaka_grubu.en} x ${result.plaka_grubu.boy} mm</p>
        <p><strong>Kalan Plaka Sayısı:</strong> ${result.plaka_grubu.kalan_plaka_sayisi}</p>
        <p><strong>Kalan Plaka Kilosu:</strong> ${kalanPlakaKilosu.toFixed(2)} kg</p>
      `;
    }
    
    // DÜZELTME: Güncellenmiş plaka grubu bilgisini currentPlakaGrubu'ya kaydet
    currentPlakaGrubu.kalan_plaka_kilosu = kalanPlakaKilosu;
    
    // Önce detay modalını kapat
    closeModal('detayModal');
    
    // Diğer açık modalları kapat
    document.querySelectorAll('.modal').forEach(modal => {
      if (modal.style.display === 'block' && modal.id !== 'detayModal') {
        closeModal(modal.id);
      }
    });
    
    // Modal açılmadan önce async olarak bekleyen işlemleri tamamla
    try {
      console.log("Projeler yükleniyor...");
      await loadProjelerForPlates();
      console.log("Projeler yüklendi");
    } catch (e) {
      console.error("Projeler yüklenirken hata:", e);
    }
    
    try {
      console.log("Müşteriler yükleniyor...");
      await loadMusteriler();
      console.log("Müşteriler yüklendi");
    } catch (e) {
      console.error("Müşteriler yüklenirken hata:", e);
    }
    
    try {
      console.log("Çalışanlar yükleniyor...");
      await loadCalisanlar();
      console.log("Çalışanlar yüklendi");
    } catch (e) {
      console.error("Çalışanlar yüklenirken hata:", e);
    }
    
    // İşlem modalını aç
    openModal('plakaGrubuIslemModal');
    
    // Açıldıktan sonra form alanlarını güncelle
    togglePlakaGrubuFormSections();
    
    // Plaka sayısı alanını kalan plaka sayısı ile sınırla
    document.getElementById('plakaGrubuPlakaSayisiInput').setAttribute('max', result.plaka_grubu.kalan_plaka_sayisi);
    document.getElementById('plakaGrubuPlakaSayisiInput').value = 1; // Varsayılan değer
    
    // Select elementlerinin stil düzeltmesi
    setTimeout(() => {
      const projectSelect = document.getElementById('plakaGrubuProjeSecimi');
      if (projectSelect) {
        projectSelect.style.color = '#333';
        Array.from(projectSelect.options).forEach(option => {
          option.style.color = '#333';
          option.style.backgroundColor = '#fff';
        });
      }
      
      const customerSelect = document.getElementById('plakaGrubuMusteriSecimi');
      if (customerSelect) {
        customerSelect.style.color = '#333';
        Array.from(customerSelect.options).forEach(option => {
          option.style.color = '#333';
          option.style.backgroundColor = '#fff';
        });
      }
      
      const employeeSelect = document.getElementById('plakaGrubuCalisanSecimi');
      if (employeeSelect) {
        employeeSelect.style.color = '#333';
        Array.from(employeeSelect.options).forEach(option => {
          option.style.color = '#333';
          option.style.backgroundColor = '#fff';
        });
      }
    }, 200);
  } catch (error) {
    console.error('Plaka grubu işlem modalı açma hatası:', error);
    showToast('Plaka grubu işlem modalı açılırken bir hata oluştu: ' + error.message, 'error');
  }
}


async function loadProjelerForPlates() {
  try {
    console.log("loadProjelerForPlates çağrıldı");
    const result = await window.electronAPI.invoke.database.getAllProjeler();
    
    if (!result.success) {
      console.error("Projeler getirilirken hata:", result.message);
      return;
    }
    
    // Plaka grubu işlem modalı için select
    const plakaGrubuProjeSecimi = document.getElementById('plakaGrubuProjeSecimi');
    if (plakaGrubuProjeSecimi) {
      // Mevcut seçenekleri temizle (ilk seçenek hariç)
      while (plakaGrubuProjeSecimi.options.length > 1) {
        plakaGrubuProjeSecimi.remove(1);
      }
      
      // Projeleri ekle
      result.projeler.forEach(proje => {
        const option = document.createElement('option');
        option.value = proje.id;
        option.textContent = `${proje.proje_kodu} - ${proje.proje_adi}`;
        plakaGrubuProjeSecimi.appendChild(option);
      });
      
      console.log(`${result.projeler.length} proje yüklendi (Plaka Grubu)`);
    }
    
    // Diğer modallar için de aynı işlemi yap
    const plakaProjeSecimi = document.getElementById('plakaProjeSecimi');
    if (plakaProjeSecimi) {
      // Temizle
      while (plakaProjeSecimi.options.length > 1) {
        plakaProjeSecimi.remove(1);
      }
      
      // Ekle
      result.projeler.forEach(proje => {
        const option = document.createElement('option');
        option.value = proje.id;
        option.textContent = `${proje.proje_kodu} - ${proje.proje_adi}`;
        plakaProjeSecimi.appendChild(option);
      });
    }
    
    const parcaProjeSecimi = document.getElementById('parcaProjeSecimi');
    if (parcaProjeSecimi) {
      // Temizle
      while (parcaProjeSecimi.options.length > 1) {
        parcaProjeSecimi.remove(1);
      }
      
      // Ekle
      result.projeler.forEach(proje => {
        const option = document.createElement('option');
        option.value = proje.id;
        option.textContent = `${proje.proje_kodu} - ${proje.proje_adi}`;
        parcaProjeSecimi.appendChild(option);
      });
    }
    
    return result.projeler;
  } catch (error) {
    console.error("Projeler yüklenirken hata:", error);
    return [];
  }
}

// Müşterileri yükleme fonksiyonu
async function loadMusteriler() {
  try {
    console.log("loadMusteriler çağrıldı");
    const result = await window.electronAPI.invoke.database.getAllMusteriler();
    
    if (!result.success) {
      console.error("Müşteriler getirilirken hata:", result.message);
      return;
    }
    
    // Plaka grubu işlem modalı için select
    const plakaGrubuMusteriSecimi = document.getElementById('plakaGrubuMusteriSecimi');
    if (plakaGrubuMusteriSecimi) {
      // Mevcut seçenekleri temizle (ilk seçenek hariç)
      while (plakaGrubuMusteriSecimi.options.length > 1) {
        plakaGrubuMusteriSecimi.remove(1);
      }
      
      // Müşterileri ekle
      result.musteriler.forEach(musteri => {
        const option = document.createElement('option');
        option.value = musteri.id;
        option.textContent = musteri.musteri_adi;
        plakaGrubuMusteriSecimi.appendChild(option);
      });
      
      console.log(`${result.musteriler.length} müşteri yüklendi (Plaka Grubu)`);
    }
    
    // Diğer modallar için de aynı işlemi yap
    const plakaMusteriSecimi = document.getElementById('plakaMusteriSecimi');
    if (plakaMusteriSecimi) {
      // Temizle
      while (plakaMusteriSecimi.options.length > 1) {
        plakaMusteriSecimi.remove(1);
      }
      
      // Ekle
      result.musteriler.forEach(musteri => {
        const option = document.createElement('option');
        option.value = musteri.id;
        option.textContent = musteri.musteri_adi;
        plakaMusteriSecimi.appendChild(option);
      });
    }
    
    const parcaMusteriSecimi = document.getElementById('parcaMusteriSecimi');
    if (parcaMusteriSecimi) {
      // Temizle
      while (parcaMusteriSecimi.options.length > 1) {
        parcaMusteriSecimi.remove(1);
      }
      
      // Ekle
      result.musteriler.forEach(musteri => {
        const option = document.createElement('option');
        option.value = musteri.id;
        option.textContent = musteri.musteri_adi;
        parcaMusteriSecimi.appendChild(option);
      });
    }
    
    return result.musteriler;
  } catch (error) {
    console.error("Müşteriler yüklenirken hata:", error);
    return [];
  }
}

// Çalışanları yükleme fonksiyonu
async function loadCalisanlar() {
  try {
    console.log("loadCalisanlar çağrıldı");
    const result = await window.electronAPI.invoke.database.getAllCalisan();
    
    if (!result.success) {
      console.error("Çalışanlar getirilirken hata:", result.message);
      return;
    }
    
    // Plaka grubu işlem modalı için select
    const plakaGrubuCalisanSecimi = document.getElementById('plakaGrubuCalisanSecimi');
    if (plakaGrubuCalisanSecimi) {
      // Mevcut seçenekleri temizle (ilk seçenek hariç)
      while (plakaGrubuCalisanSecimi.options.length > 1) {
        plakaGrubuCalisanSecimi.remove(1);
      }
      
      // Çalışanları ekle
      result.calisanlar.forEach(calisan => {
        const option = document.createElement('option');
        option.value = calisan.id;
        option.textContent = `${calisan.ad} ${calisan.soyad}`;
        plakaGrubuCalisanSecimi.appendChild(option);
      });
      
      console.log(`${result.calisanlar.length} çalışan yüklendi (Plaka Grubu)`);
    }
    
    // Diğer modallar için de aynı işlemi yap
    const plakaCalisanSecimi = document.getElementById('plakaCalisanSecimi');
    if (plakaCalisanSecimi) {
      // Temizle
      while (plakaCalisanSecimi.options.length > 1) {
        plakaCalisanSecimi.remove(1);
      }
      
      // Ekle
      result.calisanlar.forEach(calisan => {
        const option = document.createElement('option');
        option.value = calisan.id;
        option.textContent = `${calisan.ad} ${calisan.soyad}`;
        plakaCalisanSecimi.appendChild(option);
      });
    }
    
    const parcaCalisanSecimi = document.getElementById('parcaCalisanSecimi');
    if (parcaCalisanSecimi) {
      // Temizle
      while (parcaCalisanSecimi.options.length > 1) {
        parcaCalisanSecimi.remove(1);
      }
      
      // Ekle
      result.calisanlar.forEach(calisan => {
        const option = document.createElement('option');
        option.value = calisan.id;
        option.textContent = `${calisan.ad} ${calisan.soyad}`;
        parcaCalisanSecimi.appendChild(option);
      });
    }
    
    return result.calisanlar;
  } catch (error) {
    console.error("Çalışanlar yüklenirken hata:", error);
    return [];
  }
}


function togglePlakaGrubuFormSections() {
  const kullanimAlani = document.getElementById('plakaGrubuKullanimAlani').value;
  console.log("togglePlakaGrubuFormSections çağrıldı, kullanım alanı:", kullanimAlani);
  
  // Müşteri panelini göster/gizle
  const musteriPanel = document.getElementById('plakaGrubuMusteriPanel');
  if (musteriPanel) {
    musteriPanel.style.display = kullanimAlani === 'FasonImalat' ? 'block' : 'none';
  }
  
  // Yarı mamul panelini göster/gizle
  const yariMamulPanel = document.getElementById('plakaGrubuYariMamulPanel');
  if (yariMamulPanel) {
    yariMamulPanel.style.display = kullanimAlani === 'MakineImalat' ? 'block' : 'none';
  }
  
  // Makine imalat seçildiğinde plaka sayısını 1 yap ve readonly yap
  const plakaSayisiInput = document.getElementById('plakaGrubuPlakaSayisiInput');
  const kullanilanMiktarInput = document.getElementById('plakaGrubuKullanilanMiktar');
  const hurdaMiktarInput = document.getElementById('plakaGrubuHurdaMiktar');
  
  if (kullanimAlani === 'MakineImalat') {
    // Plaka sayısını 1 yap ve readonly yap
    if (plakaSayisiInput) {
      plakaSayisiInput.value = '1';
      plakaSayisiInput.readOnly = true;
      plakaSayisiInput.style.backgroundColor = '#f5f5f5';
      plakaSayisiInput.style.color = '#666';
    }
    
    // Kullanılan miktar ve hurda alanlarını readonly yap
    if (kullanilanMiktarInput) {
      kullanilanMiktarInput.readOnly = true;
      kullanilanMiktarInput.style.backgroundColor = '#f5f5f5';
      kullanilanMiktarInput.style.color = '#666';
      kullanilanMiktarInput.placeholder = 'Yarı mamul bilgilerine göre otomatik hesaplanır';
    }
    
    if (hurdaMiktarInput) {
      hurdaMiktarInput.readOnly = true;
      hurdaMiktarInput.style.backgroundColor = '#f5f5f5';
      hurdaMiktarInput.style.color = '#666';
      hurdaMiktarInput.placeholder = 'Otomatik hesaplanır';
    }
    
    // Plaka sayısı değişim olayını kaldır
    if (plakaSayisiInput) {
      plakaSayisiInput.removeEventListener('input', updateKullanilanMiktarFromPlakaSayisi);
      plakaSayisiInput.removeEventListener('change', updateKullanilanMiktarFromPlakaSayisi);
    }
    
    // Kullanılan miktar değişim olayını kaldır
    if (kullanilanMiktarInput) {
      kullanilanMiktarInput.removeEventListener('input', onPlakaGrubuKullanilanMiktarChange);
      kullanilanMiktarInput.removeEventListener('change', onPlakaGrubuKullanilanMiktarChange);
    }
    
    // Başlangıç hesaplaması
    updateKullanilanMiktarFromPlakaSayisi();
    
  } else {
    // Normal mod - alanları normale döndür
    if (plakaSayisiInput) {
      plakaSayisiInput.readOnly = false;
      plakaSayisiInput.style.backgroundColor = '';
      plakaSayisiInput.style.color = '';
      plakaSayisiInput.value = '1'; // Varsayılan değer
    }
    
    if (kullanilanMiktarInput) {
      kullanilanMiktarInput.readOnly = false;
      kullanilanMiktarInput.style.backgroundColor = '';
      kullanilanMiktarInput.style.color = '';
      kullanilanMiktarInput.placeholder = '';
    }
    
    if (hurdaMiktarInput) {
      hurdaMiktarInput.readOnly = false;
      hurdaMiktarInput.style.backgroundColor = '';
      hurdaMiktarInput.style.color = '';
      hurdaMiktarInput.placeholder = '';
    }
    
    // Event listener'ları geri ekle
    if (plakaSayisiInput) {
      plakaSayisiInput.addEventListener('input', updateKullanilanMiktarFromPlakaSayisi);
      plakaSayisiInput.addEventListener('change', updateKullanilanMiktarFromPlakaSayisi);
    }
    
    if (kullanilanMiktarInput) {
      kullanilanMiktarInput.addEventListener('input', onPlakaGrubuKullanilanMiktarChange);
      kullanilanMiktarInput.addEventListener('change', onPlakaGrubuKullanilanMiktarChange);
    }
  }
}


// Yarı mamul değişikliklerini dinleyen fonksiyon - YENİ
function onPlakaGrubuYariMamulChange() {
  const kullanimAlani = document.getElementById('plakaGrubuKullanimAlani').value;
  
  if (kullanimAlani === 'MakineImalat') {
    calculatePlakaGrubuMakineImalatMiktarlari();
  }
}

function calculatePlakaGrubuMakineImalatMiktarlari() {
  if (!currentPlakaGrubu) return;
  
  const kullanimAlani = document.getElementById('plakaGrubuKullanimAlani').value;
  if (kullanimAlani !== 'MakineImalat') return;
  
  // Tek plaka ağırlığını hesapla
  const plakaAgirligi = currentPlakaGrubu.toplam_plaka_sayisi > 0 ? 
    Number(currentPlakaGrubu.toplam_kilo) / currentPlakaGrubu.toplam_plaka_sayisi : 0;
  
  // Yarı mamul toplam ağırlığını hesapla
  let toplamYariMamulAgirligi = 0;
  const yarimamulItems = document.querySelectorAll('#plakaGrubuYariMamulList .yarimamul-item');
  
  yarimamulItems.forEach(item => {
    const index = item.dataset.index;
    const miktar = parseFloat(document.getElementById(`plakaGrubuYariMamulMiktar_${index}`)?.value) || 0;
    const birimAgirlik = parseFloat(document.getElementById(`plakaGrubuYariMamulAgirlik_${index}`)?.value) || 0;
    toplamYariMamulAgirligi += miktar * birimAgirlik;
  });
  
  // Kalan parça ağırlığını hesapla
  let toplamKalanParcaAgirligi = 0;
  if (window.kalanParcalar && window.kalanParcalar.length > 0) {
    toplamKalanParcaAgirligi = window.kalanParcalar.reduce((toplam, parca) => {
      return toplam + parseFloat(parca.agirlik || 0);
    }, 0);
  }
  
  // Kullanılan miktar = yarı mamul ağırlığı
  const kullanilanMiktar = toplamYariMamulAgirligi;
  
  // Hurda miktar = plaka ağırlığı - kullanılan miktar - kalan parça ağırlığı
  const hurdaMiktar = Math.max(0, plakaAgirligi - kullanilanMiktar - toplamKalanParcaAgirligi);
  
  // Alanları güncelle
  document.getElementById('plakaGrubuKullanilanMiktar').value = kullanilanMiktar.toFixed(2);
  document.getElementById('plakaGrubuHurdaMiktar').value = hurdaMiktar.toFixed(2);
  
  console.log('Makine imalat hesaplama:', {
    plakaAgirligi: plakaAgirligi.toFixed(2),
    toplamYariMamulAgirligi: toplamYariMamulAgirligi.toFixed(2),
    toplamKalanParcaAgirligi: toplamKalanParcaAgirligi.toFixed(2),
    kullanilanMiktar: kullanilanMiktar.toFixed(2),
    hurdaMiktar: hurdaMiktar.toFixed(2)
  });
}


// Plaka Grubu İşlem formu resetleme
function resetPlakaGrubuIslemForm() {
  document.getElementById('plakaGrubuIslemForm').reset();
  document.getElementById('plakaGrubuKullanilanMiktar').value = '';
  document.getElementById('plakaGrubuHurdaMiktar').value = '0';
  document.getElementById('plakaGrubuPlakaSayisiInput').value = '1';
  
  // Kalan parça listesini sıfırla
  window.kalanParcalar = [];
  const kalanParcaContainer = document.getElementById('kalanParcaListesiContainer');
  if (kalanParcaContainer) kalanParcaContainer.style.display = 'none';
  
  // Yarı mamul panelini gizle
  const yariMamulPanel = document.getElementById('plakaGrubuYariMamulPanel');
  if (yariMamulPanel) yariMamulPanel.style.display = 'none';
}

function updateKullanilanMiktarFromPlakaSayisi() {
  if (!currentPlakaGrubu) return;
  
  const plakaSayisi = parseInt(document.getElementById('plakaGrubuPlakaSayisiInput').value) || 1;
  
  // DÜZELTME: Sadece plaka kg'sini hesapla (parça kg'si dahil değil)
  const plakaAgirligi = currentPlakaGrubu.toplam_plaka_sayisi > 0 ? 
    Number(currentPlakaGrubu.toplam_kilo) / currentPlakaGrubu.toplam_plaka_sayisi : 0;
  
  // Seçilen plaka sayısı için toplam ağırlığı hesapla
  const toplamAgirlik = plakaSayisi * plakaAgirligi;
  
  // Kullanılan miktar alanını güncelle
  document.getElementById('plakaGrubuKullanilanMiktar').value = toplamAgirlik.toFixed(2);
  
  // Hurda miktarını otomatik hesapla
  calculatePlakaGrubuHurdaMiktar();
}

// Kalan parça eklendiğinde/silindiğinde hurda miktarını güncelle
// Mevcut fonksiyonlara ekleme yapıyoruz
const originalEklePlakaGrubuKalanParca = window.eklePlakaGrubuKalanParca;
if (originalEklePlakaGrubuKalanParca) {
  window.eklePlakaGrubuKalanParca = function() {
    originalEklePlakaGrubuKalanParca();
    setTimeout(calculatePlakaGrubuHurdaMiktar, 100);
  };
}

const originalRemovePlakaGrubuKalanParca = window.removePlakaGrubuKalanParca;
if (originalRemovePlakaGrubuKalanParca) {
  window.removePlakaGrubuKalanParca = function(index) {
    originalRemovePlakaGrubuKalanParca(index);
    setTimeout(calculatePlakaGrubuHurdaMiktar, 100);
  };
}


async function savePlakaGrubuIslem() {
  try {
    // Form değerlerini al
    const plakaSayisi = parseInt(document.getElementById('plakaGrubuPlakaSayisiInput').value) || 1;
    const kullanilanMiktar = parseFloat(document.getElementById('plakaGrubuKullanilanMiktar').value);
    const hurdaMiktar = parseFloat(document.getElementById('plakaGrubuHurdaMiktar').value) || 0;
    const islemTuru = document.getElementById('plakaGrubuIslemTuru').value;
    const kullanimAlani = document.getElementById('plakaGrubuKullanimAlani').value;
    const projeId = document.getElementById('plakaGrubuProjeSecimi').value;
    const musteriId = document.getElementById('plakaGrubuMusteriSecimi')?.value;
    const makine = document.getElementById('plakaGrubuMakineSecimi').value;
    const calisanId = document.getElementById('plakaGrubuCalisanSecimi').value;
    
    // Validasyon
    if (!kullanilanMiktar || kullanilanMiktar <= 0) {
      showModalError('plakaGrubuIslemModal', 'Lütfen geçerli bir kullanılan miktar girin.');
      return;
    }
    
    if (!projeId) {
      showModalError('plakaGrubuIslemModal', 'Lütfen bir proje seçin veya yeni bir proje oluşturun.');
      return;
    }
    
    // Fason imalat ise müşteri zorunlu
    if (kullanimAlani === 'FasonImalat' && !musteriId) {
      showModalError('plakaGrubuIslemModal', 'Fason imalat için müşteri seçimi zorunludur.');
      return;
    }
    
    // Makine seçimi zorunlu
    if (!makine) {
      showModalError('plakaGrubuIslemModal', 'Lütfen bir makine seçin.');
      return;
    }
    
    // Çalışan seçimi zorunlu
    if (!calisanId) {
      showModalError('plakaGrubuIslemModal', 'Lütfen işlemi yapan çalışanı seçin.');
      return;
    }
    
    // Plaka sayısı kontrolü
    if (plakaSayisi <= 0 || plakaSayisi > currentPlakaGrubu.kalan_plaka_sayisi) {
      showModalError('plakaGrubuIslemModal', `Plaka sayısı 1 ile ${currentPlakaGrubu.kalan_plaka_sayisi} arasında olmalıdır.`);
      return;
    }
    
    // DÜZELTME: Sadece plaka ağırlığını kontrol et
    const plakaAgirligi = currentPlakaGrubu.toplam_plaka_sayisi > 0 ? 
      Number(currentPlakaGrubu.toplam_kilo) / currentPlakaGrubu.toplam_plaka_sayisi : 0;
    const secilenPlakaToplamAgirlik = plakaSayisi * plakaAgirligi;
    const toplamKullanilacak = kullanilanMiktar + hurdaMiktar;
    
    // Hassasiyet toleransı
    const HASSASIYET_TOLERANSI = 0.01;
    
    if (toplamKullanilacak > (secilenPlakaToplamAgirlik + HASSASIYET_TOLERANSI)) {
      showModalError('plakaGrubuIslemModal', 
        `Kullanmak istediğiniz toplam miktar (${toplamKullanilacak.toFixed(2)} kg) seçilen ${plakaSayisi} plakanın toplam ağırlığından (${secilenPlakaToplamAgirlik.toFixed(2)} kg) fazla.`);
      return;
    }
    
    // Kalan parça bilgileri
    let kalanParcaDataList = [];
    if (document.getElementById('plakaGrubuKalanParcaSwitch').checked && window.kalanParcalar && window.kalanParcalar.length > 0) {
      kalanParcaDataList = window.kalanParcalar.map(parca => ({
        en: parca.en,
        boy: parca.boy,
        kalinlik: parca.kalinlik,
        hesaplanan_agirlik: parca.agirlik,
        plaka_grubu_id: currentPlakaGrubuId
      }));
      
      // Kalan parça ağırlığını da kontrol et
      const toplamParcaAgirligi = kalanParcaDataList.reduce((toplam, parca) => toplam + parseFloat(parca.hesaplanan_agirlik), 0);
      const tumToplamKullanilacak = toplamKullanilacak + toplamParcaAgirligi;
      
      if (tumToplamKullanilacak > (secilenPlakaToplamAgirlik + HASSASIYET_TOLERANSI)) {
        showModalError('plakaGrubuIslemModal', 
          `Kullanılan miktar + hurda + kalan parçalar toplamı (${tumToplamKullanilacak.toFixed(2)} kg) seçilen ${plakaSayisi} plakanın toplam ağırlığından (${secilenPlakaToplamAgirlik.toFixed(2)} kg) fazla.`);
        return;
      }
    }
    
    // Yarı mamul bilgileri
    let yariMamulDataList = [];
    if (kullanimAlani === 'MakineImalat') {
      const yarimamulItems = document.querySelectorAll('#plakaGrubuYariMamulList .yarimamul-item');
      if (yarimamulItems.length === 0) {
        showModalError('plakaGrubuIslemModal', 'Makine imalat için en az bir yarı mamul girmelisiniz.');
        return;
      }
      
      for (const item of yarimamulItems) {
        const index = item.dataset.index;
        const adi = document.getElementById(`plakaGrubuYariMamulAdi_${index}`).value?.trim();
        const birim = document.getElementById(`plakaGrubuYariMamulBirim_${index}`).value;
        const miktar = parseFloat(document.getElementById(`plakaGrubuYariMamulMiktar_${index}`).value) || 0;
        const birimAgirlik = parseFloat(document.getElementById(`plakaGrubuYariMamulAgirlik_${index}`).value) || 0;
        
        if (!adi) {
          showModalError('plakaGrubuIslemModal', `${index+1}. yarı mamulün adını girmelisiniz.`);
          return;
        }
        
        if (miktar <= 0) {
          showModalError('plakaGrubuIslemModal', `${index+1}. yarı mamulün miktarı 0'dan büyük olmalıdır.`);
          return;
        }
        
        if (birimAgirlik <= 0) {
          showModalError('plakaGrubuIslemModal', `${index+1}. yarı mamulün birim ağırlığı 0'dan büyük olmalıdır.`);
          return;
        }
        
        yariMamulDataList.push({
          adi: adi,
          birim: birim,
          miktar: miktar,
          birimAgirlik: birimAgirlik,
          toplamAgirlik: miktar * birimAgirlik
        });
      }
    }
    
    // *** ONAY SİSTEMİ - İŞLEM DETAYLARINI HAZIRLA ***
    let onayMesaji = `📊 İşlem Detayları:\n\n`;
    onayMesaji += `• Kullanılan Miktar: ${kullanilanMiktar.toFixed(2)} kg\n`;
    
    if (hurdaMiktar > 0) {
      onayMesaji += `• Hurda Miktarı: ${hurdaMiktar.toFixed(2)} kg\n`;
    }
    
    onayMesaji += `• Toplam İşlenen: ${toplamKullanilacak.toFixed(2)} kg\n`;
    onayMesaji += `• Plaka Sayısı: ${plakaSayisi} adet\n\n`;
    
    // Kalan parçalar varsa
    if (kalanParcaDataList.length > 0) {
      onayMesaji += `🔧 Oluşacak Kalan Parçalar:\n`;
      kalanParcaDataList.forEach((parca, index) => {
        onayMesaji += `   ${index + 1}. ${parca.en}x${parca.boy}x${parca.kalinlik}mm (${parca.hesaplanan_agirlik.toFixed(2)} kg)\n`;
      });
      onayMesaji += `\n`;
    }
    
    // Yarı mamuller varsa
    if (yariMamulDataList.length > 0) {
      onayMesaji += `🏭 Oluşacak Yarı Mamuller:\n`;
      yariMamulDataList.forEach((mamul, index) => {
        onayMesaji += `   ${index + 1}. ${mamul.adi}: ${mamul.miktar} ${mamul.birim} (${mamul.toplamAgirlik.toFixed(2)} kg)\n`;
      });
      onayMesaji += `\n`;
    }
    
    onayMesaji += `Bu işlemi onaylıyor musunuz?`;
    
    // Notiflix onay penceresi
    const onayVerildi = await new Promise((resolve) => {
      Notiflix.Confirm.show(
        '🔄 İşlem Onayı',
        onayMesaji,
        'Evet, İşlemi Kaydet!',
        'İptal',
        function() {
          resolve(true);
        },
        function() {
          resolve(false);
        },
        {
          titleColor: '#61993b',
          messageColor: '#333333',
          buttonOkBackgroundColor: '#61993b !important',
          buttonCancelBackgroundColor: '#S666666',
          cssAnimationStyle: 'zoom',
          width: '450px',
          borderRadius: '8px',
          messageMaxLength: 1000
        }
      );
    });
    
    // Onay verilmediyse işlemi sonlandır
    if (!onayVerildi) {
      return;
    }
    
    // *** İŞLEM KAYDETME - ONAY VERILDIKTEN SONRA ***
    
    // İşlem verisi - DÜZELTME: Sadece kullanılan plaka sayısı ve ağırlığı gönder
    const islemData = {
      plaka_grubu_id: currentPlakaGrubuId,
      plaka_sayisi: plakaSayisi, // Sadece kullanılan plaka sayısı
      islem_turu: islemTuru,
      kullanim_alani: kullanimAlani,
      kullanilanMiktar: kullanilanMiktar,
      hurdaMiktar: hurdaMiktar,
      toplam_islem_agirligi: secilenPlakaToplamAgirlik, // Seçilen plaka sayısının toplam ağırlığı
      proje_id: projeId,
      musteri_id: musteriId || null,
      kullanici_id: currentUser.id,
      kalan_parcalar: kalanParcaDataList,
      yari_mamuller: yariMamulDataList,
      makine: makine,
      calisan_id: parseInt(calisanId)
    };
    
    // İşlem kaydediliyor loading göster
    Notiflix.Loading.circle('İşlem kaydediliyor...', {
      backgroundColor: 'rgba(0,0,0,0.8)',
      svgColor: '#6A0D0C',
    });
    
    // İşlemi kaydet
    const result = await window.electronAPI.invoke.database.addPlakaGrubuIslem(islemData);
    
    // Loading'i kapat
    Notiflix.Loading.remove();
    
    if (result.success) {
      let successMessage = '✅ Plaka grubu işlemi başarıyla kaydedildi!';
      
      if (kullanimAlani === 'MakineImalat' && yariMamulDataList.length > 0) {
        const toplamYariMamul = yariMamulDataList.reduce((toplam, ym) => toplam + ym.miktar, 0);
        const birimText = yariMamulDataList.length > 0 ? yariMamulDataList[0].birim : 'adet';
        successMessage += `\n\n🏭 Toplam ${toplamYariMamul} ${birimText} yarı mamul oluşturuldu.`;
      }
      
      if (kalanParcaDataList.length > 0) {
        successMessage += `\n\n🔧 ${kalanParcaDataList.length} adet kalan parça oluşturuldu.`;
      }
      
      // Başarı mesajı
      Notiflix.Notify.success(successMessage, {
        timeout: 4000,
        position: 'right-top',
        cssAnimationStyle: 'zoom'
      });
      
      // Modalı kapat
      closeModal('plakaGrubuIslemModal');
      
      // Dashboard'ı güncelle
      updateDashboard();
      
      // Hammadde listesini güncelle
      await loadHammaddeListesi();
      
      // Kullanım alanına göre ilgili sayfayı güncelle
      if (kullanimAlani === 'FasonImalat') {
        await loadFasonIslemler();
      } else if (kullanimAlani === 'MakineImalat') {
        await loadMakineIslemler();
        await loadYariMamulListesi();
      }
      
      // Hammadde detayını yeniden yükle
      if (currentHammaddeId) {
        await viewHammaddeDetail(currentHammaddeId);
      }
    } else {
      // Hata mesajı
      Notiflix.Notify.failure('❌ Hata: ' + result.message, {
        timeout: 5000,
        position: 'right-top'
      });
    }
  } catch (error) {
    console.error('Plaka grubu işlemi kaydetme hatası:', error);
    
    // Loading varsa kapat
    Notiflix.Loading.remove();s
    
    // Hata mesajı
    Notiflix.Notify.failure('❌ İşlem kaydedilirken bir hata oluştu: ' + error.message, {
      timeout: 5000,
      position: 'right-top'
    });
  }
}


function calculatePlakaGrubuHurdaMiktar() {
  if (!currentPlakaGrubu) return;
  
  const plakaSayisi = parseInt(document.getElementById('plakaGrubuPlakaSayisiInput').value) || 1;
  const kullanilanMiktar = parseFloat(document.getElementById('plakaGrubuKullanilanMiktar').value) || 0;
  
  // DÜZELTME: Sadece plaka ağırlığını hesapla
  const plakaAgirligi = currentPlakaGrubu.toplam_plaka_sayisi > 0 ? 
    Number(currentPlakaGrubu.toplam_kilo) / currentPlakaGrubu.toplam_plaka_sayisi : 0;
  
  // Seçilen plaka sayısı için toplam ağırlığı hesapla
  const secilenPlakaToplamAgirlik = plakaSayisi * plakaAgirligi;
  
  // Kalan parça ağırlığını hesapla (eğer varsa)
  let toplamKalanParcaAgirligi = 0;
  if (window.kalanParcalar && window.kalanParcalar.length > 0) {
    toplamKalanParcaAgirligi = window.kalanParcalar.reduce((toplam, parca) => {
      return toplam + parseFloat(parca.agirlik || 0);
    }, 0);
  }
  
  // Hurda miktarını hesapla: Seçilen plaka ağırlığı - kullanılan miktar - kalan parça ağırlığı
  const hurdaMiktar = Math.max(0, secilenPlakaToplamAgirlik - kullanilanMiktar - toplamKalanParcaAgirligi);
  
  // Hurda miktar alanını güncelle
  document.getElementById('plakaGrubuHurdaMiktar').value = hurdaMiktar.toFixed(2);
}



// Bu fonksiyon da kalacak, sadece hurda hesaplamayı çağıracak
function onPlakaGrubuKullanilanMiktarChange() {
    calculatePlakaGrubuHurdaMiktar();
}


// EVENT LISTENER KISMINI DA DÜZELTİN
document.addEventListener('DOMContentLoaded', function() {
    // Plaka sayısı değiştiğinde
    const plakaSayisiInput = document.getElementById('plakaGrubuPlakaSayisiInput');
    if (plakaSayisiInput) {
        plakaSayisiInput.addEventListener('input', updateKullanilanMiktarFromPlakaSayisi);
        plakaSayisiInput.addEventListener('change', updateKullanilanMiktarFromPlakaSayisi);
    }
    
    // Kullanılan miktar değiştiğinde
    const kullanilanMiktarInput = document.getElementById('plakaGrubuKullanilanMiktar');
    if (kullanilanMiktarInput) {
        kullanilanMiktarInput.addEventListener('input', onPlakaGrubuKullanilanMiktarChange);
        kullanilanMiktarInput.addEventListener('change', onPlakaGrubuKullanilanMiktarChange);
    }
    
    // Kalan Parça Switch'i
    const plakaGrubuKalanParcaSwitch = document.getElementById('plakaGrubuKalanParcaSwitch');
    if (plakaGrubuKalanParcaSwitch) {
        plakaGrubuKalanParcaSwitch.addEventListener('change', function() {
            const panel = document.getElementById('plakaGrubuKalanParcaPanel');
            if (panel) {
                panel.style.display = this.checked ? 'block' : 'none';
            }
            
            if (!this.checked) {
                window.kalanParcalar = [];
                updatePlakaGrubuKalanParcaListUI();
                calculatePlakaGrubuHurdaMiktar(); // Tek çağrı
            }
        });
    }
});


window.onPlakaGrubuKullanilanMiktarChange = onPlakaGrubuKullanilanMiktarChange;



window.loadPlakaGruplari = loadPlakaGruplari;




function calculatePlakaGrubuWithKalanParca() {
    const en = parseFloat(document.getElementById('plakaGrubuKalanParcaEn').value);
    const boy = parseFloat(document.getElementById('plakaGrubuKalanParcaBoy').value);
    
    if (!currentPlakaGrubu) {
        document.getElementById('plakaGrubuKalanParcaHesapSonucu').innerHTML = 
            '<div class="error">Plaka grubu bilgileri bulunamadı.</div>';
        document.getElementById('plakaGrubuKalanParcaHesapSonucu').style.display = 'block';
        document.getElementById('eklePlakaGrubuKalanParcaBtn').disabled = true;
        return null;
    }
    
    const kalinlik = parseFloat(currentPlakaGrubu.kalinlik);
    const yogunluk = parseFloat(currentHammadde.yogunluk);
    const plakaSayisi = parseInt(document.getElementById('plakaGrubuPlakaSayisiInput').value) || 1;
    
    if (!en || !boy || isNaN(en) || isNaN(boy)) {
        document.getElementById('plakaGrubuKalanParcaHesapSonucu').innerHTML = 
            '<div class="error">Lütfen geçerli en ve boy değerleri girin.</div>';
        document.getElementById('plakaGrubuKalanParcaHesapSonucu').style.display = 'block';
        document.getElementById('eklePlakaGrubuKalanParcaBtn').disabled = true;
        return null;
    }
    
    // Orijinal plaka grubu boyutlarını kontrol et
    if (en > currentPlakaGrubu.en || boy > currentPlakaGrubu.boy) {
        document.getElementById('plakaGrubuKalanParcaHesapSonucu').innerHTML = 
            '<div class="error">Kalan parça boyutları orijinal plaka boyutlarından büyük olamaz.</div>';
        document.getElementById('plakaGrubuKalanParcaHesapSonucu').style.display = 'block';
        document.getElementById('eklePlakaGrubuKalanParcaBtn').disabled = true;
        return null;
    }
    
    // Hacim hesapla (m³)
    const hacim = (en / 1000) * (boy / 1000) * (kalinlik / 1000);
    
    // Tek parça ağırlığı hesapla (kg)
    const tekParcaAgirlik = Number((hacim * yogunluk).toFixed(2));
    
    // Toplam ağırlık (seçilen plaka sayısı kadar)
    const toplamAgirlik = tekParcaAgirlik * plakaSayisi;
    
    // Sonucu göster
    document.getElementById('plakaGrubuKalanParcaHesapSonucu').innerHTML = `
        <div class="calculation-details">
            <div class="detail-row">
                <span>En x Boy:</span>
                <span>${en} mm x ${boy} mm</span>
            </div>
            <div class="detail-row">
                <span>Kalınlık:</span>
                <span>${kalinlik} mm</span>
            </div>
            <div class="detail-row">
                <span>Seçilen Plaka Sayısı:</span>
                <span>${plakaSayisi} adet</span>
            </div>
            <div class="detail-row">
                <span>Tek Parça Ağırlığı:</span>
                <span>${tekParcaAgirlik.toFixed(2)} kg</span>
            </div>
            <div class="detail-row highlight">
                <span>Toplam Ağırlık (${plakaSayisi} parça):</span>
                <span>${toplamAgirlik.toFixed(2)} kg</span>
            </div>
        </div>
    `;
    document.getElementById('plakaGrubuKalanParcaHesapSonucu').style.display = 'block';
    
    // Toplam kullanılabilir kilo kontrolü
    const kullanilanMiktar = parseFloat(document.getElementById('plakaGrubuKullanilanMiktar').value) || 0;
    const plakaAgirligi = parseFloat(currentPlakaGrubu.kalan_kilo) / parseFloat(currentPlakaGrubu.kalan_plaka_sayisi);
    const secilenPlakaToplamAgirlik = plakaSayisi * plakaAgirligi;
    const mevcutKalanParcalarToplami = window.kalanParcalar ? window.kalanParcalar.reduce((toplam, parca) => toplam + parca.agirlik, 0) : 0;
    const kullanilabilirKilo = secilenPlakaToplamAgirlik - kullanilanMiktar - mevcutKalanParcalarToplami;
    
    // Ağırlık kullanılabilir kilodan büyük mü kontrol et
    if (toplamAgirlik > kullanilabilirKilo) {
        document.getElementById('plakaGrubuKalanParcaHesapSonucu').innerHTML += `
            <div class="error">
                Hata: Bu parçaların toplam ağırlığı (${toplamAgirlik.toFixed(2)} kg), kullanılabilir miktardan (${kullanilabilirKilo.toFixed(2)} kg) fazla.
            </div>
        `;
        document.getElementById('eklePlakaGrubuKalanParcaBtn').disabled = true;
        return null;
    }
    
    // Parça ekleme butonunu aktifleştir
    document.getElementById('eklePlakaGrubuKalanParcaBtn').disabled = false;
    
    return {
        en: en,
        boy: boy,
        kalinlik: kalinlik,
        agirlik: tekParcaAgirlik // Tek parça ağırlığı döndür
    };
}

function addPlakaGrubuKalanParca() {
    const parcaDetay = calculatePlakaGrubuWithKalanParca();
    
    if (!parcaDetay) {
        return;
    }
    
    if (!window.kalanParcalar) {
        window.kalanParcalar = [];
    }
    
    // Seçilen plaka sayısını al
    const plakaSayisi = parseInt(document.getElementById('plakaGrubuPlakaSayisiInput').value) || 1;
    
    // Seçilen plaka sayısı kadar parça oluştur
    for (let i = 0; i < plakaSayisi; i++) {
        const yeniId = Date.now() + i; // Her parça için benzersiz ID
        const yeniParca = {
            id: yeniId,
            en: parcaDetay.en,
            boy: parcaDetay.boy,
            kalinlik: parcaDetay.kalinlik,
            agirlik: parcaDetay.agirlik,
            plakaIndex: i + 1 // Hangi plakadan geldiğini göstermek için
        };
        
        window.kalanParcalar.push(yeniParca);
    }
    
    updatePlakaGrubuKalanParcaListUI();
    
    // Formları temizle
    document.getElementById('plakaGrubuKalanParcaEn').value = '';
    document.getElementById('plakaGrubuKalanParcaBoy').value = '';
    document.getElementById('plakaGrubuKalanParcaHesapSonucu').style.display = 'none';
    document.getElementById('eklePlakaGrubuKalanParcaBtn').disabled = true;
    
    // Hurda hesaplama çağrısı
    calculatePlakaGrubuHurdaMiktar();
    
    // Başarı mesajı göster
    showToast(`${plakaSayisi} adet parça başarıyla eklendi`, 'success');
}

function updatePlakaGrubuKalanParcaListUI() {
    const listesiContainer = document.getElementById('plakaGrubuKalanParcaListesiContainer');
    const listesi = document.getElementById('plakaGrubuKalanParcaListesi');
    
    if (!window.kalanParcalar) {
        window.kalanParcalar = [];
    }
    
    if (window.kalanParcalar.length > 0) {
        listesiContainer.style.display = 'block';
    } else {
        listesiContainer.style.display = 'none';
        return;
    }
    
    listesi.innerHTML = '';
    
    // Parçaları plaka indexine göre grupla
    const parcaGruplari = {};
    window.kalanParcalar.forEach((parca, index) => {
        const key = `${parca.en}x${parca.boy}`;
        if (!parcaGruplari[key]) {
            parcaGruplari[key] = [];
        }
        parcaGruplari[key].push({...parca, globalIndex: index});
    });
    
    // Her parça grubu için kart oluştur
    Object.keys(parcaGruplari).forEach(key => {
        const parcalar = parcaGruplari[key];
        const ilkParca = parcalar[0];
        
        const parcaCard = document.createElement('div');
        parcaCard.className = 'parca-card';
        parcaCard.innerHTML = `
            <h4>Parça Grubu (${parcalar.length} adet)</h4>
            <div class="parca-detail">
                <span>Boyut:</span>
                <span>${ilkParca.en} x ${ilkParca.boy} mm</span>
            </div>
            <div class="parca-detail">
                <span>Birim Ağırlık:</span>
                <span>${ilkParca.agirlik.toFixed(2)} kg</span>
            </div>
            <div class="parca-detail">
                <span>Toplam Ağırlık:</span>
                <span>${(ilkParca.agirlik * parcalar.length).toFixed(2)} kg</span>
            </div>
            <button type="button" class="btn-danger btn-sm" onclick="removePlakaGrubuKalanParcaGrubu('${key}')">
                <i class="fas fa-trash"></i> Grubu Sil
            </button>
        `;
        listesi.appendChild(parcaCard);
    });
}


function removePlakaGrubuKalanParcaGrubu(parcaKey) {
    if (!window.kalanParcalar) {
        window.kalanParcalar = [];
        return;
    }
    
    const [en, boy] = parcaKey.split('x').map(Number);
    
    window.kalanParcalar = window.kalanParcalar.filter(parca => 
        !(parca.en === en && parca.boy === boy)
    );
    
    updatePlakaGrubuKalanParcaListUI();
    calculatePlakaGrubuHurdaMiktar();
    
    showToast('Parça grubu silindi', 'info');
}


function removePlakaGrubuKalanParca(parcaId) {
    if (!window.kalanParcalar) {
        window.kalanParcalar = [];
        return;
    }
    
    window.kalanParcalar = window.kalanParcalar.filter(parca => parca.id !== parcaId);
    updatePlakaGrubuKalanParcaListUI();
    
    // TEK HURDA HESAPLAMA ÇAĞRISI
    calculatePlakaGrubuHurdaMiktar();
}



function removePlakaGrubuYariMamul(index) {
    const item = document.querySelector(`.yarimamul-item[data-index="${index}"]`);
    if (item) {
        item.remove();
        
        // Makine imalat modundaysa hesaplama yap
        const kullanimAlani = document.getElementById('plakaGrubuKullanimAlani').value;
        if (kullanimAlani === 'MakineImalat') {
            calculatePlakaGrubuMakineImalatMiktarlari();
        }
    }
}


// Kalan parça ekleme/silme işlemlerinde de hesaplama yapalım
const originalAddPlakaGrubuKalanParca = window.addPlakaGrubuKalanParca;
if (originalAddPlakaGrubuKalanParca) {
  window.addPlakaGrubuKalanParca = function() {
    originalAddPlakaGrubuKalanParca();
    
    // Makine imalat modundaysa hesaplama yap
    const kullanimAlani = document.getElementById('plakaGrubuKullanimAlani')?.value;
    if (kullanimAlani === 'MakineImalat') {
        setTimeout(calculatePlakaGrubuMakineImalatMiktarlari, 100);
    } else {
        setTimeout(calculatePlakaGrubuHurdaMiktar, 100);
    }
  };
}

const originalRemovePlakaGrubuKalanParcaGrubu = window.removePlakaGrubuKalanParcaGrubu;
if (originalRemovePlakaGrubuKalanParcaGrubu) {
  window.removePlakaGrubuKalanParcaGrubu = function(parcaKey) {
    originalRemovePlakaGrubuKalanParcaGrubu(parcaKey);
    
    // Makine imalat modundaysa hesaplama yap
    const kullanimAlani = document.getElementById('plakaGrubuKullanimAlani')?.value;
    if (kullanimAlani === 'MakineImalat') {
        setTimeout(calculatePlakaGrubuMakineImalatMiktarlari, 100);
    } else {
        setTimeout(calculatePlakaGrubuHurdaMiktar, 100);
    }
  };
}

// Event listener eklemeleri
document.addEventListener('DOMContentLoaded', function() {
    // Kullanım alanı değiştiğinde
    const plakaGrubuKullanimAlani = document.getElementById('plakaGrubuKullanimAlani');
    if (plakaGrubuKullanimAlani) {
        plakaGrubuKullanimAlani.addEventListener('change', togglePlakaGrubuFormSections);
    }
    
    // Kalan Parça Switch'i
    const plakaGrubuKalanParcaSwitch = document.getElementById('plakaGrubuKalanParcaSwitch');
    if (plakaGrubuKalanParcaSwitch) {
        plakaGrubuKalanParcaSwitch.addEventListener('change', function() {
            const panel = document.getElementById('plakaGrubuKalanParcaPanel');
            if (panel) {
                panel.style.display = this.checked ? 'block' : 'none';
            }
            
            if (!this.checked) {
                window.kalanParcalar = [];
                updatePlakaGrubuKalanParcaListUI();
                
                // Makine imalat modundaysa özel hesaplama
                const kullanimAlani = document.getElementById('plakaGrubuKullanimAlani')?.value;
                if (kullanimAlani === 'MakineImalat') {
                    calculatePlakaGrubuMakineImalatMiktarlari();
                } else {
                    calculatePlakaGrubuHurdaMiktar();
                }
            }
        });
    }
});

// Global fonksiyonları ekle
window.onPlakaGrubuYariMamulChange = onPlakaGrubuYariMamulChange;
window.calculatePlakaGrubuMakineImalatMiktarlari = calculatePlakaGrubuMakineImalatMiktarlari;

function addPlakaGrubuYariMamul() {
    const yariMamulList = document.getElementById('plakaGrubuYariMamulList');
    const items = yariMamulList.querySelectorAll('.yarimamul-item');
    const newIndex = items.length;
    
    const yariMamulHtml = `
        <div class="yarimamul-item" data-index="${newIndex}">
            <div class="form-row">
                <div class="form-group col-half">
                    <label for="plakaGrubuYariMamulAdi_${newIndex}">Yarı Mamul Adı</label>
                    <input type="text" id="plakaGrubuYariMamulAdi_${newIndex}" placeholder="Yarı mamul adı">
                </div>
                
                <div class="form-group col-half">
                    <label for="plakaGrubuYariMamulBirim_${newIndex}">Birim</label>
                    <select id="plakaGrubuYariMamulBirim_${newIndex}">
                        <option value="adet">Adet</option>
                        <option value="metre">Metre</option>
                        <option value="kg">Kilogram</option>
                        <option value="set">Set</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group col-half">
                    <label for="plakaGrubuYariMamulMiktar_${newIndex}">Miktar</label>
                    <input type="number" id="plakaGrubuYariMamulMiktar_${newIndex}" placeholder="Miktar" min="0" 
                           onchange="onPlakaGrubuYariMamulChange()" oninput="onPlakaGrubuYariMamulChange()">
                </div>
                
                <div class="form-group col-half">
                    <label for="plakaGrubuYariMamulAgirlik_${newIndex}">Birim Ağırlık (kg)</label>
                    <input type="number" id="plakaGrubuYariMamulAgirlik_${newIndex}" placeholder="Birim ağırlık" min="0" step="0.01"
                           onchange="onPlakaGrubuYariMamulChange()" oninput="onPlakaGrubuYariMamulChange()">
                </div>
            </div>
            
            <div class="form-actions yarimamul-actions">
                <button type="button" class="btn-danger btn-sm" onclick="removePlakaGrubuYariMamul(${newIndex})">
                    <i class="fas fa-trash"></i> Sil
                </button>
            </div>
        </div>
    `;
    
    yariMamulList.insertAdjacentHTML('beforeend', yariMamulHtml);
    
    // Makine imalat modundaysa hesaplama yap
    const kullanimAlani = document.getElementById('plakaGrubuKullanimAlani').value;
    if (kullanimAlani === 'MakineImalat') {
        calculatePlakaGrubuMakineImalatMiktarlari();
    }
}

// DOM yüklendiğinde event listener'ları ekle
document.addEventListener('DOMContentLoaded', function() {
    // Plaka Grubu Kalan Parça Hesaplama butonu
    const hesaplaPlakaGrubuKalanParcaBtn = document.getElementById('hesaplaPlakaGrubuKalanParcaBtn');
    if (hesaplaPlakaGrubuKalanParcaBtn) {
        hesaplaPlakaGrubuKalanParcaBtn.addEventListener('click', calculatePlakaGrubuWithKalanParca);
    }
    
    // Plaka Grubu Kalan Parça Ekle butonu
    const eklePlakaGrubuKalanParcaBtn = document.getElementById('eklePlakaGrubuKalanParcaBtn');
    if (eklePlakaGrubuKalanParcaBtn) {
        eklePlakaGrubuKalanParcaBtn.addEventListener('click', addPlakaGrubuKalanParca);
    }
    
    // Yeni Yarı Mamul Ekle butonu
    const ekleYeniPlakaGrubuYariMamulBtn = document.getElementById('ekleYeniPlakaGrubuYariMamulBtn');
    if (ekleYeniPlakaGrubuYariMamulBtn) {
        ekleYeniPlakaGrubuYariMamulBtn.addEventListener('click', addPlakaGrubuYariMamul);
    }
    
    // Kalan Parça Switch'i
    const plakaGrubuKalanParcaSwitch = document.getElementById('plakaGrubuKalanParcaSwitch');
    if (plakaGrubuKalanParcaSwitch) {
        plakaGrubuKalanParcaSwitch.addEventListener('change', function() {
            const panel = document.getElementById('plakaGrubuKalanParcaPanel');
            if (panel) {
                panel.style.display = this.checked ? 'block' : 'none';
            }
            
            // Eğer kapalı ise kalan parçaları temizle
            if (!this.checked) {
                window.kalanParcalar = [];
                updatePlakaGrubuKalanParcaListUI();
                updatePlakaGrubuHurdaHesaplama();
            }
        });
    }
});


window.calculatePlakaGrubuWithKalanParca = calculatePlakaGrubuWithKalanParca;
window.addPlakaGrubuKalanParca = addPlakaGrubuKalanParca;
window.removePlakaGrubuKalanParca = removePlakaGrubuKalanParca;
window.updatePlakaGrubuKalanParcaListUI = updatePlakaGrubuKalanParcaListUI;
window.removePlakaGrubuYariMamul = removePlakaGrubuYariMamul;
window.addPlakaGrubuYariMamul = addPlakaGrubuYariMamul;
window.updateKullanilanMiktarFromPlakaSayisi = updateKullanilanMiktarFromPlakaSayisi;
window.onPlakaGrubuKullanilanMiktarChange = onPlakaGrubuKullanilanMiktarChange;
window.togglePlakaGrubuFormSections = togglePlakaGrubuFormSections;


  window.resetPlakaModal = resetPlakaModal;
  window.setupPlakaEventListeners = setupPlakaEventListeners;
  window.openYeniPlakaModal = openYeniPlakaModal;
  window.removePlakaGrubuKalanParcaGrubu = removePlakaGrubuKalanParcaGrubu;
  window.savePlakaGrubu = savePlakaGrubu;
window.originalSavePlakaGrubu = savePlakaGrubu;
