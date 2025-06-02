// Sarf malzeme fotoğraf cache sistemi
const sarfMalzemePhotoCache = new Map();

// Sarf malzeme fotoğraf lazy loading
async function loadSarfMalzemePhotoOnDemand(sarfMalzemeId) {
  // Cache kontrolü
  if (sarfMalzemePhotoCache.has(sarfMalzemeId)) {
    return sarfMalzemePhotoCache.get(sarfMalzemeId);
  }
  
  try {
    const result = await window.electronAPI.invoke.database.getSarfMalzemeFotograf(sarfMalzemeId);
    
    if (result.success && result.fotograf) {
      const imgSrc = result.fotograf.startsWith('data:image') ? 
        result.fotograf : 
        `data:image/jpeg;base64,${result.fotograf}`;
      
      // Cache'e kaydet
      sarfMalzemePhotoCache.set(sarfMalzemeId, imgSrc);
      return imgSrc;
    }
    
    return null;
  } catch (error) {
    console.error('Sarf malzeme fotoğraf yükleme hatası:', error);
    return null;
  }
}


async function loadSarfMalzemeListesi() {
    try {
        console.log('Sarf malzeme listesi yükleniyor...');
        
        // Sayfa elementini kontrol et
        const sarfMalzemeListesi = document.getElementById('sarf-malzeme-listesi');
        if (!sarfMalzemeListesi) {
            console.error('Sarf malzeme listesi sayfası elementi bulunamadı!');
            return;
        }
        
        const sarfMalzemeTable = document.getElementById('sarfMalzemeTable');
        if (!sarfMalzemeTable) {
            console.error('sarfMalzemeTable elementi bulunamadı!');
            return;
        }
        
        const tableBody = sarfMalzemeTable.getElementsByTagName('tbody')[0];
        if (!tableBody) {
            console.error('sarfMalzemeTable tbody elementi bulunamadı!');
            return;
        }
        
        // Önce loading göster
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Yükleniyor...</td></tr>';
        
        // API kontrolü
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Veri yüklenemedi. API erişimi yok.</td></tr>';
            return;
        }

        // Kullanıcı yetki kontrolünü önceden yap
        const isUserAdmin = window.globalUserData && window.globalUserData.rol === 'yonetici';

        // Sarf malzeme verilerini al
        const result = await window.electronAPI.invoke.database.getAllSarfMalzeme();
        console.log('getAllSarfMalzeme sonucu:', result);
        
        if (!result.success) {
            console.error('Sarf malzeme verisi alınamadı:', result.message);
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center">Veri alınamadı: ${result.message}</td></tr>`;
            return;
        }
        
        if (!result.sarfMalzemeler || result.sarfMalzemeler.length === 0) {
            console.log('Sarf malzeme bulunamadı');
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Sarf malzeme kaydı bulunamadı</td></tr>';
            return;
        }
        
        console.log('Sarf malzeme sayısı:', result.sarfMalzemeler.length);
        
        // Performans için: Tüm HTML'i bir seferde oluştur
        const rowsHTML = result.sarfMalzemeler.map(malzeme => {
            // Durum hesaplama
            let durumText = '';
            let durumClass = '';
            
            switch (malzeme.durum) {
                case 'STOKTA_YOK':
                    durumText = 'Stokta Yok';
                    durumClass = 'stokta-yok';
                    break;
                case 'AZ_KALDI':
                    durumText = 'Az Kaldı';
                    durumClass = 'az-kaldi';
                    break;
                default:
                    durumText = 'Stokta Var';
                    durumClass = 'stokta-var';
            }
            
            // Fotoğraf butonu optimizasyonu
            const photoButtonStyle = malzeme.has_photo ? 
              'background-color: #28a745; border: 1px solid #1e7e34;' : 
              'background-color: #607D8B; border: 1px solid #455A64;';
            
            const photoIcon = malzeme.has_photo ? 'fas fa-image' : 'fas fa-camera';
            const photoTitle = malzeme.has_photo ? 'Fotoğraf mevcut - görüntülemek için tıklayın' : 'Fotoğraf yok - eklemek için tıklayın';
            
            // İşlemler HTML'ini basitleştir
            let islemlerHtml = `<div class="action-buttons">
                <button class="action-btn view" onclick="viewSarfMalzemeDetail(${malzeme.id})" title="Görüntüle">
                    <i class="fas fa-eye"></i>
                </button>`;

            // Çıkış işlemi butonu
            if (isUserAdmin) {
                islemlerHtml += `
                    <button class="action-btn edit" onclick="openSarfMalzemeIslemModal(${malzeme.id})" title="Çıkış İşlemi">
                        <i class="fa-solid fa-right-from-bracket" style="color: #f29121;"></i>
                    </button>`;
            } else {
                islemlerHtml += `
                    <button class="action-btn edit disabled" disabled title="Bu işlem için yönetici yetkisi gereklidir">
                        <i class="fa-solid fa-right-from-bracket" style="color: #ccc;"></i>
                    </button>`;
            }

            // Fotoğraf butonu
            islemlerHtml += `
                <button class="action-btn photo" onclick="handleSarfMalzemeFoto(${malzeme.id})" 
                        style="${photoButtonStyle} box-shadow: 0 2px 4px rgba(0,0,0,0.15);"
                        title="${photoTitle}">
                    <i class="${photoIcon}" style="color: white; font-size: 14px;"></i>
                </button>`;

            // Silme butonu
            if (isUserAdmin) {
                islemlerHtml += `
                    <button class="action-btn delete" onclick="deleteSarfMalzeme(${malzeme.id})" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>`;
            } else {
                islemlerHtml += `
                    <button class="action-btn delete disabled" disabled title="Bu işlem için yönetici yetkisi gereklidir">
                        <i class="fas fa-trash" style="color: #ccc;"></i>
                    </button>`;
            }

            islemlerHtml += `</div>`;
            
            return `
                <tr data-ekleme-tarihi="${malzeme.ekleme_tarihi}">
                    <td>${malzeme.stok_kodu}</td>
                    <td>${malzeme.malzeme_adi}</td>
                    <td>${Number(malzeme.kalan_miktar).toFixed(2)} ${malzeme.birim}</td>
                    <td>${malzeme.barkod}</td>
                    <td style="vertical-align: middle;"><span class="${durumClass}">${durumText}</span></td>
                    <td>${islemlerHtml}</td>
                </tr>
            `;
        }).join('');
        
        // Tek seferde tüm HTML'i ekle (çok daha hızlı)
        tableBody.innerHTML = rowsHTML;
        
        console.log('Sarf malzeme listesi yüklendi!');
        
        // Sayfa geçişini optimize et
        requestAnimationFrame(() => {
            // Navigation update
            const navLinks = document.querySelectorAll('.nav-links li a');
            navLinks.forEach(l => l.parentElement.classList.remove('active'));
            
            const sarfMalzemeLink = document.querySelector('a[data-page="sarf-malzeme-listesi"]');
            if (sarfMalzemeLink) {
                sarfMalzemeLink.parentElement.classList.add('active');
            }
            
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            sarfMalzemeListesi.classList.add('active');
        });

        // FOTOĞRAF ÖN YÜKLEME TAMAMEN KALDIRILDI!
        // Bu satırları kaldırdık çünkü performansı düşürüyor:
        // setTimeout(() => {
        //     const visibleIds = result.sarfMalzemeler.slice(0, 10).map(item => item.id);
        //     if (visibleIds.length > 0) {
        //         preloadSarfMalzemePhotosInBackground(visibleIds);
        //     }
        // }, 1000);
        
    } catch (error) {
        console.error('Sarf malzeme listesi yükleme hatası:', error);
        
        const sarfMalzemeTable = document.getElementById('sarfMalzemeTable');
        if (sarfMalzemeTable) {
            const tableBody = sarfMalzemeTable.getElementsByTagName('tbody')[0];
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Veri yüklenirken beklenmedik bir hata oluştu</td></tr>';
            }
        }
    }
}

// Sarf malzeme fotoğraf modal fonksiyonu
let currentPhotoSarfMalzemeId = null;

async function handleSarfMalzemeFoto(sarfMalzemeId) {
  try {
    currentPhotoSarfMalzemeId = sarfMalzemeId;
    
    // Kullanıcı yetki kontrolü
    const isUserAdmin = window.globalUserData && window.globalUserData.rol === 'yonetici';
    
    // Sarf malzeme bilgilerini al (fotoğraf olmadan)
    const result = await window.electronAPI.invoke.database.getSarfMalzemeById(sarfMalzemeId);
    
    if (!result.success) {
      console.error('Sarf malzeme bilgileri alınamadı:', result.message);
      showErrorMessage('Hata', 'Sarf malzeme bilgileri alınamadı: ' + result.message);
      return;
    }
    
    const sarfMalzeme = result.sarfMalzeme;
    
    // Modal başlığını güncelle
    document.getElementById('sarfMalzemeFotoHeader').textContent = `${sarfMalzeme.malzeme_adi}`;
    
    // Raf bilgisini göster
    updateSarfMalzemeRafDisplay(sarfMalzeme.raf, isUserAdmin);
    
    // Loading göster
    showSarfMalzemePhotoLoading();
    
    // Modalı aç
    openModal('sarfMalzemeFotoModal');
    
    // Fotoğrafı ayrı olarak yükle
    await loadSarfMalzemePhoto(sarfMalzemeId, isUserAdmin);
    
  } catch (error) {
    console.error('Sarf malzeme fotoğraf modal açma hatası:', error);
    showErrorMessage('Hata', 'Modal açılırken bir hata oluştu: ' + error.message);
  }
}

