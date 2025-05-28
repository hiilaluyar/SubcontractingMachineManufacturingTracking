
//fasonMakineIslemler.js

async function loadIskartaUrunler() {
  try {
    console.log('Iskarta ürünler yükleniyor...');
    
    // API kontrolü
    if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
      console.error('Database invoke metodu bulunamadı');
      
      const iskartaTable = document.getElementById('iskartaTable').getElementsByTagName('tbody')[0];
      iskartaTable.innerHTML = '<tr><td colspan="8" class="text-center">Veri yüklenirken hata oluştu</td></tr>';
      return;
    }
    
    // Yükleme göstergesini göster
    const iskartaTable = document.getElementById('iskartaTable').getElementsByTagName('tbody')[0];
    iskartaTable.innerHTML = '<tr><td colspan="8" class="text-center"><div class="spinner-border text-primary" role="status"></div><div>Iskarta ürünler yükleniyor...</div></td></tr>';
    
    // Tek sorguda tüm iskarta ürünleri yükle
    const result = await window.electronAPI.invoke.database.getIskartaUrunlerHepsiBirlikte();
    
    if (!result.success) {
      throw new Error(result.message || 'Iskarta ürünler yüklenemedi');
    }
    
    const tumIslemler = result.islemler;
    
    // Tabloyu temizle
    iskartaTable.innerHTML = '';
    
    if (tumIslemler.length === 0) {
      const row = iskartaTable.insertRow();
      row.innerHTML = '<td colspan="8" class="text-center">Iskarta ürün bulunamadı</td>';
      return;
    }
    
    // Tarihe göre sırala (en yeni en üstte)
    tumIslemler.sort((a, b) => new Date(b.islem_tarihi) - new Date(a.islem_tarihi));
    
    tumIslemler.forEach(islem => {
      const row = iskartaTable.insertRow();
      
      // İşlem türüne göre data attribute'larını ekle
      row.setAttribute('data-islem-id', islem.islem_id);
      row.setAttribute('data-islem-type', islem.islem_turu);
      
      // Stok Kodu - Sadece stok kodunu göster
      const cell1 = row.insertCell(0);
      cell1.innerHTML = `<strong>${islem.stok_kodu}</strong>`;
      
      // Malzeme (malzeme adı, ölçüler ve barkod)
      const cell2 = row.insertCell(1);
      
      // İşlem türüne göre malzeme bilgisini yapılandır
      if (islem.islem_turu === 'hammadde') {
        cell2.innerHTML = `
          <div>${islem.malzeme_adi} ${islem.kalinlik}x${islem.en}x${islem.boy} mm</div>
          <div class="small-text">${islem.barkod_kodu || ''}</div>
        `;
      } else if (islem.islem_turu === 'sarf_malzeme') {
        // Sarf malzeme için farklı bir gösterim
        cell2.innerHTML = `
          <div>${islem.malzeme_adi} (Sarf Malzeme)</div>
          <div class="small-text">${islem.birim || ''}</div>
        `;
      } else if (islem.islem_turu === 'yari_mamul') {
        // Yarı mamul için farklı bir gösterim
        cell2.innerHTML = `
          <div>${islem.malzeme_adi} (Yarı Mamul)</div>
          <div class="small-text">${islem.birim || ''}</div>
        `;
      } else if (islem.islem_turu === 'ikincil_stok') {
        // İkincil stok için özel görünüm
        cell2.innerHTML = `
          <div>${islem.malzeme_adi} (İkincil Stok)</div>
          <div class="small-text">${islem.birim || ''}</div>
        `;
      }
      
      // Proje - Proje adından gelen değeri göster
      const cell3 = row.insertCell(2);
      cell3.textContent = islem.proje_adi || 'Belirtilmemiş';
      
      // İşlem Türü
      const cell4 = row.insertCell(3);
      let islemText = '';
      
      if (islem.islem_turu === 'hammadde') {
        // Hammadde işlem türleri
        switch (islem.hammadde_islem_turu) {
          case 'LazerKesim':
            islemText = 'Lazer Kesim';
            break;
          case 'KaynakliImalat':
            islemText = 'Kaynaklı İmalat';
            break;
          case 'TalasliImalat':
            islemText = 'Talaşlı İmalat';
            break;
          default:
            islemText = islem.hammadde_islem_turu;
        }
      } else if (islem.islem_turu === 'sarf_malzeme' || islem.islem_turu === 'yari_mamul') {
        // Sarf malzeme ya da yarı mamul işlem türleri
        islemText = islem.sarf_islem_turu || 'Standart';
      } else if (islem.islem_turu === 'ikincil_stok') {
        // İkincil stok işlem türleri (Kullanım veya İade)
        islemText = islem.sarf_islem_turu || 'Standart';
      }
      
      cell4.textContent = islemText;
      
      // Miktar (Kullanılan + Hurda) - Eski cell5 yerine cell6 olacak
      const cell5 = row.insertCell(4);
      
      if (islem.islem_turu === 'hammadde') {
        cell5.innerHTML = `
          <div>Kullanılan: ${parseFloat(islem.kullanilanMiktar).toFixed(2)} kg</div>
          <div>Hurda: ${parseFloat(islem.hurdaMiktar).toFixed(2)} kg</div>
        `;
      } else {
        // Sarf malzeme, yarı mamul veya ikincil stok için sadece miktar göster
        cell5.innerHTML = `
          <div>Miktar: ${parseFloat(islem.miktar).toFixed(2)} ${islem.birim || ''}</div>
        `;
      }
      
      // Alan Kişi (çalışan) sütunu - Eski cell6 yerine cell5 olacak
      const cell6 = row.insertCell(5);
      if (islem.calisan_ad && islem.calisan_soyad) {
        cell6.textContent = `${islem.calisan_ad} ${islem.calisan_soyad}`;
      } else {
        cell6.textContent = '-';
      }
      
      // İşlemi Yapan (Kullanıcı)
      const cell7 = row.insertCell(6);
      cell7.textContent = `${islem.kullanici_ad} ${islem.kullanici_soyad}`;
      
      // Tarih
      const cell8 = row.insertCell(7);
      const date = new Date(islem.islem_tarihi);
      cell8.textContent = date.toLocaleString('tr-TR');
    });
    
  } catch (error) {
    console.error('Iskarta ürünleri yükleme hatası:', error);
    
    const iskartaTable = document.getElementById('iskartaTable').getElementsByTagName('tbody')[0];
    iskartaTable.innerHTML = '<tr><td colspan="8" class="text-center">Ürünler yüklenirken hata oluştu</td></tr>';
  }
}

async function loadFasonIslemler() {
  try {
    console.log('Fason işlemleri yükleniyor...');
    
    // API kontrolü
    if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
      console.error('Database invoke metodu bulunamadı');
      
      const fasonTable = document.getElementById('fasonTable').getElementsByTagName('tbody')[0];
      fasonTable.innerHTML = '<tr><td colspan="9" class="text-center">Veri yüklenirken hata oluştu</td></tr>';
      return;
    }
    
    // Yükleme göstergesini göster
    const fasonTable = document.getElementById('fasonTable').getElementsByTagName('tbody')[0];
    fasonTable.innerHTML = '<tr><td colspan="9" class="text-center"><div class="spinner-border text-primary" role="status"></div><div>İşlemler yükleniyor...</div></td></tr>';
    
    // Tüm işlem türlerini paralel yükle
    const [
      hammaddeResult,
      plakaGrubuIslemler
    ] = await Promise.all([
      window.electronAPI.invoke.database.getFasonIslemlerHepsiBirlikte(),
      loadPlakaGrubuFasonIslemler()
    ]);
    
    // Tüm işlemleri birleştir
    const tumIslemler = [];
    
    // Mevcut hammadde/sarf/yarımamul işlemler
    if (hammaddeResult.success) {
      tumIslemler.push(...hammaddeResult.islemler);
    }
    
    // Plaka grubu işlemlerini ekle
    tumIslemler.push(...plakaGrubuIslemler);
    
    // İşlenmiş öğeleri localStorage'dan al
    const editedItems = JSON.parse(localStorage.getItem('editedItems') || '{}');
    
    // Tabloyu temizle
    fasonTable.innerHTML = '';
    
    if (tumIslemler.length === 0) {
      const row = fasonTable.insertRow();
      row.innerHTML = '<td colspan="9" class="text-center">Fason işlem bulunamadı</td>';
      return;
    }
    
    // Tarihe göre sırala (en yeni en üstte)
    tumIslemler.sort((a, b) => new Date(b.islem_tarihi) - new Date(a.islem_tarihi));
    
    tumIslemler.forEach(islem => {
      const row = fasonTable.insertRow();
      
      // İşlem türüne göre data attribute'larını ekle
      row.setAttribute('data-islem-id', islem.islem_id);
      row.setAttribute('data-islem-type', islem.islem_turu);
      
      // Stok Kodu
      const cell1 = row.insertCell(0);
      cell1.innerHTML = `<strong>${islem.stok_kodu}</strong>`;
      
      // Malzeme
      const cell2 = row.insertCell(1);
      
      // İşlem türüne göre malzeme bilgisini yapılandır
      if (islem.islem_turu === 'hammadde') {
        cell2.innerHTML = `
          <div>${islem.malzeme_adi} ${islem.kalinlik}x${islem.en}x${islem.boy} mm</div>
          <div class="small-text">${islem.barkod_kodu || ''}</div>
        `;
      } else if (islem.islem_turu === 'sarf_malzeme') {
        cell2.innerHTML = `
          <div>${islem.malzeme_adi} (Sarf Malzeme)</div>
          <div class="small-text">${islem.birim || ''}</div>
        `;
      } else if (islem.islem_turu === 'yari_mamul') {
        cell2.innerHTML = `
          <div>${islem.malzeme_adi} (Yarı Mamul)</div>
          <div class="small-text">${islem.birim || ''}</div>
        `;
      } else if (islem.islem_turu === 'plaka_grubu') {
        cell2.innerHTML = `
          <div>${islem.malzeme_adi}</div>
          <div class="small-text">Plaka Grubu</div>
        `;
      }
      
      // İşlem Türü (Proje sütunu kaldırıldı, bu artık 3. sütun)
      const cell3 = row.insertCell(2);
      let islemText = '';
      
      if (islem.islem_turu === 'hammadde') {
        switch (islem.hammadde_islem_turu) {
          case 'LazerKesim':
            islemText = 'Lazer Kesim';
            break;
          case 'KaynakliImalat':
            islemText = 'Kaynaklı İmalat';
            break;
          case 'TalasliImalat':
            islemText = 'Talaşlı İmalat';
            break;
          default:
            islemText = islem.hammadde_islem_turu;
        }
      } else if (islem.islem_turu === 'plaka_grubu') {
        switch (islem.hammadde_islem_turu) {
          case 'LazerKesim':
            islemText = 'Lazer Kesim';
            break;
          case 'KaynakliImalat':
            islemText = 'Kaynaklı İmalat';
            break;
          case 'TalasliImalat':
            islemText = 'Talaşlı İmalat';
            break;
          default:
            islemText = islem.hammadde_islem_turu;
        }
      } else {
        islemText = islem.sarf_islem_turu || 'Standart';
      }
      
      cell3.textContent = islemText;
      
      // Alan Kişi (çalışan) sütunu (artık 4. sütun)
      const cell4 = row.insertCell(3);
      if (islem.calisan_ad && islem.calisan_soyad) {
        cell4.textContent = `${islem.calisan_ad} ${islem.calisan_soyad}`;
      } else {
        cell4.textContent = '-';
      }
      
      // Miktar (artık 5. sütun)
      const cell5 = row.insertCell(4);
      
      if (islem.islem_turu === 'hammadde' || islem.islem_turu === 'plaka_grubu') {
        cell5.innerHTML = `
          <div>Kullanılan: ${parseFloat(islem.kullanilanMiktar).toFixed(2)} kg</div>
          <div>Hurda: ${parseFloat(islem.hurdaMiktar).toFixed(2)} kg</div>
        `;
      } else {
        cell5.innerHTML = `
          <div>Miktar: ${parseFloat(islem.miktar).toFixed(2)} ${islem.birim || ''}</div>
        `;
      }
      
      // Makine (artık 6. sütun)
      const cell6 = row.insertCell(5);
      cell6.textContent = islem.makine || '-';
      
      // Müşteri (artık 7. sütun)
      const cell7 = row.insertCell(6);
      cell7.textContent = islem.musteri_adi || '-';
      
      // Tarih (artık 8. sütun)
      const cell8 = row.insertCell(7);
      const date = new Date(islem.islem_tarihi);
      cell8.textContent = date.toLocaleString('tr-TR');
      
      // İşlemler (artık 9. sütun)
      const cell9 = row.insertCell(8);
      
      // İşlemin ID'sini ve türünü belirle
      const itemId = islem.islem_id;
      let itemType = islem.islem_turu;
      
      // İşlem daha önce işlenmiş mi kontrol et
      let isProcessed = editedItems[itemType] && editedItems[itemType][itemId];
      
      // Düzenleme butonu oluştur
      let editButtonHtml = '';
      
      if (isProcessed) {
        const operationType = editedItems[itemType][itemId].operationType || 'Normal';
        let tooltipText = 'Bu işlem tamamlandı';
        
        if (operationType === 'IkincilStok') {
          tooltipText = 'Bu ürün ikincil stoğa gönderildi';
        } else if (operationType === 'IskartaUrun') {
          tooltipText = 'Bu ürün ıskarta listesine gönderildi';
        }
        
        editButtonHtml = `
          <button class="action-btn processed-item" title="${tooltipText}" disabled
            data-item-id="${itemId}" data-item-type="${itemType}">
            <i class="fas fa-check"></i>
          </button>
        `;
      } else {
        // İşlem türüne göre düzenleme butonu
        if (itemType === 'hammadde') {
          editButtonHtml = `
            <button class="action-btn edit" title="İşlemi Düzenle" onclick="editIslem(${itemId}, 'hammadde')"
              data-item-id="${itemId}" data-item-type="${itemType}">
              <i class="fas fa-edit"></i>
            </button>
          `;
        } else if (itemType === 'sarf_malzeme') {
          editButtonHtml = `
            <button class="action-btn edit" title="İşlemi Düzenle" onclick="editIslem(${itemId}, 'sarf_malzeme')"
              data-item-id="${itemId}" data-item-type="${itemType}">
              <i class="fas fa-edit"></i>
            </button>
          `;
        } else if (itemType === 'yari_mamul') {
          editButtonHtml = `
            <button class="action-btn edit" title="İşlemi Düzenle" onclick="editYariMamulIslem(${itemId})"
              data-item-id="${itemId}" data-item-type="${itemType}">
              <i class="fas fa-edit"></i>
            </button>
          `;
        } else if (itemType === 'plaka_grubu') {
          // Plaka grubu için sadece silme işlemi
          editButtonHtml = `
            <button class="action-btn delete" title="İşlemi Sil" onclick="deletePlakaGrubuIslem(${itemId})"
              data-item-id="${itemId}" data-item-type="${itemType}">
              <i class="fas fa-trash"></i>
            </button>
          `;
        }
      }
      
      cell9.innerHTML = `
        <div class="action-buttons">
          ${editButtonHtml}
        </div>
      `;
    });
    
    updateFasonMakineIslemlerButtons();
    
  } catch (error) {
    console.error('Fason işlemleri yükleme hatası:', error);
    
    const fasonTable = document.getElementById('fasonTable').getElementsByTagName('tbody')[0];
    fasonTable.innerHTML = '<tr><td colspan="9" class="text-center">İşlemler yüklenirken hata oluştu</td></tr>';
  }
}

