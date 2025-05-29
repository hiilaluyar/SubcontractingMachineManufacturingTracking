async function editYariMamulIslem(islemId) {
    try {
      // Check if the item has already been edited
      if (isItemEdited('yari_mamul', islemId)) {
        // Get the operation that was performed
        const operation = getItemEditOperation('yari_mamul', islemId);
        
        // Show a message explaining why the item can't be edited again
        let message = 'Bu işlem daha önce düzenlenmiş.';
        
        if (operation === 'IskartaUrun') {
          message = 'Bu işlem daha önce ıskarta ürün olarak işaretlenmiş.';
        }
        
        Notiflix.Notify.info(message + ' Tekrar düzenlenemez.');
        return;
      }
      
      // API kontrolü
      if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
        console.error('Database invoke metodu bulunamadı');
        alert('İşlem bilgileri alınamadı. API erişimi yok.');
        return;
      }
    
      // İşlem bilgilerini al
      const yariMamulIslemResult = await window.electronAPI.invoke.database.getYariMamulIslemById(islemId);
      
      if (yariMamulIslemResult.success) {
        const islem = yariMamulIslemResult.islem;
        
        // Global değişkene işlem türünü kaydet (updateIslem fonksiyonu için)
        window.currentIslemType = 'yari_mamul';
        
        // Modal başlığını güncelle
        document.getElementById('islemDuzenleHeader').textContent = `İşlem Düzenle (#${islemId})`;
        
        // Form alanlarını doldur
        document.getElementById('duzenleIslemTuru').value = islem.islem_turu;
        document.getElementById('duzenleKullanimAlani').value = islem.kullanim_alani;
        
        // İkincil stok seçimi kısmı kaldırıldı
        
        // Iskarta ürün container'ı kontrol ediliyor ve varsa gösteriliyor
        const iskartaUrunContainer = document.getElementById('duzenleIskartaUrunSecimiContainer');
        if (iskartaUrunContainer) {
          iskartaUrunContainer.style.display = 'block';
          document.getElementById('duzenleIskartaUrunSecimi').checked = islem.iskarta_urun === 1 || false;
        }
        
        // Proje listesini yükle
        loadProjeler().then(() => {
          // Proje seçimi için dropdown'ı güncelle
          const projeSecimi = document.getElementById('duzenleProjeSecimi');
          projeSecimi.innerHTML = '<option value="">-- Proje Seçin --</option>';
          
          // Projeleri yükle
          const projeler = document.getElementById('projeSecimi').options;
          for (let i = 1; i < projeler.length; i++) {
            const option = document.createElement('option');
            option.value = projeler[i].value;
            option.textContent = projeler[i].textContent;
            
            // Mevcut proje seçili olsun
            if (projeler[i].value == islem.proje_id) {
              option.selected = true;
            }
            
            projeSecimi.appendChild(option);
          }
        });
        
        // İşlem ID'sini gizli bir form elemanında sakla
        document.getElementById('duzenleIslemId').value = islem.id;
        
        // Modalı aç
        openModal('islemDuzenleModal');
      } else {
        alert('İşlem bilgileri alınamadı: ' + yariMamulIslemResult.message);
      }
    } catch (error) {
      console.error('İşlem bilgileri alınırken hata:', error);
      alert('İşlem bilgileri alınırken bir hata oluştu.');
    }
  }

  async function deleteYariMamul(id) {
  try {
    // Yarı mamul bilgilerini al
    const result = await window.electronAPI.invoke.database.getYariMamulById(id);
    
    if (!result.success) {
      alert('Yarı mamul bilgileri alınamadı: ' + result.message);
      return;
    }
    
    const yariMamul = result.yariMamul;
    
    // Şu anki kullanıcı bilgisini al (global değişkenden)
    if (!window.globalUserData) {
      alert('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }
    
    // Yönetici kontrolü
    if (window.globalUserData.rol !== 'yonetici') {
      alert('Bu işlem için yönetici yetkisi gereklidir!');
      return;
    }
    
    // Malzeme adını formatla
    let itemName = yariMamul.malzeme_adi;
    if (yariMamul.stok_kodu) {
      itemName += ` (${yariMamul.stok_kodu})`;
    }
    
    // Silme modalını göster
    window.showDeleteConfirmationModal({
      title: 'Yarı Mamul Silme İşlemi',
      message: `"${itemName}" yarı mamulünü silmek istediğinizden emin misiniz?`,
      itemName: itemName,
      itemType: 'Yarı Mamul',
      itemId: id,
      userData: window.globalUserData,
      onConfirm: async (reason) => {
        // Silme işlemini gerçekleştir
        const result = await window.electronAPI.invoke.database.deleteYariMamulWithNotification(
          id, 
          reason,
          window.globalUserData
        );
        
        if (result.success) {
          // Başarılı ise listeyi güncelle
          loadYariMamulListesi();
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
    console.error('Yarı mamul silme hatası:', error);
    alert('Yarı mamul silinirken bir hata oluştu: ' + error.message);
  }
}


  // Yarı mamul listesi yükleme
async function loadYariMamulListesi() {
  try {
      console.log('Yarı mamul listesi yükleniyor...');
      
      // API kontrolü
      if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
          console.error('Database invoke metodu bulunamadı');
          
          const yariMamulTable = document.getElementById('yariMamulTable').getElementsByTagName('tbody')[0];
          yariMamulTable.innerHTML = '<tr><td colspan="7" class="text-center">Veri yüklenirken hata oluştu</td></tr>';
          return;
      }

      // Yarı mamülleri al
      const result = await window.electronAPI.invoke.database.getAllYariMamuller();
      
      // Tabloyu doldur
      const yariMamulTable = document.getElementById('yariMamulTable').getElementsByTagName('tbody')[0];
      yariMamulTable.innerHTML = '';
      
      if (!result.success || result.yariMamuller.length === 0) {
          const row = yariMamulTable.insertRow();
          row.innerHTML = '<tr><td colspan="7" class="text-center">Yarı mamul bulunamadı</td></tr>';
          return;
      }
      
      // Kullanıcı yetki kontrolü
      const isUserAdmin = window.globalUserData && window.globalUserData.rol === 'yonetici';
      
      result.yariMamuller.forEach(yariMamul => {
          const row = yariMamulTable.insertRow();
          
          // Stok Kodu
          row.insertCell(0).textContent = yariMamul.stok_kodu;
          
          // Malzeme Adı
          row.insertCell(1).textContent = yariMamul.malzeme_adi;
          
          // Kalan Miktar (birim ile birlikte)
          row.insertCell(2).textContent = `${Number(yariMamul.kalan_miktar).toFixed(2)} ${yariMamul.birim}`;
          
          // Barkod
          row.insertCell(3).textContent = yariMamul.barkod;
          
          // Durumu
          const durumCell = row.insertCell(4);
          let durumText = '';
          let durumClass = '';
          
          switch (yariMamul.durum) {
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
          
          durumCell.innerHTML = `<span class="${durumClass}">${durumText}</span>`;
          
          // İşlemler - Yetki kontrolü ile birlikte
          const islemlerCell = row.insertCell(5);
          
          let islemlerHtml = `<div class="action-buttons">`;

          // Görüntüleme butonu - herkes kullanabilir
          islemlerHtml += `
              <button class="action-btn view" onclick="viewYariMamulDetail(${yariMamul.id})">
                  <i class="fas fa-eye"></i>
              </button>
          `;

          // İşlem yap butonu (kesme ikonu) - sadece yöneticiler kullanabilir
          if (isUserAdmin) {
              islemlerHtml += `
                  <button class="action-btn process" onclick="openYariMamulIslemModal(${yariMamul.id})">
                      <i class="fas fa-cut"></i>
                  </button>
              `;
          } else {
              islemlerHtml += `
                  <button class="action-btn process disabled" disabled title="Bu işlem için yönetici yetkisi gereklidir">
                      <i class="fas fa-cut" style="color: #ccc;"></i>
                  </button>
              `;
          }

          // Fotoğraf butonu - herkes kullanabilir (sadece görüntüleme)
          islemlerHtml += `
              <button class="action-btn photo" onclick="handleYariMamulPhoto(${yariMamul.id})" style="background-color: #607D8B; border: 1px solid #455A64; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
                  <i class="fas fa-file-image" style="color: white;"></i>
              </button>
          `;

          // Silme butonu - sadece yöneticiler kullanabilir
          if (isUserAdmin) {
              islemlerHtml += `
                  <button class="action-btn delete" onclick="deleteYariMamul(${yariMamul.id})">
                      <i class="fas fa-trash"></i>
                  </button>
              `;
          } else {
              islemlerHtml += `
                  <button class="action-btn delete disabled" disabled title="Bu işlem için yönetici yetkisi gereklidir">
                      <i class="fas fa-trash" style="color: #ccc;"></i>
                  </button>
              `;
          }

          islemlerHtml += `</div>`;
          islemlerCell.innerHTML = islemlerHtml;
      });
  } catch (error) {
      console.error('Yarı mamul listesi yükleme hatası:', error);
      
      const yariMamulTable = document.getElementById('yariMamulTable').getElementsByTagName('tbody')[0];
      yariMamulTable.innerHTML = '<tr><td colspan="7" class="text-center">Veri yüklenirken hata oluştu</td></tr>';
  }
}

async function viewYariMamulDetail(id) {
  try {
      // API kontrolü
      if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
          console.error('Database invoke metodu bulunamadı');
          return;
      }

      currentYariMamulId = id;

      // Detay bilgilerini al
      const result = await window.electronAPI.invoke.database.getYariMamulById(id);
      
      if (!result.success) {
          console.error('Yarı mamul detayı alınamadı:', result.message);
          return;
      }

      const yariMamul = result.yariMamul;
      const islemler = result.islemler;
      const ekleyen = result.ekleyen;

      // Detay bilgilerini doldur
      const detayContainer = document.getElementById('yariMamulDetay');
      
      // HTML içeriğini oluştur - fotoğraf kısmı tamamen kaldırıldı
      let detayHTML = `
          <div class="detay-row">
              <div class="detay-label">Stok Kodu:</div>
              <div class="detay-value">${yariMamul.stok_kodu}</div>
          </div>
          <div class="detay-row">
              <div class="detay-label">Malzeme Adı:</div>
              <div class="detay-value">${yariMamul.malzeme_adi}</div>
          </div>
          <div class="detay-row">
              <div class="detay-label">Birim:</div>
              <div class="detay-value">${yariMamul.birim}</div>
          </div>
          <div class="detay-row">
              <div class="detay-label">Toplam Miktar:</div>
              <div class="detay-value">${Number(yariMamul.toplam_miktar).toFixed(2)} ${yariMamul.birim}</div>
          </div>
          <div class="detay-row">
              <div class="detay-label">Kalan Miktar:</div>
              <div class="detay-value">${Number(yariMamul.kalan_miktar).toFixed(2)} ${yariMamul.birim}</div>
          </div>
          <div class="detay-row">
              <div class="detay-label">Barkod:</div>
              <div class="detay-value">${yariMamul.barkod}</div>
          </div>
          <div class="detay-row">
              <div class="detay-label">Kritik Seviye:</div>
              <div class="detay-value">${Number(yariMamul.kritik_seviye || 0).toFixed(2)} ${yariMamul.birim}</div>
          </div>
          <div class="detay-row">
              <div class="detay-label">Ekleyen:</div>
              <div class="detay-value">${ekleyen ? `${ekleyen.ad} ${ekleyen.soyad}` : 'Bilinmiyor'}</div>
          </div>
          <div class="detay-row">
              <div class="detay-label">Ekleme Tarihi:</div>
              <div class="detay-value">${new Date(yariMamul.ekleme_tarihi).toLocaleString('tr-TR')}</div>
          </div>
      `;
      
      // HTML içeriğini detay konteynerine ekle
      detayContainer.innerHTML = detayHTML;

      // İşlem geçmişi tablosunu doldur
      const islemGecmisiTable = document.getElementById('yariMamulIslemGecmisiTable').getElementsByTagName('tbody')[0];
      islemGecmisiTable.innerHTML = '';

      if (islemler.length === 0) {
          const row = islemGecmisiTable.insertRow();
          row.innerHTML = '<td colspan="6" class="text-center">İşlem geçmişi bulunamadı</td>';
      } else {
          islemler.forEach(islem => {
              // Eğer işlem "İade" ve kullanım alanı "StokGeriYukleme" ise, bu işlemi gösterme
              // Bu işlemler artık ayrı bir tabda gösterilecek
              if (islem.islem_turu === 'İade' && islem.kullanim_alani === 'StokGeriYukleme') {
                  return; // bu işlemi atla
              }
              
              const row = islemGecmisiTable.insertRow();
              
              // Tarih
              const cell1 = row.insertCell(0);
              const date = new Date(islem.islem_tarihi);
              cell1.textContent = date.toLocaleString('tr-TR');
              
              // İşlem Türü
              const cell2 = row.insertCell(1);
              cell2.textContent = islem.islem_turu;
              
              // Miktar
              const cell3 = row.insertCell(2);
              cell3.textContent = `${Number(islem.miktar).toFixed(2)} ${yariMamul.birim}`;
              
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
                      cell4.textContent = islem.kullanim_alani || '-';
              }
              
              // Proje
              const cell5 = row.insertCell(4);
              cell5.textContent = islem.proje_adi || 'Belirtilmemiş';
              
              // Kullanıcı
              const cell6 = row.insertCell(5);
              cell6.textContent = `${islem.kullanici_ad} ${islem.kullanici_soyad}`;
          });
      }

      // Malzeme Giriş Geçmişi tabını yükle
      loadYariMamulGirisGecmisi(id);
      
      // Stoğa Geri Dönenler tabını yükle
      loadYariMamulStokGeriDonenler(id);

      // Modalı aç
      openModal('yariMamulDetayModal');
      
      // İlk tab'ı aktif et
      document.querySelectorAll('.tab-button').forEach(button => {
          button.classList.remove('active');
      });
      document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
      });
      
      // İşlem geçmişi tabını aktif et
      document.querySelector('.tab-button[data-tab="yari-mamul-islem-gecmisi-tab"]').classList.add('active');
      document.getElementById('yari-mamul-islem-gecmisi-tab').classList.add('active');
      
      // Tab sistemini kur
      setupTabSystem();
  } catch (error) {
      console.error('Yarı mamul detayı görüntüleme hatası:', error);
  }
}

function openFullSizeImage(base64Image) {
  try {
    // Base64 string'i decode et
    const decodedImage = decodeURIComponent(base64Image);
    
    // Base64 kontrolü yap
    const imgSrc = decodedImage.startsWith('data:image') ? 
        decodedImage : 
        `data:image/jpeg;base64,${decodedImage}`;
    
    // Tam boyutlu görüntü için modal oluştur
    if (!document.getElementById('fullSizeImageModal')) {
      const modalHTML = `
        <div id="fullSizeImageModal" class="modal">
          <div class="modal-content" style="max-width: 90%; height: auto;">
            <div class="modal-header">
              <span class="close" onclick="closeModal('fullSizeImageModal')">&times;</span>
            </div>
            <div class="modal-body" style="text-align: center;">
              <img id="fullSizeImg" style="max-width: 100%; max-height: 80vh;" />
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Resmi ayarla ve modalı aç
    document.getElementById('fullSizeImg').src = imgSrc;
    openModal('fullSizeImageModal');
  } catch (error) {
    console.error('Fotoğraf görüntüleme hatası:', error);
    showErrorMessage('Hata', 'Fotoğraf görüntülenirken bir hata oluştu.');
  }
}


// Yarı mamul işlem modalını açma
async function openYariMamulIslemModal(id) {
    try {
        currentYariMamulId = id;
        
        // Yarı mamul bilgilerini al
        const result = await window.electronAPI.invoke.database.getYariMamulById(id);
        
        if (!result.success) {
            console.error('Yarı mamul bilgileri alınamadı:', result.message);
            showErrorMessage('Hata', 'Yarı mamul bilgileri alınamadı.');
            return;
        }
        
        const yariMamul = result.yariMamul;
        
        // Başlığı güncelle
        document.getElementById('yariMamulIslemHeader').textContent = yariMamul.malzeme_adi;
        
        // Proje listesini yükle
        loadProjeler().then(() => {
            // Proje seçimi için dropdown'ı güncelle
            const projeSecimi = document.getElementById('yariMamulProjeSecimi');
            if (projeSecimi) {
                projeSecimi.innerHTML = '<option value="">-- Proje Seçin --</option>';
                
                // Projeleri yükle
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
            
            // Çalışan listesini yükle
            loadCalisanlar();
            
            // Modalı aç
            openModal('yariMamulIslemModal');
            
            // Eğer detay modalı açıksa kapat
            closeModal('yariMamulDetayModal');
            
            // Makine-Çalışan bölümünü kontrol et (görünürlüğünü ayarla)
            toggleYariMamulMakineSection();
        });
    } catch (error) {
        console.error('Yarı mamul işlem modalı açma hatası:', error);
        showErrorMessage('Hata', 'İşlem modalı açılırken bir hata oluştu.');
    }
}






// Yarı mamul işlemi kaydetme
async function saveYariMamulIslemi() {
    // Form değerlerini al
    const miktar = parseFloat(document.getElementById('yariMamulKullanilanMiktar').value);
    const islemTuru = document.getElementById('yariMamulIslemTuru').value;
    const kullanimAlani = document.getElementById('yariMamulKullanimAlani').value;
    const projeId = document.getElementById('yariMamulProjeSecimi').value;
    
    // Makine ve çalışan bilgilerini al
    const makine = document.getElementById('yariMamulMakineSecimi').value;
    const calisanId = document.getElementById('yariMamulCalisanSecimi').value;
    
    // Doğrulama
    if (!miktar || miktar <= 0) {
        showModalError('yariMamulIslemModal', 'Lütfen geçerli bir miktar girin.');
        return;
    }
    
    // Eğer kullanım alanı FasonImalat veya MakineImalat ise proje zorunlu
    if ((kullanimAlani === 'FasonImalat' || kullanimAlani === 'MakineImalat') && !projeId) {
        showModalError('yariMamulIslemModal', 'Lütfen bir proje seçin veya yeni bir proje oluşturun.');
        return;
    }
    
    // Eğer MakineImalat ise, makine seçim kontrolü
    if (kullanimAlani === 'MakineImalat' && !makine) {
        showModalError('yariMamulIslemModal', 'Lütfen bir makine seçin.');
        return;
    }
    
    try {
        // API kontrolü
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            showErrorMessage('Hata', 'İşlem kaydedilemedi. API erişimi yok.');
            return;
        }

        // İşlem verisi
        const islemData = {
            yari_mamul_id: currentYariMamulId,
            islem_turu: islemTuru,
            kullanim_alani: kullanimAlani,
            miktar: miktar,
            proje_id: projeId || null,
            kullanici_id: currentUser.id,
            makine: kullanimAlani === 'MakineImalat' ? makine : null,
            alan_calisan_id: kullanimAlani === 'MakineImalat' && calisanId ? calisanId : null
        };
        
        // İşlem kaydediliyor mesajını göster
        showModalSuccess('yariMamulIslemModal', 'İşlem kaydediliyor...');
        
        // İşlemi kaydet
        const result = await window.electronAPI.invoke.database.addYariMamulIslemi(islemData);
        
        if (result.success) {
            showToast('İşlem başarıyla kaydedildi.', 'success');
            
            // İşlem modalını kapat
            closeModal('yariMamulIslemModal');
            
            // Formu sıfırla
            document.getElementById('yariMamulKullanilanMiktar').value = '';
            
            // Dashboard'ı güncelle
            updateDashboard();
            
            // Yarı mamul listesini güncelle
            await loadYariMamulListesi();
            
            // Kullanım alanına göre ilgili sayfaya geçiş yap
            if (kullanimAlani === 'FasonImalat' || kullanimAlani === 'MakineImalat') {
                // Tüm sayfaları gizle
                document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
                
                // Kullanım alanına göre ilgili sayfayı göster
                const targetPage = kullanimAlani === 'FasonImalat' ? 'fason-imalat' : 'makine-imalat';
                document.getElementById(targetPage).classList.add('active');
                
                // Yan menüdeki aktif linki de güncelle
                const navLinks = document.querySelectorAll('.nav-links li a');
                navLinks.forEach(l => l.parentElement.classList.remove('active'));
                document.querySelector(`a[data-page="${targetPage}"]`).parentElement.classList.add('active');
                
                // İlgili sayfanın verilerini güncelle
                if (kullanimAlani === 'FasonImalat') {
                    loadFasonIslemler();
                } else {
                    loadMakineIslemler();
                }
            }
            
            // Yarı mamul detayını yeniden yükle (eğer açıksa)
            if (currentYariMamulId) {
                viewYariMamulDetail(currentYariMamulId);
            }
        } else {
            showErrorMessage('İşlem Hatası', 'Hata: ' + result.message);
        }
    } catch (error) {
        console.error('İşlem kaydetme hatası:', error);
        showErrorMessage('İşlem Hatası', 'İşlem kaydedilirken bir hata oluştu: ' + error.message);
    }
}




// Sayfa yüklendiğinde event listenerları ekleyelim
document.addEventListener('DOMContentLoaded', function() {
    // Diğer event listenerlar...
    
    // Yarı mamul işlem modalı için event listenerlar
    document.getElementById('yariMamulKullanimAlani').addEventListener('change', toggleYariMamulMakineSection);
    document.getElementById('yariMamulIslemKaydetBtn').addEventListener('click', saveYariMamulIslemi);
    
    // İlk yüklemede bir kez çağıralım
    toggleYariMamulMakineSection();
});

// Yarı mamul arama
function searchYariMamul() {
  // Arama değerlerini al
  const searchText = document.getElementById('yariMamulAra').value.toLowerCase().trim();
  const durumSecimi = document.getElementById('yariMamulDurumSecimi').value;
  
  // Tablo satırlarını al
  const rows = document.getElementById('yariMamulTable').getElementsByTagName('tbody')[0].rows;
  
  // Her satırı kontrol et
  for (let i = 0; i < rows.length; i++) {
      const stokKodu = rows[i].cells[0].textContent.toLowerCase();
      const malzemeAdi = rows[i].cells[1].textContent.toLowerCase();
      const barkod = rows[i].cells[3].textContent.toLowerCase();
      
      // Durumu al
      const durumCell = rows[i].cells[4];
      const durumText = durumCell.textContent.trim();
      let durumDegeri = '';
      
      if (durumText.includes('Stokta Var')) {
          durumDegeri = 'STOKTA_VAR';
      } else if (durumText.includes('Az Kaldı')) {
          durumDegeri = 'AZ_KALDI';
      } else if (durumText.includes('Stokta Yok')) {
          durumDegeri = 'STOKTA_YOK';
      }
      
      // Arama koşullarını kontrol et
      const textMatch = 
          searchText === '' || 
          stokKodu.includes(searchText) || 
          malzemeAdi.includes(searchText) || 
          barkod.includes(searchText);
      
      const durumMatch = 
          durumSecimi === '' || 
          durumDegeri === durumSecimi;
      
      // Tüm kriterlere uyuyorsa satırı göster, uymuyorsa gizle
      rows[i].style.display = (textMatch && durumMatch) ? '' : 'none';
  }
}


// Event listener'ları için fonksiyon
function setupSearchEventListeners() {
    // Sarf malzeme arama
    const sarfMalzemeAra = document.getElementById('sarfMalzemeAra');
    const sarfMalzemeDurumSecimi = document.getElementById('sarfMalzemeDurumSecimi');
    const sarfMalzemeAraBtn = document.getElementById('sarfMalzemeAraBtn');
    
    if (sarfMalzemeAra) {
        sarfMalzemeAra.addEventListener('input', searchSarfMalzeme);
        sarfMalzemeAra.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') searchSarfMalzeme();
        });
    }
    
    if (sarfMalzemeDurumSecimi) {
        sarfMalzemeDurumSecimi.addEventListener('change', searchSarfMalzeme);
    }
    
    if (sarfMalzemeAraBtn) {
        sarfMalzemeAraBtn.addEventListener('click', searchSarfMalzeme);
    }
    
    // Yarı mamul arama
    const yariMamulAra = document.getElementById('yariMamulAra');
    const yariMamulDurumSecimi = document.getElementById('yariMamulDurumSecimi');
    const yariMamulAraBtn = document.getElementById('yariMamulAraBtn');
    
    if (yariMamulAra) {
        yariMamulAra.addEventListener('input', searchYariMamul);
        yariMamulAra.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') searchYariMamul();
        });
    }
    
    if (yariMamulDurumSecimi) {
        yariMamulDurumSecimi.addEventListener('change', searchYariMamul);
    }
    
    if (yariMamulAraBtn) {
        yariMamulAraBtn.addEventListener('click', searchYariMamul);
    }
    
    
  }

// DOM yüklendiğinde event listener'ları kur
document.addEventListener('DOMContentLoaded', setupSearchEventListeners);




// Event listener'ları ekle
function setupYariMamulEventListeners() {
  console.log('Yarı mamul event listener\'ları ayarlanıyor...');
  
  // Sayfa yükleme listener'ı
  document.addEventListener('DOMContentLoaded', function() {
      const yariMamulSayfasi = document.querySelector('a[data-page="yari-mamul-listesi"]');
      if (yariMamulSayfasi) {
          yariMamulSayfasi.addEventListener('click', function() {
              loadYariMamulListesi();
          });
      }
      
      // İşlem modalında yarı mamul panelini gösterme/gizleme
      const kullanimAlaniSelect = document.getElementById('kullanimAlani');
      if (kullanimAlaniSelect) {
          kullanimAlaniSelect.addEventListener('change', toggleYariMamulPanel);
      }
      
      // Yarı mamul işlem butonu
      const yariMamulIslemYapBtn = document.getElementById('yariMamulIslemYapBtn');
      if (yariMamulIslemYapBtn) {
          yariMamulIslemYapBtn.addEventListener('click', function() {
              openYariMamulIslemModal(currentYariMamulId);
          });
      }
      
      // Yarı mamul işlem kaydet butonu
      const yariMamulIslemKaydetBtn = document.getElementById('yariMamulIslemKaydetBtn');
      if (yariMamulIslemKaydetBtn) {
          yariMamulIslemKaydetBtn.addEventListener('click', saveYariMamulIslemi);
      }
      
      // Yarı mamul arama
      const yariMamulAraBtn = document.getElementById('yariMamulAraBtn');
      const yariMamulAra = document.getElementById('yariMamulAra');
      const yariMamulDurumSecimi = document.getElementById('yariMamulDurumSecimi');
      
      if (yariMamulAraBtn) {
          yariMamulAraBtn.addEventListener('click', searchYariMamul);
      }
      
      if (yariMamulAra) {
          yariMamulAra.addEventListener('keyup', function(e) {
              if (e.key === 'Enter') searchYariMamul();
          });
      }
      
      if (yariMamulDurumSecimi) {
          yariMamulDurumSecimi.addEventListener('change', searchYariMamul);
      }
      
      // Yeni proje butonu (yarı mamul işlem modalındaki)
      const yariMamulYeniProjeEkleBtn = document.getElementById('yariMamulYeniProjeEkleBtn');
      if (yariMamulYeniProjeEkleBtn) {
          yariMamulYeniProjeEkleBtn.addEventListener('click', function() {
              // İşlem modalını kapat
              closeModal('yariMamulIslemModal');
              
              // Yeni proje modalini aç
              openModal('yeniProjeModal');
          });
      }
  });
}



async function loadYariMamulGirisGecmisi(yariMamulId) {
  try {
      if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
          console.error('Database invoke metodu bulunamadı');
          return;
      }

      const result = await window.electronAPI.invoke.database.getYariMamulGirisGecmisi(yariMamulId);

      const girisGecmisiTable = document.getElementById('yariMamulGirisGecmisiTable').getElementsByTagName('tbody')[0];
      girisGecmisiTable.innerHTML = '';

      if (!result.success || !result.girisGecmisi || result.girisGecmisi.length === 0) {
          const row = girisGecmisiTable.insertRow();
          row.innerHTML = '<td colspan="5" class="text-center">Giriş geçmişi bulunamadı</td>';
          return;
      }

      // Tarihe göre sırala (en yeni en üstte)
      const sortedGirisGecmisi = result.girisGecmisi
          .sort((a, b) => new Date(b.giris_tarihi) - new Date(a.giris_tarihi));

      sortedGirisGecmisi.forEach(giris => {
          const row = girisGecmisiTable.insertRow();

          // Tarih
          const cell1 = row.insertCell(0);
          const date = new Date(giris.giris_tarihi);
          cell1.textContent = date.toLocaleString('tr-TR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
          });

          // Miktar
          const cell2 = row.insertCell(1);
          cell2.textContent = Number(giris.miktar).toFixed(2);

          // Birim
          const cell3 = row.insertCell(2);
          cell3.textContent = giris.birim || 'adet';

          // Kaynak
          const cell4 = row.insertCell(3);
          if (giris.hammadde_id) {
              cell4.textContent = giris.hammadde_kodu;
          } else {
              cell4.textContent = 'Kullanıcı Girişi';
          }

          // Ekleyen (Ad Soyad)
          const cell5 = row.insertCell(4);
          const adSoyad = `${giris.kullanici_ad || ''} ${giris.kullanici_soyad || ''}`.trim();
          cell5.textContent = adSoyad || 'Bilinmiyor';
      });

  } catch (error) {
      console.error('Yarı mamul giriş geçmişi yükleme hatası:', error);

      const girisGecmisiTable = document.getElementById('yariMamulGirisGecmisiTable').getElementsByTagName('tbody')[0];
      girisGecmisiTable.innerHTML = '';

      const row = girisGecmisiTable.insertRow();
      row.innerHTML = '<td colspan="5" class="text-center">Giriş geçmişi yüklenirken hata oluştu</td>';
  }
}



async function saveYariMamulEkle(e) {
  if (e) e.preventDefault();
  
  // Form değerlerini al
  const malzemeAdi = document.getElementById('yariMamulEkleAdi').value.trim();
  const birim = document.getElementById('yariMamulEkleBirim').value;
  const miktar = parseFloat(document.getElementById('yariMamulEkleMiktar').value);
  const kritikSeviye = parseFloat(document.getElementById('yariMamulEkleKritikSeviye').value);
  
  // Validation
  if (!malzemeAdi) {
      showToast('Lütfen malzeme adı girin.', 'error');
      return;
  }
  
  if (!miktar || miktar <= 0) {
      showToast('Lütfen geçerli bir miktar girin.', 'error');
      return;
  }
  
  if (!kritikSeviye || kritikSeviye < 0) {
      showToast('Lütfen geçerli bir kritik seviye girin.', 'error');
      return;
  }
  
  try {
      // API kontrolü
      if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
          console.error('Database invoke metodu bulunamadı');
          showToast('Yarı mamul eklenemedi. API erişimi yok.', 'error');
          return;
      }
      
      // Aynı isim ve birimde yarı mamul var mı kontrol et
      const checkResult = await window.electronAPI.invoke.database.checkYariMamulExists(malzemeAdi, birim);
      
      if (checkResult.success && checkResult.exists) {
          // Notiflix ile onay mesajı göster
          const doContinue = await new Promise((resolve) => {
              Notiflix.Confirm.show(
                  'Onaylıyor musunuz?',
                  `"${malzemeAdi}" adlı yarı mamul zaten mevcut. Bu yarı mamule giriş kaydı eklemek ister misiniz?`,
                  'Evet, ekle!',
                  'İptal',
                  function() {
                      resolve(true); // Evet tıklanırsa
                  },
                  function() {
                      resolve(false); // İptal tıklanırsa
                  },
                  {
                      titleColor: '#6A0D0C',
                      buttonOkBackgroundColor: '#6A0D0C',
                      cssAnimationStyle: 'zoom'
                  }
              );
          });

          if (doContinue) {
              // Yarı mamul girişi kaydet
              const girisData = {
                  yari_mamul_id: checkResult.yariMamul.id,
                  miktar: miktar,
                  birim: birim,
                  ekleyen_id: currentUser.id,
                  kritik_seviye: kritikSeviye
              };
              
              const girisResult = await window.electronAPI.invoke.database.kaydetYariMamulGirisi(girisData);
              
              if (girisResult.success) {
                  showToast('Yarı mamul girişi başarıyla kaydedildi.', 'success');
                  document.getElementById('yariMamulEkleForm').reset();
                  await loadYariMamulListesi();
              } else {
                  showToast('Hata: ' + girisResult.message, 'error');
              }
          }
          
          return;
      }
      
      // Yeni yarı mamul ekle
      const yariMamulData = {
          malzeme_adi: malzemeAdi,
          birim: birim,
          miktar: miktar,
          kritik_seviye: kritikSeviye,
          ekleyen_id: currentUser ? currentUser.id : 1
      };
      
      const result = await window.electronAPI.invoke.database.addYariMamul(yariMamulData);
      
      if (result.success) {
          showToast(`Yarı mamul başarıyla eklendi.\nStok Kodu: ${result.stokKodu}\nBarkod: ${result.barkod}`, 'success');
          
          // Formu temizle
          document.getElementById('yariMamulEkleForm').reset();
          
          // Dashboard'ı güncelle
          updateDashboard();
          
          // Yarı mamul listesi sayfasına geçiş yapılıyor
          setTimeout(() => {
              // Yarı mamul listesi güncelleme
              loadYariMamulListesi();
              
              // Yarı mamul listesi sayfasına geçiş yap
              document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
              document.getElementById('yari-mamul-listesi').classList.add('active');

              // Yan menüdeki aktif linki de güncelleyelim
              const navLinks = document.querySelectorAll('.nav-links li a');
              navLinks.forEach(l => l.parentElement.classList.remove('active'));
              document.querySelector('a[data-page="yari-mamul-listesi"]').parentElement.classList.add('active');
              
              // Yeni eklenen ürünü vurgula
              setTimeout(() => {
                  const rows = document.getElementById('yariMamulTable').querySelectorAll('tbody tr');
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
          }, 1000);
      } else {
          showToast('Hata: ' + result.message, 'error');
      }
  } catch (error) {
      console.error('Yarı mamul ekleme hatası:', error);
      showToast('Yarı mamul eklenirken bir hata oluştu: ' + error.message, 'error');
  }
}




// Yeni giriş için modal açma
async function openYariMamulGirisModal(yariMamulId) {
  try {
      // Yarı mamul ID'sini set et
      currentYariMamulId = yariMamulId;
      
      // Yarı mamul bilgilerini al
      const result = await window.electronAPI.invoke.database.getYariMamulById(yariMamulId);
      
      if (!result.success) {
          showErrorMessage('Hata', 'Yarı mamul bilgileri alınamadı: ' + result.message);
          return;
      }
      
      const yariMamul = result.yariMamul;
      
      // Form elementlerini ayarla
      document.getElementById('yariMamulGirisYariMamulId').value = yariMamulId;
      
      // Mevcut kritik seviye değerini forma ekle
      document.getElementById('yariMamulGirisKritikSeviye').value = yariMamul.kritik_seviye || 0;
      
      // Başlığı güncelle
      document.getElementById('yariMamulGirisModalHeader').textContent = `${yariMamul.malzeme_adi} - Yeni Giriş`;
      
      // Modalı aç
      openModal('yariMamulGirisModal');
      
      // Miktar alanına odaklan
      setTimeout(() => {
          document.getElementById('yariMamulGirisMiktar').focus();
      }, 300);
      
  } catch (error) {
      console.error('Yarı mamul giriş modalı açma hatası:', error);
      showErrorMessage('Hata', 'Yarı mamul giriş modalı açılırken bir hata oluştu.');
  }
}





// Yarı mamul giriş verilerini kaydet
async function kaydetYariMamulGirisi() {
  try {
      // Form değerlerini al
      const yariMamulId = document.getElementById('yariMamulGirisYariMamulId').value;
      const miktar = parseFloat(document.getElementById('yariMamulGirisMiktar').value);
      const kritikSeviye = parseFloat(document.getElementById('yariMamulGirisKritikSeviye').value);
      
      // Validation
      if (!miktar || miktar <= 0) {
          showModalError('yariMamulGirisModal', 'Lütfen geçerli bir miktar girin.');
          return;
      }
      
      if (kritikSeviye < 0) {
          showModalError('yariMamulGirisModal', 'Kritik seviye negatif olamaz.');
          return;
      }
      
      // API kontrolü
      if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
          console.error('Database invoke metodu bulunamadı');
          showErrorMessage('Hata', 'İşlem kaydedilemedi. API erişimi yok.');
          return;
      }
      
      // Yarı mamul bilgilerini al
      const yariMamulResult = await window.electronAPI.invoke.database.getYariMamulById(yariMamulId);
      
      if (!yariMamulResult.success) {
          showErrorMessage('Hata', 'Yarı mamul bilgileri alınamadı: ' + yariMamulResult.message);
          return;
      }
      
      const yariMamul = yariMamulResult.yariMamul;
      
      // Giriş verisi
      const girisData = {
          yari_mamul_id: yariMamulId,
          miktar: miktar,
          birim: yariMamul.birim,
          kritik_seviye: kritikSeviye,
          ekleyen_id: currentUser.id
      };
      
      // İşlem kaydediliyor mesajını göster
      showModalSuccess('yariMamulGirisModal', 'Giriş kaydediliyor...');
      
      // Girişi kaydet
      const result = await window.electronAPI.invoke.database.kaydetYariMamulGirisi(girisData);
      
      if (result.success) {
          showToast('Yarı mamul girişi başarıyla kaydedildi.', 'success');
          
          // Giriş modalını kapat
          closeModal('yariMamulGirisModal');
          
          // Formu sıfırla
          document.getElementById('yariMamulGirisForm').reset();
          
          // Dashboard'ı güncelle
        updateDashboard();
          
          // Yarı mamul listesini güncelle
          await loadYariMamulListesi();
          
          // Yarı mamul detayını yeniden yükle
          if (currentYariMamulId) {
              await viewYariMamulDetail(currentYariMamulId);
          }
      } else {
          showToast('Hata: ' + (result.message || 'Bilinmeyen bir hata oluştu'), 'error');
      }
  } catch (error) {
      console.error('Yarı mamul girişi kaydetme hatası:', error);
      showErrorMessage('İşlem Hatası', 'Yarı mamul girişi kaydedilirken bir hata oluştu: ' + error.message);
  }
}

// Yeni eklediğimiz fonksiyonları yüklendiğinde çalışacak event listener'a ekle
document.addEventListener('DOMContentLoaded', function() {
  // Yarı mamul ekle formu kaydet butonu
  const yariMamulEkleKaydetBtn = document.getElementById('yariMamulEkleKaydetBtn');
  if (yariMamulEkleKaydetBtn) {
      yariMamulEkleKaydetBtn.addEventListener('click', function(e) {
          saveYariMamulEkle(e);
      });
  }
  
  // Yarı mamul giriş kaydet butonu
  const yariMamulGirisKaydetBtn = document.getElementById('yariMamulGirisKaydetBtn');
  if (yariMamulGirisKaydetBtn) {
      yariMamulGirisKaydetBtn.addEventListener('click', kaydetYariMamulGirisi);
  }
  
  // Yeni yarı mamul girişi butonu
  const yariMamulYeniGirisBtn = document.getElementById('yariMamulYeniGirisBtn');
  if (yariMamulYeniGirisBtn) {
      yariMamulYeniGirisBtn.addEventListener('click', function() {
          openYariMamulGirisModal(currentYariMamulId);
      });
  }
});

// setupYariMamulEventListeners();




async function deleteYariMamulIslem(islemId) {
  try {
    // İşlem hakkında bilgi al
    const islemResult = await window.electronAPI.invoke.database.getYariMamulIslemById(islemId);
    
    if (!islemResult.success) {
      throw new Error('İşlem bilgileri alınamadı: ' + islemResult.message);
    }
    
    const islem = islemResult.islem;
    const yariMamulId = islem.yari_mamul_id;
    
    // Silme işlemi için gerekli verileri hazırla
    const deleteData = {
      islemId: islemId,
      yariMamulId: yariMamulId,
      miktar: islem.miktar
    };
    
    // İşlemi sil ve yarı mamul stoğunu güncelle
    const result = await window.electronAPI.invoke.database.deleteYariMamulIslemAndRestoreStock(deleteData);
    
    return result;
  } catch (error) {
    console.error('Yarı mamul işlemi silme hatası:', error);
    return { success: false, message: error.message };
  }
}


// Düzeltilmiş yarı mamul stoğa geri dönenler yükleme fonksiyonu
async function loadYariMamulStokGeriDonenler(yariMamulId) {
    try {
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            return;
        }

        // API call to get data
        const result = await window.electronAPI.invoke.database.getYariMamulIslemleri(yariMamulId);

        const stokGeriDonenlerTable = document.getElementById('yariMamulStokGeriDonenlerTable');
        if (!stokGeriDonenlerTable) {
            console.error('yariMamulStokGeriDonenlerTable elementi bulunamadı!');
            return;
        }
        
        const tableBody = stokGeriDonenlerTable.getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';

        // API'den gelen veriyi konsola yazdıralım (debug için)
        console.log('Yarı mamul işlemleri:', result);
        
        if (!result.success || !result.islemler || result.islemler.length === 0) {
            const row = tableBody.insertRow();
            row.innerHTML = '<td colspan="6" class="text-center">Stoğa geri dönen malzeme bulunamadı</td>';
            return;
        }
        
        // İade işlemlerini filtrele
        const geriDonenler = result.islemler.filter(islem => 
            islem.islem_turu === 'İade' && 
            (islem.kullanim_alani === 'StokGeriYukleme' || islem.kullanim_alani === 'StogaGeriYukleme')
        );
        
        // Debug için geri dönenleri yazdır
        console.log('Geri dönen işlemler:', geriDonenler);
        
        if (geriDonenler.length === 0) {
            const row = tableBody.insertRow();
            row.innerHTML = '<td colspan="6" class="text-center">Stoğa geri dönen malzeme bulunamadı</td>';
            return;
        }
        
        const processedItems = []; // İşlenmiş işlemler
        
        for (const geriDonen of geriDonenler) {
            // Tüm işlemleri tarihe göre sırala
            const sortedIslemler = result.islemler
                .filter(i => i.id !== geriDonen.id) // Kendisini hariç tut
                .filter(i => i.islem_turu !== 'İade') // Diğer iadeleri hariç tut
                .sort((a, b) => new Date(b.islem_tarihi) - new Date(a.islem_tarihi)); // Son yapılandan ilk yapılana sırala
            
            // Geri dönen işlemden önce yapılmış en yakın işlemi bul
            const geriDonenTarih = new Date(geriDonen.islem_tarihi);
            console.log('Geri dönen tarih:', geriDonenTarih);
            
            const oncekiIslemler = sortedIslemler.filter(i => new Date(i.islem_tarihi) < geriDonenTarih);
            console.log('Önceki işlemler:', oncekiIslemler);
            
            let originalIslem = null;
            if (oncekiIslemler.length > 0) {
                originalIslem = oncekiIslemler[0]; // En yakın işlem
            }
            
            // Eğer orijinal işlem bulunamazsa, bu işlemi atla
            if (!originalIslem) {
                // Varsayılan değerlerle devam edelim
                originalIslem = {
                    alan_kisi_adi: 'Belirtilmemiş',
                    miktar: 0,
                    proje_adi: 'Belirtilmemiş'
                };
            }
            
            console.log('Orijinal işlem:', originalIslem);
            
            const row = tableBody.insertRow();
            
            // Tarih
            const cell1 = row.insertCell(0);
            const date = new Date(geriDonen.islem_tarihi);
            cell1.textContent = date.toLocaleString('tr-TR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Alan Kişi
            const cell2 = row.insertCell(1);
            // alan_kisi_adi zaten kullanılan JOIN ile oluşturulmuş bir alan
            cell2.textContent = originalIslem.alan_kisi_adi || 'Belirtilmemiş';
            
            // Alınan Miktar (Orijinal işlemin miktarı)
            const cell3 = row.insertCell(2);
            cell3.textContent = `${Number(originalIslem.miktar || 0).toFixed(2)}`;
            
            // Geri Dönen Miktar
            const cell4 = row.insertCell(3);
            cell4.textContent = `${Number(geriDonen.miktar || 0).toFixed(2)}`;
            
            // Proje
            const cell5 = row.insertCell(4);
            cell5.textContent = originalIslem.proje_adi || geriDonen.proje_adi || 'Belirtilmemiş';
            
            // İşlemi Yapan (Geri dönüş işlemini yapan kişi)
            const cell6 = row.insertCell(5);
            cell6.textContent = `${geriDonen.kullanici_ad || ''} ${geriDonen.kullanici_soyad || ''}`.trim() || 'Bilinmiyor';
            
            // Bu işlemi işlenmiş olarak işaretle
            processedItems.push(geriDonen.id);
        }
        
        // Eğer hiçbir işlem bulunamazsa veya işlenmediyse
        if (processedItems.length === 0) {
            const row = tableBody.insertRow();
            row.innerHTML = '<td colspan="6" class="text-center">Stoğa geri dönen malzeme bulunamadı</td>';
        }
    } catch (error) {
        console.error('Yarı mamul stok geri dönenler yükleme hatası:', error);
        
        const stokGeriDonenlerTable = document.getElementById('yariMamulStokGeriDonenlerTable');
        if (stokGeriDonenlerTable) {
            const tableBody = stokGeriDonenlerTable.getElementsByTagName('tbody')[0];
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Stok geri dönenler yüklenirken hata oluştu</td></tr>';
            }
        }
    }
}



// Global değişken - mevcut yarı mamul ID'si
let currentPhotoYariMamulId = null;

// handleYariMamulPhoto fonksiyonunda düzeltme
async function handleYariMamulPhoto(yariMamulId) {
  try {
    currentPhotoYariMamulId = yariMamulId;
    
    // Kullanıcı yetki kontrolü
    const isUserAdmin = window.globalUserData && window.globalUserData.rol === 'yonetici';
    
    // Yarı mamul bilgilerini al
    const result = await window.electronAPI.invoke.database.getYariMamulById(yariMamulId);
    
    if (!result.success) {
      console.error('Yarı mamul bilgileri alınamadı:', result.message);
      showErrorMessage('Hata', 'Yarı mamul bilgileri alınamadı: ' + result.message);
      return;
    }
    
    const yariMamul = result.yariMamul;
    
    // Modal başlığını güncelle
    document.getElementById('yariMamulFotoHeader').textContent = `${yariMamul.malzeme_adi} Fotoğrafı`;
    
    // Önce fotoğraf input alanını sıfırla
    document.getElementById('fotografInput').value = '';
    document.getElementById('fotografError').style.display = 'none';
    
    // Fotoğraf upload container'ını yetki durumuna göre göster/gizle
    const fotografUploadContainer = document.getElementById('fotografUploadContainer');
    if (isUserAdmin) {
      fotografUploadContainer.style.display = 'block';
    } else {
      fotografUploadContainer.style.display = 'none';
    }
    
    // Butonları yetki durumuna göre göster/gizle
    const fotografKaydetBtn = document.getElementById('fotografKaydetBtn');
    const fotografSilBtn = document.getElementById('fotografSilBtn');
    
    if (isUserAdmin) {
      // Yönetici ise butonları göster
      fotografKaydetBtn.style.display = 'inline-block';
      fotografKaydetBtn.disabled = false;
      fotografKaydetBtn.style.opacity = '1';
      fotografKaydetBtn.style.cursor = 'pointer';
    } else {
      // Normal kullanıcı ise butonları gizle/deaktif yap
      fotografKaydetBtn.style.display = 'none';
    }
    
    try {
      // Fotoğraf var mı kontrol et
      if (yariMamul.fotograf) {
        // ÖNEMLİ DEĞİŞİKLİK: Base64 kontrolü yap
        const fotograf = yariMamul.fotograf;
        // Eğer base64 string zaten "data:image" ile başlıyorsa doğrudan kullan
        // Aksi takdirde data:image/jpeg;base64, prefixi ekle
        const imgSrc = fotograf.startsWith('data:image') ? 
          fotograf : 
          `data:image/jpeg;base64,${fotograf}`;
          
        // Mevcut fotoğrafı göster
        const imgElement = document.getElementById('fotografPreview');
        imgElement.src = imgSrc;
        imgElement.onload = function() {
          // Resim başarıyla yüklendi
          document.getElementById('fotografPreviewContainer').style.display = 'block';
          
          // Sil butonu sadece yöneticiler için gösterilsin
          if (isUserAdmin) {
            fotografSilBtn.style.display = 'inline-block';
            fotografSilBtn.disabled = false;
            fotografSilBtn.style.opacity = '1';
            fotografSilBtn.style.cursor = 'pointer';
          } else {
            fotografSilBtn.style.display = 'none';
          }
        };
        imgElement.onerror = function() {
          // Resim yüklenemedi - hata mesajı ekle
          console.error('Resim görüntülenemiyor. Hatalı URL:', imgSrc);
          document.getElementById('fotografPreviewContainer').style.display = 'none';
          document.getElementById('fotografError').textContent = 'Resim görüntülenemedi. Yeni resim ekleyebilirsiniz.';
          
          if (isUserAdmin) {
            document.getElementById('fotografError').style.display = 'block';
            fotografSilBtn.style.display = 'inline-block';
          } else {
            document.getElementById('fotografError').style.display = 'none';
            fotografSilBtn.style.display = 'none';
          }
        };
      } else {
        // Fotoğraf yoksa gizle
        document.getElementById('fotografPreviewContainer').style.display = 'none';
        fotografSilBtn.style.display = 'none';
        
        // Eğer yönetici değilse ve fotoğraf yoksa bilgi mesajı göster
        if (!isUserAdmin) {
          document.getElementById('fotografError').textContent = 'Bu ürün için henüz fotoğraf eklenmemiş.';
          document.getElementById('fotografError').style.display = 'block';
          document.getElementById('fotografError').style.backgroundColor = '#d1ecf1';
          document.getElementById('fotografError').style.color = '#0c5460';
        }
      }
    } catch (imgError) {
      console.error('Resim gösterme hatası:', imgError);
      document.getElementById('fotografPreviewContainer').style.display = 'none';
      
      if (isUserAdmin) {
        document.getElementById('fotografError').textContent = 'Resim görüntülenemiyor. Yeni resim ekleyebilirsiniz.';
        document.getElementById('fotografError').style.display = 'block';
      } else {
        document.getElementById('fotografError').textContent = 'Resim görüntülenemiyor.';
        document.getElementById('fotografError').style.display = 'block';
        document.getElementById('fotografError').style.backgroundColor = '#f8d7da';
        document.getElementById('fotografError').style.color = '#721c24';
      }
    }
    
    // Modalı aç
    openModal('yariMamulFotoModal');
    
  } catch (error) {
    console.error('Fotoğraf işlemi sırasında hata:', error);
    showErrorMessage('Hata', 'Fotoğraf işlemi sırasında bir hata oluştu: ' + error.message);
  }
}

// Fotoğraf önizleme
document.getElementById('fotografInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Dosya boyutu kontrolü (5MB)
  if (file.size > 5 * 1024 * 1024) {
    document.getElementById('fotografError').textContent = 'Dosya boyutu 5MB\'dan küçük olmalıdır.';
    document.getElementById('fotografError').style.display = 'block';
    return;
  }
  
  // Dosya türü kontrolü
  if (!file.type.startsWith('image/')) {
    document.getElementById('fotografError').textContent = 'Lütfen geçerli bir resim dosyası seçin.';
    document.getElementById('fotografError').style.display = 'block';
    return;
  }
  
  // Hata mesajını gizle
  document.getElementById('fotografError').style.display = 'none';
  
  // Fotoğrafı önizle
  const reader = new FileReader();
  reader.onload = function(e) {
    const imgElement = document.getElementById('fotografPreview');
    imgElement.src = e.target.result;
    document.getElementById('fotografPreviewContainer').style.display = 'block';
  };
  reader.readAsDataURL(file);
});

// Fotoğraf kaydetme
// Fotoğraf kaydetme
document.getElementById('fotografKaydetBtn').addEventListener('click', async function() {
  try {
    if (!currentPhotoYariMamulId) {
      showErrorMessage('Hata', 'Yarı mamul ID bulunamadı.');
      return;
    }
    
    const fileInput = document.getElementById('fotografInput');
    const file = fileInput.files[0];
    
    let base64Image = null;
    
    // Yeni dosya seçildiyse işle
    if (file) {
      // Dosya boyutu kontrolü
      if (file.size > 5 * 1024 * 1024) {
        showErrorMessage('Hata', 'Dosya boyutu 5MB\'dan küçük olmalıdır.');
        return;
      }
      
      // Dosya türü kontrolü
      if (!file.type.startsWith('image/')) {
        showErrorMessage('Hata', 'Lütfen geçerli bir resim dosyası seçin.');
        return;
      }
      
      // Resmi Base64'e dönüştür
      base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            // Data URL'den Base64 kısmını ayıkla
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    } else if (document.getElementById('fotografPreviewContainer').style.display !== 'block') {
      // Hem dosya seçilmemişse hem de önizleme yoksa hata ver
      showErrorMessage('Hata', 'Lütfen bir fotoğraf seçin.');
      return;
    }
    
    // API isteği
    const result = await window.electronAPI.invoke.database.updateYariMamulFotograf(
      currentPhotoYariMamulId, 
      base64Image // Eğer null ise, mevcut fotoğraf korunacak
    );
    
    if (result.success) {
      showToast('Fotoğraf başarıyla kaydedildi.', 'success');
      closeModal('yariMamulFotoModal');
      
      // Detay sayfasını güncelle (aynı yariMamulId'yi tekrar çağırarak)
      if (typeof viewYariMamulDetail === 'function') {
        viewYariMamulDetail(currentPhotoYariMamulId);
      }
    } else {
      showErrorMessage('Hata', 'Fotoğraf kaydedilirken bir hata oluştu: ' + result.message);
    }
  } catch (error) {
    console.error('Fotoğraf kaydedilirken hata:', error);
    showErrorMessage('Hata', 'Fotoğraf kaydedilirken bir hata oluştu: ' + error.message);
  }
});

// Fotoğraf silme
document.getElementById('fotografSilBtn').addEventListener('click', async function() {
  try {
    if (!currentPhotoYariMamulId) {
      showErrorMessage('Hata', 'Yarı mamul ID bulunamadı.');
      return;
    }
    
    // Silme onayı - Notiflix ile
    const onay = await new Promise((resolve) => {
      Notiflix.Confirm.show(
        'Fotoğraf Silme',
        'Fotoğrafı silmek istediğinizden emin misiniz?',
        'Evet, sil',
        'İptal',
        function() {
          resolve(true); // Evet tıklandığında
        },
        function() {
          resolve(false); // İptal tıklandığında
        },
        {
          titleColor: '#6A0D0C',
          buttonOkBackgroundColor: '#6A0D0C',
          cssAnimationStyle: 'zoom'
        }
      );
    });
    
    // Onay verilmediyse işlemi sonlandır
    if (!onay) return;
    
    // API isteği
    const result = await window.electronAPI.invoke.database.updateYariMamulFotograf(
      currentPhotoYariMamulId, 
      null // Null göndererek fotoğrafı siliyoruz
    );
    
    if (result.success) {
      showToast('Fotoğraf başarıyla silindi.', 'success');
      closeModal('yariMamulFotoModal');
    } else {
      showErrorMessage('Hata', 'Fotoğraf silinirken bir hata oluştu: ' + result.message);
    }
  } catch (error) {
    console.error('Fotoğraf silinirken hata:', error);
    showErrorMessage('Hata', 'Fotoğraf silinirken bir hata oluştu.');
  }
});

  window.editYariMamulIslem = editYariMamulIslem;
  window.deleteYariMamul = deleteYariMamul;
  window.loadYariMamulListesi =loadYariMamulListesi;
  window.viewYariMamulDetail = viewYariMamulDetail;
  window.openYariMamulIslemModal = openYariMamulIslemModal;
  window.saveYariMamulIslemi;
  window.searchYariMamul = searchYariMamul;
  window.setupSearchEventListeners = setupSearchEventListeners;
  window.setupYariMamulEventListeners = setupYariMamulEventListeners;
  window.loadYariMamulGirisGecmisi = loadYariMamulGirisGecmisi;
  window.saveYariMamulEkle = saveYariMamulEkle;
  window.openYariMamulGirisModal = openYariMamulGirisModal;
  window.kaydetYariMamulGirisi = kaydetYariMamulGirisi;
  window.deleteYariMamulIslem = deleteYariMamulIslem;
  window.loadYariMamulStokGeriDonenler=loadYariMamulStokGeriDonenler;
  window.handleYariMamulPhoto = handleYariMamulPhoto;