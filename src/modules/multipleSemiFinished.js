function addNewYariMamul() {
    const yarimamulList = document.getElementById('plakaYariMamulList');
    const items = yarimamulList.querySelectorAll('.yarimamul-item');
    const newIndex = items.length;
    
    const newItem = document.createElement('div');
    newItem.className = 'yarimamul-item';
    newItem.dataset.index = newIndex;
    
    newItem.innerHTML = `
        <div class="form-row-two">
            <div class="form-group">
                <label for="plakaYariMamulAdi_${newIndex}">Yarı Mamul Adı</label>
                <input type="text" id="plakaYariMamulAdi_${newIndex}" class="yarimamul-adi" placeholder="Sac Kapak, Profil vs.">
            </div>
            <div class="form-group">
                <label for="plakaYariMamulBirim_${newIndex}">Birim</label>
                <select id="plakaYariMamulBirim_${newIndex}" class="yarimamul-birim">
                    <option value="adet">Adet</option>
                    <option value="kg">kg</option>
                    <option value="m">m</option>
                    <option value="m2">m²</option>
                    <option value="m3">m³</option>
                    <option value="lt">lt</option>
                    <option value="kutu">Kutu</option>
                    <option value="paket">Paket</option>
                </select>
            </div>
        </div>
        <div class="form-row-three">
            <div class="form-group">
                <label for="plakaYariMamulMiktar_${newIndex}">Adet</label>
                <input type="number" id="plakaYariMamulMiktar_${newIndex}" class="yarimamul-miktar" step="1" min="1" value="1">
            </div>
            <div class="form-group">
                <label for="plakaYariMamulAgirlik_${newIndex}">Birim Ağırlık (kg)</label>
                <input type="number" id="plakaYariMamulAgirlik_${newIndex}" class="yarimamul-agirlik" step="0.01" min="0.01">
            </div>
            <div class="form-group buttons-group">
                <label>&nbsp;</label>
                <button type="button" class="btn-danger remove-yarimamul">
                    <i class="fas fa-trash"></i> Sil
                </button>
            </div>
        </div>
    `;
    
    yarimamulList.appendChild(newItem);
    
    // Event dinleyicilerini ekle
    setupYariMamulEventListeners(newItem, 'plaka');
    
    // İlk öğenin silme butonunu göster (birden fazla yarı mamul varsa)
    if (newIndex > 0) {
        const firstItem = yarimamulList.querySelector('.yarimamul-item[data-index="0"] .remove-yarimamul');
        if (firstItem) {
            firstItem.style.display = 'block';
        }
    }
}


function addNewParcaYariMamul() {
    const yarimamulList = document.getElementById('parcaYariMamulList');
    const items = yarimamulList.querySelectorAll('.yarimamul-item');
    const newIndex = items.length;
    
    const newItem = document.createElement('div');
    newItem.className = 'yarimamul-item';
    newItem.dataset.index = newIndex;
    
    newItem.innerHTML = `
        <div class="form-row-two">
            <div class="form-group">
                <label for="parcaYariMamulAdi_${newIndex}">Yarı Mamul Adı</label>
                <input type="text" id="parcaYariMamulAdi_${newIndex}" class="yarimamul-adi" placeholder="Sac Kapak, Profil vs.">
            </div>
            <div class="form-group">
                <label for="parcaYariMamulBirim_${newIndex}">Birim</label>
                <select id="parcaYariMamulBirim_${newIndex}" class="yarimamul-birim">
                    <option value="adet">Adet</option>
                    <option value="kg">kg</option>
                    <option value="m">m</option>
                    <option value="m2">m²</option>
                    <option value="m3">m³</option>
                    <option value="lt">lt</option>
                    <option value="kutu">Kutu</option>
                    <option value="paket">Paket</option>
                </select>
            </div>
        </div>
        <div class="form-row-three">
            <div class="form-group">
                <label for="parcaYariMamulMiktar_${newIndex}">Adet</label>
                <input type="number" id="parcaYariMamulMiktar_${newIndex}" class="yarimamul-miktar" step="1" min="1" value="1">
            </div>
            <div class="form-group">
                <label for="parcaYariMamulAgirlik_${newIndex}">Birim Ağırlık (kg)</label>
                <input type="number" id="parcaYariMamulAgirlik_${newIndex}" class="yarimamul-agirlik" step="0.01" min="0.01">
            </div>
            <div class="form-group buttons-group">
                <label>&nbsp;</label>
                <button type="button" class="btn-danger remove-yarimamul">
                    <i class="fas fa-trash"></i> Sil
                </button>
            </div>
        </div>
    `;
    
    yarimamulList.appendChild(newItem);
    
    // Event dinleyicilerini ekle
    setupYariMamulEventListeners(newItem, 'parca');
    
    // İlk öğenin silme butonunu göster (birden fazla yarı mamul varsa)
    if (newIndex > 0) {
        const firstItem = yarimamulList.querySelector('.yarimamul-item[data-index="0"] .remove-yarimamul');
        if (firstItem) {
            firstItem.style.display = 'block';
        }
    }
}


