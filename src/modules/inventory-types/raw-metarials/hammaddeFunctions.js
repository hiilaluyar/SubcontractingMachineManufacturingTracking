


// Add the getActivePartCount function to main.js so it can be called from the client
window.getActivePartCount = async function(hammaddeId) {
    try {
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            return 0;
        }
        
        const result = await window.electronAPI.invoke.database.getActivePartCount(hammaddeId);
        return result;
    } catch (error) {
        console.error('Aktif parça sayısı alma hatası:', error);
        return 0;
    }
};




document.addEventListener('DOMContentLoaded', function() {
    // Material type selection buttons (Sac, Boru, Mil)
    const materialTypeBtns = document.querySelectorAll('.material-type-btn');
    
    materialTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Aktif buton sınıflarını düzenle
            materialTypeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // İlgili formu göster
            const materialType = this.getAttribute('data-material-type');
            showMaterialForm(materialType);
        });
    });
    
    // Formların kayıt işlemleri
    setupSaveButtonHandlers();
    
    // İlk açılışta formu sıfırla
    resetAllForms();
});



function setupSaveButtonHandlers() {
  // Saç formu
  const hammaddeForm = document.getElementById('hammaddeForm');
  hammaddeForm.addEventListener('submit', saveSacHammadde);
  
  // Boru formu
  const boruForm = document.getElementById('boruForm');
  boruForm.addEventListener('submit', saveBoruHammadde);
  
  // Mil formu
  const milForm = document.getElementById('milForm');
  milForm.addEventListener('submit', saveMilHammadde);
}


// Tüm formları sıfırla
function resetAllForms() {
  document.getElementById('hammaddeForm').reset();
  document.getElementById('boruForm').reset();
  document.getElementById('milForm').reset();
  
  // Tüm kaydet butonlarını aktif et
  document.getElementById('kaydetBtn').disabled = false;
  document.getElementById('boruKaydetBtn').disabled = false;
  document.getElementById('milKaydetBtn').disabled = false;
}

// Show appropriate form based on material type

// İlgili formu göster
function showMaterialForm(materialType) {
  // Tüm formları gizle
  const materialForms = document.querySelectorAll('.material-form');
  materialForms.forEach(form => {
      form.style.display = 'none';
  });
  
  // İstenen formu göster
  let formToShow;
  switch(materialType) {
      case 'sac':
          formToShow = document.getElementById('hammaddeForm');
          break;
      case 'boru':
          formToShow = document.getElementById('boruForm');
          break;
      case 'mil':
          formToShow = document.getElementById('milForm');
          break;
  }
  
  if (formToShow) {
      formToShow.style.display = 'block';
  }
}


