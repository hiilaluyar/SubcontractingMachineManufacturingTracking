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





// Plaka gruplarını görüntülemek için HTML ve JavaScript

// Plaka gruplarını yükle
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
      
      // Kalan Kilo
      row.insertCell(3).textContent = `${Number(grup.kalan_kilo).toFixed(2)} kg`;
      
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

// Plaka Grubu Ekleme Modalı
function openYeniPlakaGrubuModal() {
  if (!currentHammaddeId || !currentHammadde) {
    showToast('Lütfen önce bir hammadde seçin.', 'error');
    return;
  }
  
  // Modal içeriğini sıfırla
  resetPlakaGrubuModal();
  
  // Modalı aç
  openModal('yeniPlakaGrubuModal');
  
  // Detay modalını kapat
  closeModal('detayModal');
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

// Plaka Grubu hesaplama
function calculatePlakaGrubu() {
  try {
    // Form değerlerini al
    const en = parseFloat(document.getElementById('plakaGrubuEn').value);
    const boy = parseFloat(document.getElementById('plakaGrubuBoy').value);
    const plakaSayisi = parseInt(document.getElementById('plakaGrubuPlakaSayisi').value);
    const toplamKilo = parseFloat(document.getElementById('plakaGrubuToplamKilo').value);
    
    // Kalinlik ve yogunluk değerlerini kontrol et
    if (!currentHammadde || !currentHammadde.kalinlik || !currentHammadde.yogunluk) {
      document.getElementById('plakaGrubuHesapSonucu').innerHTML = 
        '<div class="error">Hammadde bilgileri bulunamadı. Lütfen hammadde seçtiğinizden emin olun.</div>';
      document.getElementById('plakaGrubuHesapSonucu').style.display = 'block';
      return;
    }
    
    const kalinlik = parseFloat(currentHammadde.kalinlik);
    const yogunluk = parseFloat(currentHammadde.yogunluk);
    
    // Temel validasyon
    if (!en || !boy || !plakaSayisi || !toplamKilo || 
        isNaN(en) || isNaN(boy) || isNaN(plakaSayisi) || isNaN(toplamKilo) ||
        plakaSayisi <= 0 || toplamKilo <= 0) {
      document.getElementById('plakaGrubuHesapSonucu').innerHTML = 
        '<div class="error">Lütfen geçerli en, boy, plaka sayısı ve toplam kilo değerleri girin.</div>';
      document.getElementById('plakaGrubuHesapSonucu').style.display = 'block';
      return;
    }
    
    // Tek plaka ağırlığı hesapla (kg) - Teorik olarak
    const hacim = (en / 1000) * (boy / 1000) * (kalinlik / 1000); // m³
    const teorikPlakaAgirligi = hacim * yogunluk;
    
    // Toplam teorik ağırlık
    const teorikToplamAgirlik = teorikPlakaAgirligi * plakaSayisi;
    
    // Gerçek plaka ağırlığı (girilen toplam kiloya göre)
    const gercekPlakaAgirligi = toplamKilo / plakaSayisi;
    
    // Fark hesapla
    const farkYuzde = ((toplamKilo - teorikToplamAgirlik) / teorikToplamAgirlik) * 100;
    
    // Sonuçları göster
    document.getElementById('plakaGrubuHesapSonucu').innerHTML = `
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
          <span>Plaka Sayısı:</span>
          <span>${plakaSayisi}</span>
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
    document.getElementById('plakaGrubuKaydetBtn').disabled = Math.abs(farkYuzde) > 10;
    
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

// Plaka grubu kaydetme
async function savePlakaGrubu() {
  try {
    // Mevcut form verilerini temizleyelim - eski değerler kalırsa ekstra plakalar oluşabilir
    window.isProcessingPlakaGrubuSubmit = true; // İşlem yapılıyor bayrağı

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
    
    // Ana barkod kontrolü
    if (!anaBarkod && !window.confirmMissingBarkod) {
      const confirmResult = await new Promise((resolve) => {
        Notiflix.Confirm.show(
          'Ana Barkod Eksik',
          'Ana barkod girmediniz. Devam etmek istiyor musunuz?',
          'Evet, devam et',
          'İptal',
          function() { resolve(true); },
          function() { resolve(false); }
        );
      });
      
      if (!confirmResult) {
        window.isProcessingPlakaGrubuSubmit = false;
        return;
      }
      
      window.confirmMissingBarkod = true;
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
      
      // Formu sıfırla ve modalı kapat
      resetPlakaGrubuModal();
      closeModal('yeniPlakaGrubuModal');
      
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

// Plaka Grubu İşlem Modalı için düzeltilmiş fonksiyon
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
    
    // Bilgi alanını oluştur
    const bilgiAlani = document.getElementById('plakaGrubuIslemModalBilgi');
    
    if (!bilgiAlani) {
      const yeniBilgiAlani = document.createElement('div');
      yeniBilgiAlani.id = 'plakaGrubuIslemModalBilgi';
      yeniBilgiAlani.className = 'form-info';
      yeniBilgiAlani.innerHTML = `
        <p><strong>Ölçüler:</strong> ${result.plaka_grubu.en} x ${result.plaka_grubu.boy} mm</p>
        <p><strong>Kalan Plaka Sayısı:</strong> ${result.plaka_grubu.kalan_plaka_sayisi}</p>
        <p><strong>Kalan Kilo:</strong> ${Number(result.plaka_grubu.kalan_kilo).toFixed(2)} kg</p>
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
        <p><strong>Kalan Kilo:</strong> ${Number(result.plaka_grubu.kalan_kilo).toFixed(2)} kg</p>
      `;
    }
    
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
      await loadProjeler();
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


async function loadProjeler() {
  try {
    console.log("loadProjeler çağrıldı");
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


// Plaka Grubu form seçeneklerini göster/gizle
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

// Plaka Grubu form seçeneklerini göster/gizle
function togglePlakaGrubuFormSections() {
  const kullanimAlani = document.getElementById('plakaGrubuKullanimAlani').value;
  
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
}

// Plaka sayısı değiştiğinde kullanılacak miktarı güncelle
function updateKullanilanMiktarFromPlakaSayisi() {
  if (!currentPlakaGrubu) return;
  
  const plakaSayisi = parseInt(document.getElementById('plakaGrubuPlakaSayisiInput').value) || 1;
  const plakaAgirligi = parseFloat(currentPlakaGrubu.plaka_agirlik);
  
  // Toplam kullanılacak ağırlığı hesapla
  const kullanilanMiktar = plakaSayisi * plakaAgirligi;
  
  // Kullanılan miktar alanını güncelle
  document.getElementById('plakaGrubuKullanilanMiktar').value = kullanilanMiktar.toFixed(2);
}

// Plaka Grubu İşlemi Kaydetme
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
    
    // Önce değerleri yuvarla (hassasiyet için)
    const grupKalanKilo = Math.round(parseFloat(currentPlakaGrubu.kalan_kilo) * 100) / 100;
    const yuvarlananKullanilanMiktar = Math.round(kullanilanMiktar * 100) / 100;
    const yuvarlananHurdaMiktar = Math.round(hurdaMiktar * 100) / 100;
    
    // Toplam kalan parça ağırlığını hesapla
    const toplamParcaAgirligi = window.kalanParcalar ? window.kalanParcalar.reduce((toplam, parca) => {
      return toplam + Math.round(parseFloat(parca.agirlik) * 100) / 100;
    }, 0) : 0;
    
    const toplamKullanilacak = yuvarlananKullanilanMiktar + yuvarlananHurdaMiktar + toplamParcaAgirligi;
    
    // Hassasiyet toleransı
    const HASSASIYET_TOLERANSI = 0.01;
    
    if (toplamKullanilacak > (grupKalanKilo + HASSASIYET_TOLERANSI)) {
      showModalError('plakaGrubuIslemModal', 
          `Kullanmak istediğiniz toplam miktar (${toplamKullanilacak.toFixed(2)} kg) grupda kalan miktardan (${grupKalanKilo.toFixed(2)} kg) fazla.`);
      return;
    }
    
    // ÖNEMLİ: Makine İmalat ise ve Yarı Mamul var ise
    let yariMamulDataList = [];
    if (kullanimAlani === 'MakineImalat') {
      // Tüm yarı mamul öğelerini toplayalım
      const yarimamulItems = document.querySelectorAll('#plakaGrubuYariMamulList .yarimamul-item');
      if (yarimamulItems.length === 0) {
        showModalError('plakaGrubuIslemModal', 'Makine imalat için en az bir yarı mamul girmelisiniz.');
        return;
      }
      
      // Her bir yarı mamul için veri oluştur
      for (const item of yarimamulItems) {
        const index = item.dataset.index;
        const adi = document.getElementById(`plakaGrubuYariMamulAdi_${index}`).value?.trim();
        const birim = document.getElementById(`plakaGrubuYariMamulBirim_${index}`).value;
        const miktar = parseFloat(document.getElementById(`plakaGrubuYariMamulMiktar_${index}`).value) || 0;
        const birimAgirlik = parseFloat(document.getElementById(`plakaGrubuYariMamulAgirlik_${index}`).value) || 0;
        
        // Boş alan kontrolü
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
        
        // Yarı mamul verisini listeye ekle
        yariMamulDataList.push({
          adi: adi,
          birim: birim,
          miktar: miktar,
          birimAgirlik: birimAgirlik,
          toplamAgirlik: miktar * birimAgirlik
        });
      }
    }
    
    // Kalan parça bilgileri
    let kalanParcaDataList = [];
    if (document.getElementById('plakaGrubuKalanParcaSwitch').checked && window.kalanParcalar && window.kalanParcalar.length > 0) {
      // Her bir kalan parça için veri oluştur
      kalanParcaDataList = window.kalanParcalar.map(parca => ({
        en: parca.en,
        boy: parca.boy,
        kalinlik: parca.kalinlik,
        hesaplanan_agirlik: parca.agirlik,
        plaka_grubu_id: currentPlakaGrubuId
      }));
    }
    
    // İşlem verisi
    const islemData = {
      plaka_grubu_id: currentPlakaGrubuId,
      plaka_sayisi: plakaSayisi,
      islem_turu: islemTuru,
      kullanim_alani: kullanimAlani,
      kullanilanMiktar: kullanilanMiktar,
      hurdaMiktar: hurdaMiktar,
      proje_id: projeId,
      musteri_id: musteriId || null,
      kullanici_id: currentUser.id,
      kalan_parcalar: kalanParcaDataList,
      yari_mamuller: yariMamulDataList,
      makine: makine,
      calisan_id: parseInt(calisanId)
    };
    
    // İşlem kaydediliyor mesajını göster
    showModalSuccess('plakaGrubuIslemModal', 'İşlem kaydediliyor...');
    
    // İşlemi kaydet
    const result = await window.electronAPI.invoke.database.addPlakaGrubuIslem(islemData);
    
    if (result.success) {
      let successMessage = 'Plaka grubu işlemi başarıyla kaydedildi.';
      
      // Yarı mamul oluşturulmuşsa ek bilgi göster
      if (kullanimAlani === 'MakineImalat' && yariMamulDataList.length > 0) {
        const toplamYariMamul = yariMamulDataList.reduce((toplam, ym) => toplam + ym.miktar, 0);
        const birimText = yariMamulDataList.length > 0 ? yariMamulDataList[0].birim : 'adet';
        successMessage += ` Toplam ${toplamYariMamul} ${birimText} yarı mamul oluşturuldu.`;
      }
      
      showToast(successMessage, 'success');
      
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
        // Yarı mamul listesini de güncelle
        await loadYariMamulListesi();
      }
      
      // Hammadde detayını yeniden yükle
      if (currentHammaddeId) {
        await viewHammaddeDetail(currentHammaddeId);
      }
    } else {
      showModalError('plakaGrubuIslemModal', 'Hata: ' + result.message);
    }
  } catch (error) {
    console.error('Plaka grubu işlemi kaydetme hatası:', error);
    showModalError('plakaGrubuIslemModal', 'İşlem kaydedilirken bir hata oluştu: ' + error.message);
  }
}// Plaka gruplarını görüntülemek için HTML ve JavaScript

window.loadPlakaGruplari = loadPlakaGruplari;

document.addEventListener('DOMContentLoaded', function() {
  // Yeni Plaka Grubu Ekle butonu
  const yeniPlakaGrubuEkleBtn = document.getElementById('yeniPlakaGrubuEkleBtn');
  if (yeniPlakaGrubuEkleBtn) {
    yeniPlakaGrubuEkleBtn.addEventListener('click', openYeniPlakaGrubuModal);
  }
  
  // Plaka Grubu Hesaplama butonu
  const hesaplaPlakaGrubuBtn = document.getElementById('hesaplaPlakaGrubuBtn');
  if (hesaplaPlakaGrubuBtn) {
    hesaplaPlakaGrubuBtn.addEventListener('click', calculatePlakaGrubu);
  }
  
  // Plaka Grubu Kaydet butonu
  const plakaGrubuKaydetBtn = document.getElementById('plakaGrubuKaydetBtn');
  if (plakaGrubuKaydetBtn) {
    plakaGrubuKaydetBtn.addEventListener('click', savePlakaGrubu);
  }
  
  // Plaka Grubu İşlem Kaydet butonu
  const plakaGrubuIslemKaydetBtn = document.getElementById('plakaGrubuIslemKaydetBtn');
  if (plakaGrubuIslemKaydetBtn) {
    plakaGrubuIslemKaydetBtn.addEventListener('click', savePlakaGrubuIslem);
  }
  
  // Diğer event listener'lar...
});