// Global değişkenler
let editingPlakaGrubuId = null;
let editingPlakaGrubu = null;
let isEditMode = false;

// Plaka grubu düzenleme modalını aç

async function openPlakaGrubuDuzenleModal(girisId, hammaddeId, toplamKilo) {
  try {
    // Giriş geçmişi verisini al
    const girisResult = await window.electronAPI.invoke.database.getHammaddeGirisById(girisId);
    
    if (!girisResult.success) {
      showToast('Giriş bilgileri alınamadı: ' + girisResult.message, 'error');
      return;
    }
    
    const giris = girisResult.giris;
    
    // Bu girişe ait plaka grubunu bul
    const plakaGrubuResult = await window.electronAPI.invoke.database.getPlakaGrubuByGirisId(girisId);
    
    if (!plakaGrubuResult.success) {
      showToast('Plaka grubu bulunamadı: ' + plakaGrubuResult.message, 'error');
      return;
    }
    
    const plakaGrubu = plakaGrubuResult.plakaGrubu;
    
    // Plaka grubundan işlem yapılmış mı kontrol et
    const islemResult = await window.electronAPI.invoke.database.checkPlakaGrubuIslemDurumu(plakaGrubu.id);
    
    if (!islemResult.success) {
      showToast('İşlem durumu kontrol edilemedi: ' + islemResult.message, 'error');
      return;
    }
    
    // Global değişkenleri ayarla
    editingPlakaGrubuId = plakaGrubu.id;
    editingPlakaGrubu = plakaGrubu;
    isEditMode = true;
    currentHammaddeId = hammaddeId;
    
    // Modal başlığını değiştir
    document.querySelector('#yeniPlakaGrubuModal h2').textContent = 'Plaka Grubu Düzenle';
    
    // Durum panelini göster/oluştur
    showPlakaGrubuDurumPaneli(plakaGrubu, islemResult);
    
    // Form alanlarını doldur
    fillPlakaGrubuEditForm(plakaGrubu, giris);
    
    // Hesaplama butonunu gizle (düzenleme modunda otomatik hesaplama)
    document.getElementById('hesaplaPlakaGrubuBtn').style.display = 'none';
    
    // Detay modalını kapat
    closeModal('detayModal');
    
    // Düzenleme modalını aç
    openModal('yeniPlakaGrubuModal');
    
    // Otomatik hesaplama yap
    calculatePlakaGrubuForEdit();
    
  } catch (error) {
    console.error('Plaka grubu düzenleme modalı açma hatası:', error);
    showToast('Düzenleme modalı açılırken hata oluştu: ' + error.message, 'error');
  }
}