async function loadMakineIslemler() {
  try {
    console.log('Makine işlemleri yükleniyor...');
    
    // API kontrolü
    if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
      console.error('Database invoke metodu bulunamadı');
      
      const makineTable = document.getElementById('makineTable').getElementsByTagName('tbody')[0];
      makineTable.innerHTML = '<tr><td colspan="9" class="text-center">Veri yüklenirken hata oluştu</td></tr>';
      return;
    }
    
    // Yükleme göstergesini göster
    const makineTable = document.getElementById('makineTable').getElementsByTagName('tbody')[0];
    makineTable.innerHTML = '<tr><td colspan="9" class="text-center"><div class="spinner-border text-primary" role="status"></div><div>İşlemler yükleniyor...</div></td></tr>';
    
    // SADECE TEK SORGU ÇALIŞTIR - gereksiz paralel işlemleri kaldır
    const hammaddeResult = await window.electronAPI.invoke.database.getMakineIslemlerHepsiBirlikte();
    
    // Tüm işlemleri birleştir
    const tumIslemler = [];
    const yuklenenIslemIDs = new Set();

    // Backend'den gelen tüm işlemleri ekle (hammadde, sarf malzeme, yarı mamul, plaka grubu hepsi dahil)
    if (hammaddeResult.success) {
      hammaddeResult.islemler.forEach(islem => {
        const islemKey = `${islem.islem_turu}_${islem.islem_id}`;
        yuklenenIslemIDs.add(islemKey);
        tumIslemler.push(islem);
      });
    }
    
    // İşlenmiş öğeleri localStorage'dan al
    const editedItems = JSON.parse(localStorage.getItem('editedItems') || '{}');
    
    // Tabloyu temizle
    makineTable.innerHTML = '';
    
    if (tumIslemler.length === 0) {
      const row = makineTable.insertRow();
      row.innerHTML = '<td colspan="9" class="text-center">Makine işlemi bulunamadı</td>';
      return;
    }
    
    // Tarihe göre sırala (en yeni en üstte)
    tumIslemler.sort((a, b) => new Date(b.islem_tarihi) - new Date(a.islem_tarihi));
    
    tumIslemler.forEach(islem => {
      const row = makineTable.insertRow();
      
      // İşlem türüne göre data attribute'larını ekle
      row.setAttribute('data-islem-id', islem.islem_id);
      row.setAttribute('data-islem-type', islem.islem_turu);
      
      // Stok Kodu
      const cell1 = row.insertCell(0);
      cell1.innerHTML = `<strong>${islem.stok_kodu}</strong>`;
      
      // Malzeme
      const cell2 = row.insertCell(1);
      
      // İşlem türüne göre malzeme bilgisini yapılandır
      if (islem.islem_turu === 'hammadde') {
        cell2.innerHTML = `
          <div>${islem.malzeme_adi} ${islem.kalinlik}x${islem.en}x${islem.boy} mm</div>
          <div class="small-text">${islem.barkod_kodu || ''}</div>
        `;
      } else if (islem.islem_turu === 'sarf_malzeme') {
        cell2.innerHTML = `
          <div>${islem.malzeme_adi} (Sarf Malzeme)</div>
          <div class="small-text">${islem.birim || ''}</div>
        `;
      } else if (islem.islem_turu === 'yari_mamul') {
        cell2.innerHTML = `
          <div>${islem.malzeme_adi} (Yarı Mamul)</div>
          <div class="small-text">${islem.birim || ''}</div>
        `;
      } else if (islem.islem_turu === 'ikincil_stok') {
        cell2.innerHTML = `
          <div>${islem.malzeme_adi} (İkincil Stok)</div>
          <div class="small-text">${islem.birim || ''}</div>
        `;
      } else if (islem.islem_turu === 'plaka_grubu') {
        cell2.innerHTML = `
          <div>${islem.malzeme_adi}</div>
          <div class="small-text">Plaka Grubu</div>
        `;
      }
      
      // Proje
      const cell3 = row.insertCell(2);
      cell3.textContent = islem.proje_adi || 'Belirtilmemiş';
      
      // İşlem Türü
      const cell4 = row.insertCell(3);
      let islemText = '';
      
      if (islem.islem_turu === 'hammadde') {
        switch (islem.hammadde_islem_turu) {
          case 'LazerKesim':
            islemText = 'Lazer Kesim';
            break;
          case 'KaynakliImalat':
            islemText = 'Kaynaklı İmalat';
            break;
          case 'TalasliImalat':
            islemText = 'Talaşlı İmalat';
            break;
          default:
            islemText = islem.hammadde_islem_turu;
        }
      } else if (islem.islem_turu === 'sarf_malzeme' || islem.islem_turu === 'yari_mamul') {
        islemText = islem.sarf_islem_turu || 'Standart';
      } else if (islem.islem_turu === 'ikincil_stok') {
        islemText = islem.sarf_islem_turu || 'Standart';
      } else if (islem.islem_turu === 'plaka_grubu') {
        switch (islem.hammadde_islem_turu) {
          case 'LazerKesim':
            islemText = 'Lazer Kesim';
            break;
          case 'KaynakliImalat':
            islemText = 'Kaynaklı İmalat';
            break;
          case 'TalasliImalat':
            islemText = 'Talaşlı İmalat';
            break;
          default:
            islemText = islem.hammadde_islem_turu || 'Plaka Grubu İşlemi';
        }
      }
      
      cell4.textContent = islemText;
      
      // Alan Kişi (çalışan) sütunu
      const cell5 = row.insertCell(4);
      if (islem.calisan_ad && islem.calisan_soyad) {
        cell5.textContent = `${islem.calisan_ad} ${islem.calisan_soyad}`;
      } else if (islem.makine) {
        cell5.textContent = `Makine: ${islem.makine}`;
      } else {
        cell5.textContent = '-';
      }
      
      // Miktar
      const cell6 = row.insertCell(5);
      
      if (islem.islem_turu === 'hammadde' || islem.islem_turu === 'plaka_grubu') {
        cell6.innerHTML = `
          <div>Kullanılan: ${parseFloat(islem.kullanilanMiktar).toFixed(2)} kg</div>
          <div>Hurda: ${parseFloat(islem.hurdaMiktar || 0).toFixed(2)} kg</div>
        `;
      } else {
        // Sarf malzeme, yarı mamul veya ikincil stok için sadece miktar göster
        cell6.innerHTML = `
          <div>Miktar: ${parseFloat(islem.miktar).toFixed(2)} ${islem.birim || ''}</div>
        `;
      }
      
      // İşlemi Yapan (Kullanıcı)
      const cell7 = row.insertCell(6);
      cell7.textContent = `${islem.kullanici_ad} ${islem.kullanici_soyad}`;
      
      // Tarih
      const cell8 = row.insertCell(7);
      const date = new Date(islem.islem_tarihi);
      cell8.textContent = date.toLocaleString('tr-TR');
      
      // İşlemler
      const cell9 = row.insertCell(8);
      
      // İşlemin ID'sini ve türünü belirle
      const itemId = islem.islem_id;
      let itemType = islem.islem_turu;
      
      // İşlem daha önce işlenmiş mi kontrol et
      let isProcessed = false;
      if (itemType === 'sarf_malzeme') {
        // Sarf malzemeler için ek kontrol - sadece gerçekten işlenmişse işaretleniyor
        isProcessed = editedItems[itemType] && 
                      editedItems[itemType][itemId] && 
                      (editedItems[itemType][itemId].edited === true);
      } else {
        // Diğer türler için normal kontrol devam ediyor
        isProcessed = editedItems[itemType] && editedItems[itemType][itemId];
      }
      
      // Düzenleme butonu oluştur
      let editButtonHtml = '';
      
      if (isProcessed) {
        // İşlem türüne göre farklı mesaj ama aynı ikon
        const operationType = editedItems[itemType][itemId].operationType || 'Normal';
        
        let tooltipText = 'Bu işlem tamamlandı';
        
        if (operationType === 'IkincilStok') {
          tooltipText = 'Bu ürün ikincil stoğa gönderildi';
        } else if (operationType === 'IskartaUrun') {
          tooltipText = 'Bu ürün ıskarta listesine gönderildi';
        }
        
        // Her işlem türü için aynı tik ikonu kullan
        editButtonHtml = `
          <button class="action-btn processed-item" title="${tooltipText}" disabled
            data-item-id="${itemId}" data-item-type="${itemType}">
            <i class="fas fa-check"></i>
          </button>
        `;
      } else {
        // İşlem türüne göre normal düzenleme butonu
        if (itemType === 'hammadde') {
          editButtonHtml = `
            <button class="action-btn edit" title="İşlemi Düzenle" onclick="editIslem(${itemId}, 'hammadde')"
              data-item-id="${itemId}" data-item-type="${itemType}">
              <i class="fas fa-edit"></i>
            </button>
          `;
        } else if (itemType === 'sarf_malzeme') {
          editButtonHtml = `
            <button class="action-btn edit" title="İşlemi Düzenle" onclick="editIslem(${itemId}, 'sarf_malzeme')"
              data-item-id="${itemId}" data-item-type="${itemType}">
              <i class="fas fa-edit"></i>
            </button>
          `;
        } else if (itemType === 'yari_mamul') {
          editButtonHtml = `
            <button class="action-btn edit" title="İşlemi Düzenle" onclick="editYariMamulIslem(${itemId})"
              data-item-id="${itemId}" data-item-type="${itemType}">
              <i class="fas fa-edit"></i>
            </button>
          `;
        } else if (itemType === 'ikincil_stok') {
          editButtonHtml = `
            <button class="action-btn edit" title="İşlemi Düzenle" onclick="editIkincilStokIslem(${itemId})"
              data-item-id="${itemId}" data-item-type="${itemType}">
              <i class="fas fa-edit"></i>
            </button>
          `;
        } else if (itemType === 'plaka_grubu') {
          // Plaka grubu için sadece silme işlemi
          editButtonHtml = `
            <button class="action-btn delete" title="İşlemi Sil" onclick="deletePlakaGrubuIslem(${itemId})"
              data-item-id="${itemId}" data-item-type="${itemType}">
              <i class="fas fa-trash"></i>
            </button>
          `;
        }
      }
      
      cell9.innerHTML = `
        <div class="action-buttons">
          ${editButtonHtml}
        </div>
      `;
    });
    
    updateFasonMakineIslemlerButtons();
    
  } catch (error) {
    console.error('Makine işlemleri yükleme hatası:', error);
    
    const makineTable = document.getElementById('makineTable').getElementsByTagName('tbody')[0];
    makineTable.innerHTML = '<tr><td colspan="9" class="text-center">İşlemler yüklenirken hata oluştu</td></tr>';
  }
}


  
// Yarı mamul fason işlemlerini yükleme fonksiyonu
async function loadYariMamulFasonIslemler() {
  try {
    console.log("İkincil stok kontrolü için loadYariMamulFasonIslemler çağrıldı");
    
    // Öncelikle tüm ikincil stokları alıp bir haritaya kaydedelim
    // Bu şekilde hangi yarı mamul id'nin hangi ikincil stok (IYM...) koduyla ilişkili olduğunu bilebiliriz
    const ikincilStokResult = await window.electronAPI.invoke.database.getAllIkincilStoklar();
    const ikincilStokMap = {};
    
    if (ikincilStokResult.success && ikincilStokResult.ikincilStoklar) {
      // Sadece yarı mamul tipindeki ikincil stokları filtrele
      const yariMamulIkincilStoklar = ikincilStokResult.ikincilStoklar.filter(stok => 
        stok.malzeme_turu === 'yari_mamul' && stok.yari_mamul_id
      );
      
      // Her ikincil stok için, yarı mamul id -> ikincil stok kodu haritası oluştur
      yariMamulIkincilStoklar.forEach(stok => {
        if (!ikincilStokMap[stok.yari_mamul_id]) {
          ikincilStokMap[stok.yari_mamul_id] = [];
        }
        ikincilStokMap[stok.yari_mamul_id].push(stok.stok_kodu);
      });
      
      console.log("İkincil stok haritası oluşturuldu:", ikincilStokMap);
    }
    
    // Şimdi normal işlem akışına devam edelim
    const yariMamulResult = await window.electronAPI.invoke.database.getAllYariMamuller();
    if (!yariMamulResult.success) {
      console.error('Yarı mamul listesi yükleme hatası:', yariMamulResult.message);
      return [];
    }

    const yariMamulFasonIslemler = [];
    
    // Her yarı mamul için işlemleri kontrol et
    for (const yariMamul of yariMamulResult.yariMamuller) {
      // Yarı mamul işlemlerini al
      const yariMamulIslemResult = await window.electronAPI.invoke.database.getYariMamulIslemleri(yariMamul.id);
      
      if (yariMamulIslemResult.success && yariMamulIslemResult.islemler.length > 0) {
        // Kullanım alanı FasonImalat olan işlemleri filtrele
        const fasonIslemData = yariMamulIslemResult.islemler.filter(islem => islem.kullanim_alani === 'FasonImalat');
        
        // Her işlem için fason işlem listesine ekle
        fasonIslemData.forEach(islem => {
          let stokKodu = yariMamul.stok_kodu; // Varsayılan olarak orijinal stok kodu
          
          // Eğer işlem türü İkincil Stok Kullanımı ise, ikincil stok kodunu kullan
          if (islem.islem_turu === 'İkincil Stok Kullanımı' && ikincilStokMap[yariMamul.id]) {
            // Bu yarı mamul için ikincil stok kodları var, ilkini kullan
            stokKodu = ikincilStokMap[yariMamul.id][0];
            console.log(`İşlem için ikincil stok kodu kullanılıyor: ${stokKodu} (işlem ID: ${islem.id})`);
          }
          
          yariMamulFasonIslemler.push({
            islem_id: islem.id,
            islem_tarihi: islem.islem_tarihi,
            islem_turu: 'yari_mamul',
            sarf_islem_turu: islem.islem_turu,
            yari_mamul_id: yariMamul.id,
            stok_kodu: stokKodu, // Değiştirilen stok kodu (ikincil stok kodu veya orijinal)
            malzeme_adi: yariMamul.malzeme_adi,
            birim: yariMamul.birim,
            miktar: islem.miktar,
            proje_id: islem.proje_id,
            proje_kodu: islem.proje_kodu,
            proje_adi: islem.proje_adi,
            kullanici_ad: islem.kullanici_ad,
            kullanici_soyad: islem.kullanici_soyad
          });
        });
      }
    }
    
    return yariMamulFasonIslemler;
  } catch (error) {
    console.error('Yarı mamul fason işlemleri yükleme hatası:', error);
    return [];
  }
}

