//kök dizindeki main.js 

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const DatabaseService = require('./src/database/database-service');
const Notiflix = require('notiflix');



// Değişkenler
let mainWindow;
let loginWindow;
let currentUser = null;


// Ana pencereyi oluştur
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true, 
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),

    },
    show: false
  });

  // HTML dosyasını yükle
  mainWindow.loadFile(path.join(__dirname, 'src/renderer/index.html'));

  // Geliştirici araçlarını aç (geliştirme modunda)
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Pencere kapatılınca
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Hazır olunca göster
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });
}




// Giriş penceresini oluştur
function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 700,
    height: 800,
    resizable: false,
    autoHideMenuBar: true, 
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  });

  // HTML dosyasını yükle
  loginWindow.loadFile(path.join(__dirname, 'src/renderer/login.html'));

  // Geliştirici araçlarını aç
  loginWindow.webContents.openDevTools();

  // Pencere kapatılınca
  loginWindow.on('closed', () => {
    loginWindow = null;
    if (!mainWindow) {
      app.quit();
    }
  });

  // Hazır olunca göster
  loginWindow.once('ready-to-show', () => {
    loginWindow.show();
  });
}

// Uygulama hazır olduğunda
app.whenReady().then(() => {
  createLoginWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createLoginWindow();
    }
  });
});

// Tüm pencereler kapatıldığında
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Giriş işlemi için
ipcMain.on('login-user', async (event, { username, password }) => {
  console.log('Login isteği alındı:', username);
  
  try {
    const result = await DatabaseService.loginUser(username, password);
    console.log('Login sonucu:', result);
    
    if (result.success) {
      console.log('Giriş başarılı, login-success gönderiliyor:', result.user);
      
      // Kullanıcı bilgisini gönder
      event.sender.send('login-response', result);
      
      // Ana süreci bilgilendir
      currentUser = result.user;
      
      // Login penceresini kapat, ana pencereyi aç
      if (loginWindow) {
        loginWindow.close();
      }
      createMainWindow();
      
      // Kullanıcı bilgisini ana pencereye gönder
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('user-data', currentUser);
      });
    } else {
      console.log('Giriş başarısız:', result.message);
      event.sender.send('login-response', result);
    }
  } catch (error) {
    console.error('Giriş hatası:', error);
    event.sender.send('login-response', { 
      success: false, 
      message: 'Giriş sırasında bir hata oluştu: ' + error.message 
    });
  }
});

// main.js veya main process dosyanızda
ipcMain.on('reload-page', (event) => {
  mainWindow.reload(); // Ana pencereyi yeniden yükle
});

// Çıkış yapıldığında
ipcMain.on('logout', () => {
  currentUser = null;
  if (mainWindow) {
    mainWindow.close();
  }
  createLoginWindow();
});

// Kayıt işlemi için
ipcMain.on('register-user', async (event, userData) => {
  try {
    const result = await DatabaseService.registerUser(userData);
    event.sender.send('register-response', result);
  } catch (error) {
    console.error('Kayıt işlemi hatası:', error);
    event.sender.send('register-response', { 
      success: false, 
      message: 'Kayıt sırasında bir hata oluştu: ' + error.message 
    });
  }
});

ipcMain.on('save-hammadde', async (event, hammaddeData) => {
  try {
    const result = await DatabaseService.addHammadde(hammaddeData);
    event.reply('save-hammadde-response', result);
  } catch (error) {
    console.error('Hammadde kaydetme hatası:', error);
    event.reply('save-hammadde-response', { 
      success: false, 
      message: 'Hammadde kaydedilirken bir hata oluştu: ' + error.message 
    });
  }
});

// Database invoke handler
ipcMain.handle('database', async (event, method, ...args) => {
  try {
    if (DatabaseService[method]) {
      return await DatabaseService[method](...args);
    } else {
      throw new Error(`Metod bulunamadı: ${method}`);
    }
  } catch (error) {
    console.error(`Database API hatası (${method}):`, error);
    return { success: false, message: error.message };
  }
});

