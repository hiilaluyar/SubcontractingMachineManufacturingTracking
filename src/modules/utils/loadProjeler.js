

async function loadProjelerForPlakaIslemModal() {
    try {
        // Dikkat: window.electronAPI.invoke.database.getAllProjeler() kullanın
        const result = await window.electronAPI.invoke.database.getAllProjeler();
        
        const projeSecimi = document.getElementById('plakaProjeSecimi');
        projeSecimi.innerHTML = '<option value="">-- Proje Seçin --</option>';
        
        if (result.success && result.projeler && result.projeler.length > 0) {
            result.projeler.forEach(proje => {
                const option = document.createElement('option');
                option.value = proje.id;
                option.textContent = proje.adi;
                projeSecimi.appendChild(option);
            });
        }
        
        return result;
    } catch (error) {
        console.error('Proje listesi yükleme hatası:', error);
        console.error('Hata detayı:', error.stack);
        showToast('Proje listesi yüklenirken bir hata oluştu.', 'error');
        return { success: false, message: 'Proje listesi alınamadı.' };
    }
}



// Plaka İşlem Modalını açtığında projeleri yükle
function setupPlakaIslemModalProjects() {
    const plakaIslemModal = document.getElementById('plakaIslemModal');
    
    if (plakaIslemModal) {
        // Modal açılırken projeleri yükle
        plakaIslemModal.addEventListener('show', function() {
            loadProjelerForPlakaIslemModal();
        });
    }
}

// Sayfa yüklendiğinde event listener'ları kur
document.addEventListener('DOMContentLoaded', function() {
    // Plaka İşlem Modalı için proje yükleme
    setupPlakaIslemModalProjects();
    
    // Plaka İşlem Modalındaki yeni proje ekleme butonu
    const plakaYeniProjeEkleBtn = document.getElementById('plakaYeniProjeEkleBtn');
    if (plakaYeniProjeEkleBtn) {
        plakaYeniProjeEkleBtn.addEventListener('click', function() {
            // Plaka İşlem Modalını kapat
            closeModal('plakaIslemModal');
            
            // Yeni Proje Modalını aç
            openYeniProjeModal('plakaIslemModal');
        });
    }
});

// Plaka İşlem Modalı açıldığında projeleri yükleme fonksiyonu
function loadPlakaIslemModalProjects() {
    // Önce mevcut seçenekleri temizle
    const projeSecimi = document.getElementById('plakaProjeSecimi');
    projeSecimi.innerHTML = '<option value="">-- Proje Seçin --</option>';
    
    // Projeleri yükle
    loadProjelerForPlakaIslemModal();
}



/* 

async function loadProjesForParcaIslemModal() {
    try {
        // Get projects from database
        const result = await window.electronAPI.invoke.database.getAllProjeler();
        
        // Get all project selection dropdowns that might exist in the document
        const projectSelectors = [
            document.getElementById('parcaProjeSecimi'),
            document.getElementById('plakaProjeSecimi'),
            document.getElementById('projeSecimi'),
            document.getElementById('sarfMalzemeProjeSecimi'),
            document.getElementById('yariMamulProjeSecimi'),
            document.getElementById('ikincilStokProjeSecimi')
        ];
        
        // For each dropdown that exists in the document
        projectSelectors.forEach(selector => {
            if (selector) {
                // Clear existing options
                selector.innerHTML = '<option value="">-- Proje Seçin --</option>';
                
                // Add projects if available
                if (result.success && result.projeler && result.projeler.length > 0) {
                    result.projeler.forEach(proje => {
                        const option = document.createElement('option');
                        option.value = proje.id;
                        option.textContent = proje.adi;
                        selector.appendChild(option);
                    });
                }
            }
        });
        
        return result;
    } catch (error) {
        console.error('Proje listesi yükleme hatası:', error);
        console.error('Hata detayı:', error.stack);
        showToast('Proje listesi yüklenirken bir hata oluştu.', 'error');
        return { success: false, message: 'Proje listesi alınamadı.' };
    }
}

*/


