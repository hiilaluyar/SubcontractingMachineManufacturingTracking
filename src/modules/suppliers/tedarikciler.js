

// Load suppliers list
async function loadTedarikciListesi() {
    try {
      console.log('Tedarikçi listesi yükleniyor...');
      
      // API kontrolü
      if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
        console.error('Database invoke metodu bulunamadı');
        
        const tedarikciTable = document.getElementById('tedarikciTable').getElementsByTagName('tbody')[0];
        tedarikciTable.innerHTML = '<tr><td colspan="3" class="text-center">Veri yüklenirken hata oluştu</td></tr>';
        return;
      }
  
      // Tedarikçileri al
      const result = await window.electronAPI.invoke.database.getAllTedarikci();
      
      // Tabloyu doldur
      const tedarikciTable = document.getElementById('tedarikciTable').getElementsByTagName('tbody')[0];
      tedarikciTable.innerHTML = '';
      
      if (!result.success || !result.tedarikci || result.tedarikci.length === 0) {
        const row = tedarikciTable.insertRow();
        row.innerHTML = '<td colspan="3" class="text-center">Tedarikçi bulunamadı</td>';
        return;
      }
      
      result.tedarikci.forEach(tedarikci => {
        const row = tedarikciTable.insertRow();
        
        // Tedarikçi Adı
        row.insertCell(0).textContent = tedarikci.tedarikci_adi;
        
        // Oluşturma Tarihi
        const cell2 = row.insertCell(1);
        const date = new Date(tedarikci.olusturma_tarihi);
        cell2.textContent = date.toLocaleDateString('tr-TR');
        
        // İşlemler
        const islemlerCell = row.insertCell(2);
        islemlerCell.innerHTML = `
          <div class="action-buttons">
            <button class="action-btn delete" onclick="deleteTedarikci(${tedarikci.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `;
      });
      
      // Ayrıca seçim kutularını da güncelle
      updateTedarikciSelection(result.tedarikci);
      
    } catch (error) {
      console.error('Tedarikçi listesi yükleme hatası:', error);
      
      const tedarikciTable = document.getElementById('tedarikciTable').getElementsByTagName('tbody')[0];
      tedarikciTable.innerHTML = '<tr><td colspan="3" class="text-center">Veri yüklenirken hata oluştu</td></tr>';
    }
  }

  
  // Add event listeners
  document.addEventListener('DOMContentLoaded', function() {
    // Setup tedarikci page event listeners
    const tedarikciSayfasi = document.querySelector('a[data-page="tedarikci-listesi"]');
    if (tedarikciSayfasi) {
      tedarikciSayfasi.addEventListener('click', function() {
        loadTedarikciListesi();
      });
    }
    
    // Yeni tedarikçi butonu
    const yeniTedarikciBtn = document.getElementById('yeniTedarikciBtn');
    if (yeniTedarikciBtn) {
      yeniTedarikciBtn.addEventListener('click', function() {
        // Reset currentModalId since we're not coming from another modal
        currentModalId = null;
        openModal('yeniTedarikciModal');
      });
    }
    
    // Yeni tedarikçi formu
    const yeniTedarikciForm = document.getElementById('yeniTedarikciForm');
    if (yeniTedarikciForm) {
      yeniTedarikciForm.addEventListener('submit', saveTedarikci);
    }
    
    // Hammadde giriş modalından yeni tedarikçi ekleme butonu
    const yeniTedarikciEkleBtn = document.getElementById('yeniTedarikciEkleBtn');
    if (yeniTedarikciEkleBtn) {
      yeniTedarikciEkleBtn.addEventListener('click', function() {
        openNewTedarikciModal('hammaddeGirisModal');
      });
    }
    
    // Sarf malzeme giriş modalından yeni tedarikçi ekleme butonu
    const sarfMalzemeYeniTedarikciEkleBtn = document.getElementById('sarfMalzemeYeniTedarikciEkleBtn');
    if (sarfMalzemeYeniTedarikciEkleBtn) {
      sarfMalzemeYeniTedarikciEkleBtn.addEventListener('click', function() {
        openNewTedarikciModal('sarfMalzemeGirisModal');
      });
    }
    
    // Load suppliers when the page loads
    loadTedarikciListesi();
  });



  // Update supplier selection dropdown
  function updateTedarikciSelection(tedarikciListesi) {
    const hammaddeTedarikciDatalist = document.getElementById('tedarikciListesi');
    const sarfMalzemeTedarikciDatalist = document.getElementById('sarfMalzemeListesi');
    
    // Her iki datalist'i de temizle
    if (hammaddeTedarikciDatalist) {
      hammaddeTedarikciDatalist.innerHTML = '';
      
      tedarikciListesi.forEach(tedarikci => {
        const option = document.createElement('option');
        option.value = tedarikci.tedarikci_adi;
        hammaddeTedarikciDatalist.appendChild(option);
      });
    }
    
    // Sarf malzeme için de aynı işlemi yap
    if (sarfMalzemeTedarikciDatalist) {
      sarfMalzemeTedarikciDatalist.innerHTML = '';
      
      tedarikciListesi.forEach(tedarikci => {
        const option = document.createElement('option');
        option.value = tedarikci.tedarikci_adi;
        sarfMalzemeTedarikciDatalist.appendChild(option);
      });
    }
  }
  

  
  // Save new supplier
  async function saveTedarikci(e) {
    if (e) e.preventDefault();
    
    const tedarikciAdi = document.getElementById('tedarikciAdi').value.trim();
    
    if (!tedarikciAdi) {
      showToast('Lütfen tedarikçi adını girin.', 'error');
      return;
    }
    
    try {
      // API kontrolü
      if (!window.electronAPI || !window.electronAPI.invoke || !window.electronAPI.invoke.database) {
        console.error('Database invoke metodu bulunamadı');
        showToast('Tedarikçi eklenemedi. API erişimi yok.', 'error');
        return;
      }
  
      const result = await window.electronAPI.invoke.database.addTedarikci({ tedarikci_adi: tedarikciAdi });
      
      if (result.success) {
        showToast(`Tedarikçi başarıyla eklendi.`, 'success');
        
        // Formu temizle
        document.getElementById('yeniTedarikciForm').reset();
        
        // Yeni tedarikçi modalını kapat
        closeModal('yeniTedarikciModal');
        
        // Tedarikçi listesini güncelle
        await loadTedarikciListesi();
        
        // Eğer bir giriş modalından geldiyse, geri dön ve yeni tedarikçiyi seç
        if (currentModalId) {
          const modalId = currentModalId;
          
          if (modalId === 'hammaddeGirisModal') {
            const tedarikciSecimi = document.getElementById('hammaddeGirisTedarikci');
            if (tedarikciSecimi) {
              tedarikciSecimi.value = tedarikciAdi;
            }
            openModal(modalId);
          } 
          else if (modalId === 'sarfMalzemeGirisModal') {
            const tedarikciSecimi = document.getElementById('sarfMalzemeGirisTedarikci');
            if (tedarikciSecimi) {
              tedarikciSecimi.value = tedarikciAdi;
            }
            openModal(modalId);
          }
        }
      } else {
        showToast('Hata: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Tedarikçi kaydetme hatası:', error);
      showToast('Tedarikçi kaydedilirken bir hata oluştu.', 'error');
    }
  }
  
  // Delete supplier
  async function deleteTedarikci(id) {
    if (confirm('Bu tedarikçiyi silmek istediğinize emin misiniz?')) {
      try {
        const result = await window.electronAPI.invoke.database.deleteTedarikci(id);
        
        if (result.success) {
          showToast('Tedarikçi başarıyla silindi.', 'success');
          loadTedarikciListesi();
        } else {
          showToast('Hata: ' + result.message, 'error');
        }
      } catch (error) {
        console.error('Tedarikçi silme hatası:', error);
        showToast('Tedarikçi silinirken bir hata oluştu.', 'error');
      }
    }
  }


  // Open new supplier modal from another modal
  function openNewTedarikciModal(sourceModalId) {
    // Save the source modal ID
    currentModalId = sourceModalId;
    
    // Close the source modal
    closeModal(sourceModalId);
    
    // Open the new supplier modal
    openModal('yeniTedarikciModal');
  }

  window.loadTedarikciListesi = loadTedarikciListesi;
  window.updateTedarikciSelection = updateTedarikciSelection;
  window.saveTedarikci = saveTedarikci;
  window.deleteTedarikci = deleteTedarikci;
  window.openNewTedarikciModal = openNewTedarikciModal;