async function loadYariMamulMakineIslemler() {
  try {
    console.log("loadYariMamulMakineIslemler çağrıldı");

    const yuklenenIslemIDs = new Set(); // Daha önce eklenen işlemleri takip et
    const yariMamulResult = await window.electronAPI.invoke.database.getAllYariMamuller();

    if (!yariMamulResult.success) {
      console.error('Yarı mamul listesi yükleme hatası:', yariMamulResult.message);
      return [];
    }

    const yariMamulMakineIslemler = [];

    for (const yariMamul of yariMamulResult.yariMamuller) {
      const yariMamulIslemResult = await window.electronAPI.invoke.database.getYariMamulIslemleri(yariMamul.id);

      if (yariMamulIslemResult.success && yariMamulIslemResult.islemler.length > 0) {
        const makineIslemData = yariMamulIslemResult.islemler.filter(
          islem => islem.kullanim_alani === 'MakineImalat'
        );

        makineIslemData.forEach(islem => {
          const islemKey = `yari_mamul_${islem.id}`;
          if (yuklenenIslemIDs.has(islemKey)) {
            console.log(`İşlem zaten yüklendi, atlanıyor: ${islemKey}`);
            return;
          }

          yuklenenIslemIDs.add(islemKey);

          yariMamulMakineIslemler.push({
            islem_id: islem.id,
            islem_tarihi: islem.islem_tarihi,
            islem_turu: 'yari_mamul',
            sarf_islem_turu: islem.islem_turu,
            yari_mamul_id: yariMamul.id,
            stok_kodu: yariMamul.stok_kodu,
            malzeme_adi: yariMamul.malzeme_adi,
            birim: yariMamul.birim,
            miktar: islem.miktar,
            proje_id: islem.proje_id,
            proje_kodu: islem.proje_kodu,
            proje_adi: islem.proje_adi,
            kullanici_ad: islem.kullanici_ad,
            kullanici_soyad: islem.kullanici_soyad,
            calisan_ad: islem.calisan_ad,
            calisan_soyad: islem.calisan_soyad,
            makine: islem.makine
          });
        });
      }
    }

    return yariMamulMakineIslemler;
  } catch (error) {
    console.error('Yarı mamul makine işlemleri yükleme hatası:', error);
    return [];
  }
}


  // Hammadde fason işlemlerini yükle (yardımcı fonksiyon)
  async function loadHammaddeFasonIslemler() {
    try {
      // Tüm hammaddeleri al
      const hammaddeResult = await window.electronAPI.invoke.database.getAllHammadde();
      if (!hammaddeResult.success) {
        console.error('Hammadde listesi yükleme hatası:', hammaddeResult.message);
        return [];
      }
  
      const fasonIslemler = [];
      
      // Her hammadde için parçaları ve işlemleri kontrol et
      for (const hammadde of hammaddeResult.hammaddeler) {
        // Parçaları al
        const parcaResult = await window.electronAPI.invoke.database.getParcalarByHammaddeId(hammadde.id);
        
        if (parcaResult.success && parcaResult.parcalar.length > 0) {
          // Her parça için işlemleri kontrol et
          for (const parca of parcaResult.parcalar) {
            const islemResult = await window.electronAPI.invoke.database.getIslemlerByParcaId(parca.id);
            
            if (islemResult.success && islemResult.islemler.length > 0) {
              // Kullanım alanı FasonImalat olan işlemleri filtrele
              const fasonIslemData = islemResult.islemler.filter(islem => islem.kullanim_alani === 'FasonImalat');
              
              // Her işlem için fason işlem listesine ekle
              fasonIslemData.forEach(islem => {
                fasonIslemler.push({
                  islem_id: islem.id,
                  islem_tarihi: islem.islem_tarihi,
                  islem_turu: 'hammadde', // işlem türü olarak 'hammadde' belirt
                  hammadde_islem_turu: islem.islem_turu, // hammadde işlem türü
                  hammadde_id: hammadde.id,
                  stok_kodu: hammadde.stok_kodu,
                  malzeme_adi: hammadde.malzeme_adi,
                  kalinlik: hammadde.kalinlik,
                  en: hammadde.en,
                  boy: hammadde.boy,
                  parca_no: parca.parca_no,
                  barkod_kodu: parca.barkod_kodu,
                  kullanilanMiktar: islem.kullanilanMiktar,
                  hurdaMiktar: islem.hurdaMiktar,
                  proje_id: islem.proje_id,
                  proje_kodu: islem.proje_kodu,
                  proje_adi: islem.proje_adi,
                  kullanici_ad: islem.kullanici_ad,
                  kullanici_soyad: islem.kullanici_soyad
                });
              });
            }
          }
        }
      }
      
      return fasonIslemler;
    } catch (error) {
      console.error('Hammadde fason işlemleri yükleme hatası:', error);
      return [];
    }
  }
  


  
  // Hammadde iskarta işlemlerini yükle (yardımcı fonksiyon)
  async function loadHammaddeIskartaIslemler() {
    try {
      // Tüm hammaddeleri al
      const hammaddeResult = await window.electronAPI.invoke.database.getAllHammadde();
      if (!hammaddeResult.success) {
        console.error('Hammadde listesi yükleme hatası:', hammaddeResult.message);
        return [];
      }
  
      const iskartaIslemler = [];
      
      // Her hammadde için parçaları ve işlemleri kontrol et
      for (const hammadde of hammaddeResult.hammaddeler) {
        // Parçaları al
        const parcaResult = await window.electronAPI.invoke.database.getParcalarByHammaddeId(hammadde.id);
        
        if (parcaResult.success && parcaResult.parcalar.length > 0) {
          // Her parça için işlemleri kontrol et
          for (const parca of parcaResult.parcalar) {
            const islemResult = await window.electronAPI.invoke.database.getIslemlerByParcaId(parca.id);
            
            if (islemResult.success && islemResult.islemler.length > 0) {
              // iskarta_urun=1 olan işlemleri filtrele
              const iskartaIslemData = islemResult.islemler.filter(islem => islem.iskarta_urun === 1);
              
              // Her işlem için iskarta işlem listesine ekle
              iskartaIslemData.forEach(islem => {
                iskartaIslemler.push({
                  islem_id: islem.id,
                  islem_tarihi: islem.islem_tarihi,
                  islem_turu: 'hammadde', // işlem türü olarak 'hammadde' belirt
                  hammadde_islem_turu: islem.islem_turu, // hammadde işlem türü
                  hammadde_id: hammadde.id,
                  stok_kodu: hammadde.stok_kodu,
                  malzeme_adi: hammadde.malzeme_adi,
                  kalinlik: hammadde.kalinlik,
                  en: hammadde.en,
                  boy: hammadde.boy,
                  parca_no: parca.parca_no,
                  barkod_kodu: parca.barkod_kodu,
                  kullanilanMiktar: islem.kullanilanMiktar,
                  hurdaMiktar: islem.hurdaMiktar,
                  proje_id: islem.proje_id,
                  proje_kodu: islem.proje_kodu,
                  proje_adi: islem.proje_adi,
                  kullanim_alani: islem.kullanim_alani,
                  kullanici_ad: islem.kullanici_ad,
                  kullanici_soyad: islem.kullanici_soyad
                });
              });
            }
          }
        }
      }
      
      return iskartaIslemler;
    } catch (error) {
      console.error('Hammadde iskarta işlemleri yükleme hatası:', error);
      return [];
    }
  }


  
