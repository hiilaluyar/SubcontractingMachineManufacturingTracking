
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
  
  // Mark an item as edited
  function markItemAsEdited(itemType, itemId, operation) {
    // İlgili itemType için nesne yoksa oluştur
    if (!window.editedItems[itemType]) {
      window.editedItems[itemType] = {};
    }
    
    window.editedItems[itemType][itemId] = {
      edited: true,
      operation: operation, // 'IkincilStok', 'IskartaUrun', etc.
      timestamp: Date.now()
    };
    saveEditedItems();
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


// Updated editIslem function to check iskarta_urun flag
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
      }
      
      Notiflix.Notify.info(message + ' Tekrar düzenlenemez.');
      return;
    }
    
    // Continue with the normal edit operation
    // API kontrolü
    if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
      console.error('Database invoke metodu bulunamadı');
      alert('İşlem bilgileri alınamadı. API erişimi yok.');
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
      alert('Geçersiz işlem türü.');
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
      
      // İkincil stok ile ilgili elementleri gizle
      if (document.getElementById('duzenleIkincilStokSecimiContainer')) {
        document.getElementById('duzenleIkincilStokSecimiContainer').style.display = 'none';
      }
      
      // Iskarta ürün container'ı her zaman görünür olmalı
      document.getElementById('duzenleIskartaUrunSecimiContainer').style.display = 'block';
      
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
      alert('İşlem bilgileri alınamadı: ' + result.message);
    }
  } catch (error) {
    console.error('İşlem bilgileri alınırken hata:', error);
    alert('İşlem bilgileri alınırken bir hata oluştu.');
  }
}
  

async function updateYariMamulIslem() {
  try {
    const islemId = document.getElementById('duzenleYariMamulIslemId').value;
    const islemTuru = document.getElementById('duzenleYariMamulIslemTuru').value;
    const kullanimAlani = document.getElementById('duzenleYariMamulKullanimAlani').value;
    const isIskartaUrun = document.getElementById('duzenleYariMamulIskartaUrunSecimi').checked;
    const projeId = document.getElementById('duzenleYariMamulProjeSecimi').value;
    
    if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
      console.error('Database invoke metodu bulunamadı');
      showErrorMessage('Hata', 'İşlem kaydedilemedi. API erişimi yok.');
      return;
    }
    
    // Operation type for tracking
    let operationType = '';
    if (isIskartaUrun) {
      operationType = 'IskartaUrun';
    } else {
      operationType = 'Normal';
    }
    
    const islemData = {
      islem_turu: islemTuru,
      kullanim_alani: kullanimAlani,
      proje_id: projeId || null,
      iskarta_urun: isIskartaUrun
    };
    
    const result = await window.electronAPI.invoke.database.updateYariMamulIslem(islemId, islemData);
    
    if (result.success) {
      // Mark the item as edited
      markItemAsEdited('yari_mamul', islemId, operationType);
      
      // Customize the message based on the operation
      let message = 'İşlem başarıyla güncellendi.';
      
      if (isIskartaUrun) {
        message = 'Ürün başarıyla ıskarta listesine gönderildi.';
        Notiflix.Notify.success('Ürün başarıyla ıskarta listesine gönderildi.');
      }
      
      showToast(message, 'success');
      
      // Modalı kapat
      closeModal('yariMamulIslemDuzenleModal');
      
      // Listeleri güncelle
      loadFasonIslemler();
      loadMakineIslemler();
      loadIskartaUrunler();
    } else {
      showErrorMessage('Hata', 'İşlem güncellenirken bir hata oluştu: ' + result.message);
    }
  } catch (error) {
    console.error('Yarı mamul işlemi güncelleme hatası:', error);
    showErrorMessage('Hata', 'İşlem güncellenirken bir hata oluştu: ' + error.message);
  }
}


