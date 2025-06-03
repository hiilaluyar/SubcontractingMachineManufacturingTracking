window.editedItems = window.editedItems || {
    hammadde: {},
    sarf_malzeme: {},
    yari_mamul: {}
  };
  
  // Load edited items from localStorage if available
  function loadEditedItems() {
    try {
      const savedItems = localStorage.getItem('editedItems');
      if (savedItems) {
        window.editedItems = JSON.parse(savedItems);
      }
    } catch (error) {
      console.error('Düzenlenen öğeleri yükleme hatası:', error);
    }
  }


  // Save edited items to localStorage
  function saveEditedItems() {
    try {
      localStorage.setItem('editedItems', JSON.stringify(window.editedItems));
    } catch (error) {
      console.error('Düzenlenen öğeleri kaydetme hatası:', error);
    }
  }
  
 
// Bu fonksiyonu bulun ve sarf malzemeler için bir koşul ekleyin
function markItemAsEdited(itemType, itemId, operation) {
  // İlgili itemType için nesne yoksa oluştur
  if (!window.editedItems[itemType]) {
    window.editedItems[itemType] = {};
  }
  
  // Sarf malzemeler için özel durum kontrolü
  if (itemType === 'sarf_malzeme') {
    // Burada işlem tipine göre kontrol eklenebilir
    // Örneğin, sadece bazı operasyonlar için işaretleme yapılabilir
    if (operation === 'IskartaUrun' || operation === 'StogaGeriYukle') {
      window.editedItems[itemType][itemId] = {
        edited: true,
        operation: operation,
        timestamp: Date.now()
      };
      saveEditedItems();
    }
  } else {
    // Diğer malzeme türleri için normal işlem devam ediyor
    window.editedItems[itemType][itemId] = {
      edited: true,
      operation: operation,
      timestamp: Date.now()
    };
    saveEditedItems();
  }
}
  
  
  // Bağlantılı olarak isItemEdited fonksiyonunu da güvenli hale getirelim
  function isItemEdited(itemType, itemId) {
    return window.editedItems[itemType] && window.editedItems[itemType][itemId]?.edited;
  }
  
  // getItemEditOperation fonksiyonunu da güvenli hale getirelim
  function getItemEditOperation(itemType, itemId) {
    return window.editedItems[itemType]?.[itemId]?.operation;
  }
  
  // Load edited items when the document is ready
  document.addEventListener('DOMContentLoaded', loadEditedItems);


