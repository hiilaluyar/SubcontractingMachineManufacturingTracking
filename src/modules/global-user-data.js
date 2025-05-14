// src/renderer/js/global-user-data.js

// Kullanıcı bilgilerini global olarak saklamak için
window.globalUserData = null;

// Kullanıcı verilerini güncelleme fonksiyonu
function updateGlobalUserData(userData) {
  window.globalUserData = userData;
  console.log('Global kullanıcı bilgileri güncellendi:', window.globalUserData);
  
  // Kullanıcı rol bilgisine göre erişim kontrolü
  updateUIByUserRole(userData.rol);
}

// Kullanıcı rolüne göre UI elemanlarını güncelleme
function updateUIByUserRole(role) {
  // Tüm silme butonlarını seç
  const deleteButtons = document.querySelectorAll('.delete-button, .btn-delete, [data-action="delete"]');
  
  // Yönetici değilse butonları devre dışı bırak
  if (role !== 'yonetici') {
    deleteButtons.forEach(button => {
      button.style.display = 'none';
      // veya
      // button.disabled = true;
      // button.title = 'Silme işlemi için yönetici yetkisi gereklidir';
    });
  } else {
    // Yönetici ise butonları aktif et
    deleteButtons.forEach(button => {
      button.style.display = '';
      // button.disabled = false;
      // button.title = 'Bu öğeyi sil';
    });
  }
}

// Diğer JS dosyalarından erişebilmek için global alana ekle
window.updateGlobalUserData = updateGlobalUserData;
window.updateUIByUserRole = updateUIByUserRole;