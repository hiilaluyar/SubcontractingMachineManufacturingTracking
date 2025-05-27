// editSheetPlates.js - DÜZELTİLMİŞ VERSİYON

// Global değişkenler
let editingPlakaGrubuId = null;
let editingPlakaGrubu = null;
let isEditMode = false;
let isProcessingSave = false; // Çift kaydetmeyi engellemek için

// Modal state'ini tamamen temizle
function resetModalState() {
  console.log('🔄 Modal state sıfırlanıyor...');
  
  // İşlem durumunu sıfırla
  isProcessingSave = false;
  
  // Global değişkenleri sıfırla
  editingPlakaGrubuId = null;
  editingPlakaGrubu = null;
  isEditMode = false;
  
  // Modal başlığını sıfırla
  const modalTitle = document.querySelector('#yeniPlakaGrubuModal h2');
  if (modalTitle) {
    modalTitle.textContent = 'Yeni Plaka Grubu Ekle';
  }
  
  // Durum panelini kaldır
  const durumPaneli = document.getElementById('plakaGrubuDurumPaneli');
  if (durumPaneli) {
    durumPaneli.remove();
  }
  
  // Hesaplama butonunu göster
  const hesaplaBtn = document.getElementById('hesaplaPlakaGrubuBtn');
  if (hesaplaBtn) {
    hesaplaBtn.style.display = 'inline-block';
  }
  
  // Kaydet butonunu normal moda çevir
  resetSaveButton();
  
  // Formu sıfırla
  resetPlakaGrubuModal();
  
  // Hesaplama detaylarını temizle
  window.plakaGrubuHesaplamaDetaylari = null;
  
  // Hesaplama sonucu alanını temizle
  const hesapSonucu = document.getElementById('plakaGrubuHesapSonucu');
  if (hesapSonucu) {
    hesapSonucu.style.display = 'none';
    hesapSonucu.innerHTML = '';
  }
  
  console.log('✅ Modal state tamamen sıfırlandı');
}

// Kaydet butonunu sıfırla ve TEK event listener ekle
function resetSaveButton() {
  const kaydetBtn = document.getElementById('plakaGrubuKaydetBtn');
  if (!kaydetBtn) return;
  
  // Butonu tamamen klonla (tüm event listener'ları temizlemek için)
  const yeniBtn = kaydetBtn.cloneNode(true);
  kaydetBtn.parentNode.replaceChild(yeniBtn, kaydetBtn);
  
  // Buton metnini ve durumunu sıfırla
  yeniBtn.innerHTML = '<i class="fas fa-save"></i> Plaka Grubunu Kaydet';
  yeniBtn.disabled = true;
  
  // TEK event listener ekle
  yeniBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Çift tıklamayı engelle
    if (isProcessingSave) {
      console.log('⚠️ İşlem zaten devam ediyor...');
      return;
    }
    
    console.log('🎯 Kaydet butonu tıklandı - Mode:', isEditMode ? 'EDIT' : 'ADD');
    
    if (isEditMode) {
      savePlakaGrubuEdit();
    } else {
      savePlakaGrubu();
    }
  });

}

// Normal ekleme modalı
async function openYeniPlakaGrubuModal() {
  if (!currentHammaddeId || !currentHammadde) {
    showToast('Lütfen önce bir hammadde seçin.', 'error');
    return;
  }
  
  console.log('🆕 Yeni plaka grubu modalı açılıyor...');
  
  // Modal durumunu tamamen sıfırla
  resetModalState();
  
  // Tedarikçileri yükle
  await loadTedarikciListesiForPlakaGrubu();
  
  // Modalı aç
  openModal('yeniPlakaGrubuModal');
  closeModal('detayModal');
  
  console.log('✅ Yeni plaka grubu modalı açıldı');
}

