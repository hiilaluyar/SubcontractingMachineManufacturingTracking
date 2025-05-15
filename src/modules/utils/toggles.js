function togglePlakaFormSections() {
    const kullanimAlani = document.getElementById('plakaKullanimAlani').value;
    const musteriPanel = document.getElementById('plakaMusteriPanel');
    const yariMamulPanel = document.getElementById('plakaYariMamulPanel');
    
    if (kullanimAlani === 'FasonImalat') {
      // Fason imalat seçildiğinde müşteri panelini göster, yarı mamul panelini gizle
      musteriPanel.style.display = 'flex';
      yariMamulPanel.style.display = 'none';
    } else if (kullanimAlani === 'MakineImalat') {
      // Makine imalat seçildiğinde yarı mamul panelini göster, müşteri panelini gizle
      yariMamulPanel.style.display = 'block';
      musteriPanel.style.display = 'none';
    } else {
      // Diğer durumlarda ikisini de gizle
      musteriPanel.style.display = 'none';
      yariMamulPanel.style.display = 'none';
    }
  }
  
  // Parça işlem modalında gerekli alanları göster/gizle
  function toggleParcaFormSections() {
    const kullanimAlani = document.getElementById('parcaKullanimAlani').value;
    const musteriPanel = document.getElementById('parcaMusteriPanel');
    const yariMamulPanel = document.getElementById('parcaYariMamulPanel');
    
    if (kullanimAlani === 'FasonImalat') {
      if (musteriPanel) musteriPanel.style.display = 'flex';
      if (yariMamulPanel) yariMamulPanel.style.display = 'none';
    } else if (kullanimAlani === 'MakineImalat') {
      if (yariMamulPanel) yariMamulPanel.style.display = 'block';
      if (musteriPanel) musteriPanel.style.display = 'none';
    } else {
      if (musteriPanel) musteriPanel.style.display = 'none';
      if (yariMamulPanel) yariMamulPanel.style.display = 'none';
    }
  }
  

// Sayfa yüklendiğinde fonksiyonları tanımla
document.addEventListener('DOMContentLoaded', function() {
   
    // Kullanım alanı değişikliğini dinle
    const plakaKullanimAlani = document.getElementById('plakaKullanimAlani');
    if (plakaKullanimAlani) {
      plakaKullanimAlani.addEventListener('change', togglePlakaFormSections);
    }
    
    const parcaKullanimAlani = document.getElementById('parcaKullanimAlani');
    if (parcaKullanimAlani) {
      parcaKullanimAlani.addEventListener('change', toggleParcaFormSections);
    }
  });





  function toggleKalanParcaPanel() {
    const kalanParcaSwitch = document.getElementById('kalanParcaSwitch');
    const kalanParcaPanel = document.getElementById('kalanParcaPanel');
    
    if (kalanParcaSwitch.checked) {
        kalanParcaPanel.style.display = 'block';
     
        
        // Eğer mesaj zaten yoksa ekle
        if (!document.querySelector('.info-message')) {
            kalanParcaPanel.insertBefore(infoMessage, kalanParcaPanel.firstChild);
        }
    } else {
        kalanParcaPanel.style.display = 'none';
        resetKalanParcaList(); // Panel kapatıldığında listeyi temizle
    }
}


  // Parça Kalan Parça Panelini Aç/Kapat
  function toggleParcaKalanParcaPanel() {
    const kalanParcaSwitch = document.getElementById('parcaKalanParcaSwitch');
    const kalanParcaPanel = document.getElementById('parcaKalanParcaPanel');
    
    if (kalanParcaSwitch.checked) {
        kalanParcaPanel.style.display = 'block';
        
        // infoMessage'ı dinamik olarak oluştur
        const infoMessage = document.createElement('div');
        infoMessage.className = 'info-message';
        infoMessage.innerHTML = 'Kalan parçalar oluşturulacak.';
        
        // Eğer mesaj zaten yoksa ekle
        if (!document.querySelector('.info-message')) {
            kalanParcaPanel.insertBefore(infoMessage, kalanParcaPanel.firstChild);
        }
    } else {
        kalanParcaPanel.style.display = 'none';
        resetParcaKalanParcaList(); // Panel kapatıldığında listeyi temizle
    }
}


