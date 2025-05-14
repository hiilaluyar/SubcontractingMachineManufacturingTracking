function resetPlakaIslemForm() {
    const inputs = [
      'plakaKullanilanMiktar',
      'plakaHurdaMiktar',
      'plakaYariMamulAdi',
      'plakaYariMamulMiktar'
    ];
    
    inputs.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.value = '';
    });
    
    // Plaka hurda miktarını sıfırla
    const hurdaMiktarInput = document.getElementById('plakaHurdaMiktar');
    if (hurdaMiktarInput) hurdaMiktarInput.value = '0';
    
    // Select elementlerini varsayılan değerlerine ayarla
    const selects = [
      { id: 'plakaIslemTuru', defaultValue: 'LazerKesim' },
      { id: 'plakaKullanimAlani', defaultValue: 'FasonImalat' },
      { id: 'plakaMakineSecimi', defaultValue: '' },
      { id: 'plakaCalisanSecimi', defaultValue: '' },
      { id: 'plakaYariMamulBirim', defaultValue: 'adet' }
    ];
    
    selects.forEach(item => {
      const element = document.getElementById(item.id);
      if (element) element.value = item.defaultValue;
    });
    
    // Kalan parça panelini kapat
    const kalanParcaSwitch = document.getElementById('kalanParcaSwitch');
    if (kalanParcaSwitch) {
      kalanParcaSwitch.checked = false;
      toggleKalanParcaPanel();
    }
    
    // Hata ve başarı mesajlarını temizle
    const errorEl = document.getElementById('plakaIslemModal-error');
    const successEl = document.getElementById('plakaIslemModal-success');
    
    if (errorEl) errorEl.style.display = 'none';
    if (successEl) successEl.style.display = 'none';
  }
  
  function resetParcaIslemForm() {
    const inputs = [
      'parcaKullanilanMiktar',
      'parcaHurdaMiktar',
      'parcaYariMamulAdi',
      'parcaYariMamulMiktar'
    ];
    
    inputs.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.value = '';
    });
    
    // Parça hurda miktarını sıfırla
    const hurdaMiktarInput = document.getElementById('parcaHurdaMiktar');
    if (hurdaMiktarInput) hurdaMiktarInput.value = '0';
    
    // Select elementlerini varsayılan değerlerine ayarla
    const selects = [
      { id: 'parcaIslemTuru', defaultValue: 'LazerKesim' },
      { id: 'parcaKullanimAlani', defaultValue: 'FasonImalat' },
      { id: 'parcaMakineSecimi', defaultValue: '' },
      { id: 'parcaCalisanSecimi', defaultValue: '' },
      { id: 'parcaYariMamulBirim', defaultValue: 'adet' }
    ];
    
    selects.forEach(item => {
      const element = document.getElementById(item.id);
      if (element) element.value = item.defaultValue;
    });
    
    // Kalan parça panelini kapat
    const kalanParcaSwitch = document.getElementById('parcaKalanParcaSwitch');
    if (kalanParcaSwitch) {
      kalanParcaSwitch.checked = false;
      toggleParcaKalanParcaPanel();
    }
    
    // Hata ve başarı mesajlarını temizle
    const errorEl = document.getElementById('parcaIslemModal-error');
    const successEl = document.getElementById('parcaIslemModal-success');
    
    if (errorEl) errorEl.style.display = 'none';
    if (successEl) successEl.style.display = 'none';
  }
  


  function resetKalanParcaList() {
    kalanParcalar = [];
    updateKalanParcaListUI();
    document.getElementById('plakaHurdaMiktar').value = '0';
}

  window.resetPlakaIslemForm = resetPlakaIslemForm;
  window.resetParcaIslemForm = resetParcaIslemForm;
  window.resetKalanParcaList = resetKalanParcaList;