// Sarf malzeme fotoğraf yükleme
async function loadSarfMalzemePhoto(sarfMalzemeId, isUserAdmin) {
  try {
    const photoResult = await window.electronAPI.invoke.database.getSarfMalzemeFotograf(sarfMalzemeId);
    
    hideSarfMalzemePhotoLoading();
    
    if (photoResult.success && photoResult.fotograf) {
      const fotograf = photoResult.fotograf;
      const imgSrc = fotograf.startsWith('data:image') ? 
        fotograf : 
        `data:image/jpeg;base64,${fotograf}`;
        
      const imgElement = document.getElementById('sarfMalzemeFotografPreview');
      imgElement.src = imgSrc;
      imgElement.onload = function() {
        document.getElementById('sarfMalzemeFotografPreviewContainer').style.display = 'block';
        
        if (isUserAdmin) {
          document.getElementById('sarfMalzemeFotografSilBtn').style.display = 'inline-block';
        }
      };
    } else {
      document.getElementById('sarfMalzemeFotografPreviewContainer').style.display = 'none';
      document.getElementById('sarfMalzemeFotografSilBtn').style.display = 'none';
      
      if (!isUserAdmin) {
        document.getElementById('sarfMalzemeFotografError').textContent = 'Bu ürün için henüz fotoğraf eklenmemiş.';
        document.getElementById('sarfMalzemeFotografError').style.display = 'block';
        document.getElementById('sarfMalzemeFotografError').style.backgroundColor = '#d1ecf1';
        document.getElementById('sarfMalzemeFotografError').style.color = '#0c5460';
      }
    }
    
    const fotografUploadContainer = document.getElementById('sarfMalzemeFotografUploadContainer');
    if (isUserAdmin) {
      fotografUploadContainer.style.display = 'block';
      document.getElementById('sarfMalzemeFotografKaydetBtn').style.display = 'inline-block';
    } else {
      fotografUploadContainer.style.display = 'none';
      document.getElementById('sarfMalzemeFotografKaydetBtn').style.display = 'none';
    }
    
  } catch (error) {
    hideSarfMalzemePhotoLoading();
    console.error('Sarf malzeme fotoğraf yükleme hatası:', error);
    document.getElementById('sarfMalzemeFotografError').textContent = 'Fotoğraf yüklenirken hata oluştu.';
    document.getElementById('sarfMalzemeFotografError').style.display = 'block';
  }
}

// Loading fonksiyonları
function showSarfMalzemePhotoLoading() {
  const loadingHTML = `
    <div id="sarfMalzemePhotoLoading" style="text-align: center; padding: 20px;">
      <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #007bff;"></i>
      <p>Fotoğraf yükleniyor...</p>
    </div>
  `;
  
  document.getElementById('sarfMalzemeFotografPreviewContainer').style.display = 'none';
  document.getElementById('sarfMalzemeFotografUploadContainer').style.display = 'none';
  document.getElementById('sarfMalzemeFotografError').style.display = 'none';
  
  const modalBody = document.querySelector('#sarfMalzemeFotoModal .modal-body');
  modalBody.insertAdjacentHTML('beforeend', loadingHTML);
}

function hideSarfMalzemePhotoLoading() {
  const loading = document.getElementById('sarfMalzemePhotoLoading');
  if (loading) {
    loading.remove();
  }
}

// Raf bilgisi gösterme
function updateSarfMalzemeRafDisplay(rafKonumu, isUserAdmin) {
  const rafBilgisiText = document.getElementById('sarfMalzemeRafBilgisiText');
  const rafDuzenleBtn = document.getElementById('sarfMalzemeRafDuzenleBtn');
  const rafDuzenleFormu = document.getElementById('sarfMalzemeRafDuzenleFormu');
  
  if (rafBilgisiText) {
    rafBilgisiText.textContent = rafKonumu ? `Raf: ${rafKonumu}` : 'Raf: Belirtilmemiş';
  }
  
  if (rafDuzenleFormu) {
    rafDuzenleFormu.style.display = 'none';
  }
  
  if (rafDuzenleBtn) {
    rafDuzenleBtn.style.display = isUserAdmin ? 'inline-block' : 'none';
  }
}

