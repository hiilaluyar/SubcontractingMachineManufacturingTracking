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

  window.updateHammaddeDetailUI = updateHammaddeDetailUI;