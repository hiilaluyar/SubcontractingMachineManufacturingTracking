// src/renderer/js/deleteConfirmationModalUpdated.js
// Güncellenmiş silme modalı

/**
 * Genel amaçlı silme onay modalı oluşturur
 * @param {Object} options - Modal ayarları
 * @param {string} options.title - Modal başlığı
 * @param {string} options.message - Modal mesajı
 * @param {string} options.itemName - Silinecek öğe adı
 * @param {string} options.itemType - Silinecek öğe türü (hammadde, sarf malzeme, vb.)
 * @param {Function} options.onConfirm - Onay sonrası çalışacak fonksiyon
 * @param {Object} options.userData - Güncel kullanıcı bilgileri
 * @returns {HTMLElement} Modal elementi
 */
function createDeleteConfirmationModal(options) {
  // Kullanıcı rolünü kontrol et
  if (options.userData.rol !== 'yonetici') {
    showToast('Bu işlem için yönetici yetkisi gereklidir.', 'error');
    return null;
  }

  // Önceden açık bir modal varsa kapat
  const existingModal = document.getElementById('ksm_deleteConfirmationModal');
  if (existingModal) {
    existingModal.remove();
  }

  // Ana modal container
  const modalContainer = document.createElement('div');
  modalContainer.id = 'ksm_deleteConfirmationModal';
  modalContainer.className = 'ksm_modal_overlay';
  
  // Modal içeriği
  const modalContent = document.createElement('div');
  modalContent.className = 'ksm_modal_content';
  
  // Modal başlığı
  const modalHeader = document.createElement('div');
  modalHeader.className = 'ksm_modal_header';
  
  const modalTitle = document.createElement('h2');
  modalTitle.textContent = options.title || 'Silme Onayı';
  modalHeader.appendChild(modalTitle);
  
  const closeButton = document.createElement('button');
  closeButton.className = 'ksm_close_button';
  closeButton.innerHTML = '&times;';
  closeButton.onclick = () => {
    modalContainer.remove();
  };
  modalHeader.appendChild(closeButton);
  
  // Modal mesajı
  const modalBody = document.createElement('div');
  modalBody.className = 'ksm_modal_body';
  
  const warningIcon = document.createElement('div');
  warningIcon.className = 'ksm_warning_icon';
  warningIcon.innerHTML = '⚠️';
  modalBody.appendChild(warningIcon);
  
  const messageElement = document.createElement('div');
  messageElement.className = 'ksm_modal_message';
  
  // Temel mesajı oluştur
  const messageContent = document.createElement('p');
  messageContent.innerHTML = `"${options.itemName}" öğesini silmek istediğinizden emin misiniz?`;
  messageElement.appendChild(messageContent);
  
  // İkincil stok ile ilgili kod kaldırıldı
  
  modalBody.appendChild(messageElement);
  
  const warningText = document.createElement('p');
  warningText.className = 'ksm_warning_text';
  
  // İşlem tipine göre doğru uyarı metnini göster
  if (options.itemType && options.itemType.includes('İşlemi')) {
    // İşlem silme durumunda özel mesajlar
    if (options.itemType.includes('Hammadde')) {
      warningText.textContent = "Bu işlem silindiğinde, kullanılan hammadde miktarı otomatik olarak stoğa geri eklenecektir.";
    } else if (options.itemType.includes('Sarf Malzeme')) {
      warningText.textContent = "Bu işlem silindiğinde, kullanılan sarf malzeme miktarı otomatik olarak stoğa geri eklenecektir.";
    } else if (options.itemType.includes('Yarı Mamul')) {
      warningText.textContent = "Bu işlem silindiğinde, kullanılan yarı mamul miktarı otomatik olarak stoğa geri eklenecektir.";
    } else {
      warningText.textContent = "Bu işlem silindiğinde ilgili stok miktarları otomatik olarak güncellenecektir.";
    }
  } else {
    // Normal stok silme durumunda
    warningText.textContent = `${options.itemType || 'Öğe'} silindikten sonra geri alınamaz ve tüm ilişkili veriler kalıcı olarak silinecektir.`;
  }
  
  modalBody.appendChild(warningText);
    
  // Açıklama alanı
  const reasonLabel = document.createElement('label');
  reasonLabel.textContent = 'Silme Nedeni (Zorunlu):';
  reasonLabel.setAttribute('for', 'ksm_deleteReason');
  reasonLabel.className = 'ksm_label';
  modalBody.appendChild(reasonLabel);
    
  const reasonTextarea = document.createElement('textarea');
  reasonTextarea.id = 'ksm_deleteReason';
  reasonTextarea.className = 'ksm_textarea';
  reasonTextarea.placeholder = 'Lütfen silme nedeninizi açıklayın...';
  reasonTextarea.required = true;
  reasonTextarea.rows = 4;
  modalBody.appendChild(reasonTextarea);
    
  // Butonlar
  const modalFooter = document.createElement('div');
  modalFooter.className = 'ksm_modal_footer';
    
  const cancelButton = document.createElement('button');
  cancelButton.className = 'ksm_btn ksm_btn_secondary';
  cancelButton.textContent = 'İptal';
  cancelButton.onclick = () => {
    modalContainer.remove();
  };
  modalFooter.appendChild(cancelButton);
    
  const confirmButton = document.createElement('button');
  confirmButton.className = 'ksm_btn ksm_btn_danger';
  confirmButton.textContent = 'Sil';
  confirmButton.disabled = true; // Başlangıçta devre dışı
    
  // Açıklama girildiğinde butonu aktif et
  reasonTextarea.addEventListener('input', () => {
    const reasonText = reasonTextarea.value.trim();
    confirmButton.disabled = reasonText.length < 3;
      
    // Renklendirme ile kullanıcıya geri bildirim
    if (reasonText.length < 3) {
      reasonTextarea.style.borderColor = '#dc3545';
    } else {
      reasonTextarea.style.borderColor = '#28a745';
    }
  });
    
  confirmButton.onclick = async () => {
    const deleteReason = reasonTextarea.value.trim();
      
    if (deleteReason.length < 3) {
      alert('Lütfen en az 3 karakter uzunluğunda bir silme nedeni giriniz.');
      return;
    }
      
    // Son onay modalı
    const finalConfirmation = document.createElement('div');
    finalConfirmation.className = 'ksm_final_confirmation';
      
    const finalMessage = document.createElement('p');
    
    // İşlem veya stok silme durumuna göre farklı onay mesajı göster
    if (options.itemType && options.itemType.includes('İşlemi')) {
      finalMessage.innerHTML = `<strong>Son Onay:</strong> Bu işlem silinecek ve ilgili stok miktarları güncellenecektir. Şirket e-posta adresine silme bilgisi gönderilecektir. Onaylıyor musunuz?`;
    } else {
      finalMessage.innerHTML = `<strong>Son Onay:</strong> ${options.itemType || 'Öğe'} ve tüm ilişkili veriler kalıcı olarak silinecek ve şirket mailine bildirim gönderilecektir. Onaylıyor musunuz?`;
    }
    
    finalConfirmation.appendChild(finalMessage);
      
    const finalButtons = document.createElement('div');
    finalButtons.className = 'ksm_final_buttons';
      
    const backButton = document.createElement('button');
    backButton.className = 'ksm_btn ksm_btn_secondary';
    backButton.textContent = 'Geri';
    backButton.onclick = () => {
      modalBody.removeChild(finalConfirmation);
      modalFooter.style.display = 'flex';
    };
    finalButtons.appendChild(backButton);
      
    const finalConfirmButton = document.createElement('button');
    finalConfirmButton.className = 'ksm_btn ksm_btn_danger';
    finalConfirmButton.textContent = 'Onaylıyorum';
    finalConfirmButton.onclick = async () => {
      try {
        modalBody.innerHTML = '<div class="ksm_loading_spinner"></div><p>İşlem gerçekleştiriliyor...</p>';
        modalFooter.style.display = 'none';
          
        // Silme bilgileri
        const deleteInfo = {
          itemType: options.itemType,
          itemName: options.itemName,
          itemId: options.itemId,
          reason: deleteReason,
          user: `${options.userData.ad} ${options.userData.soyad} (${options.userData.kullanici_adi})`,
          timestamp: new Date().toLocaleString('tr-TR')
        };
          
        // Silme işlemini yap
        if (typeof options.onConfirm === 'function') {
          await options.onConfirm(deleteReason);
        }
          
        // Başarı mesajı göster
        modalBody.innerHTML = '<div class="ksm_success_icon">✓</div><p>Silme işlemi başarıyla tamamlandı.</p>';
          
        // Modal'ı kapat
        setTimeout(() => {
          modalContainer.remove();
        }, 2000);
      } catch (error) {
        console.error('Silme işlemi sırasında hata:', error);
        modalBody.innerHTML = `<div class="ksm_error_icon">✗</div><p>Silme işlemi sırasında bir hata oluştu: ${error.message}</p>`;
          
        const closeErrorButton = document.createElement('button');
        closeErrorButton.className = 'ksm_btn ksm_btn_primary';
        closeErrorButton.textContent = 'Kapat';
        closeErrorButton.onclick = () => {
          modalContainer.remove();
        };
          
        modalFooter.innerHTML = '';
        modalFooter.appendChild(closeErrorButton);
        modalFooter.style.display = 'flex';
      }
    };
    finalButtons.appendChild(finalConfirmButton);
      
    finalConfirmation.appendChild(finalButtons);
      
    modalBody.appendChild(finalConfirmation);
    modalFooter.style.display = 'none';
  };
    
  modalFooter.appendChild(confirmButton);
    
  // Modal yapısını birleştir
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modalContent.appendChild(modalFooter);
  modalContainer.appendChild(modalContent);
    
  return modalContainer;
}