// Durum panelini göster
function showPlakaGrubuDurumPaneli(plakaGrubu, islemDurumu) {
  // Mevcut durum panelini kontrol et
  let durumPaneli = document.getElementById('plakaGrubuDurumPaneli');
  
  if (!durumPaneli) {
    // Panel yoksa oluştur
    durumPaneli = document.createElement('div');
    durumPaneli.id = 'plakaGrubuDurumPaneli';
    durumPaneli.className = 'durum-paneli';
    
    // Formu içeren div'in başına ekle
    const formDiv = document.querySelector('#yeniPlakaGrubuModal .yeni-plaka-form');
    formDiv.insertBefore(durumPaneli, formDiv.firstChild);
  }
  
  // Panel içeriğini oluştur
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
  
  // İşlem yapılmış mı kontrol et
  if (islemDurumu.islemYapildi) {
    panelHTML += `
      <div class="uyari-mesaji warning">
        <i class="fas fa-exclamation-triangle"></i>
        <strong>Dikkat:</strong> Bu plaka grubundan ${islemDurumu.kullanilanPlakaSayisi} plaka kullanılmış. 
        Sadece kalan ${plakaGrubu.kalan_plaka_sayisi} plaka için değişiklik yapabilirsiniz.
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
  
  // Plaka sayısını readonly yap (hesaplanacak)
  const plakaSayisiInput = document.getElementById('plakaGrubuPlakaSayisi');
  plakaSayisiInput.value = plakaGrubu.toplam_plaka_sayisi;
  plakaSayisiInput.readOnly = true;
  
  // Kaydet butonunun event'ini düzenleme moduna ayarla
  const kaydetBtn = document.getElementById('plakaGrubuKaydetBtn');
  
  // Mevcut event listener'ları kaldır
  const newKaydetBtn = kaydetBtn.cloneNode(true);
  kaydetBtn.parentNode.replaceChild(newKaydetBtn, kaydetBtn);
  
  // Düzenleme event'ini ekle
  newKaydetBtn.addEventListener('click', savePlakaGrubuEdit);
  
  // Buton metnini değiştir
  newKaydetBtn.innerHTML = '<i class="fas fa-edit"></i> Değişiklikleri Kaydet';
  newKaydetBtn.disabled = false;
}

// Düzenleme için hesaplama
function calculatePlakaGrubuForEdit() {
  try {
    const en = parseFloat(document.getElementById('plakaGrubuEn').value);
    const boy = parseFloat(document.getElementById('plakaGrubuBoy').value);
    const toplamKilo = parseFloat(document.getElementById('plakaGrubuToplamKilo').value);
    
    if (!currentHammadde || !currentHammadde.kalinlik || !currentHammadde.yogunluk) {
      document.getElementById('plakaGrubuHesapSonucu').innerHTML = 
        '<div class="error">Hammadde bilgileri bulunamadı.</div>';
      document.getElementById('plakaGrubuHesapSonucu').style.display = 'block';
      return;
    }
    
    const kalinlik = parseFloat(currentHammadde.kalinlik);
    const yogunluk = parseFloat(currentHammadde.yogunluk);
    
    if (!en || !boy || !toplamKilo) {
      document.getElementById('plakaGrubuHesapSonucu').innerHTML = 
        '<div class="error">Lütfen tüm değerleri girin.</div>';
      document.getElementById('plakaGrubuHesapSonucu').style.display = 'block';
      return;
    }
    
    // Tek plaka ağırlığı hesapla
    const hacim = (en / 1000) * (boy / 1000) * (kalinlik / 1000);
    const teorikPlakaAgirligi = hacim * yogunluk;
    
    // Yeni plaka sayısını hesapla
    const yeniPlakaSayisi = Math.round(toplamKilo / teorikPlakaAgirligi);
    
    // Plaka sayısını güncelle
    document.getElementById('plakaGrubuPlakaSayisi').value = yeniPlakaSayisi;
    
    // Eski değerleri al
    const eskiPlakaSayisi = editingPlakaGrubu.toplam_plaka_sayisi;
    const eskiToplamKilo = Number(editingPlakaGrubu.toplam_kilo);
    const eskiKalanPlakaSayisi = editingPlakaGrubu.kalan_plaka_sayisi;
    const eskiKalanKilo = Number(editingPlakaGrubu.kalan_kilo);
    
    // Farkları hesapla
    const plakaSayisiFarki = yeniPlakaSayisi - eskiPlakaSayisi;
    const kiloFarki = toplamKilo - eskiToplamKilo;
    
    // Kullanılan plaka sayısını hesapla
    const kullanilanPlakaSayisi = eskiPlakaSayisi - eskiKalanPlakaSayisi;
    const kullanilanKilo = eskiToplamKilo - eskiKalanKilo;
    
    // Yeni kalan değerleri hesapla
    const yeniKalanPlakaSayisi = yeniPlakaSayisi - kullanilanPlakaSayisi;
    const yeniKalanKilo = toplamKilo - kullanilanKilo;
    
    // Sonuçları göster
    let sonucHTML = `
      <div class="calculation-details">
        <h4>Hesaplama Sonucu</h4>
        <div class="detail-grid">
          <div class="detail-group">
            <h5>Plaka Sayısı</h5>
            <div class="detail-row">
              <span>Eski:</span>
              <span>${eskiPlakaSayisi} adet</span>
            </div>
            <div class="detail-row">
              <span>Yeni:</span>
              <span>${yeniPlakaSayisi} adet</span>
            </div>
            <div class="detail-row">
              <span>Fark:</span>
              <span class="${plakaSayisiFarki >= 0 ? 'text-success' : 'text-danger'}">
                ${plakaSayisiFarki >= 0 ? '+' : ''}${plakaSayisiFarki} adet
              </span>
            </div>
          </div>
          
          <div class="detail-group">
            <h5>Toplam Kilo</h5>
            <div class="detail-row">
              <span>Eski:</span>
              <span>${eskiToplamKilo.toFixed(2)} kg</span>
            </div>
            <div class="detail-row">
              <span>Yeni:</span>
              <span>${toplamKilo.toFixed(2)} kg</span>
            </div>
            <div class="detail-row">
              <span>Fark:</span>
              <span class="${kiloFarki >= 0 ? 'text-success' : 'text-danger'}">
                ${kiloFarki >= 0 ? '+' : ''}${kiloFarki.toFixed(2)} kg
              </span>
            </div>
          </div>
          
          <div class="detail-group">
            <h5>Kalan Değerler</h5>
            <div class="detail-row">
              <span>Kalan Plaka:</span>
              <span class="${yeniKalanPlakaSayisi >= 0 ? 'text-success' : 'text-danger'}">
                ${eskiKalanPlakaSayisi} → ${yeniKalanPlakaSayisi} adet
              </span>
            </div>
            <div class="detail-row">
              <span>Kalan Kilo:</span>
              <span class="${yeniKalanKilo >= 0 ? 'text-success' : 'text-danger'}">
                ${eskiKalanKilo.toFixed(2)} → ${yeniKalanKilo.toFixed(2)} kg
              </span>
            </div>
          </div>
          
          <div class="detail-group">
            <h5>Kullanılan Değerler</h5>
            <div class="detail-row">
              <span>Kullanılan Plaka:</span>
              <span>${kullanilanPlakaSayisi} adet</span>
            </div>
            <div class="detail-row">
              <span>Kullanılan Kilo:</span>
              <span>${kullanilanKilo.toFixed(2)} kg</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Kontrolller
    let hasError = false;
    let errorMessages = [];
    
    // Yeni plaka sayısı kullanılan plaka sayısından az olamaz
    if (yeniPlakaSayisi < kullanilanPlakaSayisi) {
      hasError = true;
      errorMessages.push(`Yeni plaka sayısı (${yeniPlakaSayisi}) kullanılan plaka sayısından (${kullanilanPlakaSayisi}) az olamaz!`);
    }
    
    // Yeni kalan kilo negatif olamaz
    if (yeniKalanKilo < 0) {
      hasError = true;
      errorMessages.push(`Yeni kalan kilo negatif olamaz! (${yeniKalanKilo.toFixed(2)} kg)`);
    }
    
    if (hasError) {
      sonucHTML += `
        <div class="error-list">
          ${errorMessages.map(msg => `
            <div class="error">
              <i class="fas fa-exclamation-triangle"></i>
              ${msg}
            </div>
          `).join('')}
        </div>
      `;
      document.getElementById('plakaGrubuKaydetBtn').disabled = true;
    } else {
      document.getElementById('plakaGrubuKaydetBtn').disabled = false;
    }
    
    document.getElementById('plakaGrubuHesapSonucu').innerHTML = sonucHTML;
    document.getElementById('plakaGrubuHesapSonucu').style.display = 'block';
    
    // Global değişkende saklayalım
    window.plakaGrubuHesaplamaDetaylari = {
      en, boy, kalinlik,
      plakaSayisi: yeniPlakaSayisi,
      plakaAgirligi: toplamKilo / yeniPlakaSayisi,
      toplamKilo,
      plakaSayisiFarki,
      kiloFarki,
      kullanilanPlakaSayisi,
      kullanilanKilo,
      yeniKalanPlakaSayisi,
      yeniKalanKilo
    };
    
  } catch (error) {
    console.error('Düzenleme hesaplama hatası:', error);
    document.getElementById('plakaGrubuHesapSonucu').innerHTML = 
      `<div class="error">Hesaplama hatası: ${error.message}</div>`;
    document.getElementById('plakaGrubuHesapSonucu').style.display = 'block';
  }
}