// Arka planda fotoğraf yükleme
async function preloadSarfMalzemePhotosInBackground(sarfMalzemeIds) {
  const batchSize = 3;
  
  for (let i = 0; i < sarfMalzemeIds.length; i += batchSize) {
    const batch = sarfMalzemeIds.slice(i, i + batchSize);
    
    const promises = batch.map(async (id) => {
      try {
        await loadSarfMalzemePhotoOnDemand(id);
      } catch (error) {
        console.warn(`Sarf malzeme fotoğrafı yüklenemedi: ${id}`, error);
      }
    });
    
    await Promise.all(promises);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Global fonksiyonları window'a ekle
window.handleSarfMalzemeFoto = handleSarfMalzemeFoto;
window.loadSarfMalzemePhoto = loadSarfMalzemePhoto;

async function saveSarfMalzeme(e) {
    e.preventDefault();
    e.stopPropagation();

    // Form değerlerini al - sadece malzeme adı ve birim
    const sarfMalzemeData = {
        malzeme_adi: document.getElementById('sarfMalzemeAdi').value.trim(),
        birim: document.getElementById('sarfMalzemeBirim').value,
        miktar: 0, // Başlangıçta miktar 0
        kritik_seviye: 0, // Başlangıçta kritik seviye 0
        ekleyen_id: currentUser ? currentUser.id : 1
    };

    try {
        // API erişimi kontrol et
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Sarf malzeme kaydetme metodu kullanılamıyor');
            showToast('Sarf malzeme kaydedilemedi. API erişimi yok.', 'error');
            return;
        }
        
        // Önce mevcut sarf malzeme kontrolü yap
        const checkResult = await window.electronAPI.invoke.database.checkSarfMalzemeExists(
            sarfMalzemeData.malzeme_adi, 
            sarfMalzemeData.birim
        );
        
        if (checkResult.success && checkResult.exists) {
            // Aynı isim ve birimde sarf malzeme var, toast mesajı göster ve o sayfaya yönlendir
            const existingItem = checkResult.sarfMalzeme;
            
            // Toast mesajını göster
            showToast(`"${sarfMalzemeData.malzeme_adi}" adlı malzeme zaten mevcut. O ürüne yönlendiriliyorsunuz.`, 'warning', 5000);
            
            // Sayfayı değiştir ve sarf malzeme listesine git
            setTimeout(() => {
                // Sarf malzeme listesine git
                document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
                document.getElementById('sarf-malzeme-listesi').classList.add('active');
                
                // Yan menüdeki aktif linki de güncelle
                const navLinks = document.querySelectorAll('.nav-links li a');
                navLinks.forEach(l => l.parentElement.classList.remove('active'));
                document.querySelector('a[data-page="sarf-malzeme-listesi"]').parentElement.classList.add('active');
                
                // Arama kutusuna malzeme adını yaz ve aramayı çalıştır
                document.getElementById('sarfMalzemeAra').value = sarfMalzemeData.malzeme_adi;
                searchSarfMalzeme();
                
                // İlgili satırı vurgula
                setTimeout(() => {
                    const rows = document.getElementById('sarfMalzemeTable').querySelectorAll('tbody tr');
                    rows.forEach(row => {
                        if (row.cells[0].textContent === existingItem.stok_kodu) {
                            row.classList.add('highlighted-row');
                            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            
                            // 5 saniye sonra vurgulamayı kaldır
                            setTimeout(() => {
                                row.classList.remove('highlighted-row');
                            }, 5000);
                        }
                    });
                }, 500);
            }, 1000); // 1 saniye sonra yönlendirme yapılıyor
            
            return;
        }

        // Mevcut sarf malzeme yoksa veya kullanıcı yine de eklemek istiyorsa kaydet
        const result = await window.electronAPI.invoke.database.addSarfMalzeme(sarfMalzemeData);

        if (result.success) {
            // Başarılı bildirimi toast ile göster
            showToast(`Sarf malzeme başarıyla eklendi.\nStok Kodu: ${result.stokKodu}\nBarkod: ${result.barkod}`, 'success');

            // Formu temizle
            document.getElementById('sarfMalzemeForm').reset();

            // Dashboard'ı güncelle
            updateDashboard();
            
            // Sarf malzeme listesi sayfasına geçiş yapılıyor
            setTimeout(() => {
                // Sarf malzeme listesi güncelleme işlemleri
                loadSarfMalzemeListesi();
                
                // Sarf malzeme listesi sayfasına geçiş yap
                document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
                document.getElementById('sarf-malzeme-listesi').classList.add('active');

                // Yan menüdeki aktif linki de güncelleyelim
                const navLinks = document.querySelectorAll('.nav-links li a');
                navLinks.forEach(l => l.parentElement.classList.remove('active'));
                document.querySelector('a[data-page="sarf-malzeme-listesi"]').parentElement.classList.add('active');
                
                // Yeni eklenen ürünü vurgula
                setTimeout(() => {
                    const rows = document.getElementById('sarfMalzemeTable').querySelectorAll('tbody tr');
                    rows.forEach(row => {
                        if (row.cells[0].textContent === result.stokKodu) {
                            row.classList.add('highlighted-row');
                            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            
                            // 5 saniye sonra vurgulamayı kaldır
                            setTimeout(() => {
                                row.classList.remove('highlighted-row');
                            }, 5000);
                        }
                    });
                }, 500);
            }, 1000); // 1 saniye sonra yönlendirme yapılıyor
        } else {
            showToast('Hata: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Sarf malzeme kaydetme hatası:', error);
        showToast('Sarf malzeme kaydedilirken bir hata oluştu. Daha sonra tekrar deneyin.', 'error');
    }
}

// viewSarfMalzemeDetail fonksiyonunu güncelle - RAF VE FOTOĞRAF ALANLARI KALDIRILDI
async function viewSarfMalzemeDetail(id) {
    try {
        // Modalı önce açalım ki kullanıcı bir şeylerin yüklendiğini görsün
        openModal('sarfMalzemeDetayModal');
        
        // Veri yükleniyor mesajı göster
        document.getElementById('sarfMalzemeDetay').innerHTML = '<div class="loading">Veriler yükleniyor...</div>';
        
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            document.getElementById('sarfMalzemeDetay').innerHTML = '<div class="error">Veri kaynağına erişilemiyor</div>';
            return;
        }

        currentSarfMalzemeId = id;
        
        // Kullanıcı yetki kontrolü
        const isUserAdmin = window.globalUserData && window.globalUserData.rol === 'yonetici';
        
        // Veri çekme işlemini başlat - FOTOĞRAF OLMADAN
        const result = await window.electronAPI.invoke.database.getSarfMalzemeById(id);
        
        if (result.success) {
            const sarfMalzeme = result.sarfMalzeme;
            const ekleyen = result.ekleyen;
            
            // Detay alanını doldur - RAF VE FOTOĞRAF ALANLARI KALDIRILDI
            const sarfMalzemeDetay = document.getElementById('sarfMalzemeDetay');
            sarfMalzemeDetay.innerHTML = `
                <div class="detay-row">
                    <div class="detay-label">Stok Kodu:</div>
                    <div class="detay-value">${sarfMalzeme.stok_kodu}</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Malzeme Adı:</div>
                    <div class="detay-value">${sarfMalzeme.malzeme_adi}</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Birim:</div>
                    <div class="detay-value">${sarfMalzeme.birim}</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Barkod:</div>
                    <div class="detay-value">${sarfMalzeme.barkod}</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Toplam Miktar:</div>
                    <div class="detay-value">${Number(sarfMalzeme.toplam_miktar).toFixed(2)} ${sarfMalzeme.birim}</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Kalan Miktar:</div>
                    <div class="detay-value">${Number(sarfMalzeme.kalan_miktar).toFixed(2)} ${sarfMalzeme.birim}</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Kritik Seviye:</div>
                    <div class="detay-value">${Number(sarfMalzeme.kritik_seviye).toFixed(2)} ${sarfMalzeme.birim}</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Ekleme Tarihi:</div>
                    <div class="detay-value">${new Date(sarfMalzeme.ekleme_tarihi).toLocaleString('tr-TR')}</div>
                </div>
            `;
            
            // Yeni Giriş Ekle butonunu yetki kontrolü ile güncelle
            const yeniSarfMalzemeGirisBtn = document.getElementById('yeniSarfMalzemeGirisBtn');
            if (yeniSarfMalzemeGirisBtn) {
                if (isUserAdmin) {
                    yeniSarfMalzemeGirisBtn.disabled = false;
                    yeniSarfMalzemeGirisBtn.classList.remove('disabled');
                    yeniSarfMalzemeGirisBtn.style.opacity = '1';
                    yeniSarfMalzemeGirisBtn.style.cursor = 'pointer';
                    yeniSarfMalzemeGirisBtn.title = 'Yeni giriş ekle';
                } else {
                    yeniSarfMalzemeGirisBtn.disabled = true;
                    yeniSarfMalzemeGirisBtn.classList.add('disabled');
                    yeniSarfMalzemeGirisBtn.style.opacity = '0.5';
                    yeniSarfMalzemeGirisBtn.style.cursor = 'not-allowed';
                    yeniSarfMalzemeGirisBtn.title = 'Bu işlem için yönetici yetkisi gereklidir';
                }
            }
            
            // Giriş geçmişini yükle
            loadSarfMalzemeGirisGecmisi(id);
            
            // Stoğa Geri Dönenler tabını yükle
            loadSarfMalzemeStokGeriDonenler(id);
            
            // İşlem geçmişini doldur
            const islemGecmisiTable = document.getElementById('sarfMalzemeIslemGecmisiTable').getElementsByTagName('tbody')[0];
            islemGecmisiTable.innerHTML = '';
            
            if (!result.islemler || result.islemler.length === 0) {
                const row = islemGecmisiTable.insertRow();
                row.innerHTML = '<td colspan="6" class="text-center">İşlem geçmişi bulunamadı</td>';
            } else {
                result.islemler.forEach(islem => {
                    // Eğer işlem "İade" ve kullanım alanı "StokGeriYukleme" ise, bu işlemi gösterme
                    if (islem.islem_turu === 'İade' && islem.kullanim_alani === 'StokGeriYukleme') {
                        return;
                    }
                    
                    const row = islemGecmisiTable.insertRow();
                    
                    // Tarih
                    const cell1 = row.insertCell(0);
                    const date = new Date(islem.islem_tarihi);
                    cell1.textContent = date.toLocaleString('tr-TR');
                    
                    // İşlem Türü
                    const cell2 = row.insertCell(1);
                    cell2.textContent = islem.islem_turu;
                    
                    // Miktar - Birim eklenmiş
                    const cell3 = row.insertCell(2);
                    cell3.textContent = `${Number(islem.miktar).toFixed(2)} ${sarfMalzeme.birim}`;
                    
                    // Kullanım Alanı
                    const cell4 = row.insertCell(3);
                    switch(islem.kullanim_alani) {
                        case 'FasonImalat':
                            cell4.textContent = 'Fason İmalat';
                            break;
                        case 'MakineImalat':
                            cell4.textContent = 'Makine İmalat';
                            break;
                        case 'StokGeriYukleme':
                            cell4.textContent = 'Stok Geri Yükleme';
                            break;
                        default:
                            cell4.textContent = islem.kullanim_alani;
                    }
                    
                    // Proje
                    const cell5 = row.insertCell(4);
                    cell5.textContent = islem.proje_id ? `${islem.proje_adi}` : 'Belirtilmemiş';
                    
                    // Kullanıcı
                    const cell6 = row.insertCell(5);
                    cell6.textContent = `${islem.kullanici_ad} ${islem.kullanici_soyad}`;
                });
            }
            
            // İlk tab'ı aktif et ve diğerlerini deaktif et
            resetTabSystem();
            
            // Tab sistemini kur
            setupTabSystem();
        } else {
            document.getElementById('sarfMalzemeDetay').innerHTML = `<div class="error">Hata: ${result.message}</div>`;
        }
    } catch (error) {
        console.error('Sarf malzeme detayı getirme hatası:', error);
        document.getElementById('sarfMalzemeDetay').innerHTML = '<div class="error">Beklenmeyen bir hata oluştu</div>';
    }
}

// Update the loadSarfMalzemeGirisGecmisi function to remove the description field
async function loadSarfMalzemeGirisGecmisi(sarfMalzemeId) {
    try {
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            return;
        }

        const result = await window.electronAPI.invoke.database.getSarfMalzemeGirisGecmisi(sarfMalzemeId);

        const girisGecmisiTable = document.getElementById('sarfGirisGecmisiTable');
        if (!girisGecmisiTable) {
            console.error('sarfGirisGecmisiTable elementi bulunamadı!');
            return;
        }
        
        // Önce tablo başlığını (thead) yeniden oluştur - Güncelleme sütunu eklendi
        const tableHead = girisGecmisiTable.getElementsByTagName('thead')[0];
        if (tableHead) {
            tableHead.innerHTML = `
                <tr>
                    <th>Tarih</th>
                    <th>Miktar</th>
                    <th>Birim Fiyat</th>
                    <th>Para Birimi</th>
                    <th>Toplam Tutar</th>
                    <th>Tedarikçi</th>
                    <th>Ekleyen</th>
                    <th>İşlem</th>
                </tr>
            `;
        }
        
        const tableBody = girisGecmisiTable.getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
        
        if (!result.success || !result.girisGecmisi || result.girisGecmisi.length === 0) {
            const row = tableBody.insertRow();
            row.innerHTML = '<td colspan="8" class="text-center">Giriş geçmişi bulunamadı</td>'; // 8 sütun (güncelleme sütunu eklenmiş)
            return;
        }
        
        // Kullanıcı yetki kontrolü
        const isUserAdmin = window.globalUserData && window.globalUserData.rol === 'yonetici';
        
        // Son girişten sonra işlem var mı kontrol et
        const islemlerResult = await window.electronAPI.invoke.database.getSarfMalzemeIslemleri(sarfMalzemeId);
        const islemler = islemlerResult.success ? islemlerResult.islemler : [];
        
        // Tarihe göre sırala (en yeni en üstte)
        const sortedGirisGecmisi = result.girisGecmisi
            .sort((a, b) => new Date(b.giris_tarihi) - new Date(a.giris_tarihi));
            
        // Girisler ve işlemler için tarih haritası oluştur
        const girislerMap = new Map();
        sortedGirisGecmisi.forEach(giris => {
            girislerMap.set(giris.id, new Date(giris.giris_tarihi));
        });
        
        const islemlerMap = new Map();
        islemler.forEach(islem => {
            islemlerMap.set(islem.id, new Date(islem.islem_tarihi));
        });
        
        // Son giriş ve son işlem
        const sonGiris = sortedGirisGecmisi.length > 0 ? sortedGirisGecmisi[0] : null;
        const sonGirisTarihi = sonGiris ? new Date(sonGiris.giris_tarihi) : null;
        
        // Son girişten sonra işlem var mı kontrol et
        const sonGiristenSonraIslemVar = islemler.some(islem => {
            const islemTarihi = new Date(islem.islem_tarihi);
            return islemTarihi > sonGirisTarihi;
        });

        sortedGirisGecmisi.forEach((giris, index) => {
            const row = tableBody.insertRow();
            const girisTarihi = new Date(giris.giris_tarihi);
            
            // Girişten sonra işlem var mı kontrol et
            const giristenSonraIslemVar = islemler.some(islem => {
                const islemTarihi = new Date(islem.islem_tarihi);
                return islemTarihi > girisTarihi;
            });
            
            // Bu giriş son giriş mi?
            const buGirisSonGiris = index === 0;
            
            // Güncelleme yapılabilir mi? Son giriş ve sonrasında işlem yoksa
            const guncellenebilir = buGirisSonGiris && !giristenSonraIslemVar;

            // Tarih
            const cell1 = row.insertCell(0);
            cell1.textContent = girisTarihi.toLocaleString('tr-TR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Miktar
            const cell2 = row.insertCell(1);
            cell2.textContent = `${Number(giris.miktar).toFixed(2)} ${giris.birim || 'adet'}`;

            // Birim Fiyat
            const cell3 = row.insertCell(2);
            cell3.textContent = `${Number(giris.birim_fiyat).toFixed(2)}`;

            // Para Birimi - Tedarikçi alanından çıkarılacak
            const cell4 = row.insertCell(3);
            const tedarikciStr = giris.tedarikci || '';
            // Para birimi bilgisini parantez içinde aramaya çalış
            const paraBirimiMatch = tedarikciStr.match(/\((.*?)\)/);
            const paraBirimi = paraBirimiMatch ? paraBirimiMatch[1] : 'TRY'; // Yoksa TRY varsayılan
            cell4.textContent = paraBirimi;

            // Toplam Tutar
            const cell5 = row.insertCell(4);
            const toplamTutar = Number(giris.miktar) * Number(giris.birim_fiyat);
            cell5.textContent = `${toplamTutar.toFixed(2)} ${paraBirimi}`;

            // Tedarikçi - Parantezli para birimi bilgisini temizle
            const cell6 = row.insertCell(5);
            const cleanTedarikci = tedarikciStr.replace(/\s*\(.*?\)\s*/, '');
            cell6.textContent = cleanTedarikci || 'Belirtilmemiş';

            // Ekleyen
            const cell7 = row.insertCell(6);
            cell7.textContent = `${giris.kullanici_ad} ${giris.kullanici_soyad}`;
            
            // İşlem (Güncelle butonu) - Yetki kontrolü ile
            const cell8 = row.insertCell(7);
            
            if (guncellenebilir && isUserAdmin) {
                // Hem güncellenebilir hem de yönetici ise aktif buton
                cell8.innerHTML = `
                    <button class="action-btn edit" title="Güncelle" onclick="openSarfMalzemeGirisGuncelleModal(${giris.id}, ${sarfMalzemeId}, ${giris.miktar}, '${giris.birim}')">
                        <i class="fas fa-edit"></i>
                    </button>
                `;
            } else if (guncellenebilir && !isUserAdmin) {
                // Güncellenebilir ama yönetici değil ise yetki yok butonu
                cell8.innerHTML = `
                    <button class="action-btn edit disabled" title="Bu işlem için yönetici yetkisi gereklidir" disabled>
                        <i class="fas fa-edit" style="color: #ccc;"></i>
                    </button>
                `;
            } else {
                // Güncellenemez ise (işlem yapılmış)
                cell8.innerHTML = `
                    <button class="action-btn edit edited" title="İşlem yapıldığı için güncellenemez" disabled>
                        <i class="fas fa-ban"></i>
                    </button>
                `;
            }
        });
    } catch (error) {
        console.error('Sarf malzeme giriş geçmişi yükleme hatası:', error);
        
        const sarfGirisGecmisiTable = document.getElementById('sarfGirisGecmisiTable');
        if (sarfGirisGecmisiTable) {
            const tableBody = sarfGirisGecmisiTable.getElementsByTagName('tbody')[0];
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Giriş geçmişi yüklenirken hata oluştu</td></tr>'; // 8 sütun
            }
        }
    }
}