// Hata mesajı göster
ipcMain.on('show-error', (event, message) => {
  dialog.showErrorBox('Hata', message);
});

// Bilgi mesajı göster
ipcMain.on('show-info', (event, options) => {
  dialog.showMessageBox(options);
});

// BrowserWindow tanımlamasının ardına ekleyin
// Geliştirici araçları açma isteğini dinle
ipcMain.on('open-devtools', (event) => {
  // Hangi pencereden geldiğini bulalım
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
      window.webContents.openDevTools();
      console.log('Geliştirici araçları açıldı.');
  }
});


ipcMain.handle('database:checkSarfMalzemeExists', async (event, malzemeAdi, birim) => {
  return await DatabaseService.checkSarfMalzemeExists(malzemeAdi, birim);
});


// main.js içindeki verify-admin-registration kanalını düzenleyin
ipcMain.on('verify-admin-registration', async (event, { verificationCode }) => {
  try {
    console.log('Doğrulama kodu alındı:', verificationCode); // Log ekleyelim

    const result = await DatabaseService.verifyAdminRegistration(verificationCode);
    console.log('Doğrulama sonucu:', result); // Sonucu logla

    // Mutlaka bir yanıt gönder
    event.sender.send('register-response', result);
  } catch (error) {
    console.error('Doğrulama sırasında hata:', error);
    event.sender.send('register-response', { 
      success: false, 
      message: 'Doğrulama sırasında bir hata oluştu: ' + error.message 
    });
  }
});


// main.js içinde bu kısımları şöyle değiştirin:

