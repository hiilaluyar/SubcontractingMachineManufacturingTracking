// src/database/email-service.js
// Basitleştirilmiş ve minimum hata olasılığı olan e-posta servisi

// Nodemailer kütüphanesini import et
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (error) {
  console.warn('Nodemailer kütüphanesi yüklenemedi, e-posta işlevleri devre dışı kalacak.');
}

/**
 * Silme işlemi bildirimi gönderen email servisi
 */
class EmailService {
  constructor() {
    this.isEnabled = !!nodemailer;
    this.transporter = null;
    
    if (this.isEnabled) {
      try {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'karatasmakine0@gmail.com',
            pass: 'yemp tpxk sbyk ubvp' // Gmail app şifresi
          }
        });
        console.log('Email servisi başlatıldı.');
      } catch (error) {
        console.error('Email transporter oluşturma hatası:', error);
        this.isEnabled = false;
      }
    }
  }

  /**
   * Silme işlemini e-posta ile bildirir
   * @param {Object} deleteInfo - Silme işlemi bilgileri
   * @returns {Promise<Object>} E-posta gönderim sonucu
   */
  async sendDeleteNotification(deleteInfo) {
    // E-posta servisi devre dışı ise hata verme, sadece log
    if (!this.isEnabled || !this.transporter) {
      console.log('Email servisi devre dışı, bilgi loglanıyor:', deleteInfo);
      return { success: false, message: 'Email servisi devre dışı' };
    }
    
    try {
      const {
        itemType = 'Öğe',
        itemName = 'Bilinmeyen',
        itemId = 'ID yok',
        reason = 'Neden belirtilmedi',
        user = 'Bilinmeyen kullanıcı',
        timestamp = new Date().toLocaleString('tr-TR')
      } = deleteInfo;

      // E-posta içeriği oluştur
      const subject = `${itemType} Silme İşlemi: ${itemName}`;
      const text = `
        ${itemType} Silme İşlemi Bildirimi
        
        Silinen Öğe: ${itemName} (ID: ${itemId})
        Silme Nedeni: ${reason}
        
        İşlemi Gerçekleştiren: ${user}
        İşlem Tarihi: ${timestamp}
        
        Bu e-posta otomatik olarak gönderilmiştir.
      `;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #dc3545; border-bottom: 2px solid #f8d7da; padding-bottom: 10px;">${itemType} Silme İşlemi Bildirimi</h2>
          
          <div style="margin: 20px 0;">
            <p><strong>Silinen Öğe:</strong> ${itemName} (ID: ${itemId})</p>
            <p><strong>Silme Nedeni:</strong> ${reason}</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 20px;">
            <p><strong>İşlemi Gerçekleştiren:</strong> ${user}</p>
            <p><strong>İşlem Tarihi:</strong> ${timestamp}</p>
          </div>
          
          <div style="font-size: 12px; color: #6c757d; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">
            <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
          </div>
        </div>
      `;
      
      // E-postayı gönder
      const info = await this.transporter.sendMail({
        from: 'karatasmakine0@gmail.com',
        to: 'karatasmakine0@gmail.com', // Şirket mail adresi
        subject,
        text,
        html
      });
      
      console.log('E-posta gönderildi:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('E-posta gönderimi sırasında hata:', error);
      return { success: false, error: error.message };
    }
  }
}

// Email servisi örneğini oluştur ve ihraç et
const emailService = new EmailService();
module.exports = emailService;