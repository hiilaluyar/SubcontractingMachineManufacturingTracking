async function deleteIslemFromImplantation(islemId, islemType) {
    if (!islemId || !islemType) {
      showToast('İşlem bilgileri eksik', 'error');
      return;
    }
    
    // Şu anki kullanıcı bilgisini kontrol et
    if (!window.globalUserData) {
      showToast('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.', 'error');
      return;
    }
    
    // Yönetici kontrolü
    if (window.globalUserData.rol !== 'yonetici') {
      showToast('Bu işlem için yönetici yetkisi gereklidir.', 'error');
      return;
    }
    
    try {
      // İşlem hakkında bilgi al (işlem tipine göre)
      let islemResult;
      let islemAdi = '';
      let islemPrefix = '';
      
      if (islemType === 'hammadde') {
        islemResult = await window.electronAPI.invoke.database.getIslemById(islemId);
        islemPrefix = 'Hammadde';
      } else if (islemType === 'sarf_malzeme') {
        islemResult = await window.electronAPI.invoke.database.getSarfMalzemeIslemById(islemId);
        islemPrefix = 'Sarf Malzeme';
      } else if (islemType === 'yari_mamul') {
        islemResult = await window.electronAPI.invoke.database.getYariMamulIslemById(islemId);
        islemPrefix = 'Yarı Mamul';
      } else {
        showToast('Bilinmeyen işlem türü', 'error');
        return;
      }
      
      if (!islemResult.success) {
        showToast(`İşlem bilgileri alınamadı: ${islemResult.message}`, 'error');
        return;
      }
      
      const islem = islemResult.islem;
      
      // İşlem adını formatla - proje bilgisi ve işlem tarihi ile
      if (islem.proje_adi) {
        islemAdi = `${islemPrefix} İşlemi - ${islem.proje_adi} (${new Date(islem.islem_tarihi).toLocaleDateString('tr-TR')})`;
      } else {
        islemAdi = `${islemPrefix} İşlemi - ${new Date(islem.islem_tarihi).toLocaleDateString('tr-TR')}`;
      }
      
      // Silme modalını göster
      window.showDeleteConfirmationModal({
        title: `${islemPrefix} İşlemi Silme`,
        message: `"${islemAdi}" işlemini silmek istediğinizden emin misiniz?`,
        itemName: islemAdi,
        itemType: `${islemPrefix} İşlemi`,
        itemId: islemId,
        userData: window.globalUserData,
        onConfirm: async (reason) => {
          // Silme işlemini gerçekleştir
          showToast('İşlem siliniyor...', 'info');
          
          let result;
          
          if (islemType === 'hammadde') {
            const deleteData = {
              islemId: islemId,
              parcaId: islem.parca_id,
              kullanilanMiktar: parseFloat(islem.kullanilanMiktar),
              hurdaMiktar: parseFloat(islem.hurdaMiktar),
              yariMamulAdi: islem.yari_mamul_adi,
              yariMamulMiktar: parseFloat(islem.yari_mamul_miktar) || 0,
              yariMamulBirim: islem.yari_mamul_birim,
              // Kullanıcı bilgisini ekleyin
              kullanici: {
                id: window.globalUserData.id,
                ad: window.globalUserData.ad,
                soyad: window.globalUserData.soyad,
                kullanici_adi: window.globalUserData.kullanici_adi
              },
              // Silme nedenini ekleyin
              silmeNedeni: reason
            };
            
            result = await window.electronAPI.invoke.database.deleteHammaddeIslemAndRestoreStock(deleteData);
          } else if (islemType === 'sarf_malzeme') {
            const deleteData = {
              islemId: islemId,
              sarfMalzemeId: islem.sarf_malzeme_id,
              miktar: islem.miktar,
              // Kullanıcı bilgisini ekleyin
              kullanici: {
                id: window.globalUserData.id,
                ad: window.globalUserData.ad,
                soyad: window.globalUserData.soyad,
                kullanici_adi: window.globalUserData.kullanici_adi
              },
              // Silme nedenini ekleyin
              silmeNedeni: reason
            };
            
            result = await window.electronAPI.invoke.database.deleteSarfMalzemeIslemAndRestoreStock(deleteData);
          } else if (islemType === 'yari_mamul') {
            const deleteData = {
              islemId: islemId,
              yariMamulId: islem.yari_mamul_id,
              miktar: islem.miktar,
              // Kullanıcı bilgisini ekleyin
              kullanici: {
                id: window.globalUserData.id,
                ad: window.globalUserData.ad,
                soyad: window.globalUserData.soyad,
                kullanici_adi: window.globalUserData.kullanici_adi
              },
              // Silme nedenini ekleyin
              silmeNedeni: reason
            };
            
            result = await window.electronAPI.invoke.database.deleteYariMamulIslemAndRestoreStock(deleteData);
          }
          
          if (result && result.success) {
            // Mevcut aktif sayfayı belirle
            const activePage = document.querySelector('.page.active').id;
            
            // İlgili listeleri güncelle
            if (activePage === 'fason-imalat') {
              loadFasonIslemler();
            } else if (activePage === 'makine-imalat') {
              loadMakineIslemler();
            }
            
            // Diğer listeleri de güncelle
            updateDashboard();
            
            // İşlem türüne göre ilgili listeleri güncelle
            if (islemType === 'hammadde') {
              loadHammaddeListesi();
            } else if (islemType === 'sarf_malzeme') {
              loadSarfMalzemeListesi();
            } else if (islemType === 'yari_mamul') {
              loadYariMamulListesi();
            }
            
            showToast('İşlem başarıyla silindi ve stoklar güncellendi', 'success');
            return true;
          } else {
            throw new Error(`Hata: ${result ? result.message : 'Bilinmeyen bir hata oluştu'}`);
          }
        }
      });
    } catch (error) {
      console.error('İşlem silme hatası:', error);
      showToast('İşlem silinirken bir hata oluştu: ' + error.message, 'error');
    }
  }
  

    // Global fonksiyonları tanımla
  window.deleteIslemFromImplantation = deleteIslemFromImplantation;
  
  