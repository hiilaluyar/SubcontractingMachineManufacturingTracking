//src/database/database-service.js

// database-service.js dosyasının en başına ekleyin
const emailService = require('./email-service');



const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Veritabanı bağlantı bilgileri
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'hilal123',
  database: 'KaratasDene'
};
// Veritabanı bağlantı havuzu
let pool;
// Bağlantı havuzunu oluştur
async function createPool() {
  try {
    pool = mysql.createPool(dbConfig);
    console.log('Veritabanı bağlantı havuzu oluşturuldu.');

    // Test bağlantısı
    const connection = await pool.getConnection();
    console.log('Veritabanı bağlantısı başarılı!');
    connection.release();

    return pool;
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error);
    throw error;
  }
}
// Havuzu oluştur
createPool();

// Kullanıcı işlemleri
// database-service.js - loginUser fonksiyonu
async function loginUser(username, password) {
  try {
    console.log('Veritabanında kullanıcı aranıyor:', username);
    
    const [rows] = await pool.execute(
      'SELECT * FROM kullanicilar WHERE kullanici_adi = ?',
      [username]
    );

    console.log('Bulunan kullanıcı sayısı:', rows.length);
    
    if (rows.length === 0) {
      return { success: false, message: 'Kullanıcı bulunamadı.' };
    }

    const user = rows[0];
    console.log('Şifre karşılaştırması yapılıyor...');
    
    // bcrypt.compare asenkron bir işlem, await kullanarak beklemeliyiz
    const isPasswordValid = await bcrypt.compare(password, user.sifre);
    console.log('Şifre doğrulama sonucu:', isPasswordValid);

    if (!isPasswordValid) {
      return { success: false, message: 'Geçersiz şifre.' };
    }

    return { 
      success: true, 
      user: {
        id: user.id,
        ad: user.ad,
        soyad: user.soyad,
        kullanici_adi: user.kullanici_adi,
        rol: user.rol
      } 
    };
  } catch (error) {
    console.error('Giriş hatası:', error);
    return { success: false, message: 'Giriş sırasında bir hata oluştu: ' + error.message };
  }
}

async function registerUser(userData) {
  try {
    // Kullanıcı adı kontrol et
    const [existingUsers] = await pool.execute(
      'SELECT * FROM kullanicilar WHERE kullanici_adi = ?',
      [userData.kullanici_adi]
    );

    if (existingUsers.length > 0) {
      return { success: false, message: 'Bu kullanıcı adı zaten kullanılıyor.' };
    }

    // Yönetici rolü için doğrulama gerekli
    if (userData.rol === 'yonetici') {
      // Eğer zaten bir doğrulama işlemi varsa, onu iptal et
      if (global.adminVerificationData) {
        return { 
          success: false, 
          message: 'Devam eden bir yönetici kayıt işlemi var. Lütfen önceki işlemi tamamlayın.' 
        };
      }

      // 6 haneli doğrulama kodu oluştur
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Nodemailer ile mail gönderme
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'karatasmakine0@gmail.com',
          pass: 'yemp tpxk sbyk ubvp' // Gmail app şifresi
        }
      });

      // Mail gönderme
      await transporter.sendMail({
        from: 'karatasmakine0@gmail.com',
        to: 'karatasmakine0@gmail.com', // Patronun maili
        subject: 'Yeni Yönetici Hesabı Doğrulama',
        text: `Yeni bir yönetici hesabı için doğrulama kodu:

Kullanıcı Bilgileri:
Ad: ${userData.ad}
Soyad: ${userData.soyad}
Kullanıcı Adı: ${userData.kullanici_adi}

Doğrulama Kodu: ${verificationCode}

Bu kod 15 dakika içinde geçerli olacaktır.`
      });

      // Geçici olarak doğrulama kodunu ve kullanıcı verilerini sakla
      global.adminVerificationData = {
        userData,
        code: verificationCode,
        expires: Date.now() + 15 * 60 * 1000 // 15 dakika
      };

      return { 
        success: true, 
        message: 'Doğrulama kodu patronun mail adresine gönderildi.',
        requiresVerification: true 
      };
    }

    // Yönetici değilse normal kayıt işlemi
    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(userData.sifre, 10);

    // Kullanıcıyı ekle
    const [result] = await pool.execute(
      'INSERT INTO kullanicilar (ad, soyad, kullanici_adi, sifre, rol) VALUES (?, ?, ?, ?, ?)',
      [userData.ad, userData.soyad, userData.kullanici_adi, hashedPassword, userData.rol]
    );

    return { 
      success: true, 
      message: 'Kullanıcı başarıyla kaydedildi.',
      userId: result.insertId 
    };
  } catch (error) {
    console.error('Kayıt hatası:', error);
    return { success: false, message: 'Kayıt sırasında bir hata oluştu.' };
  }
}


// Yeni doğrulama fonksiyonu
async function verifyAdminRegistration(verificationCode) {
  console.log('Doğrulama kodu kontrol ediliyor:', verificationCode);

  // Global değişkeni kontrol et
  const verificationData = global.adminVerificationData;

  console.log('Kayıtlı doğrulama verisi:', verificationData);

  // Doğrulama kontrolü
  if (!verificationData) {
    console.error('Doğrulama verisi bulunamadı');
    return { 
      success: false, 
      message: 'Doğrulama verisi bulunamadı. Lütfen kayıt işlemini tekrarlayın.' 
    };
  }

  if (verificationData.code !== verificationCode) {
    console.error('Doğrulama kodu eşleşmiyor');
    return { 
      success: false, 
      message: 'Girilen doğrulama kodu yanlış.' 
    };
  }

  if (Date.now() > verificationData.expires) {
    console.error('Doğrulama kodunun süresi doldu');
    return { 
      success: false, 
      message: 'Doğrulama kodunun süresi doldu. Lütfen tekrar kayıt olun.' 
    };
  }

  try {
    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(verificationData.userData.sifre, 10);

    // Kullanıcıyı ekle
    const [result] = await pool.execute(
      'INSERT INTO kullanicilar (ad, soyad, kullanici_adi, sifre, rol) VALUES (?, ?, ?, ?, ?)',
      [
        verificationData.userData.ad, 
        verificationData.userData.soyad, 
        verificationData.userData.kullanici_adi, 
        hashedPassword, 
        verificationData.userData.rol
      ]
    );

    // Doğrulama verilerini temizle
    global.adminVerificationData = null;

    console.log('Yönetici hesabı başarıyla oluşturuldu');

    return { 
      success: true, 
      message: 'Yönetici hesabı başarıyla oluşturuldu.',
      userId: result.insertId 
    };
  } catch (error) {
    console.error('Yönetici kayıt hatası:', error);
    return { 
      success: false, 
      message: 'Kayıt sırasında bir hata oluştu: ' + error.message 
    };
  }
}


async function getAllUsers() {
  try {
    const [rows] = await pool.execute(
      'SELECT id, ad, soyad, kullanici_adi, rol, olusturma_tarihi FROM kullanicilar'
    );
    return { success: true, users: rows };
  } catch (error) {
    console.error('Kullanıcıları getirme hatası:', error);
    return { success: false, message: 'Kullanıcılar getirilirken bir hata oluştu.' };
  }
}


// Hammadde ekleme fonksiyonunu değiştirelim
async function addHammadde(hammaddeData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Stok kodu oluştur (HM001, HM002 gibi)
    const [lastHammadde] = await connection.execute(
      "SELECT stok_kodu FROM hammaddeler WHERE stok_kodu REGEXP '^HM[0-9]+$' ORDER BY CAST(SUBSTRING(stok_kodu, 3) AS UNSIGNED) ASC"
    );
    
    let stokKodu = 'HM001'; // Varsayılan olarak HM001'den başla
    
    if (lastHammadde.length > 0) {
      // Tüm HM kodlarını al ve sırala
      const hmCodes = [];
      for (let i = 0; i < lastHammadde.length; i++) {
        const code = lastHammadde[i].stok_kodu;
        const numPart = parseInt(code.substring(2));
        if (!isNaN(numPart)) {
          hmCodes.push(numPart);
        }
      }
      
      // Kodları sırala
      hmCodes.sort((a, b) => a - b);
      
      // Sıradaki boş numarayı bul (1'den başlayarak)
      let nextNum = 1;
      for (let i = 0; i < hmCodes.length; i++) {
        if (hmCodes[i] === nextNum) {
          nextNum++;
        } else if (hmCodes[i] > nextNum) {
          // Eğer atlanmış bir sayı bulduk, onu kullan
          break;
        }
      }
      
      stokKodu = `HM${String(nextNum).padStart(3, '0')}`;
    }
    
    // Kullanıcı bilgilerini al
    const [userRows] = await connection.execute(
      'SELECT ad, soyad FROM kullanicilar WHERE id = ?',
      [hammaddeData.ekleyen_id]
    );
    
    const user = userRows.length > 0 ? userRows[0] : null;
    
    // Kullanıcı baş harflerini al
    let userInitials = 'XX'; // Varsayılan
    if (user && user.ad && user.soyad) {
      userInitials = user.ad.charAt(0).toUpperCase() + user.soyad.charAt(0).toUpperCase();
    }
    
    // Şu anki ay ve yılı al (AAYY formatında)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');     // Gün eklendi
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(2);
    const dateCode = day + month + year;  // GGAAYY formatı oluşturuldu
    
    // Hammadde için barkod oluştur
    let barkod;
    
    switch(hammaddeData.hammadde_turu) {
      case 'sac':
        // Saç barkodu oluştur - basit format
        barkod = `S${dateCode}-${hammaddeData.kalinlik}-${userInitials}`;
        break;
        
      case 'boru':
        // Boru çapını ve uzunluğunu cm'ye çevir
        const capCm = Math.round(Number(hammaddeData.cap) / 10);
        const uzunlukCm = Math.round(Number(hammaddeData.uzunluk) / 10);
        
        // Boru barkodu oluştur
        barkod = `B${dateCode}-${capCm}-${uzunlukCm}-${userInitials}`;
        break;
        
      case 'mil':
        // Mil çapını ve uzunluğunu cm'ye çevir
        const milCapCm = Math.round(Number(hammaddeData.cap) / 10);
        const milUzunlukCm = Math.round(Number(hammaddeData.uzunluk) / 10);
        
        // Mil barkodu oluştur
        barkod = `M${dateCode}-${milCapCm}-${milUzunlukCm}-${userInitials}`;
        break;
        
      default:
        // Varsayılan barkod (eski format)
        barkod = `UNK-${Math.floor(Math.random() * 90000) + 10000}`;
    }
    
    console.log(`Yeni stok kodu oluşturuldu: ${stokKodu}, Barkod: ${barkod}`);
    
    // Hammadde türüne göre DB kolonlarını hazırla
    let columns, values, params;
    
    switch(hammaddeData.hammadde_turu) {
      case 'sac':
        columns = `
          stok_kodu, hammadde_turu, malzeme_adi, kalinlik, yogunluk, 
          toplam_kilo, kalan_kilo, kritik_seviye, barkod, ekleyen_id
        `;
        values = `?, ?, ?, ?, ?, ?, ?, ?, ?, ?`;
        params = [
          stokKodu,
          hammaddeData.hammadde_turu,
          hammaddeData.malzeme_adi,
          hammaddeData.kalinlik,
          hammaddeData.yogunluk,
          hammaddeData.toplam_kilo, // Başlangıçta 0 olacak
          hammaddeData.toplam_kilo, // Başlangıçta 0 olacak
          hammaddeData.kritik_seviye,
          barkod,
          hammaddeData.ekleyen_id
        ];
        break;
        
      case 'boru':
        columns = `
          stok_kodu, hammadde_turu, malzeme_adi, cap, kalinlik, uzunluk,
          yogunluk, toplam_kilo, kalan_kilo, kritik_seviye, barkod, ekleyen_id
        `;
        values = `?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?`;
        params = [
          stokKodu,
          hammaddeData.hammadde_turu,
          hammaddeData.malzeme_adi,
          hammaddeData.cap,
          hammaddeData.kalinlik,
          hammaddeData.uzunluk,
          hammaddeData.yogunluk,
          hammaddeData.toplam_kilo, // Başlangıçta 0 olacak
          hammaddeData.toplam_kilo, // Başlangıçta 0 olacak
          hammaddeData.kritik_seviye,
          barkod,
          hammaddeData.ekleyen_id
        ];
        break;
        
      case 'mil':
        columns = `
          stok_kodu, hammadde_turu, malzeme_adi, cap, uzunluk,
          yogunluk, toplam_kilo, kalan_kilo, kritik_seviye, barkod, ekleyen_id
        `;
        values = `?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?`;
        params = [
          stokKodu,
          hammaddeData.hammadde_turu,
          hammaddeData.malzeme_adi,
          hammaddeData.cap,
          hammaddeData.uzunluk,
          hammaddeData.yogunluk,
          hammaddeData.toplam_kilo, // Başlangıçta 0 olacak
          hammaddeData.toplam_kilo, // Başlangıçta 0 olacak
          hammaddeData.kritik_seviye,
          barkod,
          hammaddeData.ekleyen_id
        ];
        break;
        
      default:
        throw new Error('Geçersiz hammadde türü');
    }
    
    // Hammaddeyi veritabanına ekle
    const [result] = await connection.execute(
      `INSERT INTO hammaddeler (${columns}) VALUES (${values})`,
      params
    );
    
    const hammaddeId = result.insertId;
    
    await connection.commit();
    
    return { 
      success: true, 
      message: 'Hammadde başarıyla eklendi.',
      hammaddeId: hammaddeId,
      stokKodu: stokKodu,
      barkod: barkod
    };
  } catch (error) {
    await connection.rollback();
    console.error('Hammadde ekleme hatası:', error);
    return { success: false, message: 'Hammadde eklenirken bir hata oluştu: ' + error.message };
  } finally {
    connection.release();
  }
}


async function updateIslem(islemId, islemData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // İlk olarak mevcut işlem verilerini al
    const [currentIslem] = await connection.execute(
      `SELECT islem_turu, hammadde_id, miktar, kullanici_id FROM islemler WHERE id = ?`,
      [islemId]
    );
    
    if (currentIslem.length === 0) {
      throw new Error('İşlem bulunamadı.');
    }
    
    const islemInfo = currentIslem[0];
    
    // Hammadde bilgilerini al
    const [hammaddeRows] = await connection.execute(
      'SELECT kalan_miktar FROM hammaddeler WHERE id = ?',
      [islemInfo.hammadde_id]
    );
    
    if (hammaddeRows.length === 0) {
      throw new Error('Hammadde bulunamadı.');
    }
    
    const hammadde = hammaddeRows[0];
    
    // Stoğa geri yükleme işlemi mi kontrol et
    const isStogaGeriYukle = islemData.stoga_geri_yukle === true || islemData.stoga_geri_yukle === 1;
    
    // Eğer stoğa geri yükleme değilse, normal güncelleme yap
    if (!isStogaGeriYukle) {
      // İşlem türünü koru
      const islemTuru = islemData.islem_turu || islemInfo.islem_turu;
      
      // İşlemi güncelle
      await connection.execute(
        `UPDATE islemler SET 
         islem_turu = ?, kullanim_alani = ?, proje_id = ?, iskarta_urun = ?
         WHERE id = ?`,
        [
          islemTuru,
          islemData.kullanim_alani || islemInfo.kullanim_alani,
          islemData.proje_id || null,
          islemData.iskarta_urun ? 1 : 0,
          islemId
        ]
      );
    }
    
    // Orjinal stoğa geri yükleme işlemi
    if (isStogaGeriYukle && islemData.geri_yukle_miktar > 0) {
      const geriYukleMiktar = parseFloat(islemData.geri_yukle_miktar);
      const islemMiktar = parseFloat(islemInfo.miktar);
      
      // Geri yükleme miktarını doğrula
      if (geriYukleMiktar > islemMiktar) {
  return { 
    success: false, 
    message: `Geri yükleme miktarı (${geriYukleMiktar}) işlem miktarından (${islemMiktar}) büyük olamaz.` 
  };
}
      
      // İkili kaydı önlemek için son 5 saniye içinde aynı işlem yapılmış mı kontrol et
      const [existingReturns] = await connection.execute(
        `SELECT COUNT(*) AS count FROM islemler 
         WHERE hammadde_id = ? 
         AND islem_turu = 'İade' 
         AND kullanim_alani = 'StokGeriYukleme' 
         AND miktar = ? 
         AND islem_tarihi > DATE_SUB(NOW(), INTERVAL 5 SECOND)`,
        [islemInfo.hammadde_id, geriYukleMiktar]
      );
      
      // Eğer son 5 saniye içinde aynı işlem yapılmışsa, tekrar yapma
      if (existingReturns[0].count > 0) {
        console.log('Son 5 saniye içinde aynı işlem zaten yapılmış, tekrar yapılmayacak.');
      } else {
        // Hammadde kalan miktarını güncelle
        const yeniKalanMiktar = parseFloat(hammadde.kalan_miktar) + geriYukleMiktar;
        
        await connection.execute(
          'UPDATE hammaddeler SET kalan_miktar = ? WHERE id = ?',
          [yeniKalanMiktar, islemInfo.hammadde_id]
        );
        
        // İade işlemini kaydet - aciklama sütunu olmadığı varsayımıyla
        await connection.execute(
          `INSERT INTO islemler (
            hammadde_id, islem_turu, kullanim_alani, miktar, kullanici_id
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            islemInfo.hammadde_id,
            'İade',
            'StokGeriYukleme',
            geriYukleMiktar,
            islemInfo.kullanici_id || 1
          ]
        );
      }
    }
    
    await connection.commit();
    return { 
      success: true, 
      message: isStogaGeriYukle ? 
        `${islemData.geri_yukle_miktar} birim orjinal stoğa geri yüklendi.` : 
        'İşlem başarıyla güncellendi.' 
    };
  } catch (error) {
    await connection.rollback();
    console.error('İşlem güncelleme hatası:', error);
    return { success: false, message: 'İşlem güncellenirken bir hata oluştu: ' + error.message };
  } finally {
    connection.release();
  }
}



// Updated getAllHammadde function to display material type specific information
// Hammadde listesini getirme fonksiyonunu güncelleyelim
async function getAllHammadde() {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        h.*,
        CASE 
          WHEN h.kalan_kilo < 0.01 AND h.kalan_kilo > -0.01 THEN CAST(0 AS DECIMAL(10,2))
          ELSE CAST(h.kalan_kilo AS DECIMAL(10,2))
        END as kalan_kilo,
        CASE 
          WHEN h.kalan_kilo < 0.01 AND h.kalan_kilo > -0.01 THEN 'STOKTA_YOK'
          WHEN h.kalan_kilo <= h.kritik_seviye THEN 'AZ_KALDI'
          ELSE 'STOKTA_VAR'
        END AS durum
      FROM hammaddeler h
      ORDER BY h.ekleme_tarihi DESC
    `);
    return { success: true, hammaddeler: rows };
  } catch (error) {
    console.error('Hammaddeleri getirme hatası:', error);
    return { success: false, message: 'Hammaddeler getirilirken bir hata oluştu.' };
  }
}

// Updated getHammaddeById function for different material types
// Function to update getHammaddeById to exclude depleted parts
async function getHammaddeById(id) {
  try {
    const [hammaddeRows] = await pool.execute(
      'SELECT * FROM hammaddeler WHERE id = ?',
      [id]
    );
    
    if (hammaddeRows.length === 0) {
      return { success: false, message: 'Hammadde bulunamadı.' };
    }
    
    const hammadde = hammaddeRows[0];
    
    // Kullanıcı bilgilerini getir
    const [userRows] = await pool.execute(
      'SELECT ad, soyad, kullanici_adi FROM kullanicilar WHERE id = ?',
      [hammadde.ekleyen_id]
    );
    
    // Parçaları getir - sadece TUKENDI olmayan parçaları getir
    const [parcalarRows] = await pool.execute(
      'SELECT * FROM parcalar WHERE hammadde_id = ? AND durum != "TUKENDI" ORDER BY id',
      [id]
    );
    
    // Parçalara dinamik olarak parca_no ekle
    parcalarRows.forEach((parca, index) => {
      parca.parca_no = index + 1;
    });
    
    // Eğer parçaların barkod_kodu yoksa, hammadde türüne göre otomatik olarak oluştur
    for (const parca of parcalarRows) {
      if (!parca.barkod_kodu) {
        let parcaBarkodPrefix;
        switch(hammadde.hammadde_turu || 'sac') { // Varsayılan olarak sac
          case 'sac':
            parcaBarkodPrefix = 'STP';
            break;
          case 'boru':
            parcaBarkodPrefix = 'BRU';
            break;
          case 'mil':
            parcaBarkodPrefix = 'MIL';
            break;
          default:
            parcaBarkodPrefix = 'STP';
        }
        
        const parcaBarkod = `${parcaBarkodPrefix}-${Math.floor(Math.random() * 90000) + 10000}`;
        
        await pool.execute(
          'UPDATE parcalar SET barkod_kodu = ?, hammadde_turu = ? WHERE id = ?',
          [parcaBarkod, hammadde.hammadde_turu || 'sac', parca.id]
        );
        
        parca.barkod_kodu = parcaBarkod;
        parca.hammadde_turu = hammadde.hammadde_turu || 'sac';
      }
    }
    
    return { 
      success: true, 
      hammadde: hammadde,
      ekleyen: userRows.length > 0 ? userRows[0] : null,
      parcalar: parcalarRows
    };
  } catch (error) {
    console.error('Hammadde detayı getirme hatası:', error);
    return { success: false, message: 'Hammadde detayı getirilirken bir hata oluştu.' };
  }
}

async function updateHammadde(id, hammaddeData) {
  try {
    await pool.execute(
      `UPDATE hammaddeler SET 
       malzeme_adi = ?, kalinlik = ?, en = ?, boy = ?, 
       yogunluk = ?, kritik_seviye = ?
       WHERE id = ?`,
      [
        hammaddeData.malzeme_adi,
        hammaddeData.kalinlik,
        hammaddeData.en,
        hammaddeData.boy,
        hammaddeData.yogunluk,
        hammaddeData.kritik_seviye,
        id
      ]
    );
    
    return { success: true, message: 'Hammadde başarıyla güncellendi.' };
  } catch (error) {
    console.error('Hammadde güncelleme hatası:', error);
    return { success: false, message: 'Hammadde güncellenirken bir hata oluştu.' };
  }
}





/**
 * Hammadde ve ilişkili kayıtları siler, bildirim e-postası gönderir
 * @param {number} id - Hammadde ID
 * @param {string} reason - Silme nedeni
 * @param {Object} userData - Kullanıcı bilgileri
 * @returns {Promise<Object>} İşlem sonucu
 */
async function deleteHammaddeWithNotification(id, reason, userData) {
  const connection = await pool.getConnection();
  
  try {
    // Hammadde bilgilerini al (silme öncesi e-posta için)
    const [hammaddeInfo] = await connection.execute(
      'SELECT * FROM hammaddeler WHERE id = ?',
      [id]
    );
    
    if (hammaddeInfo.length === 0) {
      return { success: false, message: 'Hammadde bulunamadı.' };
    }
    
    const hammadde = hammaddeInfo[0];
    
    // Normal silme işlemi
    await connection.beginTransaction();
    
    // Yabancı anahtar kısıtlaması sorunu için: Silme sırası önemli
    
    // 1. İlgili tüm parça işlemlerini (islemler) sil
    const [parcaRows] = await connection.execute(
      'SELECT id FROM parcalar WHERE hammadde_id = ?',
      [id]
    );
    
    for (const parca of parcaRows) {
      await connection.execute(
        'DELETE FROM islemler WHERE parca_id = ?',
        [parca.id]
      );
    }
    
    // 2. Önce parçaları sil (foreign key kısıtlaması)
    await connection.execute(
      'DELETE FROM parcalar WHERE hammadde_id = ?',
      [id]
    );
    
    // 3. Sonra hammadde giriş geçmişini sil
    await connection.execute(
      'DELETE FROM hammadde_giris_gecmisi WHERE hammadde_id = ?',
      [id]
    );
    
    // 4. En son hammaddeyi sil
    await connection.execute(
      'DELETE FROM hammaddeler WHERE id = ?',
      [id]
    );
    
    // İşlemi tamamla
    await connection.commit();
    
    // E-posta gönder
    try {
      // Email servisi tanımlı ise kullan
      if (typeof emailService !== 'undefined' && emailService) {
        const deleteInfo = {
          itemType: 'Hammadde',
          itemName: formatMalzemeBilgisi(hammadde), // Format fonksiyonu kullanılabilir
          itemId: id,
          reason: reason,
          user: `${userData.ad} ${userData.soyad} (${userData.kullanici_adi})`,
          timestamp: new Date().toLocaleString('tr-TR')
        };
        
        await emailService.sendDeleteNotification(deleteInfo);
      } else {
        // Email servisi yoksa console'a log
        console.log('Hammadde silme bilgisi (email servisi yok):', {
          hammadde: formatMalzemeBilgisi(hammadde),
          id,
          reason,
          user: `${userData.ad} ${userData.soyad}`,
          timestamp: new Date().toLocaleString('tr-TR')
        });
      }
    } catch (emailError) {
      console.error('Bildirim e-postası gönderimi sırasında hata:', emailError);
      // E-posta hatası işlemi engellemez, sadece loglama yapılır
    }
    
    return { 
      success: true, 
      message: 'Hammadde ve ilişkili tüm kayıtlar başarıyla silindi.' 
    };
  } catch (error) {
    await connection.rollback();
    console.error('Hammadde silme hatası:', error);
    return { 
      success: false, 
      message: 'Hammadde silinirken bir hata oluştu: ' + error.message 
    };
  } finally {
    connection.release();
  }
}


// Parça işlemleri
async function getParcalarByHammaddeId(hammaddeId) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM parcalar WHERE hammadde_id = ? AND durum != "TUKENDI" ORDER BY id',
      [hammaddeId]
    );
    
    // Add the parca_no dynamically based on array index
    const parcalarWithNumber = rows.map((parca, index) => {
      return {
        ...parca,
        parca_no: index + 1 // Generate parca_no dynamically
      };
    });
    
    return { success: true, parcalar: parcalarWithNumber };
  } catch (error) {
    console.error('Parçaları getirme hatası:', error);
    return { success: false, message: 'Parçalar getirilirken bir hata oluştu.' };
  }
}