// Güncellenmiş openSarfMalzemeGirisGuncelleModal fonksiyonu
async function openSarfMalzemeGirisGuncelleModal(girisId, sarfMalzemeId, mevcutMiktar, birim) {
    try {
        // Global değişkenlere kaydet
        currentSarfMalzemeGirisId = girisId;
        currentSarfMalzemeId = sarfMalzemeId;
        
        // Modal başlığını güncelle
        document.getElementById('sarfMalzemeGirisGuncelleHeader').textContent = 'Sarf Malzeme Giriş Güncelleme';
        
        // Mevcut değerleri göster
        const mevcutMiktarElem = document.getElementById('sarfMalzemeGunceleMevcutMiktar');
        if (mevcutMiktarElem) {
            mevcutMiktarElem.textContent = `${mevcutMiktar} ${birim}`;
        }
        
        // Giriş detaylarını al
        const girisDetaylari = await window.electronAPI.invoke.database.getSarfMalzemeGirisById(girisId);
        if (girisDetaylari.success && girisDetaylari.giris) {
            const giris = girisDetaylari.giris;
            
            // Form alanlarını mevcut değerlerle doldur
            document.getElementById('sarfMalzemeGirisGuncelleMiktar').value = mevcutMiktar;
            
            // Birim fiyat
            if (document.getElementById('sarfMalzemeGirisGuncelleBirimFiyat')) {
                document.getElementById('sarfMalzemeGirisGuncelleBirimFiyat').value = giris.birim_fiyat || '';
            }
            
            // Para birimi seçimi
            if (document.getElementById('sarfMalzemeGirisGuncelleBirimFiyatTuru')) {
                // Tedarikçi alanından para birimi bilgisi çıkar (Örn: "Tedarikçi Adı (USD)")
                let birimFiyatTuru = 'TRY'; // Varsayılan
                const tedarikciStr = giris.tedarikci || '';
                const paraBirimiMatch = tedarikciStr.match(/\((.*?)\)/);
                
                if (paraBirimiMatch && paraBirimiMatch[1]) {
                    birimFiyatTuru = paraBirimiMatch[1];
                }
                
                document.getElementById('sarfMalzemeGirisGuncelleBirimFiyatTuru').value = birimFiyatTuru;
            }
            
            // Tedarikçi
            if (document.getElementById('sarfMalzemeGirisGuncelleTedarikci')) {
                // Tedarikçi adını para birimi olmadan al
                let tedarikci = giris.tedarikci || '';
                tedarikci = tedarikci.replace(/\s*\(.*?\)\s*/, '');
                
                document.getElementById('sarfMalzemeGirisGuncelleTedarikci').value = tedarikci;
            }
            
            // Kritik seviye
            const sarfMalzemeDetay = await window.electronAPI.invoke.database.getSarfMalzemeById(sarfMalzemeId);
            if (sarfMalzemeDetay.success && sarfMalzemeDetay.sarfMalzeme) {
                document.getElementById('sarfMalzemeGirisGuncelleKritikSeviye').value = 
                    sarfMalzemeDetay.sarfMalzeme.kritik_seviye || 0;
            }
            
            // Gizli alanları doldur
            document.getElementById('sarfMalzemeGirisGuncelleSarfMalzemeId').value = sarfMalzemeId;
            document.getElementById('sarfMalzemeGirisGuncelleGirisId').value = girisId;
        }
        
        // Tedarikçi listesini doldur
        await loadTedarikciListesi();
        
        // Yeni tedarikçi ekleme butonu için event listener
        const yeniTedarikciEkleBtn = document.getElementById('sarfMalzemeGirisGuncelleYeniTedarikciEkleBtn');
        if (yeniTedarikciEkleBtn) {
            // Önceki event listener'ları temizle
            const newBtn = yeniTedarikciEkleBtn.cloneNode(true);
            yeniTedarikciEkleBtn.parentNode.replaceChild(newBtn, yeniTedarikciEkleBtn);
            
            // Yeni event listener ekle
            newBtn.addEventListener('click', function() {
                openNewTedarikciModal('sarfMalzemeGirisGuncelleModal');
            });
        }
        
        // Modalı aç
        openModal('sarfMalzemeGirisGuncelleModal');
        
        // Miktar alanına odaklan
        setTimeout(() => {
            document.getElementById('sarfMalzemeGirisGuncelleMiktar').focus();
        }, 300);
    } catch (error) {
        console.error('Sarf malzeme giriş güncelleme modalı açma hatası:', error);
        showToast('Modal açılırken bir hata oluştu', 'error');
    }
}