// editIslem fonksiyonunu düzelt
async function editIslem(islemId, islemTuru = 'hammadde') {
  try {
    // Check if the item has already been edited
    if (isItemEdited(islemTuru, islemId)) {
      // Get the operation that was performed
      const operation = getItemEditOperation(islemTuru, islemId);
      
      // Show a message explaining why the item can't be edited again
      let message = 'Bu işlem daha önce düzenlenmiş.';
      
      if (operation === 'IskartaUrun') {
        message = 'Bu işlem daha önce ıskarta ürün olarak işaretlenmiş.';
      } else if (operation === 'StogaGeriYukle') {
        message = 'Bu işlem için daha önce stok iadesi yapılmış.';
      }
      
      showToast(message + ' Tekrar düzenlenemez.', 'info');
      return;
    }
    
    // Continue with the normal edit operation
    // API kontrolü
    if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
      console.error('Database invoke metodu bulunamadı');
      showToast('İşlem bilgileri alınamadı. API erişimi yok.', 'error');
      return;
    }

    let result;
    
    // İşlem türüne göre doğru API çağrısını yapın
    if (islemTuru === 'hammadde') {
      result = await window.electronAPI.invoke.database.getIslemById(islemId);
    } else if (islemTuru === 'sarf_malzeme') {
      result = await window.electronAPI.invoke.database.getSarfMalzemeIslemById(islemId);
    } else if (islemTuru === 'yari_mamul') {
      result = await window.electronAPI.invoke.database.getYariMamulIslemById(islemId);
    } else {
      console.error('Geçersiz işlem türü:', islemTuru);
      showToast('Geçersiz işlem türü.', 'error');
      return;
    }
    
    if (result.success) {
      const islem = result.islem;
      
      // Global değişkene işlem türünü kaydet (updateIslem fonksiyonu için)
      window.currentIslemType = islemTuru;
      
      // Modal başlığını güncelle
      document.getElementById('islemDuzenleHeader').textContent = `İşlem Düzenle (#${islemId})`;
      
      // Form alanlarını doldur
      document.getElementById('duzenleIslemTuru').value = islem.islem_turu;
      
      // Kullanım alanını değiştirmiyoruz, gizli bir alanda saklıyoruz
      document.getElementById('duzenleKullanimAlani').value = islem.kullanim_alani;
      
      // Iskarta ürün checkbox'ını ayarla
      document.getElementById('duzenleIskartaUrunSecimi').checked = islem.iskarta_urun === 1 || false;
      
      // Stoğa Geri Yükleme checkbox'ını sıfırla
      document.getElementById('duzenleStogaGeriYukleSecimi').checked = false;
      
      // Geri Yükleme miktar alanını gizle ve sıfırla
      document.getElementById('duzenleGeriYukleMiktarContainer').style.display = 'none';
      document.getElementById('duzenleGeriYukleMiktar').value = '';
      
      // Iskarta ürün container'ı her zaman görünür olmalı
      document.getElementById('duzenleIskartaUrunSecimiContainer').style.display = 'block';
      document.getElementById('duzenleStogaGeriYukleContainer').style.display = 'block';
      
      // Proje listesini yükle
      loadProjeler().then(() => {
        // Proje seçimi için dropdown'ı güncelle
        const projeSecimi = document.getElementById('duzenleProjeSecimi');
        if (projeSecimi) {
          projeSecimi.innerHTML = '<option value="">-- Proje Seçin --</option>';
          
          // Projeleri yükle
          const projeler = document.getElementById('projeSecimi').options;
          if (projeler) {
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
          }
        }
      });
      
      // İşlem ID'sini gizli bir form elemanında sakla
      document.getElementById('duzenleIslemId').value = islem.id;
      
      // Modalı aç
      openModal('islemDuzenleModal');
    } else {
      showToast('İşlem bilgileri alınamadı: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('İşlem bilgileri alınırken hata:', error);
    showToast('İşlem bilgileri alınırken bir hata oluştu.', 'error');
  }
}

async function updateYariMamulIslem(islemId, islemData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // İlk olarak mevcut işlem verilerini al
    const [currentIslem] = await connection.execute(
      `SELECT islem_turu, yari_mamul_id, miktar, kullanici_id FROM yari_mamul_islemleri WHERE id = ?`,
      [islemId]
    );
    
    if (currentIslem.length === 0) {
      throw new Error('İşlem bulunamadı.');
    }
    
    const islemInfo = currentIslem[0];
    
    // Yarı mamul bilgilerini al
    const [yariMamulRows] = await connection.execute(
      'SELECT kalan_miktar, birim FROM yari_mamuller WHERE id = ?',
      [islemInfo.yari_mamul_id]
    );
    
    if (yariMamulRows.length === 0) {
      throw new Error('Yarı mamul bulunamadı.');
    }
    
    const yariMamul = yariMamulRows[0];
    
    // İşlem türünü koru
    const islemTuru = islemData.islem_turu || islemInfo.islem_turu;
    
    // İşlemi güncelle
    await connection.execute(
      `UPDATE yari_mamul_islemleri SET 
       islem_turu = ?, kullanim_alani = ?, proje_id = ?, iskarta_urun = ?
       WHERE id = ?`,
      [
        islemTuru,
        islemData.kullanim_alani || islemInfo.kullanim_alani,
        islemData.proje_id || null,
        islemData.iskarta_urun ? 1 : 0,
        islemId
      ]
    );
    
    // Orjinal stoğa geri yükleme işlemi
    if (islemData.stoga_geri_yukle && islemData.geri_yukle_miktar > 0) {
      const geriYukleMiktar = parseFloat(islemData.geri_yukle_miktar);
      const islemMiktar = parseFloat(islemInfo.miktar);
      
      // Geri yükleme miktarını doğrula
      if (geriYukleMiktar > islemMiktar) {
        return { 
          success: false, 
          message: `Geri yükleme miktarı (${geriYukleMiktar}) işlem miktarından (${islemMiktar}) büyük olamaz.` 
        };
      }
      
      // Yarı mamul kalan miktarını güncelle
      const yeniKalanMiktar = parseFloat(yariMamul.kalan_miktar) + geriYukleMiktar;
      
      console.log(`Yarı mamul stoğa geri yükleniyor: Eski miktar=${yariMamul.kalan_miktar}, Geri yüklenen=${geriYukleMiktar}, Yeni miktar=${yeniKalanMiktar}`);
      
      await connection.execute(
        'UPDATE yari_mamuller SET kalan_miktar = ? WHERE id = ?',
        [yeniKalanMiktar, islemInfo.yari_mamul_id]
      );
      
      // İade işlemini kaydet
      // ÖNEMLİ: alan_calisan_id ve diğer tüm sütunları doğru şekilde belirtmeliyiz
      await connection.execute(
        `INSERT INTO yari_mamul_islemleri (
          yari_mamul_id, islem_turu, kullanim_alani, miktar, 
          kullanici_id, alan_calisan_id, makine, proje_id
        ) VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL)`,
        [
          islemInfo.yari_mamul_id,
          'İade',
          'StokGeriYukleme', // Burada doğru kullanım alanını kullanıyoruz
          geriYukleMiktar,
          islemInfo.kullanici_id || 1
        ]
      );
      
      // İşlem kaydını konsola yazdır
      console.log(`Yeni iade işlemi kaydedildi: yari_mamul_id=${islemInfo.yari_mamul_id}, miktar=${geriYukleMiktar}, kullanici=${islemInfo.kullanici_id}`);
    }
    
    await connection.commit();
    return { 
      success: true, 
      message: islemData.stoga_geri_yukle ? 
        `İşlem güncellendi ve ${islemData.geri_yukle_miktar} birim orjinal stoğa geri yüklendi.` : 
        'İşlem başarıyla güncellendi.' 
    };
  } catch (error) {
    await connection.rollback();
    console.error('Yarı mamul işlemi güncelleme hatası:', error);
    return { success: false, message: 'İşlem güncellenirken bir hata oluştu: ' + error.message };
  } finally {
    connection.release();
  }
}