// Function to properly manage renumbering of parts during updates
async function updateParca(id, parcaData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Parçayı güncelle
    await connection.execute(
      `UPDATE parcalar SET 
       durum = ?, kalan_kilo = ?, kullanim_orani = ?
       WHERE id = ?`,
      [
        parcaData.durum,
        parcaData.kalan_kilo,
        parcaData.kullanim_orani,
        id
      ]
    );
    
    // Hammadde toplam kalan miktarını güncelle
    const [parcaRow] = await connection.execute(
      'SELECT hammadde_id FROM parcalar WHERE id = ?',
      [id]
    );
    
    if (parcaRow.length > 0) {
      const hammaddeId = parcaRow[0].hammadde_id;
      
      // Tüm parçaların toplam kalan kilosunu hesapla
      const [sumResult] = await connection.execute(
        'SELECT SUM(kalan_kilo) AS toplam_kalan FROM parcalar WHERE hammadde_id = ?',
        [hammaddeId]
      );
      
      if (sumResult.length > 0 && sumResult[0].toplam_kalan !== null) {
        await connection.execute(
          'UPDATE hammaddeler SET kalan_kilo = ? WHERE id = ?',
          [sumResult[0].toplam_kalan, hammaddeId]
        );
      }
    }
    
    await connection.commit();
    return { success: true, message: 'Parça başarıyla güncellendi.' };
  } catch (error) {
    await connection.rollback();
    console.error('Parça güncelleme hatası:', error);
    return { success: false, message: 'Parça güncellenirken bir hata oluştu.' };
  } finally {
    connection.release();
  }
}

// Proje işlemleri
// database-service.js dosyasındaki addProje fonksiyonunu bu şekilde güncelleyin

async function addProje(projeData) {
  try {
    // Rastgele bir proje kodu oluştur
    const projeKodu = 'PRJ' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    // Veritabanı işlemi için kontroller
    const projeAdi = projeData.adi || projeData.proje_adi || '';
    const ekleyenId = projeData.ekleyen_id !== undefined ? projeData.ekleyen_id : null;

    // Boş proje adı kontrolü
    if (!projeAdi.trim()) {
      return { success: false, message: 'Proje adı boş olamaz' };
    }

    console.log('Eklenen proje verileri:', {
      proje_kodu: projeKodu,
      proje_adi: projeAdi,
      ekleyen_id: ekleyenId
    });

    // Sorguyu hazırla - alanları açıkça belirt
    const [result] = await pool.execute(
      `INSERT INTO projeler (proje_kodu, proje_adi, olusturma_tarihi) 
       VALUES (?, ?, NOW())`,
      [projeKodu, projeAdi]
    );

    return { 
      success: true, 
      message: 'Proje başarıyla eklendi', 
      proje: {
        id: result.insertId,
        proje_kodu: projeKodu,
        adi: projeAdi,
        proje_adi: projeAdi,
        ekleyen_id: ekleyenId
      }
    };
  } catch (error) {
    console.error('Proje ekleme hatası:', error);
    return { success: false, message: error.message };
  }
}

async function getAllProjeler() {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM projeler ORDER BY olusturma_tarihi DESC'
    );
    return { success: true, projeler: rows };
  } catch (error) {
    console.error('Projeleri getirme hatası:', error);
    return { success: false, message: 'Projeler getirilirken bir hata oluştu.' };
  }
}

// Add new function to count active (non-depleted) parts
async function getActivePartCount(hammaddeId) {
  try {
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) AS active_count FROM parcalar WHERE hammadde_id = ? AND durum != "TUKENDI"',
      [hammaddeId]
    );
    
    if (countResult.length > 0) {
      return countResult[0].active_count;
    }
    return 0;
  } catch (error) {
    console.error('Aktif parça sayma hatası:', error);
    return 0;
  }
}


async function checkHammaddeExists(hammaddeData) {
  const connection = await pool.getConnection();
  
  try {
    let sql = `SELECT * FROM hammaddeler WHERE hammadde_turu = ? AND malzeme_adi = ?`;
    let params = [hammaddeData.hammadde_turu, hammaddeData.malzeme_adi];
    
    // Her hammadde türü için uygun kontrol alanlarını ekle
    switch(hammaddeData.hammadde_turu) {
      case 'sac':
        // Sac için sadece kalınlık kontrol et
        sql += ` AND kalinlik = ?`;
        params.push(hammaddeData.kalinlik);
        break;
        
      case 'boru':
        // Boru için çap, kalınlık ve uzunluk kontrol et
        sql += ` AND cap = ? AND kalinlik = ? AND uzunluk = ?`;
        params.push(hammaddeData.cap, hammaddeData.kalinlik, hammaddeData.uzunluk);
        break;
        
      case 'mil':
        // Mil için sadece çap ve uzunluk kontrol et
        sql += ` AND cap = ? AND uzunluk = ?`;
        params.push(hammaddeData.cap, hammaddeData.uzunluk);
        break;
        
      default:
        // Varsayılan durumda sadece malzeme adı kontrol edilir
        break;
    }
    
    const [rows] = await connection.execute(sql, params);
    
    if (rows.length > 0) {
      return { 
        success: true, 
        exists: true, 
        hammadde: rows[0],
        message: 'Hammadde zaten mevcut' 
      };
    } else {
      return { 
        success: true, 
        exists: false, 
        message: 'Hammadde mevcut değil' 
      };
    }
    
  } catch (error) {
    console.error('Hammadde kontrol hatası:', error);
    return { 
      success: false, 
      message: 'Hammadde kontrol edilirken bir hata oluştu: ' + error.message 
    };
  } finally {
    connection.release();
  }
}


// İşlem ekleme fonksiyonu (Güncellenmiş)
async function addIslem(islemData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Parça bilgilerini al
    const [parcaRows] = await connection.execute(
      'SELECT * FROM parcalar WHERE id = ?',
      [islemData.parca_id]
    );
    
    if (parcaRows.length === 0) {
      throw new Error('Parça bulunamadı.');
    }
    
    const parca = parcaRows[0];
    const hammaddeId = parca.hammadde_id;
    
    // Hammadde bilgilerini al
    const [hammaddeRows] = await connection.execute(
      'SELECT * FROM hammaddeler WHERE id = ?',
      [hammaddeId]
    );
    
    if (hammaddeRows.length === 0) {
      throw new Error('Hammadde bulunamadı.');
    }
    
    const hammadde = hammaddeRows[0];
    const hammaddeTuru = hammadde.hammadde_turu || 'sac';
    
    // Sayısal değerleri dönüştür
    const kullanilanMiktar = parseFloat(islemData.kullanilanMiktar);
    const hurdaMiktar = parseFloat(islemData.hurdaMiktar);
    const parcaKalanKilo = parseFloat(parca.kalan_kilo);
    const parcaOrijinalKilo = parseFloat(parca.orijinal_kilo);
    
    // Toplam kullanılan miktarı hesapla
    const toplamKullanilan = kullanilanMiktar + hurdaMiktar;
    
    // Parça miktarı kontrol
    if (toplamKullanilan > parcaKalanKilo) {
      await connection.rollback();
      return { 
        success: false, 
        message: `İşlem yapılamadı: Kullanmak istediğiniz miktar (${toplamKullanilan.toFixed(2)} kg) parçada kalan miktardan (${parcaKalanKilo.toFixed(2)} kg) fazla.`
      };
    }
    
    // İşlemi veritabanına ekle - YENİ: makine, calisan_id ve musteri_id alanları eklendi
    const [result] = await connection.execute(
      `INSERT INTO islemler 
       (parca_id, islem_turu, kullanim_alani, kullanilanMiktar, hurdaMiktar, proje_id, kullanici_id,
        yari_mamul_adi, yari_mamul_birim, yari_mamul_miktar, makine, calisan_id, musteri_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        islemData.parca_id,
        islemData.islem_turu,
        islemData.kullanim_alani,
        kullanilanMiktar,
        hurdaMiktar,
        islemData.proje_id,
        islemData.kullanici_id,
        islemData.yari_mamul_adi || null,
        islemData.yari_mamul_birim || null,
        islemData.yari_mamul_miktar || null,
        islemData.makine || null,
        islemData.calisan_id || null,
        islemData.musteri_id || null
      ]
    );
    
    const islemId = result.insertId;
    
    // Yeni kalan miktarı hesapla
    const yeniKalanKilo = Math.max(0, parcaKalanKilo - toplamKullanilan);
    
    // Kullanım oranını hesapla
    const kullanimOrani = ((parcaOrijinalKilo - yeniKalanKilo) / parcaOrijinalKilo) * 100;
    
    // Durumu belirle
    let durum = 'TAM';
    if (yeniKalanKilo <= 0) {
      durum = 'TUKENDI';
    } else if (yeniKalanKilo < parcaOrijinalKilo) {
      durum = 'KISMEN_KULLANILDI';
    }
    
    // Parçayı güncelle
    await connection.execute(
      `UPDATE parcalar SET 
       durum = ?, kalan_kilo = ?, kullanim_orani = ?
       WHERE id = ?`,
      [durum, yeniKalanKilo, kullanimOrani, islemData.parca_id]
    );
    
    // Hammadde toplam kalan miktarını güncelle
    const [sumResult] = await connection.execute(
      'SELECT SUM(kalan_kilo) AS toplam_kalan FROM parcalar WHERE hammadde_id = ?',
      [hammaddeId]
    );
    
    if (sumResult.length > 0 && sumResult[0].toplam_kalan !== null) {
      await connection.execute(
        'UPDATE hammaddeler SET kalan_kilo = ? WHERE id = ?',
        [sumResult[0].toplam_kalan, hammaddeId]
      );
    }
    
    // Eğer kullanım alanı MakineImalat ve yarı mamul bilgileri var ise
    if (islemData.kullanim_alani === 'MakineImalat' && 
        islemData.yari_mamul_adi && 
        islemData.yari_mamul_birim && 
        islemData.yari_mamul_miktar) {

      // Önce aynı isimde ve birimde yarı mamül var mı kontrol et
      const [existingYariMamulRows] = await connection.execute(
        'SELECT * FROM yari_mamuller WHERE malzeme_adi = ? AND birim = ?',
        [islemData.yari_mamul_adi, islemData.yari_mamul_birim]
      );

      if (existingYariMamulRows.length > 0) {
        // Mevcut yarı mamül varsa, miktarını güncelle
        const existingYariMamul = existingYariMamulRows[0];
        
        // Toplam ve kalan miktarları güncelle
        const yeniToplamMiktar = parseFloat(existingYariMamul.toplam_miktar) + parseFloat(islemData.yari_mamul_miktar);
        const yeniKalanMiktar = parseFloat(existingYariMamul.kalan_miktar) + parseFloat(islemData.yari_mamul_miktar);
        
        await connection.execute(
          `UPDATE yari_mamuller 
           SET toplam_miktar = ?, kalan_miktar = ? 
           WHERE id = ?`,
          [
            yeniToplamMiktar, 
            yeniKalanMiktar, 
            existingYariMamul.id
          ]
        );
        
        // Giriş geçmişine kaydet
        await connection.execute(
          `INSERT INTO yari_mamul_giris_gecmisi 
           (yari_mamul_id, miktar, birim, hammadde_id, hammadde_kodu, ekleyen_id) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            existingYariMamul.id,
            islemData.yari_mamul_miktar,
            islemData.yari_mamul_birim,
            hammaddeId,
            hammadde.stok_kodu,
            islemData.kullanici_id
          ]
        );
      } else {
        // Eğer mevcut değilse, yeni yarı mamül oluştur
        // Kullanıcı bilgilerini al
        const [userRows] = await connection.execute(
          'SELECT ad, soyad FROM kullanicilar WHERE id = ?',
          [islemData.kullanici_id]
        );

        const user = userRows.length > 0 ? userRows[0] : null;

        // Kullanıcı baş harflerini al
        let userInitials = 'XX'; // Varsayılan
        if (user && user.ad && user.soyad) {
          userInitials = user.ad.charAt(0).toUpperCase() + user.soyad.charAt(0).toUpperCase();
        }

        // Şu anki ay ve yılı al
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(2);
        const dateCode = day + month + year;

        // Rastgele sayı oluştur
        const randomNum = Math.floor(Math.random() * 90) + 10;

        // Yarı mamül barkodu oluştur
        const barkod = `YM${dateCode}-${randomNum}-${userInitials}`;

        // Sıradaki YM kodunu bul
        const [lastYariMamul] = await connection.execute(
          "SELECT stok_kodu FROM yari_mamuller WHERE stok_kodu REGEXP '^YM[0-9]+$' ORDER BY CAST(SUBSTRING(stok_kodu, 3) AS UNSIGNED) DESC LIMIT 1"
        );

        let stokKodu = 'YM001';
        if (lastYariMamul.length > 0) {
          const lastCode = lastYariMamul[0].stok_kodu;
          const lastNum = parseInt(lastCode.substring(2));
          stokKodu = `YM${String(lastNum + 1).padStart(3, '0')}`;
        }

        // Yarı mamül kaydı oluştur
        const [yariMamulResult] = await connection.execute(
          `INSERT INTO yari_mamuller 
           (stok_kodu, malzeme_adi, birim, toplam_miktar, kalan_miktar, barkod, hammadde_id, islem_id, kaynak_parca_id, ekleyen_id) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            stokKodu,
            islemData.yari_mamul_adi,
            islemData.yari_mamul_birim,
            islemData.yari_mamul_miktar,
            islemData.yari_mamul_miktar,
            barkod,
            hammaddeId,
            islemId,
            islemData.parca_id,
            islemData.kullanici_id
          ]
        );

        // Yarı mamül giriş geçmişi kaydı
        await connection.execute(
          `INSERT INTO yari_mamul_giris_gecmisi 
           (yari_mamul_id, miktar, birim, hammadde_id, hammadde_kodu, ekleyen_id) 
           VALUES ((SELECT LAST_INSERT_ID()), ?, ?, ?, ?, ?)`,
          [
            islemData.yari_mamul_miktar,
            islemData.yari_mamul_birim,
            hammaddeId,
            hammadde.stok_kodu,
            islemData.kullanici_id
          ]
        );
      }
    }
    
    await connection.commit();
    return { 
      success: true, 
      message: 'İşlem başarıyla kaydedildi.',
      islemId: islemId
    };
  } catch (error) {
    await connection.rollback();
    console.error('İşlem kaydetme hatası:', error);
    return { success: false, message: 'İşlem kaydedilirken bir hata oluştu: ' + error.message };
  } finally {
    connection.release();
  }
}

// Helper function to format material info based on type
function formatMalzemeBilgisi(hammadde) {
  if (!hammadde.hammadde_turu || hammadde.hammadde_turu === 'sac') {
    return `${hammadde.malzeme_adi} ${hammadde.kalinlik}x${hammadde.en}x${hammadde.boy} mm`;
  } else if (hammadde.hammadde_turu === 'boru') {
    return `${hammadde.malzeme_adi}  Ø${hammadde.cap}x${hammadde.kalinlik}x${hammadde.uzunluk} mm`;
  } else if (hammadde.hammadde_turu === 'mil') {
    return `${hammadde.malzeme_adi} Ø${hammadde.cap}x${hammadde.uzunluk} mm`;
  } else {
    return hammadde.malzeme_adi;
  }
}




// İşlem bilgilerini getir
// İşlem bilgilerini getir
async function getIslemById(islemId) {
  try {
    const [rows] = await pool.execute(`
      SELECT i.*, 
        p.proje_kodu, p.proje_adi,
        u.ad AS kullanici_ad, u.soyad AS kullanici_soyad
      FROM islemler i
      JOIN kullanicilar u ON i.kullanici_id = u.id
      LEFT JOIN projeler p ON i.proje_id = p.id
      WHERE i.id = ?
    `, [islemId]);
    
    if (rows.length === 0) {
      return { success: false, message: 'İşlem bulunamadı.' };
    }
    
    return { success: true, islem: rows[0] };
  } catch (error) {
    console.error('İşlem bilgisi getirme hatası:', error);
    return { success: false, message: 'İşlem bilgisi getirilirken bir hata oluştu.' };
  }
}


async function getIslemlerByParcaId(parcaId) {
  try {
    // First get all parcalar with the same hammadde_id to calculate parca_no
    const [parcaInfo] = await pool.execute(
      'SELECT hammadde_id FROM parcalar WHERE id = ?',
      [parcaId]
    );
    
    if (parcaInfo.length === 0) {
      return { success: false, message: 'Parça bulunamadı' };
    }
    
    const hammaddeId = parcaInfo[0].hammadde_id;
    
    // Get all parcalar for this hammadde to determine the parca_no
    const [allParcalar] = await pool.execute(
      'SELECT id FROM parcalar WHERE hammadde_id = ? ORDER BY id',
      [hammaddeId]
    );
    
    // Find the index of the current parca to determine its parca_no
    const parcaIndex = allParcalar.findIndex(p => p.id === parcaId);
    const parca_no = parcaIndex !== -1 ? parcaIndex + 1 : null;
    
    // Now get the islemler with user and project info
    const [rows] = await pool.execute(`
      SELECT i.*, 
        u.ad AS kullanici_ad, u.soyad AS kullanici_soyad,
        p.proje_kodu, p.proje_adi
      FROM islemler i
      JOIN kullanicilar u ON i.kullanici_id = u.id
      JOIN projeler p ON i.proje_id = p.id
      WHERE i.parca_id = ?
      ORDER BY i.islem_tarihi DESC
    `, [parcaId]);
    
    // Add the parca_no to each row
    rows.forEach(row => {
      row.parca_no = parca_no;
    });
    
    return { success: true, islemler: rows };
  } catch (error) {
    console.error('İşlemleri getirme hatası:', error);
    return { success: false, message: 'İşlemler getirilirken bir hata oluştu.' };
  }
}

async function getIslemlerByProjeId(projeId) {
  try {
    const [rows] = await pool.execute(`
      SELECT i.*, 
        u.ad AS kullanici_ad, u.soyad AS kullanici_soyad,
        p.id AS parca_id, p.parca_no, p.durum AS parca_durum,
        h.stok_kodu, h.malzeme_adi, h.kalinlik, h.en, h.boy
      FROM islemler i
      JOIN kullanicilar u ON i.kullanici_id = u.id
      JOIN parcalar p ON i.parca_id = p.id
      JOIN hammaddeler h ON p.hammadde_id = h.id
      WHERE i.proje_id = ?
      ORDER BY i.islem_tarihi DESC
    `, [projeId]);
    
    return { success: true, islemler: rows };
  } catch (error) {
    console.error('İşlemleri getirme hatası:', error);
    return { success: false, message: 'İşlemler getirilirken bir hata oluştu.' };
  }
}


// Sarf malzeme ekleme
async function addSarfMalzeme(sarfMalzemeData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Stok kodu oluştur (SM001, SM002 gibi)
    const [lastSarfMalzeme] = await connection.execute(
      "SELECT stok_kodu FROM sarf_malzemeler WHERE stok_kodu REGEXP '^SM[0-9]+$' ORDER BY CAST(SUBSTRING(stok_kodu, 3) AS UNSIGNED) ASC"
    );
    
    let stokKodu = 'SM001'; // Varsayılan olarak SM001'den başla
    
    if (lastSarfMalzeme.length > 0) {
      // Tüm SM kodlarını al ve sırala
      const smCodes = [];
      for (let i = 0; i < lastSarfMalzeme.length; i++) {
        const code = lastSarfMalzeme[i].stok_kodu;
        const numPart = parseInt(code.substring(2));
        if (!isNaN(numPart)) {
          smCodes.push(numPart);
        }
      }
      
      // Kodları sırala
      smCodes.sort((a, b) => a - b);
      
      // Sıradaki boş numarayı bul (1'den başlayarak)
      let nextNum = 1;
      for (let i = 0; i < smCodes.length; i++) {
        if (smCodes[i] === nextNum) {
          nextNum++;
        } else if (smCodes[i] > nextNum) {
          // Eğer atlanmış bir sayı bulduk, onu kullan
          break;
        }
      }
      
      stokKodu = `SM${String(nextNum).padStart(3, '0')}`;
    }
    
    // Kullanıcı bilgilerini al
    const [userRows] = await connection.execute(
      'SELECT ad, soyad FROM kullanicilar WHERE id = ?',
      [sarfMalzemeData.ekleyen_id]
    );
    
    const user = userRows.length > 0 ? userRows[0] : null;
    
    // Kullanıcı baş harflerini al
    let userInitials = 'XX'; // Varsayılan
    if (user && user.ad && user.soyad) {
      userInitials = user.ad.charAt(0).toUpperCase() + user.soyad.charAt(0).toUpperCase();
    }
    
    // Şu anki ay ve yılı al (AAYY formatında)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');     // Gün eklendi
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(2);
    const dateCode = day + month + year;  // GGAAYY formatı oluşturuldu
    
    // Rastgele sayı oluştur (1-99 arası)
    const randomNum = Math.floor(Math.random() * 99) + 1;
    const randomCode = String(randomNum).padStart(2, '0');
    
    // Sarf malzeme barkodu oluştur
    const barkod = `SF${dateCode}-${randomCode}-${userInitials}`;
    
    console.log(`Yeni sarf malzeme stok kodu oluşturuldu: ${stokKodu}, Barkod: ${barkod}`);
    
    // Sarf malzemeyi veritabanına ekle - Sadece temel alanları kaydet
    const [result] = await connection.execute(
      `INSERT INTO sarf_malzemeler 
       (stok_kodu, malzeme_adi, birim, toplam_miktar, kalan_miktar, kritik_seviye, barkod, ekleyen_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        stokKodu,
        sarfMalzemeData.malzeme_adi,
        sarfMalzemeData.birim,
        sarfMalzemeData.miktar || 0, // Başlangıçta 0
        sarfMalzemeData.miktar || 0, // Başlangıçta 0
        sarfMalzemeData.kritik_seviye || 0, // Başlangıçta 0
        barkod,
        sarfMalzemeData.ekleyen_id
      ]
    );
    
    const sarfMalzemeId = result.insertId;
    
    await connection.commit();
    
    return { 
      success: true, 
      message: 'Sarf malzeme başarıyla eklendi.',
      sarfMalzemeId: sarfMalzemeId,
      stokKodu: stokKodu,
      barkod: barkod
    };
  } catch (error) {
    await connection.rollback();
    console.error('Sarf malzeme ekleme hatası:', error);
    return { success: false, message: 'Sarf malzeme eklenirken bir hata oluştu: ' + error.message };
  } finally {
    connection.release();
  }
}


async function checkSarfMalzemeExists(malzemeAdi, birim) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM sarf_malzemeler WHERE malzeme_adi = ? AND birim = ?',
      [malzemeAdi, birim]
    );
    
    return { 
      success: true, 
      exists: rows.length > 0,
      sarfMalzeme: rows.length > 0 ? rows[0] : null
    };
  } catch (error) {
    console.error('Sarf malzeme kontrolü hatası:', error);
    return { success: false, message: 'Sarf malzeme kontrolü sırasında bir hata oluştu.' };
  }
}