async function loadSarfMalzemeIskartaIslemler() {
  try {
    // Tüm sarf malzemeleri al
    const sarfMalzemeResult = await window.electronAPI.invoke.database.getAllSarfMalzeme();
    if (!sarfMalzemeResult.success) {
      console.error('Sarf malzeme listesi yükleme hatası:', sarfMalzemeResult.message);
      return [];
    }

    const sarfMalzemeIskartaIslemler = [];
    
    // Her sarf malzeme için işlemleri kontrol et
    for (const sarfMalzeme of sarfMalzemeResult.sarfMalzemeler) {
      // Sarf malzeme işlemlerini al
      const sarfIslemResult = await window.electronAPI.invoke.database.getSarfMalzemeIslemleri(sarfMalzeme.id);
      
      if (sarfIslemResult.success && sarfIslemResult.islemler.length > 0) {
        // iskarta_urun=1 olan işlemleri filtrele
        const iskartaIslemData = sarfIslemResult.islemler.filter(islem => islem.iskarta_urun === 1);
        
        // Her işlem için iskarta işlem listesine ekle
        iskartaIslemData.forEach(islem => {
          sarfMalzemeIskartaIslemler.push({
            islem_id: islem.id,
            islem_tarihi: islem.islem_tarihi,
            islem_turu: 'sarf_malzeme',
            sarf_islem_turu: islem.islem_turu,
            sarf_malzeme_id: sarfMalzeme.id,
            stok_kodu: sarfMalzeme.stok_kodu,
            malzeme_adi: sarfMalzeme.malzeme_adi,
            birim: sarfMalzeme.birim,
            miktar: islem.miktar,
            proje_id: islem.proje_id,
            proje_kodu: islem.proje_kodu,
            proje_adi: islem.proje_adi,
            kullanim_alani: islem.kullanim_alani,
            kullanici_ad: islem.kullanici_ad,
            kullanici_soyad: islem.kullanici_soyad
          });
        });
      }
    }
    
    return sarfMalzemeIskartaIslemler;
  } catch (error) {
    console.error('Sarf malzeme iskarta işlemleri yükleme hatası:', error);
    return [];
  }
}




// New function to load yari mamul iskarta islemler
async function loadYariMamulIskartaIslemler() {
  try {
    // Check if API method exists before calling it
    if (!window.electronAPI || 
        !window.electronAPI.invoke || 
        !window.electronAPI.invoke.database || 
        !window.electronAPI.invoke.database.getAllYariMamuller) {
      console.error('API method getAllYariMamuller is not available');
      return [];
    }
    
    // İkincil stok haritasını oluştur - kod -> ikincil stok kodu şeklinde
    const ikincilStokResult = await window.electronAPI.invoke.database.getAllIkincilStoklar();
    const ikincilStokMap = {};
      
    if (ikincilStokResult.success && ikincilStokResult.ikincilStoklar) {
      // Sadece yarı mamul tipindeki ikincil stokları filtrele
      const yariMamulIkincilStoklar = ikincilStokResult.ikincilStoklar.filter(stok => 
        stok.malzeme_turu === 'yari_mamul' && stok.yari_mamul_id
      );
        
      // Her ikincil stok için, yarı mamul id -> ikincil stok kodu haritası oluştur
      yariMamulIkincilStoklar.forEach(stok => {
        ikincilStokMap[stok.yari_mamul_id] = stok.stok_kodu;
      });
        
      console.log("İkincil stok haritası oluşturuldu:", ikincilStokMap);
    }
    
    // Tüm yarı mamulleri al
    const yariMamulResult = await window.electronAPI.invoke.database.getAllYariMamuller();
    if (!yariMamulResult.success) {
      console.error('Yarı mamul listesi yükleme hatası:', yariMamulResult.message);
      return [];
    }

    const yariMamulIskartaIslemler = [];
    
    // Check if required API method exists
    if (!window.electronAPI.invoke.database.getYariMamulIslemleri) {
      console.error('API method getYariMamulIslemleri is not available');
      return [];
    }
    
    // Her yarı mamul için işlemleri kontrol et
    for (const yariMamul of yariMamulResult.yariMamuller) {
      try {
        // Yarı mamul işlemlerini al
        const yariMamulIslemResult = await window.electronAPI.invoke.database.getYariMamulIslemleri(yariMamul.id);
        
        if (yariMamulIslemResult.success && yariMamulIslemResult.islemler.length > 0) {
          // iskarta_urun=1 olan işlemleri filtrele
          const iskartaIslemData = yariMamulIslemResult.islemler.filter(islem => islem.iskarta_urun === 1);
          
          // Her işlem için iskarta işlem listesine ekle
          iskartaIslemData.forEach(islem => {
            let islemTuruGosterim = islem.islem_turu;
            const ikincilStokKodu = ikincilStokMap[yariMamul.id];
            
            // Eğer işlem İkincil Stok Kullanımı ise ve ikincil stok kodu varsa
            if (islem.islem_turu === 'İkincil Stok Kullanımı' && ikincilStokKodu) {
              // Formatlı islem türü oluştur: "İkincilStokKullanım-IKODU"
              islemTuruGosterim = `İkincilStokKullanım-${ikincilStokKodu}`;
            }
            
            yariMamulIskartaIslemler.push({
              islem_id: islem.id,
              islem_tarihi: islem.islem_tarihi,
              islem_turu: 'yari_mamul',
              yari_mamul_islem_turu: islemTuruGosterim,
              yari_mamul_id: yariMamul.id,
              stok_kodu: yariMamul.stok_kodu,
              malzeme_adi: yariMamul.malzeme_adi,
              birim: yariMamul.birim,
              miktar: islem.miktar,
              proje_id: islem.proje_id,
              proje_kodu: islem.proje_kodu,
              proje_adi: islem.proje_adi,
              kullanim_alani: islem.kullanim_alani,
              kullanici_ad: islem.kullanici_ad,
              kullanici_soyad: islem.kullanici_soyad
            });
          });
        }
      } catch (itemError) {
        console.error(`Yarı mamul ID:${yariMamul.id} işlemleri alınırken hata:`, itemError);
        // Continue with the next item instead of aborting the whole function
        continue;
      }
    }
    
    return yariMamulIskartaIslemler;
  } catch (error) {
    console.error('Yarı mamul iskarta işlemleri yükleme hatası:', error);
    return [];
  }
}



// Hammadde makine işlemlerini yükle (yardımcı fonksiyon)
async function loadHammaddeMakineIslemler() {
  try {
    // Tüm hammaddeleri al
    const hammaddeResult = await window.electronAPI.invoke.database.getAllHammadde();
    if (!hammaddeResult.success) {
      console.error('Hammadde listesi yükleme hatası:', hammaddeResult.message);
      return [];
    }

    const makineIslemler = [];
    
    // Her hammadde için parçaları ve işlemleri kontrol et
    for (const hammadde of hammaddeResult.hammaddeler) {
      // Parçaları al
      const parcaResult = await window.electronAPI.invoke.database.getParcalarByHammaddeId(hammadde.id);
      
      if (parcaResult.success && parcaResult.parcalar.length > 0) {
        // Her parça için işlemleri kontrol et
        for (const parca of parcaResult.parcalar) {
          const islemResult = await window.electronAPI.invoke.database.getIslemlerByParcaId(parca.id);
          
          if (islemResult.success && islemResult.islemler.length > 0) {
            // Kullanım alanı MakineImalat olan işlemleri filtrele
            const makineIslemData = islemResult.islemler.filter(islem => islem.kullanim_alani === 'MakineImalat');
            
            // Her işlem için makine işlem listesine ekle
            makineIslemData.forEach(islem => {
              makineIslemler.push({
                islem_id: islem.id,
                islem_tarihi: islem.islem_tarihi,
                islem_turu: 'hammadde', // işlem türü olarak 'hammadde' belirt
                hammadde_islem_turu: islem.islem_turu, // hammadde işlem türü
                hammadde_id: hammadde.id,
                stok_kodu: hammadde.stok_kodu,
                malzeme_adi: hammadde.malzeme_adi,
                kalinlik: hammadde.kalinlik,
                en: hammadde.en,
                boy: hammadde.boy,
                parca_no: parca.parca_no,
                barkod_kodu: parca.barkod_kodu,
                kullanilanMiktar: islem.kullanilanMiktar,
                hurdaMiktar: islem.hurdaMiktar,
                proje_id: islem.proje_id,
                proje_kodu: islem.proje_kodu,
                proje_adi: islem.proje_adi,
                kullanici_ad: islem.kullanici_ad,
                kullanici_soyad: islem.kullanici_soyad
              });
            });
          }
        }
      }
    }
    
    return makineIslemler;
  } catch (error) {
    console.error('Hammadde makine işlemleri yükleme hatası:', error);
    return [];
  }
}