// Güncelleme fonksiyonu
// Güncellenmiş guncelleSarfMalzemeGirisi fonksiyonu
async function guncelleSarfMalzemeGirisi() {
    try {
        // Form değerlerini al
        const girisId = document.getElementById('sarfMalzemeGirisGuncelleGirisId').value;
        const sarfMalzemeId = document.getElementById('sarfMalzemeGirisGuncelleSarfMalzemeId').value;
        const yeniMiktar = parseFloat(document.getElementById('sarfMalzemeGirisGuncelleMiktar').value);
        const birimFiyat = parseFloat(document.getElementById('sarfMalzemeGirisGuncelleBirimFiyat').value || 0);
        const birimFiyatTuru = document.getElementById('sarfMalzemeGirisGuncelleBirimFiyatTuru').value;
        const tedarikci = document.getElementById('sarfMalzemeGirisGuncelleTedarikci').value.trim();
        const kritikSeviye = parseFloat(document.getElementById('sarfMalzemeGirisGuncelleKritikSeviye').value || 0);
        
        // Validasyon
        if (!yeniMiktar || yeniMiktar <= 0) {
            showModalError('sarfMalzemeGirisGuncelleModal', 'Lütfen geçerli bir miktar girin.');
            return;
        }
        
        // API kontrolü
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            showErrorMessage('Hata', 'İşlem kaydedilemedi. API erişimi yok.');
            return;
        }
        
        // İşlem kaydediliyor mesajını göster
        showModalSuccess('sarfMalzemeGirisGuncelleModal', 'Güncelleme yapılıyor...');
        
        // Güncelleme işlemi
        const result = await window.electronAPI.invoke.database.updateSarfMalzemeGirisi({
            giris_id: girisId,
            sarf_malzeme_id: sarfMalzemeId,
            yeni_miktar: yeniMiktar,
            birim_fiyat: birimFiyat,
            birim_fiyat_turu: birimFiyatTuru,
            tedarikci: tedarikci,
            kritik_seviye: kritikSeviye
        });
        
        if (result.success) {
            showToast('Sarf malzeme girişi başarıyla güncellendi.', 'success');
            
            // Giriş modalını kapat
            closeModal('sarfMalzemeGirisGuncelleModal');
            
            // Dashboard'ı güncelle
            updateDashboard();
            
            // Sarf malzeme listesini güncelle
            await loadSarfMalzemeListesi();
            
            // Sarf malzeme detayını yeniden yükle
            if (currentSarfMalzemeId) {
                await viewSarfMalzemeDetail(currentSarfMalzemeId);
            }
        } else {
            showToast('Hata: ' + (result.message || 'Bilinmeyen bir hata oluştu'), 'error');
        }
    } catch (error) {
        console.error('Sarf malzeme girişi güncelleme hatası:', error);
        showErrorMessage('İşlem Hatası', 'Sarf malzeme girişi güncellenirken bir hata oluştu: ' + error.message);
    }
}

// Diğer fonksiyonlar (devam...)
async function kaydetSarfMalzemeGirisi() {
    try {
        // Form elemanlarını kontrol et
        const sarfMalzemeIdElement = document.getElementById('sarfMalzemeGirisSarfMalzemeId');
        const miktarElement = document.getElementById('sarfMalzemeGirisMiktar');
        const birimFiyatElement = document.getElementById('sarfMalzemeGirisBirimFiyat');
        const birimFiyatTuruElement = document.getElementById('sarfMalzemeGirisBirimFiyatTuru');
        const tedarikciElement = document.getElementById('sarfMalzemeGirisTedarikci');
        const kritikSeviyeElement = document.getElementById('sarfMalzemeGirisKritikSeviye');
        
        // Form değerlerini al
        const sarfMalzemeId = sarfMalzemeIdElement.value;
        const miktar = parseFloat(miktarElement.value);
        const birimFiyat = parseFloat(birimFiyatElement.value);
        const birimFiyatTuru = birimFiyatTuruElement.value;
        const tedarikci = tedarikciElement.value.trim();
        const kritikSeviye = parseFloat(kritikSeviyeElement.value);
        
        // Doğrulama
        if (!sarfMalzemeId) {
            showModalError('sarfMalzemeGirisModal', 'Sarf malzeme ID geçersiz.');
            return;
        }
        
        if (!miktar || miktar <= 0) {
            showModalError('sarfMalzemeGirisModal', 'Lütfen geçerli bir miktar girin.');
            return;
        }
        
        if (!birimFiyat || birimFiyat <= 0) {
            showModalError('sarfMalzemeGirisModal', 'Lütfen geçerli bir birim fiyat girin.');
            return;
        }
        
        if (!tedarikci) {
            showModalError('sarfMalzemeGirisModal', 'Lütfen tedarikçi bilgisi girin.');
            return;
        }
        
        if (!kritikSeviye || kritikSeviye <= 0) {
            showModalError('sarfMalzemeGirisModal', 'Lütfen geçerli bir kritik seviye girin.');
            return;
        }
        
        // Giriş verisi
        const girisData = {
            sarf_malzeme_id: sarfMalzemeId,
            miktar: miktar,
            birim_fiyat: birimFiyat,
            birim_fiyat_turu: birimFiyatTuru,
            tedarikci: tedarikci,
            kritik_seviye: kritikSeviye,
            ekleyen_id: currentUser ? currentUser.id : 1
        };
        
        // İşlem kaydediliyor mesajını göster
        showModalSuccess('sarfMalzemeGirisModal', 'Giriş kaydediliyor...');
        
        // API üzerinden kaydet
        const result = await window.electronAPI.invoke.database.kaydetSarfMalzemeGirisi(girisData);
        
        if (result.success) {
            showToast('Sarf malzeme girişi başarıyla kaydedildi.', 'success');
            
            closeModal('sarfMalzemeGirisModal');
            
            const form = document.getElementById('sarfMalzemeGirisForm');
            if (form) form.reset();
            
            updateDashboard();
            await loadSarfMalzemeListesi();
            
            if (currentSarfMalzemeId) {
                await viewSarfMalzemeDetail(currentSarfMalzemeId);
            }
        } else {
            showErrorMessage('İşlem Hatası', 'Hata: ' + (result.message || 'Bilinmeyen bir hata oluştu'));
        }
    } catch (error) {
        console.error('Sarf malzeme girişi kaydetme hatası:', error);
        showErrorMessage('İşlem Hatası', 'Sarf malzeme girişi kaydedilirken bir hata oluştu: ' + error.message);
    }
}

function setupSarfMalzemeGirisButtons() {
    const yeniSarfMalzemeGirisBtn = document.getElementById('yeniSarfMalzemeGirisBtn');
    if (yeniSarfMalzemeGirisBtn) {
        yeniSarfMalzemeGirisBtn.addEventListener('click', async function() {
            try {
                const sarfMalzemeGirisForm = document.getElementById('sarfMalzemeGirisForm');
                if (sarfMalzemeGirisForm) {
                    sarfMalzemeGirisForm.reset();
                }
                
                const sarfMalzemeGirisSarfMalzemeId = document.getElementById('sarfMalzemeGirisSarfMalzemeId');
                if (sarfMalzemeGirisSarfMalzemeId) {
                    sarfMalzemeGirisSarfMalzemeId.value = currentSarfMalzemeId;
                }
                
                closeModal('sarfMalzemeDetayModal');
                openModal('sarfMalzemeGirisModal');
            } catch (error) {
                console.error('Yeni sarf malzeme girişi açılırken hata:', error);
                showErrorMessage('Hata', 'Sarf malzeme giriş formu açılırken bir hata oluştu.');
            }
        });
    }
    
    const sarfMalzemeGirisKaydetBtn = document.getElementById('sarfMalzemeGirisKaydetBtn');
    if (sarfMalzemeGirisKaydetBtn) {
        const newBtn = sarfMalzemeGirisKaydetBtn.cloneNode(true);
        sarfMalzemeGirisKaydetBtn.parentNode.replaceChild(newBtn, sarfMalzemeGirisKaydetBtn);
        
        newBtn.addEventListener('click', function() {
            kaydetSarfMalzemeGirisi();
        });
    }
}

