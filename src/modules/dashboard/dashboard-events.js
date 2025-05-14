
// Sayfa yüklendiğinde çalışacak fonksiyon
document.addEventListener('DOMContentLoaded', function() {
    // Tüm tablo konteynerlerini seçin
    const tableContainers = document.querySelectorAll('.table-container');
    
    // Her tablo konteyneri için
    tableContainers.forEach(container => {
        // Kaydırma olayı dinleyicisi ekleyin
        container.addEventListener('scroll', function() {
            // Üst gölge kontrolü
            if (this.scrollTop > 20) {
                this.classList.add('top-shadow');
            } else {
                this.classList.remove('top-shadow');
            }
            
            // Alt gölge kontrolü
            if (this.scrollTop + this.clientHeight < this.scrollHeight - 20) {
                this.classList.add('bottom-shadow');
            } else {
                this.classList.remove('bottom-shadow');
            }
        });
        
        // Sayfa ilk yüklendiğinde gölge durumunu kontrol edin
        if (container.scrollHeight > container.clientHeight) {
            container.classList.add('bottom-shadow');
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM yüklendi, olaylar ayarlanıyor...');
    
    // Kullanıcı verisi alma
    if (window.electronAPI && window.electronAPI.receive) {
        const removeUserDataListener = window.electronAPI.receive('user-data', function(user) {
            console.log('Kullanıcı bilgisi alındı:', user);
            currentUser = user;
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = `${user.ad} ${user.soyad}`;
            }
        });
    } else {
        console.error('Kullanıcı verisi dinleyicisi ayarlanamadı');
    }
    
    // Menü gezinmesi
    setupNavigation();
    
    // Çıkış butonu
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            console.log('Çıkış yapılıyor...');
            if (window.electronAPI && window.electronAPI.send) {
                window.electronAPI.send('logout');
            } else {
                console.error('Logout metodu kullanılamıyor');
            }
        });
    }
    
    // Form olaylarını ayarla
    try {
        setupFormEvents();
    } catch (error) {
        console.error('Form olayları hatası:', error);
    }
    
    // Modal olaylarını ayarla
    try {
        setupModalEvents();
    } catch (error) {
        console.error('Modal olayları hatası:', error);
    }
    
    // Yarı mamul olay dinleyicilerini ayarla
    try {
        setupYariMamulEventListeners();
    } catch (error) {
        console.error('Yarı mamul olayları hatası:', error);
    }
    
    // Setup material type selection buttons
    const materialTypeBtns = document.querySelectorAll('.material-type-btn');
    
    materialTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('Malzeme tipi değiştiriliyor:', this.getAttribute('data-material-type'));
            
            // Remove active class from all buttons
            materialTypeBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show the appropriate form
            const materialType = this.getAttribute('data-material-type');
            showMaterialForm(materialType);
            
            // Reset calculation display
            document.getElementById('hesaplamaDetaylari').classList.add('hidden');
        });
    });


    
    // Dashboard'ı güncelle
    updateDashboard();

    // Başlangıçta aktif sayfaya göre veri yükleme
    const activePageElement = document.querySelector('.page.active');
    if (activePageElement) {
        const pageId = activePageElement.id;
        
        if (pageId === 'hammadde-listesi') {
            loadHammaddeListesi();
        } else if (pageId === 'sarf-malzeme-listesi') {
            console.log("Sarf malzeme listesi yükleniyor..."); // Debug için log ekleyelim
            loadSarfMalzemeListesi(); //
        } else if (pageId === 'yari-mamul-listesi') {
            console.log("Yarı mamul listesi yükleniyor...");
            loadYariMamulListesi();
        } else if (pageId === 'fason-imalat') {
            loadFasonIslemler();
        } else if (pageId === 'makine-imalat') {
            loadMakineIslemler();
        } else if (pageId === 'iskarta-urunler') {
            loadIskartaUrunler();
        } else if (pageId === 'projeler') {
            loadProjeler();
        } 
    
    }

    // Stil etiketini oluştur ve sayfanın head kısmına ekle
    const style = document.createElement('style');
    style.textContent = `
        /* Vurgulanan satır için stil */
        .highlighted-row {
            background-color: #ffffcc !important;
            transition: background-color 0.5s ease;
        }
        
        /* Arama kutusu için ek stiller */
        #sarfMalzemeAra, #yariMamulAra {
            width: 350px;
            padding: 8px 12px;
            font-size: 14px;
            border-radius: 4px;
            border: 1px solid #ccc;
        }
        
        /* Mobil uyumluluk için */
        @media (max-width: 768px) {
            #sarfMalzemeAra, #yariMamulAra {
                width: 100%;
            }
        }
        
        /* Yarı Mamul Panel stilleri */
        #yariMamulPanel {
            margin-top: 15px;
            padding: 15px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        #yariMamulPanel h3 {
            margin-top: 0;
            color: #333;
            font-size: 16px;
        }
        
        .info-text {
            font-size: 12px;
            color: #666;
            margin-bottom: 15px;
        }
    `;
    document.head.appendChild(style);
});