// CSS stilleri - detay grid için
const detailGridStyles = `
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
  letter-spacing: 0.5px;
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

.detail-row span:first-child {
  font-weight: 500;
  color: #6c757d;
}

.detail-row span:last-child {
  font-weight: 600;
}

.error-list {
  margin-top: 15px;
}

.error-list .error {
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
`;

// Stilleri ekle
if (!document.getElementById('detail-grid-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'detail-grid-styles';
  styleElement.textContent = detailGridStyles;
  document.head.appendChild(styleElement);
}

// Düzenleme kaydetme fonksiyonu
async function savePlakaGrubuEdit() {
  try {
    if (!window.plakaGrubuHesaplamaDetaylari) {
      showModalError('yeniPlakaGrubuModal', 'Lütfen hesaplama yapın.');
      return;
    }
    
    // Form değerlerini al
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
    
    showModalSuccess('yeniPlakaGrubuModal', 'Güncelleniyor...');
    
    // Backend'e gönder
    const result = await window.electronAPI.invoke.database.updatePlakaGrubu(updateData);
    
    if (result.success) {
      showToast('Plaka grubu başarıyla güncellendi.', 'success');
      
      // Modalı kapat ve sıfırla
      resetModalToNormalMode();
      closeModal('yeniPlakaGrubuModal');
      
      // Listeleri güncelle
      updateDashboard();
      await loadHammaddeListesi();
      
      if (currentHammaddeId) {
        await viewHammaddeDetail(currentHammaddeId);
      }
    } else {
      showModalError('yeniPlakaGrubuModal', 'Güncelleme hatası: ' + result.message);
    }
    
  } catch (error) {
    console.error('Plaka grubu güncelleme hatası:', error);
    showModalError('yeniPlakaGrubuModal', 'Güncelleme sırasında hata oluştu: ' + error.message);
  }
}

// Modalı normal moda döndür
function resetModalToNormalMode() {
  // Global değişkenleri sıfırla
  editingPlakaGrubuId = null;
  editingPlakaGrubu = null;
  isEditMode = false;
  
  // Modal başlığını değiştir
  document.querySelector('#yeniPlakaGrubuModal h2').textContent = 'Yeni Plaka Grubu Ekle';
  
  // Durum panelini kaldır
  const durumPaneli = document.getElementById('plakaGrubuDurumPaneli');
  if (durumPaneli) {
    durumPaneli.remove();
  }
  
  // Kaydet butonunu normale döndür - ÖNEMLİ: onclick event'ini de değiştir
  const kaydetBtn = document.getElementById('plakaGrubuKaydetBtn');
  kaydetBtn.innerHTML = '<i class="fas fa-save"></i> Plaka Grubunu Kaydet';
  kaydetBtn.disabled = true;
  
  // Event listener'ı sıfırla - eski event'leri kaldır
  const newKaydetBtn = kaydetBtn.cloneNode(true);
  kaydetBtn.parentNode.replaceChild(newKaydetBtn, kaydetBtn);
  
  // Normal kaydetme event'ini ekle
  newKaydetBtn.addEventListener('click', function() {
    if (isEditMode) {
      savePlakaGrubuEdit();
    } else {
      savePlakaGrubu();
    }
  });
  
  // Hesaplama butonunu göster
  document.getElementById('hesaplaPlakaGrubuBtn').style.display = 'inline-block';
  
  // Formu sıfırla
  resetPlakaGrubuModal();
  
  // Hesaplama detaylarını temizle
  window.plakaGrubuHesaplamaDetaylari = null;
}



// DOM yüklendiğinde event listener'ları düzelt
document.addEventListener('DOMContentLoaded', function() {
  // Plaka Grubu Kaydet butonu için event listener
  const plakaGrubuKaydetBtn = document.getElementById('plakaGrubuKaydetBtn');
  if (plakaGrubuKaydetBtn) {
    plakaGrubuKaydetBtn.addEventListener('click', function() {
      console.log('Kaydet butonuna tıklandı, isEditMode:', isEditMode);
      if (isEditMode) {
        console.log('Düzenleme modu - savePlakaGrubuEdit çağrılıyor');
        savePlakaGrubuEdit();
      } else {
        console.log('Normal mod - savePlakaGrubu çağrılıyor');
        savePlakaGrubu();
      }
    });
  }
  
  // Modal kapatma olaylarını dinle
  const modal = document.getElementById('yeniPlakaGrubuModal');
  if (modal) {
    // X butonuna tıklandığında
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        if (isEditMode) {
          resetModalToNormalMode();
        }
      });
    }
    
    // Modal dışına tıklandığında
    window.addEventListener('click', function(event) {
      if (event.target === modal && isEditMode) {
        resetModalToNormalMode();
      }
    });
  }
  
  // Form alanları değiştiğinde otomatik hesaplama (sadece edit modunda)
  ['plakaGrubuEn', 'plakaGrubuBoy', 'plakaGrubuToplamKilo'].forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('input', function() {
        if (isEditMode) {
          calculatePlakaGrubuForEdit();
        }
      });
    }
  });
});


