 //LOGİN.JS

 document.addEventListener('DOMContentLoaded', function() {
    // Form elemanlarını seç
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const verificationForm = document.getElementById('verificationForm');
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    const backToRegisterBtn = document.getElementById('backToRegister');
    
    // Login-Register formları arası geçiş
    showRegisterBtn.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        document.getElementById('verification-form').style.display = 'none';
    });
    
    showLoginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('verification-form').style.display = 'none';
    });

    backToRegisterBtn.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('register-form').style.display = 'block';
        document.getElementById('verification-form').style.display = 'none';
    });
    
    // Giriş yanıtını dinle
    if (window.electronAPI && window.electronAPI.receive) {
        const removeLoginListener = window.electronAPI.receive('login-response', function(result) {
            console.log('Login response:', result);
            if (!result.success) {
                showError('login-error', result.message);
            }
        });
    } else {
        console.error('Login response listener could not be set');
    }
    
    // Kayıt yanıtını dinle
    if (window.electronAPI && window.electronAPI.receive) {
        const removeRegisterListener = window.electronAPI.receive('register-response', function(result) {
            console.log('Register response:', result);
            
            if (result.requiresVerification) {
                // Doğrulama formunu göster, hemen yap
                document.getElementById('register-form').style.display = 'none';
                document.getElementById('verification-form').style.display = 'block';
                
                // Doğrulama koduna odaklan
                const codeInput = document.getElementById('verificationCode');
                if (codeInput) {
                    codeInput.value = ''; // Önce temizle
                    codeInput.focus(); // Sonra odaklan
                }
                
                // Durumu göster
                showInfo('verification-info', 'Doğrulama kodu e-posta adresinize gönderildi. Lütfen kontrol ediniz.');
            } else if (result.success) {
                // Başarılı kayıt
                showSuccess('register-success', result.message);
                
                // Formu temizle
                registerForm.reset();
                
                // Direkt giriş formuna yönlendir
                document.getElementById('register-form').style.display = 'none';
                document.getElementById('login-form').style.display = 'block';
            } else {
                // Hata mesajı göster
                showError('register-error', result.message);
            }
        });
    } else {
        console.error('Register response listener could not be set');
    }
    
    // Doğrulama formu submit
    verificationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const verificationCode = document.getElementById('verificationCode').value.trim();
        
        // Boş değer kontrolü
        if (!verificationCode) {
            showError('verification-error', 'Lütfen doğrulama kodunu girin.');
            return;
        }
        
        console.log("Gönderilecek doğrulama kodu:", verificationCode);
        
        // API'yi kullan
        if (window.electronAPI && window.electronAPI.send) {
            // Doğrulama butonu durumunu güncelle
            const dogrulaBtn = document.querySelector('#verificationForm button[type="submit"]');
            if (dogrulaBtn) {
                dogrulaBtn.innerHTML = 'Doğrulanıyor...';
                dogrulaBtn.disabled = true;
            }
            
            // Yanıt için dinleyici oluştur
            const removeVerifyListener = window.electronAPI.receive('register-response', function(result) {
                console.log("Doğrulama yanıtı:", result);
                
                // Doğrulama butonunu geri çevir
                if (dogrulaBtn) {
                    dogrulaBtn.innerHTML = 'Doğrula';
                    dogrulaBtn.disabled = false;
                }
                
                if (result.success) {
                    // Başarı mesajı göster
                    showSuccess('verification-success', 'Doğrulama başarılı! Giriş yapabilirsiniz.');
                    
                    // Hemen giriş formuna geç
                    document.getElementById('verification-form').style.display = 'none';
                    document.getElementById('login-form').style.display = 'block';
                } else {
                    // Hata mesajı göster
                    showError('verification-error', result.message);
                }
                
                // Dinleyiciyi kaldır
                removeVerifyListener();
            });
            
            // İsteği gönder
            window.electronAPI.send('verify-admin-registration', { verificationCode });
        } else {
            console.error('Verification send method not available');
        }
    });
    
    // Login formu gönderimi
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        // Boş değer kontrolü
        if (!username || !password) {
            showError('login-error', 'Lütfen tüm alanları doldurun.');
            return;
        }
        
        console.log('Giriş deneniyor:', username);
        
        // API'yi kullan
        if (window.electronAPI && window.electronAPI.send) {
            window.electronAPI.send('login-user', { username, password });
        } else {
            console.error('Login send method not available');
        }
    });
    
    // Kayıt formu submit
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Form değerlerini al
        const ad = document.getElementById('registerAd').value.trim();
        const soyad = document.getElementById('registerSoyad').value.trim();
        const kullanici_adi = document.getElementById('registerUsername').value.trim();
        const sifre = document.getElementById('registerPassword').value;
        const sifreTekrar = document.getElementById('registerPasswordConfirm').value;
        const rol = document.getElementById('registerRole').value;
        
        // Boş değer kontrolü
        if (!ad || !soyad || !kullanici_adi || !sifre || !sifreTekrar) {
            showError('register-error', 'Lütfen tüm alanları doldurun.');
            return;
        }
        
        // Şifre eşleşme kontrolü
        if (sifre !== sifreTekrar) {
            showError('register-error', 'Şifreler eşleşmiyor.');
            return;
        }
        
        // Şifre uzunluk kontrolü
        if (sifre.length < 6) {
            showError('register-error', 'Şifre en az 6 karakter olmalıdır.');
            return;
        }
        
        // Kayıt butonunu devre dışı bırak ve mesaj göster
        const registerBtn = document.querySelector('#registerForm button[type="submit"]');
        if (registerBtn) {
            registerBtn.innerHTML = 'Kaydediliyor...';
            registerBtn.disabled = true;
        }
        
        // IPC ile kayıt isteği gönder
        if (window.electronAPI && window.electronAPI.send) {
            window.electronAPI.send('register-user', {
                ad,
                soyad,
                kullanici_adi,
                sifre,
                rol
            });
            
            // Kayıt butonunu normal duruma getir (sonraki async dinleyiciden önce)
            setTimeout(() => {
                if (registerBtn) {
                    registerBtn.innerHTML = 'Kayıt Ol';
                    registerBtn.disabled = false;
                }
            }, 500);
        } else {
            console.error('Register send method not available');
            // Kayıt butonunu normal duruma getir
            if (registerBtn) {
                registerBtn.innerHTML = 'Kayıt Ol';
                registerBtn.disabled = false;
            }
        }
    });
    
    // Hata mesajı gösterme fonksiyonu
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (!errorElement) return;
        
        errorElement.textContent = message;
        errorElement.className = 'alert error';
        errorElement.style.display = 'block';
        
        // 5 saniye sonra mesajı gizle
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
    
    // Bilgi mesajı gösterme fonksiyonu
    function showInfo(elementId, message) {
        const infoElement = document.getElementById(elementId);
        if (!infoElement) return;
        
        infoElement.textContent = message;
        infoElement.className = 'alert info';
        infoElement.style.display = 'block';
        
        // 8 saniye sonra mesajı gizle
        setTimeout(() => {
            infoElement.style.display = 'none';
        }, 8000);
    }
    
    // Başarı mesajı gösterme fonksiyonu
    function showSuccess(elementId, message) {
        const successElement = document.getElementById(elementId);
        if (!successElement) return;
        
        successElement.textContent = message;
        successElement.className = 'alert success';
        successElement.style.display = 'block';
        
        // 5 saniye sonra mesajı gizle
        setTimeout(() => {
            successElement.style.display = 'none';
        }, 5000);
    }
});
