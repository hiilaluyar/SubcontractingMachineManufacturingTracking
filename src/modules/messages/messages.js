
// Hata ve bilgi gösterme fonksiyonları
function showError(message) {
    window.api.send('show-error', message);
}

window.showError = showError;

function showInfo(title, message) {
    window.api.send('show-info', {
        type: 'info',
        title: title,
        message: message
    });
}

window.showInfo = showInfo;

// Add this to your main.js file

// Daha iyi hata mesajları gösterme fonksiyonu
function showErrorMessage(title, message) {
    // API üzerinden mesaj kutusu göster
    if (window.electronAPI && window.electronAPI.send) {
        window.electronAPI.send('show-error', message);
    } else {
        // Fallback olarak standart alert kullan
        alert(message);
    }
}

window.showErrorMessage = showErrorMessage;
// Bilgi mesajı gösterme fonksiyonu
function showInfoMessage(title, message) {
    // API üzerinden mesaj kutusu göster
    if (window.electronAPI && window.electronAPI.send) {
        window.electronAPI.send('show-info', {
            type: 'info',
            title: title, 
            message: message
        });
    } else {
        // Fallback olarak standart alert kullan
        alert(message);
    }
}

window.showInfoMessage = showInfoMessage;
// Modal içinde hata mesajı gösterme
function showModalError(modalId, message) {
    const errorElement = document.getElementById(`${modalId}-error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // 5 saniye sonra mesajı gizle
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    } else {
        // Hata elementi yoksa standart alert kullan
        alert(message);
    }
}


window.showModalError = showModalError;
// Modal içinde başarı mesajı gösterme
function showModalSuccess(modalId, message) {
    const successElement = document.getElementById(`${modalId}-success`);
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
        
        // 5 saniye sonra mesajı gizle
        setTimeout(() => {
            successElement.style.display = 'none';
        }, 5000);
    } else {
        // Başarı elementi yoksa standart alert kullan
        alert(message);
    }
}

window.showModalSuccess = showModalSuccess;


  // Bildirim gösterme yardımcı fonksiyonu
  function showToast(message, type = 'info') {
    // Notiflix.Notify varsa kullan
    if (typeof Notiflix !== 'undefined' && Notiflix.Notify) {
      switch(type) {
        case 'success':
          Notiflix.Notify.success(message);
          break;
        case 'error':
          Notiflix.Notify.failure(message);
          break;
        case 'warning':
          Notiflix.Notify.warning(message);
          break;
        default:
          Notiflix.Notify.info(message);
      }
      return;
    }
    
    // Notiflix yoksa basit bir alert kullan
    alert(message);
  }

window.showToast = showToast;