// İstek durumunu takip etmek için global flag
let isStockReturnProcessing = false;

async function updateIslem() {
    // İşlem devam ediyorsa, tekrar çağrılmasını engelle
    if (isStockReturnProcessing) {
        console.log('İşlem devam ediyor, lütfen bekleyin...');
        return;
    }
    
    try {
        // İşlem başladı, flag'i true yap
        isStockReturnProcessing = true;
        
        const islemId = document.getElementById('duzenleIslemId').value;
        const islemTuru = document.getElementById('duzenleIslemTuru').value;
        const kullanimAlani = document.getElementById('duzenleKullanimAlani').value;
        
        // ÖNEMLI: Bu iki seçenek aynı anda aktif olamaz
        const isStogaGeriYukle = document.getElementById('duzenleStogaGeriYukleSecimi').checked;
        const isIskartaUrun = !isStogaGeriYukle && document.getElementById('duzenleIskartaUrunSecimi').checked;
        
        const geriYukleMiktar = document.getElementById('duzenleGeriYukleMiktar').value;
        const projeId = document.getElementById('duzenleProjeSecimi').value;
        
        // Geri yükleme seçiliyse miktar kontrolü yap
        if (isStogaGeriYukle) {
            if (!geriYukleMiktar || parseFloat(geriYukleMiktar) <= 0) {
                showToast('Lütfen geçerli bir geri yükleme miktarı girin.', 'error');
                isStockReturnProcessing = false; // Flag'i sıfırla
                return;
            }
        }
        
        // API kontrolü
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            showToast('İşlem kaydedilemedi. API erişimi yok.', 'error');
            isStockReturnProcessing = false; // Flag'i sıfırla
            return;
        }

        let result;
        
        // Operation type for tracking
        let operationType = '';
        if (isIskartaUrun) {
            operationType = 'IskartaUrun';
        } else if (isStogaGeriYukle) {
            operationType = 'StogaGeriYukle';
        } else {
            operationType = 'Normal';
        }
        
        // İşlem verisi hazırla - stoga_geri_yukle ve geri_yukle_miktar alanları eklendi
        const islemData = {
            islem_turu: islemTuru,
            kullanim_alani: kullanimAlani,
            proje_id: projeId || null,
            iskarta_urun: isIskartaUrun,
            stoga_geri_yukle: isStogaGeriYukle,
            geri_yukle_miktar: isStogaGeriYukle ? parseFloat(geriYukleMiktar) : 0,
            orijinal_proje_id: projeId || null // Orijinal proje bilgisi eklendi
        };
        
        console.log('Gönderilen işlem verisi:', islemData);
        
        // Modalı önceden kapat - çoklu mesaj sorununun önüne geçmek için
        closeModal('islemDuzenleModal');
        
        // İşlem türüne göre doğru API çağrısını yap
        if (window.currentIslemType === 'hammadde') {
            result = await window.electronAPI.invoke.database.updateIslem(islemId, islemData);
            
            if (result.success) {
                markItemAsEdited('hammadde', islemId, operationType);
            }
        } else if (window.currentIslemType === 'sarf_malzeme') {
            result = await window.electronAPI.invoke.database.updateSarfMalzemeIslem(islemId, islemData);
            
            if (result.success) {
                markItemAsEdited('sarf_malzeme', islemId, operationType);
            }
        } else if (window.currentIslemType === 'yari_mamul') {
            result = await window.electronAPI.invoke.database.updateYariMamulIslem(islemId, islemData);
            
            if (result.success) {
                markItemAsEdited('yari_mamul', islemId, operationType);
            }
        } else {
            throw new Error('Geçersiz işlem türü: ' + window.currentIslemType);
        }
        
        if (result.success) {
            // İşlem türüne göre mesaj belirle
            let message = 'İşlem başarıyla güncellendi.';
            
            if (isIskartaUrun) {
                message = 'Ürün başarıyla ıskarta listesine gönderildi.';
            } else if (isStogaGeriYukle) {
                message = `${geriYukleMiktar} birim ürün başarıyla orjinal stoğa geri yüklendi.`;
            }
            
            // Sadece bir bildirim göster (toast veya notify, ikisi birden değil)
            showToast(message, 'success');
            
            // Listeleri güncelle
            loadFasonIslemler();
            loadMakineIslemler();
            loadIskartaUrunler();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('İşlem güncelleme hatası:', error);
        showToast('İşlem güncellenirken bir hata oluştu: ' + error.message, 'error');
    } finally {
        // İşlem bitti, flag'i sıfırla
        isStockReturnProcessing = false;
    }
}


