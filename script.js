(function() {
    const GEMINI_API_KEY = "AIzaSyBB-iR9z3JGBaSka1Wdv6nJxUg1VuMU740"; 
    const container = document.getElementById('container');
    const startScreen = document.getElementById('startScreen');
    const birthdayScreen = document.getElementById('birthdayScreen');
    const startButton = document.getElementById('startButton');
    const canvas = document.getElementById('birthdayCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const instruction = document.getElementById('instruction');
    const titleElement = document.getElementById('title');
    const backgroundMusic = document.getElementById('backgroundMusic');

    const confettiCanvas = document.getElementById('confettiCanvas');
    const confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;
    let confettiParticles = [];

    let audioContext, analyser, microphone;
    let isBlowing = false;
    let micReady = false;
    let particles = [];
    let messagePlayed = false;

    let blowCount = 0;
    let canBlow = true;
    const TOTAL_BLOWS = 3;
    const COOLDOWN_TIME = 2000;

    const candles = [
        { x: 0.435, y: 0.30, isLit: true, health: TOTAL_BLOWS, flameSize: 15, candleHeight: 45, candleWidth: 6, color: '#FFFFFF' },
        { x: 0.50,  y: 0.25, isLit: true, health: TOTAL_BLOWS, flameSize: 15, candleHeight: 45, candleWidth: 6, color: '#FFFFFF' },
        { x: 0.565, y: 0.30, isLit: true, health: TOTAL_BLOWS, flameSize: 15, candleHeight: 45, candleWidth: 6, color: '#FFFFFF' },
    ];

    async function initAudio() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            analyser.fftSize = 256;
            micReady = true;
        } catch (err) {
            console.error("Izin mikrofon ditolak:", err);
            if(instruction) instruction.innerHTML = "Nyalain mikrofonnya dong<br>Coba relog halaman terus izinkan okey";
            micReady = false;
        }
    }

    function resizeCanvas() {
        if (!canvas) return;
        const holder = document.querySelector('.canvas-holder');
        if (!holder) return;
        const rect = holder.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.scale(dpr, dpr);
    }

    function resizeConfettiCanvas() {
        if (!confettiCanvas) return;
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }

    function drawCandleSticks() {
        if (!canvas || !ctx) return;
        const rect = canvas.getBoundingClientRect();
        candles.forEach(candle => {
            const baseX = rect.width * candle.x;
            const baseY = rect.height * candle.y;
            const candleWidth = candle.candleWidth;
            const candleHeight = candle.candleHeight;
            const radius = candleWidth / 3;
            const topY = baseY - candleHeight;

            ctx.beginPath();
            ctx.moveTo(baseX - candleWidth / 2, baseY);
            ctx.lineTo(baseX - candleWidth / 2, topY + radius);
            ctx.arcTo(baseX - candleWidth / 2, topY, baseX - candleWidth / 2 + radius, topY, radius);
            ctx.lineTo(baseX + candleWidth / 2 - radius, topY);
            ctx.arcTo(baseX + candleWidth / 2, topY, baseX + candleWidth / 2, topY + radius, radius);
            ctx.lineTo(baseX + candleWidth / 2, baseY);
            ctx.closePath();

            const gradient = ctx.createLinearGradient(baseX - candleWidth / 2, topY, baseX + candleWidth / 2, topY);
            gradient.addColorStop(0, '#e0e0e0');
            gradient.addColorStop(0.5, candle.color);
            gradient.addColorStop(1, '#c0c0c0');
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.fillStyle = '#4b3b3b';
            ctx.fillRect(baseX - 0.5, topY - 5, 1, 5);
        });
    }

    function drawFlames() {
        if (!canvas || !ctx) return;
        const rect = canvas.getBoundingClientRect();
        candles.forEach(candle => {
            if (candle.isLit) {
                const flameX = rect.width * candle.x;
                const topOfCandle = (rect.height * candle.y) - candle.candleHeight;
                
                const targetFlameSize = (candle.health / TOTAL_BLOWS) * 15;
                candle.flameSize += (targetFlameSize - candle.flameSize) * 0.1; 
                const currentFlameSize = candle.flameSize + (Math.random() - 0.5) * 2;
                const flameY = topOfCandle - (currentFlameSize * 0.7);

                if (currentFlameSize < 1) return;

                const glow = ctx.createRadialGradient(flameX, flameY, 0, flameX, flameY, currentFlameSize * 1.2);
                glow.addColorStop(0, 'rgba(255, 200, 100, 0.7)');
                glow.addColorStop(1, 'rgba(255, 200, 100, 0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(flameX, flameY, currentFlameSize * 1.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = `rgba(255, 165, 0, 0.8)`;
                ctx.beginPath();
                ctx.ellipse(flameX, flameY, currentFlameSize * 0.4, currentFlameSize * 0.9, 0, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = `rgba(255, 255, 0, 0.9)`;
                ctx.beginPath();
                ctx.ellipse(flameX, flameY + 2, currentFlameSize * 0.2, currentFlameSize * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    function createParticle(x, y) {
        particles.push({ x, y, size: Math.random() * 2 + 1, speedX: Math.random() - 0.5, speedY: -Math.random() * 1.5, life: 60 });
    }

    function drawParticles() {
        particles.forEach((p, index) => {
            p.x += p.speedX; p.y += p.speedY; p.life--;
            if (p.life <= 0) particles.splice(index, 1);
            else {
                if(!ctx) return;
                ctx.beginPath();
                ctx.fillStyle = `rgba(107, 114, 128, ${p.life / 60})`;
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    function createConfetti() {
        if(!confettiCanvas) return;
        const colors = ['#f472b6', '#ec4899', '#db2777', '#fde047', '#818cf8'];
        for (let i = 0; i < 200; i++) {
            confettiParticles.push({
                x: Math.random() * confettiCanvas.width,
                y: -Math.random() * confettiCanvas.height,
                size: Math.random() * 8 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedX: Math.random() * 6 - 3,
                speedY: Math.random() * 5 + 2,
                angle: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.2
            });
        }
    }

    function drawConfetti() {
        if (!confettiCanvas || !confettiCtx) return;
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        confettiParticles.forEach((p, index) => {
            p.x += p.speedX;
            p.y += p.speedY;
            p.angle += p.spin;

            if (p.y > confettiCanvas.height) {
                confettiParticles.splice(index, 1);
            } else {
                confettiCtx.save();
                confettiCtx.translate(p.x, p.y);
                confettiCtx.rotate(p.angle);
                confettiCtx.fillStyle = p.color;
                confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                confettiCtx.restore();
            }
        });
    }

    function draw() {
        if (!canvas || !ctx) return;
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        drawCandleSticks();
        drawFlames();
        drawParticles();
    }

    function checkMicLevel() {
        if (!micReady || !canBlow || !analyser) {
            isBlowing = false;
            return;
        }
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        let sum = dataArray.reduce((a, b) => a + b, 0);
        isBlowing = (sum / dataArray.length) > 45; 
    }

    function handleBlow() {
        if (!canBlow) return;
        
        canBlow = false;
        blowCount++;
        
        candles.forEach(candle => {
            if(candle.health > 0) {
                candle.health--;
                 if (candle.health <= 0) {
                     candle.isLit = false;
                     if(!canvas) return;
                     const rect = canvas.getBoundingClientRect();
                     const pX = rect.width * candle.x;
                     const pY = (rect.height * candle.y) - candle.candleHeight;
                     for(let i = 0; i < 20; i++) createParticle(pX, pY);
                 }
            }
        });

        if (candles.every(c => !c.isLit)) {
            if(instruction) instruction.textContent = "🎉 Berhasil! 🎉";
            createConfetti(); 
            setTimeout(transitionToGiftBox, 1500);
        } else {
            if(instruction) instruction.textContent = "yah kurang kenceng";
            setTimeout(() => {
                const remaining = TOTAL_BLOWS - blowCount;
                if(instruction) instruction.textContent = `Tiup lagi lah (${remaining}x)`;
                canBlow = true;
            }, COOLDOWN_TIME);
        }
    }

    let lastIsBlowing = false; 
    let animationFrameId;
    function animate() {
        animationFrameId = requestAnimationFrame(animate);
        checkMicLevel();

        if (isBlowing && !lastIsBlowing && canBlow) {
            handleBlow();
        }
        lastIsBlowing = isBlowing;
        
        draw();
        
        if (confettiParticles.length > 0) {
            drawConfetti();
        }
    }

    function transitionToGiftBox() {
        if (messagePlayed) return;
        messagePlayed = true;
        if(animationFrameId) cancelAnimationFrame(animationFrameId);
        
        const giftBox = document.getElementById('giftContainer');
        if (container) container.style.opacity = '0';

        setTimeout(() => {
            if (container) container.classList.add('hidden');
            document.body.classList.remove('cake-pattern-bg');
            document.body.style.backgroundImage = 'none';
            document.body.style.display = 'flex';
            document.body.style.justifyContent = 'center';
            document.body.style.alignItems = 'center';
            document.body.style.minHeight = '100vh';
            
            if (giftBox) {
                giftBox.classList.remove('hidden');
                giftBox.style.opacity = '0';
                giftBox.style.transform = 'scale(0.8)';
                giftBox.style.transition = 'opacity 0.5s ease-in, transform 0.5s ease-in';
                setTimeout(() => {
                    giftBox.style.opacity = '1';
                    giftBox.style.transform = 'scale(1)';
                }, 50);
            }
        }, 800);
    }
    
    // --- Bagian Galeri & Surat ---
    function setupGallery() {
        let slideIndex = 1;
        let typingInterval;
        const giftContainer = document.getElementById('giftContainer');
        const galleryContainer = document.getElementById('galleryContainer');
        const closeGallery = document.getElementById('closeGallery');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const galleryContent = document.querySelector('.gallery-content');
        const letterContainer = document.getElementById('letter-container');
        const repeatGalleryBtn = document.getElementById('repeatGalleryBtn');
        
        const nextSurpriseBtn = document.getElementById('nextSurpriseBtn');
        const poemContainer = document.getElementById('poem-container');
        const generatePoemBtn = document.getElementById('generatePoemBtn');
        const poemPlaceholder = document.getElementById('poem-placeholder');
        const poemLoader = document.getElementById('poem-loader');
        const finishBtn = document.getElementById('finishBtn');

        const slides = document.getElementsByClassName("gallery-slide");
        if (!slides) return;
        const TOTAL_SLIDES = slides.length;

        if (giftContainer) {
            giftContainer.addEventListener('click', () => {
                giftContainer.classList.add('clicked');
                setTimeout(() => {
                    if (galleryContainer) {
                        galleryContainer.classList.add('show');
                        galleryContainer.style.display = 'flex';
                        galleryContainer.setAttribute('aria-hidden', 'false');
                        showSlides(slideIndex = 1);
                    }
                }, 200);
                setTimeout(() => {
                    giftContainer.classList.remove('clicked');
                }, 400);
            });
        }

        if (closeGallery) {
            closeGallery.addEventListener('click', closeGalleryFunc);
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && galleryContainer && galleryContainer.classList.contains('show')) {
                closeGalleryFunc();
            }
        });
        if (galleryContainer) {
            galleryContainer.addEventListener('click', (e) => {
                if (e.target === galleryContainer) {
                    closeGalleryFunc();
                }
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => plusSlides(-1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => plusSlides(1));
        }
        
        if (repeatGalleryBtn) {
            repeatGalleryBtn.addEventListener('click', () => {
                hidePoem();
                hideLetter();
            });
        }

        function closeGalleryFunc() {
            if (galleryContainer) {
                galleryContainer.classList.remove('show');
                galleryContainer.setAttribute('aria-hidden', 'true');
                hideLetter(false); 
                hidePoem();
                setTimeout(() => { 
                    if(galleryContainer) galleryContainer.style.display = 'none'; 
                }, 400);
            }
        }

        function plusSlides(n) {
            if (slideIndex === TOTAL_SLIDES && n === 1) {
                showLetter();
            } 
            else if (slideIndex === 1 && n === -1) {
                showSlides(slideIndex = TOTAL_SLIDES);
            }
            else {
                showSlides(slideIndex += n);
            }
        }
        
        function showLetter() {
            if (galleryContent && letterContainer) {
                galleryContent.classList.add('letter-mode');
                letterContainer.style.display = 'flex';
                const paragraphs = letterContainer.querySelectorAll('.typing-text');
                paragraphs.forEach(p => p.innerHTML = '');
                setTimeout(() => {
                    letterContainer.classList.add('show');
                    startTypingSequence(paragraphs); 
                }, 10);
            }
        }

        function hideLetter(stayInPlace = false) {
            if(typingInterval) clearInterval(typingInterval);
            if (galleryContent && letterContainer) {
                galleryContent.classList.remove('letter-mode');
                letterContainer.classList.remove('show');
                setTimeout(() => {
                    if(letterContainer) letterContainer.style.display = 'none';
                    letterContainer.querySelectorAll('.typing-text').forEach(p => p.innerHTML = '');
                }, 500);
                if (!stayInPlace) {
                    showSlides(slideIndex = 1);
                }
            }
        }
        
        function showPoem() {
            if (galleryContent && poemContainer) {
                hideLetter(true); 
                galleryContent.classList.add('poem-mode');
                poemContainer.style.display = 'flex';
                setTimeout(() => {
                    poemContainer.classList.add('show');
                }, 10);
            }
        }
        
        function hidePoem() {
             if (galleryContent && poemContainer) {
                galleryContent.classList.remove('poem-mode');
                poemContainer.classList.remove('show');
                setTimeout(() => {
                    if(poemContainer) poemContainer.style.display = 'none';
                }, 500);
             }
        }

        if (nextSurpriseBtn) {
            nextSurpriseBtn.addEventListener('click', showPoem);
        }

        if (generatePoemBtn) {
            generatePoemBtn.addEventListener('click', generatePoem);
        }
        if (finishBtn) {
            finishBtn.addEventListener('click', closeGalleryFunc);
        }

        async function generatePoem() {
            if (!GEMINI_API_KEY) {
                if(poemPlaceholder) poemPlaceholder.innerText = "Maaf, fitur ini sedang tidak aktif karena API Key belum diatur.";
                return;
            }

            if(generatePoemBtn) generatePoemBtn.classList.add('hidden');
            if(poemLoader) poemLoader.classList.remove('hidden');
            
            const prompt = "Tuliskan sebuah puisi motivasi yang singkat (3-4 bait) dan kuat untuk seseorang bernama Ulan di hari ulang tahunnya. Puisi ini BUKAN tentang cinta romantis, melainkan tentang semangat juang, menghadapi ketakutan, dan tidak pernah menyerah pada impian. Gunakan bahasa yang indah, puitis, dan membangkitkan semangat dalam Bahasa Indonesia.";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
            
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    })
                });

                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }

                const result = await response.json();
                const poemText = result.candidates[0].content.parts[0].text;
                
                if(poemLoader) poemLoader.classList.add('hidden');
                if(poemPlaceholder) {
                    poemPlaceholder.setAttribute('data-text', poemText);
                    typewriter(poemPlaceholder, () => {
                       if(finishBtn) finishBtn.classList.remove('hidden');
                    });
                }

            } catch (error) {
                console.error("Error generating poem:", error);
                if(poemLoader) poemLoader.classList.add('hidden');
                if(poemPlaceholder) poemPlaceholder.innerText = "Maaf, terjadi kesalahan saat membuat puisi. Coba lagi nanti ya.";
                if(generatePoemBtn) generatePoemBtn.classList.remove('hidden');
            }
        }
        
        function typewriter(element, callback) {
            if (!element) return;
            const textContent = element.getAttribute('data-text') || '';
            const chars = Array.from(textContent);
            let index = 0;
            element.innerHTML = '';
            element.classList.add('typing');
            
            if(typingInterval) clearInterval(typingInterval);
            
            typingInterval = setInterval(() => {
                if (index < chars.length) {
                    element.innerHTML += chars[index];
                    index++;
                } else {
                    clearInterval(typingInterval);
                    element.classList.remove('typing');
                    if (callback) callback();
                }
            }, 50);
        }

        async function startTypingSequence(paragraphs) {
            if (!paragraphs) return;
            for (const p of paragraphs) {
                await new Promise(resolve => typewriter(p, resolve));
            }
        }

        function showSlides(n) {
            if (!slides || slides.length === 0) return;
            if (n > slides.length) { slideIndex = 1; }
            if (n < 1) { slideIndex = slides.length; }
            for (let i = 0; i < slides.length; i++) {
                slides[i].style.display = "none";
                slides[i].classList.remove("active");
            }
            const activeSlide = slides[slideIndex - 1];
            if(activeSlide) {
                activeSlide.style.display = "flex";
                activeSlide.classList.add("active");
            }
        }
        
        if (galleryContent) {
            let startX = 0, isDown = false;
            const handleSwipe = (diff) => {
                if (Math.abs(diff) > 50) {
                    plusSlides(diff < 0 ? 1 : -1);
                    isDown = false;
                }
            };
            galleryContent.addEventListener('touchstart', e => { isDown = true; startX = e.touches[0].clientX; }, { passive: true });
            galleryContent.addEventListener('touchmove', e => {
                if (!isDown) return;
                handleSwipe(e.touches[0].clientX - startX);
            }, { passive: true });
            galleryContent.addEventListener('touchend', () => { isDown = false; });
            galleryContent.addEventListener('mousedown', e => { isDown = true; startX = e.clientX; });
            galleryContent.addEventListener('mousemove', e => {
                if (!isDown) return;
                e.preventDefault();
                handleSwipe(e.clientX - startX);
            });
            ['mouseup', 'mouseleave'].forEach(evt => galleryContent.addEventListener(evt, () => { isDown = false; }));
        }

        function seededRandom(seed) { let x = Math.sin(seed++) * 10000; return x - Math.floor(x); }
        function randomPos(exclude, seed) {
            let top, left, tries = 0;
            do {
                top = Math.floor(seededRandom(seed + tries) * 180) + 10;
                left = Math.floor(seededRandom(seed + tries + 100) * 170) + 10;
                tries++;
            } while (exclude.some(e => Math.abs(e.top - top) < 24 && Math.abs(e.left - left) < 24) && tries < 50);
            return { top, left };
        }
        const decorations = document.querySelector('.decorations');
        if (decorations) {
            decorations.querySelectorAll('.circle, .heart').forEach(e => e.remove());
            const stars = decorations.querySelectorAll('.star');
            let existingPos = [];
            if(stars) {
                stars.forEach((star) => {
                    const style = window.getComputedStyle(star);
                    existingPos.push({ top: parseInt(style.top) || 0, left: parseInt(style.left) || 0 });
                });
            }
            let seed = 20250829;
            for (let i = 0; i < 2; i++) {
                let pos = randomPos(existingPos, seed + i * 10);
                let circle = document.createElement('span');
                circle.className = 'circle';
                circle.style.top = pos.top + 'px';
                circle.style.left = pos.left + 'px';
                circle.style.background = i === 0 ? '#ffd54f' : '#81d4fa';
                decorations.appendChild(circle);
                existingPos.push(pos);
            }
            for (let i = 0; i < 2; i++) {
                let pos = randomPos(existingPos, seed + 100 + i * 10);
                let heart = document.createElement('span');
                heart.className = 'heart';
                heart.style.top = pos.top + 'px';
                heart.style.left = pos.left + 'px';
                decorations.appendChild(heart);
                existingPos.push(pos);
            }
        }
    }

    // --- Inisialisasi Utama ---
    if (startButton) {
        startButton.addEventListener('click', () => {
            if(startScreen) startScreen.style.opacity = '0';
            setTimeout(() => {
                if(startScreen) startScreen.classList.add('hidden');
                if(document.body) document.body.classList.add('cake-pattern-bg');
                if(birthdayScreen) {
                    birthdayScreen.classList.remove('hidden');
                    birthdayScreen.style.opacity = '0';
                }
                
                requestAnimationFrame(() => {
                    if(backgroundMusic) backgroundMusic.play().catch(e => console.log("Gagal memutar musik:", e));
                    if(birthdayScreen) birthdayScreen.style.opacity = '1';
                });

                initAudio().then(() => {
                    requestAnimationFrame(() => {
                        resizeCanvas();
                        resizeConfettiCanvas();
                        animate();
                        if(titleElement) titleElement.classList.add('animated-title');
                        
                        if (micReady && instruction) {
                            instruction.textContent = "Ayo, tiup lilinnya ";
                        }
                    });
                });
            }, 500); 
        });
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        resizeConfettiCanvas(); 
    });
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupGallery);
    } else {
        setupGallery();
    }

})();