// Event listener'ı güncelle
document.addEventListener('DOMContentLoaded', function() {

    
    // Hammadde giriş formu sıfırlandığında, hesaplama detaylarını da sıfırla
    const hammaddeGirisForm = document.getElementById('hammaddeGirisForm');
    if (hammaddeGirisForm) {
        hammaddeGirisForm.addEventListener('reset', function() {
            window.hesaplamaDetaylari = null;
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Create a style element for our new CSS
    const style = document.createElement('style');
    style.textContent = `
      /* Styled for edited buttons */
      .action-btn.edit.edited {
        opacity: 0.9;
        background-color: #f8f8f8;
        cursor: not-allowed;
      }
      
      /* Tooltip improvements */
      [title] {
        position: relative;
      }
      
      [title]:hover::after {
        content: attr(title);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background-color: #333;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        white-space: nowrap;
        font-size: 12px;
        z-index: 1000;
      }
    `;
    document.head.appendChild(style);
  });




// setupNavigation fonksiyonunu güncelleme - yarı mamul için destek eklendi
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-links li a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Sayfa geçişi yapılıyor:', this.getAttribute('data-page'));
            
            // Tüm linklerden active sınıfını kaldır
            navLinks.forEach(l => l.parentElement.classList.remove('active'));
            
            // Tıklanan linke active sınıfı ekle
            this.parentElement.classList.add('active');
            
            // Tüm sayfaları gizle
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active'); 
            });

            
            const pageName = this.getAttribute('data-page');
            const pageElement = document.getElementById(pageName);

            if (pageElement) {
                pageElement.classList.add('active'); // classList yerine doğrudan style
                console.log('Sayfa gösterildi (style):', pageName);
                
                // Sayfa bazlı veri yükleme
                if (pageName === 'hammadde-listesi') {
                    console.log('Hammadde listesi sayfası yükleniyor...');
                    loadHammaddeListesi();
                } else if (pageName === 'sarf-malzeme-listesi') {
                    console.log("Sarf malzeme listesi sayfası yükleniyor..."); 
                    loadSarfMalzemeListesi(); 
                } else if (pageName === 'yari-mamul-listesi') {
                    console.log("Yarı mamul listesi sayfası yükleniyor...");
                    loadYariMamulListesi();
                } else if (pageName === 'fason-imalat') {
                    console.log('Fason imalat sayfası yükleniyor...');
                    loadFasonIslemler();
                } else if (pageName === 'makine-imalat') {
                    console.log('Makine imalat sayfası yükleniyor...');
                    loadMakineIslemler();
                } else if (pageName === 'iskarta-urunler') {
                    console.log('Iskarta ürünler sayfası yükleniyor...');
                    loadIskartaUrunler();
                }
                else if (pageName === 'projeler') {
                    console.log('Projeler sayfası yükleniyor...');
                    loadProjeler();
                } 
            } else {
                console.error('Sayfa elementi bulunamadı:', pageName);
            }
        });
    });
    
    // Alt menü navigasyonu - düzeltildi
    const subMenuBtns = document.querySelectorAll('.sub-menu-btn');
    subMenuBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('Alt menü geçişi yapılıyor:', this.getAttribute('data-submenu'));
            
            // Tüm butonlardan active sınıfını kaldır
            subMenuBtns.forEach(b => b.classList.remove('active'));
            
            // Tıklanan butona active sınıfı ekle
            this.classList.add('active');
            
            // Tüm alt sayfaları gizle
            document.querySelectorAll('.sub-page').forEach(page => {
                page.classList.remove('active');
                console.log('Alt sayfa gizlendi:', page.id);
            });
            
            // Tıklanan alt sayfayı göster
            const subPageName = this.getAttribute('data-submenu');
            const subPageElement = document.getElementById(subPageName);
            if (subPageElement) {
                subPageElement.classList.add('active');
                console.log('Alt sayfa gösterildi:', subPageName);
            } else {
                console.error('Alt sayfa elementi bulunamadı:', subPageName);
            }
        });
    });
}