/* // Ensure the getAllProjeler function is available
if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database || !window.electronAPI.invoke.database.getAllProjeler) {
    if (!window.electronAPI) window.electronAPI = { invoke: { database: {} } };
    if (!window.electronAPI.invoke) window.electronAPI.invoke = { database: {} };
    if (!window.electronAPI.invoke.database) window.electronAPI.invoke.database = {};
    
    window.electronAPI.invoke.database.getAllProjeler = async function() {
        // Mock data for testing
        const mockProjeler = [
            { id: 1, adi: 'Proje 1' },
            { id: 2, adi: 'Proje 2' },
            { id: 3, adi: 'Proje 3' },
            { id: 4, adi: 'Proje 4' },
            { id: 5, adi: 'Proje 5' }
        ];
        return { success: true, projeler: mockProjeler };
    };
}
 */



async function loadProjeler() {
    try {
      const result = await window.electronAPI.invoke.database.getAllProjeler();
      
      // Tüm proje seçim alanlarını güncelle
      const projeSecimleri = [
        document.getElementById('plakaProjeSecimi'),
        document.getElementById('projeSecimi'),
        document.getElementById('parcaProjeSecimi'),
        document.getElementById('sarfMalzemeProjeSecimi'),
        document.getElementById('yariMamulProjeSecimi'),
        document.getElementById('ikincilStokProjeSecimi'),
        document.getElementById('duzenleProjeSecimi'),
        document.getElementById('duzenleIkincilStokProjeSecimi')
      ];
      
      // Her bir proje seçimini güncelle
      projeSecimleri.forEach(select => {
        if (select) {
          // Mevcut içeriği temizle
          select.innerHTML = '<option value="">-- Proje Seçin --</option>';
          
          // Projeleri ekle
          if (result.success && result.projeler && result.projeler.length > 0) {
            result.projeler.forEach(proje => {
              const option = document.createElement('option');
              option.value = proje.id;
              option.textContent = proje.proje_adi || proje.adi; // proje_adi veya adi alanını kullan
              select.appendChild(option);
            });
          }
        }
      });
      
      // Projeler sayfasındaki tabloyu da güncelle
      const projeTable = document.getElementById('projelerTable');
      if (projeTable) {
        const tableBody = projeTable.getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
        
        if (result.success && result.projeler && result.projeler.length > 0) {
          result.projeler.forEach(proje => {
            const row = tableBody.insertRow();
            
            // Proje Kodu
            const cell1 = row.insertCell(0);
            cell1.textContent = proje.proje_kodu || '';
            
            // Proje Adı
            const cell2 = row.insertCell(1);
            cell2.textContent = proje.proje_adi || proje.adi || '';
            
            // Tarih
            const cell3 = row.insertCell(2);
            const date = proje.olusturma_tarihi ? new Date(proje.olusturma_tarihi) : new Date();
            cell3.textContent = date.toLocaleDateString('tr-TR');
            
            // Ekleyen Kişi
            const cell4 = row.insertCell(3);
            cell4.textContent = currentUser ? `${currentUser.ad} ${currentUser.soyad}` : 'Bilinmiyor';
          });
        } else {
          const row = tableBody.insertRow();
          row.innerHTML = '<td colspan="4" class="text-center">Proje bulunamadı</td>';
        }
      }
      
      return result;
    } catch (error) {
      console.error('Proje listesi yükleme hatası:', error);
      return { success: false, message: 'Proje listesi alınamadı.', projeler: [] };
    }
  }



  
function updateProjeSelection(projeler) {
    const projeSecimi = document.getElementById('projeSecimi');
    projeSecimi.innerHTML = '<option value="">-- Proje Seçin --</option>';
    
    projeler.forEach(proje => {
        const option = document.createElement('option');
        option.value = proje.id;
        // Only display the project name without code prefix
        option.textContent = proje.proje_adi;
        projeSecimi.appendChild(option);
    });
}

window.loadProjelerForPlakaIslemModal = loadProjelerForPlakaIslemModal;
window.setupPlakaIslemModalProjects = setupPlakaIslemModalProjects;
window.loadPlakaIslemModalProjects=loadPlakaIslemModalProjects;
window.loadProjeler = loadProjeler;
window.updateProjeSelection = updateProjeSelection;