// Sarf malzeme fason işlemlerini yükle (yardımcı fonksiyon)
async function loadSarfMalzemeFasonIslemler() {
  try {
    // Tüm sarf malzemeleri al
    const sarfMalzemeResult = await window.electronAPI.invoke.database.getAllSarfMalzeme();
    if (!sarfMalzemeResult.success) {
      console.error('Sarf malzeme listesi yükleme hatası:', sarfMalzemeResult.message);
      return [];
    }

    const sarfMalzemeFasonIslemler = [];
    
    // Her sarf malzeme için işlemleri kontrol et
    for (const sarfMalzeme of sarfMalzemeResult.sarfMalzemeler) {
      // Sarf malzeme işlemlerini al
      const sarfIslemResult = await window.electronAPI.invoke.database.getSarfMalzemeIslemleri(sarfMalzeme.id);
      
      if (sarfIslemResult.success && sarfIslemResult.islemler.length > 0) {
        // Kullanım alanı FasonImalat olan işlemleri filtrele
        const fasonIslemData = sarfIslemResult.islemler.filter(islem => islem.kullanim_alani === 'FasonImalat');
        
        // Her işlem için fason işlem listesine ekle
        for (const islem of fasonIslemData) {
          // Çalışan bilgilerini al
          let calisanAd = '';
          let calisanSoyad = '';
          
          if (islem.calisan_id) {
            try {
              const calisanResult = await window.electronAPI.invoke.database.getCalisanById(islem.calisan_id);
              if (calisanResult.success) {
                calisanAd = calisanResult.calisan.ad;
                calisanSoyad = calisanResult.calisan.soyad;
              }
            } catch (error) {
              console.error('Çalışan bilgisi alma hatası:', error);
            }
          }
          
          // İkincil stok kontrolü (işlem türünden)
          let stokKodu = sarfMalzeme.stok_kodu;
          let islemTuruGosterim = islem.islem_turu;
          
          // Eğer işlem türü "İkincilStokKullanım-" ile başlıyorsa
          if (islem.islem_turu && islem.islem_turu.startsWith('İkincilStokKullanım-')) {
            // İşlem türünden stok kodunu çıkar
            const parts = islem.islem_turu.split('-');
            if (parts.length > 1) {
              stokKodu = parts[1]; // İkinci kısım stok kodu
              islemTuruGosterim = 'İkincil Stok Kullanımı'; // Görüntüleme için
            }
          }
          
          sarfMalzemeFasonIslemler.push({
            islem_id: islem.id,
            islem_tarihi: islem.islem_tarihi,
            islem_turu: 'sarf_malzeme',
            sarf_islem_turu: islemTuruGosterim,
            sarf_malzeme_id: sarfMalzeme.id,
            stok_kodu: stokKodu,
            malzeme_adi: sarfMalzeme.malzeme_adi,
            birim: sarfMalzeme.birim,
            miktar: islem.miktar,
            proje_id: islem.proje_id,
            proje_kodu: islem.proje_kodu,
            proje_adi: islem.proje_adi,
            kullanici_ad: islem.kullanici_ad,
            kullanici_soyad: islem.kullanici_soyad,
            // Yeni alanlar
            calisan_id: islem.calisan_id,
            calisan_ad: calisanAd,
            calisan_soyad: calisanSoyad,
            makine: islem.makine
          });
        }
      }
    }
    
    return sarfMalzemeFasonIslemler;
  } catch (error) {
    console.error('Sarf malzeme fason işlemleri yükleme hatası:', error);
    return [];
  }
}




  // Sarf malzeme makine işlemlerini yükle (yardımcı fonksiyon)
  async function loadSarfMalzemeMakineIslemler() {
    try {
      // Tüm sarf malzemeleri al
      const sarfMalzemeResult = await window.electronAPI.invoke.database.getAllSarfMalzeme();
      if (!sarfMalzemeResult.success) {
        console.error('Sarf malzeme listesi yükleme hatası:', sarfMalzemeResult.message);
        return [];
      }
  
      const sarfMalzemeMakineIslemler = [];
      
      // Her sarf malzeme için işlemleri kontrol et
      for (const sarfMalzeme of sarfMalzemeResult.sarfMalzemeler) {
        // Sarf malzeme işlemlerini al
        const sarfIslemResult = await window.electronAPI.invoke.database.getSarfMalzemeIslemleri(sarfMalzeme.id);
        
        if (sarfIslemResult.success && sarfIslemResult.islemler.length > 0) {
          // Kullanım alanı MakineImalat olan işlemleri filtrele
          const makineIslemData = sarfIslemResult.islemler.filter(islem => islem.kullanim_alani === 'MakineImalat');
          
          // Her işlem için makine işlem listesine ekle
          for (const islem of makineIslemData) {
            // Çalışan bilgilerini al
            let calisanAd = '';
            let calisanSoyad = '';
            
            if (islem.calisan_id) {
              try {
                const calisanResult = await window.electronAPI.invoke.database.getCalisanById(islem.calisan_id);
                if (calisanResult.success) {
                  calisanAd = calisanResult.calisan.ad;
                  calisanSoyad = calisanResult.calisan.soyad;
                }
              } catch (error) {
                console.error('Çalışan bilgisi alma hatası:', error);
              }
            }
            
            // İkincil stok kontrolü (işlem türünden)
            let stokKodu = sarfMalzeme.stok_kodu;
            let islemTuruGosterim = islem.islem_turu;
            
            // Eğer işlem türü "İkincilStokKullanım-" ile başlıyorsa
            if (islem.islem_turu && islem.islem_turu.startsWith('İkincilStokKullanım-')) {
              // İşlem türünden stok kodunu çıkar
              const parts = islem.islem_turu.split('-');
              if (parts.length > 1) {
                stokKodu = parts[1]; // İkinci kısım stok kodu
                islemTuruGosterim = 'İkincil Stok Kullanımı'; // Görüntüleme için
              }
            }
            
            sarfMalzemeMakineIslemler.push({
              islem_id: islem.id,
              islem_tarihi: islem.islem_tarihi,
              islem_turu: 'sarf_malzeme',
              sarf_islem_turu: islemTuruGosterim,
              sarf_malzeme_id: sarfMalzeme.id,
              stok_kodu: stokKodu,
              malzeme_adi: sarfMalzeme.malzeme_adi,
              birim: sarfMalzeme.birim,
              miktar: islem.miktar,
              proje_id: islem.proje_id,
              proje_kodu: islem.proje_kodu,
              proje_adi: islem.proje_adi,
              kullanici_ad: islem.kullanici_ad,
              kullanici_soyad: islem.kullanici_soyad,
              // Yeni alanlar
              calisan_id: islem.calisan_id,
              calisan_ad: calisanAd,
              calisan_soyad: calisanSoyad,
              makine: islem.makine
            });
          }
        }
      }
      
      return sarfMalzemeMakineIslemler;
    } catch (error) {
        console.error('Sarf malzeme makine işlemleri yükleme hatası:', error);
        return [];
      }
    }