// Düzenleme modalı
async function openPlakaGrubuDuzenleModal(girisId, hammaddeId, toplamKilo) {
  try {
    console.log('✏️ Düzenleme modalı açılıyor...');
    
    // ÖNCE modal durumunu sıfırla
    resetModalState();
    
    // Giriş bilgilerini al
    const girisResult = await window.electronAPI.invoke.database.getHammaddeGirisById(girisId);
    if (!girisResult.success) {
      showToast('Giriş bilgileri alınamadı: ' + girisResult.message, 'error');
      return;
    }
    
    // Plaka grubunu al
    const plakaGrubuResult = await window.electronAPI.invoke.database.getPlakaGrubuByGirisId(girisId);
    if (!plakaGrubuResult.success) {
      showToast('Plaka grubu bulunamadı: ' + plakaGrubuResult.message, 'error');
      return;
    }
    
    // İşlem durumunu kontrol et
    const islemResult = await window.electronAPI.invoke.database.checkPlakaGrubuIslemDurumu(plakaGrubuResult.plakaGrubu.id);
    if (!islemResult.success) {
      showToast('İşlem durumu kontrol edilemedi: ' + islemResult.message, 'error');
      return;
    }
    
    // DÜZENLEME MODUNU AKTIF ET
    isEditMode = true;
    editingPlakaGrubuId = plakaGrubuResult.plakaGrubu.id;
    editingPlakaGrubu = plakaGrubuResult.plakaGrubu;
    currentHammaddeId = hammaddeId;
    
    console.log('🔄 Düzenleme modu aktif - ID:', editingPlakaGrubuId);
    
    // Modal başlığını değiştir
    document.querySelector('#yeniPlakaGrubuModal h2').textContent = 'Plaka Grubu Düzenle';
    
    // Durum panelini göster
    showPlakaGrubuDurumPaneli(plakaGrubuResult.plakaGrubu, islemResult);
    
    // Form alanlarını doldur
    fillPlakaGrubuEditForm(plakaGrubuResult.plakaGrubu, girisResult.giris);
    
    // Hesaplama butonunu gizle
    document.getElementById('hesaplaPlakaGrubuBtn').style.display = 'none';
    
    // Kaydet butonunu düzenleme moduna çevir
    const kaydetBtn = document.getElementById('plakaGrubuKaydetBtn');
    kaydetBtn.innerHTML = '<i class="fas fa-edit"></i> Değişiklikleri Kaydet';
    kaydetBtn.disabled = false;
    
    // Modalları yönet
    closeModal('detayModal');
    openModal('yeniPlakaGrubuModal');
    
    // Otomatik hesaplama
    calculatePlakaGrubuForEdit();
    
    console.log('✅ Düzenleme modalı açıldı');
    
  } catch (error) {
    console.error('❌ Düzenleme modalı hatası:', error);
    showToast('Düzenleme modalı açılırken hata oluştu: ' + error.message, 'error');
  }
}

// Durum panelini göster
function showPlakaGrubuDurumPaneli(plakaGrubu, islemDurumu) {
  let durumPaneli = document.getElementById('plakaGrubuDurumPaneli');
  
  if (!durumPaneli) {
    durumPaneli = document.createElement('div');
    durumPaneli.id = 'plakaGrubuDurumPaneli';
    durumPaneli.className = 'durum-paneli';
    
    const formDiv = document.querySelector('#yeniPlakaGrubuModal .yeni-plaka-form');
    formDiv.insertBefore(durumPaneli, formDiv.firstChild);
  }
  
  let panelHTML = `
    <h3><i class="fas fa-info-circle"></i> Mevcut Durum</h3>
    <div class="durum-grid">
      <div class="durum-item">
        <label>Stok Kodu:</label>
        <span>${plakaGrubu.stok_kodu}</span>
      </div>
      <div class="durum-item">
        <label>Toplam Plaka:</label>
        <span>${plakaGrubu.toplam_plaka_sayisi} adet</span>
      </div>
      <div class="durum-item">
        <label>Kalan Plaka:</label>
        <span class="${plakaGrubu.kalan_plaka_sayisi === 0 ? 'text-danger' : 'text-success'}">${plakaGrubu.kalan_plaka_sayisi} adet</span>
      </div>
      <div class="durum-item">
        <label>Kullanılan Plaka:</label>
        <span>${plakaGrubu.toplam_plaka_sayisi - plakaGrubu.kalan_plaka_sayisi} adet</span>
      </div>
      <div class="durum-item">
        <label>Toplam Kilo:</label>
        <span>${Number(plakaGrubu.toplam_kilo).toFixed(2)} kg</span>
      </div>
      <div class="durum-item">
        <label>Kalan Kilo:</label>
        <span class="${Number(plakaGrubu.kalan_kilo) <= 0 ? 'text-danger' : 'text-success'}">${Number(plakaGrubu.kalan_kilo).toFixed(2)} kg</span>
      </div>
    </div>
  `;
  
  if (islemDurumu.islemYapildi) {
    panelHTML += `
      <div class="uyari-mesaji warning">
        <i class="fas fa-exclamation-triangle"></i>
        <strong>Dikkat:</strong> Bu plaka grubundan ${islemDurumu.kullanilanPlakaSayisi} plaka kullanılmış.
      </div>
    `;
  } else {
    panelHTML += `
      <div class="bilgi-mesaji info">
        <i class="fas fa-info-circle"></i>
        Bu plaka grubundan henüz işlem yapılmamış. Tüm değerler güncellenebilir.
      </div>
    `;
  }
  
  durumPaneli.innerHTML = panelHTML;
}

