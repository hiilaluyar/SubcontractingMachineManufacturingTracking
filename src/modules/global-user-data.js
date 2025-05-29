// src/renderer/js/global-user-data.js

// Kullanıcı bilgilerini global olarak saklamak için
window.globalUserData = null;

// Yönetici yetkisi gerektiren menü öğeleri
const ADMIN_ONLY_MENU_ITEMS = [
  'stok-ekle',
  'tedarikci-listesi', 
  'calisan-listesi',
  'projeler'
];

// Kullanıcı verilerini güncelleme fonksiyonu
function updateGlobalUserData(userData) {
  window.globalUserData = userData;
  console.log('Global kullanıcı bilgileri güncellendi:', window.globalUserData);
  
  // Kullanıcı rol bilgisine göre erişim kontrolü
  updateUIByUserRole(userData.rol);
}

// Kullanıcı rolüne göre UI elemanlarını güncelleme
function updateUIByUserRole(role) {
  // Sidebar menü kontrolü
  updateSidebarMenuByRole(role);
  
  // Silme butonları kontrolü (mevcut kodunuz)
  const deleteButtons = document.querySelectorAll('.delete-button, .btn-delete, [data-action="delete"]');
  
  if (role !== 'yonetici') {
    deleteButtons.forEach(button => {
      button.style.display = 'none';
    });
  } else {
    deleteButtons.forEach(button => {
      button.style.display = '';
    });
  }
}

// Sidebar menüsünü kullanıcı rolüne göre güncelle
function updateSidebarMenuByRole(role) {
  if (role !== 'yonetici') {
    // Yönetici değilse belirtilen menü öğelerini gizle
    ADMIN_ONLY_MENU_ITEMS.forEach(menuItem => {
      const menuElement = document.querySelector(`[data-page="${menuItem}"]`);
      if (menuElement) {
        // Li elementini (parent) gizle
        const listItem = menuElement.closest('li');
        if (listItem) {
          listItem.style.display = 'none';
        }
      }
    });
  } else {
    // Yönetici ise tüm menü öğelerini göster
    ADMIN_ONLY_MENU_ITEMS.forEach(menuItem => {
      const menuElement = document.querySelector(`[data-page="${menuItem}"]`);
      if (menuElement) {
        const listItem = menuElement.closest('li');
        if (listItem) {
          listItem.style.display = 'block';
        }
      }
    });
  }
}

// Sayfa erişim kontrolü - kullanıcı direkt URL ile erişmeye çalışırsa
function checkPageAccess(pageName) {
  if (!window.globalUserData) {
    console.error('Kullanıcı bilgileri yüklenmemiş!');
    return false;
  }
  
  // Eğer sayfa admin yetkisi gerektiriyorsa ve kullanıcı admin değilse
  if (ADMIN_ONLY_MENU_ITEMS.includes(pageName) && window.globalUserData.rol !== 'yonetici') {
    showToast 
('Bu sayfaya erişim için yönetici yetkisi gereklidir.', 'error');
    // Anasayfaya yönlendir
    const anasayfaLink = document.querySelector('[data-page="anasayfa"]');
    if (anasayfaLink) {
      anasayfaLink.click();
    }
    return false;
  }
  
  return true;
}

// Menü tıklama olaylarını yakala ve yetki kontrolü yap
function setupMenuAccessControl() {
  document.addEventListener('click', function(e) {
    const menuLink = e.target.closest('[data-page]');
    if (menuLink) {
      const pageName = menuLink.getAttribute('data-page');
      
      // Sayfa erişim kontrolü
      if (!checkPageAccess(pageName)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  });
}

// Sayfa yüklendiğinde menü erişim kontrolünü başlat
document.addEventListener('DOMContentLoaded', function() {
  setupMenuAccessControl();
});

// Diğer JS dosyalarından erişebilmek için global alana ekle
window.updateGlobalUserData = updateGlobalUserData;
window.updateUIByUserRole = updateUIByUserRole;
window.checkPageAccess = checkPageAccess;

// Ek fonksiyon: Dinamik olarak menü öğesi gizleme/gösterme
window.hideMenuItemsForUsers = function(menuItems) {
  if (Array.isArray(menuItems)) {
    ADMIN_ONLY_MENU_ITEMS.push(...menuItems);
  }
  
  // Eğer kullanıcı bilgileri mevcutsa hemen güncelle
  if (window.globalUserData) {
    updateSidebarMenuByRole(window.globalUserData.rol);
  }
};

// Ek fonksiyon: Belirli bir menü öğesini kontrol et
window.isMenuItemAllowed = function(menuItem) {
  if (!window.globalUserData) return false;
  
  if (ADMIN_ONLY_MENU_ITEMS.includes(menuItem) && window.globalUserData.rol !== 'yonetici') {
    return false;
  }
  return true;
};