// Mevcut savePlakaGrubu fonksiyonunu güncelle
const originalSavePlakaGrubu = window.savePlakaGrubu;
window.savePlakaGrubu = function() {
  console.log('savePlakaGrubu çağrıldı, isEditMode:', isEditMode);
  if (isEditMode) {
    console.log('Edit modunda - savePlakaGrubuEdit çağrılıyor');
    savePlakaGrubuEdit();
  } else {
    console.log('Normal modda - originalSavePlakaGrubu çağrılıyor');
    originalSavePlakaGrubu();
  }
};

// Form alanları değiştiğinde otomatik hesaplama (sadece edit modunda)
document.addEventListener('DOMContentLoaded', function() {
  ['plakaGrubuEn', 'plakaGrubuBoy', 'plakaGrubuToplamKilo'].forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('input', function() {
        if (isEditMode) {
          calculatePlakaGrubuForEdit();
        }
      });
    }
  });
});

// CSS stilleri ekle
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
`;

// Stilleri ekle
if (!document.getElementById('edit-modal-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'edit-modal-styles';
  styleElement.textContent = editModalStyles;
  document.head.appendChild(styleElement);
}




// Fonksiyonları global yap
window.openPlakaGrubuDuzenleModal = openPlakaGrubuDuzenleModal;
window.resetModalToNormalMode = resetModalToNormalMode;