async function deleteSarfMalzeme(id) {
    try {
        const result = await window.electronAPI.invoke.database.getSarfMalzemeById(id);
        
        if (!result.success) {
            alert('Sarf malzeme bilgileri alınamadı: ' + result.message);
            return;
        }
        
        const sarfMalzeme = result.sarfMalzeme;
        
        if (!window.globalUserData) {
            alert('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
            return;
        }
        
        if (window.globalUserData.rol !== 'yonetici') {
            showToast('Bu işlem için yönetici yetkisi gereklidir.', 'error');
            return;
        }
        
        let deleteMessage = `"${sarfMalzeme.malzeme_adi} (${sarfMalzeme.stok_kodu})" sarf malzemesini silmek istediğinizden emin misiniz?`;
        
        window.showDeleteConfirmationModal({
            title: 'Sarf Malzeme Silme İşlemi',
            message: deleteMessage,
            itemName: `${sarfMalzeme.malzeme_adi} (${sarfMalzeme.stok_kodu})`,
            itemType: 'Sarf Malzeme',
            itemId: id,
            userData: window.globalUserData,
            onConfirm: async (reason) => {
                const result = await window.electronAPI.invoke.database.deleteSarfMalzemeWithNotification(
                    id, 
                    reason,
                    window.globalUserData
                );
                
                if (result.success) {
                    loadSarfMalzemeListesi();
                    if (typeof updateDashboard === 'function') {
                        updateDashboard();
                    }
                    return true;
                } else {
                    throw new Error(result.message);
                }
            }
        });
    } catch (error) {
        console.error('Sarf malzeme silme hatası:', error);
        alert('Sarf malzeme silinirken bir hata oluştu: ' + error.message);
    }
}

async function saveSarfMalzemeIslemi() {
    const miktar = parseFloat(document.getElementById('sarfMalzemeKullanilanMiktar').value);
    const islemTuru = document.getElementById('sarfMalzemeIslemTuru').value;
    const kullanimAlani = document.getElementById('sarfMalzemeKullanimAlani').value;
    const projeId = document.getElementById('sarfMalzemeProjeSecimi').value;
    const makineId = document.getElementById('sarfMalzemeMakineSecimi').value;
    const calisanId = document.getElementById('sarfMalzemeCalisanSecimi').value;
    
    if (!miktar || miktar <= 0) {
        showModalError('sarfMalzemeIslemModal', 'Lütfen geçerli bir miktar girin.');
        return;
    }
    
    if ((kullanimAlani === 'FasonImalat' || kullanimAlani === 'MakineImalat') && !projeId) {
        showModalError('sarfMalzemeIslemModal', 'Lütfen bir proje seçin veya yeni bir proje oluşturun.');
        return;
    }
    
    if (kullanimAlani === 'FasonImalat') {
        if (!makineId) {
            showModalError('sarfMalzemeIslemModal', 'Lütfen makine seçin.');
            return;
        }
        if (!calisanId) {
            showModalError('sarfMalzemeIslemModal', 'Lütfen alan kişi seçin.');
            return;
        }
    }
    
    if (kullanimAlani === 'MakineImalat' && !calisanId) {
        showModalError('sarfMalzemeIslemModal', 'Lütfen alan kişi seçin.');
        return;
    }
    
    try {
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            showErrorMessage('Hata', 'İşlem kaydedilemedi. API erişimi yok.');
            return;
        }
        
        const sarfMalzemeResult = await window.electronAPI.invoke.database.getSarfMalzemeById(currentSarfMalzemeId);
        
        if (!sarfMalzemeResult.success) {
            showErrorMessage('Hata', 'Sarf malzeme bilgileri alınamadı: ' + sarfMalzemeResult.message);
            return;
        }
        
        const sarfMalzeme = sarfMalzemeResult.sarfMalzeme;
        
        if (islemTuru === 'Kullanım' || islemTuru === 'Fire') {
            const kalanMiktar = parseFloat(sarfMalzeme.kalan_miktar);
            
            if (miktar > kalanMiktar) {
                showModalError('sarfMalzemeIslemModal', 
                    `Kullanmak istediğiniz miktar (${miktar.toFixed(2)} ${sarfMalzeme.birim}) ` +
                    `kalan miktardan (${kalanMiktar.toFixed(2)} ${sarfMalzeme.birim}) fazla.`
                );
                return;
            }
        }

        const islemData = {
            sarf_malzeme_id: currentSarfMalzemeId,
            islem_turu: islemTuru,
            kullanim_alani: kullanimAlani,
            miktar: miktar,
            proje_id: projeId || null,
            kullanici_id: currentUser.id,
            makine: kullanimAlani === 'FasonImalat' ? makineId : null,
            calisan_id: (kullanimAlani === 'FasonImalat' || kullanimAlani === 'MakineImalat') ? calisanId : null
        };
        
        showModalSuccess('sarfMalzemeIslemModal', 'İşlem kaydediliyor...');
        
        const result = await window.electronAPI.invoke.database.addSarfMalzemeIslemi(islemData);
        
        if (result.success) {
            showToast('Sarf malzeme çıkış işlemi yapıldı.', 'success');
            
            closeModal('sarfMalzemeIslemModal');
            document.getElementById('sarfMalzemeKullanilanMiktar').value = '';
            
            updateDashboard();
            await loadSarfMalzemeListesi();
            
            if (currentSarfMalzemeId) {
                viewSarfMalzemeDetail(currentSarfMalzemeId);
            }
            
            if (kullanimAlani === 'FasonImalat' || kullanimAlani === 'MakineImalat') {
                document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
                
                const targetPage = kullanimAlani === 'FasonImalat' ? 'fason-imalat' : 'makine-imalat';
                document.getElementById(targetPage).classList.add('active');
                
                const navLinks = document.querySelectorAll('.nav-links li a');
                navLinks.forEach(l => l.parentElement.classList.remove('active'));
                document.querySelector(`a[data-page="${targetPage}"]`).parentElement.classList.add('active');
                
                if (kullanimAlani === 'FasonImalat') {
                    loadFasonIslemler();
                } else {
                    loadMakineIslemler();
                }
            }
        } else {
            showErrorMessage('İşlem Hatası', 'Hata: ' + result.message);
        }
    } catch (error) {
        console.error('İşlem kaydetme hatası:', error);
        showErrorMessage('İşlem Hatası', 'İşlem kaydedilirken bir hata oluştu: ' + error.message);
    }
}

function searchSarfMalzeme() {
    const searchText = document.getElementById('sarfMalzemeAra').value.toLowerCase().trim();
    const durumSecimi = document.getElementById('sarfMalzemeDurumSecimi').value;
    
    const tableBody = document.getElementById('sarfMalzemeTable').getElementsByTagName('tbody')[0];
    const rows = tableBody.rows;
    
    // Performans için: document fragment kullan
    const fragment = document.createDocumentFragment();
    const visibleRows = [];
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const stokKodu = row.cells[0].textContent.toLowerCase();
        const malzemeAdi = row.cells[1].textContent.toLowerCase();
        const barkod = row.cells[3].textContent.toLowerCase();
        
        const durumCell = row.cells[4];
        const durumText = durumCell.textContent.trim();
        let durumDegeri = '';
        
        if (durumText.includes('Stokta Var')) {
            durumDegeri = 'STOKTA_VAR';
        } else if (durumText.includes('Az Kaldı')) {
            durumDegeri = 'AZ_KALDI';
        } else if (durumText.includes('Stokta Yok')) {
            durumDegeri = 'STOKTA_YOK';
        }
        
        const textMatch = 
            searchText === '' || 
            stokKodu.includes(searchText) || 
            malzemeAdi.includes(searchText) || 
            barkod.includes(searchText);
        
        const durumMatch = 
            durumSecimi === '' || 
            durumDegeri === durumSecimi;
        
        if (textMatch && durumMatch) {
            row.style.display = '';
            visibleRows.push(row);
        } else {
            row.style.display = 'none';
        }
    }
    
    console.log(`Arama sonucu: ${visibleRows.length} kayıt gösteriliyor`);
}

document.addEventListener('DOMContentLoaded', function() {
    const aramaAlani = document.getElementById('sarfMalzemeAra');
    const durumSecimi = document.getElementById('sarfMalzemeDurumSecimi');
    const aramaButonu = document.getElementById('sarfMalzemeAraBtn');

    if (aramaAlani) {
        aramaAlani.addEventListener('input', searchSarfMalzeme);
    }

    if (durumSecimi) {
        durumSecimi.addEventListener('change', searchSarfMalzeme);
    }

    if (aramaButonu) {
        aramaButonu.addEventListener('click', searchSarfMalzeme);
    }
    
    // Sarf malzeme giriş güncelle kaydet butonu
    const sarfMalzemeGirisGuncelleKaydetBtn = document.getElementById('sarfMalzemeGirisGuncelleKaydetBtn');
    if (sarfMalzemeGirisGuncelleKaydetBtn) {
        sarfMalzemeGirisGuncelleKaydetBtn.addEventListener('click', guncelleSarfMalzemeGirisi);
    }
});