// Form alanlarını doldur
function fillPlakaGrubuEditForm(plakaGrubu, giris) {
  document.getElementById('plakaGrubuEn').value = plakaGrubu.en;
  document.getElementById('plakaGrubuBoy').value = plakaGrubu.boy;
  document.getElementById('plakaGrubuToplamKilo').value = Number(plakaGrubu.toplam_kilo);
  document.getElementById('plakaGrubuTedarikci').value = giris.tedarikci || plakaGrubu.tedarikci;
  document.getElementById('plakaGrubuBirimFiyat').value = Number(giris.birim_fiyat || plakaGrubu.birim_fiyat);
  document.getElementById('plakaGrubuBirimFiyatTuru').value = giris.birim_fiyat_turu || plakaGrubu.birim_fiyat_turu || 'TRY';
  document.getElementById('plakaGrubuAnaBarkod').value = giris.ana_barkod || '';
  
  // Plaka sayısını readonly yap
  const plakaSayisiInput = document.getElementById('plakaGrubuPlakaSayisi');
  plakaSayisiInput.value = plakaGrubu.toplam_plaka_sayisi;
  plakaSayisiInput.readOnly = true;
}

// Düzenleme için hesaplama
function calculatePlakaGrubuForEdit() {
  try {
    const en = parseFloat(document.getElementById('plakaGrubuEn').value);
    const boy = parseFloat(document.getElementById('plakaGrubuBoy').value);
    const toplamKilo = parseFloat(document.getElementById('plakaGrubuToplamKilo').value);
    
    if (!currentHammadde || !currentHammadde.kalinlik || !currentHammadde.yogunluk) {
      showCalculationError('Hammadde bilgileri bulunamadı.');
      return;
    }
    
    const kalinlik = parseFloat(currentHammadde.kalinlik);
    const yogunluk = parseFloat(currentHammadde.yogunluk);
    
    if (!en || !boy || !toplamKilo) {
      showCalculationError('Lütfen tüm değerleri girin.');
      return;
    }
    
    // Hesaplamalar
    const hacim = (en / 1000) * (boy / 1000) * (kalinlik / 1000);
    const teorikPlakaAgirligi = hacim * yogunluk;
    const yeniPlakaSayisi = Math.round(toplamKilo / teorikPlakaAgirligi);
    
    document.getElementById('plakaGrubuPlakaSayisi').value = yeniPlakaSayisi;
    
    // Eski değerler
    const eskiPlakaSayisi = editingPlakaGrubu.toplam_plaka_sayisi;
    const eskiToplamKilo = Number(editingPlakaGrubu.toplam_kilo);
    const kullanilanPlakaSayisi = eskiPlakaSayisi - editingPlakaGrubu.kalan_plaka_sayisi;
    
    // Farklar
    const plakaSayisiFarki = yeniPlakaSayisi - eskiPlakaSayisi;
    const kiloFarki = toplamKilo - eskiToplamKilo;
    
    // Yeni kalan değerler
    const yeniKalanPlakaSayisi = yeniPlakaSayisi - kullanilanPlakaSayisi;
    const yeniKalanKilo = toplamKilo - (eskiToplamKilo - Number(editingPlakaGrubu.kalan_kilo));
    
    // Validasyon
    let hasError = false;
    let errorMessages = [];
    
    if (yeniPlakaSayisi < kullanilanPlakaSayisi) {
      hasError = true;
      errorMessages.push(`Yeni plaka sayısı (${yeniPlakaSayisi}) kullanılan plaka sayısından (${kullanilanPlakaSayisi}) az olamaz!`);
    }
    
    if (yeniKalanKilo < 0) {
      hasError = true;
      errorMessages.push(`Yeni kalan kilo negatif olamaz! (${yeniKalanKilo.toFixed(2)} kg)`);
    }
    
    // Sonuç göster
    showCalculationResults({
      yeniPlakaSayisi,
      eskiPlakaSayisi,
      plakaSayisiFarki,
      toplamKilo,
      eskiToplamKilo,
      kiloFarki,
      yeniKalanPlakaSayisi,
      yeniKalanKilo,
      kullanilanPlakaSayisi,
      errorMessages,
      hasError
    });
    
    // Kaydet butonu durumu
    document.getElementById('plakaGrubuKaydetBtn').disabled = hasError;
    
    // Hesaplama detaylarını sakla
    window.plakaGrubuHesaplamaDetaylari = {
      en, boy, kalinlik,
      plakaSayisi: yeniPlakaSayisi,
      plakaAgirligi: toplamKilo / yeniPlakaSayisi,
      toplamKilo,
      plakaSayisiFarki,
      kiloFarki,
      kullanilanPlakaSayisi,
      yeniKalanPlakaSayisi,
      yeniKalanKilo
    };
    
  } catch (error) {
    console.error('❌ Hesaplama hatası:', error);
    showCalculationError('Hesaplama hatası: ' + error.message);
  }
}

