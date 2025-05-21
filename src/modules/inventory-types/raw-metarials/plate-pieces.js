function addKalanParca() {
    const parcaDetay = calculatePlakaWithKalanParca();
    
    if (!parcaDetay) {
        return; // Hesaplama hatası varsa fonksiyondan çık
    }
    
    // Yeni parçayı listeye ekle
    const yeniId = Date.now(); // Benzersiz ID için timestamp kullan
    const yeniParca = {
        id: yeniId,
        en: parcaDetay.en,
        boy: parcaDetay.boy,
        kalinlik: parcaDetay.kalinlik,
        agirlik: parcaDetay.agirlik
    };
    
    kalanParcalar.push(yeniParca);
    
    // Parça listesini güncelle
    updateKalanParcaListUI();
    
    // Formları temizle
    document.getElementById('kalanParcaEn').value = '';
    document.getElementById('kalanParcaBoy').value = '';
    document.getElementById('kalanParcaHesapSonucu').style.display = 'none';
    document.getElementById('ekleKalanParcaBtn').disabled = true;
    
    // Otomatik hurda hesaplama
    updatePlakaHurdaHesaplama();
}



function updateKalanParcaListUI() {
    const listesiContainer = document.getElementById('kalanParcaListesiContainer');
    const listesi = document.getElementById('kalanParcaListesi');
    
    // Liste varsa göster, yoksa gizle
    if (kalanParcalar.length > 0) {
        listesiContainer.style.display = 'block';
    } else {
        listesiContainer.style.display = 'none';
        return;
    }
    
    // Listeyi temizle
    listesi.innerHTML = '';
    
    // Toplam ağırlığı hesapla
    const kullanilanMiktar = parseFloat(document.getElementById('plakaKullanilanMiktar').value) || 0;
    const toplamKilo = currentPlaka.kalan_kilo;
    const toplamKalanAgirlik = kalanParcalar.reduce((toplam, parca) => toplam + parca.agirlik, 0);
    
    // Toplam göstergeleri güncelle
    document.getElementById('toplamKullanilanAgirlik').textContent = (kullanilanMiktar + toplamKalanAgirlik).toFixed(2);
    document.getElementById('toplamKalanAgirlik').textContent = (toplamKilo - kullanilanMiktar - toplamKalanAgirlik).toFixed(2);
    
    // Her parça için kart oluştur
    kalanParcalar.forEach((parca, index) => {
        const parcaCard = document.createElement('div');
        parcaCard.className = 'parca-card';
        parcaCard.innerHTML = `
            <h4>Parça ${index + 1}</h4>
            <div class="parca-detail">
                <span>Boyut:</span>
                <span>${parca.en} x ${parca.boy} mm</span>
            </div>
            <div class="parca-detail">
                <span>Ağırlık:</span>
                <span>${parca.agirlik.toFixed(2)} kg</span>
            </div>
            <button type="button" class="btn-danger btn-sm" onclick="removeKalanParca(${parca.id})">
                <i class="fas fa-trash"></i> Sil
            </button>
        `;
        listesi.appendChild(parcaCard);
    });
}


function removeKalanParca(parcaId) {
    kalanParcalar = kalanParcalar.filter(parca => parca.id !== parcaId);
    updateKalanParcaListUI();
    updatePlakaHurdaHesaplama();
}





