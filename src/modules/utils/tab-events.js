// Tab sistemini kuran yardımcı fonksiyon
function setupTabSystem() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Global bir değişken ekleyin
    window.isLoadingPlakaList = false;
    window.lastLoadedHammaddeId = null;
    
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Skip click handling if the tab is not displayed
        if (this.style.display === 'none') {
          console.log("Skipping click on hidden tab:", this.getAttribute('data-tab'));
          return;
        }
        
        // Remove active class from all buttons
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Hide all tab contents
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Show the relevant tab content
        const tabId = this.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
        
        console.log("Tab switched to:", tabId);
        
        // Plakalar tabına geçildiyse, plakaları sadece bir kez yükle
        if (tabId === 'plakalar-tab' && currentHammaddeId) {
          if (window.isLoadingPlakaList) {
            console.log("Plaka listesi zaten yükleniyor, işlem atlanıyor...");
            return;
          }
          
          // Aynı hammadde için tekrar yükleme yapmayı önle
          if (window.lastLoadedHammaddeId === currentHammaddeId) {
            console.log("Bu hammadde için plakalar zaten yüklendi:", currentHammaddeId);
            return;
          }
          
          window.isLoadingPlakaList = true;
          window.lastLoadedHammaddeId = currentHammaddeId;
          
          // Plakaları yükle
          loadPlakaList(currentHammaddeId).finally(() => {
            window.isLoadingPlakaList = false;
          });
        }
      });
    });
    
    console.log("Tab system setup completed");
  }
  


  window.setupTabSystem = setupTabSystem;