async function fillProjeSelectForImalat() {
    try {
      const result = await window.electronAPI.invoke.database.getAllProjeler();
      
      // Fason ve makine sayfaları için ayrı ayrı select elementlerini al
      const fasonProjeSelect = document.querySelector('#fason-imalat #pprojeSecimi');
      const makineProjeSelect = document.querySelector('#makine-imalat #pprojeSecimi');
      
      if (result.success && result.projeler) {
        // Her bir select elementine projeler eklenecek
        const selectElements = [fasonProjeSelect, makineProjeSelect].filter(el => el !== null);
        
        selectElements.forEach(projeSelect => {
          projeSelect.innerHTML = '<option value="">Tüm Projeler</option>';
          
          result.projeler.forEach(proje => {
            const option = document.createElement('option');
            option.value = proje.id;
            option.textContent = proje.proje_adi;
            projeSelect.appendChild(option);
          });
        });
      }
    } catch (error) {
      console.error('Projeler yüklenirken hata oluştu:', error);
    }
  }


  
  function resetFilters(pageId) {
    // Hangi sayfanın filtrelerini sıfırlayacağımızı belirle
    const page = document.getElementById(pageId);
    if (!page) return;
    
    // O sayfadaki filtreleri sıfırla
    page.querySelector('#imalatArama').value = '';
    page.querySelector('#malzemeTuruSecimi').value = '';
    page.querySelector('#pprojeSecimi').value = '';
    page.querySelector('#baslangicTarihi').value = '';
    page.querySelector('#bitisTarihi').value = '';
    
    // 10ms bekleyip aramayı çalıştır (DOM güncellemesi için)
    setTimeout(function() {
      searchImalat(pageId);
    }, 10);
  }
  
  async function searchImalat(pageId) {
  // Eğer pageId belirtilmemişse, aktif sayfayı bul
  if (!pageId) {
    const activePage = document.querySelector('.page.active');
    if (activePage) {
      pageId = activePage.id;
    } else {
      console.error('Aktif sayfa bulunamadı');
      return;
    }
  }
  
  console.log(`Executing search for page: ${pageId}`);
  
  // Hangi sayfada olduğumuzu belirleyelim
  const page = document.getElementById(pageId);
  if (!page) {
    console.error(`${pageId} ID'li sayfa bulunamadı`);
    return;
  }
  
  // Filtreleri o sayfadan alalım
  const searchText = page.querySelector('#imalatArama').value.toLowerCase().trim();
  const malzemeTuru = page.querySelector('#malzemeTuruSecimi').value;
  const projeId = page.querySelector('#pprojeSecimi').value;
  const baslangicTarihi = page.querySelector('#baslangicTarihi').value;
  const bitisTarihi = page.querySelector('#bitisTarihi').value;
  
  // Hangi tabloyu kullanacağımızı belirleyelim
  const tableId = pageId === 'fason-imalat' ? 'fasonTable' : 'makineTable';
  const tableBody = document.getElementById(tableId).getElementsByTagName('tbody')[0];
  
  if (!tableBody) {
    console.error(`${tableId} için tbody bulunamadı`);
    return;
  }
  
  const tableRows = tableBody.rows;
  
  // Remove any existing "no results" row before filtering
  const existingNoResultsRow = tableBody.querySelector('.no-results-row');
  if (existingNoResultsRow) {
    existingNoResultsRow.remove();
  }
  
  // Create filter object
  const filters = {
    searchText,
    malzemeTuru,
    projeId,
    baslangicTarihi: baslangicTarihi ? new Date(baslangicTarihi) : null,
    bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : null
  };
  
  console.log('Filtering with criteria:', filters); // Debug log
  
  let visibleRowCount = 0;
  
  // Apply filters to table rows
  Array.from(tableRows).forEach(row => {
    // Skip the row if it's a no-results row
    if (row.classList.contains('no-results-row')) return;
    
    // Yeni sıralama: Stok Kodu(0), Malzeme(1), Proje(2), İşlem(3), Alan kişi(4), Miktar(5), Kullanıcı(6), Tarih(7), işlemler(8)
    const stokKodu = row.cells[0] ? row.cells[0].textContent.toLowerCase() : '';
    const malzemeAdi = row.cells[1] ? row.cells[1].textContent.toLowerCase() : '';
    const projeAdi = row.cells[2] ? row.cells[2].textContent.toLowerCase() : '';
    const islemYapan = row.cells[6] ? row.cells[6].textContent.toLowerCase() : ''; // Kullanıcı artık 6. sütunda
    
    // Tarih ayrıştırma - daha güvenilir hale getirildi
    let tarih = null;
    try {
      // Tarih artık 7. sütunda
      if (row.cells[7]) {
        const tarihStr = row.cells[7].textContent.trim();
        
        // Türkçe format (GG.AA.YYYY) kontrolü
        if (tarihStr.includes('.')) {
          const tarihParts = tarihStr.split('.');
          // En az 3 parça olmalı (gün, ay, yıl)
          if (tarihParts.length >= 3) {
            const gun = parseInt(tarihParts[0], 10);
            const ay = parseInt(tarihParts[1], 10) - 1; // JavaScript'te ay 0'dan başlar
            const yil = parseInt(tarihParts[2], 10);
            
            if (!isNaN(gun) && !isNaN(ay) && !isNaN(yil)) {
              tarih = new Date(yil, ay, gun);
            }
          }
        } else if (tarihStr) {
          // Diğer formatları da dene
          tarih = new Date(tarihStr);
        }
        
        // Tarih geçerli değilse veya NaN ise hata mesajı yazdır
        if (!tarih || isNaN(tarih.getTime())) {
          console.warn('Geçersiz tarih değeri:', tarihStr);
          tarih = null;
        } else {
          // Doğru ayrıştırıldığını kontrol etmek için
          console.log(`Ayrıştırılan tarih: ${tarih.toISOString()} (${tarihStr})`);
        }
      }
    } catch (e) {
      console.error('Tarih ayrıştırma hatası:', e);
      tarih = null;
    }
    
    // Extract material type from class or data attribute if available
    const rowMalzemeTuru = row.getAttribute('data-malzeme-turu') || '';
    
    // Check if row matches all filters
    let showRow = true;
    
    // Text search
    if (searchText) {
      const textMatch = stokKodu.includes(searchText) || 
                        malzemeAdi.includes(searchText) || 
                        projeAdi.includes(searchText) ||
                        islemYapan.includes(searchText);
      if (!textMatch) showRow = false;
    }
    
    // Material type filter
    if (malzemeTuru && rowMalzemeTuru !== malzemeTuru) {
      // If row doesn't have the attribute, try to determine from content
      const malzemeContent = malzemeAdi.toLowerCase();
      
      // Basic content-based detection as fallback
      if (malzemeTuru === 'sac' && !malzemeContent.includes('sac')) showRow = false;
      else if (malzemeTuru === 'boru' && !malzemeContent.includes('boru')) showRow = false;
      else if (malzemeTuru === 'mil' && !malzemeContent.includes('mil')) showRow = false;
      else if (malzemeTuru === 'sarf_malzeme' && !malzemeContent.includes('sarf')) showRow = false;
      else if (malzemeTuru === 'ikincil_stok' && !malzemeContent.includes('ikincil')) showRow = false;
      else if (malzemeTuru === 'yari_mamul' && !malzemeContent.includes('yarı')) showRow = false;
    }
    
    // Project filter
    if (projeId && projeId.trim() !== '') {
      // Önce data-proje-id'yi kontrol et
      const rowProjeId = row.getAttribute('data-proje-id');
      
      // Eğer data-proje-id varsa onu kullan, yoksa proje adını kontrol et
      if (rowProjeId) {
        // data-proje-id varsa doğrudan karşılaştır
        if (rowProjeId !== projeId) showRow = false;
      } else {
        // data-proje-id yoksa, projeAdi kontrolü yap
        console.log(`Checking project: ${projeId} against ${projeAdi}`);
        
        const selectedOption = page.querySelector(`#pprojeSecimi option[value="${projeId}"]`);
        const selectedProjeAdi = selectedOption ? selectedOption.textContent.toLowerCase() : '';
        
        if (selectedProjeAdi && !projeAdi.includes(selectedProjeAdi)) {
          showRow = false;
        }
      }
    }
    
    // TARİH FİLTRELEME - düzeltildi
    if (filters.baslangicTarihi && tarih) {
      const basTarih = new Date(filters.baslangicTarihi);
      basTarih.setHours(0, 0, 0, 0); // Başlangıç tarihini günün başlangıcına ayarla
      
      if (tarih < basTarih) {
        showRow = false;
        console.log(`Tarih başlangıç filtresinden geçemedi: ${tarih.toLocaleDateString()} < ${basTarih.toLocaleDateString()}`);
      }
    }
    
    if (filters.bitisTarihi && tarih) {
      const bitTarih = new Date(filters.bitisTarihi);
      bitTarih.setHours(23, 59, 59, 999); // Bitiş tarihini günün sonuna ayarla
      
      if (tarih > bitTarih) {
        showRow = false;
        console.log(`Tarih bitiş filtresinden geçemedi: ${tarih.toLocaleDateString()} > ${bitTarih.toLocaleDateString()}`);
      }
    }
    
    // Eğer tarih filtreleri aktif ama satırda geçerli bir tarih yoksa
    if ((filters.baslangicTarihi || filters.bitisTarihi) && !tarih) {
      console.warn('Tarih değeri olmadığı için satır gizlendi:', row.cells[7] ? row.cells[7].textContent : 'Tarih sütunu bulunamadı');
      showRow = false;
    }
    
    // Update row visibility
    row.style.display = showRow ? '' : 'none';
    
    if (showRow) {
      visibleRowCount++;
    }
  });
  
  console.log(`Visible row count: ${visibleRowCount}`);
  
  // Show message if no results
  if (visibleRowCount === 0) {
    const noResultsRow = tableBody.insertRow();
    noResultsRow.classList.add('no-results-row');
    noResultsRow.style.textAlign = 'center';
    
    const cell = noResultsRow.insertCell(0);
    cell.colSpan = 9; // Adjust based on table columns (9 columns now)
    cell.textContent = 'Arama kriterlerine uygun sonuç bulunamadı.';
  }
}


  // Initialize search functionality for manufacturing sections
  function initImalatSearch(pageId) {
    console.log(`Initializing manufacturing search for page: ${pageId}`);
    
    // Sayfayı belirle
    const page = document.getElementById(pageId);
    if (!page) {
      console.error(`${pageId} ID'li sayfa bulunamadı`);
      return;
    }
    
    // Fill project dropdown
    fillProjeSelectForImalat();
    
    // Her sayfa için ayrı event listener'lar ekle
    page.querySelector('#imalatArama').addEventListener('input', () => searchImalat(pageId));
    page.querySelector('#malzemeTuruSecimi').addEventListener('change', () => searchImalat(pageId));
    page.querySelector('#pprojeSecimi').addEventListener('change', () => searchImalat(pageId));
    page.querySelector('#baslangicTarihi').addEventListener('change', () => searchImalat(pageId));
    page.querySelector('#bitisTarihi').addEventListener('change', () => searchImalat(pageId));
    
    page.querySelector('#imalatAraBtn').addEventListener('click', () => searchImalat(pageId));
    page.querySelector('#filtreSifirlaBtn').addEventListener('click', () => resetFilters(pageId));
    
    console.log(`Manufacturing search functionality initialized for ${pageId}.`);
    
    // İlk yüklemede tüm kayıtları göster
    searchImalat(pageId);
  }
  
  
  // Add event listener to initialize search when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Sayfa yüklendiğinde HTML yapısını kontrol et ve gerekli panelleri ekle
    setupSearchPanels();
    
    // Initialize imalat search when appropriate pages are loaded
    const navLinks = document.querySelectorAll('.nav-links li a');
    
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        const pageName = this.getAttribute('data-page');
        if (pageName === 'fason-imalat' || pageName === 'makine-imalat') {
          // Delay slightly to ensure page is active before initializing search
          setTimeout(() => initImalatSearch(pageName), 100);
        }
      });
    });
    
    // If one of the pages is already active on load, initialize search
    const activePage = document.querySelector('.page.active');
    if (activePage && (activePage.id === 'fason-imalat' || activePage.id === 'makine-imalat')) {
      initImalatSearch(activePage.id);
    }
  });
  
  // Her iki sayfa için de arama panellerini hazırla
  function setupSearchPanels() {
    const searchPanelTemplate = `
      <div class="search-panel">
        <div class="search-row">
          <div class="search-group">
            <label for="imalatArama">Arama:</label>
            <input type="text" id="imalatArama" placeholder="Stok kodu, malzeme adı veya işlem yapan...">
          </div>
          <div class="search-group">
            <label for="malzemeTuruSecimi">Malzeme Türü:</label>
            <select id="malzemeTuruSecimi">
              <option value="">Tümü</option>
              <option value="sac">Sac</option>
              <option value="boru">Boru</option>
              <option value="mil">Mil</option>
              <option value="sarf_malzeme">Sarf Malzeme</option>
              <option value="ikincil_stok">İkincil Stok</option>
              <option value="yari_mamul">Yarı Mamul</option>
            </select>
          </div>
          <div class="search-group">
            <label for="pprojeSecimi">Proje:</label>
            <select id="pprojeSecimi">
              <option value="">Tüm Projeler</option>
            </select>
          </div>
        </div>
        <div class="search-row">
          <div class="search-group">
            <label for="baslangicTarihi">Başlangıç Tarihi:</label>
            <input type="date" id="baslangicTarihi">
          </div>
          <div class="search-group">
            <label for="bitisTarihi">Bitiş Tarihi:</label>
            <input type="date" id="bitisTarihi">
          </div>
          <div class="search-group search-buttons">
            <button id="imalatAraBtn" class="btn primary">Ara</button>
            <button id="filtreSifirlaBtn" class="btn secondary">Filtreleri Sıfırla</button>
          </div>
        </div>
      </div>
    `;
    
    // Fason imalat sayfasına panel ekle
    const fasonPage = document.getElementById('fason-imalat');
    if (fasonPage) {
      const fasonSearchPanel = fasonPage.querySelector('.search-panel');
      if (!fasonSearchPanel) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = searchPanelTemplate;
        const newPanel = tempDiv.firstElementChild;
        
        // Paneli tablo konteynerinden önce ekle
        const tableContainer = fasonPage.querySelector('.table-container');
        if (tableContainer) {
          fasonPage.insertBefore(newPanel, tableContainer);
        } else {
          fasonPage.appendChild(newPanel);
        }
      }
    }
    
    // Makine imalat sayfasına panel ekle
    const makinePage = document.getElementById('makine-imalat');
    if (makinePage) {
      const makineSearchPanel = makinePage.querySelector('.search-panel');
      if (!makineSearchPanel) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = searchPanelTemplate;
        const newPanel = tempDiv.firstElementChild;
        
        // Paneli tablo konteynerinden önce ekle
        const tableContainer = makinePage.querySelector('.table-container');
        if (tableContainer) {
          makinePage.insertBefore(newPanel, tableContainer);
        } else {
          makinePage.appendChild(newPanel);
        }
      }
    }
  }