function toggleYariMamulPanel(prefix) {
    const kullanimAlani = document.getElementById(prefix + 'KullanimAlani').value;
    const yariMamulPanel = document.getElementById(prefix + 'YariMamulPanel');
    const musteriPanel = document.getElementById(prefix + 'MusteriPanel');
    
    // Kullanım ve Hurda input elementleri
    const kullanilanMiktarInput = document.getElementById(prefix + 'KullanilanMiktar');
    const hurdaMiktarInput = document.getElementById(prefix + 'HurdaMiktar');
    
    if (kullanimAlani === 'MakineImalat') {
        // Makine İmalat seçildiğinde
        if (yariMamulPanel) yariMamulPanel.style.display = 'block';
        if (musteriPanel) musteriPanel.style.display = 'none';
        
        // Kullanılan ve Hurda alanlarını salt okunur yap
        if (kullanilanMiktarInput) {
            kullanilanMiktarInput.readOnly = true;
            kullanilanMiktarInput.classList.add('readonly-input');
        }
        
        if (hurdaMiktarInput) {
            hurdaMiktarInput.readOnly = true;
            hurdaMiktarInput.classList.add('readonly-input');
        }
        
        // İlk yükleme için toplam ağırlık hesaplamasını başlat
        if (prefix === 'plaka') {
            updateYarimamulTotalWeight();
        } else {
            updateParcaYarimamulTotalWeight();
        }
        
    } else {
        // Fason İmalat seçildiğinde
        if (yariMamulPanel) yariMamulPanel.style.display = 'none';
        if (musteriPanel) musteriPanel.style.display = 'block';
        
        // Kullanılan ve Hurda alanlarını düzenlenebilir yap
        if (kullanilanMiktarInput) {
            kullanilanMiktarInput.readOnly = false;
            kullanilanMiktarInput.classList.remove('readonly-input');
        }
        
        if (hurdaMiktarInput) {
            hurdaMiktarInput.readOnly = false;
            hurdaMiktarInput.classList.remove('readonly-input');
        }
    }
}


function toggleMakineSectionEdit() {
  const kullanimAlani = document.getElementById('duzenleSarfMalzemeKullanimAlani').value;
  const makineSection = document.getElementById('duzenleSarfMakineCalisanSection');
  const makineSecimi = document.getElementById('duzenleSarfMalzemeMakineSecimi');
  const makineLabel = makineSecimi.previousElementSibling;
  
  // Önce görünürlük ayarlaması
  if (kullanimAlani === 'FasonImalat') {
      makineSection.style.display = 'flex';
      makineSecimi.style.display = '';  // Normal gösterme
      makineLabel.style.display = '';   // Etiketi göster
      makineSecimi.required = true;
  } else if (kullanimAlani === 'MakineImalat') {
      makineSection.style.display = 'flex';
      makineSecimi.style.display = 'none';
      makineLabel.style.display = 'none'; // Etiketi gizle
      makineSecimi.required = false;
  } else {
      makineSection.style.display = 'none';
      makineSecimi.required = false;
  }
}



function toggleYariMamulPanelIki() {
  const kullanimAlani = document.getElementById('kullanimAlani').value;
  const musteriPanel = document.getElementById('musteriPanel');
  const yariMamulPanel = document.getElementById('yariMamulPanel');
  
  if (kullanimAlani === 'FasonImalat') {
      if (musteriPanel) musteriPanel.style.display = 'flex';
      if (yariMamulPanel) yariMamulPanel.style.display = 'none';
  } else if (kullanimAlani === 'MakineImalat') {
      if (yariMamulPanel) yariMamulPanel.style.display = 'block';
      if (musteriPanel) musteriPanel.style.display = 'none';
  } else {
      if (musteriPanel) musteriPanel.style.display = 'none';
      if (yariMamulPanel) yariMamulPanel.style.display = 'none';
  }
}



function toggleMakineSection() {
  const kullanimAlani = document.getElementById('sarfMalzemeKullanimAlani').value;
  const makineSection = document.getElementById('sarfMakineCalisanSection');
  const makineSecimi = document.getElementById('sarfMalzemeMakineSecimi');
  const makineLabel = makineSecimi.previousElementSibling;
  
  // Önce görünürlük ayarlaması
  if (kullanimAlani === 'FasonImalat') {
      makineSection.style.display = 'flex';
      makineSecimi.style.display = '';  // Normal gösterme
      makineLabel.style.display = '';   // Etiketi göster
      makineSecimi.required = true;
      
      // Çalışanları yükle
      loadCalisanlarForSelect('sarfMalzemeCalisanSecimi');
  } else if (kullanimAlani === 'MakineImalat') {
      makineSection.style.display = 'flex';
      makineSecimi.style.display = 'none';
      makineLabel.style.display = 'none'; // Etiketi gizle
      makineSecimi.required = false;
      
      // Çalışanları yükle
      loadCalisanlarForSelect('sarfMalzemeCalisanSecimi');
  } else {
      makineSection.style.display = 'none';
      makineSecimi.required = false;
  }
}


function toggleYariMamulMakineSection() {
    const kullanimAlani = document.getElementById('yariMamulKullanimAlani').value;
    const makineCalisanSection = document.getElementById('yariMamulMakineCalisanSection');
    
    if (kullanimAlani === 'MakineImalat') {
        makineCalisanSection.style.display = 'flex'; // veya 'block' - tasarıma göre
    } else {
        makineCalisanSection.style.display = 'none';
    }
}


  window.toggleParcaFormSections = toggleParcaFormSections;
  window.togglePlakaFormSections = togglePlakaFormSections;
  window.toggleParcaKalanParcaPanel = toggleParcaKalanParcaPanel;
  window.toggleKalanParcaPanel = toggleKalanParcaPanel;
  window.toggleYariMamulPanel = toggleYariMamulPanel;
  window.toggleMakineSectionEdit = toggleMakineSectionEdit;
  window.toggleYariMamulPanelIki = toggleYariMamulPanelIki;
  window.toggleMakineSection = toggleMakineSection;
  window.toggleYariMamulMakineSection = toggleYariMamulMakineSection;