// Tüm sarf malzemeleri getir
async function getAllSarfMalzeme() {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        s.*,
        CAST(s.toplam_miktar AS DECIMAL(10,2)) AS toplam_miktar,
        CAST(s.kalan_miktar AS DECIMAL(10,2)) AS kalan_miktar,
        CASE 
          WHEN CAST(s.kalan_miktar AS DECIMAL) <= 0 THEN 'STOKTA_YOK'
          WHEN CAST(s.kalan_miktar AS DECIMAL) <= s.kritik_seviye THEN 'AZ_KALDI'
          ELSE 'STOKTA_VAR'
        END AS durum
      FROM sarf_malzemeler s
      ORDER BY s.ekleme_tarihi DESC
    `);
    return { success: true, sarfMalzemeler: rows };
  } catch (error) {
    console.error('Sarf malzemeleri getirme hatası:', error);
    return { success: false, message: 'Sarf malzemeler getirilirken bir hata oluştu.' };
  }
}

async function getSarfMalzemeIslemById(islemId) {
  try {
    const [rows] = await pool.execute(`
      SELECT si.*, 
        p.proje_kodu, p.proje_adi,
        u.ad AS kullanici_ad, u.soyad AS kullanici_soyad
      FROM sarf_malzeme_islemleri si
      JOIN kullanicilar u ON si.kullanici_id = u.id
      LEFT JOIN projeler p ON si.proje_id = p.id
      WHERE si.id = ?
    `, [islemId]);
    
    if (rows.length === 0) {
      return { success: false, message: 'İşlem bulunamadı.' };
    }
    
    return { success: true, islem: rows[0] };
  } catch (error) {
    console.error('Sarf malzeme işlem bilgisi getirme hatası:', error);
    return { success: false, message: 'İşlem bilgisi getirilirken bir hata oluştu.' };
  }
}

// ID'ye göre sarf malzeme getir
async function getSarfMalzemeById(id) {
  try {
    const [sarfMalzemeRows] = await pool.execute(
      'SELECT * FROM sarf_malzemeler WHERE id = ?',
      [id]
    );
    
    if (sarfMalzemeRows.length === 0) {
      return { success: false, message: 'Sarf malzeme bulunamadı.' };
    }
    
    const sarfMalzeme = sarfMalzemeRows[0];
    
    // Kullanıcı bilgilerini getir
    const [userRows] = await pool.execute(
      'SELECT ad, soyad, kullanici_adi FROM kullanicilar WHERE id = ?',
      [sarfMalzeme.ekleyen_id]
    );
    
    // İşlem geçmişini getir
    const [islemRows] = await pool.execute(`
      SELECT 
        si.*,
        u.ad AS kullanici_ad, u.soyad AS kullanici_soyad,
        p.proje_kodu, p.proje_adi
      FROM sarf_malzeme_islemleri si
      LEFT JOIN kullanicilar u ON si.kullanici_id = u.id
      LEFT JOIN projeler p ON si.proje_id = p.id
      WHERE si.sarf_malzeme_id = ?
      ORDER BY si.islem_tarihi DESC
    `, [id]);
    
    return { 
      success: true, 
      sarfMalzeme: sarfMalzeme,
      ekleyen: userRows.length > 0 ? userRows[0] : null,
      islemler: islemRows
    };
  } catch (error) {
    console.error('Sarf malzeme detayı getirme hatası:', error);
    return { success: false, message: 'Sarf malzeme detayı getirilirken bir hata oluştu.' };
  }
}

async function updateSarfMalzemeIslem(islemId, islemData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // First, get the current operation data and sarf_malzeme info
    const [currentIslem] = await connection.execute(
      `SELECT islem_turu, sarf_malzeme_id, miktar, kullanici_id FROM sarf_malzeme_islemleri WHERE id = ?`,
      [islemId]
    );
    
    if (currentIslem.length === 0) {
      throw new Error('İşlem bulunamadı.');
    }
    
    const islemInfo = currentIslem[0];
    
    // Get sarf_malzeme information to update stock
    const [sarfMalzemeRows] = await connection.execute(
      'SELECT kalan_miktar FROM sarf_malzemeler WHERE id = ?',
      [islemInfo.sarf_malzeme_id]
    );
    
    if (sarfMalzemeRows.length === 0) {
      throw new Error('Sarf malzeme bulunamadı.');
    }
    
    const sarfMalzeme = sarfMalzemeRows[0];
    
    // Only update islem_turu if it's explicitly provided in islemData
    const islemTuru = islemData.islem_turu || islemInfo.islem_turu;
    
    // Önce isStogaGeriYukle kontrolü yap, eğer true ise normal güncelleme yapmayacağız
    const isStogaGeriYukle = islemData.stoga_geri_yukle === true || islemData.stoga_geri_yukle === 1;
    
    // Eğer "Stoğa Geri Yükle" işlemi değilse, normal güncellemeyi yap
    if (!isStogaGeriYukle) {
      // Update the operation flags in database
      await connection.execute(
        `UPDATE sarf_malzeme_islemleri SET 
         islem_turu = ?, proje_id = ?, iskarta_urun = ?
         WHERE id = ?`,
        [
          islemTuru,
          islemData.proje_id || null,
          islemData.iskarta_urun ? 1 : 0,
          islemId
        ]
      );
    }
    
    // Handle return to original stock if requested
    if (isStogaGeriYukle && islemData.geri_yukle_miktar > 0) {
      const geriYukleMiktar = parseFloat(islemData.geri_yukle_miktar);
      const islemMiktar = parseFloat(islemInfo.miktar);
      
      // Validate return amount
     // Şununla değiştirin:
if (geriYukleMiktar > islemMiktar) {
  return { 
    success: false, 
    message: `Geri yükleme miktarı (${geriYukleMiktar}) işlem miktarından (${islemMiktar}) büyük olamaz.` 
  };
}
      
      // ÖNEMLİ: İkili kaydı önlemek için, son 5 saniye içinde aynı işlem yapılmış mı kontrol et
      const [existingReturns] = await connection.execute(
        `SELECT COUNT(*) AS count FROM sarf_malzeme_islemleri 
         WHERE sarf_malzeme_id = ? 
         AND islem_turu = 'İade' 
         AND kullanim_alani = 'StokGeriYukleme' 
         AND miktar = ? 
         AND islem_tarihi > DATE_SUB(NOW(), INTERVAL 5 SECOND)`,
        [islemInfo.sarf_malzeme_id, geriYukleMiktar]
      );
      
      // Eğer son 5 saniye içinde aynı işlem yapılmışsa, tekrar yapma
      if (existingReturns[0].count > 0) {
        console.log('Son 5 saniye içinde aynı işlem zaten yapılmış, tekrar yapılmayacak.');
      } else {
        // Update the sarf_malzeme kalan_miktar (increment by return amount)
        const yeniKalanMiktar = parseFloat(sarfMalzeme.kalan_miktar) + geriYukleMiktar;
        
        await connection.execute(
          'UPDATE sarf_malzemeler SET kalan_miktar = ? WHERE id = ?',
          [yeniKalanMiktar, islemInfo.sarf_malzeme_id]
        );
        
        // Tablonun yapısına uygun şekilde INSERT yapalım (aciklama sütunu olmadan)
        await connection.execute(
          `INSERT INTO sarf_malzeme_islemleri 
           (sarf_malzeme_id, islem_turu, kullanim_alani, miktar, kullanici_id) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            islemInfo.sarf_malzeme_id,
            'İade', // Return operation
            'StokGeriYukleme',
            geriYukleMiktar,
            islemInfo.kullanici_id || 1
          ]
        );
      }
    }
    
    await connection.commit();
    return { 
      success: true, 
      message: isStogaGeriYukle ? 
        `${islemData.geri_yukle_miktar} birim orjinal stoğa geri yüklendi.` : 
        'Sarf malzeme işlemi başarıyla güncellendi.' 
    };
  } catch (error) {
    await connection.rollback();
    console.error('Sarf malzeme işlemi güncelleme hatası:', error);
    return { success: false, message: 'İşlem güncellenirken bir hata oluştu: ' + error.message };
  } finally {
    connection.release();
  }
}


// Sarf malzeme güncelleme
async function updateSarfMalzeme(id, sarfMalzemeData) {
  try {
    await pool.execute(
      `UPDATE sarf_malzemeler SET 
       malzeme_adi = ?, birim = ?, kritik_seviye = ?, 
       tedarikci = ?, 
       WHERE id = ?`,
      [
        sarfMalzemeData.malzeme_adi,
        sarfMalzemeData.birim,
        sarfMalzemeData.kritik_seviye,
        sarfMalzemeData.tedarikci,
        id
      ]
    );
    
    return { success: true, message: 'Sarf malzeme başarıyla güncellendi.' };
  } catch (error) {
    console.error('Sarf malzeme güncelleme hatası:', error);
    return { success: false, message: 'Sarf malzeme güncellenirken bir hata oluştu.' };
  }
}





// database-service.js - Düzeltilmiş silme fonksiyonu

/**
 * Sarf malzemeyi ve ilişkili kayıtları siler, bildirim e-postası gönderir
 * @param {number} id - Sarf malzeme ID
 * @param {string} reason - Silme nedeni 
 * @param {Object} userData - Kullanıcı bilgileri
 * @returns {Promise<Object>} İşlem sonucu
 */
async function deleteSarfMalzemeWithNotification(id, reason, userData) {
  const connection = await pool.getConnection();
  
  try {
    // Sarf malzeme bilgilerini al
    const [sarfMalzemeInfo] = await connection.execute(
      'SELECT * FROM sarf_malzemeler WHERE id = ?',
      [id]
    );
    
    if (sarfMalzemeInfo.length === 0) {
      return { success: false, message: 'Sarf malzeme bulunamadı.' };
    }
    
    const sarfMalzeme = sarfMalzemeInfo[0];
    
    // İkincil stok kontrolü kaldırıldı
    
    // Transaction başlat
    await connection.beginTransaction();
    
    // İkincil stok silme işlemleri kaldırıldı
    
    // 1. İlgili tüm sarf malzeme işlemlerini sil
    await connection.execute(
      'DELETE FROM sarf_malzeme_islemleri WHERE sarf_malzeme_id = ?',
      [id]
    );
    
    // 2. Sarf malzeme giriş geçmişini sil
    await connection.execute(
      'DELETE FROM sarf_malzeme_giris_gecmisi WHERE sarf_malzeme_id = ?',
      [id]
    );
    
    // 3. Sarf malzemeyi sil
    await connection.execute(
      'DELETE FROM sarf_malzemeler WHERE id = ?',
      [id]
    );
    
    // İşlemi tamamla
    await connection.commit();
    
    // E-posta gönder
    try {
      if (typeof emailService !== 'undefined' && emailService) {
        const deleteInfo = {
          itemType: 'Sarf Malzeme',
          itemName: `${sarfMalzeme.malzeme_adi} (${sarfMalzeme.stok_kodu || 'Kod Yok'})`,
          itemId: id,
          reason: reason,
          user: `${userData.ad} ${userData.soyad} (${userData.kullanici_adi})`,
          timestamp: new Date().toLocaleString('tr-TR')
        };
        
        // İkincil stok bilgisi kaldırıldı
        
        await emailService.sendDeleteNotification(deleteInfo);
      }
    } catch (emailError) {
      console.error('Bildirim e-postası gönderimi sırasında hata:', emailError);
      // E-posta hatası işlemi engellemez
    }
    
    return { 
      success: true, 
      message: 'Sarf malzeme ve ilişkili tüm kayıtlar başarıyla silindi.' 
    };
  } catch (error) {
    await connection.rollback();
    console.error('Sarf malzeme silme hatası:', error);
    return { 
      success: false, 
      message: 'Sarf malzeme silinirken bir hata oluştu: ' + error.message 
    };
  } finally {
    connection.release();
  }
}



// Sarf malzeme işlemi ekleme
// Düzeltilmiş addSarfMalzemeIslemi fonksiyonu
// Sarf malzeme işlemi ekleme
async function addSarfMalzemeIslemi(islemData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Sarf malzeme bilgilerini al
    const [sarfMalzemeRows] = await connection.execute(
      'SELECT * FROM sarf_malzemeler WHERE id = ?',
      [islemData.sarf_malzeme_id]
    );
    
    if (sarfMalzemeRows.length === 0) {
      throw new Error('Sarf malzeme bulunamadı.');
    }
    
    const sarfMalzeme = sarfMalzemeRows[0];
    
    // Sayısal değerleri dönüştür
    const islemMiktar = parseFloat(islemData.miktar);
    const kalanMiktar = parseFloat(sarfMalzeme.kalan_miktar);
    
    // İşlem türü kontrolü ve stok hareketi
    if (islemData.islem_turu === 'Kullanım' || islemData.islem_turu === 'Fire') {
      // Kullanım veya fire işleminde stoktan düşürme
      if (islemMiktar > kalanMiktar) {
        await connection.rollback();
        return { 
          success: false, 
          message: `Stok Yetersiz!\n${sarfMalzeme.malzeme_adi} için talep ettiğiniz ${islemMiktar.toFixed(2)} ${sarfMalzeme.birim}, mevcut stok miktarından (${kalanMiktar.toFixed(2)} ${sarfMalzeme.birim}) fazla.`,
          toastType: 'error'  // showToast fonksiyonuna tip parametresi
        };
      }
      
      // İşlemi veritabanına ekle - calisan_id ve makine alanları eklendi
      const [result] = await connection.execute(
        `INSERT INTO sarf_malzeme_islemleri 
         (sarf_malzeme_id, islem_turu, kullanim_alani, miktar, proje_id, kullanici_id, calisan_id, makine) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          islemData.sarf_malzeme_id,
          islemData.islem_turu,
          islemData.kullanim_alani,
          islemMiktar,
          islemData.proje_id || null,
          islemData.kullanici_id,
          islemData.calisan_id || null,
          islemData.makine || null
        ]
      );
      
      // Yeni kalan miktarı hesapla (AZALT)
      const yeniKalanMiktar = Math.max(0, kalanMiktar - islemMiktar);
      
      // Debug: Sarf malzeme kalan miktarını güncelleme
      console.log(`Sarf malzeme kullanımı - ID: ${islemData.sarf_malzeme_id}, Eski kalan: ${kalanMiktar}, Kullanılan: ${islemMiktar}, Yeni kalan: ${yeniKalanMiktar}`);
      
      // Veritabanında kalan miktarı güncelle
      await connection.execute(
        'UPDATE sarf_malzemeler SET kalan_miktar = ? WHERE id = ?',
        [yeniKalanMiktar, islemData.sarf_malzeme_id]
      );
      
      await connection.commit();
      return { 
        success: true, 
        message: 'İşlem başarıyla kaydedildi.',
        islemId: result.insertId
      };
    } 
    else if (islemData.islem_turu === 'İade' || islemData.islem_turu === 'Ek') {
      // İade veya ek işleminde stok artışı
      
      // İşlemi veritabanına ekle - calisan_id ve makine alanları eklendi
      const [result] = await connection.execute(
        `INSERT INTO sarf_malzeme_islemleri 
         (sarf_malzeme_id, islem_turu, kullanim_alani, miktar, proje_id, kullanici_id, calisan_id, makine) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          islemData.sarf_malzeme_id,
          islemData.islem_turu,
          islemData.kullanim_alani,
          islemMiktar,
          islemData.proje_id || null,
          islemData.kullanici_id,
          islemData.calisan_id || null,
          islemData.makine || null
        ]
      );
      
      // Yeni kalan miktarı hesapla (ARTIR)
      const yeniKalanMiktar = kalanMiktar + islemMiktar;
      const yeniToplamMiktar = parseFloat(sarfMalzeme.toplam_miktar) + islemMiktar;
      
      // Debug: Sarf malzeme kalan miktarını güncelleme
      console.log(`Sarf malzeme iadesi/ekleme - ID: ${islemData.sarf_malzeme_id}, Eski kalan: ${kalanMiktar}, Eklenen: ${islemMiktar}, Yeni kalan: ${yeniKalanMiktar}`);
      
      // Veritabanında güncelleme yap
      await connection.execute(
        'UPDATE sarf_malzemeler SET kalan_miktar = ?, toplam_miktar = ? WHERE id = ?',
        [yeniKalanMiktar, yeniToplamMiktar, islemData.sarf_malzeme_id]
      );
      
      await connection.commit();
      return { 
        success: true, 
        message: 'İşlem başarıyla kaydedildi.',
        islemId: result.insertId
      };
    }
    
    await connection.rollback();
    return { success: false, message: 'Geçersiz işlem türü.' };
  } catch (error) {
    await connection.rollback();
    console.error('Sarf malzeme işlemi kaydetme hatası:', error);
    return { success: false, message: 'İşlem kaydedilirken bir hata oluştu: ' + error.message };
  } finally {
    connection.release();
  }
}

// Sarf malzeme işlemlerini getir
async function getSarfMalzemeIslemleri(sarfMalzemeId) {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        si.*,
        u.ad AS kullanici_ad, u.soyad AS kullanici_soyad,
        p.proje_kodu, p.proje_adi
      FROM sarf_malzeme_islemleri si
      LEFT JOIN kullanicilar u ON si.kullanici_id = u.id
      LEFT JOIN projeler p ON si.proje_id = p.id
      WHERE si.sarf_malzeme_id = ?
      ORDER BY si.islem_tarihi DESC
    `, [sarfMalzemeId]);
    
    return { success: true, islemler: rows };
  } catch (error) {
    console.error('Sarf malzeme işlemlerini getirme hatası:', error);
    return { success: false, message: 'İşlemler getirilirken bir hata oluştu.' };
  }
}



async function getHammaddeGirisGecmisi(hammaddeId) {
  const connection = await pool.getConnection();
  
  try {
    // ID'si verilen hammaddenin giriş geçmişini en yeniden en eskiye doğru sırala
    const [rows] = await connection.execute(
      `SELECT hgg.*, k.ad as kullanici_ad, k.soyad as kullanici_soyad 
       FROM hammadde_giris_gecmisi hgg 
       LEFT JOIN kullanicilar k ON hgg.ekleyen_id = k.id 
       WHERE hgg.hammadde_id = ? 
       ORDER BY hgg.giris_tarihi DESC`,
      [hammaddeId]
    );
    
    return {
      success: true,
      girisGecmisi: rows
    };
  } catch (error) {
    console.error('Hammadde giriş geçmişi alma hatası:', error);
    return {
      success: false,
      message: error.message
    };
  } finally {
    connection.release();
  }
}

async function getSarfMalzemeGirisGecmisi(sarfMalzemeId) {
  try {
      const [rows] = await pool.execute(`
          SELECT 
              sg.*,
              sm.birim, /* birim bilgisini sarf_malzemeler tablosundan al */
              u.ad AS kullanici_ad, u.soyad AS kullanici_soyad
          FROM sarf_malzeme_giris_gecmisi sg
          JOIN sarf_malzemeler sm ON sg.sarf_malzeme_id = sm.id
          LEFT JOIN kullanicilar u ON sg.ekleyen_id = u.id
          WHERE sg.sarf_malzeme_id = ?
          ORDER BY sg.giris_tarihi DESC
      `, [sarfMalzemeId]);
      
      return { success: true, girisGecmisi: rows };
  } catch (error) {
      console.error('Sarf malzeme giriş geçmişi getirme hatası:', error);
      return { success: false, message: 'Sarf malzeme giriş geçmişi getirilirken bir hata oluştu.' };
  }
}


async function kaydetHammaddeMalzemeGirisi(girisData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Hammadde bilgilerini al
    const [hammaddeRows] = await connection.execute(
      'SELECT * FROM hammaddeler WHERE id = ?',
      [girisData.hammadde_id]
    );
    
    if (hammaddeRows.length === 0) {
      throw new Error('Hammadde bulunamadı.');
    }
    
    const hammadde = hammaddeRows[0];
    const miktar = parseFloat(girisData.miktar);
    
    // Kullanıcı bilgilerini al
    const [userRows] = await connection.execute(
      'SELECT ad, soyad FROM kullanicilar WHERE id = ?',
      [girisData.ekleyen_id]
    );
    
    const user = userRows.length > 0 ? userRows[0] : null;
    
    // Kullanıcı baş harflerini al
    let userInitials = 'XX'; // Varsayılan
    if (user && user.ad && user.soyad) {
      userInitials = user.ad.charAt(0).toUpperCase() + user.soyad.charAt(0).toUpperCase();
    }
    
    // Şu anki ay ve yılı al (AAYY formatında)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');     // Gün eklendi
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(2);
    const dateCode = day + month + year;  // GGAAYY formatı oluşturuldu

    // Hammadde türüne göre toplam kilo hesapla
    const hammaddeTuru = hammadde.hammadde_turu || 'sac';
    let toplamKilo;
    
    if (hammaddeTuru === 'sac') {
      // Saç için direk miktar kullanılır (miktar zaten kg cinsinden)
      toplamKilo = miktar;
    } else if (hammaddeTuru === 'boru' || hammaddeTuru === 'mil') {
      // Boru ve mil için artık dönüşüm yapmıyoruz, direk girilen miktarı kullanıyoruz
      toplamKilo = miktar;
    } else {
      // Varsayılan olarak miktar kullanılır
      toplamKilo = miktar;
    }
    
    // Toplam ve kalan miktarı güncelle
    const yeniToplamKilo = parseFloat(hammadde.toplam_kilo) + toplamKilo;
    const yeniKalanKilo = parseFloat(hammadde.kalan_kilo) + toplamKilo;
    
    // Kritik seviyeyi güncelle
    // Kritik seviye değerini mutlaka al
    const yeniKritikSeviye = girisData.kritik_seviye;
    
    // BİRİM FİYAT PARA BİRİMİ İŞLEME
    // Birim fiyat para birimini işle - DÜZELTME: Kesin tip kontrolü yap
    let birimFiyatTuru = 'TRY'; // Varsayılan değer
    
    // girisData.birim_fiyat_turu değerini kontrol edelim ve geçerli bir değer varsa kullanalım
    if (girisData.birim_fiyat_turu && 
        typeof girisData.birim_fiyat_turu === 'string' && 
        girisData.birim_fiyat_turu.trim() !== '') {
      birimFiyatTuru = girisData.birim_fiyat_turu.toUpperCase().trim();
      console.log(`Alınan para birimi: ${birimFiyatTuru}`);
    } else {
      console.log('Para birimi belirtilmediği için varsayılan olarak TRY kullanılıyor');
    }
    
    // Tedarikçi bilgisini doğrudan kullan (para birimi bilgisini ekleme)
    const tedarikci = girisData.tedarikci || '';
    
    // Ana barkod değerini al veya varsayılan oluştur
    const anaBarkod = girisData.ana_barkod || 
                     `${hammaddeTuru.toUpperCase()}-${dateCode}-${Math.floor(Math.random() * 1000)}`;
    
    // Hammadde tablosunu güncelle
    await connection.execute(
      `UPDATE hammaddeler SET 
       toplam_kilo = ?, kalan_kilo = ?, kritik_seviye = ?
       WHERE id = ?`,
      [yeniToplamKilo, yeniKalanKilo, yeniKritikSeviye, girisData.hammadde_id]
    );
    
    // Hammadde giriş geçmişine ekle (ana_barkod alanı eklendi)
    const [result] = await connection.execute(
      `INSERT INTO hammadde_giris_gecmisi 
      (hammadde_id, miktar, birim_fiyat, birim_fiyat_turu, tedarikci, ekleyen_id, ana_barkod) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
     [
       girisData.hammadde_id,
       toplamKilo, // miktar değeri yerine hesaplanan toplam kilo değerini kullan
       girisData.birim_fiyat,
       birimFiyatTuru, // Düzeltilmiş para birimi değeri
       tedarikci,
       girisData.ekleyen_id,
       anaBarkod // Ana barkod eklendi
     ]
    );
    
    // Oluşturulan giriş ID'sini al
    const girisId = result.insertId;
    
    // Mevcut parça sayısını al (yeni parçaların numaralandırılması için)
    const [existingPartsCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM parcalar WHERE hammadde_id = ?',
      [girisData.hammadde_id]
    );
    
    const startPartNumberFrom = existingPartsCount[0].count + 1;
    
    // Yeni parçaları oluştur
    if (girisData.plaka_sayisi > 0) {
      console.log(`${girisData.plaka_sayisi} adet parça oluşturuluyor...`);
      
      // ÖNEMLİ DEĞİŞİKLİK: Gerçek plaka ağırlığını hesaplama
      let parcaAgirligi = girisData.plaka_agirligi; // Varsayılan değer
      
      if (hammaddeTuru === 'sac' && girisData.plaka_sayisi > 0) {
        // Eğer gercek_plaka_agirligi gönderilmişse onu kullan
        if (girisData.gercek_plaka_agirligi) {
          parcaAgirligi = girisData.gercek_plaka_agirligi;
        } else {
          // Gönderilmemişse kullanıcının girdiği miktar değerinden hesapla
          parcaAgirligi = miktar / girisData.plaka_sayisi;
        }
        console.log(`Gerçek plaka ağırlığı hesaplandı: ${parcaAgirligi} kg`);
      } else if (hammaddeTuru === 'boru' || hammaddeTuru === 'mil') {
        // Boru ve mil için tek parça ağırlığı = toplam miktar
        parcaAgirligi = miktar;
      }
      
      // Hammadde türüne göre barkod formatını belirle
      for (let i = 0; i < girisData.plaka_sayisi; i++) {
        // BUG FIX: Her parça için doğru index'i kullan
        const partIndex = startPartNumberFrom + i;
        let parcaBarkod;
        
        if (hammaddeTuru === 'sac') {
          // Sac boyut kodunu belirle
          let sizeCode = '7'; // Varsayılan (diğer boyutlar)
          const en = Number(hammadde.en);
          const boy = Number(hammadde.boy);
          
          // Boyutlara göre kod belirle (...)
          
          // BUG FIX: Benzersiz barkod için parça numarasını (partIndex) ekle
          parcaBarkod = `${hammadde.malzeme_adi}${dateCode}-${sizeCode}-${userInitials}-${partIndex}`;
        } else if (hammaddeTuru === 'boru') {
          const capCm = Math.round(Number(hammadde.cap) / 10);
          const uzunlukCm = Math.round(Number(hammadde.uzunluk) / 10);
          // Ana barkod değerini ekle
          parcaBarkod = `${anaBarkod}-P${partIndex}`;
        } else if (hammaddeTuru === 'mil') {
          const capCm = Math.round(Number(hammadde.cap) / 10);
          const uzunlukCm = Math.round(Number(hammadde.uzunluk) / 10);
          // Ana barkod değerini ekle
          parcaBarkod = `${anaBarkod}-P${partIndex}`;
        } else {
          // Diğer türler için genel format
          // Ana barkod değerini ekle
          parcaBarkod = `${anaBarkod}-P${partIndex}`;
        }
        
        // Parçayı veritabanına ekle - ÖNEMLİ: giris_id ve ana_barkod eklendi
        await connection.execute(
          `INSERT INTO parcalar 
           (hammadde_id, hammadde_turu, durum, orijinal_kilo, kalan_kilo, barkod_kodu, giris_id, ekleyen_id, ana_barkod) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            girisData.hammadde_id,
            hammaddeTuru, // Hammadde türünü sakla
            'TAM', // Düzeltildi - 'Aktif' yerine 'TAM' kullanılıyor
            parcaAgirligi, // Parça ağırlığı burada kullanıldı
            parcaAgirligi, // Kalan kilo
            parcaBarkod, // Barkod
            girisId, // Giriş ID'si
            girisData.ekleyen_id, // Ekleyen kullanıcı ID'si
            anaBarkod // Ana barkod değeri
          ]
        );
      }
    }
    
    await connection.commit();
    console.log('Hammadde ve parçalar başarıyla kaydedildi.');
    
    return { 
      success: true, 
      message: 'Hammadde girişi başarıyla kaydedildi.',
      girisId: girisId, // Giriş ID'sini döndür
      ana_barkod: anaBarkod // Ana barkod değerini de döndür
    };
  } catch (error) {
    // Hata durumunda rollback yap
    await connection.rollback();
    console.error('Hammadde girişi kaydetme hatası:', error);
    
    return {
      success: false,
      message: `Hammadde girişi kaydedilirken bir hata oluştu: ${error.message}`
    };
  } finally {
    connection.release();
  }
}

// Fixed kaydetSarfMalzemeGirisi function - removed document references
async function kaydetSarfMalzemeGirisi(girisData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Sarf malzeme bilgilerini al
    const [sarfMalzemeRows] = await connection.execute(
      'SELECT * FROM sarf_malzemeler WHERE id = ?',
      [girisData.sarf_malzeme_id]
    );
    
    if (sarfMalzemeRows.length === 0) {
      throw new Error('Sarf malzeme bulunamadı.');
    }
    
    const sarfMalzeme = sarfMalzemeRows[0];
    
    // Toplam ve kalan miktarı güncelle
    const yeniToplamMiktar = parseFloat(sarfMalzeme.toplam_miktar) + parseFloat(girisData.miktar);
    const yeniKalanMiktar = parseFloat(sarfMalzeme.kalan_miktar) + parseFloat(girisData.miktar);
    
    // Kritik seviyeyi doğrudan alınan değerle güncelle
    const yeniKritikSeviye = girisData.kritik_seviye;
    
    // Tedarikçi ve para birimi bilgisini birleştir
    let tedarikciInfo = girisData.tedarikci || '';
    if (girisData.birim_fiyat_turu) {
      // Eğer para birimi bilgisi varsa, bunu tedarikçi adı ile birleştir
      if (tedarikciInfo && tedarikciInfo.trim() !== '') {
        tedarikciInfo += ` (${girisData.birim_fiyat_turu})`;
      } else {
        // Eğer tedarikçi adı yoksa sadece para birimini ekle
        tedarikciInfo = `(${girisData.birim_fiyat_turu})`;
      }
    }
    
    // Sarf malzeme tablosunu güncelle
    await connection.execute(
      `UPDATE sarf_malzemeler SET 
       toplam_miktar = ?, kalan_miktar = ?, kritik_seviye = ?, tedarikci = ?
       WHERE id = ?`,
      [
        yeniToplamMiktar, 
        yeniKalanMiktar,
        yeniKritikSeviye, // Direkt olarak verilen kritik seviyeyi kullan
        tedarikciInfo,
        girisData.sarf_malzeme_id
      ]
    );
    
    // Sarf malzeme giriş geçmişine ekle
    const [result] = await connection.execute(
      `INSERT INTO sarf_malzeme_giris_gecmisi 
       (sarf_malzeme_id, miktar, birim_fiyat, tedarikci, ekleyen_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        girisData.sarf_malzeme_id,
        girisData.miktar,
        girisData.birim_fiyat,
        tedarikciInfo, // Tedarikçi ve para birimi bilgisi
        girisData.ekleyen_id
      ]
    );
    
    await connection.commit();
    
    return { 
      success: true, 
      message: 'Sarf malzeme girişi başarıyla kaydedildi',
      girisId: result.insertId
    };
  } catch (error) {
    await connection.rollback();
    console.error('Sarf malzeme girişi kaydetme hatası:', error);
    return { success: false, message: 'Sarf malzeme girişi kaydedilirken bir hata oluştu: ' + error.message };
  } finally {
    connection.release();
  }
}