// Search function for Iskarta Ürünler
// Search function for Iskarta Ürünler
async function searchIskartaUrunler() {
  const searchText = document.getElementById('iskartaArama').value.toLowerCase().trim();
  const malzemeTuru = document.getElementById('iskartaMalzemeTuruSecimi').value;
  const projeId = document.getElementById('iskartaProjeSecimi').value;
  const baslangicTarihi = document.getElementById('iskartaBaslangicTarihi').value;
  const bitisTarihi = document.getElementById('iskartaBitisTarihi').value;
  
  const tableBody = document.getElementById('iskartaTable').getElementsByTagName('tbody')[0];
  const tableRows = tableBody.rows;
  
  // Remove any existing "no results" row before filtering
  const existingNoResultsRow = tableBody.querySelector('.no-results-row');
  if (existingNoResultsRow) {
    existingNoResultsRow.remove();
  }
  
  // Create filter object
  const filters = {
    searchText,
    malzemeTuru,
    projeId,
    baslangicTarihi: baslangicTarihi ? new Date(baslangicTarihi) : null,
    bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : null
  };
  
  let visibleRowCount = 0;
  
  // Apply filters to table rows
  Array.from(tableRows).forEach(row => {
    // Skip the row if it's a no-results row
    if (row.classList.contains('no-results-row')) return;
    
    const stokKodu = row.cells[0].textContent.toLowerCase();
    const malzemeAdi = row.cells[1].textContent.toLowerCase();
    const projeAdi = row.cells[2].textContent.toLowerCase();
    const islemTuru = row.cells[3].textContent; // İşlem türü (index 3) - küçük harfe çevirmiyoruz
    const islemYapan = row.cells[6].textContent.toLowerCase();
    
    // Tarih ayrıştırma - daha güvenilir hale getirildi
    let tarih = null;
    try {
      const tarihStr = row.cells[7].textContent.trim();
      
      // Türkçe format (GG.AA.YYYY) kontrolü
      if (tarihStr.includes('.')) {
        const tarihParts = tarihStr.split('.');
        // En az 3 parça olmalı (gün, ay, yıl)
        if (tarihParts.length >= 3) {
          const gun = parseInt(tarihParts[0], 10);
          const ay = parseInt(tarihParts[1], 10) - 1; // JavaScript'te ay 0'dan başlar
          const yil = parseInt(tarihParts[2], 10);
          
          if (!isNaN(gun) && !isNaN(ay) && !isNaN(yil)) {
            tarih = new Date(yil, ay, gun);
          }
        }
      } else if (tarihStr) {
        // Diğer formatları da dene
        tarih = new Date(tarihStr);
      }
      
      // Tarih geçerli değilse veya NaN ise hata mesajı yazdır
      if (!tarih || isNaN(tarih.getTime())) {
        console.warn('Geçersiz tarih değeri:', tarihStr);
        tarih = null;
      }
    } catch (e) {
      console.error('Tarih ayrıştırma hatası:', e);
      tarih = null;
    }
    
    // Check if row matches all filters
    let showRow = true;
    
    // Text search
    if (searchText) {
      const textMatch = stokKodu.includes(searchText) || 
                        malzemeAdi.includes(searchText) || 
                        projeAdi.includes(searchText) ||
                        islemYapan.includes(searchText);
      if (!textMatch) showRow = false;
    }
    
    // Material type filter
    if (malzemeTuru) {
      if (malzemeTuru === 'sac' && !malzemeAdi.includes('sac')) showRow = false;
      else if (malzemeTuru === 'boru' && !malzemeAdi.includes('boru')) showRow = false;
      else if (malzemeTuru === 'mil' && !malzemeAdi.includes('mil')) showRow = false;
      else if (malzemeTuru === 'sarf_malzeme' && !malzemeAdi.includes('sarf')) showRow = false;
      else if (malzemeTuru === 'ikincil_stok' && !islemTuru.startsWith('İkincilStokKullanım-')) showRow = false;
      else if (malzemeTuru === 'yari_mamul' && !malzemeAdi.includes('yarı')) showRow = false;
    }
    
    // Project filter
    if (projeId && projeId.trim() !== '') {
      // Proje adını kontrol et
      const selectedOption = document.querySelector(`#iskartaProjeSecimi option[value="${projeId}"]`);
      const selectedProjeAdi = selectedOption ? selectedOption.textContent.toLowerCase() : '';
      
      if (selectedProjeAdi && !projeAdi.includes(selectedProjeAdi)) {
        showRow = false;
      }
    }
    
    // Date filtering
    if (filters.baslangicTarihi && tarih) {
      const basTarih = new Date(filters.baslangicTarihi);
      basTarih.setHours(0, 0, 0, 0);
      
      if (tarih < basTarih) {
        showRow = false;
      }
    }
    
    if (filters.bitisTarihi && tarih) {
      const bitTarih = new Date(filters.bitisTarihi);
      bitTarih.setHours(23, 59, 59, 999);
      
      if (tarih > bitTarih) {
        showRow = false;
      }
    }
    
    // If date filters are active but no valid date on row
    if ((filters.baslangicTarihi || filters.bitisTarihi) && !tarih) {
      showRow = false;
    }
    
    // Update row visibility
    row.style.display = showRow ? '' : 'none';
    
    if (showRow) {
      visibleRowCount++;
    }
  });
  
  // Show message if no results
  if (visibleRowCount === 0) {
    const noResultsRow = tableBody.insertRow();
    noResultsRow.classList.add('no-results-row');
    noResultsRow.style.textAlign = 'center';
    
    const cell = noResultsRow.insertCell(0);
    cell.colSpan = 8; // Adjust based on table columns
    cell.textContent = 'Arama kriterlerine uygun sonuç bulunamadı.';
  }
}

// Reset Filters function
function resetIskartaUrunlerFilters() {
  document.getElementById('iskartaArama').value = '';
  document.getElementById('iskartaMalzemeTuruSecimi').value = '';
  document.getElementById('iskartaProjeSecimi').value = '';
  document.getElementById('iskartaBaslangicTarihi').value = '';
  document.getElementById('iskartaBitisTarihi').value = '';
  
  // Trigger search to show all rows
  searchIskartaUrunler();
}

// Fill project dropdown for Iskarta Ürünler
async function fillProjeSelectForIskartaUrunler() {
  try {
    const result = await window.electronAPI.invoke.database.getAllProjeler();
    
    const projeSelect = document.getElementById('iskartaProjeSecimi');
    
    if (result.success && result.projeler) {
      projeSelect.innerHTML = '<option value="">Tüm Projeler</option>';
      
      result.projeler.forEach(proje => {
        const option = document.createElement('option');
        option.value = proje.id;
        option.textContent = proje.proje_adi;
        projeSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Projeler yüklenirken hata oluştu:', error);
  }
}

// Initialize Iskarta Ürünler search functionality
function initIskartaUrunlerSearch() {
  // Add search panel HTML
  const searchPanelTemplate = `
    <div class="search-panel">
      <div class="search-row">
        <div class="search-group">
          <label for="iskartaArama">Arama:</label>
          <input type="text" id="iskartaArama" placeholder="Stok kodu, malzeme adı veya işlem yapan...">
        </div>
        <div class="search-group">
          <label for="iskartaMalzemeTuruSecimi">Malzeme Türü:</label>
          <select id="iskartaMalzemeTuruSecimi">
            <option value="">Tümü</option>
            <option value="sac">Sac</option>
            <option value="boru">Boru</option>
            <option value="mil">Mil</option>
            <option value="sarf_malzeme">Sarf Malzeme</option>
            <option value="ikincil_stok">İkincil Stok</option>
            <option value="yari_mamul">Yarı Mamul</option>
          </select>
        </div>
        <div class="search-group">
          <label for="iskartaProjeSecimi">Proje:</label>
          <select id="iskartaProjeSecimi">
            <option value="">Tüm Projeler</option>
          </select>
        </div>
      </div>
      <div class="search-row">
        <div class="search-group">
          <label for="iskartaBaslangicTarihi">Başlangıç Tarihi:</label>
          <input type="date" id="iskartaBaslangicTarihi">
        </div>
        <div class="search-group">
          <label for="iskartaBitisTarihi">Bitiş Tarihi:</label>
          <input type="date" id="iskartaBitisTarihi">
        </div>
        <div class="search-group search-buttons">
          <button id="iskartaAraBtn" class="btn primary">Ara</button>
          <button id="iskartaFiltreSifirlaBtn" class="btn secondary">Filtreleri Sıfırla</button>
        </div>
      </div>
    </div>
  `;
  
  const iskartaPage = document.getElementById('iskarta-urunler');
  if (iskartaPage) {
    const existingSearchPanel = iskartaPage.querySelector('.search-panel');
    if (!existingSearchPanel) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = searchPanelTemplate;
      const newPanel = tempDiv.firstElementChild;
      
      // Add panel before table container
      const tableContainer = iskartaPage.querySelector('.table-container');
      if (tableContainer) {
        iskartaPage.insertBefore(newPanel, tableContainer);
      } else {
        iskartaPage.appendChild(newPanel);
      }
    }
    
    // Add event listeners
    document.getElementById('iskartaArama').addEventListener('input', searchIskartaUrunler);
    document.getElementById('iskartaMalzemeTuruSecimi').addEventListener('change', searchIskartaUrunler);
    document.getElementById('iskartaProjeSecimi').addEventListener('change', searchIskartaUrunler);
    document.getElementById('iskartaBaslangicTarihi').addEventListener('change', searchIskartaUrunler);
    document.getElementById('iskartaBitisTarihi').addEventListener('change', searchIskartaUrunler);
    
    document.getElementById('iskartaAraBtn').addEventListener('click', searchIskartaUrunler);
    document.getElementById('iskartaFiltreSifirlaBtn').addEventListener('click', resetIskartaUrunlerFilters);
    
    // Fill project dropdown
    fillProjeSelectForIskartaUrunler();
    
    // Initial search to handle any pre-existing rows
    searchIskartaUrunler();
  }
}

// Add event listener to initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const navLinks = document.querySelectorAll('.nav-links li a');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      const pageName = this.getAttribute('data-page');
      if (pageName === 'iskarta-urunler') {
        // Delay slightly to ensure page is active before initializing search
        setTimeout(initIskartaUrunlerSearch, 100);
      }
    });
  });
  
  // If Iskarta Ürünler page is already active on load, initialize search
  const activePage = document.querySelector('.page.active');
  if (activePage && activePage.id === 'iskarta-urunler') {
    initIskartaUrunlerSearch();
  }
});



// Plaka Grubu Fason İşlemlerini Yükle (Basit Versiyon)
async function loadPlakaGrubuFasonIslemler() {
  try {
    console.log("Plaka grubu fason işlemleri yükleniyor...");
    
    // Tüm plaka gruplarını al
    const plakaGruplariResult = await window.electronAPI.invoke.database.getPlakaGruplariByHammaddeId();
    if (!plakaGruplariResult || !plakaGruplariResult.success) {
      console.log('Plaka grupları bulunamadı');
      return [];
    }

    const plakaGrubuFasonIslemler = [];
    
    // Tüm plaka grubu ID'lerini topla
    const plakaGrubuIds = [];
    for (const hammaddeId in plakaGruplariResult) {
      if (plakaGruplariResult[hammaddeId] && plakaGruplariResult[hammaddeId].gruplar) {
        plakaGruplariResult[hammaddeId].gruplar.forEach(grup => {
          plakaGrubuIds.push(grup.id);
        });
      }
    }
    
    if (plakaGrubuIds.length === 0) {
      return [];
    }

    // Tüm plaka grubu işlemlerini al
    const islemlerResult = await window.electronAPI.invoke.database.getIslemlerByMultiplePlakaGrubuIds(plakaGrubuIds);
    
    if (islemlerResult.success && islemlerResult.islemler.length > 0) {
      // FasonImalat olan işlemleri filtrele
      const fasonIslemler = islemlerResult.islemler.filter(islem => islem.kullanim_alani === 'FasonImalat');
      
      // Her işlem için plaka grubu bilgilerini al ve formatla
      for (const islem of fasonIslemler) {
        const plakaGrubuResult = await window.electronAPI.invoke.database.getPlakaGrubuById(islem.plaka_grubu_id);
        
        if (plakaGrubuResult.success) {
          const plakaGrubu = plakaGrubuResult.plaka_grubu;
          
          plakaGrubuFasonIslemler.push({
            islem_id: islem.id,
            islem_tarihi: islem.islem_tarihi,
            islem_turu: 'plaka_grubu',
            stok_kodu: plakaGrubu.stok_kodu,
            malzeme_adi: `Plaka Grubu (${plakaGrubu.en}x${plakaGrubu.boy}x${plakaGrubu.kalinlik}mm)`,
            kullanilanMiktar: islem.kullanilan_miktar,
            hurdaMiktar: islem.hurda_miktar,
            proje_adi: islem.proje_adi,
            hammadde_islem_turu: islem.islem_turu,
            calisan_ad: islem.calisan_ad,
            calisan_soyad: islem.calisan_soyad,
            makine: islem.makine,
            kullanici_ad: islem.kullanici_ad,
            kullanici_soyad: islem.kullanici_soyad
          });
        }
      }
    }
    
    return plakaGrubuFasonIslemler;
  } catch (error) {
    console.error('Plaka grubu fason işlemleri yükleme hatası:', error);
    return [];
  }
}

