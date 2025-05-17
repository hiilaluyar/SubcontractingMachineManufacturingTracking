async function savePlakaIslem() {
    try {
        // Form değerlerini al
        const kullanilanMiktar = parseFloat(document.getElementById('plakaKullanilanMiktar').value);
        const hurdaMiktar = parseFloat(document.getElementById('plakaHurdaMiktar').value) || 0;
        const islemTuru = document.getElementById('plakaIslemTuru').value;
        const kullanimAlani = document.getElementById('plakaKullanimAlani').value;
        const projeId = document.getElementById('plakaProjeSecimi').value;
        const musteriId = document.getElementById('plakaMusteriSecimi')?.value;
        const makine = document.getElementById('plakaMakineSecimi').value;
        const calisanId = document.getElementById('plakaCalisanSecimi').value;
        
        // Validasyon
        if (!kullanilanMiktar || kullanilanMiktar <= 0) {
            showModalError('plakaIslemModal', 'Lütfen geçerli bir kullanılan miktar girin.');
            return;
        }
        
        if (!projeId) {
            showModalError('plakaIslemModal', 'Lütfen bir proje seçin veya yeni bir proje oluşturun.');
            return;
        }
        
        // Fason imalat ise müşteri zorunlu
        if (kullanimAlani === 'FasonImalat' && !musteriId) {
            showModalError('plakaIslemModal', 'Fason imalat için müşteri seçimi zorunludur.');
            return;
        }
        
        // Makine seçimi zorunlu
        if (!makine) {
            showModalError('plakaIslemModal', 'Lütfen bir makine seçin.');
            return;
        }
        
        // Çalışan seçimi zorunlu
        if (!calisanId) {
            showModalError('plakaIslemModal', 'Lütfen işlemi yapan çalışanı seçin.');
            return;
        }
        
        // Önce değerleri yuvarla (hassasiyet için)
        const plakaKalanKilo = Math.round(parseFloat(currentPlaka.kalan_kilo) * 100) / 100;
        const yuvarlananKullanilanMiktar = Math.round(kullanilanMiktar * 100) / 100;
        const yuvarlananHurdaMiktar = Math.round(hurdaMiktar * 100) / 100;
        
        // Toplam kalan parça ağırlığını hesapla
        const toplamParcaAgirligi = kalanParcalar.reduce((toplam, parca) => {
            return toplam + Math.round(parseFloat(parca.agirlik) * 100) / 100;
        }, 0);
        
        const toplamKullanilacak = yuvarlananKullanilanMiktar + yuvarlananHurdaMiktar + toplamParcaAgirligi;
        
        // Hassasiyet toleransı
        const HASSASIYET_TOLERANSI = 0.01;
        
        if (toplamKullanilacak > (plakaKalanKilo + HASSASIYET_TOLERANSI)) {
            showModalError('plakaIslemModal', 
                `Kullanmak istediğiniz toplam miktar (${toplamKullanilacak.toFixed(2)} kg) plakada kalan miktardan (${plakaKalanKilo.toFixed(2)} kg) fazla.`);
            return;
        }
        
        // ÖNEMLİ: Makine İmalat ise ve Yarı Mamul var ise
        let yariMamulDataList = [];
        if (kullanimAlani === 'MakineImalat') {
            // Tüm yarı mamul öğelerini toplayalım
            const yarimamulItems = document.querySelectorAll('#plakaYariMamulList .yarimamul-item');
            if (yarimamulItems.length === 0) {
                showModalError('plakaIslemModal', 'Makine imalat için en az bir yarı mamul girmelisiniz.');
                return;
            }
            
            // Her bir yarı mamul için veri oluştur
            for (const item of yarimamulItems) {
                const index = item.dataset.index;
                const adi = document.getElementById(`plakaYariMamulAdi_${index}`).value?.trim();
                const birim = document.getElementById(`plakaYariMamulBirim_${index}`).value;
                const miktar = parseFloat(document.getElementById(`plakaYariMamulMiktar_${index}`).value) || 0;
                const birimAgirlik = parseFloat(document.getElementById(`plakaYariMamulAgirlik_${index}`).value) || 0;
                
                // Boş alan kontrolü
                if (!adi) {
                    showModalError('plakaIslemModal', `${index+1}. yarı mamulün adını girmelisiniz.`);
                    return;
                }
                
                if (miktar <= 0) {
                    showModalError('plakaIslemModal', `${index+1}. yarı mamulün miktarı 0'dan büyük olmalıdır.`);
                    return;
                }
                
                if (birimAgirlik <= 0) {
                    showModalError('plakaIslemModal', `${index+1}. yarı mamulün birim ağırlığı 0'dan büyük olmalıdır.`);
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
        
        // Kalan parça bilgileri - artık birden fazla olabilir
        let kalanParcaDataList = [];
        if (document.getElementById('kalanParcaSwitch').checked && kalanParcalar.length > 0) {
            // Her bir kalan parça için veri oluştur
            kalanParcaDataList = kalanParcalar.map(parca => ({
                en: parca.en,
                boy: parca.boy,
                kalinlik: parca.kalinlik,
                hesaplanan_agirlik: parca.agirlik,
                plaka_id: currentPlaka.id
            }));
        }
        
        // İşlem verisi
        const islemData = {
            plaka_id: currentPlaka.id,
            islem_turu: islemTuru,
            kullanim_alani: kullanimAlani,
            kullanilanMiktar: kullanilanMiktar,
            hurdaMiktar: hurdaMiktar,
            proje_id: projeId,
            musteri_id: musteriId || null,
            kullanici_id: currentUser.id,
            kalan_parcalar: kalanParcaDataList,
            yari_mamuller: yariMamulDataList, // ÖNEMLİ: Artık bir liste
            makine: makine,
            calisan_id: parseInt(calisanId)
        };
        
        // İşlem kaydediliyor mesajını göster
        showModalSuccess('plakaIslemModal', 'İşlem kaydediliyor...');
        
        // İşlemi kaydet
        const result = await window.electronAPI.invoke.database.addPlakaIslem(islemData);
        
        if (result.success) {
            let successMessage = 'Plaka işlemi başarıyla kaydedildi.';
            
            // Yarı mamul oluşturulmuşsa ek bilgi göster
            if (kullanimAlani === 'MakineImalat' && yariMamulDataList.length > 0) {
                const toplamYariMamul = yariMamulDataList.reduce((toplam, ym) => toplam + ym.miktar, 0);
                const birimText = yariMamulDataList.length > 0 ? yariMamulDataList[0].birim : 'adet';
                successMessage += ` Toplam ${toplamYariMamul} ${birimText} yarı mamul oluşturuldu.`;
            }
            
            showToast(successMessage, 'success');
            
            // Modalı kapat
            closeModal('plakaIslemModal');
            
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
            showModalError('plakaIslemModal', 'Hata: ' + result.message);
        }
    } catch (error) {
        console.error('Plaka işlemi kaydetme hatası:', error);
        showModalError('plakaIslemModal', 'İşlem kaydedilirken bir hata oluştu: ' + error.message);
    }
}

// İşlem formları için submit handler'lar
function setupIslemFormHandlers() {
    // Plaka işlem modalı için
    const plakaIslemKaydetBtn = document.getElementById('plakaIslemKaydetBtn');
    if (plakaIslemKaydetBtn) {
        plakaIslemKaydetBtn.addEventListener('click', savePlakaIslem);
    }
    
    // Parça işlem modalı için
    const parcaIslemKaydetBtn = document.getElementById('parcaIslemKaydetBtn');
    if (parcaIslemKaydetBtn) {
        parcaIslemKaydetBtn.addEventListener('click', saveParcaIslem);
    }
}



function generatePlakaList(count, weight) {
    const plakaListesi = document.getElementById('plakaListesi');
    const plakalarContainer = document.getElementById('plakalarContainer');
    
    if (!plakaListesi || !plakalarContainer) return;
    
    // Listeyi temizle
    plakaListesi.innerHTML = '';
    
    // Plakalar için container'ı göster
    plakalarContainer.style.display = 'block';
    
    // Her plaka için kart oluştur - Hepsine tam olarak aynı ağırlık ver
    for (let i = 1; i <= count; i++) {
        const plakaCard = document.createElement('div');
        plakaCard.className = 'parca-card';
        plakaCard.innerHTML = `
            <h4>Plaka ${i}</h4>
            <div class="parca-detail">
                <span>Durum:</span>
                <span>TAM</span>
            </div>
            <div class="parca-detail">
                <span>Ağırlık:</span>
                <span>${weight.toFixed(2)} kg</span>
            </div>
        `;
        plakaListesi.appendChild(plakaCard);
    }
}



function calculatePlakaWithTolerance() {
    try {
        // Form değerlerini al
        const en = parseFloat(document.getElementById('plakaEn').value);
        const boy = parseFloat(document.getElementById('plakaBoy').value);
        const totalKilo = parseFloat(document.getElementById('plakaTotalKilo').value);
        const tolerancePercentage = 1; // Sabit %1 tolerans
        
        // Kalinlik ve yogunluk değerlerini kontrol et
        if (!currentHammadde || !currentHammadde.kalinlik || !currentHammadde.yogunluk) {
            document.getElementById('plakaHesapSonucu').innerHTML = 
                '<div class="error">Hammadde bilgileri bulunamadı. Lütfen hammadde seçtiğinizden emin olun.</div>';
            document.getElementById('plakaHesapSonucu').style.display = 'block';
            return;
        }
        
        const kalinlik = parseFloat(currentHammadde.kalinlik);
        const yogunluk = parseFloat(currentHammadde.yogunluk);
        
        // Temel validasyon
        if (!en || !boy || !totalKilo || isNaN(en) || isNaN(boy) || isNaN(totalKilo)) {
            document.getElementById('plakaHesapSonucu').innerHTML = 
                '<div class="error">Lütfen geçerli en, boy ve toplam kilo değerleri girin.</div>';
            document.getElementById('plakaHesapSonucu').style.display = 'block';
            return;
        }
        
        // Tek plaka ağırlığı hesapla (kg) - Teorik olarak
        const hacim = (en / 1000) * (boy / 1000) * (kalinlik / 1000); // m³
        const teorikPlakaAgirligi = hacim * yogunluk;
        
        console.log("Hacim (m³):", hacim);
        console.log("Yoğunluk:", yogunluk);
        console.log("Teorik Plaka Ağırlığı (kg):", teorikPlakaAgirligi);
        
        if (teorikPlakaAgirligi <= 0) {
            document.getElementById('plakaHesapSonucu').innerHTML = 
                '<div class="error">Hesaplanan plaka ağırlığı geçersiz. Lütfen değerleri kontrol edin.</div>';
            document.getElementById('plakaHesapSonucu').style.display = 'block';
            return;
        }
        
        // İdeal plaka sayısı hesapla (tam olmayan sayı olabilir)
        const idealPlakaSayisi = totalKilo / teorikPlakaAgirligi;
        
        console.log("İdeal Plaka Sayısı:", idealPlakaSayisi);
        
        // En yakın tam plaka sayıları
        const altPlakaSayisi = Math.floor(idealPlakaSayisi);
        const ustPlakaSayisi = Math.ceil(idealPlakaSayisi);
        
        console.log("Alt Plaka Sayısı:", altPlakaSayisi);
        console.log("Üst Plaka Sayısı:", ustPlakaSayisi);
        
        // Alt ve üst toplam ağırlıklar - Teorik olarak
        const altToplamAgirlik = altPlakaSayisi * teorikPlakaAgirligi;
        const ustToplamAgirlik = ustPlakaSayisi * teorikPlakaAgirligi;
        
        // Tolerans miktarları
        const altToleransMiktari = altToplamAgirlik * (tolerancePercentage / 100);
        const ustToleransMiktari = ustToplamAgirlik * (tolerancePercentage / 100);
        
        // Tolerans aralıkları
        const altMinAgirlik = altToplamAgirlik - altToleransMiktari;
        const altMaxAgirlik = altToplamAgirlik + altToleransMiktari;
        
        const ustMinAgirlik = ustToplamAgirlik - ustToleransMiktari;
        const ustMaxAgirlik = ustToplamAgirlik + ustToleransMiktari;
        
        // Plaka sayısı ve tolerans durumu
        let plakaSayisi;
        let toleransUyarisi = '';
        let toleransliMi = false;
        
        // 1) Miktar alt plaka sayısının tolerans aralığında mı?
        if (totalKilo >= altMinAgirlik && totalKilo <= altMaxAgirlik) {
            plakaSayisi = altPlakaSayisi;
            toleransUyarisi = `<div class="success-text">Girilen miktar ${plakaSayisi} plaka için tolerans (±%${tolerancePercentage}) içindedir.</div>`;
            toleransliMi = true;
        }
        // 2) Miktar üst plaka sayısının tolerans aralığında mı?
        else if (totalKilo >= ustMinAgirlik && totalKilo <= ustMaxAgirlik) {
            plakaSayisi = ustPlakaSayisi;
            toleransUyarisi = `<div class="success-text">Girilen miktar ${plakaSayisi} plaka için tolerans (±%${tolerancePercentage}) içindedir.</div>`;
            toleransliMi = true;
        }
        // 3) Tolerans dışında
        else {
            // Girilen miktar hangi plaka sayısına daha yakın?
            const altFark = Math.abs(totalKilo - altToplamAgirlik);
            const ustFark = Math.abs(totalKilo - ustToplamAgirlik);
            
            if (altFark <= ustFark) {
                plakaSayisi = altPlakaSayisi;
            } else {
                plakaSayisi = ustPlakaSayisi;
            }
            
            toleransUyarisi = `
                <div class="error-text">
                    Girilen miktar (${totalKilo.toFixed(2)} kg) ${plakaSayisi} plaka için tolerans (±%${tolerancePercentage}) dışındadır.
                    <br>Lütfen şu değerlerden birini girin:
                    <br>- ${altPlakaSayisi} plaka için: ${altMinAgirlik.toFixed(2)} kg - ${altMaxAgirlik.toFixed(2)} kg
                    <br>- ${ustPlakaSayisi} plaka için: ${ustMinAgirlik.toFixed(2)} kg - ${ustMaxAgirlik.toFixed(2)} kg
                </div>
            `;
            toleransliMi = false;
        }
        
        // DÜZELTME: Plaka başına ağırlığı tam olarak hesaplayalım
        // Tüm plakalar için eşit ağırlık olacak şekilde dağıtıyoruz
        const gercekPlakaAgirligi = totalKilo / plakaSayisi;
        
        console.log("Plaka Sayısı:", plakaSayisi);
        console.log("Gerçek Plaka Ağırlığı (kg):", gercekPlakaAgirligi);
        
        // Sonuçları göster
        document.getElementById('plakaHesapSonucu').innerHTML = `
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
                    <span>Toplam Kilo:</span>
                    <span>${totalKilo.toFixed(2)} kg</span>
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
                    <span>Toplam plaka sayısı:</span>
                    <span>${plakaSayisi}</span>
                </div>
                ${toleransUyarisi}
            </div>
        `;
        document.getElementById('plakaHesapSonucu').style.display = 'block';
        
        // Plaka listesi container'ını gizle - oluşturulacak plakalar kısmını artık gösterme
        const plakalarContainer = document.getElementById('plakalarContainer');
        if (plakalarContainer) {
            plakalarContainer.style.display = 'none';
        }
        
        // Kaydet butonu durumunu güncelle
        document.getElementById('plakaKaydetBtn').disabled = !toleransliMi;
        
        // Hesaplama sonucunu global değişkende sakla
        window.plakaHesaplamaDetaylari = {
            en: en,
            boy: boy,
            kalinlik: kalinlik,
            plakaSayisi: plakaSayisi,
            plakaAgirligi: gercekPlakaAgirligi,
            toleransliMi: toleransliMi,
            toplamKilo: totalKilo, // Orijinal girdiyi sakla
            barkod: document.getElementById('plakaBarkod').value.trim()
        };
        
        return {
            plakaSayisi,
            plakaAgirligi: gercekPlakaAgirligi,
            toleransliMi
        };
    } catch (error) {
        console.error('Plaka hesaplama hatası:', error);
        document.getElementById('plakaHesapSonucu').innerHTML = `
            <div class="error">Hesaplama sırasında bir hata oluştu: ${error.message}</div>
        `;
        document.getElementById('plakaHesapSonucu').style.display = 'block';
        document.getElementById('plakaKaydetBtn').disabled = true;
        return null;
    }
  }
  

  
async function savePlakaMultiple() {
    try {
        // Mevcut form verilerini temizleyelim - eski değerler kalırsa ekstra plakalar oluşabilir
        window.isProcessingPlakaSubmit = true; // İşlem yapılıyor bayrağı

        // Hesaplama detayları
        if (!window.plakaHesaplamaDetaylari || !window.plakaHesaplamaDetaylari.toleransliMi) {
            showModalError('yeniPlakaModal', 'Lütfen önce hesaplama yapın ve geçerli tolerans değerlerine ulaşın.');
            window.isProcessingPlakaSubmit = false;
            return;
        }
        
        // Form değerlerini al
        const en = parseFloat(document.getElementById('plakaEn').value);
        const boy = parseFloat(document.getElementById('plakaBoy').value);
        // Barkod artık sadece bir kez, ana_barkod olarak hammadde_giris_gecmisi tablosuna kaydedilecek
        const barkod = document.getElementById('plakaBarkod').value.trim();
        const tedarikci = document.getElementById('plakaTedarikci').value.trim();
        const birimFiyat = parseFloat(document.getElementById('plakaBirimFiyat').value);
        const birimFiyatTuru = document.getElementById('plakaBirimFiyatTuru').value;
        
        // Validasyon
        if (!tedarikci) {
            showModalError('yeniPlakaModal', 'Lütfen tedarikçi bilgisini girin.');
            window.isProcessingPlakaSubmit = false;
            return;
        }
        
        if (!birimFiyat || birimFiyat <= 0) {
            showModalError('yeniPlakaModal', 'Lütfen geçerli bir birim fiyat girin.');
            window.isProcessingPlakaSubmit = false;
            return;
        }
        
        // İşlem başlıyor mesajı
        showModalSuccess('yeniPlakaModal', 'Plakalar oluşturuluyor. Lütfen bekleyin...');
        
        // Plaka sayısı ve ağırlık bilgileri
        const plakaSayisi = window.plakaHesaplamaDetaylari.plakaSayisi;
        const plakaAgirligi = window.plakaHesaplamaDetaylari.plakaAgirligi;
        const toplamKilo = window.plakaHesaplamaDetaylari.toplamKilo; // Orijinal girilen değer
        
        console.log("Kaydedilecek Plaka Sayısı:", plakaSayisi);
        console.log("Her Plaka Ağırlığı:", plakaAgirligi);
        console.log("Toplam Ağırlık:", toplamKilo);
        
        // ÖNEMLİ: Önce tek bir toplu hammadde girişi kaydı oluştur
        // Barkod girildiyse bunu ana_barkod olarak kullan, girilmediyse otomatik oluştur
        const anaBarkod = barkod || `TOPLU-${new Date().getTime()}`;
        
        const topluGirisData = {
            hammadde_id: currentHammaddeId,
            miktar: toplamKilo, // Toplam ağırlığı kullan
            birim_fiyat: birimFiyat,
            birim_fiyat_turu: birimFiyatTuru,
            tedarikci: tedarikci,
            ekleyen_id: currentUser.id,
            ana_barkod: anaBarkod,  // Ana barkod buraya kaydedilecek
            plaka_sayisi: plakaSayisi
        };
        
        console.log("Toplu Giriş Verileri:", topluGirisData);
        
        // Toplu girişi kaydet
        const topluGirisResult = await window.electronAPI.invoke.database.addTopluHammaddeGiris(topluGirisData);
        
        if (!topluGirisResult.success) {
            console.error("Toplu hammadde girişi hatası:", topluGirisResult.message);
            showModalError('yeniPlakaModal', 'Toplu hammadde girişi oluşturulurken bir hata oluştu.');
            window.isProcessingPlakaSubmit = false;
            return;
        }
        
        console.log("Toplu hammadde girişi başarılı");
        
        // Başarı sayacı
        let successCount = 0;
        
        // YALNIZCA plakaSayisi kadar döngü yap (ekstra plaka oluşturmaması için)
        for (let i = 0; i < plakaSayisi; i++) {
            // Plaka verisini oluştur
            // Artık plakalar tablosunda barkod sütunu yok, o yüzden barkod parametresi göndermeye gerek yok
            const plakaData = {
                hammadde_id: currentHammaddeId,
                en: en,
                boy: boy,
                kalinlik: currentHammadde.kalinlik,
                tedarikci: tedarikci,
                birim_fiyat: birimFiyat,
                birim_fiyat_turu: birimFiyatTuru,
                hesaplanan_agirlik: plakaAgirligi, // Her plakaya aynı ağırlık
                ekleyen_id: currentUser.id,
                skipHammaddeGirisEntry: true // ÖNEMLİ: Hammadde giriş kaydını tüm plakalar için atla
            };
            
            console.log(`Plaka ${i+1} veri:`, plakaData);
            
            // Plakayı kaydet
            const result = await window.electronAPI.invoke.database.addPlaka(plakaData);
            
            if (result.success) {
                successCount++;
            } else {
                console.error(`${i+1}. plaka kaydedilirken hata:`, result.message);
            }
        }
        
        // Başarı mesajı
        if (successCount > 0) {
            showToast(`${successCount} adet plaka başarıyla eklendi.`, 'success');
            
            // Formu sıfırla ve modalı kapat - ÖNEMLİ: Form verilerini temizle
            resetPlakaModal();
            closeModal('yeniPlakaModal');
            
            // Dashboard'ı güncelle
          updateDashboard();
            
            // Hammadde listesini güncelle
            await loadHammaddeListesi();
            
            // Hammadde detayını yeniden yükle
            if (currentHammaddeId) {
                await viewHammaddeDetail(currentHammaddeId);
            }
        } else {
            showModalError('yeniPlakaModal', 'Plakalar eklenirken bir hata oluştu.');
        }
        
        window.isProcessingPlakaSubmit = false;
    } catch (error) {
        console.error('Plaka ekleme hatası:', error);
        showModalError('yeniPlakaModal', 'Plaka eklenirken bir hata oluştu: ' + error.message);
        window.isProcessingPlakaSubmit = false;
    }
}



// Modal açıldığında ve kapandığında bilgileri sıfırla
function resetPlakaModal() {
    // Form alanlarını temizle
    document.getElementById('plakaEn').value = '';
    document.getElementById('plakaBoy').value = '';
    document.getElementById('plakaTotalKilo').value = '';
    document.getElementById('plakaBarkod').value = '';
    document.getElementById('plakaTedarikci').value = '';
    document.getElementById('plakaBirimFiyat').value = '';
    
    // Hesaplama sonucunu gizle
    document.getElementById('plakaHesapSonucu').style.display = 'none';
    
    // Plaka listesini gizle
    document.getElementById('plakalarContainer').style.display = 'none';
    
    // Kaydet butonunu devre dışı bırak
    document.getElementById('plakaKaydetBtn').disabled = true;
    
    // Global hesaplama detaylarını temizle
    delete window.plakaHesaplamaDetaylari;
}



function setupPlakaEventListeners() {
    // Yeni Plaka Ekle butonu
    const yeniPlakaEkleBtn = document.getElementById('yeniPlakaEkleBtn');
    if (yeniPlakaEkleBtn) {
        yeniPlakaEkleBtn.addEventListener('click', openYeniPlakaModal);
    }
    
    // Plaka Hesaplama butonu
    const hesaplaPlakaBtn = document.getElementById('hesaplaPlakaBtn');
    if (hesaplaPlakaBtn) {
        hesaplaPlakaBtn.addEventListener('click', calculatePlakaWithTolerance);
    }
    
    // Plaka Kaydet butonu
    const plakaKaydetBtn = document.getElementById('plakaKaydetBtn');
    if (plakaKaydetBtn) {
        plakaKaydetBtn.addEventListener('click', savePlakaMultiple);
    }
    
    // Tedarikçi Ekle butonu
    const plakaYeniTedarikciEkleBtn = document.getElementById('plakaYeniTedarikciEkleBtn');
    if (plakaYeniTedarikciEkleBtn) {
        plakaYeniTedarikciEkleBtn.addEventListener('click', function() {
            openNewTedarikciModal('yeniPlakaModal');
        });
    }
}



// Hammadde detay modalı açıldığında tab sistemini ve event listener'ları kur
function setupHammaddeDetailModal() {
    document.getElementById('detayModal').addEventListener('show', function() {
        // Tab sistemini kur
        setupTabSystem();
        
        // Plaka event listener'larını kur
        setupPlakaEventListeners();
    });
}



function setupPlakaKaydetEventListener() {
    const plakaKaydetBtn = document.getElementById('plakaKaydetBtn');
    if (plakaKaydetBtn) {
        // Mevcut tüm event listener'ları kaldır
        const newButton = plakaKaydetBtn.cloneNode(true);
        plakaKaydetBtn.parentNode.replaceChild(newButton, plakaKaydetBtn);
        
        // Yeni event listener ekle
        newButton.addEventListener('click', function(event) {
            // Çift tıklama ve çift işlem oluşturma engellemesi
            if (window.isProcessingPlakaSubmit) {
                console.log("İşlem zaten devam ediyor, tekrar butona basılmasını engelliyorum.");
                return;
            }
            
            savePlakaMultiple();
        });
    }
}


function setupModalEventListeners() {
    console.log('Modal Event Listener\'lar ayarlanıyor...');
    
    // Plaka İşlem Modalı için
    const plakaKullanimAlaniSelect = document.getElementById('plakaKullanimAlani');
    if (plakaKullanimAlaniSelect) {
        console.log('Plaka Kullanım Alanı select elementi bulundu, event listener ekleniyor');
        
        // Mevcut onchange attribute'ını kaldır ve addEventListener ile ekle
        plakaKullanimAlaniSelect.removeAttribute('onchange');
        plakaKullanimAlaniSelect.addEventListener('change', function() {
            console.log('Plaka Kullanım Alanı değişti');
            toggleYariMamulPanel('plaka');
        });
        
        // Sayfa yüklendiğinde başlangıç durumunu ayarla
        toggleYariMamulPanel('plaka');
    }
    
    // Parça İşlem Modalı için
    const parcaKullanimAlaniSelect = document.getElementById('parcaKullanimAlani');
    if (parcaKullanimAlaniSelect) {
        console.log('Parça Kullanım Alanı select elementi bulundu, event listener ekleniyor');
        
        // Mevcut onchange attribute'ını kaldır ve addEventListener ile ekle
        parcaKullanimAlaniSelect.removeAttribute('onchange');
        parcaKullanimAlaniSelect.addEventListener('change', function() {
            console.log('Parça Kullanım Alanı değişti');
            toggleYariMamulPanel('parca');
        });
        
        // Sayfa yüklendiğinde başlangıç durumunu ayarla
        toggleYariMamulPanel('parca');
    }
}


// Modal açıldığında setup fonksiyonunu çağır
function setupModalOpeners() {
    // Plaka İşlem Modalı açıldığında event listener'ları ayarla
    const plakaIslemModal = document.getElementById('plakaIslemModal');
    if (plakaIslemModal) {
        const originalOpenPlakaIslemModal = window.openPlakaIslemModal;
        window.openPlakaIslemModal = function(plakaId) {
            originalOpenPlakaIslemModal(plakaId);
            
            // Modal açıldıktan sonra event listener'ları ayarla
            setTimeout(setupModalEventListeners, 100);
        };
    }
    
    // Parça İşlem Modalı açıldığında event listener'ları ayarla
    const parcaIslemModal = document.getElementById('parcaIslemModal');
    if (parcaIslemModal) {
        const originalOpenParcaIslemModal = window.openParcaIslemModal;
        window.openParcaIslemModal = function(parcaId, parcaNo) {
            originalOpenParcaIslemModal(parcaId, parcaNo);
            
            // Modal açıldıktan sonra event listener'ları ayarla
            setTimeout(setupModalEventListeners, 100);
        };
    }
}

// Sayfa yüklendiğinde modal açıcıları ayarla
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM yüklendi, modal açıcılar ayarlanıyor...');
    setupModalOpeners();
    
    // Ayrıca direkt olarak modalar varsa event listener'ları da ayarla
    setupModalEventListeners();
    
    // Plaka ve parça kullanimAlani select elementleri için manuel event listener'lar ekle
    ['plaka', 'parca'].forEach(prefix => {
        const select = document.getElementById(`${prefix}KullanimAlani`);
        if (select) {
            select.addEventListener('change', function() {
                console.log(`${prefix}KullanimAlani değişti, toggleYariMamulPanel('${prefix}') çağrılıyor`);
                toggleYariMamulPanel(prefix);
            });
        }
    });
});




  // Plaka İşlem modalı için özel düzeltme
  function fixPlakaIslemModal() {
    const plakaIslemModal = document.getElementById('plakaIslemModal');
    if (!plakaIslemModal) return;
    
    // Modal açıldığında stil ayarla
    plakaIslemModal.addEventListener('show', function() {
      setTimeout(() => {
        const projeSelect = document.getElementById('plakaProjeSecimi');
        if (projeSelect) {
          // Stil ayarları
          projeSelect.style.color = '#333';
          
          // Seçeneklere stil ekle
          Array.from(projeSelect.options).forEach(option => {
            option.style.color = '#333';
            option.style.backgroundColor = '#fff';
          });
        }
        
        // Projeleri yükle
        loadProjeler();
      }, 100);
    });
  }
  
  // Parça İşlem modalı için özel düzeltme
  function fixParcaIslemModal() {
    const parcaIslemModal = document.getElementById('parcaIslemModal');
    if (!parcaIslemModal) return;
    
    // Modal açıldığında stil ayarla
    parcaIslemModal.addEventListener('show', function() {
      setTimeout(() => {
        const projeSelect = document.getElementById('parcaProjeSecimi');
        if (projeSelect) {
          // Stil ayarları
          projeSelect.style.color = '#333';
          
          // Seçeneklere stil ekle
          Array.from(projeSelect.options).forEach(option => {
            option.style.color = '#333';
            option.style.backgroundColor = '#fff';
          });
        }
        
        // Projeleri yükle
        loadProjeler();
      }, 100);
    });
  }
  
  // Sayfa yüklendiğinde modal düzeltmelerini uygula
  document.addEventListener('DOMContentLoaded', function() {
    fixPlakaIslemModal();
    fixParcaIslemModal();
  });


// Plaka modalı açıldığında gerekli bilgileri doldur
function openYeniPlakaModal() {
    if (!currentHammaddeId || !currentHammadde) {
        showToast('Lütfen önce bir hammadde seçin.', 'error');
        return;
    }
    
    // Modal içeriğini sıfırla
    resetPlakaModal();
    
    // İşlem yapılıyor bayrağını sıfırla
    window.isProcessingPlakaSubmit = false;
    
    // Modalı aç
    openModal('yeniPlakaModal');
    
    // Detay modalını kapat
    closeModal('detayModal');
  }
  
async function loadPlakaIslemleri(hammaddeId) {
  try {
    console.log("loadPlakaIslemleri başlıyor - hammaddeId:", hammaddeId);
    
    // Önce plakaları al
    const plakaResult = await window.electronAPI.invoke.database.getPlakaListByHammaddeId(hammaddeId);
    
    if (!plakaResult.success || !plakaResult.plakalar || plakaResult.plakalar.length === 0) {
      console.log("Bu hammadde için plaka bulunamadı");
      return [];
    }
    
    // Tüm plaka ID'lerini bir dizide topla
    const plakaIds = plakaResult.plakalar.map(plaka => plaka.id);
    
    // Tek bir sorgu ile tüm plakaların işlemlerini al
    const islemlerResult = await window.electronAPI.invoke.database.getIslemlerByMultiplePlakaIds(plakaIds);
    
    if (!islemlerResult.success || !islemlerResult.islemler) {
      console.log("Plakalara ait işlem bulunamadı");
      return [];
    }
    
    // İşlemleri plaka bilgisiyle eşleştir
    const tumIslemler = islemlerResult.islemler.map(islem => {
      const plaka = plakaResult.plakalar.find(p => p.id === islem.plaka_id);
      return {
        ...islem,
        plakaNo: plaka ? `Plaka #${plaka.stok_kodu}` : 'Bilinmiyor',
        tarih: islem.islem_tarihi,
        kullanici: islem.kullanici_ad ? `${islem.kullanici_ad} ${islem.kullanici_soyad}` : 'Bilinmiyor'
      };
    });
    
    console.log(`Toplam ${tumIslemler.length} plaka işlemi bulundu`);
    return tumIslemler;
  } catch (error) {
    console.error('Plaka işlemleri getirme hatası:', error);
    return [];
  }
}

  
async function loadPlakaParcalar(plakaId) {
    try {
        // Plaka bilgilerini al
        const plakaResult = await window.electronAPI.invoke.database.getPlakaById(plakaId);
        
        if (!plakaResult.success) {
            showToast('Plaka bilgileri alınamadı: ' + plakaResult.message, 'error');
            return;
        }
        
        // Parçaları al
        const parcalarResult = await window.electronAPI.invoke.database.getPlakaParcalariByPlakaId(plakaId);
        
        const parcalarTable = document.getElementById('parcalarTable');
        const tableBody = parcalarTable.getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
        
        if (!parcalarResult.success || !parcalarResult.parcalar || parcalarResult.parcalar.length === 0) {
            const row = tableBody.insertRow();
            row.innerHTML = '<td colspan="9" class="text-center">Bu plakada parça bulunamadı</td>';
            
            // Detay modalını aç/güncelle
            openModal('detayModal');
            
            // Parçalar tabına geç
            const parcalarTab = document.querySelector('.tab-button[data-tab="parcalar-tab"]');
            if (parcalarTab) parcalarTab.click();
            
            return;
        }
        
        // Hata ayıklama için
        console.log("Plaka parçaları:", parcalarResult.parcalar);
        
        // Parçaları listele
        parcalarResult.parcalar.forEach(parca => {
            const row = tableBody.insertRow();
            
            // Parça No
            row.insertCell(0).textContent = `#${parca.parca_no}`;
            
            // Barkod Kodu
            row.insertCell(1).textContent = parca.barkod_kodu || 'Belirtilmemiş';
            
            // Plaka No
            row.insertCell(2).textContent = `#${plakaResult.plaka.stok_kodu}`;
            
            // En x Boy - DÜZELTİLMİŞ KISIM
            const enBoyCell = row.insertCell(3);
            console.log(`Parça #${parca.parca_no} - En: ${parca.en}, Boy: ${parca.boy}`);
            
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
            
            // Kullanım Oranı
            row.insertCell(7).textContent = `%${Number(parca.kullanim_orani).toFixed(2)}`;
            
            // İşlemler
            const islemlerCell = row.insertCell(8);
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
        console.error('Plaka parçaları yükleme hatası:', error);
        showToast('Plaka parçaları yüklenirken bir hata oluştu.', 'error');
    }
}

  async function loadPlakaList(hammaddeId) {
    try {
      const result = await window.electronAPI.invoke.database.getPlakaListByHammaddeId(hammaddeId);
      
      const plakalarTable = document.getElementById('plakalarTable');
      const tableBody = plakalarTable.getElementsByTagName('tbody')[0];
      tableBody.innerHTML = '';
      
      // Toplu işlem butonlarını içerecek div - başlangıçta gizlenir
      let bulkActionsDiv = document.getElementById('plaka-bulk-actions');
      if (!bulkActionsDiv) {
          bulkActionsDiv = document.createElement('div');
          bulkActionsDiv.id = 'plaka-bulk-actions';
          bulkActionsDiv.className = 'bulk-actions';
          bulkActionsDiv.innerHTML = `
              <button id="bulk-process-plaka" class="btn-primary">
                  <i class="fas fa-cut"></i> Seçili Plakalara İşlem Yap (<span id="plaka-selected-count">0</span>)
              </button>
          `;
          // Tablodan sonra ekle
          plakalarTable.parentNode.insertBefore(bulkActionsDiv, plakalarTable.nextSibling);
          
          // Butona tıklama olayı ekle
          document.getElementById('bulk-process-plaka').addEventListener('click', processBulkPlakas);
      }
      
      // Görünürlüğü sıfırla
      bulkActionsDiv.style.display = 'none';
      
      // Seçili plakaları sıfırla
      selectedPlakas = [];
      updateSelectedPlakasCount();
      
      if (!result.success || !result.plakalar || result.plakalar.length === 0) {
          const row = tableBody.insertRow();
          row.innerHTML = '<td colspan="8" class="text-center">Plaka bulunamadı</td>';
          return;
      }
      
      // Filter out plates with status "TUKENDI"
      const activePlakas = result.plakalar.filter(plaka => plaka.durum !== 'TUKENDI');
      
      // If no active plates left after filtering
      if (activePlakas.length === 0) {
          const row = tableBody.insertRow();
          row.innerHTML = '<td colspan="8" class="text-center">Aktif plaka bulunamadı</td>';
          return;
      }
      
      // Tablo başlık satırını güncelle - checkbox ekle
      const headerRow = plakalarTable.querySelector('thead tr');
      if (headerRow && !headerRow.querySelector('.select-all-wrapper')) {
          const selectAllCell = document.createElement('th');
          selectAllCell.width = '40px';
          selectAllCell.innerHTML = `
              <div class="select-all-wrapper">
                  <input type="checkbox" id="select-all-plakas" class="select-all-checkbox">
              </div>
          `;
          headerRow.insertBefore(selectAllCell, headerRow.firstChild);
          
          // Tümünü seç/kaldır olayını ekle
          document.getElementById('select-all-plakas').addEventListener('change', function() {
              const isChecked = this.checked;
              document.querySelectorAll('.plaka-checkbox').forEach(checkbox => {
                  checkbox.checked = isChecked;
                  
                  // Plaka seçimini güncelle
                  const plakaId = parseInt(checkbox.getAttribute('data-plaka-id'));
                  togglePlakaSelection(plakaId, isChecked);
              });
          });
      }
      
      // Display only active plates
      activePlakas.forEach(plaka => {
          const row = tableBody.insertRow();
          
          // Seçim hücresi ekle
          const selectCell = row.insertCell(0);
          selectCell.innerHTML = `
              <input type="checkbox" class="plaka-checkbox" data-plaka-id="${plaka.id}">
          `;
          
          // Plaka No
          const plakaNoCell = row.insertCell(1);
          plakaNoCell.textContent = `#${plaka.stok_kodu}`;
          
          // En x Boy
          row.insertCell(2).textContent = `${plaka.en} x ${plaka.boy} mm`;
          
          // Durum
          const durumCell = row.insertCell(3);
          let durumText = '';
          let durumClass = '';
          
          switch (plaka.durum) {
              case 'TAM':
                  durumText = 'TAM';
                  durumClass = 'stokta-var';
                  break;
              case 'KISMEN_KULLANILDI':
                  durumText = 'KISMEN KULLANILDI';
                  durumClass = 'az-kaldi';
                  break;
              // We don't need this case anymore since we're filtering them out
              // case 'TUKENDI':
              //     durumText = 'TÜKENDİ';
              //     durumClass = 'stokta-yok';
              //     break;
          }
          
          durumCell.innerHTML = `<span class="${durumClass}">${durumText}</span>`;
          durumCell.style.verticalAlign = 'middle';
          
          // Orijinal Kilo
          row.insertCell(4).textContent = `${Number(plaka.toplam_kilo).toFixed(2)} kg`;
          
          // Kalan Kilo
          row.insertCell(5).textContent = `${Number(plaka.kalan_kilo).toFixed(2)} kg`;
          
          // Kullanım Oranı
          row.insertCell(6).textContent = `%${Number(plaka.kullanim_orani).toFixed(2)}`;
          
          // İşlemler
          const islemlerCell = row.insertCell(7);
          if (plaka.durum !== 'TUKENDI') {
              islemlerCell.innerHTML = `
                  <div class="action-buttons">
                      <button class="action-btn view" title="Parçaları Gör" onclick="loadPlakaParcalar(${plaka.id})">
                          <i class="fas fa-list"></i>
                      </button>
                  </div>
              `;
          } else {
              islemlerCell.textContent = 'Tükenmiş';
          }
          
          // Checkbox olayını dinle
          const checkbox = selectCell.querySelector('.plaka-checkbox');
          checkbox.addEventListener('change', function() {
              const plakaId = parseInt(this.getAttribute('data-plaka-id'));
              togglePlakaSelection(plakaId, this.checked);
          });
      });
      
      // Sadece tükenmeyen plakaları checkbox ile seçilebilir yap
      document.querySelectorAll('.plaka-checkbox').forEach(checkbox => {
          const row = checkbox.closest('tr');
          const durumCell = row.cells[3];
          if (durumCell.textContent.includes('TÜKENDİ')) {
              checkbox.disabled = true;
              row.classList.add('disabled-row');
          }
      });
    } catch (error) {
        console.error('Plaka listesi yükleme hatası:', error);
        
        const plakalarTable = document.getElementById('plakalarTable');
        const tableBody = plakalarTable.getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
        
        const row = tableBody.insertRow();
        row.innerHTML = '<td colspan="8" class="text-center">Plaka listesi yüklenirken hata oluştu</td>';
    }
  } 

  window.savePlakaIslem = savePlakaIslem;
  window.setupIslemFormHandlers = setupIslemFormHandlers;
  window.generatePlakaList = generatePlakaList;
  window.calculatePlakaWithTolerance = calculatePlakaWithTolerance;
  window.savePlakaMultiple= savePlakaMultiple;
  window.resetPlakaModal = resetPlakaModal;
  window.setupPlakaEventListeners = setupPlakaEventListeners;
  window.setupHammaddeDetailModal = setupHammaddeDetailModal;
  window.setupPlakaKaydetEventListener = setupPlakaKaydetEventListener;
  window.setupModalEventListeners = setupModalEventListeners;
  window.setupModalOpeners = setupModalOpeners;
  window.fixPlakaIslemModal = fixPlakaIslemModal;
  window.fixParcaIslemModal = fixParcaIslemModal;
  window.openYeniPlakaModal = openYeniPlakaModal;
  window.loadPlakaIslemleri = loadPlakaIslemleri;
  window.loadPlakaList = loadPlakaList;
  window.loadPlakaParcalar = loadPlakaParcalar;