async function addYariMamul(yariMamulData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Mevcut yarı mamul kontrolü
    const existingCheck = await checkYariMamulExists(
      yariMamulData.malzeme_adi, 
      yariMamulData.birim
    );
    
    if (existingCheck.exists) {
      // Eğer zaten varsa, miktarı güncelle
      const existingYariMamul = existingCheck.yariMamul;
      
      // Toplam ve kalan miktarları güncelle
      const yeniToplamMiktar = parseFloat(existingYariMamul.toplam_miktar) + parseFloat(yariMamulData.miktar);
      const yeniKalanMiktar = parseFloat(existingYariMamul.kalan_miktar) + parseFloat(yariMamulData.miktar);
      
      // Güncellenmiş yarı mamülü kaydet
      await connection.execute(
        `UPDATE yari_mamuller 
         SET toplam_miktar = ?, kalan_miktar = ? 
         WHERE id = ?`,
        [
          yeniToplamMiktar, 
          yeniKalanMiktar, 
          existingYariMamul.id
        ]
      );
      
      // Giriş geçmişine kaydet
      await connection.execute(
        `INSERT INTO yari_mamul_giris_gecmisi 
         (yari_mamul_id, miktar, birim, hammadde_id, hammadde_kodu, ekleyen_id) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          existingYariMamul.id,
          yariMamulData.miktar,
          yariMamulData.birim,
          yariMamulData.hammadde_id || null,
          null, // Hammadde kodu yoksa null
          yariMamulData.ekleyen_id
        ]
      );
      
      await connection.commit();
      
      return { 
        success: true, 
        message: 'Mevcut yarı mamüle miktar eklendi.',
        yariMamulId: existingYariMamul.id,
        stokKodu: existingYariMamul.stok_kodu,
        barkod: existingYariMamul.barkod
      };
    }
    
    // Eğer mevcut değilse, yeni yarı mamül oluştur
    const [lastYariMamul] = await connection.execute(
      "SELECT stok_kodu FROM yari_mamuller WHERE stok_kodu REGEXP '^YM[0-9]+$' ORDER BY CAST(SUBSTRING(stok_kodu, 3) AS UNSIGNED) ASC"
    );
    
    let stokKodu = 'YM001'; // Varsayılan olarak YM001'den başla
    
    if (lastYariMamul.length > 0) {
      // Tüm YM kodlarını al ve sırala
      const ymCodes = [];
      for (let i = 0; i < lastYariMamul.length; i++) {
        const code = lastYariMamul[i].stok_kodu;
        const numPart = parseInt(code.substring(2));
        if (!isNaN(numPart)) {
          ymCodes.push(numPart);
        }
      }
      
      // Kodları sırala
      ymCodes.sort((a, b) => a - b);
      
      // Sıradaki boş numarayı bul (1'den başlayarak)
      let nextNum = 1;
      for (let i = 0; i < ymCodes.length; i++) {
        if (ymCodes[i] === nextNum) {
          nextNum++;
        } else if (ymCodes[i] > nextNum) {
          // Eğer atlanmış bir sayı bulduk, onu kullan
          break;
        }
      }
      
      stokKodu = `YM${String(nextNum).padStart(3, '0')}`;
    }
    
    // Kullanıcı bilgilerini al
    const [userRows] = await connection.execute(
      'SELECT ad, soyad FROM kullanicilar WHERE id = ?',
      [yariMamulData.ekleyen_id]
    );
    
    const user = userRows.length > 0 ? userRows[0] : null;
    
    // Kullanıcı baş harflerini al
    let userInitials = 'XX'; // Varsayılan
    if (user && user.ad && user.soyad) {
      userInitials = user.ad.charAt(0).toUpperCase() + user.soyad.charAt(0).toUpperCase();
    }
    
    // Şu anki ay ve yılı al (AAYY formatında)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(2);
    const dateCode = day + month + year;  // GGAAYY formatı oluşturuldu
    
    // Rastgele sayı oluştur (10-99 arası)
    const randomNum = Math.floor(Math.random() * 90) + 10;
    
    // Yarı mamül barkodu oluştur
    const barkod = `YM${dateCode}-${randomNum}-${userInitials}`;
    
    // Yarı mamül veritabanına ekle
    const [result] = await connection.execute(
      `INSERT INTO yari_mamuller 
       (stok_kodu, malzeme_adi, birim, toplam_miktar, kalan_miktar, barkod, hammadde_id, islem_id, kaynak_parca_id, ekleyen_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

      [
        stokKodu,
        yariMamulData.malzeme_adi,
        yariMamulData.birim,
        yariMamulData.miktar,
        yariMamulData.miktar, // Başlangıçta kalan miktar = toplam miktar
        barkod,
        yariMamulData.hammadde_id || null,
        yariMamulData.islem_id || null,
        yariMamulData.kaynak_parca_id || null,
        yariMamulData.ekleyen_id
      ]
    );
    
    const yariMamulId = result.insertId;
    
    // Yarı mamül giriş geçmişi kaydı
    await connection.execute(
      `INSERT INTO yari_mamul_giris_gecmisi 
       (yari_mamul_id, miktar, birim, hammadde_id, hammadde_kodu, ekleyen_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        yariMamulId,
        yariMamulData.miktar,
        yariMamulData.birim,
        yariMamulData.hammadde_id || null,
        null, // Hammadde kodu yoksa null
        yariMamulData.ekleyen_id
      ]
    );
    
    await connection.commit();
    
    return { 
      success: true, 
      message: 'Yarı mamül başarıyla eklendi.',
      yariMamulId: yariMamulId,
      stokKodu: stokKodu,
      barkod: barkod
    };
  } catch (error) {
    await connection.rollback();
    console.error('Yarı mamül ekleme hatası:', error);
    return { success: false, message: 'Yarı mamül eklenirken bir hata oluştu: ' + error.message };
  } finally {
    connection.release();
  }
}


// Tüm yarı mamülleri getir
async function getAllYariMamuller() {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        ym.*,
        CAST(ym.toplam_miktar AS DECIMAL(10,2)) AS toplam_miktar,
        CAST(ym.kalan_miktar AS DECIMAL(10,2)) AS kalan_miktar,
        CASE 
          WHEN CAST(ym.kalan_miktar AS DECIMAL) <= 0 THEN 'STOKTA_YOK'
          WHEN CAST(ym.kalan_miktar AS DECIMAL) <= ym.kritik_seviye THEN 'AZ_KALDI'
          ELSE 'STOKTA_VAR'
        END AS durum
      FROM yari_mamuller ym
      ORDER BY ym.ekleme_tarihi DESC
    `);
    return { success: true, yariMamuller: rows };
  } catch (error) {
    console.error('Yarı mamülleri getirme hatası:', error);
    return { success: false, message: 'Yarı mamüller getirilirken bir hata oluştu.' };
  }
}

// ID'ye göre yarı mamül getir
async function getYariMamulById(id) {
  try {
    const [yariMamulRows] = await pool.execute(
      'SELECT * FROM yari_mamuller WHERE id = ?',
      [id]
    );
    
    if (yariMamulRows.length === 0) {
      return { success: false, message: 'Yarı mamül bulunamadı.' };
    }
    
    const yariMamul = yariMamulRows[0];
    
    // Kullanıcı bilgilerini getir
    const [userRows] = await pool.execute(
      'SELECT ad, soyad, kullanici_adi FROM kullanicilar WHERE id = ?',
      [yariMamul.ekleyen_id]
    );
    
    // İşlem geçmişini getir
    const [islemRows] = await pool.execute(`
      SELECT 
        ymi.*,
        u.ad AS kullanici_ad, u.soyad AS kullanici_soyad,
        p.proje_kodu, p.proje_adi
      FROM yari_mamul_islemleri ymi
      LEFT JOIN kullanicilar u ON ymi.kullanici_id = u.id
      LEFT JOIN projeler p ON ymi.proje_id = p.id
      WHERE ymi.yari_mamul_id = ?
      ORDER BY ymi.islem_tarihi DESC
    `, [id]);
    
    return { 
      success: true, 
      yariMamul: yariMamul,
      ekleyen: userRows.length > 0 ? userRows[0] : null,
      islemler: islemRows
    };
  } catch (error) {
    console.error('Yarı mamül detayı getirme hatası:', error);
    return { success: false, message: 'Yarı mamül detayı getirilirken bir hata oluştu.' };
  }
}


// Yarı mamül işlemi kaydetme
async function addYariMamulIslemi(islemData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Yarı mamül bilgilerini al
    const [yariMamulRows] = await connection.execute(
      'SELECT * FROM yari_mamuller WHERE id = ?',
      [islemData.yari_mamul_id]
    );
    
    if (yariMamulRows.length === 0) {
      throw new Error('Yarı mamül bulunamadı.');
    }
    
    const yariMamul = yariMamulRows[0];
    
    // Sayısal değerleri dönüştür
    const islemMiktar = parseFloat(islemData.miktar);
    const kalanMiktar = parseFloat(yariMamul.kalan_miktar);
    
    // İşlem türü kontrolü ve stok hareketi
    if (islemData.islem_turu === 'Kullanım' || islemData.islem_turu === 'Fire') {
      // Kullanım veya fire işleminde stoktan düşürme
      if (islemMiktar > kalanMiktar) {
        await connection.rollback();
        
        // Daha kullanıcı dostu hata mesajı
        return { 
          success: false, 
          message: `Stok Yetersiz! ⚠️\n
            Ürün: ${yariMamul.malzeme_adi}\n
            Talep Edilen: ${islemMiktar.toFixed(2)} ${yariMamul.birim}\n
            Mevcut Stok: ${kalanMiktar.toFixed(2)} ${yariMamul.birim}\n\n
            Lütfen daha az miktar girin veya stok girişi yapın.`
        };
      }
      
      // İşlemi veritabanına ekle
      const [result] = await connection.execute(
        `INSERT INTO yari_mamul_islemleri 
         (yari_mamul_id, islem_turu, kullanim_alani, miktar, proje_id, kullanici_id, makine, alan_calisan_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          islemData.yari_mamul_id,
          islemData.islem_turu,
          islemData.kullanim_alani,
          islemMiktar,
          islemData.proje_id || null,
          islemData.kullanici_id,
          islemData.makine || null,
          islemData.alan_calisan_id || null
        ]
      );
      
      // Yeni kalan miktarı hesapla (AZALT)
      const yeniKalanMiktar = Math.max(0, kalanMiktar - islemMiktar);
      
      // Veritabanında kalan miktarı güncelle
      await connection.execute(
        'UPDATE yari_mamuller SET kalan_miktar = ? WHERE id = ?',
        [yeniKalanMiktar, islemData.yari_mamul_id]
      );
      
      await connection.commit();
      return { 
        success: true, 
        message: 'İşlem başarıyla kaydedildi.',
        islemId: result.insertId
      };
    } 
    else if (islemData.islem_turu === 'İade' || islemData.islem_turu === 'Ek') {
      // İade veya ek işleminde stok artışı
      
      // İşlemi veritabanına ekle
      const [result] = await connection.execute(
        `INSERT INTO yari_mamul_islemleri 
         (yari_mamul_id, islem_turu, kullanim_alani, miktar, proje_id, kullanici_id, makine, alan_calisan_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          islemData.yari_mamul_id,
          islemData.islem_turu,
          islemData.kullanim_alani,
          islemMiktar,
          islemData.proje_id || null,
          islemData.kullanici_id,
          islemData.makine || null,
          islemData.alan_calisan_id || null
        ]
      );
      
      // Yeni kalan miktarı hesapla (ARTIR)
      const yeniKalanMiktar = kalanMiktar + islemMiktar;
      const yeniToplamMiktar = parseFloat(yariMamul.toplam_miktar) + islemMiktar;
      
      // Veritabanında güncelleme yap
      await connection.execute(
        'UPDATE yari_mamuller SET kalan_miktar = ?, toplam_miktar = ? WHERE id = ?',
        [yeniKalanMiktar, yeniToplamMiktar, islemData.yari_mamul_id]
      );
      
      await connection.commit();
      return { 
        success: true, 
        message: 'İşlem başarıyla kaydedildi.',
        islemId: result.insertId
      };
    }
    
    await connection.rollback();
    return { success: false, message: 'Geçersiz işlem türü.' };
  } catch (error) {
    await connection.rollback();
    console.error('Yarı mamül işlemi kaydetme hatası:', error);
    return { success: false, message: 'İşlem kaydedilirken bir hata oluştu: ' + error.message };
  } finally {
    connection.release();
  }
}



/**
 * Yarı mamulü ve ilişkili kayıtları siler, bildirim e-postası gönderir
 * @param {number} id - Yarı mamul ID
 * @param {string} reason - Silme nedeni
 * @param {Object} userData - Kullanıcı bilgileri
 * @returns {Promise<Object>} İşlem sonucu
 */
async function deleteYariMamulWithNotification(id, reason, userData) {
  const connection = await pool.getConnection();
  
  try {
    // Yarı mamul bilgilerini al
    const [yariMamulInfo] = await connection.execute(
      'SELECT * FROM yari_mamuller WHERE id = ?',
      [id]
    );
    
    if (yariMamulInfo.length === 0) {
      return { success: false, message: 'Yarı mamul bulunamadı.' };
    }
    
    const yariMamul = yariMamulInfo[0];
    
    // İkincil stok kontrolü kaldırıldı
    
    // Transaction başlat
    await connection.beginTransaction();
    
    // İkincil stok silme işlemleri kaldırıldı
    
    // 1. İlgili tüm yarı mamul işlemlerini sil
    await connection.execute(
      'DELETE FROM yari_mamul_islemleri WHERE yari_mamul_id = ?',
      [id]
    );
    
    // 2. Yarı mamul giriş geçmişini sil (varsa)
    try {
      await connection.execute(
        'DELETE FROM yari_mamul_giris_gecmisi WHERE yari_mamul_id = ?',
        [id]
      );
    } catch (e) {
      console.warn('Yarı mamul giriş geçmişi tablosu bulunamadı veya silinirken hata oluştu:', e);
      // Bu hata işlemi durdurmaz
    }
    
    // 3. Yarı mamul kaydını sil
    await connection.execute(
      'DELETE FROM yari_mamuller WHERE id = ?',
      [id]
    );
    
    // İşlemi tamamla
    await connection.commit();
    
    // E-posta gönder
    try {
      if (typeof emailService !== 'undefined' && emailService) {
        const deleteInfo = {
          itemType: 'Yarı Mamul',
          itemName: `${yariMamul.malzeme_adi} (${yariMamul.stok_kodu || 'Kod Yok'})`,
          itemId: id,
          reason: reason,
          user: `${userData.ad} ${userData.soyad} (${userData.kullanici_adi})`,
          timestamp: new Date().toLocaleString('tr-TR')
        };
        
        // İkincil stok bilgisi kaldırıldı
        
        await emailService.sendDeleteNotification(deleteInfo);
      }
    } catch (emailError) {
      console.error('Bildirim e-postası gönderimi sırasında hata:', emailError);
      // E-posta hatası işlemi engellemez
    }
    
    return { 
      success: true, 
      message: 'Yarı mamul ve ilişkili tüm işlemler başarıyla silindi.' 
    };
  } catch (error) {
    await connection.rollback();
    console.error('Yarı mamul silme hatası:', error);
    return { 
      success: false, 
      message: 'Yarı mamul silinirken bir hata oluştu: ' + error.message 
    };
  } finally {
    connection.release();
  }
}


async function getYariMamulIslemleri(yariMamulId) {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        ymi.*,
        u.ad AS kullanici_ad, u.soyad AS kullanici_soyad,
        p.proje_kodu, p.proje_adi,
        c.ad AS calisan_ad, c.soyad AS calisan_soyad
      FROM yari_mamul_islemleri ymi
      LEFT JOIN kullanicilar u ON ymi.kullanici_id = u.id
      LEFT JOIN projeler p ON ymi.proje_id = p.id
      LEFT JOIN calisanlar c ON ymi.alan_calisan_id = c.id
      WHERE ymi.yari_mamul_id = ?
      ORDER BY ymi.islem_tarihi DESC
    `, [yariMamulId]);
    
    return { success: true, islemler: rows };
  } catch (error) {
    console.error('Yarı mamul işlemlerini getirme hatası:', error);
    return { success: false, message: 'İşlemler getirilirken bir hata oluştu.' };
  }
}

// Yarı mamul işlem detayını getir
async function getYariMamulIslemById(islemId) {
  try {
    const [rows] = await pool.execute(`
      SELECT ymi.*, 
        p.proje_kodu, p.proje_adi,
        u.ad AS kullanici_ad, u.soyad AS kullanici_soyad
      FROM yari_mamul_islemleri ymi
      JOIN kullanicilar u ON ymi.kullanici_id = u.id
      LEFT JOIN projeler p ON ymi.proje_id = p.id
      WHERE ymi.id = ?
    `, [islemId]);
    
    if (rows.length === 0) {
      return { success: false, message: 'İşlem bulunamadı.' };
    }
    
    return { success: true, islem: rows[0] };
  } catch (error) {
    console.error('Yarı mamul işlem bilgisi getirme hatası:', error);
    return { success: false, message: 'İşlem bilgisi getirilirken bir hata oluştu.' };
  }
}

async function updateYariMamulIslem(islemId, islemData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // İlk olarak mevcut işlem verilerini al
    const [currentIslem] = await connection.execute(
      `SELECT islem_turu, yari_mamul_id, miktar, kullanici_id FROM yari_mamul_islemleri WHERE id = ?`,
      [islemId]
    );
    
    if (currentIslem.length === 0) {
      throw new Error('İşlem bulunamadı.');
    }
    
    const islemInfo = currentIslem[0];
    
    // Yarı mamul bilgilerini al
    const [yariMamulRows] = await connection.execute(
      'SELECT kalan_miktar FROM yari_mamuller WHERE id = ?',
      [islemInfo.yari_mamul_id]
    );
    
    if (yariMamulRows.length === 0) {
      throw new Error('Yarı mamul bulunamadı.');
    }
    
    const yariMamul = yariMamulRows[0];
    
    // İşlem türünü koru
    const islemTuru = islemData.islem_turu || islemInfo.islem_turu;
    
    // İşlemi güncelle
    await connection.execute(
      `UPDATE yari_mamul_islemleri SET 
       islem_turu = ?, kullanim_alani = ?, proje_id = ?, iskarta_urun = ?
       WHERE id = ?`,
      [
        islemTuru,
        islemData.kullanim_alani || islemInfo.kullanim_alani,
        islemData.proje_id || null,
        islemData.iskarta_urun ? 1 : 0,
        islemId
      ]
    );
    
    // Orjinal stoğa geri yükleme işlemi
    if (islemData.stoga_geri_yukle && islemData.geri_yukle_miktar > 0) {
      const geriYukleMiktar = parseFloat(islemData.geri_yukle_miktar);
      const islemMiktar = parseFloat(islemInfo.miktar);
      
      // Geri yükleme miktarını doğrula
     if (geriYukleMiktar > islemMiktar) {
  return { 
    success: false, 
    message: `Geri yükleme miktarı (${geriYukleMiktar}) işlem miktarından (${islemMiktar}) büyük olamaz.` 
  };
}
      
      // Yarı mamul kalan miktarını güncelle
      const yeniKalanMiktar = parseFloat(yariMamul.kalan_miktar) + geriYukleMiktar;
      
      console.log(`Yarı mamul stoğa geri yükleniyor: Eski miktar=${yariMamul.kalan_miktar}, Geri yüklenen=${geriYukleMiktar}, Yeni miktar=${yeniKalanMiktar}`);
      
      await connection.execute(
        'UPDATE yari_mamuller SET kalan_miktar = ? WHERE id = ?',
        [yeniKalanMiktar, islemInfo.yari_mamul_id]
      );
      
      // İade işlemini kaydet
      await connection.execute(
        `INSERT INTO yari_mamul_islemleri (
          yari_mamul_id, islem_turu, kullanim_alani, miktar, kullanici_id
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          islemInfo.yari_mamul_id,
          'İade',
          'StokGeriYukleme',
          geriYukleMiktar,
          islemInfo.kullanici_id || 1,
          `İşlem #${islemId} den stoğa geri dönen miktar`
        ]
      );
    }
    
    await connection.commit();
    return { 
      success: true, 
      message: islemData.stoga_geri_yukle ? 
        `İşlem güncellendi ve ${islemData.geri_yukle_miktar} birim orjinal stoğa geri yüklendi.` : 
        'İşlem başarıyla güncellendi.' 
    };
  } catch (error) {
    await connection.rollback();
    console.error('Yarı mamul işlemi güncelleme hatası:', error);
    return { success: false, message: 'İşlem güncellenirken bir hata oluştu: ' + error.message };
  } finally {
    connection.release();
  }
}



async function getAllTedarikci() {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM tedarikci ORDER BY tedarikci_adi ASC'
    );
    return { success: true, tedarikci: rows };
  } catch (error) {
    console.error('Tedarikci getirme hatası:', error);
    return { success: false, message: 'Tedarikci bilgileri getirilirken bir hata oluştu.' };
  }
}