function updatePlakaHurdaHesaplama() {
    const kullanilanMiktar = parseFloat(document.getElementById('plakaKullanilanMiktar').value) || 0;
    const toplamKilo = parseFloat(currentPlaka.kalan_kilo);
    
    // Kalan parçaların toplam ağırlığını 2 ondalık basamağa yuvarla
    const toplamKalanParcaAgirligi = kalanParcalar.reduce((toplam, parca) => {
        return toplam + parseFloat(parca.agirlik);
    }, 0);
    const yuvarlananToplamKalanParcaAgirligi = Number(toplamKalanParcaAgirligi.toFixed(2));
    
    // Hurda miktarı = Toplam - Kullanılan - Kalan Parçalar
    const hurdaMiktar = toplamKilo - kullanilanMiktar - yuvarlananToplamKalanParcaAgirligi;
    
    // Hurda değeri 0'dan küçük olamaz
    if (hurdaMiktar >= 0) {
        document.getElementById('plakaHurdaMiktar').value = hurdaMiktar.toFixed(2);
    } else {
        document.getElementById('plakaHurdaMiktar').value = '0';
    }
    
    // UI bilgilendirme metni ekle
    const infoText = `
        <div class="info-text highlight">
            <p>Bilgi: Oluşturulan kalan parçaların toplam ağırlığı: ${yuvarlananToplamKalanParcaAgirligi.toFixed(2)} kg.</p>
            <p>Bu parçalar, plakanın kalan parçaları olarak envanterde kalacaktır.</p>
        </div>
    `;
    
    // Bilgi metnini ekle/güncelle
    let infoTextContainer = document.getElementById('plaka-hesaplama-info');
    if (!infoTextContainer) {
        infoTextContainer = document.createElement('div');
        infoTextContainer.id = 'plaka-hesaplama-info';
        document.getElementById('kalanParcaPanel').appendChild(infoTextContainer);
    }
    infoTextContainer.innerHTML = infoText;
    
    // Toplam göstergeleri güncelle
    document.getElementById('toplamKullanilanAgirlik').textContent = kullanilanMiktar.toFixed(2);
    document.getElementById('toplamKalanAgirlik').textContent = (toplamKilo - kullanilanMiktar).toFixed(2);
  }
  
  function hesaplaParcaKalanParca() {
      const en = parseFloat(document.getElementById('parcaKalanParcaEn').value);
      const boy = parseFloat(document.getElementById('parcaKalanParcaBoy').value);
      const kalinlik = currentParca.kalinlik; // Global değişkenden alınacak
      const yogunluk = currentParca.yogunluk; // Global değişkenden alınacak
      
      if (!en || !boy || isNaN(en) || isNaN(boy)) {
          document.getElementById('parcaKalanParcaHesapSonucu').innerHTML = 
              '<div class="error">Lütfen geçerli en ve boy değerleri girin.</div>';
          document.getElementById('parcaKalanParcaHesapSonucu').style.display = 'block';
          document.getElementById('ekleParcaKalanParcaBtn').disabled = true;
          return null;
      }
      
      // Orijinal parça boyutlarını kontrol et (eğer bilgi mevcutsa)
      if (currentParca.en && currentParca.boy) {
          if (en > currentParca.en || boy > currentParca.boy) {
              document.getElementById('parcaKalanParcaHesapSonucu').innerHTML = 
                  '<div class="error">Kalan parça boyutları orijinal parça boyutlarından büyük olamaz.</div>';
              document.getElementById('parcaKalanParcaHesapSonucu').style.display = 'block';
              document.getElementById('ekleParcaKalanParcaBtn').disabled = true;
              return null;
          }
      }
      
      // Hacim hesapla (m³)
      const hacim = (en / 1000) * (boy / 1000) * (kalinlik / 1000);
      
      // Ağırlık hesapla (kg)
      const agirlik = hacim * yogunluk;
      
      // Sonucu göster
      document.getElementById('parcaKalanParcaHesapSonucu').innerHTML = `
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
                  <span>Hesaplanan Ağırlık:</span>
                  <span>${agirlik.toFixed(2)} kg</span>
              </div>
          </div>
      `;
      document.getElementById('parcaKalanParcaHesapSonucu').style.display = 'block';
      
      // Toplam kullanılabilir kilo kontrolü
      const kullanilanMiktar = parseFloat(document.getElementById('parcaKullanilanMiktar').value) || 0;
      const toplamKilo = currentParca.kalan_kilo;
      const mevcutKalanParcalarToplami = parcaKalanParcalar.reduce((toplam, parca) => toplam + parca.agirlik, 0);
      const kullanilabilirKilo = toplamKilo - kullanilanMiktar - mevcutKalanParcalarToplami;
      
      // Ağırlık kullanılabilir kilodan büyük mü kontrol et
      if (agirlik > kullanilabilirKilo) {
          document.getElementById('parcaKalanParcaHesapSonucu').innerHTML += `
              <div class="error">
                  Hata: Bu parça ağırlığı (${agirlik.toFixed(2)} kg), kullanılabilir miktardan (${kullanilabilirKilo.toFixed(2)} kg) fazla.
              </div>
          `;
          document.getElementById('ekleParcaKalanParcaBtn').disabled = true;
          return null;
      }
      
      // Parça ekleme butonunu aktifleştir
      document.getElementById('ekleParcaKalanParcaBtn').disabled = false;
      
      return {
          en: en,
          boy: boy,
          kalinlik: kalinlik,
          agirlik: agirlik
      };
  }
  
  // Parça için kalan parça ekleme
  function addParcaKalanParca() {
      const parcaDetay = hesaplaParcaKalanParca();
      
      if (!parcaDetay) {
          return; // Hesaplama hatası varsa fonksiyondan çık
      }
      
      // Yeni parçayı listeye ekle
      const yeniId = Date.now(); // Benzersiz ID için timestamp kullan
      const yeniParca = {
          id: yeniId,
          en: parcaDetay.en,
          boy: parcaDetay.boy,
          kalinlik: parcaDetay.kalinlik,
          agirlik: parcaDetay.agirlik
      };
      
      parcaKalanParcalar.push(yeniParca);
      
      // Parça listesini güncelle
      updateParcaKalanParcaListUI();
      
      // Formları temizle
      document.getElementById('parcaKalanParcaEn').value = '';
      document.getElementById('parcaKalanParcaBoy').value = '';
      document.getElementById('parcaKalanParcaHesapSonucu').style.display = 'none';
      document.getElementById('ekleParcaKalanParcaBtn').disabled = true;
      
      // Otomatik hurda hesaplama
      updateParcaHurdaHesaplama();
  }
  
  // Parça için kalan parça listesini sıfırla
  function resetParcaKalanParcaList() {
      parcaKalanParcalar = [];
      updateParcaKalanParcaListUI();
      document.getElementById('parcaHurdaMiktar').value = '0';
  }
  
  // Parça için kalan parça listesi UI'ını güncelle
  function updateParcaKalanParcaListUI() {
      const listesiContainer = document.getElementById('parcaKalanParcaListesiContainer');
      const listesi = document.getElementById('parcaKalanParcaListesi');
      
      // Liste varsa göster, yoksa gizle
      if (parcaKalanParcalar.length > 0) {
          listesiContainer.style.display = 'block';
      } else {
          listesiContainer.style.display = 'none';
          return;
      }
      
      // Listeyi temizle
      listesi.innerHTML = '';
      
      // Toplam ağırlığı hesapla
      const kullanilanMiktar = parseFloat(document.getElementById('parcaKullanilanMiktar').value) || 0;
      const toplamKilo = currentParca.kalan_kilo;
      const toplamKalanAgirlik = parcaKalanParcalar.reduce((toplam, parca) => toplam + parca.agirlik, 0);
      
      // Toplam göstergeleri güncelle
      document.getElementById('parcaToplamKullanilanAgirlik').textContent = (kullanilanMiktar + toplamKalanAgirlik).toFixed(2);
      document.getElementById('parcaToplamKalanAgirlik').textContent = (toplamKilo - kullanilanMiktar - toplamKalanAgirlik).toFixed(2);
      
      // Her parça için kart oluştur
      parcaKalanParcalar.forEach((parca, index) => {
          const parcaCard = document.createElement('div');
          parcaCard.className = 'parca-card';
          parcaCard.innerHTML = `
              <h4>Parça ${index + 1}</h4>
              <div class="parca-detail">
                  <span>Boyut:</span>
                  <span>${parca.en} x ${parca.boy} mm</span>
              </div>
              <div class="parca-detail">
                  <span>Ağırlık:</span>
                  <span>${parca.agirlik.toFixed(2)} kg</span>
              </div>
              <button type="button" class="btn-danger btn-sm" onclick="removeParcaKalanParca(${parca.id})">
                  <i class="fas fa-trash"></i> Sil
              </button>
          `;
          listesi.appendChild(parcaCard);
      });
  }
  
  // Parça için kalan parça silme
  function removeParcaKalanParca(parcaId) {
      parcaKalanParcalar = parcaKalanParcalar.filter(parca => parca.id !== parcaId);
      updateParcaKalanParcaListUI();
      updateParcaHurdaHesaplama();
  }
  
  function updateParcaHurdaHesaplama() {
      const kullanilanMiktar = parseFloat(document.getElementById('parcaKullanilanMiktar').value) || 0;
      const toplamKilo = parseFloat(currentParca.kalan_kilo);
      const toplamKalanParcaAgirligi = parcaKalanParcalar.reduce((toplam, parca) => toplam + parseFloat(parca.agirlik), 0);
      
      // Hurda miktarı = Toplam - Kullanılan - Kalan Parçalar
      const hurdaMiktar = toplamKilo - kullanilanMiktar - toplamKalanParcaAgirligi;
      
      // Hurda değeri 0'dan küçük olamaz
      if (hurdaMiktar >= 0) {
          document.getElementById('parcaHurdaMiktar').value = hurdaMiktar.toFixed(2);
      } else {
          // Eğer negatif çıkarsa, kullanılan miktar çok fazla demektir
          document.getElementById('parcaHurdaMiktar').value = '0';
          
          // Kullanıcıya uyarı göster
          const hesapSonucu = document.getElementById('parcaKalanParcaHesapSonucu');
          if (hesapSonucu.style.display !== 'none') {
              hesapSonucu.innerHTML += `
                  <div class="error">
                      Uyarı: Toplam kullanılan miktar (${(kullanilanMiktar + toplamKalanParcaAgirligi).toFixed(2)} kg),
                      mevcut miktardan (${toplamKilo.toFixed(2)} kg) fazla. Lütfen değerleri kontrol edin.
                  </div>
              `;
          }
      }
      
      // UI bilgilendirme metni ekle
      const infoText = `
          <div class="info-text highlight">
              <p>Bilgi: Oluşturulan kalan parçaların toplam ağırlığı: ${toplamKalanParcaAgirligi.toFixed(2)} kg.</p>
              <p>Bu parçalar, envanterde yeni parçalar olarak kalacaktır.</p>
          </div>
      `;
      
      // Bilgi metnini ekle/güncelle
      let infoTextContainer = document.getElementById('parca-hesaplama-info');
      if (!infoTextContainer) {
          infoTextContainer = document.createElement('div');
          infoTextContainer.id = 'parca-hesaplama-info';
          document.getElementById('parcaKalanParcaPanel').appendChild(infoTextContainer);
      }
      infoTextContainer.innerHTML = infoText;
      
      // Toplam göstergeleri güncelle - kalan parçaları UI'da dahil etme
      document.getElementById('parcaToplamKullanilanAgirlik').textContent = kullanilanMiktar.toFixed(2);
      document.getElementById('parcaToplamKalanAgirlik').textContent = (toplamKilo - kullanilanMiktar).toFixed(2);
  }
  
  
  // Kullanılan miktar değiştiğinde hurda miktarını sıfırla
  function setupKullanilanMiktarChangeHandlers() {
      // Plaka için
      const plakaKullanilanMiktar = document.getElementById('plakaKullanilanMiktar');
      if (plakaKullanilanMiktar) {
          plakaKullanilanMiktar.addEventListener('change', function() {
              // Eğer kalan parça hesaplanmışsa, hurda miktarını yeniden hesapla
              if (document.getElementById('kalanParcaSwitch').checked && 
                  document.getElementById('kalanParcaHesapSonucu').style.display === 'block') {
                  calculatePlakaWithKalanParca();
              } else {
                  // Sadece hurda miktarını sıfırla
                  document.getElementById('plakaHurdaMiktar').value = '0';
              }
          });
      }
      
      // Parça için
      const parcaKullanilanMiktar = document.getElementById('parcaKullanilanMiktar');
      if (parcaKullanilanMiktar) {
          parcaKullanilanMiktar.addEventListener('change', function() {
              // Eğer kalan parça hesaplanmışsa, hurda miktarını yeniden hesapla
              if (document.getElementById('parcaKalanParcaSwitch').checked && 
                  document.getElementById('parcaKalanParcaHesapSonucu').style.display === 'block') {
                  hesaplaParcaKalanParca();
              } else {
                  // Sadece hurda miktarını sıfırla
                  document.getElementById('parcaHurdaMiktar').value = '0';
              }
          });
      }
  }
  
  // Kalan parça switch'i değiştiğinde hurda miktarını sıfırla
  function setupKalanParcaSwitchHandlers() {
      // Plaka için
      const kalanParcaSwitch = document.getElementById('kalanParcaSwitch');
      if (kalanParcaSwitch) {
          kalanParcaSwitch.addEventListener('change', function() {
              if (!this.checked) {
                  // Kalan parça oluşturma kapatıldıysa, hurda miktarını sıfırla
                  document.getElementById('plakaHurdaMiktar').value = '0';
                  // Hesaplama sonucunu gizle
                  document.getElementById('kalanParcaHesapSonucu').style.display = 'none';
              }
          });
      }
      
      // Parça için
      const parcaKalanParcaSwitch = document.getElementById('parcaKalanParcaSwitch');
      if (parcaKalanParcaSwitch) {
          parcaKalanParcaSwitch.addEventListener('change', function() {
              if (!this.checked) {
                  // Kalan parça oluşturma kapatıldıysa, hurda miktarını sıfırla
                  document.getElementById('parcaHurdaMiktar').value = '0';
                  // Hesaplama sonucunu gizle
                  document.getElementById('parcaKalanParcaHesapSonucu').style.display = 'none';
              }
          });
      }
  }
  
  // Event listener'ları ekleme
  document.addEventListener('DOMContentLoaded', function() {
      // Plaka Kalan Parça Hesaplama butonu
      const hesaplaKalanParcaBtn = document.getElementById('hesaplaKalanParcaBtn');
      if (hesaplaKalanParcaBtn) {
          hesaplaKalanParcaBtn.addEventListener('click', calculatePlakaWithKalanParca);
      }
      
      // Parça Kalan Parça Hesaplama butonu
      const hesaplaParcaKalanParcaBtn = document.getElementById('hesaplaParcaKalanParcaBtn');
      if (hesaplaParcaKalanParcaBtn) {
          hesaplaParcaKalanParcaBtn.addEventListener('click', hesaplaParcaKalanParca);
      }
      
      // Kullanılan miktar değişim handler'ları
      setupKullanilanMiktarChangeHandlers();
      
      // Kalan parça switch handler'ları
      setupKalanParcaSwitchHandlers();
  });
  
  // CSS sınıfını da ekleyelim, highlight için
  const style = document.createElement('style');
  style.textContent = `
  .highlight {
      background-color: #fffde7;
      font-weight: bold;
      padding: 5px;
      border-radius: 4px;
      border-left: 3px solid #fbc02d;
  }
  `;
  document.head.appendChild(style);
  