// Plaka Grubu Makine İşlemlerini Yükle (Basit Versiyon)
async function loadPlakaGrubuMakineIslemler() {
  try {
    console.log("Plaka grubu makine işlemleri yükleniyor...");
    
    // Tüm plaka gruplarını al
    const plakaGruplariResult = await window.electronAPI.invoke.database.getPlakaGruplariByHammaddeId();
    if (!plakaGruplariResult || !plakaGruplariResult.success) {
      console.log('Plaka grupları bulunamadı');
      return [];
    }

    const plakaGrubuMakineIslemler = [];
    
    // Tüm plaka grubu ID'lerini topla
    const plakaGrubuIds = [];
    for (const hammaddeId in plakaGruplariResult) {
      if (plakaGruplariResult[hammaddeId] && plakaGruplariResult[hammaddeId].gruplar) {
        plakaGruplariResult[hammaddeId].gruplar.forEach(grup => {
          plakaGrubuIds.push(grup.id);
        });
      }
    }
    
    if (plakaGrubuIds.length === 0) {
      return [];
    }

    // Tüm plaka grubu işlemlerini al
    const islemlerResult = await window.electronAPI.invoke.database.getIslemlerByMultiplePlakaGrubuIds(plakaGrubuIds);
    
    if (islemlerResult.success && islemlerResult.islemler.length > 0) {
      // MakineImalat olan işlemleri filtrele
      const makineIslemler = islemlerResult.islemler.filter(islem => islem.kullanim_alani === 'MakineImalat');
      
      // Her işlem için plaka grubu bilgilerini al ve formatla
      for (const islem of makineIslemler) {
        const plakaGrubuResult = await window.electronAPI.invoke.database.getPlakaGrubuById(islem.plaka_grubu_id);
        
        if (plakaGrubuResult.success) {
          const plakaGrubu = plakaGrubuResult.plaka_grubu;
          
          plakaGrubuMakineIslemler.push({
            islem_id: islem.id,
            islem_tarihi: islem.islem_tarihi,
            islem_turu: 'plaka_grubu',
            stok_kodu: plakaGrubu.stok_kodu,
            malzeme_adi: `Plaka Grubu (${plakaGrubu.en}x${plakaGrubu.boy}x${plakaGrubu.kalinlik}mm)`,
            kullanilanMiktar: islem.kullanilan_miktar,
            hurdaMiktar: islem.hurda_miktar,
            proje_adi: islem.proje_adi,
            hammadde_islem_turu: islem.islem_turu,
            calisan_ad: islem.calisan_ad,
            calisan_soyad: islem.calisan_soyad,
            kullanici_ad: islem.kullanici_ad,
            kullanici_soyad: islem.kullanici_soyad
          });
        }
      }
    }
    
    return plakaGrubuMakineIslemler;
  } catch (error) {
    console.error('Plaka grubu makine işlemleri yükleme hatası:', error);
    return [];
  }
}


async function loadPlakaGrubuIskartaIslemler() {
  try {
    console.log("Plaka grubu ıskarta işlemleri yükleniyor...");
    
    // Tüm plaka gruplarını al
    const plakaGruplariResult = await window.electronAPI.invoke.database.getPlakaGruplariByHammaddeId();
    if (!plakaGruplariResult || !plakaGruplariResult.success) {
      console.log('Plaka grupları bulunamadı');
      return [];
    }

    const plakaGrubuIskartaIslemler = [];
    
    // Tüm plaka grubu ID'lerini topla
    const plakaGrubuIds = [];
    for (const hammaddeId in plakaGruplariResult) {
      if (plakaGruplariResult[hammaddeId] && plakaGruplariResult[hammaddeId].gruplar) {
        plakaGruplariResult[hammaddeId].gruplar.forEach(grup => {
          plakaGrubuIds.push(grup.id);
        });
      }
    }
    
    if (plakaGrubuIds.length === 0) {
      return [];
    }

    // Tüm plaka grubu işlemlerini al
    const islemlerResult = await window.electronAPI.invoke.database.getIslemlerByMultiplePlakaGrubuIds(plakaGrubuIds);
    
    if (islemlerResult.success && islemlerResult.islemler.length > 0) {
      // Iskarta olan işlemleri filtrele (iskarta_urun = 1)
      const iskartaIslemler = islemlerResult.islemler.filter(islem => islem.iskarta_urun === 1);
      
      // Her işlem için plaka grubu bilgilerini al ve formatla
      for (const islem of iskartaIslemler) {
        const plakaGrubuResult = await window.electronAPI.invoke.database.getPlakaGrubuById(islem.plaka_grubu_id);
        
        if (plakaGrubuResult.success) {
          const plakaGrubu = plakaGrubuResult.plaka_grubu;
          
          plakaGrubuIskartaIslemler.push({
            islem_id: islem.id,
            islem_tarihi: islem.islem_tarihi,
            islem_turu: 'plaka_grubu',
            stok_kodu: plakaGrubu.stok_kodu,
            malzeme_adi: `Plaka Grubu (${plakaGrubu.en}x${plakaGrubu.boy}x${plakaGrubu.kalinlik}mm)`,
            kullanilanMiktar: islem.kullanilan_miktar,
            hurdaMiktar: islem.hurda_miktar,
            proje_adi: islem.proje_adi,
            hammadde_islem_turu: islem.islem_turu,
            kullanim_alani: islem.kullanim_alani,
            calisan_ad: islem.calisan_ad,
            calisan_soyad: islem.calisan_soyad,
            kullanici_ad: islem.kullanici_ad,
            kullanici_soyad: islem.kullanici_soyad
          });
        }
      }
    }
    
    return plakaGrubuIskartaIslemler;
  } catch (error) {
    console.error('Plaka grubu ıskarta işlemleri yükleme hatası:', error);
    return [];
  }
}


async function deletePlakaGrubuIslem(islemId, islemData = null) {
  try {
    // Kullanıcı bilgilerini al
    const userData = window.currentUser || { rol: 'kullanici' };
    
    // İşlem adını belirle
    let itemName = `Plaka Grubu İşlemi #${islemId}`;
    if (islemData && islemData.makine_adi) {
      itemName = `${islemData.makine_adi} - İşlem #${islemId}`;
    }
    
    // Modal ayarlarını hazırla
    const modalOptions = {
      title: 'Plaka Grubu İşlemi Silme Onayı',
      itemName: itemName,
      itemType: 'Plaka Grubu İşlemi',
      itemId: islemId,
      userData: userData,
      onConfirm: async (silmeNedeni) => {
        try {
          // Silme verileri hazırla
          const deleteData = {
            islemId: islemId,
            silmeNedeni: silmeNedeni,
            kullanici: userData
          };
          
          // Backend'e silme isteği gönder
          const result = await window.electronAPI.invoke.database.deletePlakaGrubuIslem(deleteData);
          
          if (result.success) {
            let successMessage = 'Plaka grubu işlemi başarıyla silindi.';
            
            if (result.restoredAmount) {
              successMessage += ` ${result.restoredAmount} kg hammadde stoğa geri eklendi.`;
            }
            
            if (result.deletedParts && result.deletedParts > 0) {
              successMessage += ` ${result.deletedParts} adet parça da silindi.`;
            }
            
            showToast(successMessage, 'success');
            
            // Sayfaları yenile
            if (typeof loadFasonIslemler === 'function') {
              await loadFasonIslemler();
            }
            if (typeof loadMakineIslemler === 'function') {
              await loadMakineIslemler();
            }
            if (typeof loadIskartaUrunler === 'function') {
              await loadIskartaUrunler();
            }
            
            // Dashboard'ı güncelle
            if (typeof updateDashboard === 'function') {
              updateDashboard();
            }
            
            // Tablo varsa güncelle
            if (typeof refreshCurrentTable === 'function') {
              refreshCurrentTable();
            }
            
          } else {
            throw new Error(result.message || 'Silme işlemi başarısız');
          }
          
        } catch (error) {
          console.error('Plaka grubu işlemi silme hatası:', error);
          throw new Error(`İşlem silinirken hata oluştu: ${error.message}`);
        }
      }
    };
    
    // Modal'ı göster
    const modalShown = showDeleteConfirmationModal(modalOptions);
    
    if (!modalShown) {
      showToast('Bu işlem için yönetici yetkisi gereklidir.', 'error');
      return;
    }
    
  } catch (error) {
    console.error('Plaka grubu işlemi silme hatası:', error);
    showToast('İşlem silinirken hata oluştu: ' + error.message, 'error');
  }
}

// Alternatif basit silme fonksiyonu (eski sistemle uyumluluk için)
async function deletePlakaGrubuIslemBasic(islemId) {
  if (!confirm('Bu plaka grubu işlemini silmek istediğinizden emin misiniz?')) {
    return;
  }
  
  try {
    const result = await window.electronAPI.invoke.database.deletePlakaGrubuIslem(islemId);
    
    if (result.success) {
      let successMessage = 'Plaka grubu işlemi başarıyla silindi.';
      
      if (result.restoredAmount) {
        successMessage += ` ${result.restoredAmount} kg hammadde stoğa geri eklendi.`;
      }
      
      if (result.deletedParts && result.deletedParts > 0) {
        successMessage += ` ${result.deletedParts} adet parça da silindi.`;
      }
      
      showToast(successMessage, 'success');
      
      // Sayfaları yenile
      await loadFasonIslemler();
      await loadMakineIslemler();
      await loadIskartaUrunler();
      
      // Dashboard'ı güncelle
      updateDashboard();
    } else {
      showToast('Hata: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('Plaka grubu işlemi silme hatası:', error);
    showToast('İşlem silinirken hata oluştu: ' + error.message, 'error');
  }
}

window.deletePlakaGrubuIslem = deletePlakaGrubuIslem;


window.searchIskartaUrunler = searchIskartaUrunler;
window.resetIskartaUrunlerFilters = resetIskartaUrunlerFilters;
window.initIskartaUrunlerSearch = initIskartaUrunlerSearch;
window.fillProjeSelectForIskartaUrunler = fillProjeSelectForIskartaUrunler;

  window.searchImalat = searchImalat;
  window.resetFilters = resetFilters;
  window.initImalatSearch = initImalatSearch;
  window.fillProjeSelectForImalat = fillProjeSelectForImalat;
  window.setupSearchPanels = setupSearchPanels;

  window.loadFasonIslemler = loadFasonIslemler;
  window.loadMakineIslemler = loadMakineIslemler;
  window.loadYariMamulMakineIslemler = loadYariMamulMakineIslemler;
  window.loadYariMamulFasonIslemler = loadYariMamulFasonIslemler;
  window.loadHammaddeFasonIslemler = loadHammaddeFasonIslemler;
  window.loadHammaddeIskartaIslemler = loadHammaddeIskartaIslemler;
  window.loadSarfMalzemeIskartaIslemler = loadSarfMalzemeIskartaIslemler;
  window.loadYariMamulIskartaIslemler = loadYariMamulIskartaIslemler;
  window.loadHammaddeMakineIslemler = loadHammaddeMakineIslemler;
  window.loadSarfMalzemeFasonIslemler = loadSarfMalzemeFasonIslemler;
  window.loadSarfMalzemeMakineIslemler = loadSarfMalzemeMakineIslemler;
  window.loadIskartaUrunler = loadIskartaUrunler;
  window.loadPlakaGrubuFasonIslemler = loadPlakaGrubuFasonIslemler;
window.loadPlakaGrubuMakineIslemler = loadPlakaGrubuMakineIslemler;
window.loadPlakaGrubuIskartaIslemler = loadPlakaGrubuIskartaIslemler;