function setupYariMamulEventListeners(item, prefix) {
    // Silme butonuna tıklama
    const removeButton = item.querySelector('.remove-yarimamul');
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            item.remove();
            
            // Kalan öğelerin indekslerini yeniden düzenle
            const allItems = document.querySelectorAll(`#${prefix}YariMamulList .yarimamul-item`);
            allItems.forEach((el, index) => {
                el.dataset.index = index;
                
                // İçindeki input ve select elemanlarının id'lerini güncelle
                const inputs = el.querySelectorAll('input, select');
                inputs.forEach(input => {
                    const oldId = input.id;
                    const baseName = oldId.substring(0, oldId.lastIndexOf('_') + 1);
                    input.id = baseName + index;
                });
            });
            
            // Eğer tek bir öğe kaldıysa silme butonunu gizle
            if (allItems.length === 1) {
                const lastRemoveButton = allItems[0].querySelector('.remove-yarimamul');
                if (lastRemoveButton) {
                    lastRemoveButton.style.display = 'none';
                }
            }
            
            // Toplam ağırlığı güncelle
            if (prefix === 'plaka') {
                updateYarimamulTotalWeight();
            } else {
                updateParcaYarimamulTotalWeight();
            }
        });
    }
    
    // Miktar ve ağırlık değişikliklerini dinle
    const inputs = item.querySelectorAll('.yarimamul-miktar, .yarimamul-agirlik');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            if (prefix === 'plaka') {
                updateYarimamulTotalWeight();
            } else {
                updateParcaYarimamulTotalWeight();
            }
        });
    });
}


function updateYarimamulTotalWeight() {
    const items = document.querySelectorAll('#plakaYariMamulList .yarimamul-item');
    let totalWeight = 0;
    
    items.forEach(item => {
        const miktar = parseFloat(item.querySelector('.yarimamul-miktar').value) || 0;
        const agirlik = parseFloat(item.querySelector('.yarimamul-agirlik').value) || 0;
        
        totalWeight += miktar * agirlik;
    });
    
    // Toplam ağırlığı güncelle
    document.getElementById('toplamYarimamulAgirlik').textContent = totalWeight.toFixed(2);
    
    // Kullanılan ve hurda alanlarını güncelle
    const kullanilanMiktarInput = document.getElementById('plakaKullanilanMiktar');
    if (kullanilanMiktarInput) {
        kullanilanMiktarInput.value = totalWeight.toFixed(2);
    }
    
    // Kalan parça toplam ağırlıkları
    let kalanParcalarToplami = 0;
    try {
        if (typeof kalanParcalar !== 'undefined' && Array.isArray(kalanParcalar)) {
            kalanParcalarToplami = kalanParcalar.reduce((toplam, parca) => {
                return toplam + parseFloat(parca.agirlik || 0);
            }, 0);
        }
    } catch (error) {
        console.error('Kalan parçalar hesaplanırken hata:', error);
    }
    
    // Plaka kalan kilosunu al
    let plakaKalanKilo = 0;
    try {
        if (typeof currentPlaka !== 'undefined' && currentPlaka && currentPlaka.kalan_kilo) {
            plakaKalanKilo = parseFloat(currentPlaka.kalan_kilo);
        }
    } catch (error) {
        console.error('Plaka kalan kilo alınırken hata:', error);
    }
    
    // Hurda miktarını otomatik hesapla
    // Hurda = Toplam Kalan Kilo - Kullanılan - Kalan Parçalar
    const hurdaMiktar = Math.max(0, plakaKalanKilo - totalWeight - kalanParcalarToplami);
    
    const hurdaMiktarInput = document.getElementById('plakaHurdaMiktar');
    if (hurdaMiktarInput) {
        hurdaMiktarInput.value = hurdaMiktar.toFixed(2);
    }
}