// Complete setupFormEvents function
function setupFormEvents() {
    
    // Hammadde formu gönderimi (Sac)
    const hammaddeForm = document.getElementById('hammaddeForm');
    if (hammaddeForm) {
        hammaddeForm.addEventListener('submit', saveSacHammadde);
    }

    // Boru Hammadde formu gönderimi
    const boruForm = document.getElementById('boruForm');
    if (boruForm) {
        boruForm.addEventListener('submit', saveBoruHammadde);
    }

    // Mil Hammadde formu gönderimi
    const milForm = document.getElementById('milForm');
    if (milForm) {
        milForm.addEventListener('submit', saveMilHammadde);
    }

    // Sarf malzeme formu gönderimi
    const sarfMalzemeForm = document.getElementById('sarfMalzemeForm');
    if (sarfMalzemeForm) {
        // Daha önce eklenmiş listener varsa kaldır
        const oldListeners = sarfMalzemeForm.onsubmit;
        if (oldListeners) {
            sarfMalzemeForm.onsubmit = null;
        }
        
        sarfMalzemeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveSarfMalzeme(e);
        });
    }
    
    // Yarı Mamul Ekle formu
    const yariMamulEkleForm = document.getElementById('yariMamulEkleForm');
    if (yariMamulEkleForm) {
        yariMamulEkleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveYariMamulEkle(e);
        });
    }

    // Yarı Mamul Giriş formu
    const yariMamulGirisForm = document.getElementById('yariMamulGirisForm');
    if (yariMamulGirisForm) {
        yariMamulGirisForm.addEventListener('submit', function(e) {
            e.preventDefault();
            kaydetYariMamulGirisi();
        });
    }

    // Arama fonksiyonları
    const araBtn = document.getElementById('araBtn');
    if (araBtn) {
        araBtn.addEventListener('click', searchHammadde);
    }

    const sarfMalzemeAraBtn = document.getElementById('sarfMalzemeAraBtn');
    if (sarfMalzemeAraBtn) {
        sarfMalzemeAraBtn.addEventListener('click', searchSarfMalzeme);
    }
    
    const yariMamulAraBtn = document.getElementById('yariMamulAraBtn');
    if (yariMamulAraBtn) {
        yariMamulAraBtn.addEventListener('click', searchYariMamul);
    }

    // Hammadde arama alanı
    const hammaddeAra = document.getElementById('hammaddeAra');
    if (hammaddeAra) {
        hammaddeAra.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                searchHammadde();
            }
        });
    }

    // Sarf malzeme arama alanı
    const sarfMalzemeAra = document.getElementById('sarfMalzemeAra');
    if (sarfMalzemeAra) {
        sarfMalzemeAra.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                searchSarfMalzeme();
            }
        });
    }
    
    // Yarı mamul arama alanı
    const yariMamulAra = document.getElementById('yariMamulAra');
    if (yariMamulAra) {
        yariMamulAra.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                searchYariMamul();
            }
        });
    }

    // Yeni proje butonu
    const yeniProjeBtn = document.getElementById('yeniProjeBtn');
    if (yeniProjeBtn) {
        yeniProjeBtn.addEventListener('click', function() {
            openModal('yeniProjeModal');
        });
    }

    // Yeni proje formu
    const yeniProjeForm = document.getElementById('yeniProjeForm');
    if (yeniProjeForm) {
        yeniProjeForm.addEventListener('submit', saveProje);
    }

    // Sarf malzeme işlem kaydet butonu
    const sarfMalzemeIslemKaydetBtn = document.getElementById('sarfMalzemeIslemKaydetBtn');
    if (sarfMalzemeIslemKaydetBtn) {
        sarfMalzemeIslemKaydetBtn.addEventListener('click', saveSarfMalzemeIslemi);
    }
    
    // Yarı mamul işlem kaydet butonu
    const yariMamulIslemKaydetBtn = document.getElementById('yariMamulIslemKaydetBtn');
    if (yariMamulIslemKaydetBtn) {
        yariMamulIslemKaydetBtn.addEventListener('click', saveYariMamulIslemi);
    }

    // Kullanım alanı değişikliğinde yarı mamul panelini güncelleme
    const kullanimAlaniSelect = document.getElementById('kullanimAlani');
    if (kullanimAlaniSelect) {
        kullanimAlaniSelect.addEventListener('change', toggleYariMamulPanel);
    }
    
    // Alt menü butonlarına event listener ekle
    const subMenuBtns = document.querySelectorAll('.sub-menu-btn');
    subMenuBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('Alt menü geçişi yapılıyor:', this.getAttribute('data-submenu'));
            
            // Tüm butonlardan active sınıfını kaldır
            subMenuBtns.forEach(b => b.classList.remove('active'));
            
            // Tıklanan butona active sınıfı ekle
            this.classList.add('active');
            
            // Tüm alt sayfaları gizle
            document.querySelectorAll('.sub-page').forEach(page => {
                page.classList.remove('active');
            });
            
            // Tıklanan alt sayfayı göster
            const subPageName = this.getAttribute('data-submenu');
            const subPageElement = document.getElementById(subPageName);
            if (subPageElement) {
                subPageElement.classList.add('active');
                console.log('Alt sayfa gösterildi:', subPageName);
            } else {
                console.error('Alt sayfa elementi bulunamadı:', subPageName);
            }
        });
    });
}