async function deleteSarfMalzemeIslem(islemId) {
    try {
        const islemResult = await window.electronAPI.invoke.database.getSarfMalzemeIslemById(islemId);
        
        if (!islemResult.success) {
            throw new Error('İşlem bilgileri alınamadı: ' + islemResult.message);
        }
        
        const islem = islemResult.islem;
        const sarfMalzemeId = islem.sarf_malzeme_id;
        
        const deleteData = {
            islemId: islemId,
            sarfMalzemeId: sarfMalzemeId,
            miktar: islem.miktar
        };
        
        const result = await window.electronAPI.invoke.database.deleteSarfMalzemeIslemAndRestoreStock(deleteData);
        
        return result;
    } catch (error) {
        console.error('Sarf malzeme işlemi silme hatası:', error);
        return { success: false, message: error.message };
    }
}

function openSarfMalzemeIslemModal(id) {
    try {
        currentSarfMalzemeId = id;
        
        document.getElementById('sarfMalzemeHeader').textContent = 'Sarf Malzeme İşlemi';
        
        window.electronAPI.invoke.database.getSarfMalzemeById(id)
            .then(result => {
                if (!result.success) {
                    console.error('Sarf malzeme bilgileri alınamadı:', result.message);
                    showErrorMessage('Hata', 'Sarf malzeme bilgileri alınamadı.');
                    return;
                }
                
                const sarfMalzeme = result.sarfMalzeme;
                
                const bilgiAlani = document.getElementById('islemModalBilgi') || document.createElement('div');
                bilgiAlani.id = 'islemModalBilgi';
                bilgiAlani.className = 'form-info';
                bilgiAlani.innerHTML = `
                    <p><strong>Kalan Miktar:</strong> ${Number(sarfMalzeme.kalan_miktar).toFixed(2)} ${sarfMalzeme.birim}</p>
                    <p><i>Not: Kullanılabilir maksimum miktar yukarıdaki değerdir.</i></p>
                `;
                
                const sarfMalzemeIslemForm = document.querySelector('.sarf-malzeme-islem-form');
                if (sarfMalzemeIslemForm && !document.getElementById('islemModalBilgi')) {
                    sarfMalzemeIslemForm.insertBefore(bilgiAlani, sarfMalzemeIslemForm.firstChild);
                }
                
                loadProjeler().then(() => {
                    const projeSecimi = document.getElementById('sarfMalzemeProjeSecimi');
                    if (projeSecimi) {
                        projeSecimi.innerHTML = '<option value="">-- Proje Seçin --</option>';
                        
                        const projeler = document.getElementById('projeSecimi').options;
                        if (projeler) {
                            for (let i = 1; i < projeler.length; i++) {
                                const option = document.createElement('option');
                                option.value = projeler[i].value;
                                option.textContent = projeler[i].textContent;
                                projeSecimi.appendChild(option);
                            }
                        }
                    }
                    
                    toggleMakineSection();
                    loadCalisanlarForSelect('sarfMalzemeCalisanSecimi');
                    
                    openModal('sarfMalzemeIslemModal');
                    closeModal('sarfMalzemeDetayModal');
                    
                    setTimeout(() => {
                        const miktarInput = document.getElementById('sarfMalzemeKullanilanMiktar');
                        if (miktarInput) miktarInput.focus();
                    }, 300);
                });
            })
            .catch(error => {
                console.error('Sarf malzeme işlem modalı açma hatası:', error);
                showErrorMessage('Hata', 'Sarf malzeme işlem modalı açılırken bir hata oluştu.');
            });
    } catch (error) {
        console.error('Sarf malzeme işlem modalı açma hatası:', error);
        showErrorMessage('Hata', 'Sarf malzeme işlem modalı açılırken bir hata oluştu.');
    }
}

async function loadSarfMalzemeStokGeriDonenler(sarfMalzemeId) {
    try {
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            return;
        }

        const result = await window.electronAPI.invoke.database.getSarfMalzemeIslemleri(sarfMalzemeId);

        const stokGeriDonenlerTable = document.getElementById('sarfMalzemeStokGeriDonenlerTable');
        if (!stokGeriDonenlerTable) {
            console.error('sarfMalzemeStokGeriDonenlerTable elementi bulunamadı!');
            return;
        }
        
        const tableBody = stokGeriDonenlerTable.getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
        
        if (!result.success || !result.islemler || result.islemler.length === 0) {
            const row = tableBody.insertRow();
            row.innerHTML = '<td colspan="6" class="text-center">Stoğa geri dönen malzeme bulunamadı</td>';
            return;
        }
        
        const geriDonenler = result.islemler.filter(islem => 
            islem.islem_turu === 'İade' && islem.kullanim_alani === 'StokGeriYukleme'
        );
        
        if (geriDonenler.length === 0) {
            const row = tableBody.insertRow();
            row.innerHTML = '<td colspan="6" class="text-center">Stoğa geri dönen malzeme bulunamadı</td>';
            return;
        }
        
        const processedItems = [];
        
        for (const geriDonen of geriDonenler) {
            const sortedIslemler = result.islemler
                .filter(i => i.id !== geriDonen.id)
                .filter(i => i.islem_turu !== 'İade')
                .sort((a, b) => new Date(b.islem_tarihi) - new Date(a.islem_tarihi));
            
            const geriDonenTarih = new Date(geriDonen.islem_tarihi);
            const oncekiIslemler = sortedIslemler.filter(i => new Date(i.islem_tarihi) < geriDonenTarih);
            
            let originalIslem = null;
            if (oncekiIslemler.length > 0) {
                originalIslem = oncekiIslemler[0];
            }
            
            if (!originalIslem) continue;
            
            const row = tableBody.insertRow();
            
            const cell1 = row.insertCell(0);
            const date = new Date(geriDonen.islem_tarihi);
            cell1.textContent = date.toLocaleString('tr-TR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const cell2 = row.insertCell(1);
            cell2.textContent = originalIslem.alan_kisi_adi || 'Belirtilmemiş';
            
            const cell3 = row.insertCell(2);
            cell3.textContent = `${Number(originalIslem.miktar).toFixed(2)}`;
            
            const cell4 = row.insertCell(3);
            cell4.textContent = `${Number(geriDonen.miktar).toFixed(2)}`;
            
            const cell5 = row.insertCell(4);
            cell5.textContent = originalIslem.proje_adi || geriDonen.proje_adi || 'Belirtilmemiş';
            
            const cell6 = row.insertCell(5);
            cell6.textContent = `${geriDonen.kullanici_ad || ''} ${geriDonen.kullanici_soyad || ''}`.trim() || 'Bilinmiyor';
            
            processedItems.push(geriDonen.id);
        }
        
        if (processedItems.length === 0) {
            const row = tableBody.insertRow();
            row.innerHTML = '<td colspan="6" class="text-center">Stoğa geri dönen malzeme bulunamadı</td>';
        }
    } catch (error) {
        console.error('Sarf malzeme stok geri dönenler yükleme hatası:', error);
        
        const stokGeriDonenlerTable = document.getElementById('sarfMalzemeStokGeriDonenlerTable');
        if (stokGeriDonenlerTable) {
            const tableBody = stokGeriDonenlerTable.getElementsByTagName('tbody')[0];
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Stok geri dönenler yüklenirken hata oluştu</td></tr>';
            }
        }
    }
}

// Sarf malzeme raf düzenleme fonksiyonları
function showSarfMalzemeRafDuzenleFormu() {
  const rafInput = document.getElementById('sarfMalzemeRafInput');
  const rafBilgisiText = document.getElementById('sarfMalzemeRafBilgisiText');
  const rafDuzenleFormu = document.getElementById('sarfMalzemeRafDuzenleFormu');
  const rafError = document.getElementById('sarfMalzemeRafError');
  
  const mevcutRaf = rafBilgisiText.textContent.replace('Raf: ', '');
  if (mevcutRaf !== 'Belirtilmemiş') {
    rafInput.value = mevcutRaf;
  } else {
    rafInput.value = '';
  }
  
  rafDuzenleFormu.style.display = 'block';
  rafError.style.display = 'none';
  
  setTimeout(() => {
    rafInput.focus();
    rafInput.select();
  }, 100);
}

function hideSarfMalzemeRafDuzenleFormu() {
  document.getElementById('sarfMalzemeRafDuzenleFormu').style.display = 'none';
  document.getElementById('sarfMalzemeRafError').style.display = 'none';
  document.getElementById('sarfMalzemeRafInput').value = '';
}