// Toplam yarı mamul ağırlığını hesaplama - Parça için
function updateParcaYarimamulTotalWeight() {
    const items = document.querySelectorAll('#parcaYariMamulList .yarimamul-item');
    let totalWeight = 0;
    
    items.forEach(item => {
        const miktar = parseFloat(item.querySelector('.yarimamul-miktar').value) || 0;
        const agirlik = parseFloat(item.querySelector('.yarimamul-agirlik').value) || 0;
        
        totalWeight += miktar * agirlik;
    });
    
    // Toplam ağırlığı güncelle
    document.getElementById('toplamParcaYarimamulAgirlik').textContent = totalWeight.toFixed(2);
    
    // Kullanılan ve hurda alanlarını güncelle
    const kullanilanMiktarInput = document.getElementById('parcaKullanilanMiktar');
    if (kullanilanMiktarInput) {
        kullanilanMiktarInput.value = totalWeight.toFixed(2);
    }
    
    // Kalan parça toplam ağırlıkları
    let kalanParcalarToplami = 0;
    try {
        if (typeof parcaKalanParcalar !== 'undefined' && Array.isArray(parcaKalanParcalar)) {
            kalanParcalarToplami = parcaKalanParcalar.reduce((toplam, parca) => {
                return toplam + parseFloat(parca.agirlik || 0);
            }, 0);
        }
    } catch (error) {
        console.error('Kalan parçalar hesaplanırken hata:', error);
    }
    
    // Parça kalan kilosunu al
    let parcaKalanKilo = 0;
    try {
        if (typeof currentParca !== 'undefined' && currentParca && currentParca.kalan_kilo) {
            parcaKalanKilo = parseFloat(currentParca.kalan_kilo);
        }
    } catch (error) {
        console.error('Parça kalan kilo alınırken hata:', error);
    }
    
    // Hurda miktarını otomatik hesapla
    // Hurda = Toplam Kalan Kilo - Kullanılan - Kalan Parçalar
    const hurdaMiktar = Math.max(0, parcaKalanKilo - totalWeight - kalanParcalarToplami);
    
    const hurdaMiktarInput = document.getElementById('parcaHurdaMiktar');
    if (hurdaMiktarInput) {
        hurdaMiktarInput.value = hurdaMiktar.toFixed(2);
    }
}



// Event listener'ları kurma - Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    // Plaka Yarı Mamul Ekleme butonu
    const addYariMamulBtn = document.getElementById('addMoreYariMamul');
    if (addYariMamulBtn) {
        addYariMamulBtn.addEventListener('click', addNewYariMamul);
    }
    
    // Parça Yarı Mamul Ekleme butonu
    const addParcaYariMamulBtn = document.getElementById('addMoreParcaYariMamul');
    if (addParcaYariMamulBtn) {
        addParcaYariMamulBtn.addEventListener('click', addNewParcaYariMamul);
    }
    
    // İlk yarı mamul öğesi için event listener'ları ekle
    const plakaFirstItem = document.querySelector('#plakaYariMamulList .yarimamul-item');
    if (plakaFirstItem) {
        setupYariMamulEventListeners(plakaFirstItem, 'plaka');
    }
    
    const parcaFirstItem = document.querySelector('#parcaYariMamulList .yarimamul-item');
    if (parcaFirstItem) {
        setupYariMamulEventListeners(parcaFirstItem, 'parca');
    }
    
    // Kullanım alanı değişimini izle
    const plakaKullanimAlani = document.getElementById('plakaKullanimAlani');
    if (plakaKullanimAlani) {
        plakaKullanimAlani.addEventListener('change', function() {
            toggleYariMamulPanel('plaka');
        });
        // Başlangıçta doğru durumu ayarla
        toggleYariMamulPanel('plaka');
    }
    
    const parcaKullanimAlani = document.getElementById('parcaKullanimAlani');
    if (parcaKullanimAlani) {
        parcaKullanimAlani.addEventListener('change', function() {
            toggleYariMamulPanel('parca');
        });
        // Başlangıçta doğru durumu ayarla
        toggleYariMamulPanel('parca');
    }
});