// editSarfMalzemeIslem fonksiyonunu düzelt
async function editSarfMalzemeIslem(islemId) {
  try {
    // Check if the item has already been edited
    if (isItemEdited('sarf_malzeme', islemId)) {
      // Get the operation that was performed
      const operation = getItemEditOperation('sarf_malzeme', islemId);
      
      // Show a message explaining why the item can't be edited again
      let message = 'Bu işlem daha önce düzenlenmiş.';
      
      if (operation === 'IskartaUrun') {
        message = 'Bu işlem daha önce ıskarta ürün olarak işaretlenmiş.';
      }
      
      showToast(message + ' Tekrar düzenlenemez.', 'info');
      return;
    }
    
    // API kontrolü
    if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
      console.error('Database invoke metodu bulunamadı');
      showToast('İşlem bilgileri alınamadı. API erişimi yok.', 'error');
      return;
    }
  
    // İşlem bilgilerini al
    const sarfMalzemeIslemResult = await window.electronAPI.invoke.database.getSarfMalzemeIslemById(islemId);
    
    if (sarfMalzemeIslemResult.success) {
      const islem = sarfMalzemeIslemResult.islem;
      
      // Global değişkene işlem türünü kaydet (updateIslem fonksiyonu için)
      window.currentIslemType = 'sarf_malzeme';
      
      // Modal başlığını güncelle
      document.getElementById('sarfMalzemeIslemDuzenleHeader').textContent = `İşlem Düzenle (#${islemId})`;
      
      // Form alanlarını doldur
      document.getElementById('duzenleSarfMalzemeIslemTuru').value = islem.islem_turu;
      document.getElementById('duzenleSarfMalzemeKullanimAlani').value = islem.kullanim_alani;
      
      // Çalışan ve makine bilgilerini doldur
      if (islem.calisan_id) {
        document.getElementById('duzenleSarfMalzemeCalisanSecimi').value = islem.calisan_id;
      }
      
      if (islem.makine) {
        document.getElementById('duzenleSarfMalzemeMakineSecimi').value = islem.makine;
      }
      
      // Kullanım alanına göre makine/çalışan göster/gizle
      toggleMakineSectionEdit();
      
      // Proje listesini yükle
      loadProjeler().then(() => {
        // Proje seçimi için dropdown'ı güncelle
        const projeSecimi = document.getElementById('duzenleSarfMalzemeProjeSecimi');
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
      
      // Çalışanları yükle
      loadCalisanlarForSelect('duzenleSarfMalzemeCalisanSecimi').then(() => {
        // İşlem tamamlandıktan sonra çalışan seçimini ayarla
        if (islem.calisan_id) {
          document.getElementById('duzenleSarfMalzemeCalisanSecimi').value = islem.calisan_id;
        }
      });
      
      // İşlem ID'sini gizli bir form elemanında sakla
      document.getElementById('duzenleSarfMalzemeIslemId').value = islem.id;
      
      // Modalı aç
      openModal('sarfMalzemeIslemDuzenleModal');
    } else {
      showToast('İşlem bilgileri alınamadı: ' + sarfMalzemeIslemResult.message, 'error');
    }
  } catch (error) {
    console.error('İşlem bilgileri alınırken hata:', error);
    showToast('İşlem bilgileri alınırken bir hata oluştu.', 'error');
  }
}

async function updateSarfMalzemeIslem(islemId, islemData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // First, get the current operation data and sarf_malzeme info
    const [currentIslem] = await connection.execute(
      `SELECT islem_turu, sarf_malzeme_id, miktar FROM sarf_malzeme_islemleri WHERE id = ?`,
      [islemId]
    );
    
    if (currentIslem.length === 0) {
      throw new Error('İşlem bulunamadı.');
    }
    
    const islemInfo = currentIslem[0];
    
    // Get sarf_malzeme information to update stock
    const [sarfMalzemeRows] = await connection.execute(
      'SELECT kalan_miktar FROM sarf_malzemeler WHERE id = ?',
      [islemInfo.sarf_malzeme_id]
    );
    
    if (sarfMalzemeRows.length === 0) {
      throw new Error('Sarf malzeme bulunamadı.');
    }
    
    const sarfMalzeme = sarfMalzemeRows[0];
    
    // Only update islem_turu if it's explicitly provided in islemData
    const islemTuru = islemData.islem_turu || islemInfo.islem_turu;
    
    // Update the operation flags in database
    await connection.execute(
      `UPDATE sarf_malzeme_islemleri SET 
       islem_turu = ?, proje_id = ?, iskarta_urun = ?
       WHERE id = ?`,
      [
        islemTuru,
        islemData.proje_id || null,
        islemData.iskarta_urun ? 1 : 0,
        islemId
      ]
    );
    
    // Handle return to original stock if requested
    if (islemData.stoga_geri_yukle && islemData.geri_yukle_miktar > 0) {
      const geriYukleMiktar = parseFloat(islemData.geri_yukle_miktar);
      const islemMiktar = parseFloat(islemInfo.miktar);
      
      // Validate return amount
     if (geriYukleMiktar > islemMiktar) {
  return { 
    success: false, 
    message: `Geri yükleme miktarı (${geriYukleMiktar}) işlem miktarından (${islemMiktar}) büyük olamaz.` 
  };
}
      
      // Update the sarf_malzeme kalan_miktar (increment by return amount)
      const yeniKalanMiktar = parseFloat(sarfMalzeme.kalan_miktar) + geriYukleMiktar;
      
      await connection.execute(
        'UPDATE sarf_malzemeler SET kalan_miktar = ? WHERE id = ?',
        [yeniKalanMiktar, islemInfo.sarf_malzeme_id]
      );
      
      // Record the return operation in islemler table
      await connection.execute(
        `INSERT INTO sarf_malzeme_islemleri (
          sarf_malzeme_id, islem_turu, kullanim_alani, miktar, kullanici_id, aciklama
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          islemInfo.sarf_malzeme_id,
          'İade', // Return operation
          'StokGeriYukleme',
          geriYukleMiktar,
          islemData.kullanici_id || 1, // Default to admin user if not provided
          `İşlem #${islemId} den stoğa geri dönen miktar`
        ]
      );
    }
    
    await connection.commit();
    return { 
      success: true, 
      message: islemData.stoga_geri_yukle ? 
        `İşlem güncellendi ve ${islemData.geri_yukle_miktar} birim orjinal stoğa geri yüklendi.` : 
        'Sarf malzeme işlemi başarıyla güncellendi.' 
    };
  } catch (error) {
    await connection.rollback();
    console.error('Sarf malzeme işlemi güncelleme hatası:', error);
    return { success: false, message: 'İşlem güncellenirken bir hata oluştu: ' + error.message };
  } finally {
    connection.release();
  }
}