/**
 * Modal CSS stillerini ekle
 */
function addModalStyles() {
  const styleId = 'ksm_deleteConfirmationModalStyles';
    
  // Eğer stil zaten eklenmişse tekrar ekleme
  if (document.getElementById(styleId)) {
    return;
  }
    
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .ksm_modal_overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
      
    .ksm_modal_content {
      background-color: white;
      border-radius: 8px;
      width: 500px;
      max-width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
    }
      
    .ksm_modal_header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      border-bottom: 1px solid #ddd;
      background-color: #f8f9fa;
      border-radius: 8px 8px 0 0;
    }
      
    .ksm_modal_header h2 {
      margin: 0;
      font-size: 20px;
      color: #dc3545;
    }
      
    .ksm_close_button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
    }
      
    .ksm_modal_body {
      padding: 20px;
      flex-grow: 1;
    }
      
    .ksm_warning_icon {
      font-size: 40px;
      text-align: center;
      margin-bottom: 15px;
    }
      
    .ksm_modal_message {
      font-size: 16px;
      margin-bottom: 10px;
      font-weight: bold;
    }
      
    .ksm_warning_text {
      color: #dc3545;
      margin-bottom: 20px;
    }
      
    .ksm_modal_footer {
      display: flex;
      justify-content: flex-end;
      padding: 15px 20px;
      border-top: 1px solid #ddd;
      gap: 10px;
    }
      
    .ksm_label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
      
    .ksm_textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      resize: vertical;
      margin-bottom: 15px;
      font-family: inherit;
    }
      
    .ksm_btn {
      padding: 8px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }
      
    .ksm_btn_secondary {
      background-color: #6c757d;
      color: white;
    }
      
    .ksm_btn_danger {
      background-color: #dc3545;
      color: white;
    }
      
    .ksm_btn_primary {
      background-color: #007bff;
      color: white;
    }
      
    .ksm_btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
      
    .ksm_final_confirmation {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      padding: 15px;
      margin-top: 15px;
    }
      
    .ksm_final_buttons {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 10px;
    }
      
    .ksm_loading_spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: ksm_spin 2s linear infinite;
      margin: 20px auto;
    }
      
    @keyframes ksm_spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
      
    .ksm_success_icon, .ksm_error_icon {
      font-size: 40px;
      text-align: center;
      margin: 20px 0;
    }
      
    .ksm_success_icon {
      color: #28a745;
    }
      
    .ksm_error_icon {
      color: #dc3545;
    }
  `;
    
  document.head.appendChild(style);
}
  
/**
 * Modal'ı kullanıma hazır hale getir
 * @param {Object} options - Modal ayarları
 * @returns {boolean} Modal gösterildi mi
 */
function showDeleteConfirmationModal(options) {
  // Stilleri ekle
  addModalStyles();
    
  // Modal'ı oluştur
  const modal = createDeleteConfirmationModal(options);
  if (!modal) return false;
    
  // Modal'ı sayfaya ekle
  document.body.appendChild(modal);
    
  return true;
}
  
// Dışa aktar
window.showDeleteConfirmationModal = showDeleteConfirmationModal;