function resetPlakaIslemForm() {
    // Formları temizle
    document.getElementById('plakaKullanilanMiktar').value = '';
    document.getElementById('plakaHurdaMiktar').value = '0';
    
    // Yarı mamul alanını sıfırla
    const yarimamulList = document.getElementById('plakaYariMamulList');
    if (yarimamulList) {
        // İlk yarı mamul hariç hepsini temizle
        const items = yarimamulList.querySelectorAll('.yarimamul-item');
        for (let i = 1; i < items.length; i++) {
            items[i].remove();
        }
        
        // İlk yarı mamulü sıfırla
        const firstItem = yarimamulList.querySelector('.yarimamul-item');
        if (firstItem) {
            firstItem.querySelector('.yarimamul-adi').value = '';
            firstItem.querySelector('.yarimamul-birim').value = 'adet';
            firstItem.querySelector('.yarimamul-miktar').value = '1';
            firstItem.querySelector('.yarimamul-agirlik').value = '';
            
            // Silme butonunu gizle
            const removeBtn = firstItem.querySelector('.remove-yarimamul');
            if (removeBtn) {
                removeBtn.style.display = 'none';
            }
        }
    }
    
    // Kullanım alanı başlangıç durumunu ayarla
    toggleYariMamulPanel('plaka');
}


function resetParcaIslemForm() {
    // Formları temizle
    document.getElementById('parcaKullanilanMiktar').value = '';
    document.getElementById('parcaHurdaMiktar').value = '0';
    
    // Yarı mamul alanını sıfırla
    const yarimamulList = document.getElementById('parcaYariMamulList');
    if (yarimamulList) {
        // İlk yarı mamul hariç hepsini temizle
        const items = yarimamulList.querySelectorAll('.yarimamul-item');
        for (let i = 1; i < items.length; i++) {
            items[i].remove();
        }
        
        // İlk yarı mamulü sıfırla
        const firstItem = yarimamulList.querySelector('.yarimamul-item');
        if (firstItem) {
            firstItem.querySelector('.yarimamul-adi').value = '';
            firstItem.querySelector('.yarimamul-birim').value = 'adet';
            firstItem.querySelector('.yarimamul-miktar').value = '1';
            firstItem.querySelector('.yarimamul-agirlik').value = '';
            
            // Silme butonunu gizle
            const removeBtn = firstItem.querySelector('.remove-yarimamul');
            if (removeBtn) {
                removeBtn.style.display = 'none';
            }
        }
    }
    
    // Kullanım alanı başlangıç durumunu ayarla
    toggleYariMamulPanel('parca');
}


// Modal açıldığında ve kapandığında formu sıfırla
function setupPlakaIslemModalEvents() {
    const modal = document.getElementById('plakaIslemModal');
    if (modal) {
        // Modal açıldığında formu sıfırla
        modal.addEventListener('show', function() {
            resetPlakaIslemForm();
        });
        
        // Modal kapatıldığında da temizleyelim
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                resetPlakaIslemForm();
            });
        }
    }
}


function setupParcaIslemModalEvents() {
    const modal = document.getElementById('parcaIslemModal');
    if (modal) {
        // Modal açıldığında formu sıfırla
        modal.addEventListener('show', function() {
            resetParcaIslemForm();
        });
        
        // Modal kapatıldığında da temizleyelim
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                resetParcaIslemForm();
            });
        }
    }
}


// Modal olaylarını ayarla
document.addEventListener('DOMContentLoaded', function() {
    setupPlakaIslemModalEvents();
    setupParcaIslemModalEvents();
    
    // Readonly stili için CSS ekle
    const style = document.createElement('style');
    style.textContent = `
        .readonly-input {
            background-color: #f0f0f0;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
});

window.updateParcaYarimamulTotalWeight = updateParcaYarimamulTotalWeight;
window.setupYariMamulEventListeners = setupYariMamulEventListeners;
window.addNewYariMamul = addNewYariMamul;
window.addNewParcaYariMamul = addNewParcaYariMamul;
window.updateYarimamulTotalWeight=updateYarimamulTotalWeight;
window. resetPlakaIslemForm = resetPlakaIslemForm;
window.resetParcaIslemForm = resetParcaIslemForm;
window.setupPlakaIslemModalEvents = setupPlakaIslemModalEvents;
window.setupParcaIslemModalEvents = setupParcaIslemModalEvents;