async function saveParcaIslem() {
    try {
        // Form değerlerini al
        const kullanilanMiktar = parseFloat(document.getElementById('parcaKullanilanMiktar').value);
        const hurdaMiktar = parseFloat(document.getElementById('parcaHurdaMiktar').value) || 0;
        const islemTuru = document.getElementById('parcaIslemTuru').value;
        const kullanimAlani = document.getElementById('parcaKullanimAlani').value;
        const projeId = document.getElementById('parcaProjeSecimi').value;
        const musteriId = document.getElementById('parcaMusteriSecimi')?.value;
        const makine = document.getElementById('parcaMakineSecimi').value;
        const calisanId = document.getElementById('parcaCalisanSecimi').value;
        
        // Validasyon
        if (!kullanilanMiktar || kullanilanMiktar <= 0) {
            showModalError('parcaIslemModal', 'Lütfen geçerli bir kullanılan miktar girin.');
            return;
        }
        
        if (!projeId) {
            showModalError('parcaIslemModal', 'Lütfen bir proje seçin veya yeni bir proje oluşturun.');
            return;
        }
        
        // Fason imalat ise müşteri zorunlu
        if (kullanimAlani === 'FasonImalat' && !musteriId) {
            showModalError('parcaIslemModal', 'Fason imalat için müşteri seçimi zorunludur.');
            return;
        }
        
        // Makine seçimi zorunlu
        if (!makine) {
            showModalError('parcaIslemModal', 'Lütfen bir makine seçin.');
            return;
        }
        
        // Çalışan seçimi zorunlu
        if (!calisanId) {
            showModalError('parcaIslemModal', 'Lütfen işlemi yapan çalışanı seçin.');
            return;
        }
        
        // Önce değerleri yuvarla (hassasiyet için)
        const parcaKalanKilo = Math.round(parseFloat(currentParca.kalan_kilo) * 100) / 100;
        const yuvarlananKullanilanMiktar = Math.round(kullanilanMiktar * 100) / 100;
        const yuvarlananHurdaMiktar = Math.round(hurdaMiktar * 100) / 100;
        
        // Toplam kalan parça ağırlığını hesapla
        const toplamParcaAgirligi = parcaKalanParcalar.reduce((toplam, parca) => {
            return toplam + Math.round(parseFloat(parca.agirlik) * 100) / 100;
        }, 0);
        
        const toplamKullanilacak = yuvarlananKullanilanMiktar + yuvarlananHurdaMiktar + toplamParcaAgirligi;
        
        // Hassasiyet toleransı
        const HASSASIYET_TOLERANSI = 0.01;
        
        if (toplamKullanilacak > (parcaKalanKilo + HASSASIYET_TOLERANSI)) {
            showModalError('parcaIslemModal', 
                `Kullanmak istediğiniz toplam miktar (${toplamKullanilacak.toFixed(2)} kg) parçada kalan miktardan (${parcaKalanKilo.toFixed(2)} kg) fazla.`);
            return;
        }
        
        // ÖNEMLİ: Makine İmalat ise ve Yarı Mamul var ise
        let yariMamulDataList = [];
        if (kullanimAlani === 'MakineImalat') {
            // Tüm yarı mamul öğelerini toplayalım
            const yarimamulItems = document.querySelectorAll('#parcaYariMamulList .yarimamul-item');
            if (yarimamulItems.length === 0) {
                showModalError('parcaIslemModal', 'Makine imalat için en az bir yarı mamul girmelisiniz.');
                return;
            }
            
            // Her bir yarı mamul için veri oluştur
            for (const item of yarimamulItems) {
                const index = item.dataset.index;
                const adi = document.getElementById(`parcaYariMamulAdi_${index}`).value?.trim();
                const birim = document.getElementById(`parcaYariMamulBirim_${index}`).value;
                const miktar = parseFloat(document.getElementById(`parcaYariMamulMiktar_${index}`).value) || 0;
                const birimAgirlik = parseFloat(document.getElementById(`parcaYariMamulAgirlik_${index}`).value) || 0;
                
                // Boş alan kontrolü
                if (!adi) {
                    showModalError('parcaIslemModal', `${index+1}. yarı mamulün adını girmelisiniz.`);
                    return;
                }
                
                if (miktar <= 0) {
                    showModalError('parcaIslemModal', `${index+1}. yarı mamulün miktarı 0'dan büyük olmalıdır.`);
                    return;
                }
                
                if (birimAgirlik <= 0) {
                    showModalError('parcaIslemModal', `${index+1}. yarı mamulün birim ağırlığı 0'dan büyük olmalıdır.`);
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
        if (document.getElementById('parcaKalanParcaSwitch').checked && parcaKalanParcalar.length > 0) {
            // Her bir kalan parça için veri oluştur
            kalanParcaDataList = parcaKalanParcalar.map(parca => ({
                en: parca.en,
                boy: parca.boy,
                kalinlik: parca.kalinlik,
                hesaplanan_agirlik: parca.agirlik,
                plaka_id: currentParca.plaka_id,
                parent_parca_id: currentParcaId
            }));
        }
        
        // İşlem verisi
        const islemData = {
            parca_id: currentParcaId,
            islem_turu: islemTuru,
            kullanim_alani: kullanimAlani,
            kullanilanMiktar: kullanilanMiktar,
            hurdaMiktar: hurdaMiktar,
            proje_id: projeId,
            musteri_id: musteriId || null,
            kullanici_id: currentUser.id,
            kalan_parcalar: kalanParcaDataList,
            yari_mamuller: yariMamulDataList, // ÖNEMLİ: Artık bir liste
            plaka_id: currentParca.plaka_id,
            makine: makine,
            calisan_id: parseInt(calisanId)
        };
        
        // İşlem kaydediliyor mesajını göster
        showModalSuccess('parcaIslemModal', 'İşlem kaydediliyor...');
        
        // İşlemi kaydet
        const result = await window.electronAPI.invoke.database.addParcaIslem(islemData);
        
        if (result.success) {
            let successMessage = 'Parça işlemi başarıyla kaydedildi.';
            
            // Yarı mamul oluşturulmuşsa ek bilgi göster
            if (kullanimAlani === 'MakineImalat' && yariMamulDataList.length > 0) {
                const toplamYariMamul = yariMamulDataList.reduce((toplam, ym) => toplam + ym.miktar, 0);
                const birimText = yariMamulDataList.length > 0 ? yariMamulDataList[0].birim : 'adet';
                successMessage += ` Toplam ${toplamYariMamul} ${birimText} yarı mamul oluşturuldu.`;
            }
            
            showToast(successMessage, 'success');
            
            // Modalı kapat
            closeModal('parcaIslemModal');
            
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
            showModalError('parcaIslemModal', 'Hata: ' + result.message);
        }
    } catch (error) {
        console.error('Parça işlemi kaydetme hatası:', error);
        showModalError('parcaIslemModal', 'İşlem kaydedilirken bir hata oluştu: ' + error.message);
    }
}



// Plaka için Kalan Parça Hesaplama
function calculatePlakaWithKalanParca() {
    const en = parseFloat(document.getElementById('kalanParcaEn').value);
    const boy = parseFloat(document.getElementById('kalanParcaBoy').value);
    const kalinlik = currentPlaka.kalinlik;
    const yogunluk = currentPlaka.yogunluk;
    
    if (!en || !boy || isNaN(en) || isNaN(boy)) {
        document.getElementById('kalanParcaHesapSonucu').innerHTML = 
            '<div class="error">Lütfen geçerli en ve boy değerleri girin.</div>';
        document.getElementById('kalanParcaHesapSonucu').style.display = 'block';
        document.getElementById('ekleKalanParcaBtn').disabled = true;
        return null;
    }
    
    // Orijinal plaka boyutlarını kontrol et
    if (en > currentPlaka.en || boy > currentPlaka.boy) {
        document.getElementById('kalanParcaHesapSonucu').innerHTML = 
            '<div class="error">Kalan parça boyutları orijinal plaka boyutlarından büyük olamaz.</div>';
        document.getElementById('kalanParcaHesapSonucu').style.display = 'block';
        document.getElementById('ekleKalanParcaBtn').disabled = true;
        return null;
    }
    
    // Hacim hesapla (m³)
    const hacim = (en / 1000) * (boy / 1000) * (kalinlik / 1000);
    
    // Ağırlık hesapla (kg) - DİREKT 2 ONDALIK BASAMA YUVARLA
    const agirlik = Number((hacim * yogunluk).toFixed(2));
    
    // Sonucu göster
    document.getElementById('kalanParcaHesapSonucu').innerHTML = `
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
                <span>Hesaplanan Ağırlık:</span>
                <span>${agirlik.toFixed(2)} kg</span>
            </div>
        </div>
    `;
    document.getElementById('kalanParcaHesapSonucu').style.display = 'block';
    
    // Toplam kullanılabilir kilo kontrolü
    const kullanilanMiktar = parseFloat(document.getElementById('plakaKullanilanMiktar').value) || 0;
    const toplamKilo = currentPlaka.kalan_kilo;
    const mevcutKalanParcalarToplami = kalanParcalar.reduce((toplam, parca) => toplam + parca.agirlik, 0);
    const kullanilabilirKilo = toplamKilo - kullanilanMiktar - mevcutKalanParcalarToplami;
    
    // Ağırlık kullanılabilir kilodan büyük mü kontrol et
    if (agirlik > kullanilabilirKilo) {
        document.getElementById('kalanParcaHesapSonucu').innerHTML += `
            <div class="error">
                Hata: Bu parça ağırlığı (${agirlik.toFixed(2)} kg), kullanılabilir miktardan (${kullanilabilirKilo.toFixed(2)} kg) fazla.
            </div>
        `;
        document.getElementById('ekleKalanParcaBtn').disabled = true;
        return null;
    }
    
    // Parça ekleme butonunu aktifleştir
    document.getElementById('ekleKalanParcaBtn').disabled = false;
    
    return {
        en: en,
        boy: boy,
        kalinlik: kalinlik,
        agirlik: agirlik
    };
  }
  



// Fix for the openParcaIslemModal function
async function openParcaIslemModal(parcaId, parcaNo) {
  try {
    currentParcaId = parcaId;
    
    // Parça bilgilerini al
    const result = await window.electronAPI.invoke.database.getParcaById(parcaId);
    
    if (result.success) {
      const parca = result.parca;
      currentParca = parca;
      
      // Başlığı güncelle
      const parcaHeader = document.getElementById('parcaDetayHeader');
      if (parcaHeader) {
        parcaHeader.textContent = parca.barkod_kodu || `Parça #${parcaNo}`;
      }
      
      // Formları sıfırla
      resetParcaIslemForm();
      
      // Bilgi alanını oluştur
      const bilgiAlani = document.getElementById('parcaIslemModalBilgi');
      
      if (!bilgiAlani) {
        const yeniBilgiAlani = document.createElement('div');
        yeniBilgiAlani.id = 'parcaIslemModalBilgi';
        yeniBilgiAlani.className = 'form-info';
        yeniBilgiAlani.innerHTML = `
          <p><strong>Ölçüler:</strong> ${parca.en || 'N/A'} x ${parca.boy || 'N/A'} mm</p>
          <p><strong>Kalan Kilo:</strong> ${Number(parca.kalan_kilo).toFixed(2)} kg</p>
          <p><strong>Kaynak:</strong> ${parca.plaka_grubu_id ? 'Plaka Grubu' : (parca.plaka_id ? 'Plaka' : 'Hammadde')}</p>
        `;
        
        // Bilgi alanını forma ekle
        const form = document.querySelector('#parcaIslemModal .parca-islem-form');
        if (form) {
          form.insertBefore(yeniBilgiAlani, form.firstChild);
        }
      } else {
        bilgiAlani.innerHTML = `
          <p><strong>Ölçüler:</strong> ${parca.en || 'N/A'} x ${parca.boy || 'N/A'} mm</p>
          <p><strong>Kalan Kilo:</strong> ${Number(parca.kalan_kilo).toFixed(2)} kg</p>
          <p><strong>Kaynak:</strong> ${parca.plaka_grubu_id ? 'Plaka Grubu' : (parca.plaka_id ? 'Plaka' : 'Hammadde')}</p>
        `;
      }
        
        // Projeleri yükle
        try {
          await loadProjeler();
          console.log('Parça işlem modalı için projeler yüklendi');
        } catch (error) {
          console.error('Projeler yüklenirken hata:', error);
        }
        
        // Müşteri listesini yükle
        try {
          await loadMusteriler();
          console.log('Müşteriler yüklendi');
        } catch (error) {
          console.error('Müşteriler yüklenirken hata:', error);
        }
        
        // Çalışan listesini yükle
        try {
          await loadCalisanlar();
          console.log('Çalışanlar yüklendi');
        } catch (error) {
          console.error('Çalışanlar yüklenirken hata:', error);
        }
        
        // Form alanlarını güncelle
        toggleParcaFormSections();
        
        // Önce detay modalını kapat
        closeModal('detayModal');
        
        // Diğer açık modalları kapat
        document.querySelectorAll('.modal').forEach(modal => {
          if (modal.style.display === 'block' && modal.id !== 'detayModal') {
            closeModal(modal.id);
          }
        });
        
        // İşlem modalını aç
        setTimeout(() => {
          openModal('parcaIslemModal');
          console.log('Parça işlem modalı açıldı');
          
          // Select elementlerinin stil düzeltmesi
          setTimeout(() => {
            const projectSelect = document.getElementById('parcaProjeSecimi');
            if (projectSelect) {
              projectSelect.style.color = '#333';
              Array.from(projectSelect.options).forEach(option => {
                option.style.color = '#333';
                option.style.backgroundColor = '#fff';
              });
            }
          }, 200);
        }, 300);
      } else {
        showToast('Parça bilgileri alınamadı: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Parça işlem modalı açma hatası:', error);
      showToast('Parça işlem modalı açılırken bir hata oluştu: ' + error.message, 'error');
    }
  }
  

  
  // loadParcaIslemleri fonksiyonunun düzeltilmiş hali
  async function loadParcaIslemleri(hammaddeId) {
    try {
        // islemler tablosundan boru ve mil işlemlerini alacağız
        const result = await window.electronAPI.invoke.database.getIslemlerByHammaddeId(hammaddeId);
        
        if (!result.success) {
            console.error("Parça işlemleri getirilirken hata:", result.message);
            return [];
        }
        
        // Verileri formatla
        const formattedIslemler = result.islemler.map(islem => {
            return {
                id: islem.id,
                tarih: islem.islem_tarihi,
                parcaNo: islem.parcaNo ? `Parça #${islem.parcaNo}` : '-', // Burayı düzelttim
                islem_turu: islem.islem_turu,
                kullanilan_miktar: islem.kullanilanMiktar,
                hurda_miktar: islem.hurdaMiktar,
                kullanim_alani: islem.kullanim_alani,
                proje_adi: islem.proje_adi,
                makine: islem.makine,
                calisan_ad: islem.calisan_ad,
                calisan_soyad: islem.calisan_soyad,
                musteri_adi: islem.musteri_adi,
                kullanici: islem.kullanici_ad && islem.kullanici_soyad ? 
                    `${islem.kullanici_ad} ${islem.kullanici_soyad}` : '-'
            };
        });
        
        return formattedIslemler;
    } catch (error) {
        console.error("Parça işlemleri yükleme hatası:", error);
        return [];
    }
}



// Boru ve Mil için parça listesini yükle
async function loadParcaList(hammaddeId) {
    try {
        const result = await window.electronAPI.invoke.database.getParcalarByHammaddeId(hammaddeId);
        
        const parcalarTable = document.getElementById('parcalarTable');
        const tableBody = parcalarTable.getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
        
        if (!result.success || !result.parcalar || result.parcalar.length === 0) {
            const row = tableBody.insertRow();
            row.innerHTML = '<td colspan="8" class="text-center">Parça bulunamadı</td>';
            return;
        }
        
        // Hammadde bilgilerini al (kalinlik, cap, uzunluk vb. için gerekli)
        const hammaddeResult = await window.electronAPI.invoke.database.getHammaddeById(hammaddeId);
        const hammadde = hammaddeResult.success ? hammaddeResult.hammadde : null;
        const hammaddeTuru = hammadde?.hammadde_turu || 'sac';
        
        result.parcalar.forEach(parca => {
            const row = tableBody.insertRow();
            
            // Parça No
            row.insertCell(0).textContent = `#${parca.parca_no}`;
            
            // Barkod Kodu
            row.insertCell(1).textContent = parca.barkod_kodu || 'Belirtilmemiş';
            
            // Boyut - Boru ve Mil için farklı formatlama
            const boyutCell = row.insertCell(2);
            if (hammaddeTuru === 'boru') {
                boyutCell.textContent = `Ø${hammadde.cap}x${hammadde.kalinlik}x${hammadde.uzunluk} mm`;
            } else if (hammaddeTuru === 'mil') {
                boyutCell.textContent = `Ø${hammadde.cap}x${hammadde.uzunluk} mm`;
            } else {
                boyutCell.textContent = 'Belirtilmemiş';
            }
            
            // Durum
            const durumCell = row.insertCell(3);
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
            row.insertCell(4).textContent = `${Number(parca.orijinal_kilo).toFixed(2)} kg`;
            
            // Kalan Kilo
            row.insertCell(5).textContent = `${Number(parca.kalan_kilo).toFixed(2)} kg`;
            
            // Kullanım Oranı
            row.insertCell(6).textContent = `%${Number(parca.kullanim_orani).toFixed(2)}`;
            
            // İşlemler
            const islemlerCell = row.insertCell(7);
            if (parca.durum !== 'TUKENDI') {
                islemlerCell.innerHTML = `
                    <div class="action-buttons">
                        <button class="action-btn process" title="İşlem Yap" onclick="openIslemModal(${parca.id}, ${parca.parca_no})">
                            <i class="fas fa-cut"></i>
                        </button>
                    </div>
                `;
            } else {
                islemlerCell.textContent = 'Tükenmiş';
            }
        });
    } catch (error) {
        console.error('Parça listesi yükleme hatası:', error);
        
        const parcalarTable = document.getElementById('parcalarTable');
        const tableBody = parcalarTable.getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
        
        const row = tableBody.insertRow();
        row.innerHTML = '<td colspan="8" class="text-center">Parça listesi yüklenirken hata oluştu</td>';
    }
  }

window.loadPlakaParcaList = async function(hammaddeId) {
  try {
    // Plaka gruplarını al
    const plakaGruplariResult = await window.electronAPI.invoke.database.getPlakaGruplariByHammaddeId(hammaddeId);
    
    // Toplu liste oluştur
    let tumParcalar = [];
    
    // Plaka gruplarından gelen parçaları ekle
    if (plakaGruplariResult.success && plakaGruplariResult.gruplar && plakaGruplariResult.gruplar.length > 0) {
      for (const grup of plakaGruplariResult.gruplar) {
        const grupParcalarResult = await window.electronAPI.invoke.database.getParcalarByPlakaGrubuId(grup.id);
        
        if (grupParcalarResult.success && grupParcalarResult.parcalar && grupParcalarResult.parcalar.length > 0) {
          // Parçalara grup bilgisini ekle
          const parcalar = grupParcalarResult.parcalar.map(parca => ({
            ...parca,
            plaka_stok_kodu: grup.stok_kodu,
            kaynak_tipi: 'grup'
          }));
          
          tumParcalar = [...tumParcalar, ...parcalar];
        }
      }
    }
    
    // Parçaları listele
    const parcalarTable = document.getElementById('parcalarTable');
    const tableBody = parcalarTable.getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';
    
    if (tumParcalar.length === 0) {
      const row = tableBody.insertRow();
      row.innerHTML = '<td colspan="8" class="text-center">Parça bulunamadı</td>';
      return;
    }
    
    // Her bir parçayı tabloya ekle
    tumParcalar.forEach(parca => {
      const row = tableBody.insertRow();
      
      // Parça No
      row.insertCell(0).textContent = `#${parca.parca_no}`;
      
      // Plaka/Grup No
      row.insertCell(1).textContent = `#${parca.plaka_stok_kodu} (Grup)`;
      
      // En x Boy
      const enBoyCell = row.insertCell(2);
      if (parca.en != null && parca.boy != null) {
        enBoyCell.textContent = `${parca.en} x ${parca.boy} mm`;
      } else {
        enBoyCell.textContent = 'Belirtilmemiş';
      }
      
      // Durum
      const durumCell = row.insertCell(3);
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
      row.insertCell(4).textContent = `${Number(parca.orijinal_kilo).toFixed(2)} kg`;
      
      // Kalan Kilo
      row.insertCell(5).textContent = `${Number(parca.kalan_kilo).toFixed(2)} kg`;
      
      // Kullanım Oranı
      row.insertCell(6).textContent = `%${Number(parca.kullanim_orani).toFixed(2)}`;
      
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
  } catch (error) {
    console.error('Plaka parça listesi yükleme hatası:', error);
    
    const parcalarTable = document.getElementById('parcalarTable');
    const tableBody = parcalarTable.getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';
    
    const row = tableBody.insertRow();
    row.innerHTML = '<td colspan="8" class="text-center">Parça listesi yüklenirken hata oluştu</td>';
  }
}






window.addKalanParca = addKalanParca;
window.updateKalanParcaListUI = updateKalanParcaListUI;
window.removeKalanParca = removeKalanParca;
window.setupKalanParcaSwitchHandlers = setupKalanParcaSwitchHandlers;
window.setupKullanilanMiktarChangeHandlers = setupKullanilanMiktarChangeHandlers;
window.updateParcaHurdaHesaplama = updateParcaHurdaHesaplama;
window.removeParcaKalanParca = removeParcaKalanParca;
window.updateParcaKalanParcaListUI = updateParcaKalanParcaListUI;
window.resetParcaKalanParcaList = resetParcaKalanParcaList;
window.addParcaKalanParca = addParcaKalanParca;
window.hesaplaParcaKalanParca = hesaplaParcaKalanParca;
window.updatePlakaHurdaHesaplama = updatePlakaHurdaHesaplama;
window.saveParcaIslem = saveParcaIslem;
window.calculatePlakaWithKalanParca = calculatePlakaWithKalanParca;
window.openParcaIslemModal = openParcaIslemModal;
window.loadParcaIslemleri = loadParcaIslemleri;
window.loadParcaList = loadParcaList;
window.loadPlakaParcaList = loadPlakaParcaList;