// Daha önce tanımlanmış diğer kanallar
ipcMain.handle('database:getAllYariMamuller', async () => {
  try {
    return await DatabaseService.getAllYariMamuller(); // DatabaseService kullanın
  } catch (error) {
    console.error('getAllYariMamuller error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:getYariMamulById', async (event, id) => {
  try {
    return await DatabaseService.getYariMamulById(id);
  } catch (error) {
    console.error('getYariMamulById error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:addYariMamulIslemi', async (event, islemData) => {
  try {
    return await DatabaseService.addYariMamulIslemi(islemData);
  } catch (error) {
    console.error('addYariMamulIslemi error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:addYariMamul', async (event, yariMamulData) => {
  try {
    return await DatabaseService.addYariMamul(yariMamulData);
  } catch (error) {
    console.error('addYariMamul error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:deleteYariMamul', async (event, id) => {
  try {
    return await DatabaseService.deleteYariMamul(id);
  } catch (error) {
    console.error('deleteYariMamul error:', error);
    return { success: false, message: error.message };
  }
});


ipcMain.handle('database:checkHammaddeExists', async (event, hammaddeData) => {
  try {
    return await DatabaseService.checkHammaddeExists(hammaddeData);
  } catch (error) {
    console.error('Hammadde kontrol hatası:', error);
    return { success: false, message: 'Hammadde kontrolü sırasında bir hata oluştu.' };
  }
});



// In main.js where you handle IPC events
// Add this new IPC handler  BUNA Bİ BAK !! 
ipcMain.handle('database:getActivePartCount', async (event, hammaddeId) => {
  try {
    return await DatabaseService.getActivePartCount(hammaddeId);
  } catch (error) {
    console.error('Error in getActivePartCount:', error);
    return 0;
  }
});


ipcMain.handle('database:getIslemlerByHammaddeId', async (event, hammaddeId) => {
  try {
    return await DatabaseService.getIslemlerByHammaddeId(hammaddeId);
  } catch (error) {
    console.error('Error in getIslemlerByHammaddeId:', error);
    return 0;
  }
});



// Make sure the existing handlers for getHammaddeById and getParcalarByHammaddeId are in place
// They should already exist if you're using these functions elsewhere
ipcMain.handle('database:getHammaddeById', async (event, id) => {
  try {
    return await dbService.getHammaddeById(id);
  } catch (error) {
    console.error('Error in getHammaddeById:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:getParcalarByHammaddeId', async (event, hammaddeId) => {
  try {
    return await dbService.getParcalarByHammaddeId(hammaddeId);
  } catch (error) {
    console.error('Error in getParcalarByHammaddeId:', error);
    return { success: false, message: error.message };
  }
});


// Add these new IPC handlers for yarı mamul functions
ipcMain.handle('database:getYariMamulIslemleri', async (event, yariMamulId) => {
  try {
    return await DatabaseService.getYariMamulIslemleri(yariMamulId);
  } catch (error) {
    console.error('getYariMamulIslemleri error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:getYariMamulIslemById', async (event, islemId) => {
  try {
    return await DatabaseService.getYariMamulIslemById(islemId);
  } catch (error) {
    console.error('getYariMamulIslemById error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:updateYariMamulIslem', async (event, islemId, islemData) => {
  try {
    return await DatabaseService.updateYariMamulIslem(islemId, islemData);
  } catch (error) {
    console.error('updateYariMamulIslem error:', error);
    return { success: false, message: error.message };
  }
});


ipcMain.handle('database:getAllTedarikci', async () => {
  try {
    return await DatabaseService.getAllTedarikci();
  } catch (error) {
    console.error('Error in getAllTedarikci:', error);
    return { success: false, message: error.message };
  }
});

// Add a new supplier
ipcMain.handle('database:addTedarikci', async (event, tedarikciData) => {
  try {
    return await DatabaseService.addTedarikci(tedarikciData);
  } catch (error) {
    console.error('Error in addTedarikci:', error);
    return { success: false, message: error.message };
  }
});

// Delete a supplier
ipcMain.handle('database:deleteTedarikci', async (event, id) => {
  try {
    return await DatabaseService.deleteTedarikci(id);
  } catch (error) {
    console.error('Error in deleteTedarikci:', error);
    return { success: false, message: error.message };
  }
});



ipcMain.handle('database:checkYariMamulExists', async (event, malzemeAdi, birim) => {
  return DatabaseService.checkYariMamulExists(malzemeAdi, birim);
});

// Yarı Mamul giriş geçmişi
ipcMain.handle('database:getYariMamulGirisGecmisi', async (event, yariMamulId) => {
  return DatabaseService.getYariMamulGirisGecmisi(yariMamulId);
});

// Yarı Mamul giriş kaydı
ipcMain.handle('database:kaydetYariMamulGirisi', async (event, girisData) => {
  return DatabaseService.kaydetYariMamulGirisi(girisData);
});

ipcMain.handle('database:updateSarfMalzemeGirisi', async (event, guncelleData) => {
  return await DatabaseService.updateSarfMalzemeGirisi(guncelleData);
});

 // Hammadde girişi güncelleme
 ipcMain.handle('database:updateHammaddeMalzemeGirisi', async (event, guncelleData) => {
  return await DatabaseService.updateHammaddeMalzemeGirisi(guncelleData);
});





ipcMain.handle('database:deleteHammaddeWithNotification', async (event, id, reason, userData) => {
  try {
    return await DatabaseService.deleteHammaddeWithNotification(id, reason, userData);
  } catch (error) {
    console.error('Hammadde silme hatası:', error);
    return { success: false, message: error.message };
  }
});


// Eğer diğer stok tipleri için de benzer kanallar eklenecekse:
ipcMain.handle('database:deleteSarfMalzemeWithNotification', async (event, id, reason, userData) => {
  try {
    return await DatabaseService.deleteSarfMalzemeWithNotification(id, reason, userData);
  } catch (error) {
    console.error('Sarf malzeme silme hatası:', error);
    return { success: false, message: error.message };
  }
});


ipcMain.handle('database:deleteYariMamulWithNotification', async (event, id, reason, userData) => {
  try {
    return await DatabaseService.deleteYariMamulWithNotification(id, reason, userData);
  } catch (error) {
    console.error('Yarı mamul silme hatası:', error);
    return { success: false, message: error.message };
  }
});




ipcMain.handle('database:getAllCalisan', async () => {
  try {
    return await DatabaseService.getAllCalisan();
  } catch (error) {
    console.error('Error in getAllCalisan:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:getAllMusteriler', async () => {
  try {
    return await DatabaseService.getAllMusteriler();
  } catch (error) {
    console.error('Error in getAllMusteriler:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:getCalisanById', async (event, id) => {
  try {
    return await DatabaseService.getCalisanById(id);
  } catch (error) {
    console.error('Error in getCalisanById:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:addCalisan', async (event, calisanData) => {
  try {
    return await DatabaseService.addCalisan(calisanData);
  } catch (error) {
    console.error('Error in addCalisan:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:addMusteri', async (event, musteriData) => {
  try {
    return await DatabaseService.addMusteri(musteriData);
  } catch (error) {
    console.error('Error in addMusteri:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:deleteCalisan', async (event, id) => {
  try {
    return await DatabaseService.deleteCalisan(id);
  } catch (error) {
    console.error('Error in deleteCalisan:', error);
    return { success: false, message: error.message };
  }
});




ipcMain.handle('database:getIslemlerByPlakaId', async (event, plakaId) => {
  try {
    return await DatabaseService.getIslemlerByPlakaId(plakaId);
  } catch (error) {
    console.error('Plaka işlem geçmişi getirme hatası:', error);
    return { success: false, message: error.message, islemler: [] };
  }
});



ipcMain.handle('database:addParcaIslem', async (event, islemData) => {
  try {
    return await DatabaseService.addParcaIslem(islemData);
  } catch (error) {
    console.error('Plaka işlemi ekleme hatası:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:addTopluHammaddeGiris', async (event, girisData) => {
  try {
    return await DatabaseService.addTopluHammaddeGiris(girisData);
  } catch (error) {
    console.error('Toplu giriş ekleme hatası:', error);
    return { success: false, message: error.message };
  }
});





ipcMain.handle('database:getFasonIslemlerHepsiBirlikte', async () => {
  try {
    return await DatabaseService.getFasonIslemlerHepsiBirlikte(); // DatabaseService kullanın
  } catch (error) {
    console.error('getFasonIslemlerHepsiBirlikte error:', error);
    return { success: false, message: error.message };
  }
});



ipcMain.handle('database:getMakineIslemlerHepsiBirlikte', async () => {
  try {
    return await DatabaseService.getMakineIslemlerHepsiBirlikte(); // DatabaseService kullanın
  } catch (error) {
    console.error('getMakineIslemlerHepsiBirlikte error:', error);
    return { success: false, message: error.message };
  }
});


ipcMain.handle('database:getIskartaUrunlerHepsiBirlikte', async () => {
  try {
    return await DatabaseService.getIskartaUrunlerHepsiBirlikte(); // DatabaseService kullanın
  } catch (error) {
    console.error('getIskartaUrunlerHepsiBirlikte error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:updateYariMamulFotograf', async (event, id, base64Image) => {
  try {
    return await DatabaseService.updateYariMamulFotograf(id, base64Image);
  } catch (error) {
    console.error('Toplu giriş ekleme hatası:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:getIslemlerByMultiplePlakaIds', async (event, plakaIds) => {
  try {
    return await DatabaseService.getIslemlerByMultiplePlakaIds(plakaIds);
  } catch (error) {
    console.error('Plaka işlemleri hatası:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:addPlakaGrubuIslem', async (event, islemData) => {
  try {
    return await DatabaseService.addPlakaGrubuIslem(islemData);
  } catch (error) {
    console.error('addPlakaGrubuIslem error:', error);
    return { success: false, message: error.message };
  }
});


ipcMain.handle('database:getParcalarByPlakaGrubuId', async (event, grubuId) => {
  try {
    return await DatabaseService.getParcalarByPlakaGrubuId(grubuId);
  } catch (error) {
    console.error('getParcalarByPlakaGrubuId error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:getPlakaGrubuById', async (event, grubuId) => {
  try {
    return await DatabaseService.getPlakaGrubuById(grubuId);
  } catch (error) {
    console.error('getPlakaGrubuById error:', error);
    return { success: false, message: error.message };
  }
});


ipcMain.handle('database:getIslemlerByMultiplePlakaGrubuIds', async (event, plakaGrubuIds) => {
  try {
    return await DatabaseService.getIslemlerByMultiplePlakaGrubuIds(plakaGrubuIds);
  } catch (error) {
    console.error('getIslemlerByMultiplePlakaGrubuIds error:', error);
    return { success: false, message: error.message };
  }
});


ipcMain.handle('database:getPlakaGruplariByHammaddeId', async (event, hammaddeId) => {
  try {
    return await DatabaseService.getPlakaGruplariByHammaddeId(hammaddeId);
  } catch (error) {
    console.error('Error in getPlakaGruplariByHammaddeId:', error);
    return 0;
  }
});

ipcMain.handle('database:addPlakaGrubu', async (event, grubuData) => {
  try {
    return await DatabaseService.addPlakaGrubu(grubuData);
  } catch (error) {
    console.error('Error in addPlakaGrubu:', error);
    return 0;
  }
});


ipcMain.handle('database:addPlakaGrubuToIslemde', async (event, plakaGrubuId, adet, userId) => {
  try {
    return await DatabaseService.addPlakaGrubuToIslemde(plakaGrubuId, adet, userId);
  } catch (error) {
    console.error('Error in addPlakaGrubuToIslemde:', error);
    return 0;
  }
});


ipcMain.handle('database:getAllIslemdekiPlakaGruplari', async (event) => {
  try {
    return await DatabaseService.getAllIslemdekiPlakaGruplari();
  } catch (error) {
    console.error('Error in getAllIslemdekiPlakaGruplari:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:removePlakaGrubuFromIslemde', async (event, plakaGrubuId) => {
  try {
    return await DatabaseService.removePlakaGrubuFromIslemde(plakaGrubuId);
  } catch (error) {
    console.error('Error in removePlakaGrubuFromIslemde:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:removePlakaGruplarıFromIslemdeByHammadde', async (event, hammaddeId) => {
  try {
    return await DatabaseService.removePlakaGruplarıFromIslemdeByHammadde(hammaddeId);
  } catch (error) {
    console.error('Error in removePlakaGruplarıFromIslemdeByHammadde:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:isPlakaGrubuIslemde', async (event, plakaGrubuId) => {
  try {
    return await DatabaseService.isPlakaGrubuIslemde(plakaGrubuId);
  } catch (error) {
    console.error('Error in isPlakaGrubuIslemde:', error);
    return false;
  }
});


ipcMain.handle('database:getPlakaGrubuByGirisId', async (event, girisId) => {
  try {
    return await DatabaseService.getPlakaGrubuByGirisId(girisId);
  } catch (error) {
    console.error('Error in getPlakaGrubuByGirisId:', error);
    return false;
  }
});


ipcMain.handle('database:checkPlakaGrubuIslemDurumu', async (event, plakaGrubuId) => {
  try {
    return await DatabaseService.checkPlakaGrubuIslemDurumu(plakaGrubuId);
  } catch (error) {
    console.error('Error in checkPlakaGrubuIslemDurumu:', error);
    return false;
  }
});



ipcMain.handle('database:updatePlakaGrubu', async (event, updateData) => {
  try {
    return await DatabaseService.updatePlakaGrubu(updateData);
  } catch (error) {
    console.error('Error in updatePlakaGrubu:', error);
    return false;
  }
});




ipcMain.handle('database:canUpdatePlakaGrubu', async (event, plakaGrubuId, yeniPlakaSayisi) => {
  try {
    return await DatabaseService.canUpdatePlakaGrubu(plakaGrubuId, yeniPlakaSayisi);
  } catch (error) {
    console.error('Error in canUpdatePlakaGrubu:', error);
    return false;
  }
});

ipcMain.handle('database:findPlakaGrubuByGiris', async (event, giridId) => {
  try {
    return await DatabaseService.findPlakaGrubuByGiris(giridId);
  } catch (error) {
    console.error('Error in findPlakaGrubuByGiris:', error);
    return false;
  }
});


ipcMain.handle('database:deletePlakaGrubuIslem', async (event, islemId) => {
  try {
    return await DatabaseService.deletePlakaGrubuIslem(islemId);
  } catch (error) {
    console.error('deletePlakaGrubuIslem error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('database:getAllStockAtDate', async (event, targetDate) => {
  try {
    return await DatabaseService.getAllStockAtDate(targetDate);
  } catch (error) {
    console.error('getAllStockAtDate error:', error);
    return { success: false, message: error.message };
  }
});

// Belirli tarih için hammadde stok durumlarını getir
ipcMain.handle('database:getAllHammaddeAtDate', async (event, targetDate) => {
  try {
    return await DatabaseService.getAllHammaddeAtDate(targetDate);
  } catch (error) {
    console.error('getAllHammaddeAtDate error:', error);
    return { success: false, message: error.message };
  }
});

// Belirli tarih için sarf malzeme stok durumlarını getir
ipcMain.handle('database:getAllSarfMalzemeAtDate', async (event, targetDate) => {
  try {
    return await DatabaseService.getAllSarfMalzemeAtDate(targetDate);
  } catch (error) {
    console.error('getAllSarfMalzemeAtDate error:', error);
    return { success: false, message: error.message };
  }
});

// Belirli tarih için yarı mamul stok durumlarını getir
ipcMain.handle('database:getAllYariMamulAtDate', async (event, targetDate) => {
  try {
    return await DatabaseService.getAllYariMamulAtDate(targetDate);
  } catch (error) {
    console.error('getAllYariMamulAtDate error:', error);
    return { success: false, message: error.message };
  }
});

// Tarih aralığındaki stok hareketlerini getir
ipcMain.handle('database:getStockMovementsBetweenDates', async (event, startDate, endDate) => {
  try {
    return await DatabaseService.getStockMovementsBetweenDates(startDate, endDate);
  } catch (error) {
    console.error('getStockMovementsBetweenDates error:', error);
    return { success: false, message: error.message };
  }
});


ipcMain.handle('database:getSarfMalzemeByIdWithRaf', async (event, id) => {
  try {
    return await DatabaseService.getSarfMalzemeByIdWithRaf(id);
  } catch (error) {
    console.error('Raf silme hatası:', error);
    return { success: false, message: error.message };
  }
});


ipcMain.handle('database:updateSarfMalzemeRaf', async (event, sarfMalzemeId, rafBilgisi) => {
  try {
    return await DatabaseService.updateSarfMalzemeRaf(sarfMalzemeId, rafBilgisi);
  } catch (error) {s
    console.error('Raf guncelleme hatası:', error);
    return { success: false, message: error.message };
  }
});


ipcMain.handle('database:updateYariMamulRaf', async (event, yariMamulId, rafKonumu) => {
  try {
    return await DatabaseService.updateYariMamulRaf(yariMamulId, rafKonumu);
  } catch (error) {s
    console.error('Raf guncelleme hatası:', error);
    return { success: false, message: error.message };
  }
});


ipcMain.handle('database:getYariMamulFotograf', async (event, id) => {
  try {
    return await DatabaseService.getYariMamulFotograf(id);
  } catch (error) {
    console.error('Error in getYariMamulFotograf:', error);
    return { success: false, message: error.message };
  }
});


ipcMain.handle('database:getSarfMalzemeFotograf', async (event, id) => {
  try {
    return await DatabaseService.getSarfMalzemeFotograf(id);
  } catch (error) {
    console.error('Error in getSarfMalzemeFotograf:', error);
    return { success: false, message: error.message };
  }
});


ipcMain.handle('database:updateSarfMalzemeFotograf', async (event, id, base64Image) => {
  try {
    return await DatabaseService.updateSarfMalzemeFotograf(id, base64Image);
  } catch (error) {
    console.error('Error in updateSarfMalzemeFotograf:', error);
    return { success: false, message: error.message };
  }
});


ipcMain.handle('database:getSarfMalzemeBasicInfo', async (event, id) => {
  try {
    return await DatabaseService.getSarfMalzemeBasicInfo(id);
  } catch (error) {
    console.error('Error in getSarfMalzemeBasicInfo:', error);
    return { success: false, message: error.message };
  }
});