async function updateIslem() {
  try {
    const islemId = document.getElementById('duzenleIslemId').value;
    const islemTuru = document.getElementById('duzenleIslemTuru').value;
    
    // Orijinal kullanım alanını koru
    const kullanimAlani = document.getElementById('duzenleKullanimAlani').value;
    
    // Flag for iskarta operation
    const isIskartaUrun = document.getElementById('duzenleIskartaUrunSecimi').checked;
    
    const projeId = document.getElementById('duzenleProjeSecimi').value;
    
    // API kontrolü
    if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
      console.error('Database invoke metodu bulunamadı');
      showErrorMessage('Hata', 'İşlem kaydedilemedi. API erişimi yok.');
      return;
    }

    let result;
    
    // Operation type for tracking
    let operationType = isIskartaUrun ? 'IskartaUrun' : 'Normal';
    
    // İşlem verisi hazırla - iskarta_urun flagini ekle
    const islemData = {
      islem_turu: islemTuru,
      kullanim_alani: kullanimAlani, // Kullanım alanını koru
      proje_id: projeId || null,
      iskarta_urun: isIskartaUrun, // Iskarta ürün flagini ekle
    };
    
    // İşlem türüne göre doğru API çağrısını yap
    if (window.currentIslemType === 'hammadde') {
      result = await window.electronAPI.invoke.database.updateIslem(islemId, islemData);
      
      // Mark the hammadde item as edited
      if (result.success) {
        markItemAsEdited('hammadde', islemId, operationType);
      }
    } else if (window.currentIslemType === 'sarf_malzeme') {
      result = await window.electronAPI.invoke.database.updateSarfMalzemeIslem(islemId, islemData);
      
      // Mark the sarf_malzeme item as edited
      if (result.success) {
        markItemAsEdited('sarf_malzeme', islemId, operationType);
      }
    } else if (window.currentIslemType === 'yari_mamul') {
      result = await window.electronAPI.invoke.database.updateYariMamulIslem(islemId, islemData);
      
      // Mark the yari_mamul item as edited
      if (result.success) {
        markItemAsEdited('yari_mamul', islemId, operationType);
      }
    } else {
      throw new Error('Geçersiz işlem türü: ' + window.currentIslemType);
    }
    
    if (result.success) {
      // Customize the message based on the operation
      let message = 'İşlem başarıyla güncellendi.';
      
      if (isIskartaUrun) {
        message = 'Ürün başarıyla ıskarta listesine gönderildi.';
        Notiflix.Notify.success('Ürün başarıyla ıskarta listesine gönderildi.');
      }
      
      showToast(message, 'success');
      
      // Modalı kapat
      closeModal('islemDuzenleModal');
      
      // Listeleri güncelle
      loadFasonIslemler();
      loadMakineIslemler();
      loadIskartaUrunler();
    } else {
      showErrorMessage('Hata', 'İşlem güncellenirken bir hata oluştu: ' + result.message);
    }
  } catch (error) {
    console.error('İşlem güncelleme hatası:', error);
    showErrorMessage('Hata', 'İşlem güncellenirken bir hata oluştu: ' + error.message);
  }
}


// Updated editSarfMalzemeIslem function
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
      alert('İşlem bilgileri alınamadı: ' + sarfMalzemeIslemResult.message);
    }
  } catch (error) {
    console.error('İşlem bilgileri alınırken hata:', error);
    alert('İşlem bilgileri alınırken bir hata oluştu.');
  }
}

// Sarf malzeme işlemini güncelleme
async function updateSarfMalzemeIslem() {
  try {
    const islemId = document.getElementById('duzenleSarfMalzemeIslemId').value;
    const islemTuru = document.getElementById('duzenleSarfMalzemeIslemTuru').value;
    const kullanimAlani = document.getElementById('duzenleSarfMalzemeKullanimAlani').value;
    const projeId = document.getElementById('duzenleSarfMalzemeProjeSecimi').value;
    
    // YENİ: Makine ve çalışan bilgilerini al
    const makine = document.getElementById('duzenleSarfMalzemeMakineSecimi').value;
    const calisanId = document.getElementById('duzenleSarfMalzemeCalisanSecimi').value;
    
    // Iskarta ürün checkbox değerini al
    const isIskartaUrun = document.getElementById('duzenleSarfMalzemeIskartaUrunSecimi').checked;
    
    // API kontrolü
    if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
      console.error('Database invoke metodu bulunamadı');
      showErrorMessage('Hata', 'İşlem kaydedilemedi. API erişimi yok.');
      return;
    }
    
    // İşlem verisi
    const islemData = {
      islem_turu: islemTuru,
      kullanim_alani: kullanimAlani,
      proje_id: projeId || null,
      iskarta_urun: isIskartaUrun,
      // YENİ: Makine ve çalışan alanları
      makine: (kullanimAlani === 'FasonImalat') ? makine : null,
      calisan_id: (kullanimAlani === 'FasonImalat' || kullanimAlani === 'MakineImalat') ? calisanId : null
    };
    
    // İşlemi güncelle
    const result = await window.electronAPI.invoke.database.updateSarfMalzemeIslem(islemId, islemData);
    
    if (result.success) {
      // Iskarta ürün seçeneği işaretli ise
      if (isIskartaUrun) {
        // İşlemi işlenmiş olarak işaretle
        markItemAsEdited('sarf_malzeme', islemId, 'IskartaUrun');
        
        showToast('İşlem başarıyla güncellendi ve ıskarta olarak işaretlendi.', 'success');
      }
      // Normal güncelleme yapıldıysa
      else {
        // İşlemi işlenmiş olarak işaretle
        markItemAsEdited('sarf_malzeme', islemId, 'Normal');
        
        showToast('İşlem başarıyla güncellendi.', 'success');
      }
      
      // Modalı kapat
      closeModal('sarfMalzemeIslemDuzenleModal');
      
      // Listeleri güncelle
      loadFasonIslemler();
      loadMakineIslemler();
      loadIskartaUrunler();
      
    } else {
      showErrorMessage('Hata', 'İşlem güncellenirken bir hata oluştu: ' + result.message);
    }
  } catch (error) {
    console.error('İşlem güncelleme hatası:', error);
    showErrorMessage('Hata', 'İşlem güncellenirken bir hata oluştu: ' + error.message);
  }
}


window.editIslem = editIslem;
window.updateIslem = updateIslem;

// Sarf malzeme fonksiyonları


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





// İşlenmiş öğeleri localStorage'da saklayan fonksiyon
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


  