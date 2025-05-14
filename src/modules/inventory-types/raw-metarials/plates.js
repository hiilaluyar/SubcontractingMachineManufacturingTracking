async function savePlakaIslem() {
  try {
      // Toplu işlem mi kontrol et
      const isBulkOperation = window.currentBulkPlakas && 
                             window.currentBulkPlakas.plakaIds && 
                             window.currentBulkPlakas.plakaIds.length > 0;
      
      // Form değerlerini al ve sayısal değerler için doğru dönüşüm yap
      const kullanilanMiktar = parseFloat(document.getElementById('plakaKullanilanMiktar').value);
      const hurdaMiktar = parseFloat(document.getElementById('plakaHurdaMiktar').value) || 0;
      const islemTuru = document.getElementById('plakaIslemTuru').value;
      const kullanimAlani = document.getElementById('plakaKullanimAlani').value;
      const projeId = document.getElementById('plakaProjeSecimi').value;
      const musteriId = document.getElementById('plakaMusteriSecimi')?.value || null;
      const makine = document.getElementById('plakaMakineSecimi').value;
      const calisanId = document.getElementById('plakaCalisanSecimi').value;
      
      // Validasyon - boş veya geçersiz değerler kabul edilmez
      if (!kullanilanMiktar || isNaN(kullanilanMiktar) || kullanilanMiktar <= 0) {
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
      
      // Kalan parçalar için toplam hesapla
      const kalanParcalarToplami = kalanParcalar.reduce((toplam, parca) => {
          return toplam + parseFloat(parca.agirlik);
      }, 0);
      
      // Yarı mamul bilgileri
      let yariMamulData = null;
      if (kullanimAlani === 'MakineImalat') {
          const yariMamulAdi = document.getElementById('plakaYariMamulAdi').value?.trim();
          const yariMamulBirim = document.getElementById('plakaYariMamulBirim').value;
          const yariMamulMiktar = parseFloat(document.getElementById('plakaYariMamulMiktar').value);
          
          if (!yariMamulAdi) {
              showModalError('plakaIslemModal', 'Lütfen yarı mamul adı girin.');
              return;
          }
          
          if (!yariMamulMiktar || isNaN(yariMamulMiktar) || yariMamulMiktar <= 0) {
              showModalError('plakaIslemModal', 'Lütfen geçerli bir yarı mamul miktarı girin.');
              return;
          }
          
          yariMamulData = {
              adi: yariMamulAdi,
              birim: yariMamulBirim,
              miktar: yariMamulMiktar
          };
      }
      
      if (isBulkOperation) {
          // TOPLU İŞLEM
          // İşlem kaydediliyor mesajını göster
          showModalSuccess('plakaIslemModal', `${window.currentBulkPlakas.plakaIds.length} plaka için işlem kaydediliyor...`);
          
          // Sonuçları tutacak dizi
          const results = [];
          const bulkPlakas = window.currentBulkPlakas;
          const plakaSayisi = bulkPlakas.plakaIds.length;
          
          // Toplam yarı mamul miktarını takip etmek için
          let toplamYariMamulMiktari = 0;
          
          // ÖNEMLİ: Her plaka için ayrı işlem yap, ancak kaç plaka için işlem yapıldığını doğru takip et
          let processedCount = 0;
          
          for (let i = 0; i < plakaSayisi; i++) {
              const plakaId = bulkPlakas.plakaIds[i];
              const plaka = bulkPlakas.plakaDetails.find(p => p.id === plakaId);
              
              if (!plaka) {
                  console.error(`Plaka ID ${plakaId} için detay bulunamadı`);
                  results.push({
                      plakaId: plakaId,
                      stokKodu: "Bilinmiyor",
                      success: false,
                      message: `Plaka detayları bulunamadı (ID: ${plakaId})`
                  });
                  continue;
              }
              
              // Plaka başına kalan kilo kontrolü
              const plakaKalanKilo = parseFloat(plaka.kalan_kilo);
              const toplamKullanilacak = kullanilanMiktar + hurdaMiktar;
              
              // Eğer plakada yeterli malzeme yoksa, atla
              if (toplamKullanilacak > plakaKalanKilo) {
                  results.push({
                      plakaId: plakaId,
                      stokKodu: plaka.stok_kodu,
                      success: false,
                      message: `Plaka #${plaka.stok_kodu} için yetersiz malzeme (${plakaKalanKilo.toFixed(2)} kg kalan, ${toplamKullanilacak.toFixed(2)} kg gerekli)`
                  });
                  continue;
              }
              
              // Kalan parça bilgileri - her plaka için kopyala
              let plakaKalanParcaDataList = [];
              if (document.getElementById('kalanParcaSwitch').checked && kalanParcalar.length > 0) {
                  // Her bir kalan parça için veri oluştur
                  plakaKalanParcaDataList = kalanParcalar.map(parca => ({
                      en: parseFloat(parca.en),
                      boy: parseFloat(parca.boy),
                      kalinlik: parseFloat(parca.kalinlik),
                      hesaplanan_agirlik: parseFloat(parca.agirlik),
                      hammadde_id: parseInt(plaka.hammadde_id),
                      plaka_id: parseInt(plakaId)
                  }));
              }
              
              // Yarı mamul verisini her plaka için ayrı ayrı hazırla
              let plakaYariMamulData = null;
              if (yariMamulData && kullanimAlani === 'MakineImalat') {
                  plakaYariMamulData = { ...yariMamulData };
                  // Her plaka için aynı miktar kullanılıyor
                  // Toplam miktarı takip ediyoruz
                  toplamYariMamulMiktari += plakaYariMamulData.miktar;
              }
              
              // İşlem verisi - tüm verilerin doğru tipte olduğundan emin ol
              const islemData = {
                  plaka_id: parseInt(plakaId),
                  islem_turu: islemTuru,
                  kullanim_alani: kullanimAlani,
                  kullanilanMiktar: kullanilanMiktar,
                  hurdaMiktar: hurdaMiktar,
                  proje_id: parseInt(projeId),
                  musteri_id: musteriId ? parseInt(musteriId) : null,
                  kullanici_id: parseInt(currentUser.id),
                  kalan_parcalar: plakaKalanParcaDataList,
                  yari_mamul: plakaYariMamulData,
                  makine: makine,
                  calisan_id: parseInt(calisanId)
              };
              
              try {
                  // İşlemi kaydet
                  const result = await window.electronAPI.invoke.database.addPlakaIslem(islemData);
                  
                  if (result.success) {
                      processedCount++;
                  }
                  
                  results.push({
                      plakaId: plakaId,
                      stokKodu: plaka.stok_kodu,
                      success: result.success,
                      message: result.message,
                      islemId: result.islemId
                  });
              } catch (error) {
                  console.error(`Plaka ${plakaId} işlem hatası:`, error);
                  results.push({
                      plakaId: plakaId,
                      stokKodu: plaka.stok_kodu,
                      success: false,
                      message: error.message || "İşlem sırasında beklenmeyen hata"
                  });
              }
          }
          
          // Sonuçları göster
          const successCount = results.filter(r => r.success).length;
          
          // Başarılı işlem sayısıyla gerçekten işlenen plaka sayısının eşleştiğini doğrula
          if (successCount !== processedCount) {
              console.error(`İşlem sayısı tutarsızlığı: ${successCount} başarılı, ${processedCount} işlendi`);
          }
          
          if (successCount > 0) {
              // Eğer yarı mamul işlemi yapılmışsa, onu da göster
              let successMessage = `${successCount}/${bulkPlakas.plakaIds.length} plaka için işlem başarıyla kaydedildi.`;
              if (kullanimAlani === 'MakineImalat' && yariMamulData) {
                  successMessage += ` Toplam ${toplamYariMamulMiktari.toFixed(2)} ${yariMamulData.birim} yarı mamul oluşturuldu.`;
              }
              
              showToast(successMessage, 'success');
              
              // Modalı kapat
              closeModal('plakaIslemModal');
              
              // Dashboard'ı güncelle
              if (typeof updateDashboard === 'function') {
                  updateDashboard();
              }
              
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
              
              // Toplu işlem değişkenini temizle
              window.currentBulkPlakas = null;
          } else {
              // Hata mesajlarını birleştir
              const errorMessages = results
                  .filter(r => !r.success)
                  .map(r => `Plaka #${r.stokKodu || r.plakaId}: ${r.message}`)
                  .join('\n');
              
              showModalError('plakaIslemModal', `Hiçbir plaka için işlem kaydedilemedi.\n${errorMessages}`);
          }
      } else {
          // TEKLİ İŞLEM
          // Plaka bilgilerini al
          const plakaKalanKilo = parseFloat(currentPlaka.kalan_kilo);
          
          // Toplam kullanılacak miktarı kontrol et
          const toplamKullanilacak = kullanilanMiktar + hurdaMiktar + kalanParcalarToplami;
          
          // Değerlerin hassasiyetini ayarla (yuvarla)
          const plakaKalanKiloRounded = Math.round(plakaKalanKilo * 100) / 100;
          const toplamKullanilacakRounded = Math.round(toplamKullanilacak * 100) / 100;
          
          // Hassasiyet toleransı - küçük sayısal farklar için
          const HASSASIYET_TOLERANSI = 0.01;
          
          if (toplamKullanilacakRounded > (plakaKalanKiloRounded + HASSASIYET_TOLERANSI)) {
              showModalError('plakaIslemModal', 
                  `Toplam miktar (${toplamKullanilacakRounded.toFixed(2)} kg) plakada kalan miktardan (${plakaKalanKiloRounded.toFixed(2)} kg) fazla.`);
              return;
          }
          
          // Kalan parça bilgileri - artık birden fazla olabilir
          let kalanParcaDataList = [];
          if (document.getElementById('kalanParcaSwitch').checked && kalanParcalar.length > 0) {
              // Her bir kalan parça için veri oluştur
              kalanParcaDataList = kalanParcalar.map(parca => ({
                  en: parseFloat(parca.en),
                  boy: parseFloat(parca.boy),
                  kalinlik: parseFloat(parca.kalinlik),
                  hesaplanan_agirlik: parseFloat(parca.agirlik),
                  hammadde_id: parseInt(currentPlaka.hammadde_id),
                  plaka_id: parseInt(currentPlaka.id)
              }));
          }
          
          // İşlem verisi - tüm değerlerin doğru tipte olduğundan emin ol
          const islemData = {
              plaka_id: parseInt(currentPlaka.id),
              islem_turu: islemTuru,
              kullanim_alani: kullanimAlani,
              kullanilanMiktar: kullanilanMiktar,
              hurdaMiktar: hurdaMiktar,
              proje_id: parseInt(projeId),
              musteri_id: musteriId ? parseInt(musteriId) : null,
              kullanici_id: parseInt(currentUser.id),
              kalan_parcalar: kalanParcaDataList,
              yari_mamul: yariMamulData,
              makine: makine,
              calisan_id: parseInt(calisanId)
          };
          
          // İşlem kaydediliyor mesajını göster
          showModalSuccess('plakaIslemModal', 'İşlem kaydediliyor...');
          
          // İşlemi kaydet
          const result = await window.electronAPI.invoke.database.addPlakaIslem(islemData);
          
          if (result.success) {
              showToast('Plaka işlemi başarıyla kaydedildi.', 'success');
              
              // Modalı kapat
              closeModal('plakaIslemModal');
              
              // Dashboard'ı güncelle
              if (typeof updateDashboard === 'function') {
                  updateDashboard();
              }
              
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
      console.log("Plakalar alındı:", plakaResult);
      
      if (!plakaResult.success || !plakaResult.plakalar || plakaResult.plakalar.length === 0) {
        console.log("Bu hammadde için plaka bulunamadı");
        return [];
      }
      
      // Tüm plakaların işlemlerini topla
      let tumIslemler = [];
      
      // Her plaka için işlemleri al
      for (const plaka of plakaResult.plakalar) {
        console.log(`Plaka ID ${plaka.id} için işlemler alınıyor`);
        
        try {
          // Plaka işlemlerini çek
          const islemlerResult = await window.electronAPI.invoke.database.getIslemlerByPlakaId(plaka.id);
          console.log(`Plaka ${plaka.id} için işlemler:`, islemlerResult);
          
          if (islemlerResult.success && islemlerResult.islemler && islemlerResult.islemler.length > 0) {
            // Her işleme plaka bilgisini ekle
            const formattedIslemler = islemlerResult.islemler.map(islem => ({
              ...islem,
              plakaNo: `Plaka #${plaka.stok_kodu}`,
              tarih: islem.islem_tarihi,
              kullanici: islem.kullanici_ad ? `${islem.kullanici_ad} ${islem.kullanici_soyad}` : 'Bilinmiyor'
            }));
            
            // İşlemleri listeye ekle
            tumIslemler = [...tumIslemler, ...formattedIslemler];
            console.log(`Plaka ${plaka.id} için ${formattedIslemler.length} işlem eklendi`);
          } else {
            console.log(`Plaka ${plaka.id} için işlem bulunamadı`);
          }
        } catch (islemHatasi) {
          console.error(`Plaka ${plaka.id} işlemleri alınırken hata:`, islemHatasi);
        }
      }
      
      console.log(`Toplam ${tumIslemler.length} plaka işlemi bulundu`);
      return tumIslemler;
    } catch (error) {
      console.error('Plaka işlemleri getirme hatası:', error);
      return [];
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