// Add a new supplier
async function addTedarikci(tedarikciData) {
  try {
    // Check if supplier with the same name already exists
    const [existingRows] = await pool.execute(
      'SELECT * FROM tedarikci WHERE tedarikci_adi = ?',
      [tedarikciData.tedarikci_adi]
    );
    
    if (existingRows.length > 0) {
      return { 
        success: false, 
        message: 'Bu tedarikçi zaten mevcut.', 
        tedarikciId: existingRows[0].id 
      };
    }
    
    // Add the new supplier
    const [result] = await pool.execute(
      'INSERT INTO tedarikci (tedarikci_adi) VALUES (?)',
      [tedarikciData.tedarikci_adi]
    );
    
    return { 
      success: true, 
      message: 'Tedarikçi başarıyla eklendi.',
      tedarikciId: result.insertId
    };
  } catch (error) {
    console.error('Tedarikci ekleme hatası:', error);
    return { success: false, message: 'Tedarikci eklenirken bir hata oluştu.' };
  }
}

// Delete a supplier
async function deleteTedarikci(id) {
  try {
    // Check if supplier is used in hammadde_giris_gecmisi or sarf_malzeme_giris_gecmisi
    const [hammaddeUsage] = await pool.execute(
      'SELECT COUNT(*) as count FROM hammadde_giris_gecmisi WHERE tedarikci = (SELECT tedarikci_adi FROM tedarikci WHERE id = ?)',
      [id]
    );
    
    const [sarfMalzemeUsage] = await pool.execute(
      'SELECT COUNT(*) as count FROM sarf_malzeme_giris_gecmisi WHERE tedarikci LIKE CONCAT("%", (SELECT tedarikci_adi FROM tedarikci WHERE id = ?), "%")',
      [id]
    );
    
    if (hammaddeUsage[0].count > 0 || sarfMalzemeUsage[0].count > 0) {
      return { 
        success: false, 
        message: 'Bu tedarikçi kullanımda olduğu için silinemez.' 
      };
    }
    
    // Delete the supplier if not used
    await pool.execute(
      'DELETE FROM tedarikci WHERE id = ?',
      [id]
    );
    
    return { success: true, message: 'Tedarikçi başarıyla silindi.' };
  } catch (error) {
    console.error('Tedarikci silme hatası:', error);
    return { success: false, message: 'Tedarikci silinirken bir hata oluştu.' };
  }
}



async function checkYariMamulExists(malzemeAdi, birim) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM yari_mamuller WHERE malzeme_adi = ? AND birim = ?',
      [malzemeAdi, birim]
    );
    
    return { 
      success: true, 
      exists: rows.length > 0,
      yariMamul: rows.length > 0 ? rows[0] : null
    };
  } catch (error) {
    console.error('Yarı mamul kontrolü hatası:', error);
    return { success: false, message: 'Yarı mamul kontrolü sırasında bir hata oluştu.' };
  }
}


// Get Yarı Mamul entry history
async function getYariMamulGirisGecmisi(yariMamulId) {
  try {
    // Create the table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS yari_mamul_giris_gecmisi (
        id INT PRIMARY KEY AUTO_INCREMENT,
        yari_mamul_id INT NOT NULL,
        miktar DECIMAL(10,2) NOT NULL,
        birim VARCHAR(20) NOT NULL,
        hammadde_id INT DEFAULT NULL,
        hammadde_kodu VARCHAR(20) DEFAULT NULL,
        ekleyen_id INT NOT NULL,
        giris_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (yari_mamul_id) REFERENCES yari_mamuller(id),
        FOREIGN KEY (ekleyen_id) REFERENCES kullanicilar(id)
      )
    `);
    
    // Query the entry history
    const [rows] = await pool.execute(`
      SELECT 
        yg.*,
        u.ad AS kullanici_ad, u.soyad AS kullanici_soyad
      FROM yari_mamul_giris_gecmisi yg
      LEFT JOIN kullanicilar u ON yg.ekleyen_id = u.id
      WHERE yg.yari_mamul_id = ?
      ORDER BY yg.giris_tarihi DESC
    `, [yariMamulId]);
    
    return { success: true, girisGecmisi: rows };
  } catch (error) {
    console.error('Yarı mamul giriş geçmişi getirme hatası:', error);
    return { success: false, message: 'Yarı mamul giriş geçmişi getirilirken bir hata oluştu.' };
  }
}

// Save Yarı Mamul entry
async function kaydetYariMamulGirisi(girisData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get Yarı Mamul information
    const [yariMamulRows] = await connection.execute(
      'SELECT * FROM yari_mamuller WHERE id = ?',
      [girisData.yari_mamul_id]
    );
    
    if (yariMamulRows.length === 0) {
      throw new Error('Yarı mamul bulunamadı.');
    }
    
    const yariMamul = yariMamulRows[0];
    
    // Calculate new totals
    const yeniToplamMiktar = parseFloat(yariMamul.toplam_miktar) + parseFloat(girisData.miktar);
    const yeniKalanMiktar = parseFloat(yariMamul.kalan_miktar) + parseFloat(girisData.miktar);
    
    // Update kritik_seviye if provided
    const yeniKritikSeviye = girisData.kritik_seviye !== undefined ? 
                             girisData.kritik_seviye : 
                             yariMamul.kritik_seviye;
    
    // Update Yarı Mamul table
    await connection.execute(
      `UPDATE yari_mamuller SET 
       toplam_miktar = ?, kalan_miktar = ?, kritik_seviye = ?
       WHERE id = ?`,
      [
        yeniToplamMiktar, 
        yeniKalanMiktar,
        yeniKritikSeviye,
        girisData.yari_mamul_id
      ]
    );
    
    // Add to entry history
    const [result] = await connection.execute(
      `INSERT INTO yari_mamul_giris_gecmisi 
       (yari_mamul_id, miktar, birim, hammadde_id, hammadde_kodu, ekleyen_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        girisData.yari_mamul_id,
        girisData.miktar,
        girisData.birim,
        girisData.hammadde_id || null,
        girisData.hammadde_kodu || null,
        girisData.ekleyen_id
      ]
    );
    
    await connection.commit();
    
    return { 
      success: true, 
      message: 'Yarı mamul girişi başarıyla kaydedildi',
      girisId: result.insertId
    };
  } catch (error) {
    await connection.rollback();
    console.error('Yarı mamul girişi kaydetme hatası:', error);
    return { success: false, message: 'Yarı mamul girişi kaydedilirken bir hata oluştu: ' + error.message };
  } finally {
    connection.release();
  }
}

// Sarf malzeme giriş detaylarını getiren fonksiyon
async function getSarfMalzemeGirisById(girisId) {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        sg.*,
        u.ad AS kullanici_ad, u.soyad AS kullanici_soyad
      FROM sarf_malzeme_giris_gecmisi sg
      LEFT JOIN kullanicilar u ON sg.ekleyen_id = u.id
      WHERE sg.id = ?
    `, [girisId]);
    
    if (rows.length === 0) {
      return { success: false, message: 'Sarf malzeme girişi bulunamadı.' };
    }
    
    return { success: true, giris: rows[0] };
  } catch (error) {
    console.error('Sarf malzeme giriş detayı getirme hatası:', error);
    return { success: false, message: 'Giriş detayı getirilirken bir hata oluştu.' };
  }
}




async function updateSarfMalzemeGirisi(guncelleData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Önce giriş kaydını al
    const [girisRows] = await connection.execute(
      'SELECT * FROM sarf_malzeme_giris_gecmisi WHERE id = ?',
      [guncelleData.giris_id]
    );
    
    if (girisRows.length === 0) {
      throw new Error('Giriş kaydı bulunamadı.');
    }
    
    const giris = girisRows[0];
    const eskiMiktar = parseFloat(giris.miktar);
    const yeniMiktar = parseFloat(guncelleData.yeni_miktar);
    const fark = yeniMiktar - eskiMiktar; // Pozitif ise artış, negatif ise azalış
    
    // Sarf malzeme bilgilerini al
    const [sarfMalzemeRows] = await connection.execute(
      'SELECT * FROM sarf_malzemeler WHERE id = ?',
      [guncelleData.sarf_malzeme_id]
    );
    
    if (sarfMalzemeRows.length === 0) {
      throw new Error('Sarf malzeme bulunamadı.');
    }
    
    const sarfMalzeme = sarfMalzemeRows[0];
    
    // Son giriş ve sonrasında işlem olup olmadığını kontrol et
   // updateSarfMalzemeGirisi fonksiyonunda:
// Doğru giriş sıralaması için milisaniye duyarlı karşılaştırma
const [girislerRows] = await connection.execute(
  'SELECT * FROM sarf_malzeme_giris_gecmisi WHERE sarf_malzeme_id = ? ORDER BY giris_tarihi DESC, id DESC',
  [guncelleData.sarf_malzeme_id]
);

// Daha sonra kontrol:
if (girislerRows.length > 0) {
  console.log("Son giriş ID:", girislerRows[0].id);
  console.log("Güncellenecek giriş ID:", parseInt(guncelleData.giris_id));
  
  // Tür dönüşümü yaparak kontrol et
  if (parseInt(girislerRows[0].id) !== parseInt(guncelleData.giris_id)) {
    throw new Error('Sadece son girişi güncelleyebilirsiniz.');
  }
}
    
    // Son girişten sonra işlem yapılmış mı kontrol et
    const sonGirisTarihi = new Date(giris.giris_tarihi);
    
    const [islemlerRows] = await connection.execute(
      'SELECT * FROM sarf_malzeme_islemleri WHERE sarf_malzeme_id = ? AND islem_tarihi > ? ORDER BY islem_tarihi ASC',
      [guncelleData.sarf_malzeme_id, sonGirisTarihi]
    );
    
    if (islemlerRows.length > 0) {
      throw new Error('Bu girişten sonra işlem yapıldığı için güncelleme yapılamaz.');
    }
    
    // Tedarikçi ve para birimi bilgisini birleştir
    let tedarikciInfo = guncelleData.tedarikci || '';
    if (guncelleData.birim_fiyat_turu) {
      // Eğer para birimi bilgisi varsa, bunu tedarikçi adı ile birleştir
      if (tedarikciInfo && tedarikciInfo.trim() !== '') {
        tedarikciInfo += ` (${guncelleData.birim_fiyat_turu})`;
      } else {
        // Eğer tedarikçi adı yoksa sadece para birimini ekle
        tedarikciInfo = `(${guncelleData.birim_fiyat_turu})`;
      }
    }
    
    // Giriş kaydını güncelle
    await connection.execute(
      'UPDATE sarf_malzeme_giris_gecmisi SET miktar = ?, birim_fiyat = ?, tedarikci = ? WHERE id = ?',
      [
        yeniMiktar, 
        guncelleData.birim_fiyat || 0, 
        tedarikciInfo, 
        guncelleData.giris_id
      ]
    );
    
    // Toplam ve kalan miktarları güncelle
    const yeniToplamMiktar = parseFloat(sarfMalzeme.toplam_miktar) + fark;
    const yeniKalanMiktar = parseFloat(sarfMalzeme.kalan_miktar) + fark;
    
    // Sarf malzeme tablosunu güncelle - tedarikçi ve kritik seviye bilgilerini de güncelle
    await connection.execute(
      'UPDATE sarf_malzemeler SET toplam_miktar = ?, kalan_miktar = ?, kritik_seviye = ?, tedarikci = ? WHERE id = ?',
      [
        yeniToplamMiktar, 
        yeniKalanMiktar, 
        guncelleData.kritik_seviye || sarfMalzeme.kritik_seviye, 
        tedarikciInfo, 
        guncelleData.sarf_malzeme_id
      ]
    );
    
    await connection.commit();
    
    return { 
      success: true, 
      message: 'Sarf malzeme girişi başarıyla güncellendi.',
      yeniToplamMiktar,
      yeniKalanMiktar,
      fark
    };
  } catch (error) {
    await connection.rollback();
    console.error('Sarf malzeme girişi güncelleme hatası:', error);
    return { success: false, message: 'Sarf malzeme girişi güncellenirken bir hata oluştu: ' + error.message };
  } finally {
    connection.release();
  }
}



async function getHammaddeGirisById(girisId) {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        hg.*,
        u.ad AS kullanici_ad, u.soyad AS kullanici_soyad
      FROM hammadde_giris_gecmisi hg
      LEFT JOIN kullanicilar u ON hg.ekleyen_id = u.id
      WHERE hg.id = ?
    `, [girisId]);
    
    if (rows.length === 0) {
      return { success: false, message: 'Hammadde girişi bulunamadı.' };
    }
    
    return { success: true, giris: rows[0] };
  } catch (error) {
    console.error('Hammadde giriş detayı getirme hatası:', error);
    return { success: false, message: 'Giriş detayı getirilirken bir hata oluştu.' };
  }
}

async function updateHammaddeMalzemeGirisi(guncelleData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Önce giriş kaydını al
    const [girisRows] = await connection.execute(
      'SELECT * FROM hammadde_giris_gecmisi WHERE id = ?',
      [guncelleData.giris_id]
    );
    
    if (girisRows.length === 0) {
      throw new Error('Giriş kaydı bulunamadı.');
    }
    
    const giris = girisRows[0];
    const eskiMiktar = parseFloat(giris.miktar);
    const yeniMiktar = parseFloat(guncelleData.yeni_miktar);
    
    // Hammadde bilgilerini al
    const [hammaddeRows] = await connection.execute(
      'SELECT * FROM hammaddeler WHERE id = ?',
      [guncelleData.hammadde_id]
    );
    
    if (hammaddeRows.length === 0) {
      throw new Error('Hammadde bulunamadı.');
    }
    
    const hammadde = hammaddeRows[0];
    const hammaddeTuru = hammadde.hammadde_turu || 'sac';
    
    // Son giriş ve sonrasında işlem olup olmadığını kontrol et
    const [girislerRows] = await connection.execute(
      'SELECT * FROM hammadde_giris_gecmisi WHERE hammadde_id = ? ORDER BY giris_tarihi DESC',
      [guncelleData.hammadde_id]
    );
    
    // Son giriş bu değilse güncellemeye izin verme
    if (girislerRows.length > 0 && girislerRows[0].id !== parseInt(guncelleData.giris_id)) {
      throw new Error('Sadece son girişi güncelleyebilirsiniz.');
    }
    
    // Son girişten sonra işlem yapılmış mı kontrol et
    const sonGirisTarihi = new Date(giris.giris_tarihi);
    
    const [islemlerRows] = await connection.execute(
      `SELECT p.id as parca_id, i.* FROM parcalar p 
       JOIN islemler i ON p.id = i.parca_id 
       WHERE p.hammadde_id = ? AND i.islem_tarihi > ? ORDER BY i.islem_tarihi ASC`,
      [guncelleData.hammadde_id, sonGirisTarihi]
    );
    
    if (islemlerRows.length > 0) {
      throw new Error('Bu girişten sonra işlem yapıldığı için güncellenemez.');
    }
    
    // Birim fiyat para birimi
    const birimFiyatTuru = guncelleData.birim_fiyat_turu || 'TRY';
    
    // Tedarikçi bilgisini doğrudan kullan (para birimi bilgisini ekleme)
    const tedarikci = guncelleData.tedarikci || '';
    
    // Ana barkod değerini al
    const anaBarkod = guncelleData.ana_barkod || giris.ana_barkod || '';
    
    // Kullanıcı bilgilerini al
    let userInitials = 'XX'; // Varsayılan
    if (guncelleData.ekleyen_id) {
      const [userRows] = await connection.execute(
        'SELECT ad, soyad FROM kullanicilar WHERE id = ?',
        [guncelleData.ekleyen_id]
      );
      
      const user = userRows.length > 0 ? userRows[0] : null;
      if (user && user.ad && user.soyad) {
        userInitials = user.ad.charAt(0).toUpperCase() + user.soyad.charAt(0).toUpperCase();
      }
    } else if (giris.ekleyen_id) {
      // Eğer güncelleme verisinde ekleyen_id yoksa, orijinal girişten al
      const [userRows] = await connection.execute(
        'SELECT ad, soyad FROM kullanicilar WHERE id = ?',
        [giris.ekleyen_id]
      );
      
      const user = userRows.length > 0 ? userRows[0] : null;
      if (user && user.ad && user.soyad) {
        userInitials = user.ad.charAt(0).toUpperCase() + user.soyad.charAt(0).toUpperCase();
      }
    }
    
    // Hammadde türüne göre güncelleme
    if (hammaddeTuru === 'sac') {
      // Sac için toleranslı güncelleme
      // ...
    } else if (hammaddeTuru === 'boru' || hammaddeTuru === 'mil') {
      // ...
    }
    
    // Giriş kaydını güncelle - ana_barkod alanını da ekleyerek
    await connection.execute(
      `UPDATE hammadde_giris_gecmisi 
       SET miktar = ?, birim_fiyat = ?, birim_fiyat_turu = ?, 
           tedarikci = ?, ana_barkod = ? 
       WHERE id = ?`,
      [
        yeniMiktar, 
        guncelleData.birim_fiyat || 0,
        birimFiyatTuru,
        tedarikci,
        anaBarkod, // Ana barkod değeri
        guncelleData.giris_id
      ]
    );
    
    // ... (devamı değişmiyor)
    
    await connection.commit();
    
    return { 
      success: true, 
      message: 'Hammadde girişi başarıyla güncellendi.'
    };
  } catch (error) {
    await connection.rollback();
    console.error('Hammadde girişi güncelleme hatası:', error);
    return { 
      success: false, 
      message: error.message 
    };
  } finally {
    connection.release();
  }
}

// Boru ağırlığı hesaplama yardımcı fonksiyonu
function calculateBoruWeight(boruData) {
  // Değerleri al
  const cap = parseFloat(boruData.cap); // mm
  const kalinlik = parseFloat(boruData.kalinlik); // mm
  const uzunluk = parseFloat(boruData.uzunluk); // mm
  const yogunluk = parseFloat(boruData.yogunluk); // kg/m³
  
  // İç çapı hesapla
  const icCap = cap - (2 * kalinlik);
  
  // Yarıçapları m cinsinden hesapla
  const disYaricap = cap / 2000; // mm'den m'ye çevir
  const icYaricap = icCap / 2000; // mm'den m'ye çevir
  
  // Uzunluğu m'ye çevir
  const uzunlukMetre = uzunluk / 1000;
  
  // Hacim hesapla (m³)
  const disHacim = Math.PI * Math.pow(disYaricap, 2) * uzunlukMetre;
  const icHacim = Math.PI * Math.pow(icYaricap, 2) * uzunlukMetre;
  const boruHacim = disHacim - icHacim;
  
  // Ağırlık hesapla (kg)
  const boruAgirligi = boruHacim * yogunluk;
  
  return boruAgirligi;
}

// Mil ağırlığı hesaplama fonksiyonu
function calculateMilWeight(milData) {
  // Değerleri al
  const cap = parseFloat(milData.cap); // mm
  const uzunluk = parseFloat(milData.uzunluk); // mm
  const yogunluk = parseFloat(milData.yogunluk); // kg/m³
  
  // Yarıçapı m cinsinden hesapla
  const yaricap = cap / 2000; // mm'den m'ye çevir
  
  // Uzunluğu m'ye çevir
  const uzunlukMetre = uzunluk / 1000;
  
  // Hacim hesapla (m³)
  const milHacim = Math.PI * Math.pow(yaricap, 2) * uzunlukMetre;
  
  // Ağırlık hesapla (kg)
  const milAgirligi = milHacim * yogunluk;
  
  return milAgirligi;
}