window.editIslem = editIslem;
window.updateIslem = updateIslem;


window.editSarfMalzemeIslem = editSarfMalzemeIslem;
window.updateSarfMalzemeIslem = updateSarfMalzemeIslem;

function updateFasonMakineIslemlerButtons() {
  const fasonTable = document.getElementById('fasonTable');
  const makineTable = document.getElementById('makineTable');
  
  // Ortak bir fonksiyon tanımlayalım, böylece tekrar etmeyelim
  function processTableRows(table) {
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
      const islemlerCell = row.querySelector('td:last-child');
      const editBtn = islemlerCell.querySelector('.action-btn.edit');
      
      let islemId = null;
      let islemType = null;
      
      if (editBtn) {
        const onclickValue = editBtn.getAttribute('onclick');
        if (onclickValue) {
          const matches = onclickValue.match(/editIslem\((\d+),\s*['"]([^'"]+)['"]/);
          if (matches && matches.length >= 3) {
            islemId = matches[1];
            islemType = matches[2];
          } else {
            // İkincil stok ile ilgili kontrol kaldırıldı
            
            // Yarı mamul işlemleri için silme butonu ekle
            const yariMamulMatches = onclickValue.match(/editYariMamulIslem\((\d+)\)/);
            if (yariMamulMatches && yariMamulMatches.length >= 2) {
              islemId = yariMamulMatches[1];
              islemType = 'yari_mamul';
            }
          }
        }
        
        const islemFlag = row.getAttribute('data-islem-flag');
        
        // İkincil stok için işaretleme kontrolü kaldırıldı
        
        if (islemId && islemType && !islemlerCell.querySelector('.action-btn.delete')) {
          if (!editBtn.classList.contains('edited')) {
            const deleteButton = document.createElement('button');
            deleteButton.className = 'action-btn delete';
            deleteButton.title = 'İşlemi Sil';
            deleteButton.setAttribute('onclick', `deleteIslemFromImplantation(${islemId}, '${islemType}')`);
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            islemlerCell.querySelector('.action-buttons').appendChild(deleteButton);
          }
        }
      } else {
        const actionButtons = islemlerCell.querySelector('.action-buttons');
        if (actionButtons) {
          islemId = row.getAttribute('data-islem-id');
          islemType = row.getAttribute('data-islem-type');
          
          if (islemId && islemType && !actionButtons.querySelector('.action-btn.delete')) {
            const deleteButton = document.createElement('button');
            deleteButton.className = 'action-btn delete';
            deleteButton.title = 'İşlemi Sil';
            deleteButton.setAttribute('onclick', `deleteIslemFromImplantation(${islemId}, '${islemType}')`);
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            actionButtons.appendChild(deleteButton);
          }
        }
      }
    });
  }
  
  if (fasonTable) {
    processTableRows(fasonTable);
  }
  
  if (makineTable) {
    processTableRows(makineTable);
  }
}

