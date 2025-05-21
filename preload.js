// kök dizindeki preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, data) => {
        const validSendChannels = [
            'login-user',
            'register-user',
            'save-hammadde',
            'logout',
            'show-error',
            'show-info',
            'open-devtools' ,
            'verify-admin-registration' 
        ];
        if (validSendChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        const validReceiveChannels = [
            'login-response',
            'register-response',
            'save-hammadde-response',
            'user-data'
        ];
        if (validReceiveChannels.includes(channel)) {
            const listener = (event, ...args) => {
                console.log(`Received on channel ${channel}:`, args);
                func(...args);
            };
            ipcRenderer.on(channel, listener);
            // Return a method to remove the listener if needed
            return () => {
                ipcRenderer.removeListener(channel, listener);
            };
        }
    },
    invoke: {
        database: {
            getAllHammadde: () => ipcRenderer.invoke('database', 'getAllHammadde'),
            getHammaddeById: (id) => ipcRenderer.invoke('database', 'getHammaddeById', id),
            addHammadde: (data) => ipcRenderer.invoke('database', 'addHammadde', data),
            updateHammadde: (id, data) => ipcRenderer.invoke('database', 'updateHammadde', id, data),
            deleteHammaddeWithNotification: (id, reason, userData) => 
                ipcRenderer.invoke('database:deleteHammaddeWithNotification', id, reason, userData),
            
            // Yeni hammadde giriş işlemleri
            getHammaddeGirisGecmisi: (id) => ipcRenderer.invoke('database', 'getHammaddeGirisGecmisi', id),
            kaydetHammaddeMalzemeGirisi: (data) => ipcRenderer.invoke('database', 'kaydetHammaddeMalzemeGirisi', data),
            
            // Yeni sarf malzeme fonksiyonları
            getAllSarfMalzeme: () => ipcRenderer.invoke('database', 'getAllSarfMalzeme'),
            getSarfMalzemeById: (id) => ipcRenderer.invoke('database', 'getSarfMalzemeById', id),
            addSarfMalzeme: (data) => ipcRenderer.invoke('database', 'addSarfMalzeme', data),
            updateSarfMalzeme: (id, data) => ipcRenderer.invoke('database', 'updateSarfMalzeme', id, data),
            deleteSarfMalzemeWithNotification: (id, reason, userData) => 
                ipcRenderer.invoke('database:deleteSarfMalzemeWithNotification', id, reason, userData),
            addSarfMalzemeIslemi: (data) => ipcRenderer.invoke('database', 'addSarfMalzemeIslemi', data),
            checkSarfMalzemeExists: (malzemeAdi, birim) => ipcRenderer.invoke('database:checkSarfMalzemeExists', malzemeAdi, birim),
            getSarfMalzemeIslemleri: (id) => ipcRenderer.invoke('database', 'getSarfMalzemeIslemleri', id),
            
            // Sarf malzeme işlem fonksiyonları - eksik olan fonksiyon
            getSarfMalzemeIslemById: (id) => ipcRenderer.invoke('database', 'getSarfMalzemeIslemById', id),
            getSarfMalzemeGirisById: (id) => ipcRenderer.invoke('database', 'getSarfMalzemeGirisById', id),
            getHammaddeGirisById: (id) => ipcRenderer.invoke('database', 'getHammaddeGirisById', id),
            updateSarfMalzemeIslem: (id, data) => ipcRenderer.invoke('database', 'updateSarfMalzemeIslem', id, data),
            
            // Yeni sarf malzeme giriş işlemleri
            getSarfMalzemeGirisGecmisi: (id) => ipcRenderer.invoke('database', 'getSarfMalzemeGirisGecmisi', id),
            kaydetSarfMalzemeGirisi: (data) => ipcRenderer.invoke('database', 'kaydetSarfMalzemeGirisi', data),
            
            // Diğer mevcut fonksiyonlar
            getParcalarByHammaddeId: (id) => ipcRenderer.invoke('database', 'getParcalarByHammaddeId', id),
            updateParca: (id, data) => ipcRenderer.invoke('database', 'updateParca', id, data),
            addProje: (data) => ipcRenderer.invoke('database', 'addProje', data),
            getAllProjeler: () => ipcRenderer.invoke('database', 'getAllProjeler'),
            addIslem: (data) => ipcRenderer.invoke('database', 'addIslem', data),
            getIslemlerByParcaId: (id) => ipcRenderer.invoke('database', 'getIslemlerByParcaId', id),
            updateSarfMalzemeIslem: (id, data) => ipcRenderer.invoke('database', 'updateSarfMalzemeIslem', id, data),
            getIslemlerByProjeId: (id) => ipcRenderer.invoke('database', 'getIslemlerByProjeId', id),
            getIslemById: (id) => ipcRenderer.invoke('database', 'getIslemById', id),
            updateIslem: (id, data) => ipcRenderer.invoke('database', 'updateIslem', id, data),
            getAllYariMamuller: () => ipcRenderer.invoke('database:getAllYariMamuller'),
            getYariMamulById: (id) => ipcRenderer.invoke('database:getYariMamulById', id),
            addYariMamulIslemi: (islemData) => ipcRenderer.invoke('database:addYariMamulIslemi', islemData),
            addYariMamul: (yariMamulData) => ipcRenderer.invoke('database:addYariMamul', yariMamulData),
            deleteYariMamulWithNotification: (id, reason, userData) => 
                ipcRenderer.invoke('database:deleteYariMamulWithNotification', id, reason, userData),
            checkHammaddeExists: (hammaddeData) => ipcRenderer.invoke('database:checkHammaddeExists', hammaddeData),
            getActivePartCount: (hammaddeId) => ipcRenderer.invoke('database:getActivePartCount', hammaddeId),
            getYariMamulIslemleri: (yariMamulId) => ipcRenderer.invoke('database:getYariMamulIslemleri', yariMamulId),
            getYariMamulIslemById: (islemId) => ipcRenderer.invoke('database:getYariMamulIslemById', islemId),
            updateYariMamulIslem: (islemId, islemData) => ipcRenderer.invoke('database:updateYariMamulIslem', islemId, islemData),
            getYariMamulIslemleri: (yariMamulId) => ipcRenderer.invoke('database:getYariMamulIslemleri', yariMamulId),
updateYariMamulIslem: (islemId, islemData) => ipcRenderer.invoke('database:updateYariMamulIslem', islemId, islemData),
getAllTedarikci: () => ipcRenderer.invoke('database:getAllTedarikci'),
      addTedarikci: (tedarikciData) => ipcRenderer.invoke('database:addTedarikci', tedarikciData),
      deleteTedarikci: (id) => ipcRenderer.invoke('database:deleteTedarikci', id),
      checkYariMamulExists: (malzemeAdi, birim) => ipcRenderer.invoke('database:checkYariMamulExists', malzemeAdi, birim),
      getYariMamulGirisGecmisi: (yariMamulId) => ipcRenderer.invoke('database:getYariMamulGirisGecmisi', yariMamulId),
      kaydetYariMamulGirisi: (girisData) => ipcRenderer.invoke('database:kaydetYariMamulGirisi', girisData),
      updateSarfMalzemeGirisi: (guncelleData) => ipcRenderer.invoke('database:updateSarfMalzemeGirisi', guncelleData),
      updateHammaddeMalzemeGirisi: (guncelleData) => ipcRenderer.invoke('database:updateHammaddeMalzemeGirisi', guncelleData),
      getParcaById: (parcaId) => ipcRenderer.invoke('database', 'getParcaById', parcaId),
      deleteHammaddeIslemAndRestoreStock: (deleteData) => ipcRenderer.invoke('database', 'deleteHammaddeIslemAndRestoreStock', deleteData),
      deleteSarfMalzemeIslemAndRestoreStock: (deleteData) => ipcRenderer.invoke('database', 'deleteSarfMalzemeIslemAndRestoreStock', deleteData),
      deleteYariMamulIslemAndRestoreStock: (deleteData) => ipcRenderer.invoke('database', 'deleteYariMamulIslemAndRestoreStock', deleteData),
      getYariMamulByIslemId: (islemId) => ipcRenderer.invoke('database', 'getYariMamulByIslemId', islemId),
      getYariMamulByCreationIslemId: (islemId) => ipcRenderer.invoke('database', 'getYariMamulByCreationIslemId', islemId),
      getYariMamulByIslemData: (islemId) => ipcRenderer.invoke('database', 'getYariMamulByIslemData', islemId),
      getAllCalisan: () => ipcRenderer.invoke('database', 'getAllCalisan'),
      getCalisanById: (id) => ipcRenderer.invoke('database:getCalisanById', id),
     addCalisan: (calisanData) => ipcRenderer.invoke('database:addCalisan', calisanData),
     deleteCalisan: (id) => ipcRenderer.invoke('database:deleteCalisan', id),
     addPlaka: (plakaData) => ipcRenderer.invoke('database:addPlaka', plakaData),
     getPlakaListByHammaddeId: (hammaddeId) => ipcRenderer.invoke('database:getPlakaListByHammaddeId', hammaddeId),
     getPlakaById: (plakaId) => ipcRenderer.invoke('database:getPlakaById', plakaId),
     getPlakaParcalariByPlakaId: (plakaId) => ipcRenderer.invoke('database:getPlakaParcalariByPlakaId', plakaId),
     addPlakaIslem: (islemData) => ipcRenderer.invoke('database:addPlakaIslem', islemData),
     getIslemlerByPlakaId: (plakaId) => ipcRenderer.invoke('database:getIslemlerByPlakaId', plakaId),
     addParcaIslem: (islemData) => ipcRenderer.invoke('database:addParcaIslem', islemData),
     addMusteri: (musteriData) => ipcRenderer.invoke('database:addMusteri', musteriData),
     getAllMusteriler: () => ipcRenderer.invoke('database', 'getAllMusteriler'),
     getIslemlerByHammaddeId: (hammaddeId) => ipcRenderer.invoke('database:getIslemlerByHammaddeId', hammaddeId),
     removeFromIslemde: (hammaddeId) => ipcRenderer.invoke('database:removeFromIslemde', hammaddeId),
     addTopluHammaddeGiris: (girisData) => ipcRenderer.invoke('database:addTopluHammaddeGiris', girisData),
      // Plakayı işlem listesine ekle
  addPlakaToIslemde: (plakaId, hammaddeId, userId) =>
    ipcRenderer.invoke('database', 'addPlakaToIslemde', plakaId, hammaddeId, userId),
  removePlakaFromIslemde: (plakaId) => ipcRenderer.invoke('database:removePlakaFromIslemde', plakaId),



  // İşlemdeki tüm plakaları getir
  getAllIslemdekiPlakalar: () =>
    ipcRenderer.invoke('database', 'getAllIslemdekiPlakalar'),
  loadHammaddeFasonIslemlerById: (parcaId) => ipcRenderer.invoke('database', 'loadHammaddeFasonIslemlerById', parcaId),
  loadHammaddeMakineIslemlerById: (parcaId) => ipcRenderer.invoke('database', 'loadHammaddeMakineIslemlerById', parcaId),
  getFasonIslemlerHepsiBirlikte: () => ipcRenderer.invoke('database:getFasonIslemlerHepsiBirlikte'),
  getMakineIslemlerHepsiBirlikte: () => ipcRenderer.invoke('database:getMakineIslemlerHepsiBirlikte'),
  getIskartaUrunlerHepsiBirlikte: () => ipcRenderer.invoke('database:getIskartaUrunlerHepsiBirlikte'),
  updateYariMamulFotograf: (id, base64Image) => ipcRenderer.invoke('database', 'updateYariMamulFotograf', id, base64Image),
getIslemlerByMultiplePlakaIds: (plakaIds) => ipcRenderer.invoke('database', 'getIslemlerByMultiplePlakaIds', plakaIds),
addPlakaGrubuIslem: (islemData) => ipcRenderer.invoke('database:addPlakaGrubuIslem', islemData),
getParcalarByPlakaGrubuId: (grubuId) => ipcRenderer.invoke('database:getParcalarByPlakaGrubuId', grubuId),
getPlakaGrubuById: (grubuId) => ipcRenderer.invoke('database:getPlakaGrubuById', grubuId),
getPlakaGruplariByHammaddeId: (hammaddeId) => ipcRenderer.invoke('database:getPlakaGruplariByHammaddeId', hammaddeId),
addPlakaGrubu: (grubuData) => ipcRenderer.invoke('database:addPlakaGrubu', grubuData),
getIslemlerByMultiplePlakaGrubuIds: (plakaGrubuIds) => ipcRenderer.invoke('database:getIslemlerByMultiplePlakaGrubuIds', plakaGrubuIds)
        }
    }
});