// Modal olayları kurulumu
function setupModalEvents() {
    // Modal kapatma butonları
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function () {
            const modalId = this.closest('.modal').id;
            closeModal(modalId);
        });
    });

    // İşlem kaydet butonu
    const islemKaydetBtn = document.getElementById('islemKaydetBtn');
    if (islemKaydetBtn) {
        islemKaydetBtn.addEventListener('click', saveIslem);
    }

    // İşlem güncelleme butonu
    const islemGuncelleBtn = document.getElementById('islemGuncelleBtn');
    if (islemGuncelleBtn) {
        islemGuncelleBtn.addEventListener('click', updateIslem);
    }

    // Yeni proje ekle butonu (işlem modali içinde)
    const yeniProjeEkleBtn = document.getElementById('yeniProjeEkleBtn');
    if (yeniProjeEkleBtn) {
        yeniProjeEkleBtn.addEventListener('click', function () {
            closeModal('islemModal');
            openModal('yeniProjeModal');
        });
    }

    // Dışa tıklayarak modalı kapatma
    window.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });

    // Hammadde ve sarf malzeme giriş butonları
    setupHammaddeGirisButtons();
    setupSarfMalzemeGirisButtons();

    // Sadece ıskarta ürün checkbox'u için event listener ekleme
    // İkincil stok checkbox'u kaldırıldı
    const duzenleIskartaUrunSecimi = document.getElementById('duzenleIskartaUrunSecimi');

    if (duzenleIskartaUrunSecimi) {
        duzenleIskartaUrunSecimi.addEventListener('change', function () {
            console.log('Iskarta ürün durumu değişti:', this.checked);
        });
    }
}

// İşlem filtresi için event listener
function setupActivityFilter() {
    const filterSelect = document.getElementById('recentActivityFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            const selectedValue = this.value;
            const rows = document.getElementById('recentActivitiesTable').getElementsByTagName('tbody')[0].rows;
            
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const rowType = row.getAttribute('data-type');
                
                if (selectedValue === 'all' || selectedValue === rowType) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        });
    }
}