// Bu fonksiyon processedItems içindeki verileri editedItems'a senkronize eder
// Mevcut kodları değiştirmek yerine, bu iki localStorage değişkeni arasında veri senkronizasyonu sağlar

function syncProcessedItemsToEditedItems() {
    try {
      // Her iki localStorage değişkenini de al
      const processedItems = JSON.parse(localStorage.getItem('processedItems') || '{}');
      const editedItems = JSON.parse(localStorage.getItem('editedItems') || '{}');
      
      // processedItems'daki her tür için
      Object.keys(processedItems).forEach(type => {
        // type için editedItems içinde bir alan yoksa oluştur
        if (!editedItems[type]) {
          editedItems[type] = {};
        }
        
        // Bu tipteki tüm işlenmiş öğeleri editedItems'a aktar
        Object.keys(processedItems[type]).forEach(id => {
          editedItems[type][id] = processedItems[type][id];
        });
      });
      
      // Güncellenmiş editedItems'ı localStorage'a geri kaydet
      localStorage.setItem('editedItems', JSON.stringify(editedItems));
      console.log('processedItems, editedItems ile senkronize edildi');
    } catch (error) {
      console.error('Senkronizasyon hatası:', error);
    }
  }
  

  // Radio butonlarını ayarlayalım
document.addEventListener('DOMContentLoaded', function() {
  // İkincil stok seçimini tamamen kaldırdık
  const iskartaUrunSecimi = document.getElementById('iskartaUrunSecimi');
  
  if (iskartaUrunSecimi) {
    // Iskarta ürün seçimi için gerekirse buraya ek işlevsellik eklenebilir
    iskartaUrunSecimi.addEventListener('change', function() {
      // İlerde başka özellikler eklenmesi durumunda
      // buraya ek kontroller eklenebilir
    });
  }
});


  // İşlenmiş öğeleri işaretlemek için yeni bir fonksiyon
  function markItemAsProcessed(type, id, operationType) {
    try {
      // LocalStorage'dan mevcut işlenmiş öğeleri al
      const processedItems = JSON.parse(localStorage.getItem('processedItems') || '{}');
      
      // İlgili türde veri yoksa oluştur
      if (!processedItems[type]) {
        processedItems[type] = {};
      }
      
      // Öğeyi işaretleme yerine, işlenmiş durumunu belirt
      // Ancak kopyalama işlemi olduğu için taşındı olarak değil, işlendi olarak kaydet
      processedItems[type][id] = {
        processed: true,
        operationType: operationType,
        timestamp: new Date().toISOString(),
        duplicated: true // Bu öğe taşınmadı, kopyalandı
      };
      
      // LocalStorage'a kaydet
      localStorage.setItem('processedItems', JSON.stringify(processedItems));
      
      console.log(`Öğe işlendi olarak işaretlendi: ${type} - ${id} - ${operationType}`);
    } catch (error) {
      console.error('Öğe işaretleme hatası:', error);
    }
  }


  // Show/hide return quantity field based on checkbox
document.addEventListener('DOMContentLoaded', function() {
  const stogaGeriYukleSecimi = document.getElementById('duzenleStogaGeriYukleSecimi');
  const geriYukleMiktarContainer = document.getElementById('duzenleGeriYukleMiktarContainer');
  
  if (stogaGeriYukleSecimi && geriYukleMiktarContainer) {
    stogaGeriYukleSecimi.addEventListener('change', function() {
      geriYukleMiktarContainer.style.display = this.checked ? 'block' : 'none';
      
      // Ensure both options aren't selected at the same time
      if (this.checked) {
        document.getElementById('duzenleIskartaUrunSecimi').checked = false;
      }
    });
    
    // Also prevent both options from being selected
    document.getElementById('duzenleIskartaUrunSecimi').addEventListener('change', function() {
      if (this.checked) {
        document.getElementById('duzenleStogaGeriYukleSecimi').checked = false;
        geriYukleMiktarContainer.style.display = 'none';
      }
    });
  }
});




