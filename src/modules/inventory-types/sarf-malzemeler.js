

async function loadSarfMalzemeListesi() {
    try {
        console.log('Sarf malzeme listesi yükleniyor...');
        
        // Sayfa elementini kontrol et
        const sarfMalzemeListesi = document.getElementById('sarf-malzeme-listesi');
        if (!sarfMalzemeListesi) {
            console.error('Sarf malzeme listesi sayfası elementi bulunamadı!');
            return;
        }
        
        // Tablo elementini kontrol et
        const sarfMalzemeTable = document.getElementById('sarfMalzemeTable');
        if (!sarfMalzemeTable) {
            console.error('sarfMalzemeTable elementi bulunamadı!');
            return;
        }
        
        const tableBody = sarfMalzemeTable.getElementsByTagName('tbody')[0];
        if (!tableBody) {
            console.error('sarfMalzemeTable tbody elementi bulunamadı!');
            return;
        }
        
        // Tabloyu temizle
        tableBody.innerHTML = '';
        
        // API kontrolü
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Veri yüklenemedi. API erişimi yok.</td></tr>';
            return;
        }

        // Sarf malzeme verilerini al
        const result = await window.electronAPI.invoke.database.getAllSarfMalzeme();
        console.log('getAllSarfMalzeme sonucu:', result);
        
        // Sonuç kontrolü
        if (!result.success) {
            console.error('Sarf malzeme verisi alınamadı:', result.message);
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center">Veri alınamadı: ${result.message}</td></tr>`;
            return;
        }
        
        if (!result.sarfMalzemeler || result.sarfMalzemeler.length === 0) {
            console.log('Sarf malzeme bulunamadı');
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Sarf malzeme kaydı bulunamadı</td></tr>';
            return;
        }
        
        console.log('Sarf malzeme sayısı:', result.sarfMalzemeler.length);
        
        // Sarf malzemeleri tabloya ekle
        result.sarfMalzemeler.forEach(malzeme => {
            const row = tableBody.insertRow();
            
            // Her satıra ekleme tarihini data attribute olarak ekle
            row.setAttribute('data-ekleme-tarihi', malzeme.ekleme_tarihi);
            
            // Stok Kodu
            row.insertCell(0).textContent = malzeme.stok_kodu;
            
            // Malzeme Adı
            row.insertCell(1).textContent = malzeme.malzeme_adi;
            
            // Birim ve Toplam Miktar sütunları kaldırıldı
            
            // Kalan Miktar
            row.insertCell(2).textContent = `${Number(malzeme.kalan_miktar).toFixed(2)} ${malzeme.birim}`;
            
            // Barkod
            row.insertCell(3).textContent = malzeme.barkod;
            
            // Durumu
            const durumCell = row.insertCell(4);
            let durumText = '';
            let durumClass = '';
            
            switch (malzeme.durum) {
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
            const islemlerCell = row.insertCell(5);
            islemlerCell.innerHTML = `
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewSarfMalzemeDetail(${malzeme.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="openSarfMalzemeIslemModal(${malzeme.id})">
                   <i class="fa-solid fa-right-from-bracket" style="color: #f29121;"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteSarfMalzeme(${malzeme.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        
        console.log('Sarf malzeme listesi yüklendi!');
        
        // Sayfa geçişini güvence altına al
        const navLinks = document.querySelectorAll('.nav-links li a');
        navLinks.forEach(l => l.parentElement.classList.remove('active'));
        
        const sarfMalzemeLink = document.querySelector('a[data-page="sarf-malzeme-listesi"]');
        if (sarfMalzemeLink) {
            sarfMalzemeLink.parentElement.classList.add('active');
        }
        
        // Tüm sayfaları gizle
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        
        // Sarf malzeme listesi sayfasını göster
        sarfMalzemeListesi.classList.add('active');
        
    } catch (error) {
        console.error('Sarf malzeme listesi yükleme hatası:', error);
        
        const sarfMalzemeTable = document.getElementById('sarfMalzemeTable');
        if (sarfMalzemeTable) {
            const tableBody = sarfMalzemeTable.getElementsByTagName('tbody')[0];
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Veri yüklenirken beklenmedik bir hata oluştu</td></tr>';
            }
        }
    }
}



async function saveSarfMalzeme(e) {
    e.preventDefault();
    e.stopPropagation();

    // Form değerlerini al - sadece malzeme adı ve birim
    const sarfMalzemeData = {
        malzeme_adi: document.getElementById('sarfMalzemeAdi').value.trim(),
        birim: document.getElementById('sarfMalzemeBirim').value,
        miktar: 0, // Başlangıçta miktar 0
        kritik_seviye: 0, // Başlangıçta kritik seviye 0
        ekleyen_id: currentUser ? currentUser.id : 1
    };

    try {
        // API erişimi kontrol et
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Sarf malzeme kaydetme metodu kullanılamıyor');
            showToast('Sarf malzeme kaydedilemedi. API erişimi yok.', 'error');
            return;
        }
        
        // Önce mevcut sarf malzeme kontrolü yap
        const checkResult = await window.electronAPI.invoke.database.checkSarfMalzemeExists(
            sarfMalzemeData.malzeme_adi, 
            sarfMalzemeData.birim
        );
        
        if (checkResult.success && checkResult.exists) {
            // Aynı isim ve birimde sarf malzeme var, toast mesajı göster ve o sayfaya yönlendir
            const existingItem = checkResult.sarfMalzeme;
            
            // Toast mesajını göster
            showToast(`"${sarfMalzemeData.malzeme_adi}" adlı malzeme zaten mevcut. O ürüne yönlendiriliyorsunuz.`, 'warning', 5000);
            
            // Sayfayı değiştir ve sarf malzeme listesine git
            setTimeout(() => {
                // Sarf malzeme listesine git
                document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
                document.getElementById('sarf-malzeme-listesi').classList.add('active');
                
                // Yan menüdeki aktif linki de güncelle
                const navLinks = document.querySelectorAll('.nav-links li a');
                navLinks.forEach(l => l.parentElement.classList.remove('active'));
                document.querySelector('a[data-page="sarf-malzeme-listesi"]').parentElement.classList.add('active');
                
                // Arama kutusuna malzeme adını yaz ve aramayı çalıştır
                document.getElementById('sarfMalzemeAra').value = sarfMalzemeData.malzeme_adi;
                searchSarfMalzeme();
                
                // İlgili satırı vurgula
                setTimeout(() => {
                    const rows = document.getElementById('sarfMalzemeTable').querySelectorAll('tbody tr');
                    rows.forEach(row => {
                        if (row.cells[0].textContent === existingItem.stok_kodu) {
                            row.classList.add('highlighted-row');
                            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            
                            // 5 saniye sonra vurgulamayı kaldır
                            setTimeout(() => {
                                row.classList.remove('highlighted-row');
                            }, 5000);
                        }
                    });
                }, 500);
            }, 1000); // 1 saniye sonra yönlendirme yapılıyor
            
            return;
        }

        // Mevcut sarf malzeme yoksa veya kullanıcı yine de eklemek istiyorsa kaydet
        const result = await window.electronAPI.invoke.database.addSarfMalzeme(sarfMalzemeData);

        if (result.success) {
            // Başarılı bildirimi toast ile göster
            showToast(`Sarf malzeme başarıyla eklendi.\nStok Kodu: ${result.stokKodu}\nBarkod: ${result.barkod}`, 'success');

            // Formu temizle
            document.getElementById('sarfMalzemeForm').reset();

            // Dashboard'ı güncelle
            updateDashboard();
            
            // Sarf malzeme listesi sayfasına geçiş yapılıyor
            setTimeout(() => {
                // Sarf malzeme listesi güncelleme işlemleri
                loadSarfMalzemeListesi();
                
                // Sarf malzeme listesi sayfasına geçiş yap
                document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
                document.getElementById('sarf-malzeme-listesi').classList.add('active');

                // Yan menüdeki aktif linki de güncelleyelim
                const navLinks = document.querySelectorAll('.nav-links li a');
                navLinks.forEach(l => l.parentElement.classList.remove('active'));
                document.querySelector('a[data-page="sarf-malzeme-listesi"]').parentElement.classList.add('active');
                
                // Yeni eklenen ürünü vurgula
                setTimeout(() => {
                    const rows = document.getElementById('sarfMalzemeTable').querySelectorAll('tbody tr');
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
            }, 1000); // 1 saniye sonra yönlendirme yapılıyor
        } else {
            showToast('Hata: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Sarf malzeme kaydetme hatası:', error);
        showToast('Sarf malzeme kaydedilirken bir hata oluştu. Daha sonra tekrar deneyin.', 'error');
    }
}


// Update the loadSarfMalzemeGirisGecmisi function to remove the description field
async function loadSarfMalzemeGirisGecmisi(sarfMalzemeId) {
    try {
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            return;
        }

        const result = await window.electronAPI.invoke.database.getSarfMalzemeGirisGecmisi(sarfMalzemeId);

        const girisGecmisiTable = document.getElementById('sarfGirisGecmisiTable');
        if (!girisGecmisiTable) {
            console.error('sarfGirisGecmisiTable elementi bulunamadı!');
            return;
        }
        
        // Önce tablo başlığını (thead) yeniden oluştur - Güncelleme sütunu eklendi
        const tableHead = girisGecmisiTable.getElementsByTagName('thead')[0];
        if (tableHead) {
            tableHead.innerHTML = `
                <tr>
                    <th>Tarih</th>
                    <th>Miktar</th>
                    <th>Birim Fiyat</th>
                    <th>Para Birimi</th>
                    <th>Toplam Tutar</th>
                    <th>Tedarikçi</th>
                    <th>Ekleyen</th>
                    <th>İşlem</th>
                </tr>
            `;
        }
        
        const tableBody = girisGecmisiTable.getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
        
        if (!result.success || !result.girisGecmisi || result.girisGecmisi.length === 0) {
            const row = tableBody.insertRow();
            row.innerHTML = '<td colspan="8" class="text-center">Giriş geçmişi bulunamadı</td>'; // 8 sütun (güncelleme sütunu eklenmiş)
            return;
        }
        
        // Son girişten sonra işlem var mı kontrol et
        const islemlerResult = await window.electronAPI.invoke.database.getSarfMalzemeIslemleri(sarfMalzemeId);
        const islemler = islemlerResult.success ? islemlerResult.islemler : [];
        
        // Tarihe göre sırala (en yeni en üstte)
        const sortedGirisGecmisi = result.girisGecmisi
            .sort((a, b) => new Date(b.giris_tarihi) - new Date(a.giris_tarihi));
            
        // Girisler ve işlemler için tarih haritası oluştur
        const girislerMap = new Map();
        sortedGirisGecmisi.forEach(giris => {
            girislerMap.set(giris.id, new Date(giris.giris_tarihi));
        });
        
        const islemlerMap = new Map();
        islemler.forEach(islem => {
            islemlerMap.set(islem.id, new Date(islem.islem_tarihi));
        });
        
        // Son giriş ve son işlem
        const sonGiris = sortedGirisGecmisi.length > 0 ? sortedGirisGecmisi[0] : null;
        const sonGirisTarihi = sonGiris ? new Date(sonGiris.giris_tarihi) : null;
        
        // Son girişten sonra işlem var mı kontrol et
        const sonGiristenSonraIslemVar = islemler.some(islem => {
            const islemTarihi = new Date(islem.islem_tarihi);
            return islemTarihi > sonGirisTarihi;
        });

        sortedGirisGecmisi.forEach((giris, index) => {
            const row = tableBody.insertRow();
            const girisTarihi = new Date(giris.giris_tarihi);
            
            // Girişten sonra işlem var mı kontrol et
            const giristenSonraIslemVar = islemler.some(islem => {
                const islemTarihi = new Date(islem.islem_tarihi);
                return islemTarihi > girisTarihi;
            });
            
            // Bu giriş son giriş mi?
            const buGirisSonGiris = index === 0;
            
            // Güncelleme yapılabilir mi? Son giriş ve sonrasında işlem yoksa
            const guncellenebilir = buGirisSonGiris && !giristenSonraIslemVar;

            // Tarih
            const cell1 = row.insertCell(0);
            cell1.textContent = girisTarihi.toLocaleString('tr-TR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Miktar
            const cell2 = row.insertCell(1);
            cell2.textContent = `${Number(giris.miktar).toFixed(2)} ${giris.birim || 'adet'}`;

            // Birim Fiyat
            const cell3 = row.insertCell(2);
            cell3.textContent = `${Number(giris.birim_fiyat).toFixed(2)}`;

            // Para Birimi - Tedarikçi alanından çıkarılacak
            const cell4 = row.insertCell(3);
            const tedarikciStr = giris.tedarikci || '';
            // Para birimi bilgisini parantez içinde aramaya çalış
            const paraBirimiMatch = tedarikciStr.match(/\((.*?)\)/);
            const paraBirimi = paraBirimiMatch ? paraBirimiMatch[1] : 'TRY'; // Yoksa TRY varsayılan
            cell4.textContent = paraBirimi;

            // Toplam Tutar
            const cell5 = row.insertCell(4);
            const toplamTutar = Number(giris.miktar) * Number(giris.birim_fiyat);
            cell5.textContent = `${toplamTutar.toFixed(2)} ${paraBirimi}`;

            // Tedarikçi - Parantezli para birimi bilgisini temizle
            const cell6 = row.insertCell(5);
            const cleanTedarikci = tedarikciStr.replace(/\s*\(.*?\)\s*/, '');
            cell6.textContent = cleanTedarikci || 'Belirtilmemiş';

            // Ekleyen
            const cell7 = row.insertCell(6);
            cell7.textContent = `${giris.kullanici_ad} ${giris.kullanici_soyad}`;
            
            // İşlem (Güncelle butonu)
            const cell8 = row.insertCell(7);
            if (guncellenebilir) {
                cell8.innerHTML = `
                    <button class="action-btn edit" title="Güncelle" onclick="openSarfMalzemeGirisGuncelleModal(${giris.id}, ${sarfMalzemeId}, ${giris.miktar}, '${giris.birim}')">
                        <i class="fas fa-edit"></i>
                    </button>
                `;
            } else {
                cell8.innerHTML = `
                    <button class="action-btn edit edited" title="İşlem yapıldığı için güncellenemez" disabled>
                        <i class="fas fa-ban"></i>
                    </button>
                `;
            }
        });
    } catch (error) {
        console.error('Sarf malzeme giriş geçmişi yükleme hatası:', error);
        
        const sarfGirisGecmisiTable = document.getElementById('sarfGirisGecmisiTable');
        if (sarfGirisGecmisiTable) {
            const tableBody = sarfGirisGecmisiTable.getElementsByTagName('tbody')[0];
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Giriş geçmişi yüklenirken hata oluştu</td></tr>'; // 8 sütun
            }
        }
    }
}



// Güncellenmiş openSarfMalzemeGirisGuncelleModal fonksiyonu
async function openSarfMalzemeGirisGuncelleModal(girisId, sarfMalzemeId, mevcutMiktar, birim) {
    try {
        // Global değişkenlere kaydet
        currentSarfMalzemeGirisId = girisId;
        currentSarfMalzemeId = sarfMalzemeId;
        
        // Modal başlığını güncelle
        document.getElementById('sarfMalzemeGirisGuncelleHeader').textContent = 'Sarf Malzeme Giriş Güncelleme';
        
        // Mevcut değerleri göster
        const mevcutMiktarElem = document.getElementById('sarfMalzemeGunceleMevcutMiktar');
        if (mevcutMiktarElem) {
            mevcutMiktarElem.textContent = `${mevcutMiktar} ${birim}`;
        }
        
        // Giriş detaylarını al
        const girisDetaylari = await window.electronAPI.invoke.database.getSarfMalzemeGirisById(girisId);
        if (girisDetaylari.success && girisDetaylari.giris) {
            const giris = girisDetaylari.giris;
            
            // Form alanlarını mevcut değerlerle doldur
            document.getElementById('sarfMalzemeGirisGuncelleMiktar').value = mevcutMiktar;
            
            // Birim fiyat
            if (document.getElementById('sarfMalzemeGirisGuncelleBirimFiyat')) {
                document.getElementById('sarfMalzemeGirisGuncelleBirimFiyat').value = giris.birim_fiyat || '';
            }
            
            // Para birimi seçimi
            if (document.getElementById('sarfMalzemeGirisGuncelleBirimFiyatTuru')) {
                // Tedarikçi alanından para birimi bilgisi çıkar (Örn: "Tedarikçi Adı (USD)")
                let birimFiyatTuru = 'TRY'; // Varsayılan
                const tedarikciStr = giris.tedarikci || '';
                const paraBirimiMatch = tedarikciStr.match(/\((.*?)\)/);
                
                if (paraBirimiMatch && paraBirimiMatch[1]) {
                    birimFiyatTuru = paraBirimiMatch[1];
                }
                
                document.getElementById('sarfMalzemeGirisGuncelleBirimFiyatTuru').value = birimFiyatTuru;
            }
            
            // Tedarikçi
            if (document.getElementById('sarfMalzemeGirisGuncelleTedarikci')) {
                // Tedarikçi adını para birimi olmadan al
                let tedarikci = giris.tedarikci || '';
                tedarikci = tedarikci.replace(/\s*\(.*?\)\s*/, '');
                
                document.getElementById('sarfMalzemeGirisGuncelleTedarikci').value = tedarikci;
            }
            
            // Kritik seviye
            const sarfMalzemeDetay = await window.electronAPI.invoke.database.getSarfMalzemeById(sarfMalzemeId);
            if (sarfMalzemeDetay.success && sarfMalzemeDetay.sarfMalzeme) {
                document.getElementById('sarfMalzemeGirisGuncelleKritikSeviye').value = 
                    sarfMalzemeDetay.sarfMalzeme.kritik_seviye || 0;
            }
            
            // Gizli alanları doldur
            document.getElementById('sarfMalzemeGirisGuncelleSarfMalzemeId').value = sarfMalzemeId;
            document.getElementById('sarfMalzemeGirisGuncelleGirisId').value = girisId;
        }
        
        // Tedarikçi listesini doldur
        await loadTedarikciListesi();
        
        // Yeni tedarikçi ekleme butonu için event listener
        const yeniTedarikciEkleBtn = document.getElementById('sarfMalzemeGirisGuncelleYeniTedarikciEkleBtn');
        if (yeniTedarikciEkleBtn) {
            // Önceki event listener'ları temizle
            const newBtn = yeniTedarikciEkleBtn.cloneNode(true);
            yeniTedarikciEkleBtn.parentNode.replaceChild(newBtn, yeniTedarikciEkleBtn);
            
            // Yeni event listener ekle
            newBtn.addEventListener('click', function() {
                openNewTedarikciModal('sarfMalzemeGirisGuncelleModal');
            });
        }
        
        // Modalı aç
        openModal('sarfMalzemeGirisGuncelleModal');
        
        // Miktar alanına odaklan
        setTimeout(() => {
            document.getElementById('sarfMalzemeGirisGuncelleMiktar').focus();
        }, 300);
    } catch (error) {
        console.error('Sarf malzeme giriş güncelleme modalı açma hatası:', error);
        showToast('Modal açılırken bir hata oluştu', 'error');
    }
}

// Güncelleme fonksiyonu
// Güncellenmiş guncelleSarfMalzemeGirisi fonksiyonu
async function guncelleSarfMalzemeGirisi() {
    try {
        // Form değerlerini al
        const girisId = document.getElementById('sarfMalzemeGirisGuncelleGirisId').value;
        const sarfMalzemeId = document.getElementById('sarfMalzemeGirisGuncelleSarfMalzemeId').value;
        const yeniMiktar = parseFloat(document.getElementById('sarfMalzemeGirisGuncelleMiktar').value);
        const birimFiyat = parseFloat(document.getElementById('sarfMalzemeGirisGuncelleBirimFiyat').value || 0);
        const birimFiyatTuru = document.getElementById('sarfMalzemeGirisGuncelleBirimFiyatTuru').value;
        const tedarikci = document.getElementById('sarfMalzemeGirisGuncelleTedarikci').value.trim();
        const kritikSeviye = parseFloat(document.getElementById('sarfMalzemeGirisGuncelleKritikSeviye').value || 0);
        
        // Validasyon
        if (!yeniMiktar || yeniMiktar <= 0) {
            showModalError('sarfMalzemeGirisGuncelleModal', 'Lütfen geçerli bir miktar girin.');
            return;
        }
        
        // API kontrolü
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            showErrorMessage('Hata', 'İşlem kaydedilemedi. API erişimi yok.');
            return;
        }
        
        // İşlem kaydediliyor mesajını göster
        showModalSuccess('sarfMalzemeGirisGuncelleModal', 'Güncelleme yapılıyor...');
        
        // Güncelleme işlemi
        const result = await window.electronAPI.invoke.database.updateSarfMalzemeGirisi({
            giris_id: girisId,
            sarf_malzeme_id: sarfMalzemeId,
            yeni_miktar: yeniMiktar,
            birim_fiyat: birimFiyat,
            birim_fiyat_turu: birimFiyatTuru,
            tedarikci: tedarikci,
            kritik_seviye: kritikSeviye
        });
        
        if (result.success) {
            showToast('Sarf malzeme girişi başarıyla güncellendi.', 'success');
            
            // Giriş modalını kapat
            closeModal('sarfMalzemeGirisGuncelleModal');
            
            // Dashboard'ı güncelle
            updateDashboard();
            
            // Sarf malzeme listesini güncelle
            await loadSarfMalzemeListesi();
            
            // Sarf malzeme detayını yeniden yükle
            if (currentSarfMalzemeId) {
                await viewSarfMalzemeDetail(currentSarfMalzemeId);
            }
        } else {
            showToast('Hata: ' + (result.message || 'Bilinmeyen bir hata oluştu'), 'error');
        }
    } catch (error) {
        console.error('Sarf malzeme girişi güncelleme hatası:', error);
        showErrorMessage('İşlem Hatası', 'Sarf malzeme girişi güncellenirken bir hata oluştu: ' + error.message);
    }
}




// Event listener'lar için yardımcı fonksiyon
function setupSarfMalzemeGirisUpdateEvents() {
    document.addEventListener('DOMContentLoaded', function() {
        // Sarf malzeme giriş güncelle kaydet butonu
        const sarfMalzemeGirisGuncelleKaydetBtn = document.getElementById('sarfMalzemeGirisGuncelleKaydetBtn');
        if (sarfMalzemeGirisGuncelleKaydetBtn) {
            // Önceki event listener'ları temizle
            const newBtn = sarfMalzemeGirisGuncelleKaydetBtn.cloneNode(true);
            sarfMalzemeGirisGuncelleKaydetBtn.parentNode.replaceChild(newBtn, sarfMalzemeGirisGuncelleKaydetBtn);
            
            // Yeni event listener ekle
            newBtn.addEventListener('click', guncelleSarfMalzemeGirisi);
        }
    });
}


// setupSarfMalzemeGirisUpdateEvents();



document.addEventListener('DOMContentLoaded', function() {
    // Sarf malzeme giriş güncelle kaydet butonu
    const sarfMalzemeGirisGuncelleKaydetBtn = document.getElementById('sarfMalzemeGirisGuncelleKaydetBtn');
    if (sarfMalzemeGirisGuncelleKaydetBtn) {
        sarfMalzemeGirisGuncelleKaydetBtn.addEventListener('click', guncelleSarfMalzemeGirisi);
    }
});




async function kaydetSarfMalzemeGirisi() {
    try {
        // Form elemanlarını kontrol et
        const sarfMalzemeIdElement = document.getElementById('sarfMalzemeGirisSarfMalzemeId');
        const miktarElement = document.getElementById('sarfMalzemeGirisMiktar');
        const birimFiyatElement = document.getElementById('sarfMalzemeGirisBirimFiyat');
        const birimFiyatTuruElement = document.getElementById('sarfMalzemeGirisBirimFiyatTuru');
        const tedarikciElement = document.getElementById('sarfMalzemeGirisTedarikci');
        const kritikSeviyeElement = document.getElementById('sarfMalzemeGirisKritikSeviye');
        
        // Form değerlerini al
        const sarfMalzemeId = sarfMalzemeIdElement.value;
        const miktar = parseFloat(miktarElement.value);
        const birimFiyat = parseFloat(birimFiyatElement.value);
        const birimFiyatTuru = birimFiyatTuruElement.value; // Para birimi (TRY, USD, EUR)
        const tedarikci = tedarikciElement.value.trim();
        const kritikSeviye = parseFloat(kritikSeviyeElement.value);
        
        // Doğrulama
        if (!sarfMalzemeId) {
            showModalError('sarfMalzemeGirisModal', 'Sarf malzeme ID geçersiz.');
            return;
        }
        
        if (!miktar || miktar <= 0) {
            showModalError('sarfMalzemeGirisModal', 'Lütfen geçerli bir miktar girin.');
            return;
        }
        
        if (!birimFiyat || birimFiyat <= 0) {
            showModalError('sarfMalzemeGirisModal', 'Lütfen geçerli bir birim fiyat girin.');
            return;
        }
        
        // Tedarikçi zorunlu
        if (!tedarikci) {
            showModalError('sarfMalzemeGirisModal', 'Lütfen tedarikçi bilgisi girin.');
            return;
        }
        
        // Kritik seviye zorunlu
        if (!kritikSeviye || kritikSeviye <= 0) {
            showModalError('sarfMalzemeGirisModal', 'Lütfen geçerli bir kritik seviye girin.');
            return;
        }
        
        // Giriş verisi
        const girisData = {
            sarf_malzeme_id: sarfMalzemeId,
            miktar: miktar,
            birim_fiyat: birimFiyat,
            birim_fiyat_turu: birimFiyatTuru, // Para birimi ekle
            tedarikci: tedarikci, // Frontend'den tedarikçi değerini al
            kritik_seviye: kritikSeviye, // Kritik seviye eklendi
            ekleyen_id: currentUser ? currentUser.id : 1
        };
        
        // İşlem kaydediliyor mesajını göster
        showModalSuccess('sarfMalzemeGirisModal', 'Giriş kaydediliyor...');
        
        // API üzerinden kaydet - invoke kullanıyoruz, pool'a doğrudan erişmiyoruz
        const result = await window.electronAPI.invoke.database.kaydetSarfMalzemeGirisi(girisData);
        
        if (result.success) {
            showToast('Sarf malzeme girişi başarıyla kaydedildi.', 'success');
            
            // Giriş modalını kapat
            closeModal('sarfMalzemeGirisModal');
            
            // Formu sıfırla
            const form = document.getElementById('sarfMalzemeGirisForm');
            if (form) form.reset();
            
            // Dashboard'ı güncelle
            updateDashboard();
            
            // Sarf malzeme listesini güncelle
            await loadSarfMalzemeListesi();
            
            // Sarf malzeme detayını yeniden yükle
            if (currentSarfMalzemeId) {
                await viewSarfMalzemeDetail(currentSarfMalzemeId);
            }
        } else {
            showErrorMessage('İşlem Hatası', 'Hata: ' + (result.message || 'Bilinmeyen bir hata oluştu'));
        }
    } catch (error) {
        console.error('Sarf malzeme girişi kaydetme hatası:', error);
        showErrorMessage('İşlem Hatası', 'Sarf malzeme girişi kaydedilirken bir hata oluştu: ' + error.message);
    }
  }



  
// Setup for sarf malzeme giriş event handlers
function setupSarfMalzemeGirisButtons() {
    // Yeni sarf malzeme girişi butonu
    const yeniSarfMalzemeGirisBtn = document.getElementById('yeniSarfMalzemeGirisBtn');
    if (yeniSarfMalzemeGirisBtn) {
        yeniSarfMalzemeGirisBtn.addEventListener('click', async function() {
            console.log('Yeni sarf malzeme girişi butonu tıklandı');
            
            try {
                // Formu sıfırla
                const sarfMalzemeGirisForm = document.getElementById('sarfMalzemeGirisForm');
                if (sarfMalzemeGirisForm) {
                    sarfMalzemeGirisForm.reset();
                    console.log('Sarf malzeme giriş formu sıfırlandı');
                } else {
                    console.error('sarfMalzemeGirisForm bulunamadı');
                }
                
                // Sarf malzeme ID'sini ayarla
                const sarfMalzemeGirisSarfMalzemeId = document.getElementById('sarfMalzemeGirisSarfMalzemeId');
                if (sarfMalzemeGirisSarfMalzemeId) {
                    sarfMalzemeGirisSarfMalzemeId.value = currentSarfMalzemeId;
                    console.log('Sarf malzeme ID ayarlandı:', currentSarfMalzemeId);
                } else {
                    console.error('sarfMalzemeGirisSarfMalzemeId bulunamadı');
                }
                
                // Detay modalını kapat
                closeModal('sarfMalzemeDetayModal');
                
                // Sarf malzeme giriş modalını aç
                openModal('sarfMalzemeGirisModal');
            } catch (error) {
                console.error('Yeni sarf malzeme girişi açılırken hata:', error);
                showErrorMessage('Hata', 'Sarf malzeme giriş formu açılırken bir hata oluştu.');
            }
        });
        console.log('Yeni sarf malzeme girişi butonu için olay dinleyicisi eklendi');
    } else {
        console.error('yeniSarfMalzemeGirisBtn bulunamadı');
    }
    
    // Sarf malzeme giriş kaydet butonu
    const sarfMalzemeGirisKaydetBtn = document.getElementById('sarfMalzemeGirisKaydetBtn');
    if (sarfMalzemeGirisKaydetBtn) {
        // Önceki olay dinleyicisini kaldır
        const newBtn = sarfMalzemeGirisKaydetBtn.cloneNode(true);
        sarfMalzemeGirisKaydetBtn.parentNode.replaceChild(newBtn, sarfMalzemeGirisKaydetBtn);
        
        // Yeni olay dinleyicisi ekle
        newBtn.addEventListener('click', function() {
            console.log('Sarf malzeme giriş kaydet butonu tıklandı');
            kaydetSarfMalzemeGirisi();
        });
        console.log('Sarf malzeme giriş kaydet butonu için olay dinleyicisi eklendi');
    } else {
        console.error('sarfMalzemeGirisKaydetBtn bulunamadı');
    }
}

async function deleteSarfMalzeme(id) {
    try {
        // Sarf malzeme bilgilerini al
        const result = await window.electronAPI.invoke.database.getSarfMalzemeById(id);
        
        if (!result.success) {
            alert('Sarf malzeme bilgileri alınamadı: ' + result.message);
            return;
        }
        
        const sarfMalzeme = result.sarfMalzeme;
        
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
        
        // İlişkili ikincil stokları kontrol et
        const relatedStoks = await checkRelatedIkincilStokForSarfMalzeme(id);
        
        // Silme mesajını oluştur
        let deleteMessage = `"${sarfMalzeme.malzeme_adi} (${sarfMalzeme.stok_kodu})" sarf malzemesini silmek istediğinizden emin misiniz?`;
        
        // İkincil stok uyarı mesajı
        const ikincilStokWarning = createIkincilStokWarningMessage(relatedStoks);
        
        // Eğer ikincil stok varsa, mesajı birleştir
        const fullMessage = ikincilStokWarning 
            ? `${deleteMessage}\n\n${ikincilStokWarning}` 
            : deleteMessage;
        
        // Silme modalını göster
        window.showDeleteConfirmationModal({
            title: 'Sarf Malzeme Silme İşlemi',
            message: fullMessage,
            ikincilStokWarning: ikincilStokWarning, 
            itemName: `${sarfMalzeme.malzeme_adi} (${sarfMalzeme.stok_kodu})`,
            itemType: 'Sarf Malzeme',
            itemId: id,
            userData: window.globalUserData,
            onConfirm: async (reason) => {
                // Silme işlemini gerçekleştir
                const result = await window.electronAPI.invoke.database.deleteSarfMalzemeWithNotification(
                    id, 
                    reason,
                    window.globalUserData
                );
                
                if (result.success) {
                    // Başarılı ise listeyi güncelle
                    loadSarfMalzemeListesi();
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
        console.error('Sarf malzeme silme hatası:', error);
        alert('Sarf malzeme silinirken bir hata oluştu: ' + error.message);
    }
}




// Sarf malzeme işlemi kaydetme
async function saveSarfMalzemeIslemi() {
    // Form değerlerini al
    const miktar = parseFloat(document.getElementById('sarfMalzemeKullanilanMiktar').value);
    const islemTuru = document.getElementById('sarfMalzemeIslemTuru').value;
    const kullanimAlani = document.getElementById('sarfMalzemeKullanimAlani').value;
    const projeId = document.getElementById('sarfMalzemeProjeSecimi').value;
    
    // Yeni alanlar
    const makineId = document.getElementById('sarfMalzemeMakineSecimi').value;
    const calisanId = document.getElementById('sarfMalzemeCalisanSecimi').value;
    
    // Doğrulama
    if (!miktar || miktar <= 0) {
        showModalError('sarfMalzemeIslemModal', 'Lütfen geçerli bir miktar girin.');
        return;
    }
    
    // Eğer kullanım alanı FasonImalat veya MakineImalat ise proje zorunlu
    if ((kullanimAlani === 'FasonImalat' || kullanimAlani === 'MakineImalat') && !projeId) {
        showModalError('sarfMalzemeIslemModal', 'Lütfen bir proje seçin veya yeni bir proje oluşturun.');
        return;
    }
    
    // Fason İmalat için makine ve çalışan seçimi zorunlu
    if (kullanimAlani === 'FasonImalat') {
        if (!makineId) {
            showModalError('sarfMalzemeIslemModal', 'Lütfen makine seçin.');
            return;
        }
        if (!calisanId) {
            showModalError('sarfMalzemeIslemModal', 'Lütfen alan kişi seçin.');
            return;
        }
    }
    
    // Makine İmalat için çalışan seçimi zorunlu
    if (kullanimAlani === 'MakineImalat' && !calisanId) {
        showModalError('sarfMalzemeIslemModal', 'Lütfen alan kişi seçin.');
        return;
    }
    
    try {
        // API kontrolü
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            showErrorMessage('Hata', 'İşlem kaydedilemedi. API erişimi yok.');
            return;
        }
        
        // Sarf malzeme bilgilerini al ve kalan miktarı kontrol et
        const sarfMalzemeResult = await window.electronAPI.invoke.database.getSarfMalzemeById(currentSarfMalzemeId);
        
        if (!sarfMalzemeResult.success) {
            showErrorMessage('Hata', 'Sarf malzeme bilgileri alınamadı: ' + sarfMalzemeResult.message);
            return;
        }
        
        const sarfMalzeme = sarfMalzemeResult.sarfMalzeme;
        
        // Kullanım veya fire işlemi için miktar kontrolü
        if (islemTuru === 'Kullanım' || islemTuru === 'Fire') {
            const kalanMiktar = parseFloat(sarfMalzeme.kalan_miktar);
            
            if (miktar > kalanMiktar) {
                showModalError('sarfMalzemeIslemModal', 
                    `Kullanmak istediğiniz miktar (${miktar.toFixed(2)} ${sarfMalzeme.birim}) ` +
                    `kalan miktardan (${kalanMiktar.toFixed(2)} ${sarfMalzeme.birim}) fazla.`
                );
                return;
            }
        }

        // İşlem verisi - yeni alanları içerecek şekilde güncellendi
        const islemData = {
            sarf_malzeme_id: currentSarfMalzemeId,
            islem_turu: islemTuru,
            kullanim_alani: kullanimAlani,
            miktar: miktar,
            proje_id: projeId || null,
            kullanici_id: currentUser.id,
            makine: kullanimAlani === 'FasonImalat' ? makineId : null,
            calisan_id: (kullanimAlani === 'FasonImalat' || kullanimAlani === 'MakineImalat') ? calisanId : null
        };
        
        // İşlem kaydediliyor mesajını göster
        showModalSuccess('sarfMalzemeIslemModal', 'İşlem kaydediliyor...');
        
        console.log('Gönderilen işlem verisi:', islemData);
        
        // İşlemi kaydet
        const result = await window.electronAPI.invoke.database.addSarfMalzemeIslemi(islemData);
        
        if (result.success) {
            showToast('Sarf malzeme çıkış işlemi yapıldı.', 'success');
            
            // İşlem modalını kapat
            closeModal('sarfMalzemeIslemModal');
            
            // Formu sıfırla
            document.getElementById('sarfMalzemeKullanilanMiktar').value = '';
            
            // Dashboard'ı güncelle
          updateDashboard();
            
            // Sarf malzeme listesini güncelle
            await loadSarfMalzemeListesi();
            
            // Sarf malzeme detayını yeniden yükle (eğer açıksa)
            if (currentSarfMalzemeId) {
                viewSarfMalzemeDetail(currentSarfMalzemeId);
            }
            
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
                
                console.log(`Sayfa geçişi yapıldı: ${targetPage}`);
            }
        } else {
            showErrorMessage('İşlem Hatası', 'Hata: ' + result.message);
        }
    } catch (error) {
        console.error('İşlem kaydetme hatası:', error);
        showErrorMessage('İşlem Hatası', 'İşlem kaydedilirken bir hata oluştu: ' + error.message);
    }
}


// Sarf malzeme arama fonksiyonu - güncellenmiş
function searchSarfMalzeme() {
    // Arama değerlerini al
    const searchText = document.getElementById('sarfMalzemeAra').value.toLowerCase().trim();
    const durumSecimi = document.getElementById('sarfMalzemeDurumSecimi').value;
    
    // Tablo satırlarını al
    const rows = document.getElementById('sarfMalzemeTable').getElementsByTagName('tbody')[0].rows;
    
    // Her satırı kontrol et
    for (let i = 0; i < rows.length; i++) {
        const stokKodu = rows[i].cells[0].textContent.toLowerCase();
        const malzemeAdi = rows[i].cells[1].textContent.toLowerCase();
        const barkod = rows[i].cells[3].textContent.toLowerCase(); // Artık 3. hücre Barkod
        
        // Durumu al - Şimdi 4. hücrede
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


// Sayfa yüklendiğinde event listener'ları ekle
document.addEventListener('DOMContentLoaded', function() {
    console.log('Basitleştirilmiş sarf malzeme arama event listener\'ları ekleniyor...');
    
    const aramaAlani = document.getElementById('sarfMalzemeAra');
    const durumSecimi = document.getElementById('sarfMalzemeDurumSecimi');
    const aramaButonu = document.getElementById('sarfMalzemeAraBtn');

    // Event listener'ları ekle
    if (aramaAlani) {
        aramaAlani.addEventListener('input', searchSarfMalzeme);
        console.log('Arama alanı input event listener\'ı eklendi');
    } else {
        console.error('Sarf malzeme arama alanı bulunamadı');
    }

    if (durumSecimi) {
        durumSecimi.addEventListener('change', searchSarfMalzeme);
        console.log('Durum seçimi change event listener\'ı eklendi');
    } else {
        console.error('Sarf malzeme durum seçimi bulunamadı');
    }

    if (aramaButonu) {
        aramaButonu.addEventListener('click', searchSarfMalzeme);
        console.log('Arama butonu click event listener\'ı eklendi');
    } else {
        console.error('Arama butonu bulunamadı');
    }
});


async function viewSarfMalzemeDetail(id) {
    try {
        // Modalı önce açalım ki kullanıcı bir şeylerin yüklendiğini görsün
        openModal('sarfMalzemeDetayModal');
        
        // Veri yükleniyor mesajı göster
        document.getElementById('sarfMalzemeDetay').innerHTML = '<div class="loading">Veriler yükleniyor...</div>';
        
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            document.getElementById('sarfMalzemeDetay').innerHTML = '<div class="error">Veri kaynağına erişilemiyor</div>';
            return;
        }

        currentSarfMalzemeId = id;
        
        // Veri çekme işlemini başlat
        const result = await window.electronAPI.invoke.database.getSarfMalzemeById(id);
        
        if (result.success) {
            const sarfMalzeme = result.sarfMalzeme;
            const ekleyen = result.ekleyen;
            
            // Detay alanını doldur
            sarfMalzemeDetay.innerHTML = `
                <div class="detay-row">
                    <div class="detay-label">Stok Kodu:</div>
                    <div class="detay-value">${sarfMalzeme.stok_kodu}</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Malzeme Adı:</div>
                    <div class="detay-value">${sarfMalzeme.malzeme_adi}</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Birim:</div>
                    <div class="detay-value">${sarfMalzeme.birim}</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Barkod:</div>
                    <div class="detay-value">${sarfMalzeme.barkod}</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Toplam Miktar:</div>
                    <div class="detay-value">${Number(sarfMalzeme.toplam_miktar).toFixed(2)} ${sarfMalzeme.birim}</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Kalan Miktar:</div>
                    <div class="detay-value">${Number(sarfMalzeme.kalan_miktar).toFixed(2)} ${sarfMalzeme.birim}</div>
                </div>
                <div class="detay-row">
                    <div class="detay-label">Kritik Seviye:</div>
                    <div class="detay-value">${Number(sarfMalzeme.kritik_seviye).toFixed(2)} ${sarfMalzeme.birim}</div>
                </div>
                
                <div class="detay-row">
                    <div class="detay-label">Ekleme Tarihi:</div>
                    <div class="detay-value">${new Date(sarfMalzeme.ekleme_tarihi).toLocaleString('tr-TR')}</div>
                </div>
            `;
            
            // Giriş geçmişini yükle
            loadSarfMalzemeGirisGecmisi(id);
            
            // Stoğa Geri Dönenler tabını yükle - YENİ
            loadSarfMalzemeStokGeriDonenler(id);
            
            // İşlem geçmişini doldur
            const islemGecmisiTable = document.getElementById('sarfMalzemeIslemGecmisiTable').getElementsByTagName('tbody')[0];
            islemGecmisiTable.innerHTML = '';
            
            if (!result.islemler || result.islemler.length === 0) {
                const row = islemGecmisiTable.insertRow();
                row.innerHTML = '<td colspan="6" class="text-center">İşlem geçmişi bulunamadı</td>';
            } else {
                result.islemler.forEach(islem => {
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
                    
                    // Miktar - Birim eklenmiş
                    const cell3 = row.insertCell(2);
                    cell3.textContent = `${Number(islem.miktar).toFixed(2)} ${sarfMalzeme.birim}`;
                    
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
                            cell4.textContent = islem.kullanim_alani;
                    }
                    
                    // Proje - Sadece proje adını göster
                    const cell5 = row.insertCell(4);
                    cell5.textContent = islem.proje_id ? `${islem.proje_adi}` : 'Belirtilmemiş';
                    
                    // Kullanıcı
                    const cell6 = row.insertCell(5);
                    cell6.textContent = `${islem.kullanici_ad} ${islem.kullanici_soyad}`;
                });
            }
            
            // İlk tab'ı aktif et ve diğerlerini deaktif et
            resetTabSystem();
            
            // Tab sistemini kur
            setupTabSystem();
        } else {
            document.getElementById('sarfMalzemeDetay').innerHTML = `<div class="error">Hata: ${result.message}</div>`;
        }
    } catch (error) {
        console.error('Sarf malzeme detayı getirme hatası:', error);
        document.getElementById('sarfMalzemeDetay').innerHTML = '<div class="error">Beklenmeyen bir hata oluştu</div>';
    }
}

  // 4. Sarf malzeme işlemini silme
  async function deleteSarfMalzemeIslem(islemId) {
    try {
      // İşlem hakkında bilgi al
      const islemResult = await window.electronAPI.invoke.database.getSarfMalzemeIslemById(islemId);
      
      if (!islemResult.success) {
        throw new Error('İşlem bilgileri alınamadı: ' + islemResult.message);
      }
      
      const islem = islemResult.islem;
      const sarfMalzemeId = islem.sarf_malzeme_id;
      
      // Silme işlemi için gerekli verileri hazırla
      const deleteData = {
        islemId: islemId,
        sarfMalzemeId: sarfMalzemeId,
        miktar: islem.miktar
      };
      
      // İşlemi sil ve sarf malzeme stoğunu güncelle
      const result = await window.electronAPI.invoke.database.deleteSarfMalzemeIslemAndRestoreStock(deleteData);
      
      return result;
    } catch (error) {
      console.error('Sarf malzeme işlemi silme hatası:', error);
      return { success: false, message: error.message };
    }
  }


  
function openSarfMalzemeIslemModal(id) {
    try {
        currentSarfMalzemeId = id;
        
        // Sarf malzeme başlığını güncelle
        document.getElementById('sarfMalzemeHeader').textContent = 'Sarf Malzeme İşlemi';
        
        // Sarf malzeme bilgilerini al
        window.electronAPI.invoke.database.getSarfMalzemeById(id)
            .then(result => {
                if (!result.success) {
                    console.error('Sarf malzeme bilgileri alınamadı:', result.message);
                    showErrorMessage('Hata', 'Sarf malzeme bilgileri alınamadı.');
                    return;
                }
                
                const sarfMalzeme = result.sarfMalzeme;
                
                // Kalan miktar bilgisini form içinde göster
                const bilgiAlani = document.getElementById('islemModalBilgi') || document.createElement('div');
                bilgiAlani.id = 'islemModalBilgi';
                bilgiAlani.className = 'form-info';
                bilgiAlani.innerHTML = `
                    <p><strong>Kalan Miktar:</strong> ${Number(sarfMalzeme.kalan_miktar).toFixed(2)} ${sarfMalzeme.birim}</p>
                    <p><i>Not: Kullanılabilir maksimum miktar yukarıdaki değerdir.</i></p>
                `;
                
                // Bilgi alanını forma ekle (eğer zaten yoksa)
                const sarfMalzemeIslemForm = document.querySelector('.sarf-malzeme-islem-form');
                if (sarfMalzemeIslemForm && !document.getElementById('islemModalBilgi')) {
                    sarfMalzemeIslemForm.insertBefore(bilgiAlani, sarfMalzemeIslemForm.firstChild);
                }
                
                // Proje listesini yükle
                loadProjeler().then(() => {
                    // Proje seçimi için dropdown'ı güncelle
                    const projeSecimi = document.getElementById('sarfMalzemeProjeSecimi');
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
                    
                    // İlk kullanım alanı durumuna göre makine/çalışan seçimi göster/gizle
                    toggleMakineSection();
                    
                    // Çalışanları yükle
                    loadCalisanlarForSelect('sarfMalzemeCalisanSecimi');
                    
                    // Modalı aç
                    openModal('sarfMalzemeIslemModal');
                    
                    // Eğer detay modalı açıksa kapat
                    closeModal('sarfMalzemeDetayModal');
                    
                    // Miktar alanına odaklan
                    setTimeout(() => {
                        const miktarInput = document.getElementById('sarfMalzemeKullanilanMiktar');
                        if (miktarInput) miktarInput.focus();
                    }, 300);
                });
            })
            .catch(error => {
                console.error('Sarf malzeme işlem modalı açma hatası:', error);
                showErrorMessage('Hata', 'Sarf malzeme işlem modalı açılırken bir hata oluştu.');
            });
    } catch (error) {
        console.error('Sarf malzeme işlem modalı açma hatası:', error);
        showErrorMessage('Hata', 'Sarf malzeme işlem modalı açılırken bir hata oluştu.');
    }
  }


  // Sarf Malzeme için Stoğa Geri Dönenler verilerini yükleme fonksiyonu
async function loadSarfMalzemeStokGeriDonenler(sarfMalzemeId) {
    try {
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.error('Database invoke metodu bulunamadı');
            return;
        }

        // API call to get data - Burada işlem geçmişini çekip filtreleyeceğiz
        const result = await window.electronAPI.invoke.database.getSarfMalzemeIslemleri(sarfMalzemeId);

        const stokGeriDonenlerTable = document.getElementById('sarfMalzemeStokGeriDonenlerTable');
        if (!stokGeriDonenlerTable) {
            console.error('sarfMalzemeStokGeriDonenlerTable elementi bulunamadı!');
            return;
        }
        
        const tableBody = stokGeriDonenlerTable.getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
        
        if (!result.success || !result.islemler || result.islemler.length === 0) {
            const row = tableBody.insertRow();
            row.innerHTML = '<td colspan="5" class="text-center">Stoğa geri dönen malzeme bulunamadı</td>';
            return;
        }
        
        // Sadece İade işlemlerini ve kullanım alanı "StokGeriYukleme" olanları filtrele
        const geriDonenler = result.islemler.filter(islem => 
            islem.islem_turu === 'İade' && islem.kullanim_alani === 'StokGeriYukleme'
        );
        
        if (geriDonenler.length === 0) {
            const row = tableBody.insertRow();
            row.innerHTML = '<td colspan="5" class="text-center">Stoğa geri dönen malzeme bulunamadı</td>';
            return;
        }
        
        // Her bir geri dönen işlem için orijinal işlemi bul
        const processedItems = []; // İşlenmiş işlemler
        
        for (const geriDonen of geriDonenler) {
            // Tüm işlemleri tarihe göre sırala
            const sortedIslemler = result.islemler
                .filter(i => i.id !== geriDonen.id) // Kendisini hariç tut
                .filter(i => i.islem_turu !== 'İade') // Diğer iadeleri hariç tut
                .sort((a, b) => new Date(b.islem_tarihi) - new Date(a.islem_tarihi)); // Son yapılandan ilk yapılana sırala
            
            // Geri dönen işlemden önce yapılmış en yakın işlemi bul
            const geriDonenTarih = new Date(geriDonen.islem_tarihi);
            const oncekiIslemler = sortedIslemler.filter(i => new Date(i.islem_tarihi) < geriDonenTarih);
            
            let originalIslem = null;
            if (oncekiIslemler.length > 0) {
                originalIslem = oncekiIslemler[0]; // En yakın işlem
            }
            
            // Eğer orijinal işlem bulunamazsa, bu işlemi atla
            if (!originalIslem) continue;
            
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
            
            // Alınan Miktar (Orijinal işlemin miktarı)
            const cell2 = row.insertCell(1);
            cell2.textContent = `${Number(originalIslem.miktar).toFixed(2)}`;
            
            // Geri Dönen Miktar
            const cell3 = row.insertCell(2);
            cell3.textContent = `${Number(geriDonen.miktar).toFixed(2)}`;
            
            // Proje
            const cell4 = row.insertCell(3);
            cell4.textContent = originalIslem.proje_adi || geriDonen.proje_adi || 'Belirtilmemiş';
            
            // İşlemi Yapan
            const cell5 = row.insertCell(4);
            cell5.textContent = `${geriDonen.kullanici_ad || ''} ${geriDonen.kullanici_soyad || ''}`.trim() || 'Bilinmiyor';
            
            // Bu işlemi işlenmiş olarak işaretle
            processedItems.push(geriDonen.id);
        }
        
        // Eğer hiçbir işlem bulunamazsa
        if (processedItems.length === 0) {
            const row = tableBody.insertRow();
            row.innerHTML = '<td colspan="5" class="text-center">Stoğa geri dönen malzeme bulunamadı</td>';
        }
    } catch (error) {
        console.error('Sarf malzeme stok geri dönenler yükleme hatası:', error);
        
        const stokGeriDonenlerTable = document.getElementById('sarfMalzemeStokGeriDonenlerTable');
        if (stokGeriDonenlerTable) {
            const tableBody = stokGeriDonenlerTable.getElementsByTagName('tbody')[0];
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Stok geri dönenler yüklenirken hata oluştu</td></tr>';
            }
        }
    }
}

window.loadSarfMalzemeListesi = loadSarfMalzemeListesi;
window.saveSarfMalzeme = saveSarfMalzeme;
window.loadSarfMalzemeGirisGecmisi = loadSarfMalzemeGirisGecmisi;
window.openSarfMalzemeGirisGuncelleModal = openSarfMalzemeGirisGuncelleModal;
window.guncelleSarfMalzemeGirisi = guncelleSarfMalzemeGirisi;
window.setupSarfMalzemeGirisUpdateEvents = setupSarfMalzemeGirisUpdateEvents;
window.kaydetSarfMalzemeGirisi = kaydetSarfMalzemeGirisi;
window.setupSarfMalzemeGirisButtons = setupSarfMalzemeGirisButtons;
window.deleteSarfMalzeme = deleteSarfMalzeme;
window.saveSarfMalzemeIslemi = saveSarfMalzemeIslemi;
window.viewSarfMalzemeDetail = viewSarfMalzemeDetail;
window.searchSarfMalzeme = searchSarfMalzeme;
window.deleteSarfMalzemeIslem = deleteSarfMalzemeIslem;
window.openSarfMalzemeIslemModal = openSarfMalzemeIslemModal;
window.loadSarfMalzemeStokGeriDonenler=loadSarfMalzemeStokGeriDonenler;