async function kaydetSarfMalzemeRafBilgisi() {
  try {
    if (!currentPhotoSarfMalzemeId) {
      showErrorMessage('Hata', 'Sarf malzeme ID bulunamadı.');
      return;
    }
    
    const rafKonumu = document.getElementById('sarfMalzemeRafInput').value.trim();
    const rafError = document.getElementById('sarfMalzemeRafError');
    
    if (rafKonumu.length > 50) {
      rafError.textContent = 'Raf konumu en fazla 50 karakter olabilir.';
      rafError.style.display = 'block';
      return;
    }
    
    if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
      console.error('Database invoke metodu bulunamadı');
      showErrorMessage('Hata', 'Raf bilgisi kaydedilemedi. API erişimi yok.');
      return;
    }
    
    const result = await window.electronAPI.invoke.database.updateSarfMalzemeRaf(
      currentPhotoSarfMalzemeId, 
      rafKonumu || null
    );
    
    if (result.success) {
      showToast('Raf bilgisi başarıyla güncellendi.', 'success');
      
      const isUserAdmin = window.globalUserData && window.globalUserData.rol === 'yonetici';
      updateSarfMalzemeRafDisplay(rafKonumu, isUserAdmin);
      
      if (typeof loadSarfMalzemeListesi === 'function') {
        loadSarfMalzemeListesi();
      }
      
      if (typeof viewSarfMalzemeDetail === 'function' && currentPhotoSarfMalzemeId) {
        setTimeout(() => {
          viewSarfMalzemeDetail(currentPhotoSarfMalzemeId);
        }, 500);
      }
    } else {
      rafError.textContent = 'Raf bilgisi güncellenirken bir hata oluştu: ' + result.message;
      rafError.style.display = 'block';
    }
  } catch (error) {
    console.error('Sarf malzeme raf bilgisi kaydetme hatası:', error);
    document.getElementById('sarfMalzemeRafError').textContent = 'Raf bilgisi kaydedilirken bir hata oluştu.';
    document.getElementById('sarfMalzemeRafError').style.display = 'block';
  }
}

// Event listener kurulumu - Raf ve fotoğraf için
document.addEventListener('DOMContentLoaded', function() {
  // Raf düzenle butonu
  const rafDuzenleBtn = document.getElementById('sarfMalzemeRafDuzenleBtn');
  if (rafDuzenleBtn) {
    rafDuzenleBtn.addEventListener('click', showSarfMalzemeRafDuzenleFormu);
  }
  
  // Raf kaydet butonu
  const rafKaydetBtn = document.getElementById('sarfMalzemeRafKaydetBtn');
  if (rafKaydetBtn) {
    rafKaydetBtn.addEventListener('click', kaydetSarfMalzemeRafBilgisi);
  }
  
  // Raf iptal butonu
  const rafIptalBtn = document.getElementById('sarfMalzemeRafIptalBtn');
  if (rafIptalBtn) {
    rafIptalBtn.addEventListener('click', hideSarfMalzemeRafDuzenleFormu);
  }
  
  // Raf input Enter tuşu
  const rafInput = document.getElementById('sarfMalzemeRafInput');
  if (rafInput) {
    rafInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        kaydetSarfMalzemeRafBilgisi();
      } else if (e.key === 'Escape') {
        hideSarfMalzemeRafDuzenleFormu();
      }
    });
  }

  // Fotoğraf önizleme
  const fotografInput = document.getElementById('sarfMalzemeFotografInput');
  if (fotografInput) {
    fotografInput.addEventListener('change', function(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      if (file.size > 5 * 1024 * 1024) {
        document.getElementById('sarfMalzemeFotografError').textContent = 'Dosya boyutu 5MB\'dan küçük olmalıdır.';
        document.getElementById('sarfMalzemeFotografError').style.display = 'block';
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        document.getElementById('sarfMalzemeFotografError').textContent = 'Lütfen geçerli bir resim dosyası seçin.';
        document.getElementById('sarfMalzemeFotografError').style.display = 'block';
        return;
      }
      
      document.getElementById('sarfMalzemeFotografError').style.display = 'none';
      
      const reader = new FileReader();
      reader.onload = function(e) {
        const imgElement = document.getElementById('sarfMalzemeFotografPreview');
        imgElement.src = e.target.result;
        document.getElementById('sarfMalzemeFotografPreviewContainer').style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }

  // Fotoğraf kaydet butonu
  const fotografKaydetBtn = document.getElementById('sarfMalzemeFotografKaydetBtn');
  if (fotografKaydetBtn) {
    fotografKaydetBtn.addEventListener('click', async function() {
      try {
        if (!currentPhotoSarfMalzemeId) {
          showErrorMessage('Hata', 'Sarf malzeme ID bulunamadı.');
          return;
        }
        
        const fileInput = document.getElementById('sarfMalzemeFotografInput');
        const file = fileInput.files[0];
        
        let base64Image = null;
        
        if (file) {
          if (file.size > 5 * 1024 * 1024) {
            showErrorMessage('Hata', 'Dosya boyutu 5MB\'dan küçük olmalıdır.');
            return;
          }
          
          if (!file.type.startsWith('image/')) {
            showErrorMessage('Hata', 'Lütfen geçerli bir resim dosyası seçin.');
            return;
          }
          
          base64Image = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
              } catch (error) {
                reject(error);
              }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
          });
        } else if (document.getElementById('sarfMalzemeFotografPreviewContainer').style.display !== 'block') {
          showErrorMessage('Hata', 'Lütfen bir fotoğraf seçin.');
          return;
        }
        
        const result = await window.electronAPI.invoke.database.updateSarfMalzemeFotograf(
          currentPhotoSarfMalzemeId, 
          base64Image
        );
        
        if (result.success) {
          showToast('Fotoğraf başarıyla kaydedildi.', 'success');
          closeModal('sarfMalzemeFotoModal');
          
          // Cache'i temizle
          sarfMalzemePhotoCache.delete(currentPhotoSarfMalzemeId);
          
          // Listeyi güncelle
          if (typeof loadSarfMalzemeListesi === 'function') {
            loadSarfMalzemeListesi();
          }
          
          if (typeof viewSarfMalzemeDetail === 'function') {
            viewSarfMalzemeDetail(currentPhotoSarfMalzemeId);
          }
        } else {
          showErrorMessage('Hata', 'Fotoğraf kaydedilirken bir hata oluştu: ' + result.message);
        }
      } catch (error) {
        console.error('Sarf malzeme fotoğraf kaydetme hatası:', error);
        showErrorMessage('Hata', 'Fotoğraf kaydedilirken bir hata oluştu: ' + error.message);
      }
    });
  }

  // Fotoğraf silme butonu
  const fotografSilBtn = document.getElementById('sarfMalzemeFotografSilBtn');
  if (fotografSilBtn) {
    fotografSilBtn.addEventListener('click', async function() {
      try {
        if (!currentPhotoSarfMalzemeId) {
          showErrorMessage('Hata', 'Sarf malzeme ID bulunamadı.');
          return;
        }
        
        const onay = await new Promise((resolve) => {
          Notiflix.Confirm.show(
            'Fotoğraf Silme',
            'Fotoğrafı silmek istediğinizden emin misiniz?',
            'Evet, sil',
            'İptal',
            function() {
              resolve(true);
            },
            function() {
              resolve(false);
            },
            {
              titleColor: '#6A0D0C',
              buttonOkBackgroundColor: '#6A0D0C',
              cssAnimationStyle: 'zoom'
            }
          );
        });
        
        if (!onay) return;
        
        const result = await window.electronAPI.invoke.database.updateSarfMalzemeFotograf(
          currentPhotoSarfMalzemeId, 
          null
        );
        
        if (result.success) {
          showToast('Fotoğraf başarıyla silindi.', 'success');
          
          // Cache'i temizle
          sarfMalzemePhotoCache.delete(currentPhotoSarfMalzemeId);
          
          closeModal('sarfMalzemeFotoModal');
          
          // Listeyi güncelle
          if (typeof loadSarfMalzemeListesi === 'function') {
            loadSarfMalzemeListesi();
          }
        } else {
          showErrorMessage('Hata', 'Fotoğraf silinirken bir hata oluştu: ' + result.message);
        }
      } catch (error) {
        console.error('Sarf malzeme fotoğraf silme hatası:', error);
        showErrorMessage('Hata', 'Fotoğraf silinirken bir hata oluştu.');
      }
    });
  }
});

// Global fonksiyonları window'a ekle
window.loadSarfMalzemeListesi = loadSarfMalzemeListesi;
window.saveSarfMalzeme = saveSarfMalzeme;
window.loadSarfMalzemeGirisGecmisi = loadSarfMalzemeGirisGecmisi;
window.openSarfMalzemeGirisGuncelleModal = openSarfMalzemeGirisGuncelleModal;
window.guncelleSarfMalzemeGirisi = guncelleSarfMalzemeGirisi;
window.kaydetSarfMalzemeGirisi = kaydetSarfMalzemeGirisi;
window.setupSarfMalzemeGirisButtons = setupSarfMalzemeGirisButtons;
window.deleteSarfMalzeme = deleteSarfMalzeme;
window.saveSarfMalzemeIslemi = saveSarfMalzemeIslemi;
window.viewSarfMalzemeDetail = viewSarfMalzemeDetail;
window.searchSarfMalzeme = searchSarfMalzeme;
window.deleteSarfMalzemeIslem = deleteSarfMalzemeIslem;
window.openSarfMalzemeIslemModal = openSarfMalzemeIslemModal;
window.loadSarfMalzemeStokGeriDonenler = loadSarfMalzemeStokGeriDonenler;
window.showSarfMalzemeRafDuzenleFormu = showSarfMalzemeRafDuzenleFormu;
window.hideSarfMalzemeRafDuzenleFormu = hideSarfMalzemeRafDuzenleFormu;
window.kaydetSarfMalzemeRafBilgisi = kaydetSarfMalzemeRafBilgisi;