// Hammadde işlemi silme ve stok geri alma fonksiyonu için düzeltme
async function deleteHammaddeIslemAndRestoreStock(deleteData) {
  const connection = await pool.getConnection();
  
  try {
    console.log('Starting operation with data:', deleteData);
    await connection.beginTransaction();
    
    // STEP 1: Get the islem (operation) details
    console.log('STEP 1: Getting islem details');
    const islemId = deleteData.islemId;
    
    // Using raw queries to check exactly what we have in the database
    const [islemRows] = await connection.query('SELECT * FROM islemler WHERE id = ?', [islemId]);
    
    if (!islemRows || islemRows.length === 0) {
      throw new Error(`İşlem bulunamadı (ID: ${islemId})`);
    }
    
    const islem = islemRows[0];
    console.log('Retrieved islem:', islem);
    
    // IMPORTANT: Extract values we need
    const parcaId = islem.parca_id;
    const kullanilanMiktar = Number(islem.kullanilanMiktar);
    const hurdaMiktar = Number(islem.hurdaMiktar);
    const toplamMiktar = kullanilanMiktar + hurdaMiktar;
    const yariMamulAdi = islem.yari_mamul_adi;
    const yariMamulMiktar = Number(islem.yari_mamul_miktar);
    const kullaniciId = islem.kullanici_id; // Use the actual user ID from the original operation
    
    console.log(`Raw value check - kullanilanMiktar:`, islem.kullanilanMiktar);
    console.log(`Raw value check - hurdaMiktar:`, islem.hurdaMiktar);
    console.log(`Raw value check - yari_mamul_adi:`, islem.yari_mamul_adi);
    console.log(`Raw value check - yari_mamul_miktar:`, islem.yari_mamul_miktar);
    
    console.log(`Extracted values: parcaId=${parcaId}, kullanilanMiktar=${kullanilanMiktar}, hurdaMiktar=${hurdaMiktar}`);
    console.log(`Extracted values: yariMamulAdi=${yariMamulAdi}, yariMamulMiktar=${yariMamulMiktar}`);
    
    // STEP 2: Get parca details using destructuring
    console.log('STEP 2: Getting parca details');
    const [parcaRows] = await connection.query('SELECT * FROM parcalar WHERE id = ?', [parcaId]);
    
    if (!parcaRows || parcaRows.length === 0) {
      throw new Error(`Parça bulunamadı (ID: ${parcaId})`);
    }
    
    const parca = parcaRows[0];
    console.log('Retrieved parca:', parca);
    
    const hammaddeId = parca.hammadde_id;
    const orijinalKilo = Number(parca.orijinal_kilo);
    const currentKalanKilo = Number(parca.kalan_kilo);
    
    // STEP 3: Calculate new values
    console.log('STEP 3: Calculating new values');
    const newKalanKilo = currentKalanKilo + toplamMiktar;
    let newDurum = 'TUKENDI';
    
    if (newKalanKilo >= orijinalKilo) {
      newDurum = 'TAM';
    } else if (newKalanKilo > 0) {
      newDurum = 'KISMEN_KULLANILDI';
    }
    
    // Calculate new usage percentage
    let newKullanimOrani = 0;
    if (orijinalKilo > 0) {
      newKullanimOrani = ((orijinalKilo - newKalanKilo) / orijinalKilo) * 100;
      if (newKullanimOrani < 0) newKullanimOrani = 0;
      if (newKullanimOrani > 100) newKullanimOrani = 100;
    }
    
    console.log(`New values: kalanKilo=${newKalanKilo}, durum=${newDurum}, kullanimOrani=${newKullanimOrani}`);
    
    // STEP 4: Update parca
    console.log('STEP 4: Updating parca');
    const [parcaUpdateResult] = await connection.query(
      'UPDATE parcalar SET kalan_kilo = ?, kullanim_orani = ?, durum = ? WHERE id = ?',
      [newKalanKilo, newKullanimOrani, newDurum, parcaId]
    );
    
    console.log('Parca update result:', parcaUpdateResult);
    
    // STEP 5: Update hammadde
    console.log('STEP 5: Updating hammadde');
    const [hammaddeUpdateResult] = await connection.query(
      'UPDATE hammaddeler SET kalan_kilo = kalan_kilo + ? WHERE id = ?',
      [toplamMiktar, hammaddeId]
    );
    
    console.log('Hammadde update result:', hammaddeUpdateResult);
    
    // STEP 6: Handle yari_mamul
    if (yariMamulAdi && yariMamulMiktar > 0) {
      console.log('STEP 6: Handling yari_mamul');
      console.log(`Looking for yari_mamul with name: "${yariMamulAdi}"`);
      
      // Search by exact name
      const [yariMamulRows] = await connection.query(
        'SELECT * FROM yari_mamuller WHERE malzeme_adi = ?', 
        [yariMamulAdi]
      );
      
      // If not found by exact name, try partial match
      let yariMamul = null;
      
      if (yariMamulRows && yariMamulRows.length > 0) {
        console.log('Found yari_mamul by exact name');
        yariMamul = yariMamulRows[0];
      } else {
        console.log('Exact match not found, trying partial match');
        
        // Try partial match
        const [partialRows] = await connection.query(
          'SELECT * FROM yari_mamuller WHERE malzeme_adi LIKE ?', 
          [`%${yariMamulAdi}%`]
        );
        
        if (partialRows && partialRows.length > 0) {
          console.log(`Found ${partialRows.length} partial matches`);
          yariMamul = partialRows[0]; // Use the first match
        }
      }
      
      if (yariMamul) {
        console.log('Working with yari_mamul:', yariMamul);
        
        const yariMamulId = yariMamul.id;
        const currentToplam = Number(yariMamul.toplam_miktar);
        const currentKalan = Number(yariMamul.kalan_miktar);
        
        // Calculate new amounts
        const newToplam = Math.max(0, currentToplam - yariMamulMiktar);
        const newKalan = Math.max(0, currentKalan - yariMamulMiktar);
        
        console.log(`Updating yari_mamul: toplam ${currentToplam} -> ${newToplam}, kalan ${currentKalan} -> ${newKalan}`);
        
        // Update yari_mamul
        const [yariUpdateResult] = await connection.query(
          'UPDATE yari_mamuller SET toplam_miktar = ?, kalan_miktar = ? WHERE id = ?',
          [newToplam, newKalan, yariMamulId]
        );
        
        console.log('Yari mamul update result:', yariUpdateResult);
        
        // First check if ekleyen_id exists in this yari_mamul
        const ekleyenId = yariMamul.ekleyen_id || kullaniciId || 9; // Use yari_mamul's creator, or operation's user, or default to 9
        
        console.log(`Using ekleyen_id = ${ekleyenId} for history record`);
        
        // Add history record for the change
        try {
          const [historyResult] = await connection.query(
            `INSERT INTO yari_mamul_giris_gecmisi 
             (yari_mamul_id, miktar, birim, hammadde_id, ekleyen_id, giris_tarihi) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [
              yariMamulId,
              -yariMamulMiktar, // Negative value to indicate removal
              'adet',          // Default unit
              hammaddeId,
              ekleyenId       // Use the correct user ID
            ]
          );
          
          console.log('History record result:', historyResult);
        } catch (historyError) {
          // If history record fails, log it but continue (don't fail the whole transaction)
          console.error('Failed to add history record, but continuing:', historyError);
        }
      } else {
        console.log('WARNING: Could not find matching yari_mamul. No updates performed to yari_mamul.');
      }
    } else {
      console.log('No yari_mamul handling needed (either not present or zero quantity)');
    }
    
    // STEP 7: Delete islem
    console.log('STEP 7: Deleting islem');
    const [deleteResult] = await connection.query('DELETE FROM islemler WHERE id = ?', [islemId]);
    console.log('Delete result:', deleteResult);
    
    await connection.commit();
    console.log('Transaction committed successfully');

    // ÖNEMLİ: İşlemi yapan kullanıcının bilgilerini getirelim
    let kullaniciBilgisi = { ad: 'Bilinmeyen', soyad: 'Kullanıcı', kullanici_adi: 'bilinmeyen' };
    
    try {
      // İşlemi kimin yaptığını öğrenmek için kullanıcı ID'sini kullanalım
      if (deleteData.kullanici && deleteData.kullanici.id) {
        // Eğer deleteData.kullanici objesi varsa ve id içeriyorsa, doğrudan kullan
        kullaniciBilgisi = deleteData.kullanici;
      } else if (kullaniciId) {
        // Yoksa işlemin kullanıcı ID'sini kullan
        const [kullaniciRows] = await connection.query(
          'SELECT ad, soyad, kullanici_adi FROM kullanicilar WHERE id = ?',
          [kullaniciId]
        );
        
        if (kullaniciRows && kullaniciRows.length > 0) {
          kullaniciBilgisi = kullaniciRows[0];
        }
      }

      // E-posta gönder
      if (typeof emailService !== 'undefined' && emailService) {
        const silmeNedeni = deleteData.silmeNedeni || 'Kullanıcı tarafından silindi';
        
        const deleteInfo = {
          itemType: 'Hammadde İşlemi',
          itemName: `İşlem #${deleteData.islemId}`,
          itemId: deleteData.islemId,
          reason: silmeNedeni,
          additionalInfo: `Bu işlem sonucunda ${toplamMiktar} kg hammadde stoğa geri eklendi.`,
          user: `${kullaniciBilgisi.ad} ${kullaniciBilgisi.soyad}${kullaniciBilgisi.kullanici_adi ? ' ('+kullaniciBilgisi.kullanici_adi+')' : ''}`,
          timestamp: new Date().toLocaleString('tr-TR')
        };
        
        await emailService.sendDeleteNotification(deleteInfo);
      }
    } catch (userError) {
      console.error('Kullanıcı bilgisi alınırken hata:', userError);
      // Bu hata işlemi durdurmaz, sadece bildirim için
    }
    
    return { 
      success: true, 
      message: 'İşlem silindi, hammadde stoğu güncellendi, yarı mamul miktarı güncellendi',
      restoredAmount: toplamMiktar
    };
  } catch (error) {
    console.error('Error during operation:', error);
    await connection.rollback();
    console.log('Transaction rolled back');
    
    return { 
      success: false, 
      message: error.message 
    };
  } finally {
    connection.release();
    console.log('Connection released');
  }
}

// Yarı mamul işlemi silme ve stok geri alma fonksiyonu için düzeltme
async function deleteYariMamulIslemAndRestoreStock(deleteData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // İşlem nesnesine ait özellikleri çıkart
    const { islemId, yariMamulId, miktar } = deleteData;
    
    // İşlem bilgilerini al (kullanıcı ID'si için)
    const [islemRows] = await connection.execute(
      `SELECT * FROM yari_mamul_islemleri WHERE id = ?`,
      [islemId]
    );
    
    if (islemRows.length === 0) {
      throw new Error('İşlem bulunamadı');
    }
    
    const islem = islemRows[0];
    const kullaniciId = islem.kullanici_id;
    
    // Yarı mamul bilgilerini al
    const [yariMamulRows] = await connection.execute(
      `SELECT * FROM yari_mamuller WHERE id = ?`,
      [yariMamulId]
    );
    
    if (yariMamulRows.length === 0) {
      throw new Error('Yarı mamul bulunamadı');
    }
    
    const yariMamul = yariMamulRows[0];
    
    // 1. Yarı mamulün sadece kalan miktarını güncelle, toplam miktara dokunma
    const updateResult = await connection.execute(
      `UPDATE yari_mamuller 
       SET kalan_miktar = kalan_miktar + ? 
       WHERE id = ?`,
      [miktar, yariMamulId]
    );
    
    if (updateResult.affectedRows === 0) {
      throw new Error('Yarı mamul bilgileri güncellenemedi');
    }
    
    // 2. İşlem kaydını sil
    const islemResult = await connection.execute(
      `DELETE FROM yari_mamul_islemleri WHERE id = ?`,
      [islemId]
    );
    
    if (islemResult.affectedRows === 0) {
      throw new Error('İşlem kaydı silinemedi');
    }
    
    await connection.commit();
    
    // İşlemi yapan kullanıcının bilgilerini getirelim
    let kullaniciBilgisi = { ad: 'Bilinmeyen', soyad: 'Kullanıcı', kullanici_adi: 'bilinmeyen' };
    
    try {
      // İşlemi kimin yaptığını öğrenmek için kullanıcı ID'sini kullanalım
      if (deleteData.kullanici && deleteData.kullanici.id) {
        // Eğer deleteData.kullanici objesi varsa ve id içeriyorsa, doğrudan kullan
        kullaniciBilgisi = deleteData.kullanici;
      } else if (kullaniciId) {
        // Yoksa işlemin kullanıcı ID'sini kullan
        const [kullaniciRows] = await pool.execute(
          'SELECT ad, soyad, kullanici_adi FROM kullanicilar WHERE id = ?',
          [kullaniciId]
        );
        
        if (kullaniciRows.length > 0) {
          kullaniciBilgisi = kullaniciRows[0];
        }
      }

      // E-posta gönder
      if (typeof emailService !== 'undefined' && emailService) {
        const silmeNedeni = deleteData.silmeNedeni || 'Kullanıcı tarafından silindi';
        
        const deleteInfo = {
          itemType: 'Yarı Mamul İşlemi',
          itemName: `İşlem #${islemId}`,
          itemId: islemId,
          reason: silmeNedeni,
          additionalInfo: `Bu işlem sonucunda ${miktar} birim yarı mamul stoğa geri eklendi.`,
          user: `${kullaniciBilgisi.ad} ${kullaniciBilgisi.soyad}${kullaniciBilgisi.kullanici_adi ? ' ('+kullaniciBilgisi.kullanici_adi+')' : ''}`,
          timestamp: new Date().toLocaleString('tr-TR')
        };
        
        await emailService.sendDeleteNotification(deleteInfo);
      }
    } catch (userError) {
      console.error('Kullanıcı bilgisi alınırken hata:', userError);
      // Bu hata işlemi durdurmaz, sadece bildirim için
    }
    
    return { 
      success: true, 
      message: 'İşlem silindi ve yarı mamul stoğu güncellendi',
      restoredAmount: miktar
    };
  } catch (error) {
    await connection.rollback();
    console.error('Yarı mamul işlemi silme hatası:', error);
    return { success: false, message: error.message };
  } finally {
    connection.release();
  }
}

// Sarf malzeme işlemi silme ve stok geri alma fonksiyonu için düzeltme
async function deleteSarfMalzemeIslemAndRestoreStock(deleteData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // İşlem nesnesine ait özellikleri çıkart
    const { islemId, sarfMalzemeId, miktar } = deleteData;
    
    // İşlem bilgilerini al (kullanıcı ID'si için)
    const [islemRows] = await connection.query(
      `SELECT * FROM sarf_malzeme_islemleri WHERE id = ?`,
      [islemId]
    );
    
    if (islemRows.length === 0) {
      throw new Error('İşlem bulunamadı');
    }
    
    const islem = islemRows[0];
    const kullaniciId = islem.kullanici_id;
    
    // Sarf malzeme bilgilerini al
    const sarfMalzemeResult = await connection.query(
      `SELECT * FROM sarf_malzemeler WHERE id = ?`,
      [sarfMalzemeId]
    );
    
    if (sarfMalzemeResult.length === 0) {
      throw new Error('Sarf malzeme bulunamadı');
    }
    
    const sarfMalzeme = sarfMalzemeResult[0];
    
    // 1. Sarf malzemenin kalan miktarını güncelle
    // durum sütunu olmadığı için sadece kalan_miktar'ı güncelle
    const updateResult = await connection.query(
      `UPDATE sarf_malzemeler 
       SET kalan_miktar = kalan_miktar + ?
       WHERE id = ?`,
      [miktar, sarfMalzemeId]
    );
    
    if (updateResult.affectedRows === 0) {
      throw new Error('Sarf malzeme bilgileri güncellenemedi');
    }
    
    // 2. İşlem kaydını sil
    const islemResult = await connection.query(
      `DELETE FROM sarf_malzeme_islemleri WHERE id = ?`,
      [islemId]
    );
    
    if (islemResult.affectedRows === 0) {
      throw new Error('İşlem kaydı silinemedi');
    }
    
    await connection.commit();

    // İşlemi yapan kullanıcının bilgilerini getirelim
    let kullaniciBilgisi = { ad: 'Bilinmeyen', soyad: 'Kullanıcı', kullanici_adi: 'bilinmeyen' };
    
    try {
      // İşlemi kimin yaptığını öğrenmek için kullanıcı ID'sini kullanalım
      if (deleteData.kullanici && deleteData.kullanici.id) {
        // Eğer deleteData.kullanici objesi varsa ve id içeriyorsa, doğrudan kullan
        kullaniciBilgisi = deleteData.kullanici;
      } else if (kullaniciId) {
        // Yoksa işlemin kullanıcı ID'sini kullan
        const [kullaniciRows] = await pool.query(
          'SELECT ad, soyad, kullanici_adi FROM kullanicilar WHERE id = ?',
          [kullaniciId]
        );
        
        if (kullaniciRows && kullaniciRows.length > 0) {
          kullaniciBilgisi = kullaniciRows[0];
        }
      }

      // E-posta gönder
      if (typeof emailService !== 'undefined' && emailService) {
        const silmeNedeni = deleteData.silmeNedeni || 'Kullanıcı tarafından silindi';
        
        const deleteInfo = {
          itemType: 'Sarf Malzeme İşlemi',
          itemName: `İşlem #${islemId}`,
          itemId: islemId,
          reason: silmeNedeni,
          additionalInfo: `Bu işlem sonucunda ${miktar} ${sarfMalzeme.birim || 'birim'} sarf malzeme stoğa geri eklendi.`,
          user: `${kullaniciBilgisi.ad} ${kullaniciBilgisi.soyad}${kullaniciBilgisi.kullanici_adi ? ' ('+kullaniciBilgisi.kullanici_adi+')' : ''}`,
          timestamp: new Date().toLocaleString('tr-TR')
        };
        
        await emailService.sendDeleteNotification(deleteInfo);
        console.log('Email bildirimi gönderildi:', deleteInfo);
      }
    } catch (userError) {
      console.error('Kullanıcı bilgisi alınırken hata:', userError);
      // Bu hata işlemi durdurmaz, sadece bildirim için
    }
    
    return { 
      success: true, 
      message: 'İşlem silindi ve sarf malzeme stoğu güncellendi',
      restoredAmount: miktar
    };
  } catch (error) {
    await connection.rollback();
    console.error('Sarf malzeme işlemi silme hatası:', error);
    return { success: false, message: error.message };
  } finally {
    connection.release();
  }
}



// Function to get all employees
async function getAllCalisan() {
  try {
    // Make sure the table exists
    await createCalisanTableIfNotExists();
    
    // Use pool.execute to fetch employees, sorted by creation date
    const [calisanlar] = await pool.execute(
      'SELECT * FROM calisanlar ORDER BY olusturma_tarihi DESC'
    );
    
    return { success: true, calisanlar };
  } catch (error) {
    console.error('Çalışan listesi alma hatası:', error);
    return { success: false, message: 'Çalışan listesi alınırken bir hata oluştu: ' + error.message };
  }
}

// Function to get employee by ID
async function getCalisanById(id) {
  try {
    // Make sure the table exists
    await createCalisanTableIfNotExists();
    
    // Use pool.execute to fetch a specific employee
    const [rows] = await pool.execute(
      'SELECT * FROM calisanlar WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return { success: false, message: 'Çalışan bulunamadı' };
    }
    
    return { success: true, calisan: rows[0] };
  } catch (error) {
    console.error('Çalışan alma hatası:', error);
    return { success: false, message: 'Çalışan alınırken bir hata oluştu: ' + error.message };
  }
}

// Function to add a new employee
async function addCalisan(calisanData) {
  try {
    // Make sure the table exists
    await createCalisanTableIfNotExists();
    
    // Check if required fields are provided
    if (!calisanData.ad || !calisanData.soyad) {
      return { success: false, message: 'Ad ve soyad alanları gereklidir' };
    }
    
    // Insert the new employee using pool.execute
    const [result] = await pool.execute(
      'INSERT INTO calisanlar (ad, soyad) VALUES (?, ?)',
      [calisanData.ad, calisanData.soyad]
    );
    
    return { success: true, id: result.insertId };
  } catch (error) {
    console.error('Çalışan ekleme hatası:', error);
    return { success: false, message: 'Çalışan eklenirken bir hata oluştu: ' + error.message };
  }
}

// Function to delete an employee
async function deleteCalisan(id) {
  try {
    // Make sure the table exists
    await createCalisanTableIfNotExists();
    
    // Check if the employee exists
    const [rows] = await pool.execute(
      'SELECT id FROM calisanlar WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return { success: false, message: 'Çalışan bulunamadı' };
    }
    
    // Delete the employee
    await pool.execute(
      'DELETE FROM calisanlar WHERE id = ?',
      [id]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Çalışan silme hatası:', error);
    return { success: false, message: 'Çalışan silinirken bir hata oluştu: ' + error.message };
  }
}

// Helper function to create the employees table if it doesn't exist
async function createCalisanTableIfNotExists() {
  try {
    // Check if the table exists
    const [rows] = await pool.execute(`
      SHOW TABLES LIKE 'calisanlar'
    `);
    
    if (rows.length === 0) {
      // Create the table if it doesn't exist
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS calisanlar (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ad VARCHAR(100) NOT NULL,
          soyad VARCHAR(100) NOT NULL,
          olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Çalışanlar tablosu oluşturuldu');
    }
    
    return true;
  } catch (error) {
    console.error('Çalışanlar tablosu oluşturma hatası:', error);
    throw error;
  }
}

async function addPlaka(plakaData) {
  const connection = await pool.getConnection();

  try {
      // Hammadde bilgilerini al
      const [hammaddeRows] = await connection.execute(
          `SELECT malzeme_adi, kalinlik FROM hammaddeler WHERE id = ?`,
          [plakaData.hammadde_id]
      );
      
      if (hammaddeRows.length === 0) {
          return { success: false, message: 'Hammadde bulunamadı' };
      }
      
      const hammadde = hammaddeRows[0];
      const malzemeAdi = hammadde.malzeme_adi.toUpperCase();
      const kalinlik = hammadde.kalinlik;
      
      // Malzeme adına göre uygun prefix belirleme
      let prefix = '';
      
      if (malzemeAdi.includes('SIYAH') || malzemeAdi.includes('SİYAH')) {
          prefix = `SS${Math.round(kalinlik)}-`;
      } else if (malzemeAdi.includes('İKİNCİ KALİTE') || malzemeAdi.includes('IKINCI KALITE') || malzemeAdi.includes('2. KALİTE')) {
          if (malzemeAdi.includes('PASLANMAZ') || malzemeAdi.includes('PO')) {
              prefix = `IKP${Math.round(kalinlik)}-`;
          } else if (malzemeAdi.includes('CR-KIK') || malzemeAdi.includes('CR')) {
              prefix = `IKC${Math.round(kalinlik)}-`;
          } else {
              prefix = `IK${Math.round(kalinlik)}-`;
          }
      } else if (malzemeAdi.includes('HRP')) {
          prefix = `HRP${Math.round(kalinlik)}-`;
      } else if (malzemeAdi.includes('DKF')) {
          prefix = `DKF${Math.round(kalinlik)}-`;
      } else if (malzemeAdi.includes('ST52') || malzemeAdi.includes('ST37')) {
          // ST52 veya ST37 için
          if (malzemeAdi.includes('ST52')) {
              prefix = `ST52${Math.round(kalinlik)}-`;
          } else {
              prefix = `ST37${Math.round(kalinlik)}-`;
          }
      } else {
          // Diğer durumlar için ilk harfleri al
          const words = malzemeAdi.split(' ');
          if (words.length > 0) {
              let acronym = '';
              
              // İlk 3 kelimenin ilk harflerini al
              for (let i = 0; i < Math.min(words.length, 3); i++) {
                  if (words[i].length > 0) {
                      acronym += words[i][0];
                  }
              }
              
              // Eğer hiç harf alınmadıysa veya çok kısa ise varsayılanı kullan
              if (acronym.length < 2) {
                  acronym = 'MS'; // Metal Sac kısaltması
              }
              
              prefix = `${acronym}${Math.round(kalinlik)}-`;
          } else {
              // En kötü durumda varsayılan prefix
              prefix = `MS${Math.round(kalinlik)}-`;
          }
      }
      
      // Rastgele bir stok kodu oluştur
      let stokKodu = prefix + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      
      // Tarih oluştur - MySQL uyumlu datetime formatına çevir
      const simdi = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // Veritabanı işlemlerini başlat
      await connection.beginTransaction();
      
      // Frontend'den gelen tam ağırlık değerini kullan
      const plakaAgirligi = plakaData.hesaplanan_agirlik;
      
      console.log("Plaka ekleniyor. Ağırlık:", plakaAgirligi, "skipHammaddeGirisEntry:", plakaData.skipHammaddeGirisEntry);
      
      // Plaka verisini kaydet - barkod sütunu kaldırıldı
      const [plakaResult] = await connection.execute(
          `INSERT INTO plakalar (
              hammadde_id, stok_kodu, en, boy, kalinlik, 
              tedarikci, birim_fiyat, birim_fiyat_turu, 
              toplam_kilo, kalan_kilo, kullanim_orani, durum, 
              ekleme_tarihi, ekleyen_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
              plakaData.hammadde_id,
              stokKodu,
              plakaData.en,
              plakaData.boy,
              plakaData.kalinlik,
              plakaData.tedarikci,
              plakaData.birim_fiyat,
              plakaData.birim_fiyat_turu,
              plakaAgirligi,
              plakaAgirligi,
              0,  // Kullanım oranı başlangıçta 0
              'TAM', // Durum başlangıçta TAM
              simdi,
              plakaData.ekleyen_id
          ]
      );
      
      const plakaId = plakaResult.insertId;
      
      // Hammadde tablosundaki toplam_kilo ve kalan_kilo değerlerini güncelle
      await connection.execute(
          `UPDATE hammaddeler 
              SET toplam_kilo = toplam_kilo + ?,
                  kalan_kilo = kalan_kilo + ?,
                  durum = CASE
                          WHEN (kalan_kilo + ?) <= 0 THEN 'STOKTA_YOK'
                          WHEN (kalan_kilo + ?) <= kritik_seviye THEN 'AZ_KALDI'
                          ELSE 'STOKTA_VAR'
                      END
              WHERE id = ?`,
          [plakaAgirligi, plakaAgirligi, 
          plakaAgirligi, plakaAgirligi, 
          plakaData.hammadde_id]
      );
      
      // ÖNEMLİ: skipHammaddeGirisEntry true ise hammadde_giris_gecmisi'ne kayıt ekleme
      if (!plakaData.skipHammaddeGirisEntry) {
          console.log("Hammadde giriş kaydı oluşturuluyor:", plakaId);
          
          await connection.execute(
              `INSERT INTO hammadde_giris_gecmisi (
                  hammadde_id, miktar, birim_fiyat, birim_fiyat_turu, 
                  tedarikci, ekleyen_id, giris_tarihi, plaka_id
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                  plakaData.hammadde_id,
                  plakaAgirligi,
                  plakaData.birim_fiyat,
                  plakaData.birim_fiyat_turu,
                  plakaData.tedarikci,
                  plakaData.ekleyen_id,
                  simdi,
                  plakaId
              ]
          );
      } else {
          console.log("Hammadde giriş kaydı atlanıyor (toplu giriş parçası)");
      }
      
      // İşlemi onayla
      await connection.commit();
      
      return {
          success: true,
          plakaId: plakaId,
          stokKodu: stokKodu
      };
  } catch (error) {
      // Hata durumunda işlemi geri al
      try {
          await connection.rollback();
      } catch (rollbackError) {
          console.error('Rollback hatası:', rollbackError);
      }
      
      console.error('Plaka ekleme hatası:', error);
      return { success: false, message: error.message };
  } finally {
      // Bağlantıyı serbest bırak
      connection.release();
  }
}

// Plaka listesini getirme
// Plaka listesini getirme - barkod sütunu kaldırıldı
async function getPlakaListByHammaddeId(hammaddeId) {
  try {
    const [plakalar] = await pool.execute(
      `SELECT p.id, p.stok_kodu, p.en, p.boy, p.kalinlik, 
              p.toplam_kilo, p.kalan_kilo, p.kullanim_orani, p.durum,
              p.tedarikci, p.birim_fiyat, p.birim_fiyat_turu,
              p.ekleme_tarihi, u.ad as kullanici_ad, u.soyad as kullanici_soyad
       FROM plakalar p
       LEFT JOIN kullanicilar u ON p.ekleyen_id = u.id
       WHERE p.hammadde_id = ?
       ORDER BY p.ekleme_tarihi DESC`,
      [hammaddeId]
    );
    
    return { success: true, plakalar: plakalar };
  } catch (error) {
    console.error('Plaka listesi getirme hatası:', error);
    return { success: false, message: error.message, plakalar: [] };
  }
}

// Plaka detayını getirme
async function getPlakaById(plakaId) {
  try {
    const [plakaRows] = await pool.execute(
      `SELECT p.*, h.malzeme_adi, h.yogunluk, h.kritik_seviye,
              u.ad as kullanici_ad, u.soyad as kullanici_soyad
       FROM plakalar p
       LEFT JOIN hammaddeler h ON p.hammadde_id = h.id
       LEFT JOIN kullanicilar u ON p.ekleyen_id = u.id
       WHERE p.id = ?`,
      [plakaId]
    );
    
    if (plakaRows.length === 0) {
      return { success: false, message: 'Plaka bulunamadı' };
    }
    
    return { success: true, plaka: plakaRows[0] };
  } catch (error) {
    console.error('Plaka detayı getirme hatası:', error);
    return { success: false, message: error.message };
  }
}

async function getPlakaParcalariByPlakaId(plakaId) {
  try {
    const [parcalar] = await pool.execute(
      `SELECT id, plaka_id, parca_no, barkod_kodu, 
              en, boy, kalinlik,
              orijinal_kilo, kalan_kilo, kullanim_orani, durum,
              ekleme_tarihi
       FROM plaka_parcalari
       WHERE plaka_id = ?
       ORDER BY parca_no ASC`,
      [plakaId]
    );
    
    return { success: true, parcalar: parcalar };
  } catch (error) {
    console.error('Plaka parçaları getirme hatası:', error);
    return { success: false, message: error.message, parcalar: [] };
  }
}


async function updateHammaddeDurum(hammaddeId) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Hammadde bilgilerini al
    const [hammaddeRows] = await connection.execute(
      `SELECT kalan_kilo, kritik_seviye FROM hammaddeler WHERE id = ?`,
      [hammaddeId]
    );
    
    if (hammaddeRows.length === 0) {
      return { success: false, message: 'Hammadde bulunamadı' };
    }
    
    const hammadde = hammaddeRows[0];
    let kalanKilo = Number(hammadde.kalan_kilo);
    
    // Çok küçük negatif değerleri 0 yap
    if (kalanKilo > -0.01 && kalanKilo < 0.01) {
      kalanKilo = 0;
    }
    
    // Durumu belirle
    let durum = 'STOKTA_VAR';
    if (kalanKilo <= 0) {
      durum = 'STOKTA_YOK';
    } else if (kalanKilo <= hammadde.kritik_seviye) {
      durum = 'AZ_KALDI';
    }
    
    // Hammadde durumunu güncelle
    await connection.execute(
      `UPDATE hammaddeler SET kalan_kilo = ?, durum = ? WHERE id = ?`,
      [kalanKilo, durum, hammaddeId]
    );
    
    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    console.error('Hammadde durumu güncelleme hatası:', error);
    return { success: false, message: error.message };
  } finally {
    connection.release();
  }
}