async function loadRecentActivities() {
    try {
        // Son 20 aktiviteyi içerecek bir liste oluştur
        const recentActivities = [];
        
        // 1. Hammadde işlemlerini al
        try {
            const hammaddeResult = await window.electronAPI.invoke.database.getAllHammadde();
            if (hammaddeResult.success) {
                for (const hammadde of hammaddeResult.hammaddeler) {
                    const parcaResult = await window.electronAPI.invoke.database.getParcalarByHammaddeId(hammadde.id);
                    if (parcaResult.success && parcaResult.parcalar.length > 0) {
                        for (const parca of parcaResult.parcalar) {
                            const islemResult = await window.electronAPI.invoke.database.getIslemlerByParcaId(parca.id);
                            if (islemResult.success && islemResult.islemler.length > 0) {
                                islemResult.islemler.forEach(islem => {
                                    recentActivities.push({
                                        tarih: new Date(islem.islem_tarihi),
                                        islemTuru: 'Hammadde İşlemi',
                                        stokKodu: hammadde.stok_kodu,
                                        malzemeAdi: hammadde.malzeme_adi,
                                        miktar: `${Number(islem.kullanilanMiktar).toFixed(2)} kg`,
                                        kullanici: `${islem.kullanici_ad} ${islem.kullanici_soyad}`,
                                        tip: 'hammadde'
                                    });
                                });
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Hammadde işlemleri alınırken hata:', error);
        }
        
        // 2. Sarf malzeme işlemlerini al
        try {
            const sarfMalzemeResult = await window.electronAPI.invoke.database.getAllSarfMalzeme();
            if (sarfMalzemeResult.success) {
                for (const sarfMalzeme of sarfMalzemeResult.sarfMalzemeler) {
                    const islemResult = await window.electronAPI.invoke.database.getSarfMalzemeIslemleri(sarfMalzeme.id);
                    if (islemResult.success && islemResult.islemler.length > 0) {
                        islemResult.islemler.forEach(islem => {
                            recentActivities.push({
                                tarih: new Date(islem.islem_tarihi),
                                islemTuru: 'Sarf Malzeme Kullanımı',
                                stokKodu: sarfMalzeme.stok_kodu,
                                malzemeAdi: sarfMalzeme.malzeme_adi,
                                miktar: `${Number(islem.miktar).toFixed(2)} ${sarfMalzeme.birim}`,
                                kullanici: `${islem.kullanici_ad} ${islem.kullanici_soyad}`,
                                tip: 'sarf'
                            });
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Sarf malzeme işlemleri alınırken hata:', error);
        }
        
        // 3. Yarı mamul işlemlerini al
        try {
            const yariMamulResult = await window.electronAPI.invoke.database.getAllYariMamuller();
            if (yariMamulResult.success) {
                for (const yariMamul of yariMamulResult.yariMamuller) {
                    const islemResult = await window.electronAPI.invoke.database.getYariMamulIslemleri(yariMamul.id);
                    if (islemResult.success && islemResult.islemler.length > 0) {
                        islemResult.islemler.forEach(islem => {
                            recentActivities.push({
                                tarih: new Date(islem.islem_tarihi),
                                islemTuru: 'Yarı Mamul İşlemi',
                                stokKodu: yariMamul.stok_kodu,
                                malzemeAdi: yariMamul.malzeme_adi,
                                miktar: `${Number(islem.miktar).toFixed(2)} ${yariMamul.birim}`,
                                kullanici: `${islem.kullanici_ad} ${islem.kullanici_soyad}`,
                                tip: 'yari'
                            });
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Yarı mamul işlemleri alınırken hata:', error);
        }
        
        // Tabloyu doldur
        const recentActivitiesTable = document.getElementById('recentActivitiesTable').getElementsByTagName('tbody')[0];
        recentActivitiesTable.innerHTML = '';
        
        if (recentActivities.length === 0) {
            const row = recentActivitiesTable.insertRow();
            row.innerHTML = '<td colspan="6" class="text-center">İşlem bulunamadı</td>';
            return;
        }
        
        // Tarihe göre sırala (en yeni en üstte)
        recentActivities.sort((a, b) => b.tarih - a.tarih);
        
        // İlk 10 aktiviteyi göster
        const activitiesToShow = recentActivities.slice(0, 10);
        
        activitiesToShow.forEach(activity => {
            const row = recentActivitiesTable.insertRow();
            row.setAttribute('data-type', activity.tip);
            
            // Tarih
            const cell1 = row.insertCell(0);
            cell1.textContent = activity.tarih.toLocaleString('tr-TR');
            
            // İşlem
            const cell2 = row.insertCell(1);
            cell2.textContent = activity.islemTuru;
            
            // Stok Kodu
            const cell3 = row.insertCell(2);
            cell3.textContent = activity.stokKodu;
            
            // Malzeme
            const cell4 = row.insertCell(3);
            cell4.textContent = activity.malzemeAdi;
            
            // Miktar
            const cell5 = row.insertCell(4);
            cell5.textContent = activity.miktar;
            
            // Kullanıcı
            const cell6 = row.insertCell(5);
            cell6.textContent = activity.kullanici;
        });
        
        // İşlem filtreleme için event listener ekle
        setupActivityFilter();
        
    } catch (error) {
        console.error('Son aktiviteleri yükleme hatası:', error);
        const recentActivitiesTable = document.getElementById('recentActivitiesTable').getElementsByTagName('tbody')[0];
        recentActivitiesTable.innerHTML = '<tr><td colspan="6" class="text-center">Veri yüklenirken hata oluştu</td></tr>';
    }
}



// Dashboard güncelleme
async function updateDashboard() {
    console.log('Dashboard güncellenmeye çalışılıyor...');
    
    try {
        // API erişimi kontrolü
        if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
            console.log('API veya database erişimi yok, varsayılan veriler gösteriliyor');
            setDefaultValues();
            return;
        }
        
        // 1. Hammadde verilerini al
        const hammaddeResult = await window.electronAPI.invoke.database.getAllHammadde();
        let hammaddeCount = 0;
        let hammaddeCriticalCount = 0;
        let hammaddeDepletedCount = 0;
        
        if (hammaddeResult.success) {
            const hammaddeler = hammaddeResult.hammaddeler;
            
            // Sadece stokta var olanları say (kalan_kilo > 0)
            const stockAvailableItems = hammaddeler.filter(h => Number(h.kalan_kilo) > 0);
            hammaddeCount = stockAvailableItems.length;
            
            // Kritik seviyedeki hammaddelerin sayısı
            hammaddeCriticalCount = hammaddeler.filter(h => 
                Number(h.kalan_kilo) <= Number(h.kritik_seviye) && Number(h.kalan_kilo) > 0
            ).length;
            
            // Tükenmiş hammaddelerin sayısı
            hammaddeDepletedCount = hammaddeler.filter(h => 
                Number(h.kalan_kilo) <= 0
            ).length;
        }
        
        // 2. Sarf malzeme verilerini al
        const sarfMalzemeResult = await window.electronAPI.invoke.database.getAllSarfMalzeme();
        let sarfMalzemeCount = 0;
        let sarfMalzemeCriticalCount = 0;
        let sarfMalzemeDepletedCount = 0;
        
        if (sarfMalzemeResult.success) {
            const sarfMalzemeler = sarfMalzemeResult.sarfMalzemeler;
            
            // Sadece stokta var olanları say (kalan_miktar > 0)
            const stockAvailableItems = sarfMalzemeler.filter(s => Number(s.kalan_miktar) > 0);
            sarfMalzemeCount = stockAvailableItems.length;
            
            // Kritik seviyedeki sarf malzemelerin sayısı
            sarfMalzemeCriticalCount = sarfMalzemeler.filter(s => 
                Number(s.kalan_miktar) <= Number(s.kritik_seviye) && Number(s.kalan_miktar) > 0
            ).length;
            
            // Tükenmiş sarf malzemelerin sayısı
            sarfMalzemeDepletedCount = sarfMalzemeler.filter(s => 
                Number(s.kalan_miktar) <= 0
            ).length;
        }
        
        // 3. Yarı mamul verilerini al
        const yariMamulResult = await window.electronAPI.invoke.database.getAllYariMamuller();
        let yariMamulCount = 0;
        let yariMamulCriticalCount = 0;
        let yariMamulDepletedCount = 0;
        
        if (yariMamulResult.success) {
            const yariMamuller = yariMamulResult.yariMamuller;
            
            // Sadece stokta var olanları say (kalan_miktar > 0)
            const stockAvailableItems = yariMamuller.filter(y => Number(y.kalan_miktar) > 0);
            yariMamulCount = stockAvailableItems.length;
            
            // Kritik seviyedeki yarı mamullerin sayısı
            yariMamulCriticalCount = yariMamuller.filter(y => 
                Number(y.kalan_miktar) <= Number(y.kritik_seviye) && Number(y.kalan_miktar) > 0
            ).length;
            
            // Tükenmiş yarı mamullerin sayısı
            yariMamulDepletedCount = yariMamuller.filter(y => 
                Number(y.kalan_miktar) <= 0
            ).length;
        }
        
        // İkincil stok kısmı kaldırıldı
        
        // 5. Proje sayısını al
        const projeResult = await window.electronAPI.invoke.database.getAllProjeler();
        let projeCount = 0;
        
        if (projeResult.success) {
            projeCount = projeResult.projeler.length;
        }
        
        // 6. Tedarikçi sayısını al
        const tedarikciResult = await window.electronAPI.invoke.database.getAllTedarikci();
        let tedarikciCount = 0;
        
        if (tedarikciResult.success && tedarikciResult.tedarikci) {
            tedarikciCount = tedarikciResult.tedarikci.length;
        }
        
        // Son işlemleri al ve tabloya ekle
        await loadRecentActivities();
        
        // Dashboard değerlerini güncelle
        document.getElementById('totalRawMaterials').textContent = hammaddeCount;
        document.getElementById('totalConsumables').textContent = sarfMalzemeCount;
        document.getElementById('totalSemiProducts').textContent = yariMamulCount;
        
        // Toplamlar
        const totalCritical = hammaddeCriticalCount + sarfMalzemeCriticalCount + yariMamulCriticalCount;
        const totalDepleted = hammaddeDepletedCount + sarfMalzemeDepletedCount + yariMamulDepletedCount;
        
        document.getElementById('criticalStocks').textContent = totalCritical;
        document.getElementById('depletedStocks').textContent = totalDepleted;
        
        // İkincil stok gösterimi kaldırıldı
        // İlgili HTML elementini de kaldırmak veya saklamak gerekecek
        if (document.getElementById('secondaryStocks')) {
            document.getElementById('secondaryStocks').parentElement.style.display = 'none'; // Veya alternatif olarak bu elementi tamamen kaldırın
        }
        
        // Footer istatistikleri
        document.getElementById('totalProjects').textContent = projeCount;
        document.getElementById('totalSuppliers').textContent = tedarikciCount;
        // Toplam İşlem istatistiği kaldırıldı
        
    } catch (error) {
        console.error('Dashboard güncelleme hatası:', error);
        setDefaultValues();
    }
}

// Varsayılan değerleri göster - güncellendi (Toplam İşlem kaldırıldı)
function setDefaultValues() {
    document.getElementById('totalRawMaterials').textContent = '0';
    document.getElementById('totalConsumables').textContent = '0';
    document.getElementById('totalSemiProducts').textContent = '0';
    document.getElementById('criticalStocks').textContent = '0';
    document.getElementById('depletedStocks').textContent = '0';
    document.getElementById('secondaryStocks').textContent = '0'; // İkincil stoklar için değer
    document.getElementById('totalProjects').textContent = '0';
    document.getElementById('totalSuppliers').textContent = '0';
    // Toplam İşlem değeri kaldırıldı
    
    // Boş tablolar göster
    const recentActivitiesTable = document.getElementById('recentActivitiesTable').getElementsByTagName('tbody')[0];
    recentActivitiesTable.innerHTML = '<tr><td colspan="6" class="text-center">Veri bulunamadı</td></tr>';
}

/* 
// Son işlemleri yükleme
async function loadRecentIslemler() {
    try {
        if (!window.api || !window.api.database) {
            const fasonIslemTable = document.getElementById('recentIslemlerTable').getElementsByTagName('tbody')[0];
            fasonIslemTable.innerHTML = '<tr><td colspan="6" class="text-center">Veri bulunamadı</td></tr>';
            return;
        }
        
        // Fason işlemler tablosunu doldur
        const fasonIslemTable = document.getElementById('recentIslemlerTable').getElementsByTagName('tbody')[0];
        fasonIslemTable.innerHTML = '';
        
        // Son 5 işlemi göster (şu an için boş)
        const row = fasonIslemTable.insertRow();
        row.innerHTML = '<td colspan="6" class="text-center">Veri bulunamadı</td>';
        
    } catch (error) {
        console.error('Son işlemleri yükleme hatası:', error);
    }
}  */


// Geliştirilmiş toast fonksiyonu - Tip ve süre parametreleri eklendi
function showToast(message, type = 'info', duration = 7000) {
    // type: 'success', 'error', 'info', 'warning'
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // İkon ekle
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i> ';
            break;
        case 'error':
            icon = '<i class="fas fa-times-circle"></i> ';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i> ';
            break;
        case 'info':
        default:
            icon = '<i class="fas fa-info-circle"></i> ';
            break;
    }
    
    toast.innerHTML = icon + message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('visible');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, duration);
}


function getParaBirimiSembolu(birimTuru) {
    switch (birimTuru) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'TRY': return '₺';
        default: return birimTuru;
    }
}


// Tab sistemini sıfırlama fonksiyonu
function resetTabSystem() {
    // Tüm tab içeriklerini gizle
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Tüm tab butonlarını deaktif et
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Her modal için ilk tab'ı aktif et
    const tabContainers = document.querySelectorAll('.tab-container');
    tabContainers.forEach(container => {
        const firstButton = container.querySelector('.tab-button');
        const firstTab = container.querySelector('.tab-content');
        
        if (firstButton) firstButton.classList.add('active');
        if (firstTab) firstTab.classList.add('active');
    });
}


// Her tablo türü için gösterilecek sütunların indekslerini döndüren yardımcı fonksiyon
function getColumnMapForTable(tableId) {
    // Her tablo türü için gösterilecek sütunların indekslerini belirle
    switch (tableId) {
      case 'sarfMalzemeTable':
        // Stok Kodu, Malzeme Adı, Kalan Miktar, Barkod
        return [0, 1, 2, 3];
      case 'hammaddeTable':
        // Stok Kodu, Malzeme Bilgisi, Kalan, Barkod
        return [0, 1, 3, 4];
      case 'yariMamulTable':
        // Stok Kodu, Malzeme Adı, Kalan Miktar, Barkod
        return [0, 1, 2, 3];
  
      default:
        // Varsayılan olarak ilk 4 sütunu göster
        return [0, 1, 2, 3];
    }
  }


// İşlem türünü formatla
function formatIslemTuru(islemTuru) {
    if (!islemTuru) return 'Belirtilmemiş';
    
    const islemMap = {
        'LazerKesim': 'Lazer Kesim',
        'KaynakliImalat': 'Kaynaklı İmalat',
        'TalasliImalat': 'Talaşlı İmalat',
        'Kullanım': 'Kullanım',
        'Fire': 'Fire',
        'İade': 'İade',
        'Ek': 'Ek'
    };
    
    return islemMap[islemTuru] || islemTuru;
  }
  
  // Kullanım alanını formatla
  function formatKullanimAlani(kullanimAlani) {
    if (!kullanimAlani) return 'Belirtilmemiş';
    
    const alanMap = {
        'FasonImalat': 'Fason İmalat',
        'MakineImalat': 'Makine İmalat',
        'IskartaUrun': 'Iskarta Ürün'
    };
    
    return alanMap[kullanimAlani] || kullanimAlani;
  }  
  

// Kullanıcı bilgilerini dinle ve global değişkene kaydet
  window.electronAPI.receive('user-data', (userData) => {
    console.log('Kullanıcı verileri alındı:', userData);
    
    // Global değişkeni güncelle
    if (window.updateGlobalUserData) {
      window.updateGlobalUserData(userData);
    } else {
      // Global değişken fonksiyonu henüz yüklenmediyse
      window.globalUserData = userData;
      console.log('Global kullanıcı bilgileri doğrudan güncellendi:', window.globalUserData);
    }
    
    // Sayfayı kullanıcıya göre ayarla
    setupPageForUser(userData);
  });
  
  // Kullanıcıya göre sayfa ayarları
  function setupPageForUser(userData) {
    // Kullanıcı adını göster
    const userNameElement = document.getElementById('current-user-name');
    if (userNameElement) {
      userNameElement.textContent = `${userData.ad} ${userData.soyad}`;
    }
    
    // Kullanıcı rolünü göster
    const userRoleElement = document.getElementById('current-user-role');
    if (userRoleElement) {
      userRoleElement.textContent = userData.rol === 'yonetici' ? 'Yönetici' : 'Kullanıcı';
    }
    
    // Rol bilgisine göre UI güncellemesi yap
    if (window.updateUIByUserRole) {
      window.updateUIByUserRole(userData.rol);
    }
  }

window.setupNavigation = setupNavigation;
window.setupFormEvents = setupFormEvents;
window.setupModalEvents = setupModalEvents;
window.setupActivityFilter = setupActivityFilter;
window.loadRecentActivities = loadRecentActivities;
window.updateDashboard = updateDashboard;
window.showToast = showToast;
window.getParaBirimiSembolu = getParaBirimiSembolu;
window.resetTabSystem = resetTabSystem;
window.getColumnMapForTable = getColumnMapForTable;
window.formatIslemTuru = formatIslemTuru;
window.formatKullanimAlani = formatKullanimAlani;
window.setupPageForUser = setupPageForUser;