async function saveSacHammadde(e) {
    e.preventDefault();
    e.stopPropagation();
  
    const hammaddeData = {
        hammadde_turu: 'sac',
        malzeme_adi: document.getElementById('malzemeAdi').value,
        kalinlik: parseFloat(document.getElementById('kalinlik').value),
        yogunluk: parseFloat(document.getElementById('yogunluk').value),
        toplam_kilo: 0,
        tedarikci: '',
        // Kritik seviye değerini form elemanından al
        kritik_seviye: parseFloat(document.getElementById('kritikSeviye').value) || 0,
        birim_fiyat: 0,
        ekleyen_id: currentUser ? currentUser.id : 1
    };
  
    if (!hammaddeData.malzeme_adi || hammaddeData.malzeme_adi.trim() === '') {
        showToast('Lütfen malzeme adı girin.', 'error');
        return;
    }
  
    if (!hammaddeData.kalinlik || !hammaddeData.yogunluk) {
        showToast('Lütfen kalınlık ve yoğunluk bilgilerini girin.', 'error');
        return;
    }
  
    if (hammaddeData.kalinlik <= 0 || hammaddeData.yogunluk <= 0) {
        showToast('Kalınlık ve yoğunluk sıfırdan büyük olmalıdır.', 'error');
        return;
    }
  
    // Kritik seviye kontrolü (isteğe bağlı)
    if (hammaddeData.kritik_seviye && hammaddeData.kritik_seviye < 0) {
        showToast('Kritik seviye negatif olamaz.', 'error');
        return;
    }
  
    // Kalınlık çok küçük veya büyükse uyar
    if (hammaddeData.kalinlik < 0.1) {
        showToast('Kalınlık çok küçük. Lütfen değeri kontrol edin.', 'error');
        return;
    }
  
    if (hammaddeData.kalinlik > 200) {
        showToast('Kalınlık çok büyük. Lütfen değeri kontrol edin.', 'error');
        return;
    }
  
    const onay = await new Promise((resolve) => {
        Notiflix.Confirm.show(
            'Onaylıyor musunuz?',
            `${hammaddeData.malzeme_adi} adlı hammaddeyi ${hammaddeData.kalinlik} mm kalınlıkta kaydetmek istiyor musunuz?` +
            `${hammaddeData.kritik_seviye > 0 ? `\nKritik Seviye: ${hammaddeData.kritik_seviye} kg` : ''}`,
            'Evet, ekle!',
            'İptal',
            function () {
                resolve(true);
            },
            function () {
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
  
    if (!window.electronAPI?.invoke?.database) {
        console.error('Database invoke metodu bulunamadı');
        showToast('Hammadde kaydedilemedi. API erişimi yok.', 'error');
        return;
    }
  
    const checkResult = await window.electronAPI.invoke.database.checkHammaddeExists(hammaddeData);
  
    if (checkResult.success && checkResult.exists) {
        const existingItem = checkResult.hammadde;
  
        showToast(
            `${hammaddeData.malzeme_adi} adlı hammadde ${hammaddeData.kalinlik} mm kalınlıkta zaten mevcut.\n` +
            `Stok Kodu: ${existingItem.stok_kodu}\n` +
            `Mevcut Miktar: ${Number(existingItem.kalan_kilo).toFixed(2)} kg\n\n` +
            `Varolan kayda yönlendiriliyorsunuz...`,
            'warning'
        );
  
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById('hammadde-listesi').classList.add('active');
  
        const navLinks = document.querySelectorAll('.nav-links li a');
        navLinks.forEach(l => l.parentElement.classList.remove('active'));
        document.querySelector('a[data-page="hammadde-listesi"]').parentElement.classList.add('active');
  
        document.getElementById('hammaddeAra').value = hammaddeData.malzeme_adi;
        searchHammadde();
  
        setTimeout(() => {
            const rows = document.getElementById('hammaddeTable').querySelectorAll('tbody tr');
            rows.forEach(row => {
                if (row.cells[0].textContent === existingItem.stok_kodu) {
                    row.classList.add('highlighted-row');
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => row.classList.remove('highlighted-row'), 3000);
                }
            });
        }, 500);
  
        return;
    }
  
    const result = await window.electronAPI.invoke.database.addHammadde(hammaddeData);
  
    if (result.success) {
        showToast(`Hammadde başarıyla eklendi.\nStok Kodu: ${result.stokKodu}\nBarkod: ${result.barkod}`, 'success');
  
        document.getElementById('hammaddeForm').reset();
        updateDashboard();
  
        setTimeout(() => {
            loadHammaddeListesi();
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            document.getElementById('hammadde-listesi').classList.add('active');
  
            const navLinks = document.querySelectorAll('.nav-links li a');
            navLinks.forEach(l => l.parentElement.classList.remove('active'));
            document.querySelector('a[data-page="hammadde-listesi"]').parentElement.classList.add('active');
  
            setTimeout(() => {
                const rows = document.getElementById('hammaddeTable').querySelectorAll('tbody tr');
                rows.forEach(row => {
                    if (row.cells[0].textContent === result.stokKodu) {
                        row.classList.add('highlighted-row');
                        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => row.classList.remove('highlighted-row'), 5000);
                    }
                });
            }, 500);
        }, 1000);
    } else {
        showToast('Hata: ' + result.message, 'error');
    }
  }

async function saveBoruHammadde(e) {
    console.log('saveBoruHammadde çağrıldı');
  
    e.preventDefault();
    e.stopPropagation();
  
    try {
        const hammaddeData = {
            hammadde_turu: 'boru',
            malzeme_adi: document.getElementById('boruMalzemeAdi').value,
            cap: parseFloat(document.getElementById('boruCap').value),
            kalinlik: parseFloat(document.getElementById('boruKalinlik').value),
            uzunluk: parseFloat(document.getElementById('boruUzunluk').value),
            yogunluk: parseFloat(document.getElementById('boruYogunluk').value),
            toplam_kilo: 0,
            tedarikci: '',
            kritik_seviye: 0,
            birim_fiyat: 0,
            ekleyen_id: currentUser ? currentUser.id : 1
        };
  
        // Girdi kontrolü
        if (!hammaddeData.malzeme_adi || hammaddeData.malzeme_adi.trim() === '') {
            showToast('Lütfen malzeme adı girin.', 'error');
            return;
        }
  
        if (!hammaddeData.cap || !hammaddeData.kalinlik || !hammaddeData.uzunluk || !hammaddeData.yogunluk) {
            showToast('Lütfen tüm ölçü değerlerini girin.', 'error');
            return;
        }
  
        if (hammaddeData.cap <= 0 || hammaddeData.kalinlik <= 0 || hammaddeData.uzunluk <= 0 || hammaddeData.yogunluk <= 0) {
            showToast('Ölçü değerleri sıfırdan büyük olmalıdır.', 'error');
            return;
        }
  
        // Ağırlık hesapla - calculateBoruWeight kullanmıyoruz artık
        let boruAgirligi;
        try {
            boruAgirligi = calculateBoruWeight(hammaddeData);
        } catch (error) {
            showToast(`Ağırlık hesaplama hatası: ${error.message}`, 'error');
            return;
        }
  
        // Onay ekranı
        const onay = await new Promise((resolve, reject) => {
            Notiflix.Confirm.show(
                'Onaylıyor musunuz?',
                `Bir boru parçasının ağırlığı yaklaşık ${boruAgirligi.toFixed(2)} kg olacaktır. Eklemek istiyor musunuz?`,
                'Evet, ekle!',
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
  
        if (!onay) {
            return;
        }
  
        // API kontrolü
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            showToast('Hammadde kaydedilemedi. API erişimi yok.', 'error');
            return;
        }
  
        const checkResult = await window.electronAPI.invoke.database.checkHammaddeExists(hammaddeData);
  
        if (checkResult.success && checkResult.exists) {
            const existingItem = checkResult.hammadde;
            showToast(
                `${hammaddeData.malzeme_adi} adlı boru hammadde Ø${hammaddeData.cap}x${hammaddeData.kalinlik}x${hammaddeData.uzunluk} mm ölçülerinde zaten mevcut.\n` +
                `Stok Kodu: ${existingItem.stok_kodu}\n` +
                `Mevcut Miktar: ${Number(existingItem.kalan_kilo).toFixed(2)} kg\n\n` +
                'Varolan kayda yönlendiriliyorsunuz...',
                "warning"
            );
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            document.getElementById('hammadde-listesi').classList.add('active');
  
            const navLinks = document.querySelectorAll('.nav-links li a');
            navLinks.forEach(l => l.parentElement.classList.remove('active'));
            document.querySelector('a[data-page="hammadde-listesi"]').parentElement.classList.add('active');
  
            document.getElementById('hammaddeAra').value = hammaddeData.malzeme_adi;
            searchHammadde();
  
            setTimeout(() => {
                const rows = document.getElementById('hammaddeTable').querySelectorAll('tbody tr');
                rows.forEach(row => {
                    if (row.cells[0].textContent === existingItem.stok_kodu) {
                        row.classList.add('highlighted-row');
                        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
                        setTimeout(() => {
                            row.classList.remove('highlighted-row');
                        }, 3000);
                    }
                });
            }, 500);
            return;
        }
  
        const result = await window.electronAPI.invoke.database.addHammadde(hammaddeData);
  
        if (result.success) {
            showToast(`Boru hammadde başarıyla eklendi. Stok Kodu: ${result.stokKodu} Barkod: ${result.barkod}`, "success");
            
            document.getElementById('boruForm').reset();
            updateDashboard();
            loadHammaddeListesi();
            setTimeout(() => {
                document.getElementById('boruMalzemeAdi').focus();
            }, 100);
        } else {
            showToast('Hata: ' + result.message, 'error');
        }
    } catch (error) {
       console.error('Boru hammadde kaydetme hatası:', error);
       showToast('Boru hammadde kaydedilirken bir hata oluştu: ' + error.message, 'error');
    }
  }
  
  // Mil Hammadde Kaydetme İşlemi (Güncellenmiş)
  async function saveMilHammadde(e) {
    e.preventDefault();
    e.stopPropagation();
    
    try {
        // Form değerlerini al
        const hammaddeData = {
            hammadde_turu: 'mil',
            malzeme_adi: document.getElementById('milMalzemeAdi').value,
            cap: parseFloat(document.getElementById('milCap').value),
            uzunluk: parseFloat(document.getElementById('milUzunluk').value),
            yogunluk: parseFloat(document.getElementById('milYogunluk').value),
            toplam_kilo: 0, // Başlangıçta 0
            tedarikci: '', // Sonradan girilecek
            kritik_seviye: 0, // Sonradan girilecek
            birim_fiyat: 0, // Sonradan girilecek
            ekleyen_id: currentUser ? currentUser.id : 1
        };
        
        // Geçerli değerler kontrolü
        if (!hammaddeData.malzeme_adi || hammaddeData.malzeme_adi.trim() === '') {
            showToast('Lütfen malzeme adı girin.', 'error');
            return;
        }
        
        if (!hammaddeData.cap || !hammaddeData.uzunluk || !hammaddeData.yogunluk) {
            showToast('Lütfen tüm ölçü değerlerini girin.', 'error');
            return;
        }
        
        if (hammaddeData.cap <= 0 || hammaddeData.uzunluk <= 0 || hammaddeData.yogunluk <= 0) {
            showToast('Ölçü değerleri sıfırdan büyük olmalıdır.', 'error');
            return;
        }
        
        // Ağırlık hesapla
        let milAgirligi;
        try {
            milAgirligi = calculateMilWeight(hammaddeData);
        } catch (error) {
            showToast(`Ağırlık hesaplama hatası: ${error.message}`, 'error');
            return;
        }
        
        // Onay mesajı
        const onayMesaji = `Bir mil parçasının ağırlığı yaklaşık ${milAgirligi.toFixed(2)} kg olacaktır. Eklemek istiyor musunuz?`;
        const onay = await new Promise((resolve, reject) => {
            Notiflix.Confirm.show(
                'Onaylıyor musunuz?',
                onayMesaji,
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
  
        if (!onay) {
            return;
        }
  
        // API kontrolü
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            showToast('Hammadde kaydedilemedi. API erişimi yok.', 'error');
            return;
        }
        
        // Önce mevcut hammadde kontrolü yap
        const checkResult = await window.electronAPI.invoke.database.checkHammaddeExists(hammaddeData);
        
        if (checkResult.success && checkResult.exists) {
            // Aynı özelliklerde hammadde var, kullanıcıya toast göster
            const existingItem = checkResult.hammadde;
            
            // Toast bildirimini göster
            showToast(
                `"${hammaddeData.malzeme_adi}" adlı mil hammadde Ø${hammaddeData.cap}x${hammaddeData.uzunluk} mm ölçülerinde zaten mevcut.\n` +
                `Stok Kodu: ${existingItem.stok_kodu}\n` +
                `Mevcut Miktar: ${Number(existingItem.kalan_kilo).toFixed(2)} kg\n\n` +
                `Varolan kayda yönlendiriliyorsunuz...`, 
                'warning'
            );
            
            // Hammadde listesine git ve mevcut öğeyi göster
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            document.getElementById('hammadde-listesi').classList.add('active');
            
            // Yan menüdeki aktif linki de güncelle
            const navLinks = document.querySelectorAll('.nav-links li a');
            navLinks.forEach(l => l.parentElement.classList.remove('active'));
            document.querySelector('a[data-page="hammadde-listesi"]').parentElement.classList.add('active');
            
            // Arama kutusuna malzeme adını yaz ve aramayı çalıştır
            document.getElementById('hammaddeAra').value = hammaddeData.malzeme_adi;
            searchHammadde();
            
            // İlgili satırı vurgula
            setTimeout(() => {
                const rows = document.getElementById('hammaddeTable').querySelectorAll('tbody tr');
                rows.forEach(row => {
                    if (row.cells[0].textContent === existingItem.stok_kodu) {
                        row.classList.add('highlighted-row');
                        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        // 3 saniye sonra vurgulamayı kaldır
                        setTimeout(() => {
                            row.classList.remove('highlighted-row');
                        }, 3000);
                    }
                });
            }, 500);
            
            return;
        }
        
        // Hammadde verilerini database'e gönder
        const result = await window.electronAPI.invoke.database.addHammadde(hammaddeData);
        
        if (result.success) {
            // Başarılı bildirimi göster
            showToast(`Mil hammadde başarıyla eklendi.\nStok Kodu: ${result.stokKodu}\nBarkod: ${result.barkod}`, 'success');
            
            // Formu temizle
            document.getElementById('milForm').reset();
            
            // Dashboard'ı ve hammadde listesini güncelle
            updateDashboard();
            loadHammaddeListesi();
            
            // Sonraki işlem için odağı malzeme adına ayarla
            setTimeout(() => {
                document.getElementById('milMalzemeAdi').focus();
            }, 100);
        } else {
            showToast('Hata: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Mil hammadde kaydetme hatası:', error);
        showToast('Mil hammadde kaydedilirken bir hata oluştu: ' + error.message, 'error');
    }
  }




  
// Hammadde listesi güncelleme fonksiyonu
async function loadHammaddeListesi() {
    try {
        console.log('Hammadde listesi yükleniyor...');
        
        const result = await window.electronAPI.invoke.database.getAllHammadde();
        console.log('Hammadde listesi sonucu:', result);
        
        const hammaddeTable = document.getElementById('hammaddeTable');
        const tableBody = hammaddeTable.getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
        
        if (result.success && result.hammaddeler.length > 0) {
            result.hammaddeler.forEach(async hammadde => {
                const row = tableBody.insertRow();
                
                // Stok Kodu
                row.insertCell(0).textContent = hammadde.stok_kodu;
                
                // Malzeme Bilgisi
                const malzemeBilgisiCell = row.insertCell(1);
                let malzemeBilgisi = '';
                
                switch(hammadde.hammadde_turu) {
                    case 'sac':
                        malzemeBilgisi = `${hammadde.malzeme_adi} ${hammadde.kalinlik} mm`;
                        break;
                    case 'boru':
                        malzemeBilgisi = `${hammadde.malzeme_adi} Ø${hammadde.cap}x${hammadde.kalinlik}x${hammadde.uzunluk} mm`;
                        break;
                    case 'mil':
                        malzemeBilgisi = `${hammadde.malzeme_adi} Ø${hammadde.cap}x${hammadde.uzunluk} mm`;
                        break;
                    default:
                        malzemeBilgisi = hammadde.malzeme_adi;
                }
                
                malzemeBilgisiCell.textContent = malzemeBilgisi;
                
                // Aktif parça sayısını al
                const activePartCount = await window.electronAPI.invoke.database.getActivePartCount(hammadde.id);
                
                // Miktar - hammadde türüne göre farklı bilgi göster
                const miktarCell = row.insertCell(2);
                if (hammadde.hammadde_turu === 'sac') {
                    // Saç için sadece kg bilgisi
                    miktarCell.textContent = `${Number(hammadde.toplam_kilo).toFixed(2)} kg`;
                } else if (hammadde.hammadde_turu === 'boru') {
                    // Boru için toplam uzunluk ve kg
                    const toplam_kilo = Number(hammadde.toplam_kilo);
                    
                    if (toplam_kilo <= 0) {
                        miktarCell.textContent = `0 mm (0 kg)`;
                    } else {
                        const uzunluk = Number(hammadde.uzunluk) || 0;
                        try {
                            const boruWeight = calculateBoruWeight({
                                cap: Number(hammadde.cap),
                                kalinlik: Number(hammadde.kalinlik),
                                uzunluk: uzunluk,
                                yogunluk: Number(hammadde.yogunluk)
                            });
                            
                            const adet = boruWeight > 0 ? Math.round(toplam_kilo / boruWeight) : 0;
                            const toplamUzunluk = adet * uzunluk;
                            
                            miktarCell.textContent = `${toplamUzunluk} mm (${toplam_kilo.toFixed(2)} kg)`;
                        } catch (error) {
                            miktarCell.textContent = `0 mm (0 kg)`;
                        }
                    }
                } else if (hammadde.hammadde_turu === 'mil') {
                    // Mil için toplam uzunluk ve kg
                    const toplam_kilo = Number(hammadde.toplam_kilo);
                    
                    if (toplam_kilo <= 0) {
                        miktarCell.textContent = `0 mm (0 kg)`;
                    } else {
                        const uzunluk = Number(hammadde.uzunluk) || 0;
                        try {
                            const milWeight = calculateMilWeight({
                                cap: Number(hammadde.cap),
                                uzunluk: uzunluk,
                                yogunluk: Number(hammadde.yogunluk)
                            });
                            
                            const adet = milWeight > 0 ? Math.round(toplam_kilo / milWeight) : 0;
                            const toplamUzunluk = adet * uzunluk;
                            
                            miktarCell.textContent = `${toplamUzunluk} mm (${toplam_kilo.toFixed(2)} kg)`;
                        } catch (error) {
                            miktarCell.textContent = `0 mm (0 kg)`;
                        }
                    }
                } else {
                    // Diğer türler için varsayılan gösterim
                    miktarCell.textContent = `${Number(hammadde.toplam_kilo).toFixed(2)} kg`;
                }
                
                // Kalan
                const kalanCell = row.insertCell(3);
                if (hammadde.hammadde_turu === 'sac') {
                    // Saç için kalan kilo 
                    kalanCell.textContent = `${Number(hammadde.kalan_kilo).toFixed(2)} kg`;
                } else if (hammadde.hammadde_turu === 'boru') {
                    // Kalan uzunluk için güvenli hesaplama
                    const toplam_kilo = Number(hammadde.toplam_kilo);
                    const kalan_kilo = Number(hammadde.kalan_kilo);
                    
                    if (toplam_kilo <= 0 || kalan_kilo <= 0) {
                        kalanCell.textContent = `0 mm (0 kg)`;
                    } else {
                        try {
                            const uzunluk = Number(hammadde.uzunluk) || 0;
                            const boruWeight = calculateBoruWeight({
                                cap: Number(hammadde.cap),
                                kalinlik: Number(hammadde.kalinlik),
                                uzunluk: uzunluk,
                                yogunluk: Number(hammadde.yogunluk)
                            });
                            
                            // Toplam adet
                            const toplamAdet = boruWeight > 0 ? Math.round(toplam_kilo / boruWeight) : 0;
                            const toplamUzunluk = toplamAdet * uzunluk;
                            
                            // Oran hesabı
                            const kalanOran = toplam_kilo > 0 ? kalan_kilo / toplam_kilo : 0;
                            // Kalan uzunluk = oran * toplam uzunluk
                            const kalanUzunluk = Math.round(kalanOran * toplamUzunluk);
                            
                            kalanCell.textContent = `${kalanUzunluk} mm (${kalan_kilo.toFixed(2)} kg)`;
                        } catch (error) {
                            kalanCell.textContent = `0 mm (0 kg)`;
                        }
                    }
                } else if (hammadde.hammadde_turu === 'mil') {
                    // Kalan uzunluk için güvenli hesaplama
                    const toplam_kilo = Number(hammadde.toplam_kilo);
                    const kalan_kilo = Number(hammadde.kalan_kilo);
                    
                    if (toplam_kilo <= 0 || kalan_kilo <= 0) {
                        kalanCell.textContent = `0 mm (0 kg)`;
                    } else {
                        try {
                            const uzunluk = Number(hammadde.uzunluk) || 0;
                            const milWeight = calculateMilWeight({
                                cap: Number(hammadde.cap),
                                uzunluk: uzunluk,
                                yogunluk: Number(hammadde.yogunluk)
                            });
                            
                            // Toplam adet
                            const toplamAdet = milWeight > 0 ? Math.round(toplam_kilo / milWeight) : 0;
                            const toplamUzunluk = toplamAdet * uzunluk;
                            
                            // Oran hesabı
                            const kalanOran = toplam_kilo > 0 ? kalan_kilo / toplam_kilo : 0;
                            // Kalan uzunluk = oran * toplam uzunluk
                            const kalanUzunluk = Math.round(kalanOran * toplamUzunluk);
                            
                            kalanCell.textContent = `${kalanUzunluk} mm (${kalan_kilo.toFixed(2)} kg)`;
                        } catch (error) {
                            kalanCell.textContent = `0 mm (0 kg)`;
                        }
                    }
                } else {
                    // Diğer türler için varsayılan gösterim
                    kalanCell.textContent = `${Number(hammadde.kalan_kilo).toFixed(2)} kg`;
                }
                
                // Barkod
                row.insertCell(4).textContent = hammadde.barkod;
                
                // Durumu
                const durumCell = row.insertCell(5);
                let durumText = '';
                let durumClass = '';
                
                switch (hammadde.durum) {
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
                durumCell.style.verticalAlign = 'middle';
                
                // İşlemler
                const islemlerCell = row.insertCell(6);
                islemlerCell.innerHTML = `
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewHammaddeDetail(${hammadde.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn add" onclick="${hammadde.hammadde_turu === 'sac' ? 
                            `openYeniPlakaModalWithSelection(${hammadde.id})` : 
                            `openHammaddeGirisModal(${hammadde.id})`}">
                            <i class="fas fa-plus-square" style="color: #28a745;"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteHammadde(${hammadde.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            });
        } else {
            const row = tableBody.insertRow();
            row.innerHTML = '<td colspan="7" class="text-center">Hammadde bulunamadı</td>';
        }
    } catch (error) {
        console.error('Hammadde listesi yükleme hatası:', error);
        const hammaddeTable = document.getElementById('hammaddeTable');
        if (hammaddeTable) {
            const tableBody = hammaddeTable.getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Veri yüklenirken hata oluştu</td></tr>';
        }
    }
}


async function viewHammaddeDetail(id) {
    try {
      if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
        console.error('Database invoke metodu bulunamadı');
        alert('Hammadde detayı getirilemedi.');
        return;
      }
  
      const result = await window.electronAPI.invoke.database.getHammaddeById(id);
      console.log('Hammadde detayı sonucu:', result);
      
      if (result.success) {
        currentHammaddeId = id;
        currentHammadde = result.hammadde;
        
        // Fill in hammadde details
        const hammaddeDetay = document.getElementById('hammaddeDetay');
        const hammadde = result.hammadde;
        const ekleyen = result.ekleyen;
        
        // Get hammadde type
        const hammaddeTuru = hammadde.hammadde_turu || 'sac'; // default to sac if not specified
        
        // Build detail HTML based on hammadde type
        let detayHTML = `
            <div class="detay-row">
                <div class="detay-label">Stok Kodu:</div>
                <div class="detay-value">${hammadde.stok_kodu}</div>
            </div>
            <div class="detay-row">
                <div class="detay-label">Malzeme Adı:</div>
                <div class="detay-value">${hammadde.malzeme_adi}</div>
            </div>
        `;
        
        // Add type-specific fields
        if (hammaddeTuru === 'sac') {
            // Sac details
            detayHTML += `
                <div class="detay-row">
                    <div class="detay-label">Kalınlık:</div>
                    <div class="detay-value">${hammadde.kalinlik} mm</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Yoğunluk:</div>
                    <div class="detay-value">${Number(hammadde.yogunluk).toFixed(2)} kg/m³</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Toplam Kilo:</div>
                    <div class="detay-value">${Number(hammadde.toplam_kilo).toFixed(2)} kg</div>
                </div>
                <div class="detay-row">
                   <div class="detay-label">Kalan Kilo:</div>
      <div class="detay-value">${(() => {
          const value = Number(hammadde.kalan_kilo);
          if (value > -0.01 && value < 0.01) {
              return '0.00';
          }
          return value.toFixed(2);
      })()} kg</div>
                </div>
            `;
        } else if (hammaddeTuru === 'boru') {
            // Boru details
            detayHTML += `
                <div class="detay-row">
                    <div class="detay-label">Ölçüler:</div>
                    <div class="detay-value">Ø${hammadde.cap} x ${hammadde.kalinlik} x ${hammadde.uzunluk} mm</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Yoğunluk:</div>
                    <div class="detay-value">${Number(hammadde.yogunluk).toFixed(2)} kg/m³</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Toplam Kilo:</div>
                    <div class="detay-value">${Number(hammadde.toplam_kilo).toFixed(2)} kg</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Kalan Kilo:</div>
                    <div class="detay-value">${Number(hammadde.kalan_kilo).toFixed(2)} kg</div>
                </div>
            `;
        } else if (hammaddeTuru === 'mil') {
            // Mil details
            detayHTML += `
                <div class="detay-row">
                    <div class="detay-label">Ölçüler:</div>
                    <div class="detay-value">Ø${hammadde.cap} x ${hammadde.uzunluk} mm</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Yoğunluk:</div>
                    <div class="detay-value">${Number(hammadde.yogunluk).toFixed(2)} kg/m³</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Toplam Kilo:</div>
                    <div class="detay-value">${Number(hammadde.toplam_kilo).toFixed(2)} kg</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Kalan Kilo:</div>
                    <div class="detay-value">${Number(hammadde.kalan_kilo).toFixed(2)} kg</div>
                </div>
            `;
        }
        
        // Add common details
        detayHTML += `
            <div class="detay-row">
                <div class="detay-label">Kritik Seviye:</div>
                <div class="detay-value">${Number(hammadde.kritik_seviye).toFixed(2)} kg</div>
            </div>
            <div class="detay-row">
                <div class="detay-label">Barkod:</div>
                <div class="detay-value">${hammadde.barkod}</div>
            </div>
            <div class="detay-row">
                <div class="detay-label">Ekleyen:</div>
                <div class="detay-value">${ekleyen ? `${ekleyen.ad} ${ekleyen.soyad}` : 'Bilinmiyor'}</div>
            </div>
            <div class="detay-row">
                <div class="detay-label">Ekleme Tarihi:</div>
                <div class="detay-value">${new Date(hammadde.ekleme_tarihi).toLocaleString('tr-TR')}</div>
            </div>
        `;
        
        hammaddeDetay.innerHTML = detayHTML;
        
        // UI'ı hammdde türüne göre güncelle
        updateHammaddeDetailUI(hammaddeTuru);
        
        // Open the modal - önce modalı aç
        openModal('detayModal');
        
        // Set up tab system
        setupTabSystem();
        
        // Hammadde türüne göre veri yükleme işlemlerini asenkron olarak yap
        if (hammaddeTuru === 'sac') {
          // For sac, load plaka GROUPS first then parça list - BURADA DEĞİŞİKLİK VAR
          await Promise.all([
            loadPlakaGruplari(id), // Eski loadPlakaList yerine loadPlakaGruplari kullanıyoruz
            loadPlakaParcaList(id)
          ]);
          // Tüm yükleme işlemleri tamamlandıktan sonra badge'i güncelle
          updateParcaTabBadge();
        } else {
          // For boru and mil, load parça list directly
          await loadParcaList(id);
          // Tüm yükleme işlemleri tamamlandıktan sonra badge'i güncelle
          updateParcaTabBadge();
        }
        
        // İşlem geçmişi ve giriş geçmişini yükle
        await Promise.all([
          loadIslemGecmisi(id),
          loadHammaddeGirisGecmisi(id)
        ]);
        
      } else {
        alert('Hata: ' + result.message);
      }
    } catch (error) {
      console.error('Hammadde detayı getirme hatası:', error);
      alert('Hammadde detayı getirilirken bir hata oluştu.');
    }
}
  

  function updateHammaddeDetailUI(hammaddeTuru) {
    console.log("Hammadde türü:", hammaddeTuru); // For debugging
    
    // Get tab buttons
    const plakaTab = document.querySelector('.tab-button[data-tab="plakalar-tab"]');
    const parcaTab = document.querySelector('.tab-button[data-tab="parcalar-tab"]');
    const girisGecmisiTab = document.querySelector('.tab-button[data-tab="giris-gecmisi-tab"]');
    const islemGecmisiTab = document.querySelector('.tab-button[data-tab="islem-gecmisi-tab"]');
    
    // Get tab contents
    const plakaTabContent = document.getElementById('plakalar-tab');
    const parcaTabContent = document.getElementById('parcalar-tab');
    const girisGecmisiTabContent = document.getElementById('giris-gecmisi-tab');
    const islemGecmisiTabContent = document.getElementById('islem-gecmisi-tab');
    
    // First, remove active class from all tabs
    document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Update table headers for parcalar based on hammadde type
    const parcaTableHeaders = document.querySelector('#parcalarTable thead tr');
    
    if (hammaddeTuru === 'sac') {
      // For sac type:
      // 1. Show the plakalar tab
      if (plakaTab) {
        plakaTab.style.display = 'block';
        // Make plakalar tab active by default
        plakaTab.classList.add('active');
        if (plakaTabContent) plakaTabContent.classList.add('active');
      }
      
      if (parcaTab) {
        parcaTab.textContent = 'Parçalar';
      }
      
      // Update parca table headers for sac
      if (parcaTableHeaders) {
        parcaTableHeaders.innerHTML = `
          <th>Parça No</th>
          <th>Plaka No</th>
          <th>En x Boy</th>
          <th>Durum</th>
          <th>Orijinal Kilo</th>
          <th>Kalan Kilo</th>
          <th>Kullanım Oranı</th>
          <th>İşlemler</th>
        `;
      }
    } else {
      // For boru and mil:
      // 1. Hide the plakalar tab completely
      if (plakaTab) {
        plakaTab.style.display = 'none';
      }
      
      // 2. Make parcalar tab active by default
      if (parcaTab) {
        parcaTab.textContent = 'Parçalar';
        parcaTab.classList.add('active');
      }
      if (parcaTabContent) {
        parcaTabContent.classList.add('active');
      }
      
      // 3. Update parca table headers for boru/mil
      if (parcaTableHeaders) {
        parcaTableHeaders.innerHTML = `
          <th>Parça No</th>
          <th>Barkod Kodu</th>
          <th>Boyut</th>
          <th>Durum</th>
          <th>Orijinal Kilo</th>
          <th>Kalan Kilo</th>
          <th>Kullanım Oranı</th>
          <th>İşlemler</th>
        `;
      }
    }
    
    console.log("UI updated for hammadde type:", hammaddeTuru);
  }


  function updateParcaTabBadge() {
    try {
        // Parça tablosundan satır sayısını al
        const parcaTable = document.getElementById('parcalarTable');
        if (!parcaTable) return;
        
        const tbody = parcaTable.querySelector('tbody');
        if (!tbody) return;
        
        const rows = tbody.querySelectorAll('tr');
        
        // Boş satır kontrolü (tek satırda "Parça bulunamadı" yazıyorsa)
        let partCount = 0;
        if (rows.length > 0) {
            // İlk satırı kontrol et
            const firstRow = rows[0];
            const firstCell = firstRow.querySelector('td');
            
            // Eğer bu tek hücre "Parça bulunamadı" içermiyorsa, gerçek satırlar var demektir
            if (firstCell && !firstCell.textContent.includes('Parça bulunamadı')) {
                partCount = rows.length;
            }
        }
        
        // Badge'i ekle
        const parcaTab = document.querySelector('.tab-button[data-tab="parcalar-tab"]');
        if (parcaTab && partCount > 0) {
            parcaTab.innerHTML = `Parçalar <span class="part-count-badge">${partCount}</span>`;
        } else if (parcaTab) {
            parcaTab.textContent = 'Parçalar';
        }
    } catch (error) {
        console.error('Parça sayısını hesaplarken hata:', error);
    }
}

(function addPartCountStyle() {
    // Stil zaten eklenmiş mi kontrol et
    if (document.getElementById('part-count-badge-style')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'part-count-badge-style';
    style.textContent = `
        .part-count-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            background: linear-gradient(135deg, #CC2C30, #CC6633);
            color: white;
            font-size: 11px;
            font-weight: bold;
            height: 22px;
            min-width: 22px;
            line-height: 22px;
            border-radius: 11px;
            padding: 0 6px;
            box-shadow: 0 3px 10px rgba(204, 44, 48, 0.5);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            border: 1.5px solid rgba(255, 255, 255, 0.7);
            transition: all 0.3s ease;
            transform-origin: center center;
        }
        
        /* Tab container'ı için position relative ekle */
        .tab-button {
            position: relative;
        }
        
        /* Hover efekti */
        .tab-button:hover .part-count-badge {
            transform: scale(1.1);
            box-shadow: 0 5px 15px rgba(204, 44, 48, 0.6);
        }
        
        /* Animasyon */
        @keyframes badgePulse {
            0% {
                transform: scale(1);
                box-shadow: 0 3px 10px rgba(204, 44, 48, 0.5);
            }
            50% {
                transform: scale(1.15);
                box-shadow: 0 5px 15px rgba(204, 44, 48, 0.7);
            }
            100% {
                transform: scale(1);
                box-shadow: 0 3px 10px rgba(204, 44, 48, 0.5);
            }
        }
        
        .part-count-badge.new-notification {
            animation: badgePulse 2s infinite;
        }
        
        /* Tab seçildiğinde badge stilini değiştir */
        .tab-button.active .part-count-badge {
            background: linear-gradient(135deg, #3a7bd5, #00d2ff);
            box-shadow: 0 3px 10px rgba(58, 123, 213, 0.5);
            border: 1.5px solid rgba(255, 255, 255, 0.8);
        }
        
        /* Bildirim sayısı 10'dan fazla olduğunda stil değişikliği */
        .part-count-badge[data-count="10+"] {
            min-width: 28px;
            font-size: 10px;
        }
    `;
    document.head.appendChild(style);
    
})();

function searchHammadde() {
    // İçerik tabında mı kontrol et
    const activeTab = document.querySelector('.hammadde-tabs .tab-content.active');
    if (!activeTab || activeTab.id !== 'hammadde-list-tab') return;
    
    // Arama değerlerini al
    const searchText = document.getElementById('hammaddeAra').value.toLowerCase().trim();
    const tipSecimi = document.getElementById('hammaddeTipSecimi').value;
    const durumSecimi = document.getElementById('hammaddeDurumSecimi').value;
    
    console.log('Arama yapılıyor:', { searchText, tipSecimi, durumSecimi });
    
    // Tablo satırlarını al
    const rows = document.getElementById('hammaddeTable').getElementsByTagName('tbody')[0].rows;
    
    // Her satırı kontrol et
    for (let i = 0; i < rows.length; i++) {
      const stokKodu = rows[i].cells[0].textContent.toLowerCase();
      const malzemeBilgisi = rows[i].cells[1].textContent.toLowerCase();
      const barkod = rows[i].cells[4].textContent.toLowerCase();
      
      // Hammadde türünü malzeme bilgisi içindeki bilgilerden daha net belirle
      let hammaddeTuru = '';
      if (malzemeBilgisi.includes('ø') || malzemeBilgisi.includes('Ø')) {
        if (malzemeBilgisi.includes('x') && malzemeBilgisi.includes('x', malzemeBilgisi.indexOf('x') + 1)) {
          // İki 'x' işareti varsa: çap x kalınlık x uzunluk formatı - bu bir boru
          hammaddeTuru = 'boru';
        } else {
          // Sadece tek 'x' işareti varsa: çap x uzunluk formatı - bu bir mil
          hammaddeTuru = 'mil';
        }
      } else {
        // Ø işareti yoksa bu bir sac
        hammaddeTuru = 'sac';
      }
      
      // Durumu al
      const durumCell = rows[i].cells[5];
      const durumText = durumCell.textContent.trim();
      let durumDegeri = '';
      
      if (durumText.includes('STOKTA VAR') || durumText.includes('Stokta Var')) {
        durumDegeri = 'STOKTA_VAR';
      } else if (durumText.includes('AZ KALDI') || durumText.includes('Az Kaldı')) {
        durumDegeri = 'AZ_KALDI';
      } else if (durumText.includes('STOKTA YOK') || durumText.includes('Stokta Yok')) {
        durumDegeri = 'STOKTA_YOK';
      }
      
      // Arama koşullarını kontrol et
      const textMatch = 
        searchText === '' || 
        stokKodu.includes(searchText) || 
        malzemeBilgisi.includes(searchText) || 
        barkod.includes(searchText);
      
      const tipMatch = 
        tipSecimi === '' || 
        hammaddeTuru === tipSecimi;
      
      const durumMatch = 
        durumSecimi === '' || 
        durumDegeri === durumSecimi;
      
      // Tüm kriterlere uyuyorsa satırı göster, uymuyorsa gizle
      rows[i].style.display = (textMatch && tipMatch && durumMatch) ? '' : 'none';
    }
    
    console.log('Arama tamamlandı');
  }
  


  
function setupHammaddeGirisButtons() {
    const yeniHammaddeGirisBtn = document.getElementById('yeniHammaddeGirisBtn');
    if (yeniHammaddeGirisBtn) {
        yeniHammaddeGirisBtn.addEventListener('click', function() {
            openHammaddeGirisModal();
        });
    }
    
    // Hammadde giriş kaydet butonu
    const hammaddeGirisKaydetBtn = document.getElementById('hammaddeGirisKaydetBtn');
    if (hammaddeGirisKaydetBtn) {
        hammaddeGirisKaydetBtn.addEventListener('click', async function() {
            await kaydetHammaddeGirisi();
        });
    }
    
}



function calculateBoruWeight(boru) {
  try {
      // Değer kontrolü
      if (!boru.cap || !boru.kalinlik || !boru.uzunluk || !boru.yogunluk || 
          boru.cap <= 0 || boru.kalinlik <= 0 || boru.uzunluk <= 0 || boru.yogunluk <= 0) {
          showToast("Geçersiz boru ölçüleri", 'error');
          throw new Error("Geçersiz boru ölçüleri");
      }
      
      // İç çapı hesapla ve kontrol et
      const icCap = boru.cap - (2 * boru.kalinlik);
      if (icCap <= 0) {
          showToast("Boru kalınlığı çaptan büyük olamaz", 'error');
          throw new Error("Boru kalınlığı çaptan büyük olamaz");
      }

      // Metrelere dönüştür
      const disYaricap = boru.cap / 2000; // mm → m
      const icYaricap = icCap / 2000; // mm → m
      const uzunlukMetre = boru.uzunluk / 1000; // mm → m
      
      // Hacim hesapla (m³)
      const disHacim = Math.PI * Math.pow(disYaricap, 2) * uzunlukMetre;
      const icHacim = Math.PI * Math.pow(icYaricap, 2) * uzunlukMetre;
      const boruHacim = disHacim - icHacim;
      
      // Ağırlık hesapla (kg)
      const agirlik = boruHacim * boru.yogunluk;
      
      if (agirlik <= 0) {
          showToast("Hesaplanan ağırlık sıfır veya negatif", 'error');
          throw new Error("Hesaplanan ağırlık sıfır veya negatif");
      }
      
      return agirlik;
  } catch (error) {
      // Sadece showToast fonksiyonuyla hata mesajını göster
      // Error zaten fırlatıldı, burada tekrar fırlatmaya gerek yok
      throw error; // Hata durumunda hata fırlat
  }
}


// Mil ağırlığı hesaplama yardımcı fonksiyonu
function calculateMilWeight(mil) {
    try {
        // Değer kontrolü
        if (!mil.cap || !mil.uzunluk || !mil.yogunluk || 
            mil.cap <= 0 || mil.uzunluk <= 0 || mil.yogunluk <= 0) {
            throw new Error("Geçersiz mil ölçüleri");
        }
        
        // Metrelere dönüştür
        const yaricap = mil.cap / 2000; // mm → m
        const uzunlukMetre = mil.uzunluk / 1000; // mm → m
        
        // Hacim hesapla (m³)
        const hacim = Math.PI * Math.pow(yaricap, 2) * uzunlukMetre;
        
        // Ağırlık hesapla (kg)
        const agirlik = hacim * mil.yogunluk;
        
        if (agirlik <= 0) {
            throw new Error("Hesaplanan ağırlık sıfır veya negatif");
        }
        
        return agirlik;
    } catch (error) {
        console.error("Mil ağırlık hesaplama hatası:", error);
        throw error;
    }
}





let isProcessing = false;

async function kaydetHammaddeGirisi() {
  // Eğer zaten bir işlem devam ediyorsa çık
  if (isProcessing) {
      return;
  }

  try {
      // İşlem başlamadan önce kilidi aç
      isProcessing = true;

      // Form değerlerini al
      const hammaddeId = document.getElementById('hammaddeGirisHammaddeId').value;
      const miktar = parseFloat(document.getElementById('hammaddeGirisMiktar').value);
      const birimFiyat = parseFloat(document.getElementById('hammaddeGirisBirimFiyat').value);
      const birimFiyatTuru = document.getElementById('hammaddeGirisBirimFiyatTuru').value || 'TRY';
      const tedarikci = document.getElementById('hammaddeGirisTedarikci').value;
      const kritikSeviye = parseFloat(document.getElementById('hammaddeGirisKritikSeviye').value);
      // Ana barkod değerini al
      const anaBarkod = document.getElementById('hammaddeGirisAnaBarkod').value;
      
      // Doğrulama
      if (!miktar || miktar <= 0) {
          showModalError('hammaddeGirisModal', 'Lütfen geçerli bir miktar girin.');
          return;
      }
      
      if (!birimFiyat || birimFiyat <= 0) {
          showModalError('hammaddeGirisModal', 'Lütfen geçerli bir birim fiyat girin.');
          return;
      }
      
      // Tedarikçi ve kritik seviye zorunlu
      if (!tedarikci || tedarikci.trim() === '') {
          showModalError('hammaddeGirisModal', 'Lütfen tedarikçi bilgisi girin.');
          return;
      }
      
      if (!kritikSeviye || kritikSeviye <= 0) {
          showModalError('hammaddeGirisModal', 'Lütfen geçerli bir kritik seviye girin.');
          return;
      }
      
      // Ana barkod zorunlu
      if (!anaBarkod || anaBarkod.trim() === '') {
          showModalError('hammaddeGirisModal', 'Lütfen ana barkod girin.');
          return;
      }
      
      try {
          // API kontrolü
          if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
              console.error('Database invoke metodu bulunamadı');
              showToast('İşlem kaydedilemedi. API erişimi yok.', 'error');
              return;
          }

          // Önce hammadde bilgilerini al
          const hammaddeResult = await window.electronAPI.invoke.database.getHammaddeById(hammaddeId);
          
          if (!hammaddeResult || !hammaddeResult.success) {
              showToast('Hammadde bilgileri alınamadı: ' + (hammaddeResult?.message || 'Bilinmeyen hata'), 'error');
              return;
          }
          
          const hammadde = hammaddeResult.hammadde;
          const hammaddeTuru = hammadde.hammadde_turu || 'sac';
          
          let plakaSayisi = 0;
          let plakaAgirligi = 0;
          let toleransliMi = true;
          let gercekPlakaAgirligi = null;
          
          // hesaplamaDetaylari var mı kontrol et ve kullan
          if (window.hesaplamaDetaylari) {
              plakaAgirligi = window.hesaplamaDetaylari.plakaAgirligi;
              plakaSayisi = window.hesaplamaDetaylari.plakaSayisi;
              toleransliMi = window.hesaplamaDetaylari.toleransliMi;
              
              // Gerçek plaka ağırlığı için hesaplamaDetaylari kullan
              if (window.hesaplamaDetaylari.gercekPlakaAgirligi) {
                  gercekPlakaAgirligi = window.hesaplamaDetaylari.gercekPlakaAgirligi;
              }
          } else {
              // Hesaplama yoksa, plaka/adet bilgilerini manuel hesapla
              if (hammaddeTuru === 'sac') {
                  // Sac için hesaplama yönteminde değişiklik yok
                  // Plaka ağırlığını hesapla
                  const kalinlik = parseFloat(hammadde.kalinlik) / 1000; // mm'den m'ye çevir
                  const en = parseFloat(hammadde.en) / 1000; // mm'den m'ye çevir
                  const boy = parseFloat(hammadde.boy) / 1000; // mm'den m'ye çevir
                  const yogunluk = parseFloat(hammadde.yogunluk);
                  
                  // Hacim hesapla (m³)
                  const hacim = en * boy * kalinlik;
                  
                  // Bir plakanın ağırlığını hesapla (kg)
                  plakaAgirligi = hacim * yogunluk;
                  
                  // Plaka sayısı
                  plakaSayisi = Math.floor(miktar / plakaAgirligi);
                  
                  // Gerçek plaka ağırlığı
                  if (plakaSayisi > 0) {
                      gercekPlakaAgirligi = miktar / plakaSayisi;
                  }
              } else if (hammaddeTuru === 'boru' || hammaddeTuru === 'mil') {
                  // Boru ve mil için değişiklik burada
                  // Artık adet hesaplaması yapmıyoruz, direkt toplam miktar tek parça olarak kaydediliyor
                  plakaSayisi = 1; // Tek parça
                  plakaAgirligi = miktar; // Toplam ağırlık
                  gercekPlakaAgirligi = miktar; // Gerçek ağırlık
              }
          }
          
          // Giriş verisi
          const girisData = {
              hammadde_id: hammaddeId,
              hammadde_turu: hammaddeTuru,
              miktar: miktar,
              birim_fiyat: birimFiyat,
              birim_fiyat_turu: birimFiyatTuru,
              tedarikci: tedarikci,
              kritik_seviye: kritikSeviye,
              ekleyen_id: currentUser.id,
              plaka_sayisi: plakaSayisi,
              plaka_agirligi: plakaAgirligi,
              gercek_plaka_agirligi: gercekPlakaAgirligi,
              ana_barkod: anaBarkod // Ana barkod değerini ekle
          };
          
          // Debug - gönderilen veriyi kontrol et
          console.log("Gönderilen giriş verisi:", girisData);
          
          // İşlem kaydediliyor mesajını göster
          showModalSuccess('hammaddeGirisModal', 'Giriş kaydediliyor...');
          
          // Girişi kaydet
          const result = await window.electronAPI.invoke.database.kaydetHammaddeMalzemeGirisi(girisData);
          
          // result kontrol edilmeden önce tanımlı olup olmadığına bakılmalı
          if (!result) {
              showToast('Hammadde girişi sırasında bir hata oluştu: Sunucudan cevap alınamadı', 'error');
              return;
          }
          
          if (result.success) {
              showToast('Hammadde girişi başarıyla kaydedildi.', 'success');
              
              // Giriş modalını kapat
              closeModal('hammaddeGirisModal');
              
              // Formu sıfırla
              document.getElementById('hammaddeGirisForm').reset();
              
              // Hesaplama detaylarını temizle
              window.hesaplamaDetaylari = null;
              
              // Dashboard'ı güncelle
              updateDashboard();
              
              // Hammadde listesini güncelle
              await loadHammaddeListesi();
              
              // Hammadde detayını yeniden yükle
              if (currentHammaddeId) {
                  await viewHammaddeDetail(currentHammaddeId);
              }
          } else {
              showToast('Hata: ' + result.message, 'error');
          }
      } catch (error) {
          console.error('Hammadde girişi kaydetme hatası:', error);
          showToast('Hammadde girişi kaydedilirken bir hata oluştu: ' + error.message, 'error');
      }
  } finally {
      // İşlem bittiğinde kilidi kapat
      isProcessing = false;
  }
}




// Hammadde arama özelliği için event listener'ları
document.addEventListener('DOMContentLoaded', function() {
    // Mevcut document ready içindeki kodlara ekleyebilirsiniz
    
    const hammaddeAra = document.getElementById('hammaddeAra');
    const hammaddeTipSecimi = document.getElementById('hammaddeTipSecimi');
    const hammaddeDurumSecimi = document.getElementById('hammaddeDurumSecimi');
    const hammaddeAraBtn = document.getElementById('hammaddeAraBtn');

    // Event listener'ları ekle
    if (hammaddeAra) {
        hammaddeAra.addEventListener('input', searchHammadde);
        
        // Enter tuşu ile arama yapma
        hammaddeAra.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') searchHammadde();
        });
    }

    if (hammaddeTipSecimi) {
        hammaddeTipSecimi.addEventListener('change', searchHammadde);
    }

    if (hammaddeDurumSecimi) {
        hammaddeDurumSecimi.addEventListener('change', searchHammadde);
    }

    if (hammaddeAraBtn) {
        hammaddeAraBtn.addEventListener('click', searchHammadde);
    }
});





/**
 * Hammaddeyi bildirimli şekilde siler
 * @param {number} id - Hammadde ID
 */
async function deleteHammadde(id) {
    try {
      // Hammadde bilgilerini al
      const hammaddeResult = await window.electronAPI.invoke.database.getHammaddeById(id);
      
      if (!hammaddeResult.success) {
        alert('Hammadde bilgileri alınamadı: ' + hammaddeResult.message);
        return;
      }
      
      const hammadde = hammaddeResult.hammadde;
      
      // Şu anki kullanıcı bilgisini al (global değişkenden)
      if (!window.globalUserData) {
        alert('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }
      
      // Yönetici kontrolü
      if (window.globalUserData.rol !== 'yonetici') {
        showToast('Bu işlem için yönetici yetkisi gereklidir.', 'error');
        return;
      }
      
      // Malzeme adını formatla
      let itemName = hammadde.malzeme_adi;
      if (hammadde.stok_kodu) {
        itemName += ` (${hammadde.stok_kodu})`;
      }
      
      // Silme modalını göster
      window.showDeleteConfirmationModal({
        title: 'Hammadde Silme İşlemi',
        message: `"${itemName}" hammaddesini silmek istediğinizden emin misiniz?`,
        itemName: itemName,
        itemType: 'Hammadde',
        itemId: id,
        userData: window.globalUserData,
        onConfirm: async (reason) => {
          // Silme işlemini gerçekleştir
          const result = await window.electronAPI.invoke.database.deleteHammaddeWithNotification(
            id, 
            reason,
            window.globalUserData
          );
          
          if (result.success) {
            // Başarılı ise listeyi güncelle
            loadHammaddeListesi();
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
      console.error('Hammadde silme hatası:', error);
      alert('Hammadde silinirken bir hata oluştu: ' + error.message);
    }
  }


async function loadHammaddeGirisGecmisi(hammaddeId) {
    try {
        console.log('📋 Giriş geçmişi yükleniyor - Hammadde ID:', hammaddeId);
        
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('❌ Database invoke metodu bulunamadı');
            return;
        }

        const result = await window.electronAPI.invoke.database.getHammaddeGirisGecmisi(hammaddeId);
        
        const girisGecmisiTable = document.getElementById('girisGecmisiTable').getElementsByTagName('tbody')[0];
        girisGecmisiTable.innerHTML = '';
        
        if (!result.success || !result.girisGecmisi || result.girisGecmisi.length === 0) {
            const row = girisGecmisiTable.insertRow();
            row.innerHTML = '<td colspan="8" class="text-center">Giriş geçmişi bulunamadı</td>';
            return;
        }

        console.log('📊 Giriş geçmişi sayısı:', result.girisGecmisi.length);

        // İşlem durumunu kontrol etmek için işlemleri al
        let islemler = [];
        try {
            const islemlerResult = await window.electronAPI.invoke.database.getIslemlerByHammaddeId(hammaddeId);
            islemler = islemlerResult.success ? islemlerResult.islemler : [];
            console.log('🔧 Toplam işlem sayısı:', islemler.length);
        } catch (islemError) {
            console.warn('⚠️ İşlemler alınırken hata:', islemError);
            islemler = [];
        }
        
        // Giriş geçmişini tarihe göre sırala (en yeni en üstte)
        const sortedGirisGecmisi = result.girisGecmisi
            .sort((a, b) => new Date(b.giris_tarihi) - new Date(a.giris_tarihi));
        
        // Son giriş tarihini al
        const sonGirisTarihi = sortedGirisGecmisi.length > 0 ? 
            new Date(sortedGirisGecmisi[0].giris_tarihi) : null;
        
        // Son girişten sonra işlem yapılmış mı kontrol et
        const sonGirisSonrasiIslemVar = islemler.some(islem => {
            const islemTarihi = new Date(islem.islem_tarihi);
            return sonGirisTarihi && islemTarihi > sonGirisTarihi;
        });

        console.log('🕐 Son giriş tarihi:', sonGirisTarihi?.toLocaleString('tr-TR'));
        console.log('🔍 Son girişten sonra işlem var mı:', sonGirisSonrasiIslemVar);

        // Her giriş kaydını tabloya ekle
        sortedGirisGecmisi.forEach((giris, index) => {
            const row = girisGecmisiTable.insertRow();
            
            // Tarih
            const tariihCell = row.insertCell(0);
            const date = new Date(giris.giris_tarihi);
            tariihCell.textContent = date.toLocaleString('tr-TR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Miktar ve plaka sayısı
            const miktarCell = row.insertCell(1);
            let miktarText = `${Number(giris.miktar).toFixed(2)} kg`;
            if (giris.plaka_sayisi && giris.plaka_sayisi > 0) {
                miktarText += ` <span class="plaka-badge">(${giris.plaka_sayisi} plaka)</span>`;
            }
            miktarCell.innerHTML = miktarText;
            
            // Para birimi belirleme
            let paraBirimi = giris.birim_fiyat_turu || 'TRY';
            if (!giris.birim_fiyat_turu && giris.tedarikci) {
                const paraBirimiMatch = giris.tedarikci.match(/\((.*?)\)/);
                if (paraBirimiMatch && paraBirimiMatch[1]) {
                    paraBirimi = paraBirimiMatch[1];
                }
            }
            
            // Para birimi sembolü
            const paraBirimiSembolu = getParaBirimiSembolu(paraBirimi);
            
            // Birim Fiyat
            const birimFiyatCell = row.insertCell(2);
            birimFiyatCell.textContent = `${Number(giris.birim_fiyat || 0).toFixed(2)} ${paraBirimiSembolu}`;
            
            // Toplam Tutar
            const toplamTutarCell = row.insertCell(3);
            const toplamTutar = Number(giris.miktar || 0) * Number(giris.birim_fiyat || 0);
            toplamTutarCell.textContent = `${toplamTutar.toFixed(2)} ${paraBirimiSembolu}`;
            
            // Tedarikçi (parantez içindeki para birimini çıkar)
            const tedarikciCell = row.insertCell(4);
            let tedarikci = giris.tedarikci || 'Belirtilmemiş';
            tedarikci = tedarikci.replace(/\s*\(.*?\)\s*/, '').trim();
            tedarikciCell.textContent = tedarikci;
            
            // Ana Barkod
            const barkodCell = row.insertCell(5);
            barkodCell.textContent = giris.ana_barkod || '-';
            
            // Ekleyen kullanıcı
            const kullaniciCell = row.insertCell(6);
            kullaniciCell.textContent = `${giris.kullanici_ad || ''} ${giris.kullanici_soyad || ''}`.trim() || 'Bilinmiyor';
            
            // İşlemler sütunu - EN ÖNEMLİ KISIM
            const islemlerCell = row.insertCell(7);
            const buGirisSonGiris = index === 0; // İlk sıradaki en son giriş
            
            // Plaka grubu girişi mi kontrol et
            const isPlakaGrubuGirisi = giris.plaka_sayisi && giris.plaka_sayisi > 0;
            
            // Düzenleme durumunu belirle
            let canEdit = false;
            let editReason = '';
            
            if (!buGirisSonGiris) {
                // Son giriş değilse düzenlenemez
                editReason = 'Sadece son giriş düzenlenebilir';
            } else if (sonGirisSonrasiIslemVar) {
                // Son girişten sonra işlem varsa düzenlenemez
                editReason = 'Son girişten sonra işlem yapıldığı için güncellenemez';
            } else if (!giris.id) {
                // ID yoksa düzenlenemez
                editReason = 'Giriş ID\'si bulunamadı';
            } else {
                canEdit = true;
            }
            
            console.log(`📝 Giriş ${index + 1} düzenleme durumu:`, {
                id: giris.id,
                isPlakaGrubu: isPlakaGrubuGirisi,
                canEdit,
                reason: editReason
            });
            
            if (canEdit) {
                if (isPlakaGrubuGirisi) {
                    // Plaka grubu girişi için özel düzenleme butonu
                    islemlerCell.innerHTML = `
                        <div class="action-buttons">
                            <button class="action-btn edit plaka-grubu-edit" 
                                    title="Plaka Grubu Düzenle" 
                                    onclick="openPlakaGrubuDuzenleModal(${giris.id}, ${hammaddeId}, ${giris.miktar})"
                                    data-giris-id="${giris.id}">
                                <i class="fas fa-layer-group"></i>
                                <span class="btn-text">Plaka Grubu</span>
                            </button>
                        </div>
                    `;
                } else {
                    // Normal hammadde girişi için standart düzenleme
                    islemlerCell.innerHTML = `
                        <div class="action-buttons">
                            <button class="action-btn edit normal-edit" 
                                    title="Hammadde Girişi Düzenle" 
                                    onclick="openHammaddeGirisGuncelleModal(${giris.id}, ${hammaddeId}, ${giris.miktar})"
                                    data-giris-id="${giris.id}">
                                <i class="fas fa-edit"></i>
                                <span class="btn-text">Düzenle</span>
                            </button>
                        </div>
                    `;
                }
            } else {
                // Düzenlenemez durumda
                islemlerCell.innerHTML = `
                    <div class="action-buttons">
                        <button class="action-btn edit disabled" 
                                title="${editReason}" 
                                disabled>
                            <i class="fas fa-ban"></i>
                            <span class="btn-text">Kilitli</span>
                        </button>
                    </div>
                `;
            }
        });
        
        console.log('✅ Giriş geçmişi başarıyla yüklendi');
        
    } catch (error) {
        console.error('❌ Giriş geçmişi yükleme hatası:', error);
        
        const girisGecmisiTable = document.getElementById('girisGecmisiTable')?.getElementsByTagName('tbody')[0];
        if (girisGecmisiTable) {
            girisGecmisiTable.innerHTML = '';
            const row = girisGecmisiTable.insertRow();
            row.innerHTML = '<td colspan="8" class="text-center error-text">Giriş geçmişi yüklenirken hata oluştu</td>';
        }
    }
}

// Modal kapatıldığında normal moda döndürme işlemi
function handleModalClose() {
    const modal = document.getElementById('yeniPlakaGrubuModal');
    
    if (modal) {
        modal.addEventListener('hidden', function() {
            if (isEditMode) {
                resetModalToNormalMode();
            }
        });
    }
}

// Sayfa yüklendiğinde modal kapatma olayını dinle
document.addEventListener('DOMContentLoaded', function() {
    handleModalClose();
    
    // Modal kapatma butonları için event listener
    const closeButtons = document.querySelectorAll('#yeniPlakaGrubuModal .close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (isEditMode) {
                resetModalToNormalMode();
            }
        });
    });
});

// CSS stilleri - plaka grubu düzenleme butonu için özel stil
const plakaGrubuEditStyles = `
.action-btn.edit[style*="linear-gradient"] {
    position: relative;
    overflow: hidden;
}

.action-btn.edit[style*="linear-gradient"]:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.action-btn.edit[style*="linear-gradient"]:before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.3s ease;
}

.action-btn.edit[style*="linear-gradient"]:hover:before {
    width: 100%;
    height: 100%;
}

/* Tooltip için özel stil */
.action-btn[title]:hover:after {
    content: attr(title);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 1000;
    margin-bottom: 5px;
}
`;

// Stilleri ekle
if (!document.getElementById('plaka-grubu-edit-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'plaka-grubu-edit-styles';
    styleElement.textContent = plakaGrubuEditStyles;
    document.head.appendChild(styleElement);
}



  
// İşlem kaydetme

async function saveIslem() {
    // Form değerlerini al
    let kullanilanMiktar = parseFloat(document.getElementById('kullanilanMiktar').value);
    let hurdaMiktar = parseFloat(document.getElementById('hurdaMiktar').value) || 0;
    const islemTuru = document.getElementById('islemTuru').value;
    const kullanimAlani = document.getElementById('kullanimAlani').value;
    const projeId = document.getElementById('projeSecimi').value;
    
    // Yeni eklenen alanlar
    const makine = document.getElementById('makineSecimi').value;
    const calisanId = document.getElementById('calisanSecimi').value;
    // Müşteri seçimi sadece FasonImalat seçildiğinde kullanılacak
    const musteriSecimi = document.getElementById('musteriSecimi');
    const musteriId = (kullanimAlani === 'FasonImalat' && musteriSecimi) ? musteriSecimi.value : null;
    
    // Doğrulama
    if (!kullanilanMiktar || kullanilanMiktar <= 0) {
        showModalError('islemModal', 'Lütfen geçerli bir kullanılan miktar girin.');
        return;
    }
    
    if (!projeId) {
        showModalError('islemModal', 'Lütfen bir proje seçin veya yeni bir proje oluşturun.');
        return;
    }
    
    // Fason imalat için müşteri seçimi kontrolü
    if (kullanimAlani === 'FasonImalat' && musteriSecimi && !musteriSecimi.value) {
        showModalError('islemModal', 'Lütfen bir müşteri seçin veya yeni müşteri ekleyin.');
        return;
    }
    
    // Yarı mamul bilgilerini kontrol et
    let yariMamulAdi = null;
    let yariMamulBirim = null;
    let yariMamulMiktar = null;
    
    if (kullanimAlani === 'MakineImalat') {
        const yariMamulAdiElement = document.getElementById('yariMamulAdi');
        const yariMamulBirimElement = document.getElementById('yariMamulBirim');
        const yariMamulMiktarElement = document.getElementById('yariMamulMiktar');
        
        if (yariMamulAdiElement && yariMamulBirimElement && yariMamulMiktarElement) {
            yariMamulAdi = yariMamulAdiElement.value.trim();
            yariMamulBirim = yariMamulBirimElement.value;
            yariMamulMiktar = parseFloat(yariMamulMiktarElement.value);
            
            // Yarı mamul adı ve miktarı zorunlu
            if (!yariMamulAdi) {
                showModalError('islemModal', 'Yarı mamul adı girmelisiniz.');
                return;
            }
            
            if (!yariMamulMiktar || yariMamulMiktar <= 0) {
                showModalError('islemModal', 'Geçerli bir yarı mamul miktarı girmelisiniz.');
                return;
            }
        }
    }
    
    try {
        // API kontrolü
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            Notiflix.Notify.failure('Hata: İşlem kaydedilemedi. API erişimi yok.');
            return;
        }
  
        // Önce hammadde bilgilerini alalım
        const hammaddeResult = await window.electronAPI.invoke.database.getHammaddeById(currentHammaddeId);
        if (!hammaddeResult.success) {
            Notiflix.Notify.failure('Hata: Hammadde bilgileri alınamadı: ' + hammaddeResult.message);
            return;
        }
        
        const hammadde = hammaddeResult.hammadde;
        
        // Parça bilgilerini al ve kullanılabilir miktarı kontrol et
        const parcaResult = await window.electronAPI.invoke.database.getParcalarByHammaddeId(currentHammaddeId);
        if (!parcaResult.success) {
            Notiflix.Notify.failure('Hata: Parça bilgileri alınamadı: ' + parcaResult.message);
            return;
        }
        
        const parca = parcaResult.parcalar.find(p => p.id === currentParcaId);
        if (!parca) {
            Notiflix.Notify.failure('Hata: Parça bulunamadı.');
            return;
        }
        
        // Miktar kontrolü (tüm hammadde türleri için kg cinsinden)
        const toplamKullanilacak = kullanilanMiktar + hurdaMiktar;
        const kalanKilo = parseFloat(parca.kalan_kilo);
        
        // Sayısal kontrol ekleyelim
        if (isNaN(kalanKilo)) {
            Notiflix.Notify.failure(`Hata: Kalan kilo değeri sayısal değil: ${parca.kalan_kilo}`);
            return;
        }
        
        // Kalan miktarı kontrol et
        if (toplamKullanilacak > kalanKilo) {
            Notiflix.Confirm.show(
                'Miktar Hatası',
                `Kullanmak istediğiniz miktar (${toplamKullanilacak.toFixed(2)} kg) parçada kalan miktardan (${kalanKilo.toFixed(2)} kg) fazla.`,
                'Tamam',
                'İptal',
                function() {},
                function() {},
                {
                    titleColor: '#6A0D0C',
                    buttonOkBackgroundColor: '#6A0D0C',
                    cssAnimationStyle: 'zoom'
                }
            );
            return;
        }
        
        // İşlem verisi
        const islemData = {
            parca_id: currentParcaId,
            islem_turu: islemTuru,
            kullanim_alani: kullanimAlani,
            kullanilanMiktar: kullanilanMiktar,
            hurdaMiktar: hurdaMiktar,
            proje_id: projeId,
            kullanici_id: currentUser.id,
            // Yeni eklenen alanlar
            makine: makine || null,
            calisan_id: calisanId || null,
            musteri_id: musteriId || null,
            // Yarı mamul bilgileri
            yari_mamul_adi: yariMamulAdi || null,
            yari_mamul_birim: yariMamulBirim || null,
            yari_mamul_miktar: yariMamulMiktar || null
        };
        
        // İşlem kaydediliyor mesajını göster
        showModalSuccess('islemModal', 'İşlem kaydediliyor...');
        
        // İşlemi kaydet
        const result = await window.electronAPI.invoke.database.addIslem(islemData);
        
        if (result.success) {
            showToast('Hammaddeden kalan miktar düşürüldü.', 'success');
            
            // İşlem modalını kapat
            closeModal('islemModal');
            
            // Formu sıfırla
            document.getElementById('kullanilanMiktar').value = '';
            document.getElementById('hurdaMiktar').value = '0';
            document.getElementById('makineSecimi').value = '';
            document.getElementById('calisanSecimi').value = '';
            
            if (musteriSecimi) {
                musteriSecimi.value = '';
            }
            
            if (kullanimAlani === 'MakineImalat') {
                if (document.getElementById('yariMamulAdi')) {
                    document.getElementById('yariMamulAdi').value = '';
                }
                if (document.getElementById('yariMamulMiktar')) {
                    document.getElementById('yariMamulMiktar').value = '';
                }
            }
            
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
            Notiflix.Notify.failure('İşlem Hatası: ' + result.message);
        }
    } catch (error) {
        console.error('İşlem kaydetme hatası:', error);
        Notiflix.Notify.failure('İşlem Hatası: İşlem kaydedilirken bir hata oluştu: ' + error.message);
    }
  }



async function deleteHammaddeIslem(islemId) {
    try {
      // İşlem bilgilerini al
      const islemResult = await window.electronAPI.invoke.database.getIslemById(islemId);
      
      if (!islemResult.success) {
        throw new Error('İşlem bilgileri alınamadı: ' + islemResult.message);
      }
      
      const islem = islemResult.islem;
      
      // Silme işlemi için gereken verileri hazırla
      const deleteData = {
        islemId: islemId,
        parcaId: islem.parca_id,
        kullanilanMiktar: parseFloat(islem.kullanilanMiktar),
        hurdaMiktar: parseFloat(islem.hurdaMiktar),
        yariMamulAdi: islem.yari_mamul_adi,
        yariMamulMiktar: parseFloat(islem.yari_mamul_miktar),
        yariMamulBirim: islem.yari_mamul_birim
      };
      
      // İşlemi sil ve stokları güncelle
      const result = await window.electronAPI.invoke.database.deleteHammaddeIslemAndRestoreStock(deleteData);
      
      return result;
    } catch (error) {
      console.error('Hammadde işlemi silme hatası:', error);
      return { success: false, message: error.message };
    }
  }
  



  async function openHammaddeGirisModal(hammaddeId) {
    try {
      // Hammadde ID'sini set et
      currentHammaddeId = hammaddeId;
      
      // Hammadde bilgilerini al
      const result = await window.electronAPI.invoke.database.getHammaddeById(hammaddeId);
      
      if (!result.success) {
        showErrorMessage('Hata', 'Hammadde bilgileri alınamadı: ' + result.message);
        return;
      }
      
      const hammadde = result.hammadde;
      
      // Formu sıfırla
      document.getElementById('hammaddeGirisForm').reset();
      
      // Hammadde ID'sini ayarla
      document.getElementById('hammaddeGirisHammaddeId').value = hammaddeId;
      
      // Hammadde türüne göre formu ayarla
      document.getElementById('hammaddeGirisTuruDegeri').value = hammadde.hammadde_turu || 'sac';
      
      // Para birimi seçeneklerini içeren select elementini aktifleştir
      document.getElementById('hammaddeGirisBirimFiyatTuru').disabled = false;
      
      // Hammadde türüne göre birim etiketini ayarla - hepsini kg olarak göster
      document.querySelector('label[for="hammaddeGirisMiktar"]').textContent = 'Miktar (kg)';
      
      // Hesaplama alanını tamamen gizle
      document.getElementById('hammaddeGirisHesaplamaAlani').style.display = 'none';
      
      // Detay modalını kapat
      closeModal('detayModal');
      
      // Giriş modalını aç
      openModal('hammaddeGirisModal');
      
      // Miktar alanına odaklan
      setTimeout(() => {
        document.getElementById('hammaddeGirisMiktar').focus();
      }, 300);
      
    } catch (error) {
      console.error('Hammadde giriş modalı açma hatası:', error);
      showErrorMessage('Hata', 'Hammadde giriş modalı açılırken bir hata oluştu.');
    }
  }


  
async function openIslemModal(parcaId, parcaNo) {
    currentParcaId = parcaId;
    // Parça numarasını global olarak sakla (yeni müşteri ekleme vb. için)
    currentParcaNo = parcaNo;
    
    try {
        // Hammadde ve parça bilgilerini al
        const [parcaResult, hammaddeResult] = await Promise.all([
            window.electronAPI.invoke.database.getParcalarByHammaddeId(currentHammaddeId),
            window.electronAPI.invoke.database.getHammaddeById(currentHammaddeId)
        ]);
        
        if (parcaResult.success) {
            const parca = parcaResult.parcalar.find(p => p.id === parcaId);
            const hammadde = hammaddeResult.success ? hammaddeResult.hammadde : null;
            const hammaddeTuru = hammadde ? (hammadde.hammadde_turu || 'sac') : 'sac';
            
            if (parca) {
                // Parça başlığını güncelle - barkod kodunu göster
                document.getElementById('parcaHeader').textContent = parca.barkod_kodu || 
                    `${hammaddeTuru.charAt(0).toUpperCase() + hammaddeTuru.slice(1)} ${parcaNo}`;
                
                // Hata düzeltmesi: toString() kullanarak number'dan string'e çevir
                const kalanKilo = parseFloat(parca.kalan_kilo);
                if (!isNaN(kalanKilo)) {
                    // Kalan kilo bilgisini form içinde göster
                    const bilgiAlani = document.getElementById('islemModalBilgi') || document.createElement('div');
                    bilgiAlani.id = 'islemModalBilgi';
                    bilgiAlani.className = 'form-info';
                    bilgiAlani.innerHTML = `
                        <p><strong>Kalan Kilo:</strong> ${kalanKilo.toFixed(2)} kg</p>
                    `;
                    
                    // Bilgi alanını forma ekle
                    const form = document.getElementById('islemForm');
                    if (form && !document.getElementById('islemModalBilgi')) {
                        form.insertBefore(bilgiAlani, form.firstChild);
                    }
                } else {
                    console.warn('Kalan kilo değeri sayısal değil:', parca.kalan_kilo);
                }
            } else {
                document.getElementById('parcaHeader').textContent = `Parça ${parcaNo}`;
            }
        } else {
            document.getElementById('parcaHeader').textContent = `Parça ${parcaNo}`;
        }
    } catch (error) {
        console.error('Parça bilgisi getirme hatası:', error);
        document.getElementById('parcaHeader').textContent = `Parça ${parcaNo}`;
    }
    
    // Proje listesini yükle
    await loadProjeler();
    
    // Müşteri ve çalışan listelerini yükle - Bu kısmı ekledik
    try {
        await loadMusteriler();
        console.log('İşlem modalı için müşteriler yüklendi');
    } catch (error) {
        console.error('Müşteriler yüklenirken hata:', error);
    }
    
    try {
        await loadCalisanlar();
        console.log('İşlem modalı için çalışanlar yüklendi');
    } catch (error) {
        console.error('Çalışanlar yüklenirken hata:', error);
    }
    
    // İşlem modalını aç
    openModal('islemModal');
    
    // Detay modalını kapat
    closeModal('detayModal');
    
    // Müşteri/Yarı Mamul panellerini başlangıçta ayarla
    // Hemen çağırmak yerine setTimeout ile çağıralım (modal tam açıldıktan sonra)
    setTimeout(toggleYariMamulPanelIki, 10);
  }



// Sadeleştirilmiş loadIslemGecmisi fonksiyonu - tek plaka işlemleri kaldırıldı
async function loadIslemGecmisi(hammaddeId) {
  try {
    console.log("loadIslemGecmisi başlıyor - hammaddeId:", hammaddeId);
    
    // Sadece plaka grubu işlemlerini yükle
    const plakaGrubuIslemleri = await loadPlakaGrubuIslemleri(hammaddeId);
    console.log("Plaka grubu işlemleri yüklendi:", plakaGrubuIslemleri.length);
    
    // Parça işlemlerini yükle (plaka grubundan oluşan parçalar için)
    const parcaIslemleri = await loadParcaIslemleri(hammaddeId);
    console.log("Parça işlemleri yüklendi:", parcaIslemleri.length);
    
    // İşlemleri birleştir - artık sadece 2 kaynak
    const tumIslemler = [...plakaGrubuIslemleri, ...parcaIslemleri];
    console.log("Toplam işlem sayısı:", tumIslemler.length);
    
    // Tarihe göre sırala (en yeni en üstte)
    tumIslemler.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    
    // İşlemleri tabloya ekle
    const islemGecmisiTable = document.getElementById('islemGecmisiTable');
    const tableBody = islemGecmisiTable.getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';
    
    if (tumIslemler.length === 0) {
      const row = tableBody.insertRow();
      row.innerHTML = '<td colspan="11" class="text-center">İşlem geçmişi bulunamadı</td>';
      return;
    }
    
    tumIslemler.forEach(islem => {
      try {
        const row = tableBody.insertRow();
        
        // Tarih
        row.insertCell(0).textContent = new Date(islem.tarih).toLocaleString('tr-TR');
        
        // Plaka/Parça - Kaynak türünü belirt
        let kaynakText = '-';
        if (islem.plakaNo && islem.plakaNo.includes('Plaka Grubu')) {
          kaynakText = islem.plakaNo; // "Plaka Grubu #ABC123"
        } else if (islem.parcaNo) {
          kaynakText = islem.parcaNo; // "Parça #123"
        }
        row.insertCell(1).textContent = kaynakText;
        
        // İşlem
        row.insertCell(2).textContent = formatIslemTuru(islem.islem_turu);
        
        // Kullanılan
        row.insertCell(3).textContent = `${Number(islem.kullanilan_miktar).toFixed(2)} kg`;
        
        // Hurda
        row.insertCell(4).textContent = `${Number(islem.hurda_miktar || 0).toFixed(2)} kg`;
        
        // Kullanım Alanı
        row.insertCell(5).textContent = formatKullanimAlani(islem.kullanim_alani);
        
        // Proje
        row.insertCell(6).textContent = islem.proje_adi || '-';
        
        // Makine
        row.insertCell(7).textContent = islem.makine || '-';
        
        // İşleyen Kişi
        row.insertCell(8).textContent = islem.calisan_ad && islem.calisan_soyad ? 
          `${islem.calisan_ad} ${islem.calisan_soyad}` : '-';
        
        // Müşteri
        row.insertCell(9).textContent = islem.musteri_adi || '-';
        
        // Kullanıcı
        row.insertCell(10).textContent = islem.kullanici || '-';
      } catch (error) {
        console.error("Satır oluşturma hatası:", error, islem);
      }
    });
    
    console.log("İşlem geçmişi tablosu güncellendi.");
  } catch (error) {
    console.error('İşlem geçmişi yükleme hatası:', error);
    
    const islemGecmisiTable = document.getElementById('islemGecmisiTable');
    const tableBody = islemGecmisiTable.getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';
    
    const row = tableBody.insertRow();
    row.innerHTML = '<td colspan="11" class="text-center">İşlem geçmişi yüklenirken bir hata oluştu</td>';
  }
}

// Bu fonksiyon plaka grubu işlemlerini getirmek için kullanılacak (YENİ)
async function loadPlakaGrubuIslemleri(hammaddeId) {
  try {
    console.log("loadPlakaGrubuIslemleri başlıyor - hammaddeId:", hammaddeId);
    
    // Önce bu hammaddeye ait plaka gruplarını al
    const plakaGruplariResult = await window.electronAPI.invoke.database.getPlakaGruplariByHammaddeId(hammaddeId);
    
    if (!plakaGruplariResult.success || !plakaGruplariResult.gruplar || plakaGruplariResult.gruplar.length === 0) {
      console.log("Bu hammadde için plaka grubu bulunamadı");
      return [];
    }
    
    // Tüm plaka grubu ID'lerini bir dizide topla
    const plakaGrubuIds = plakaGruplariResult.gruplar.map(grup => grup.id);
    
    // Tek bir sorgu ile tüm grupların işlemlerini al
    const islemlerResult = await window.electronAPI.invoke.database.getIslemlerByMultiplePlakaGrubuIds(plakaGrubuIds);
    
    if (!islemlerResult.success || !islemlerResult.islemler) {
      console.log("Plaka gruplarına ait işlem bulunamadı");
      return [];
    }
    
    // İşlemleri plaka grubu bilgisiyle eşleştir
    const tumIslemler = islemlerResult.islemler.map(islem => {
      const grup = plakaGruplariResult.gruplar.find(g => g.id === islem.plaka_grubu_id);
      return {
        ...islem,
        plakaNo: grup ? `Plaka Grubu #${grup.stok_kodu}` : 'Bilinmiyor',
        tarih: islem.islem_tarihi,
        kullanici: islem.kullanici_ad ? `${islem.kullanici_ad} ${islem.kullanici_soyad}` : 'Bilinmiyor'
      };
    });
    
    console.log(`Toplam ${tumIslemler.length} plaka grubu işlemi bulundu`);
    return tumIslemler;
  } catch (error) {
    console.error('Plaka grubu işlemleri getirme hatası:', error);
    return [];
  }
}


window.loadPlakaGrubuIslemleri = loadPlakaGrubuIslemleri;

  window.checkHammaddeExists = async function(hammaddeData) {
    try {
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            return { success: false, message: 'API erişimi yok.' };
        }
        
        // Server tarafındaki kontrol fonksiyonunu çağır
        const result = await window.electronAPI.invoke.database.checkHammaddeExists(hammaddeData);
        
        return result;
    } catch (error) {
        console.error('Hammadde kontrol hatası:', error);
        return { success: false, message: 'Hammadde kontrolü sırasında bir hata oluştu.' };
    }
  };

window.setupSaveButtonHandlers = setupSaveButtonHandlers;
window.resetAllForms = resetAllForms;
window.showMaterialForm = showMaterialForm;
window.saveSacHammadde = saveSacHammadde;
window.saveBoruHammadde = saveBoruHammadde;
window.saveMilHammadde = saveMilHammadde;
window.loadHammaddeListesi = loadHammaddeListesi;
window.searchHammadde = searchHammadde;
window.setupHammaddeGirisButtons = setupHammaddeGirisButtons;
window.calculateBoruWeight=calculateBoruWeight;
window.calculateMilWeight = calculateMilWeight;
window.kaydetHammaddeGirisi = kaydetHammaddeGirisi;
window.deleteHammadde = deleteHammadde;
window.saveIslem = saveIslem;
window.loadIslemGecmisi = loadIslemGecmisi;
window.deleteHammaddeIslem = deleteHammaddeIslem;
window.openHammaddeGirisModal = openHammaddeGirisModal;
window.openIslemModal = openIslemModal;
window.viewHammaddeDetail = viewHammaddeDetail ;
window.loadHammaddeGirisGecmisi = loadHammaddeGirisGecmisi;
  window.updateHammaddeDetailUI = updateHammaddeDetailUI;