async function getIslemlerByPlakaId(plakaId) {
  try {
    const [islemler] = await pool.execute(
      `SELECT pi.*, p.proje_kodu, p.proje_adi, 
              u.ad as kullanici_ad, u.soyad as kullanici_soyad,
              m.musteri_adi,
              c.ad as calisan_ad, c.soyad as calisan_soyad
       FROM plaka_islemler pi
       LEFT JOIN projeler p ON pi.proje_id = p.id
       LEFT JOIN kullanicilar u ON pi.kullanici_id = u.id
       LEFT JOIN musteriler m ON pi.musteri_id = m.id
       LEFT JOIN calisanlar c ON pi.calisan_id = c.id
       WHERE pi.plaka_id = ?
       ORDER BY pi.islem_tarihi DESC`,
      [plakaId]
    );
    
    return { success: true, islemler: islemler };
  } catch (error) {
    console.error('Plaka işlem geçmişi getirme hatası:', error);
    return { success: false, message: error.message, islemler: [] };
  }
}



// Bu fonksiyonu server.js veya uygun bir yerde ekleyin
async function getParcaById(parcaId) {
  try {
      // Öncelikle parça ID'nin hangi tabloda olduğunu kontrol edin
      const [parcaCheckRows] = await pool.execute(
          'SELECT COUNT(*) as count FROM plaka_parcalari WHERE id = ?',
          [parcaId]
      );
      
      // Plaka_parcalari tablosunda ise
      if (parcaCheckRows[0].count > 0) {
          // Sac plakalar için sorgulama - yeni sistem
          const [parcaRows] = await pool.execute(
              `SELECT p.*, pl.hammadde_id, h.malzeme_adi, h.yogunluk, h.kalinlik as hammadde_kalinlik
              FROM plaka_parcalari p
              LEFT JOIN plakalar pl ON p.plaka_id = pl.id
              LEFT JOIN hammaddeler h ON pl.hammadde_id = h.id
              WHERE p.id = ?`,
              [parcaId]
          );
          
          if (parcaRows.length > 0) {
              return { success: true, parca: parcaRows[0], tip: 'plaka' };
          }
      } else {
          // Parcalar tablosunda arama yap - eski sistem (boru ve miller için)
          const [parcaRows] = await pool.execute(
              `SELECT p.*, h.malzeme_adi, h.yogunluk, h.kalinlik as hammadde_kalinlik,
                      h.id as hammadde_id, h.hammadde_turu
              FROM parcalar p
              LEFT JOIN hammaddeler h ON p.hammadde_id = h.id
              WHERE p.id = ?`,
              [parcaId]
          );
          
          if (parcaRows.length > 0) {
              return { success: true, parca: parcaRows[0], tip: 'parca' };
          }
      }
      
      // Hiçbir tabloda bulunamadıysa
      return { success: false, message: 'Parça bulunamadı' };
  } catch (error) {
      console.error('Parça detayı getirme hatası:', error);
      return { success: false, message: error.message };
  }
}

async function addPlakaIslem(islemData) {
  const connection = await pool.getConnection();
  let transaction = false;
  let retryCount = 0;
  const MAX_RETRIES = 3;
  
  while (retryCount < MAX_RETRIES) {
    try {
      // Transaction başlat
      await connection.beginTransaction();
      transaction = true;
      
      // Önce plaka bilgilerini al - ÖNEMLİ: NULL değerlere dikkat et
      const [plakaRows] = await connection.execute(
        `SELECT id, hammadde_id, kalan_kilo, durum, stok_kodu, toplam_kilo FROM plakalar WHERE id = ?`,
        [islemData.plaka_id]
      );
      
      if (plakaRows.length === 0) {
        await connection.rollback();
        connection.release();
        return { success: false, message: 'Plaka bulunamadı' };
      }
      
      const plaka = plakaRows[0];
      
      // Hammadde bilgilerini getir - kritik seviye için gerekli
      const [hammaddeRows] = await connection.execute(
        `SELECT id, kritik_seviye, kalan_kilo, toplam_kilo FROM hammaddeler WHERE id = ?`,
        [plaka.hammadde_id]
      );
      
      if (hammaddeRows.length === 0) {
        await connection.rollback();
        connection.release();
        return { success: false, message: 'Hammadde bulunamadı' };
      }
      
      const hammadde = hammaddeRows[0];
      
      // ÖNEMLİ: Sayıları doğru şekilde çevir ve yuvarla
      const plakaKalanKilo = Math.round(parseFloat(plaka.kalan_kilo) * 100) / 100;
      const kullanilanMiktar = Math.round(parseFloat(islemData.kullanilanMiktar) * 100) / 100;
      const hurdaMiktar = Math.round(parseFloat(islemData.hurdaMiktar || 0) * 100) / 100;
      const toplamKullanilanMiktar = Math.round((kullanilanMiktar + hurdaMiktar) * 100) / 100;
      
      // Kalan parçalar için toplam hesapla ve yuvarla
      const kalanParcalarToplami = (islemData.kalan_parcalar && islemData.kalan_parcalar.length > 0)
        ? Math.round(islemData.kalan_parcalar.reduce((toplam, parca) => {
            return toplam + parseFloat(parca.hesaplanan_agirlik);
          }, 0) * 100) / 100
        : 0;
      
      const toplamKullanilacak = Math.round((toplamKullanilanMiktar + kalanParcalarToplami) * 100) / 100;
      
      // Hassasiyet toleransı
      const HASSASIYET_TOLERANSI = 0.01;
      
      if (toplamKullanilacak > (plakaKalanKilo + HASSASIYET_TOLERANSI)) {
        console.error(`Toplam kullanılacak miktar (${toplamKullanilacak}) plaka kalan kilodan (${plakaKalanKilo}) fazla!`);
        await connection.rollback();
        connection.release();
        return { 
          success: false, 
          message: `Toplam miktar (${toplamKullanilacak.toFixed(2)} kg) plakada kalan miktardan (${plakaKalanKilo.toFixed(2)} kg) fazla.` 
        };
      }
      
      // Zorunlu alanlar için NULL kontrolü
      const kullanici_id = islemData.kullanici_id || null;
      const proje_id = islemData.proje_id || null;
      const calisan_id = islemData.calisan_id || null;
      const makine = islemData.makine || null;
      
      // Zorunlu alan eksikse hata döndür
      if (!kullanici_id || !proje_id || !calisan_id || !makine) {
        console.error(`Zorunlu alanlar eksik: kullanıcı=${kullanici_id}, proje=${proje_id}, çalışan=${calisan_id}, makine=${makine}`);
        await connection.rollback();
        connection.release();
        return { 
          success: false, 
          message: 'Zorunlu alanlar eksik: ' + 
                  (!kullanici_id ? 'kullanıcı, ' : '') + 
                  (!proje_id ? 'proje, ' : '') + 
                  (!calisan_id ? 'çalışan, ' : '') + 
                  (!makine ? 'makine' : '')
        };
      }
      
      console.log(`İşlem kaydediliyor: plaka_id=${islemData.plaka_id}, miktar=${kullanilanMiktar}, hurda=${hurdaMiktar}, 
        kalanlar=${kalanParcalarToplami}, makine=${makine}, çalışan=${calisan_id}`);
      
      // Plaka işlemini kaydet - Null değerlerin kontrolü
      const [islemResult] = await connection.execute(
        `INSERT INTO plaka_islemler (
          plaka_id, islem_turu, kullanim_alani, 
          kullanilan_miktar, hurda_miktar, proje_id, 
          musteri_id, kullanici_id, islem_tarihi,
          iskarta_urun, makine, calisan_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
        [
          islemData.plaka_id,
          islemData.islem_turu || 'LazerKesim',  // Varsayılan değer
          islemData.kullanim_alani || 'FasonImalat',  // Varsayılan değer
          kullanilanMiktar,
          hurdaMiktar,
          proje_id,
          islemData.musteri_id || null,
          kullanici_id,
          islemData.iskarta_urun ? 1 : 0,
          makine,
          calisan_id
        ]
      );
      
      const islemId = islemResult.insertId;
      console.log(`İşlem oluşturuldu, ID: ${islemId}`);
      
      // Plaka kalan kilosunu güncelle - SQL'de hassasiyet için ROUND kullan
      const yeniKalanKilo = Math.max(0, Math.round((plakaKalanKilo - toplamKullanilanMiktar) * 100) / 100);
      let yeniKullanimOrani = 0;
      
      if (plaka.toplam_kilo > 0) {
        // ÖNEMLİ: Kullanım oranı doğru formülle hesaplanmalı - toplam_kilo üzerinden
        const toplam_kilo = parseFloat(plaka.toplam_kilo);
        yeniKullanimOrani = Math.round(((toplam_kilo - yeniKalanKilo) / toplam_kilo) * 10000) / 100;
      }
      
      // Yeni durum belirleme - çok hassas kontrol
      let yeniDurum = 'TAM';
      if (yeniKalanKilo <= 0.01) { // Çok küçük değerler için sıfır kabul et
        yeniDurum = 'TUKENDI';
      } else if (yeniKalanKilo < plakaKalanKilo) {
        yeniDurum = 'KISMEN_KULLANILDI';
      }
      
      console.log(`Plaka güncelleniyor: id=${plaka.id}, yeni kalan=${yeniKalanKilo}, 
        oran=${yeniKullanimOrani}, durum=${yeniDurum}`);
      
      // DECIMAL hassasiyet ile güncelleyin
      await connection.execute(
        `UPDATE plakalar 
         SET kalan_kilo = ROUND(?, 2), 
             kullanim_orani = ROUND(?, 2), 
             durum = ? 
         WHERE id = ?`,
        [yeniKalanKilo, yeniKullanimOrani, yeniDurum, plaka.id]
      );
      
      // Hammadde kalan kilosunu güncelle - aynı hassasiyet
      const hammaddeYeniKalanKilo = Math.max(0, Math.round((parseFloat(hammadde.kalan_kilo) - toplamKullanilanMiktar) * 100) / 100);
      let hammaddeDurum = 'STOKTA_VAR';
      
      if (hammaddeYeniKalanKilo <= 0.01) {
        hammaddeDurum = 'STOKTA_YOK';
      } else if (hammaddeYeniKalanKilo <= parseFloat(hammadde.kritik_seviye)) {
        hammaddeDurum = 'AZ_KALDI';
      }
      
      console.log(`Hammadde güncelleniyor: id=${hammadde.id}, yeni kalan=${hammaddeYeniKalanKilo}, durum=${hammaddeDurum}`);
      
      await connection.execute(
        `UPDATE hammaddeler 
         SET kalan_kilo = ROUND(?, 2),
             durum = ?
         WHERE id = ?`,
        [hammaddeYeniKalanKilo, hammaddeDurum, plaka.hammadde_id]
      );
      
      // Kalan parçalar oluşturulacaksa
      if (islemData.kalan_parcalar && islemData.kalan_parcalar.length > 0) {
        const plakaKodu = plaka.stok_kodu;
        const plakaPrefix = plakaKodu.split('-')[0];
        
        console.log(`${islemData.kalan_parcalar.length} adet kalan parça oluşturuluyor`);
        
        for (const kalanParca of islemData.kalan_parcalar) {
          // Parça no hesaplama - global değil, plaka bazında
          const [parcaNoResult] = await connection.execute(
            `SELECT COALESCE(MAX(parca_no), 0) + 1 as next_parca_no 
             FROM plaka_parcalari 
             WHERE plaka_id = ?`,
            [plaka.id]
          );
          
          const parcaNo = parcaNoResult[0].next_parca_no;
          const parcaBarkod = plakaPrefix + '-P' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          const parcaAgirlik = Math.round(parseFloat(kalanParca.hesaplanan_agirlik) * 100) / 100;
          
          console.log(`Kalan parça ekleniyor: plaka_id=${plaka.id}, no=${parcaNo}, ağırlık=${parcaAgirlik}`);
          
          // DECIMAL hassasiyet ile ekleme
          await connection.execute(
            `INSERT INTO plaka_parcalari (
              plaka_id, parca_no, barkod_kodu, 
              en, boy, kalinlik, 
              orijinal_kilo, kalan_kilo, kullanim_orani, durum, 
              ekleme_tarihi, ekleyen_id, islem_id
            ) VALUES (?, ?, ?, ?, ?, ?, 
                      ROUND(?, 2), ROUND(?, 2), ?, ?, 
                      NOW(), ?, ?)`,
            [
              plaka.id,
              parcaNo,
              parcaBarkod,
              kalanParca.en,
              kalanParca.boy,
              kalanParca.kalinlik,
              parcaAgirlik,
              parcaAgirlik,
              0,
              'TAM',
              islemData.kullanici_id,
              islemId
            ]
          );
        }
      }
    
      // Yarı mamul işlemi
      if (islemData.kullanim_alani === 'MakineImalat' && islemData.yari_mamul) {
        const yariMamul = islemData.yari_mamul;
        
        // Mevcut bir yarı mamul var mı kontrol et
        const [existingYariMamulRows] = await connection.execute(
          `SELECT id FROM yari_mamuller WHERE malzeme_adi = ?`,
          [yariMamul.adi]
        );
        
        if (existingYariMamulRows.length > 0) {
          const existingYariMamulId = existingYariMamulRows[0].id;
          
          console.log(`Mevcut yarı mamul güncelleniyor: id=${existingYariMamulId}, miktar=${yariMamul.miktar}`);
          
          // Mevcut yarı mamulü güncelle
          await connection.execute(
            `UPDATE yari_mamuller 
             SET toplam_miktar = ROUND(toplam_miktar + ?, 2), 
                 kalan_miktar = ROUND(kalan_miktar + ?, 2)
             WHERE id = ?`,
            [yariMamul.miktar, yariMamul.miktar, existingYariMamulId]
          );
          
          // Yarı mamul girişi ekle
          await connection.execute(
            `INSERT INTO yari_mamul_giris_gecmisi (
              yari_mamul_id, 
              miktar, 
              birim,
              hammadde_id,
              hammadde_kodu,
              ekleyen_id, 
              giris_tarihi,
              plaka_id
            ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
            [
              existingYariMamulId,
              yariMamul.miktar,
              yariMamul.birim,
              plaka.hammadde_id,
              plaka.stok_kodu,
              islemData.kullanici_id,
              plaka.id
            ]
          );
        } else {
          // Yeni stok kodu ve barkod oluştur
          const yariMamulStokKodu = 'YM' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
          const yariMamulBarkod = 'YM' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
          
          console.log(`Yeni yarı mamul oluşturuluyor: ${yariMamul.adi}, miktar=${yariMamul.miktar}`);
          
          // Yeni yarı mamul ekle
          const [yariMamulResult] = await connection.execute(
            `INSERT INTO yari_mamuller (
              stok_kodu, 
              malzeme_adi, 
              birim, 
              toplam_miktar, 
              kalan_miktar, 
              barkod, 
              kritik_seviye,
              ekleyen_id,
              ekleme_tarihi
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              yariMamulStokKodu,
              yariMamul.adi,
              yariMamul.birim,
              yariMamul.miktar,
              yariMamul.miktar,
              yariMamulBarkod,
              yariMamul.miktar * 0.2, // Kritik seviye varsayılan
              islemData.kullanici_id
            ]
          );
          
          // Yarı mamul girişi ekle
          await connection.execute(
            `INSERT INTO yari_mamul_giris_gecmisi (
              yari_mamul_id, 
              miktar, 
              birim,
              hammadde_id,
              hammadde_kodu,
              ekleyen_id, 
              giris_tarihi,
              plaka_id
            ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
            [
              yariMamulResult.insertId,
              yariMamul.miktar,
              yariMamul.birim,
              plaka.hammadde_id,
              plaka.stok_kodu,
              islemData.kullanici_id,
              plaka.id
            ]
          );
        }
      }
    
      // İşlemi onayla
      await connection.commit();
      console.log(`İşlem başarıyla tamamlandı, islemId: ${islemId}`);
      
      connection.release();
      return { success: true, islemId: islemId };
    
    } catch (error) {
      // Hata durumunda işlemi geri al
      if (transaction) {
        try {
          console.error('İşlem hatası, rollback yapılıyor:', error);
          await connection.rollback();
        } catch (rollbackError) {
          console.error('Rollback hatası:', rollbackError);
        }
      }
      
      // Deadlock hatası ise ve tekrar deneme sayısını aşmadıysak, tekrar deneyelim
      if (error.code === 'ER_LOCK_DEADLOCK' && retryCount < MAX_RETRIES - 1) {
        console.log(`Deadlock tespit edildi, tekrar deneniyor... (${retryCount + 1}/${MAX_RETRIES})`);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 500 * retryCount)); // Artan bekleme süresi
        continue;
      }
      
      console.error('Plaka işlemi ekleme hatası:', error);
      connection.release();
      return { success: false, message: error.message || 'Bilinmeyen bir hata oluştu' };
    }
  }
  
  // Tüm denemeler başarısız oldu
  connection.release();
  return { success: false, message: 'İşlem maksimum deneme sayısını aştı, lütfen tekrar deneyin.' };
}

async function addParcaIslem(islemData) {
  const connection = await pool.getConnection();  
  let transaction = false;
  
  try {
    await connection.beginTransaction();
    transaction = true;
    
    const [parcaRows] = await connection.execute(
      'SELECT * FROM plaka_parcalari WHERE id = ?',
      [islemData.parca_id]
    );
    
    if (parcaRows.length === 0) {
      throw new Error('Parça bulunamadı');
    }
    
    const parca = parcaRows[0];
    const plaka_id = parca.plaka_id;

    const [plakaRows] = await connection.execute(
      'SELECT * FROM plakalar WHERE id = ?',
      [plaka_id]
    );
    
    if (plakaRows.length === 0) {
      throw new Error('Plaka bulunamadı');
    }

    const plaka = plakaRows[0];

    // Ana işlem kaydını ekle
    const [islemResult] = await connection.execute(
      `INSERT INTO plaka_islemler (
        plaka_id, islem_turu, kullanim_alani,
        kullanilan_miktar, hurda_miktar,
        proje_id, musteri_id, kullanici_id, islem_tarihi,
        makine, calisan_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        plaka_id,
        islemData.islem_turu,
        islemData.kullanim_alani,
        islemData.kullanilanMiktar,
        islemData.hurdaMiktar,
        islemData.proje_id,
        islemData.musteri_id || null,
        islemData.kullanici_id,
        islemData.makine || null,
        islemData.calisan_id || null
      ]
    );
    
    const islemId = islemResult.insertId;
    
    // Kullanılan ve hurda miktarını topla
    const kullanilanVeHurda = parseFloat(islemData.kullanilanMiktar) + parseFloat(islemData.hurdaMiktar || 0);
    
    // Kalan parçaların ağırlığını toplam kullanılana eklemeyelim
    const toplamKullanilan = kullanilanVeHurda;
    
    if (toplamKullanilan > parseFloat(parca.kalan_kilo)) {
      throw new Error(`Kullanılan miktar (${toplamKullanilan.toFixed(2)} kg) parçada kalan miktardan (${parca.kalan_kilo.toFixed(2)} kg) fazla olamaz`);
    }
    
    // Parent parçayı veritabanından sil
    await connection.execute(
      `DELETE FROM plaka_parcalari WHERE id = ?`,
      [islemData.parca_id]
    );
    
    // Kullanılan kiloyu plakadan ve hammaddeden düş - DECIMAL hassasiyet ile
    await connection.execute(
      `UPDATE plakalar 
       SET kalan_kilo = ROUND(kalan_kilo - ?, 2),
           kullanim_orani = ROUND(((toplam_kilo - ROUND(kalan_kilo - ?, 2)) / toplam_kilo) * 100, 2)
       WHERE id = ?`,
      [toplamKullanilan, toplamKullanilan, plaka_id]
    );
    
    // Hammadde kalan kilosunu da güncelle
    await connection.execute(
      `UPDATE hammaddeler
       SET kalan_kilo = ROUND(kalan_kilo - ?, 2)
       WHERE id = ?`,
      [toplamKullanilan, plaka.hammadde_id]
    );
    
    // Birden fazla kalan parça oluşturulacaksa
    if (islemData.kalan_parcalar && islemData.kalan_parcalar.length > 0) {
      for (const kalanParca of islemData.kalan_parcalar) {
        const [parcaNoResult] = await connection.execute(
          `SELECT COALESCE(MAX(parca_no), 0) + 1 as next_parca_no 
           FROM plaka_parcalari`
        );
        const nextParcaNo = parcaNoResult[0].next_parca_no;
        
        const plakaKodu = plaka.stok_kodu;
        const plakaPrefix = plakaKodu.split('-')[0];
        const yeniBarkod = plakaPrefix + '-P' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
        // Yeni parçayı ekle - DECIMAL hassasiyet ile
        await connection.execute(
          `INSERT INTO plaka_parcalari (
            plaka_id, parca_no, barkod_kodu, 
            en, boy, kalinlik, 
            orijinal_kilo, kalan_kilo, kullanim_orani, durum, 
            ekleme_tarihi, ekleyen_id, islem_id, parent_parca_id
          ) VALUES (?, ?, ?, ?, ?, ?, 
                    ROUND(?, 2), ROUND(?, 2), ?, ?, 
                    NOW(), ?, ?, ?)`,
          [
            plaka_id,
            nextParcaNo,
            yeniBarkod,
            kalanParca.en,
            kalanParca.boy,
            kalanParca.kalinlik,
            kalanParca.hesaplanan_agirlik,
            kalanParca.hesaplanan_agirlik,
            0,
            'TAM',
            islemData.kullanici_id,
            islemId,
            islemData.parca_id
          ]
        );
      }
    }
    
    // Plaka durumunu güncelle - DECIMAL hassasiyet ile
    await connection.execute(
      `UPDATE plakalar 
       SET durum = CASE
                    WHEN ROUND(kalan_kilo, 2) <= 0 THEN 'TUKENDI'
                    WHEN ROUND(kalan_kilo, 2) < ROUND(toplam_kilo, 2) THEN 'KISMEN_KULLANILDI'
                    ELSE 'TAM'
                  END
       WHERE id = ?`,
      [plaka_id]
    );
    
    // Hammadde durumunu güncelle
    await connection.execute(
      `UPDATE hammaddeler
       SET durum = CASE
                     WHEN ROUND(kalan_kilo, 2) <= 0 THEN 'STOKTA_YOK'
                     WHEN ROUND(kalan_kilo, 2) <= ROUND(kritik_seviye, 2) THEN 'AZ_KALDI'
                     WHEN ROUND(kalan_kilo, 2) < ROUND(toplam_kilo, 2) THEN 'KISMEN_KULLANILDI'
                     ELSE 'STOKTA_VAR'
                   END
       WHERE id = ?`,
      [plaka.hammadde_id]
    );
    
    // Yarı mamul oluşturma işlemi
    if (islemData.kullanim_alani === 'MakineImalat' && islemData.yari_mamul) {
      const yariMamul = islemData.yari_mamul;
      
      // Mevcut bir yarı mamul var mı kontrol et
      const [existingYariMamulRows] = await connection.execute(
        `SELECT id FROM yari_mamuller WHERE malzeme_adi = ?`,
        [yariMamul.adi]
      );
      
      if (existingYariMamulRows.length > 0) {
        const existingYariMamulId = existingYariMamulRows[0].id;
        
        // Mevcut yarı mamulü güncelle
        await connection.execute(
          `UPDATE yari_mamuller 
           SET toplam_miktar = toplam_miktar + ?, 
               kalan_miktar = kalan_miktar + ? 
           WHERE id = ?`,
          [yariMamul.miktar, yariMamul.miktar, existingYariMamulId]
        );
        
        // Yarı mamul girişi ekle - tablo adını düzelt ve kaynak alanını kaldır
        await connection.execute(
          `INSERT INTO yari_mamul_giris_gecmisi (
            yari_mamul_id, 
            miktar, 
            birim,
            hammadde_id,
            hammadde_kodu,
            ekleyen_id, 
            giris_tarihi,
            plaka_id
          ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
          [
            existingYariMamulId,
            yariMamul.miktar,
            yariMamul.birim,
            plaka.hammadde_id,
            plaka.stok_kodu,
            islemData.kullanici_id,
            plaka_id
          ]
        );
      } else {
        // Yeni stok kodu ve barkod oluştur
        const yariMamulStokKodu = 'YM' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        const yariMamulBarkod = 'YM' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
        
        // Yeni yarı mamul ekle
        const [yariMamulResult] = await connection.execute(
          `INSERT INTO yari_mamuller (
            stok_kodu, 
            malzeme_adi, 
            birim, 
            toplam_miktar, 
            kalan_miktar, 
            barkod, 
            kritik_seviye,
            ekleyen_id,
            ekleme_tarihi
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            yariMamulStokKodu,
            yariMamul.adi,
            yariMamul.birim,
            yariMamul.miktar,
            yariMamul.miktar,
            yariMamulBarkod,
            yariMamul.miktar * 0.2, // Kritik seviye varsayılan
            islemData.kullanici_id
          ]
        );
        
        // Yarı mamul girişi ekle - tablo adını düzelt ve kaynak alanını kaldır
        await connection.execute(
          `INSERT INTO yari_mamul_giris_gecmisi (
            yari_mamul_id, 
            miktar, 
            birim,
            hammadde_id,
            hammadde_kodu,
            ekleyen_id, 
            giris_tarihi,
            plaka_id
          ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
          [
            yariMamulResult.insertId,
            yariMamul.miktar,
            yariMamul.birim,
            plaka.hammadde_id,
            plaka.stok_kodu,
            islemData.kullanici_id,
            plaka_id
          ]
        );
      }
    }
    
    // İşlemi onayla
    await connection.commit();
    
    return {
      success: true,
      message: 'İşlem başarıyla kaydedildi',
      islemId: islemId
    };
    
  } catch (error) {
    // Hata durumunda işlemi geri al
    if (transaction) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback hatası:', rollbackError);
      }
    }
    
    console.error('Parça işlemi ekleme hatası:', error);
    return {
      success: false,
      message: error.message || 'İşlem eklenirken bir hata oluştu'
    };
  } finally {
    // Bağlantıyı serbest bırak
    if (connection) {
      connection.release();
    }
  }
}