// Hesaplama sonuçlarını göster
function showCalculationResults(data) {
  const sonucHTML = `
    <div class="calculation-details">
      <h4>Hesaplama Sonucu</h4>
      <div class="detail-grid">
        <div class="detail-group">
          <h5>Plaka Sayısı</h5>
          <div class="detail-row">
            <span>Eski:</span>
            <span>${data.eskiPlakaSayisi} adet</span>
          </div>
          <div class="detail-row">
            <span>Yeni:</span>
            <span>${data.yeniPlakaSayisi} adet</span>
          </div>
          <div class="detail-row">
            <span>Fark:</span>
            <span class="${data.plakaSayisiFarki >= 0 ? 'text-success' : 'text-danger'}">
              ${data.plakaSayisiFarki >= 0 ? '+' : ''}${data.plakaSayisiFarki} adet
            </span>
          </div>
        </div>
        
        <div class="detail-group">
          <h5>Toplam Kilo</h5>
          <div class="detail-row">
            <span>Eski:</span>
            <span>${data.eskiToplamKilo.toFixed(2)} kg</span>
          </div>
          <div class="detail-row">
            <span>Yeni:</span>
            <span>${data.toplamKilo.toFixed(2)} kg</span>
          </div>
          <div class="detail-row">
            <span>Fark:</span>
            <span class="${data.kiloFarki >= 0 ? 'text-success' : 'text-danger'}">
              ${data.kiloFarki >= 0 ? '+' : ''}${data.kiloFarki.toFixed(2)} kg
            </span>
          </div>
        </div>
        
        <div class="detail-group">
          <h5>Kalan Değerler</h5>
          <div class="detail-row">
            <span>Yeni Kalan Plaka:</span>
            <span class="${data.yeniKalanPlakaSayisi >= 0 ? 'text-success' : 'text-danger'}">
              ${data.yeniKalanPlakaSayisi} adet
            </span>
          </div>
          <div class="detail-row">
            <span>Yeni Kalan Kilo:</span>
            <span class="${data.yeniKalanKilo >= 0 ? 'text-success' : 'text-danger'}">
              ${data.yeniKalanKilo.toFixed(2)} kg
            </span>
          </div>
        </div>
        
        <div class="detail-group">
          <h5>Kullanılan</h5>
          <div class="detail-row">
            <span>Kullanılan Plaka:</span>
            <span>${data.kullanilanPlakaSayisi} adet</span>
          </div>
        </div>
      </div>
      
      ${data.hasError ? `
        <div class="error-list">
          ${data.errorMessages.map(msg => `
            <div class="error">
              <i class="fas fa-exclamation-triangle"></i>
              ${msg}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
  
  document.getElementById('plakaGrubuHesapSonucu').innerHTML = sonucHTML;
  document.getElementById('plakaGrubuHesapSonucu').style.display = 'block';
}

// Hesaplama hata mesajı
function showCalculationError(message) {
  document.getElementById('plakaGrubuHesapSonucu').innerHTML = 
    `<div class="error">${message}</div>`;
  document.getElementById('plakaGrubuHesapSonucu').style.display = 'block';
  document.getElementById('plakaGrubuKaydetBtn').disabled = true;
}

// Normal kaydetme - DEĞİŞİKLİK YOK
async function savePlakaGrubu() {
  // Çift kaydetmeyi engelle
  if (isProcessingSave) {
    console.log('⚠️ savePlakaGrubu: İşlem zaten devam ediyor');
    return;
  }
  
  if (isEditMode) {
    console.error('❌ HATA: savePlakaGrubu düzenleme modunda çağrıldı!');
    showToast('Hata: Düzenleme modunda ekleme fonksiyonu çağrıldı!', 'error');
    return;
  }
  
  isProcessingSave = true;
  
  try {
    console.log('💾 Normal plaka grubu kaydediliyor...');
    
    if (!window.plakaGrubuHesaplamaDetaylari) {
      showModalError('yeniPlakaGrubuModal', 'Lütfen önce hesaplama yapın.');
      return;
    }
    
    // Form değerleri
    const plakaGrubuData = {
      hammadde_id: currentHammaddeId,
      en: parseFloat(document.getElementById('plakaGrubuEn').value),
      boy: parseFloat(document.getElementById('plakaGrubuBoy').value),
      plaka_sayisi: parseInt(document.getElementById('plakaGrubuPlakaSayisi').value),
      toplam_kilo: parseFloat(document.getElementById('plakaGrubuToplamKilo').value),
      tedarikci: document.getElementById('plakaGrubuTedarikci').value.trim(),
      birim_fiyat: parseFloat(document.getElementById('plakaGrubuBirimFiyat').value),
      birim_fiyat_turu: document.getElementById('plakaGrubuBirimFiyatTuru').value,
      ana_barkod: document.getElementById('plakaGrubuAnaBarkod').value.trim(),
      ekleyen_id: currentUser.id
    };
    
    // Validasyon
    if (!plakaGrubuData.tedarikci || !plakaGrubuData.birim_fiyat || plakaGrubuData.birim_fiyat <= 0) {
      showModalError('yeniPlakaGrubuModal', 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    
    showModalSuccess('yeniPlakaGrubuModal', 'Plaka grubu oluşturuluyor...');
    
    const result = await window.electronAPI.invoke.database.addPlakaGrubu(plakaGrubuData);
    
    if (result.success) {
      showToast(`Plaka grubu başarıyla eklendi. Stok Kodu: ${result.stokKodu}`, 'success');
      
      closeModal('yeniPlakaGrubuModal');
      resetModalState();
      
      // Güncellemeler
      updateDashboard();
      await loadHammaddeListesi();
      
      if (currentHammaddeId) {
        await viewHammaddeDetail(currentHammaddeId);
      }
    } else {
      showModalError('yeniPlakaGrubuModal', 'Hata: ' + result.message);
    }
    
  } catch (error) {
    console.error('❌ Normal kaydetme hatası:', error);
    showModalError('yeniPlakaGrubuModal', 'Plaka grubu eklenirken hata oluştu: ' + error.message);
  } finally {
    isProcessingSave = false;
  }
}

// Düzenleme kaydetme - GÜÇLENDIRILMIŞ
async function savePlakaGrubuEdit() {
  // Çift kaydetmeyi engelle
  if (isProcessingSave) {
    console.log('⚠️ savePlakaGrubuEdit: İşlem zaten devam ediyor');
    return;
  }
  
  if (!isEditMode) {
    console.error('❌ HATA: savePlakaGrubuEdit normal modda çağrıldı!');
    showToast('Hata: Normal modda düzenleme fonksiyonu çağrıldı!', 'error');
    return;
  }
  
  isProcessingSave = true;
  
  try {
    console.log('✏️ Plaka grubu düzenlemesi kaydediliyor...');
    
    if (!window.plakaGrubuHesaplamaDetaylari) {
      showModalError('yeniPlakaGrubuModal', 'Lütfen hesaplama yapın.');
      return;
    }
    
    // Update verisi
    const updateData = {
      plakaGrubuId: editingPlakaGrubuId,
      en: parseFloat(document.getElementById('plakaGrubuEn').value),
      boy: parseFloat(document.getElementById('plakaGrubuBoy').value),
      toplamKilo: parseFloat(document.getElementById('plakaGrubuToplamKilo').value),
      plakaSayisi: window.plakaGrubuHesaplamaDetaylari.plakaSayisi,
      tedarikci: document.getElementById('plakaGrubuTedarikci').value.trim(),
      birimFiyat: parseFloat(document.getElementById('plakaGrubuBirimFiyat').value),
      birimFiyatTuru: document.getElementById('plakaGrubuBirimFiyatTuru').value,
      kullaniciId: currentUser.id
    };
    
    // Validasyon
    if (!updateData.tedarikci || !updateData.birimFiyat || updateData.birimFiyat <= 0) {
      showModalError('yeniPlakaGrubuModal', 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    
    // Buton deaktif et
    const kaydetBtn = document.getElementById('plakaGrubuKaydetBtn');
    kaydetBtn.disabled = true;
    
    showModalSuccess('yeniPlakaGrubuModal', 'Güncelleniyor...');
    
    // Backend'e gönder
    const result = await window.electronAPI.invoke.database.updatePlakaGrubu(updateData);
    
    if (result.success) {
      showToast('Plaka grubu başarıyla güncellendi.', 'success');
      
      // Modal kapat ve state sıfırla
      closeModal('yeniPlakaGrubuModal');
      resetModalState();
      
      // Güncellemeler
      updateDashboard();
      await loadHammaddeListesi();
      
      if (currentHammaddeId) {
        await viewHammaddeDetail(currentHammaddeId);
      }
    } else {
      kaydetBtn.disabled = false;
      showModalError('yeniPlakaGrubuModal', 'Güncelleme hatası: ' + result.message);
    }
    
  } catch (error) {
    console.error('❌ Düzenleme kaydetme hatası:', error);
    const kaydetBtn = document.getElementById('plakaGrubuKaydetBtn');
    if (kaydetBtn) kaydetBtn.disabled = false;
    showModalError('yeniPlakaGrubuModal', 'Güncelleme sırasında hata oluştu: ' + error.message);
  } finally {
    isProcessingSave = false;
  }
}

// Event listener kurulumu - TEKİL OLARAK
function setupEditEventListeners() {
  console.log('🔧 Event listener\'lar kuruluyor...');
  
  // Form alanları için otomatik hesaplama (sadece edit modunda)
  ['plakaGrubuEn', 'plakaGrubuBoy', 'plakaGrubuToplamKilo'].forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      // Eski listener'ları temizle
      const newField = field.cloneNode(true);
      field.parentNode.replaceChild(newField, field);
      
      // Yeni listener ekle
      newField.addEventListener('input', function() {
        if (isEditMode) {
          calculatePlakaGrubuForEdit();
        }
      });
    }
  });
  
  // Modal kapatma olayları
  const modal = document.getElementById('yeniPlakaGrubuModal');
  if (modal) {
    // X butonu
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
      const newCloseBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
      
      newCloseBtn.addEventListener('click', function() {
        console.log('❌ Modal X butonu tıklandı');
        resetModalState();
      });
    }
  }
  
  console.log('✅ Event listener\'lar kuruldu');
}

// DOM hazır olduğunda
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 editSheetPlates.js DOM yüklendi');
  
  // Event listener'ları kur
  setupEditEventListeners();
  
  // Kaydet butonunu sıfırla
  resetSaveButton();
  
  // Yeni Plaka Grubu Ekle butonu
  const yeniPlakaGrubuEkleBtn = document.getElementById('yeniPlakaGrubuEkleBtn');
  if (yeniPlakaGrubuEkleBtn) {
    const newBtn = yeniPlakaGrubuEkleBtn.cloneNode(true);
    yeniPlakaGrubuEkleBtn.parentNode.replaceChild(newBtn, yeniPlakaGrubuEkleBtn);
    newBtn.addEventListener('click', openYeniPlakaGrubuModal);
  }
  
  // Hesaplama butonu
  const hesaplaBtn = document.getElementById('hesaplaPlakaGrubuBtn');
  if (hesaplaBtn) {
    const newHesaplaBtn = hesaplaBtn.cloneNode(true);
    hesaplaBtn.parentNode.replaceChild(newHesaplaBtn, hesaplaBtn);
    newHesaplaBtn.addEventListener('click', calculatePlakaGrubu);
  }
});

// Plaka Grubu modalını sıfırla
function resetPlakaGrubuModal() {
  // Form alanlarını temizle
  document.getElementById('plakaGrubuEn').value = '';
  document.getElementById('plakaGrubuBoy').value = '';
  document.getElementById('plakaGrubuPlakaSayisi').value = '';
  document.getElementById('plakaGrubuToplamKilo').value = '';
  document.getElementById('plakaGrubuTedarikci').value = '';
  document.getElementById('plakaGrubuBirimFiyat').value = '';
  document.getElementById('plakaGrubuAnaBarkod').value = '';
  
  // Plaka sayısını normal moda döndür
  const plakaSayisiInput = document.getElementById('plakaGrubuPlakaSayisi');
  if (plakaSayisiInput) {
    plakaSayisiInput.readOnly = false;
    plakaSayisiInput.style.backgroundColor = '';
    plakaSayisiInput.style.color = '';
  }
  
  // Hesaplama sonucunu gizle
  const hesapSonucu = document.getElementById('plakaGrubuHesapSonucu');
  if (hesapSonucu) {
    hesapSonucu.style.display = 'none';
    hesapSonucu.innerHTML = '';
  }
}

// Normal hesaplama fonksiyonu (ekleme modu için)
function calculatePlakaGrubu() {
  try {
    const en = parseFloat(document.getElementById('plakaGrubuEn').value);
    const boy = parseFloat(document.getElementById('plakaGrubuBoy').value);
    const toplamKilo = parseFloat(document.getElementById('plakaGrubuToplamKilo').value);
    
    if (!currentHammadde || !currentHammadde.kalinlik || !currentHammadde.yogunluk) {
      showCalculationError('Hammadde bilgileri bulunamadı. Lütfen hammadde seçtiğinizden emin olun.');
      return;
    }
    
    const kalinlik = parseFloat(currentHammadde.kalinlik);
    const yogunluk = parseFloat(currentHammadde.yogunluk);
    
    if (!en || !boy || !toplamKilo || toplamKilo <= 0) {
      showCalculationError('Lütfen geçerli en, boy ve toplam kilo değerleri girin.');
      return;
    }
    
    // Tek plaka ağırlığı hesapla
    const hacim = (en / 1000) * (boy / 1000) * (kalinlik / 1000);
    const teorikPlakaAgirligi = hacim * yogunluk;
    
    // Plaka sayısını otomatik hesapla
    let plakaSayisi = Math.round(toplamKilo / teorikPlakaAgirligi);
    if (plakaSayisi < 1) plakaSayisi = 1;
    
    // Hesaplanan plaka sayısını form alanına yaz
    document.getElementById('plakaGrubuPlakaSayisi').value = plakaSayisi;
    
    // Toplam teorik ağırlık
    const teorikToplamAgirlik = teorikPlakaAgirligi * plakaSayisi;
    
    // Gerçek plaka ağırlığı
    const gercekPlakaAgirligi = toplamKilo / plakaSayisi;
    
    // Fark hesapla
    const farkYuzde = ((toplamKilo - teorikToplamAgirlik) / teorikToplamAgirlik) * 100;
    
    // Hata kontrolü
    let hesaplamaDurumu = '';
    let kaydetButonuAktif = true;
    
    if (Math.abs(farkYuzde) > 10) {
      hesaplamaDurumu = '<div class="error">⚠️ Hesaplama uyarısı: Teorik ağırlık ile girilen ağırlık arasında %10\'dan fazla fark var.</div>';
      kaydetButonuAktif = false;
    } else if (Math.abs(farkYuzde) > 5) {
      hesaplamaDurumu = '<div class="warning">⚠️ Dikkat: Teorik ağırlık ile girilen ağırlık arasında %5\'ten fazla fark var.</div>';
    } else {
      hesaplamaDurumu = '<div class="success">✅ Hesaplama başarılı! Değerler uygun.</div>';
    }
    
    // Sonuçları göster
    const sonucHTML = `
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
          <span>Fark:</span>
          <span class="${Math.abs(farkYuzde) > 5 ? 'error-text' : 'success-text'}">${farkYuzde.toFixed(2)}%</span>
        </div>
      </div>
    `;
    
    document.getElementById('plakaGrubuHesapSonucu').innerHTML = sonucHTML;
    document.getElementById('plakaGrubuHesapSonucu').style.display = 'block';
    
    // Kaydet butonu durumu
    document.getElementById('plakaGrubuKaydetBtn').disabled = !kaydetButonuAktif;
    
    // Hesaplama detaylarını sakla
    window.plakaGrubuHesaplamaDetaylari = {
      en, boy, kalinlik,
      plakaSayisi,
      plakaAgirligi: gercekPlakaAgirligi,
      toplamKilo,
      teorikToplamAgirlik,
      farkYuzde
    };
    
    return { plakaSayisi, plakaAgirligi: gercekPlakaAgirligi, toplamKilo };
    
  } catch (error) {
    console.error('❌ Normal hesaplama hatası:', error);
    showCalculationError('Hesaplama sırasında hata oluştu: ' + error.message);
    return null;
  }
}

// CSS Stilleri
const editModalStyles = `
.durum-paneli {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.durum-paneli h3 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 16px;
}

.durum-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.durum-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.durum-item label {
  font-weight: 500;
  color: #6c757d;
}

.durum-item span {
  font-weight: 600;
}

.text-success { color: #28a745 !important; }
.text-danger { color: #dc3545 !important; }

.uyari-mesaji, .bilgi-mesaji {
  margin-top: 15px;
  padding: 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.uyari-mesaji.warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
}

.bilgi-mesaji.info {
  background: #d1ecf1;
  border: 1px solid #b6d4da;
  color: #0c5460;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 15px;
}

.detail-group {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.detail-group h5 {
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #e9ecef;
}

.detail-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.detail-row.highlight {
  background: #e8f5e8;
  padding: 8px;
  border-radius: 4px;
  font-weight: 600;
}

.error-list {
  margin-top: 15px;
}

.error-list .error {
  margin-bottom: 10px;
  color: #dc3545;
  font-weight: 500;
}

@media (max-width: 768px) {
  .detail-grid, .durum-grid {
    grid-template-columns: 1fr;
  }
}
`;

// Stilleri ekle
if (!document.getElementById('edit-modal-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'edit-modal-styles';
  styleElement.textContent = editModalStyles;
  document.head.appendChild(styleElement);
}

// Global fonksiyonları dışa aktar
window.openPlakaGrubuDuzenleModal = openPlakaGrubuDuzenleModal;
window.openYeniPlakaGrubuModal = openYeniPlakaGrubuModal;
window.resetModalState = resetModalState;
window.savePlakaGrubuEdit = savePlakaGrubuEdit;

// Orijinal savePlakaGrubu fonksiyonunu sakla
window.originalSavePlakaGrubu = savePlakaGrubu;

console.log('✅ editSheetPlates.js yüklendi');