// Helper function to get next numeric parca_no
async function getNextParcaNo(connection) {
  try {
    // Get the highest existing parca_no from the database
    const [rows] = await connection.execute(
      'SELECT MAX(parca_no) as max_no FROM plaka_parcalari'
    );
    
    let nextNumber = 1;
    if (rows.length > 0 && rows[0].max_no) {
      nextNumber = parseInt(rows[0].max_no) + 1;
    }
    
    return nextNumber;
  } catch (error) {
    console.error('Error generating parca_no:', error);
    return Math.floor(Math.random() * 10000) + 1; // Fallback to random number
  }
}


async function addTopluHammaddeGiris(girisData) {
  try {
      // Tarih oluştur
      const simdi = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // Veritabanı işlemlerini başlat
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      console.log("Toplu hammadde girişi verisi:", girisData);
      
      // Toplu giriş kaydı ekle - ana_barkod alanını kullanıyoruz
      await connection.execute(
          `INSERT INTO hammadde_giris_gecmisi (
              hammadde_id, miktar, birim_fiyat, birim_fiyat_turu, 
              tedarikci, ekleyen_id, giris_tarihi,
              ana_barkod, plaka_sayisi
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
              girisData.hammadde_id,
              girisData.miktar,
              girisData.birim_fiyat,
              girisData.birim_fiyat_turu,
              girisData.tedarikci,
              girisData.ekleyen_id,
              simdi,
              girisData.ana_barkod || null,  // Ana barkod burada saklanacak
              girisData.plaka_sayisi || 1
          ]
      );
      
      // İşlemi onayla
      await connection.commit();
      connection.release();
      
      return { success: true };
  } catch (error) {
      console.error('Toplu hammadde girişi hatası:', error);
      return { success: false, message: error.message };
  }
}


async function getAllMusteriler() {
  try {
    const [rows] = await pool.execute(
      `SELECT id, musteri_adi, DATE_FORMAT(ekleme_tarihi, '%d.%m.%Y') AS ekleme_tarihi 
       FROM musteriler
       ORDER BY musteri_adi ASC`
    );
    
    return { success: true, musteriler: rows };
  } catch (error) {
    console.error('Müşteri listesi getirme hatası:', error);
    return { success: false, message: error.message, musteriler: [] };
  }
}

async function addMusteri(musteriData) {
  try {
   
    
    // Aynı isimde müşteri var mı kontrol et
    const [existingMusteriler] = await pool.execute(
      'SELECT id FROM musteriler WHERE musteri_adi = ?',
      [musteriData.musteri_adi]
    );
    
    if (existingMusteriler.length > 0) {
      return { 
        success: false, 
        message: 'Bu isimde bir müşteri zaten mevcut',
        id: existingMusteriler[0].id 
      };
    }
    
    // Yeni müşteri ekle
    const [result] = await pool.execute(
      'INSERT INTO musteriler (musteri_adi) VALUES (?)',
      [musteriData.musteri_adi]
    );
    
    return { 
      success: true, 
      message: 'Müşteri başarıyla eklendi',
      id: result.insertId,
      musteri: {
        id: result.insertId,
        musteri_adi: musteriData.musteri_adi
      }
    };
  } catch (error) {
    console.error('Müşteri ekleme hatası:', error);
    return { success: false, message: error.message };
  }
}


async function getIslemlerByHammaddeId(hammaddeId) {
  try {
      // Hammaddeye ait parçaları al
      const [parcaRows] = await pool.execute(
          `SELECT id FROM parcalar WHERE hammadde_id = ?`,
          [hammaddeId]
      );
      
      if (parcaRows.length === 0) {
          return { success: true, islemler: [] };
      }
      
      // Parça id'lerini al
      const parcaIds = parcaRows.map(row => row.id);
      // Sorgu için parametrik WHERE koşulunu oluştur
      const placeholders = parcaIds.map(() => '?').join(',');
      
      // İşlemleri al - parca_no sütununu tamamen kaldırdık
      const [rows] = await pool.execute(
          `SELECT i.*, 
            u.ad AS kullanici_ad, u.soyad AS kullanici_soyad,
            p.proje_kodu, p.proje_adi,
            c.ad AS calisan_ad, c.soyad AS calisan_soyad,
            m.musteri_adi AS musteri_adi
          FROM islemler i
          LEFT JOIN kullanicilar u ON i.kullanici_id = u.id
          LEFT JOIN projeler p ON i.proje_id = p.id
          LEFT JOIN calisanlar c ON i.calisan_id = c.id
          LEFT JOIN musteriler m ON i.musteri_id = m.id
          WHERE i.parca_id IN (${placeholders})
          ORDER BY i.islem_tarihi DESC`,
          parcaIds
      );
      
      // Bu kısımda parcaNo değerini her bir satır için ekleyeceğiz
      for (let i = 0; i < rows.length; i++) {
          // Parça ID'si ile hammadde içindeki sırasını belirleme
          const parcaId = rows[i].parca_id;
          
          // Aynı hammaddeye ait parçalar arasında bu parçanın indeksini bul
          // Parça ID'leri sıralı değilse, bu mantıksal sırayı öğrenmek için ekstra sorgu gerekebilir
          const parcaIndex = parcaIds.indexOf(parcaId);
          rows[i].parcaNo = parcaIndex !== -1 ? parcaIndex + 1 : null;
      }
      
      return { success: true, islemler: rows };
  } catch (error) {
      console.error('İşlemleri getirme hatası:', error);
      return { success: false, message: 'İşlemler getirilirken bir hata oluştu.' };
  }
}



async function addPlakaToIslemde(plakaId, hammaddeId, userId) {
  try {
    const [exists] = await pool.execute(
      'SELECT id FROM islemdeki_plakalar WHERE plaka_id = ?',
      [plakaId]
    );

    if (exists.length > 0) {
      return { success: true, message: 'Plaka zaten işlemde' };
    }

    const [result] = await pool.execute(
      `INSERT INTO islemdeki_plakalar (plaka_id, hammadde_id, ekleyen_id)
       VALUES (?, ?, ?)`,
      [plakaId, hammaddeId, userId]
    );

    return { success: true, insertId: result.insertId };
  } catch (error) {
    console.error('Plaka eklenirken hata oluştu:', error);
    return { success: false, message: error.message };
  }
}


// İşlemdeki tüm plakaları getir
async function getAllIslemdekiPlakalar() {
  try {
    const [results] = await pool.execute(`
      SELECT ip.*, p.id as plaka_id, p.stok_kodu, p.durum, p.en, p.boy, p.kalinlik, p.kalan_kilo,
             h.id as hammadde_id, h.stok_kodu as hammadde_stok_kodu, 
             h.malzeme_adi, h.hammadde_turu, h.kalinlik as hammadde_kalinlik,
             h.cap, h.uzunluk, h.toplam_kilo, h.kalan_kilo as hammadde_kalan_kilo,
             h.barkod, h.durum as hammadde_durum
      FROM islemdeki_plakalar ip
      JOIN plakalar p ON ip.plaka_id = p.id
      JOIN hammaddeler h ON ip.hammadde_id = h.id
    `);

    return { success: true, data: results };
  } catch (error) {
    console.error('İşlemdeki plakalar getirilirken hata oluştu:', error);
    return { success: false, message: error.message };
  }
}




async function removeFromIslemde(hammaddeId) {
  try {
    const [result] = await pool.execute(
      `DELETE FROM islemdeki_plakalar WHERE hammadde_id = ?`,
      [hammaddeId]
    );

    return { success: true, affectedRows: result.affectedRows };
  } catch (error) {
    console.error('İşlemdekilerden silme hatası:', error);
    return { success: false, message: error.message };
  }
}



async function removePlakaFromIslemde(plakaId) {
  try {
    console.log(`removePlakaFromIslemde çağrıldı, plakaId: ${plakaId}`);
    
    // Plaka işlemde var mı kontrol et
    const [exists] = await pool.execute(
      'SELECT id FROM islemdeki_plakalar WHERE plaka_id = ?',
      [plakaId]
    );
    
    if (exists.length === 0) {
      return { success: false, message: 'Plaka işlemde bulunamadı' };
    }
    
    // Plakayı işlemden çıkar
    const [result] = await pool.execute(
      `DELETE FROM islemdeki_plakalar WHERE plaka_id = ?`,
      [plakaId]
    );

    return { 
      success: true, 
      affectedRows: result.affectedRows,
      message: `Plaka #${plakaId} işlemden çıkarıldı`
    };
  } catch (error) {
    console.error('Plakayı işlemden çıkarma hatası:', error);
    return { success: false, message: error.message };
  }
}






async function loadHammaddeFasonIslemlerById(parcaId) {
  try {
    const [rows] = await pool.execute(`
      SELECT i.*, 
        u.ad AS kullanici_ad, u.soyad AS kullanici_soyad,
        p.proje_kodu, p.proje_adi,
        c.ad AS calisan_ad, c.soyad AS calisan_soyad,
        m.musteri_adi
      FROM islemler i
      JOIN kullanicilar u ON i.kullanici_id = u.id
      JOIN projeler p ON i.proje_id = p.id
      LEFT JOIN calisanlar c ON i.calisan_id = c.id
      LEFT JOIN musteriler m ON i.musteri_id = m.id
      WHERE i.parca_id = ? AND i.kullanim_alani = 'FasonImalat'
      ORDER BY i.islem_tarihi DESC
    `, [parcaId]);
    
    return { success: true, islemler: rows };
  } catch (error) {
    console.error('Fason işlemleri getirme hatası:', error);
    return { success: false, message: 'Fason işlemler getirilirken bir hata oluştu: ' + error.message };
  }
}

// 8. Hammadde Makine işlemlerini getiren fonksiyon
async function loadHammaddeMakineIslemlerById(parcaId) {
  try {
    const [rows] = await pool.execute(`
      SELECT i.*, 
        u.ad AS kullanici_ad, u.soyad AS kullanici_soyad,
        p.proje_kodu, p.proje_adi,
        c.ad AS calisan_ad, c.soyad AS calisan_soyad
      FROM islemler i
      JOIN kullanicilar u ON i.kullanici_id = u.id
      JOIN projeler p ON i.proje_id = p.id
      LEFT JOIN calisanlar c ON i.calisan_id = c.id
      WHERE i.parca_id = ? AND i.kullanim_alani = 'MakineImalat'
      ORDER BY i.islem_tarihi DESC
    `, [parcaId]);
    
    return { success: true, islemler: rows };
  } catch (error) {
    console.error('Makine işlemleri getirme hatası:', error);
    return { success: false, message: 'Makine işlemler getirilirken bir hata oluştu: ' + error.message };
  }
}




async function getFasonIslemlerHepsiBirlikte() {
  try {
    // Hammadde işlemleri için sorgu
    const [hammaddeRows] = await pool.execute(`
      SELECT 
        i.id AS islem_id, 
        i.islem_tarihi, 
        'hammadde' AS islem_turu,
        h.stok_kodu, 
        h.malzeme_adi, 
        h.kalinlik, 
        p.barkod_kodu,
        i.kullanilanMiktar, 
        i.hurdaMiktar, 
        pr.proje_adi,
        i.islem_turu AS hammadde_islem_turu,
        c.ad AS calisan_ad, 
        c.soyad AS calisan_soyad,
        i.makine,
        u.ad AS kullanici_ad, 
        u.soyad AS kullanici_soyad
      FROM 
        islemler i
        JOIN parcalar p ON i.parca_id = p.id
        JOIN hammaddeler h ON p.hammadde_id = h.id
        LEFT JOIN projeler pr ON i.proje_id = pr.id
        LEFT JOIN calisanlar c ON i.calisan_id = c.id
        LEFT JOIN kullanicilar u ON i.kullanici_id = u.id
      WHERE 
        i.kullanim_alani = 'FasonImalat'
    `);

    // Sarf malzeme işlemleri için sorgu - Bu kısım değişmedi
    const [sarfMalzemeRows] = await pool.execute(`
      SELECT 
        si.id AS islem_id, 
        si.islem_tarihi, 
        'sarf_malzeme' AS islem_turu,
        sm.stok_kodu, 
        sm.malzeme_adi, 
        sm.birim, 
        si.miktar,
        pr.proje_adi,
        si.islem_turu AS sarf_islem_turu,
        c.ad AS calisan_ad, 
        c.soyad AS calisan_soyad,
        si.makine,
        u.ad AS kullanici_ad, 
        u.soyad AS kullanici_soyad
      FROM 
        sarf_malzeme_islemleri si
        JOIN sarf_malzemeler sm ON si.sarf_malzeme_id = sm.id
        LEFT JOIN projeler pr ON si.proje_id = pr.id
        LEFT JOIN calisanlar c ON si.calisan_id = c.id
        LEFT JOIN kullanicilar u ON si.kullanici_id = u.id
      WHERE 
        si.kullanim_alani = 'FasonImalat'
    `);

    // Yarı mamul işlemleri için sorgu - Bu kısım değişmedi
    const [yariMamulRows] = await pool.execute(`
      SELECT 
        ymi.id AS islem_id, 
        ymi.islem_tarihi, 
        'yari_mamul' AS islem_turu,
        ym.stok_kodu, 
        ym.malzeme_adi, 
        ym.birim, 
        ymi.miktar,
        pr.proje_adi,
        ymi.islem_turu AS sarf_islem_turu,
        null AS calisan_ad, 
        null AS calisan_soyad,
        null AS makine,
        u.ad AS kullanici_ad, 
        u.soyad AS kullanici_soyad
      FROM 
        yari_mamul_islemleri ymi
        JOIN yari_mamuller ym ON ymi.yari_mamul_id = ym.id
        LEFT JOIN projeler pr ON ymi.proje_id = pr.id
        LEFT JOIN kullanicilar u ON ymi.kullanici_id = u.id
      WHERE 
        ymi.kullanim_alani = 'FasonImalat'
    `);

    // İkincil stok işlemleri için sorgu - Bu kısım değişmedi
  

    return {
      success: true,
      islemler: [
        ...hammaddeRows,
        ...sarfMalzemeRows,
        ...yariMamulRows
      ]
    };
  } catch (error) {
    console.error('Toplu fason işlemleri getirme hatası:', error);
    return { success: false, message: error.message };
  }
}

async function getMakineIslemlerHepsiBirlikte() {
  try {
    // Hammadde işlemleri için sorgu - "en" ve "boy" kaldırıldı
    const [hammaddeRows] = await pool.execute(`
      SELECT 
        i.id AS islem_id, 
        i.islem_tarihi, 
        'hammadde' AS islem_turu,
        h.stok_kodu, 
        h.malzeme_adi, 
        h.kalinlik, 
        p.barkod_kodu,
        i.kullanilanMiktar, 
        i.hurdaMiktar, 
        pr.proje_adi,
        i.islem_turu AS hammadde_islem_turu,
        c.ad AS calisan_ad, 
        c.soyad AS calisan_soyad,
        i.makine,
        u.ad AS kullanici_ad, 
        u.soyad AS kullanici_soyad
      FROM 
        islemler i
        JOIN parcalar p ON i.parca_id = p.id
        JOIN hammaddeler h ON p.hammadde_id = h.id
        LEFT JOIN projeler pr ON i.proje_id = pr.id
        LEFT JOIN calisanlar c ON i.calisan_id = c.id
        LEFT JOIN kullanicilar u ON i.kullanici_id = u.id
      WHERE 
        i.kullanim_alani = 'MakineImalat'
    `);

    // Sarf malzeme işlemleri için sorgu - Bu kısım değişmedi
    const [sarfMalzemeRows] = await pool.execute(`
      SELECT 
        si.id AS islem_id, 
        si.islem_tarihi, 
        'sarf_malzeme' AS islem_turu,
        sm.stok_kodu, 
        sm.malzeme_adi, 
        sm.birim, 
        si.miktar,
        pr.proje_adi,
        si.islem_turu AS sarf_islem_turu,
        c.ad AS calisan_ad, 
        c.soyad AS calisan_soyad,
        si.makine,
        u.ad AS kullanici_ad, 
        u.soyad AS kullanici_soyad
      FROM 
        sarf_malzeme_islemleri si
        JOIN sarf_malzemeler sm ON si.sarf_malzeme_id = sm.id
        LEFT JOIN projeler pr ON si.proje_id = pr.id
        LEFT JOIN calisanlar c ON si.calisan_id = c.id
        LEFT JOIN kullanicilar u ON si.kullanici_id = u.id
      WHERE 
        si.kullanim_alani = 'MakineImalat'
    `);

    // Yarı mamul işlemleri için sorgu - Bu kısım değişmedi
    const [yariMamulRows] = await pool.execute(`
      SELECT 
        ymi.id AS islem_id, 
        ymi.islem_tarihi, 
        'yari_mamul' AS islem_turu,
        ym.stok_kodu, 
        ym.malzeme_adi, 
        ym.birim, 
        ymi.miktar,
        pr.proje_adi,
        ymi.islem_turu AS sarf_islem_turu,
        null AS calisan_ad, 
        null AS calisan_soyad,
        null AS makine,
        u.ad AS kullanici_ad, 
        u.soyad AS kullanici_soyad
      FROM 
        yari_mamul_islemleri ymi
        JOIN yari_mamuller ym ON ymi.yari_mamul_id = ym.id
        LEFT JOIN projeler pr ON ymi.proje_id = pr.id
        LEFT JOIN kullanicilar u ON ymi.kullanici_id = u.id
      WHERE 
        ymi.kullanim_alani = 'MakineImalat'
    `);

   

    return {
      success: true,
      islemler: [
        ...hammaddeRows,
        ...sarfMalzemeRows,
        ...yariMamulRows
      ]
    };
  } catch (error) {
    console.error('Toplu makine işlemleri getirme hatası:', error);
    return { success: false, message: error.message };
  }
}

async function getIskartaUrunlerHepsiBirlikte() {
  try {
    // Hammadde ıskarta işlemleri - "en" ve "boy" kaldırıldı
    const [hammaddeRows] = await pool.execute(`
      SELECT 
        i.id AS islem_id, 
        i.islem_tarihi, 
        'hammadde' AS islem_turu,
        h.stok_kodu, 
        h.malzeme_adi, 
        h.kalinlik, 
        p.barkod_kodu,
        i.kullanilanMiktar, 
        i.hurdaMiktar, 
        pr.proje_adi,
        i.islem_turu AS hammadde_islem_turu,
        c.ad AS calisan_ad, 
        c.soyad AS calisan_soyad,
        i.makine,
        u.ad AS kullanici_ad, 
        u.soyad AS kullanici_soyad
      FROM 
        islemler i
        JOIN parcalar p ON i.parca_id = p.id
        JOIN hammaddeler h ON p.hammadde_id = h.id
        LEFT JOIN projeler pr ON i.proje_id = pr.id
        LEFT JOIN calisanlar c ON i.calisan_id = c.id
        LEFT JOIN kullanicilar u ON i.kullanici_id = u.id
      WHERE 
        i.iskarta_urun = 1
    `);

    // Sarf malzeme ıskarta işlemleri - Bu kısım değişmedi
    const [sarfMalzemeRows] = await pool.execute(`
      SELECT 
        si.id AS islem_id, 
        si.islem_tarihi, 
        'sarf_malzeme' AS islem_turu,
        sm.stok_kodu, 
        sm.malzeme_adi, 
        sm.birim, 
        si.miktar,
        pr.proje_adi,
        si.islem_turu AS sarf_islem_turu,
        c.ad AS calisan_ad, 
        c.soyad AS calisan_soyad,
        si.makine,
        u.ad AS kullanici_ad, 
        u.soyad AS kullanici_soyad
      FROM 
        sarf_malzeme_islemleri si
        JOIN sarf_malzemeler sm ON si.sarf_malzeme_id = sm.id
        LEFT JOIN projeler pr ON si.proje_id = pr.id
        LEFT JOIN calisanlar c ON si.calisan_id = c.id
        LEFT JOIN kullanicilar u ON si.kullanici_id = u.id
      WHERE 
        si.iskarta_urun = 1
    `);

    // Yarı mamul ıskarta işlemleri - Bu kısım değişmedi
    const [yariMamulRows] = await pool.execute(`
      SELECT 
        ymi.id AS islem_id, 
        ymi.islem_tarihi, 
        'yari_mamul' AS islem_turu,
        ym.stok_kodu, 
        ym.malzeme_adi, 
        ym.birim, 
        ymi.miktar,
        pr.proje_adi,
        ymi.islem_turu AS sarf_islem_turu,
        null AS calisan_ad, 
        null AS calisan_soyad,
        null AS makine,
        u.ad AS kullanici_ad, 
        u.soyad AS kullanici_soyad
      FROM 
        yari_mamul_islemleri ymi
        JOIN yari_mamuller ym ON ymi.yari_mamul_id = ym.id
        LEFT JOIN projeler pr ON ymi.proje_id = pr.id
        LEFT JOIN kullanicilar u ON ymi.kullanici_id = u.id
      WHERE 
        ymi.iskarta_urun = 1
    `);

    // İkincil stok ıskarta işlemleri - Bu kısım değişmedi
    

    return {
      success: true,
      islemler: [
        ...hammaddeRows,
        ...sarfMalzemeRows,
        ...yariMamulRows
      ]
    };
  } catch (error) {
    console.error('Iskarta ürünleri getirme hatası:', error);
    return { success: false, message: error.message };
  }
}

// Dışa aktarılacak fonksiyonlar 
module.exports = {
  loginUser,
  registerUser,
  getAllUsers,
  
  addHammadde,
  getAllHammadde,
  getHammaddeById,
  updateHammadde,
  deleteHammaddeWithNotification,
  getHammaddeGirisGecmisi,
  kaydetHammaddeMalzemeGirisi,
  
  addSarfMalzeme,
  getAllSarfMalzeme,
  getSarfMalzemeById,
  updateSarfMalzeme,
  updateSarfMalzemeIslem,
  addSarfMalzemeIslemi,
  getSarfMalzemeIslemleri,
  getSarfMalzemeGirisGecmisi,
  kaydetSarfMalzemeGirisi,
  getSarfMalzemeIslemById,
  
  getParcalarByHammaddeId,
  updateParca,
  checkSarfMalzemeExists,
  
  addProje,
  getAllProjeler,
  
  addIslem,
  getIslemById,
  getIslemlerByParcaId,
  getIslemlerByProjeId,
  updateIslem,
  verifyAdminRegistration,
  updateYariMamulIslem, 


  addYariMamul,
  getAllYariMamuller,
  getYariMamulById,
  getYariMamulIslemById,
  addYariMamulIslemi,
  deleteYariMamulWithNotification,
  checkHammaddeExists,
  getActivePartCount,
  getAllTedarikci,
  addTedarikci,
  deleteTedarikci,
        getYariMamulGirisGecmisi,
        kaydetYariMamulGirisi,
        updateSarfMalzemeGirisi,
        updateHammaddeMalzemeGirisi,
        getSarfMalzemeGirisById,
        getHammaddeGirisById,
        calculateBoruWeight,
  calculateMilWeight,
deleteSarfMalzemeIslemAndRestoreStock,
deleteHammaddeIslemAndRestoreStock,
deleteYariMamulIslemAndRestoreStock,
getParcaById,
getYariMamulIslemleri,
checkYariMamulExists,
  deleteSarfMalzemeWithNotification,
  getAllCalisan,
    getCalisanById,
    addCalisan,
    deleteCalisan,
    addPlaka,
  getPlakaListByHammaddeId,
  getPlakaById,
  getPlakaParcalariByPlakaId,
  addPlakaIslem,
  getIslemlerByPlakaId,
  updateHammaddeDurum,
  addParcaIslem,
  addTopluHammaddeGiris,
  addMusteri,
  getAllMusteriler,
  getIslemlerByHammaddeId,
  getAllIslemdekiPlakalar,
  addPlakaToIslemde,
  removeFromIslemde,
  removePlakaFromIslemde,
  loadHammaddeFasonIslemlerById,
  loadHammaddeMakineIslemlerById,
  getFasonIslemlerHepsiBirlikte,
  getMakineIslemlerHepsiBirlikte,
  getIskartaUrunlerHepsiBirlikte




};