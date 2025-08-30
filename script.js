// ===== BAGIAN 1: SCRIPT TIUP LILIN =====

const container = document.getElementById('container');
const startScreen = document.getElementById('startScreen');
const birthdayScreen = document.getElementById('birthdayScreen');
const startButton = document.getElementById('startButton');
const canvas = document.getElementById('birthdayCanvas');
const ctx = canvas.getContext('2d');
const instruction = document.getElementById('instruction');
const titleElement = document.getElementById('title');
const backgroundMusic = document.getElementById('backgroundMusic');

const confettiCanvas = document.getElementById('confettiCanvas');
const confettiCtx = confettiCanvas.getContext('2d');
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
        instruction.innerHTML = "Nyalain mikrofonnya dong<br>Coba relog halaman terus izinkan okey";
        micReady = false;
    }
}

function resizeCanvas() {
    const holder = document.querySelector('.canvas-holder');
    const rect = holder.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);
}

function resizeConfettiCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}

function drawCandleSticks() {
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
            ctx.beginPath();
            ctx.fillStyle = `rgba(107, 114, 128, ${p.life / 60})`;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function createConfetti() {
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
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    drawCandleSticks();
    drawFlames();
    drawParticles();
}

function checkMicLevel() {
    if (!micReady || !canBlow) {
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
                 const rect = canvas.getBoundingClientRect();
                 const pX = rect.width * candle.x;
                 const pY = (rect.height * candle.y) - candle.candleHeight;
                 for(let i = 0; i < 20; i++) createParticle(pX, pY);
             }
        }
    });

    if (candles.every(c => !c.isLit)) {
        instruction.textContent = "🎉 Berhasil! 🎉";
        createConfetti(); 
        setTimeout(transitionToGiftBox, 1500); // INI TITIK TRANSISINYA
    } else {
        instruction.textContent = "yah kurang kenceng";
        setTimeout(() => {
            const remaining = TOTAL_BLOWS - blowCount;
            instruction.textContent = `Tiup lagi lah (${remaining}x)`;
            canBlow = true;
        }, COOLDOWN_TIME);
    }
}

let lastIsBlowing = false; 
function animate() {
    requestAnimationFrame(animate);
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

// FUNGSI TRANSISI BARU
function transitionToGiftBox() {
    if (messagePlayed) return;
    messagePlayed = true;
    
    const giftBox = document.getElementById('giftContainer');
    
    // 1. Fade out container kue
    container.style.opacity = '0';

    setTimeout(() => {
        // 2. Sembunyikan container kue
        container.classList.add('hidden');

        // 3. Ubah style body untuk bagian kado
        document.body.style.backgroundImage = 'none';
        document.body.style.display = 'flex';
        document.body.style.justifyContent = 'center';
        document.body.style.alignItems = 'center';
        document.body.style.minHeight = '100vh';
        
        // 4. Tampilkan kotak kado dengan animasi
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

    }, 800); // Sesuaikan dengan durasi transisi di CSS
}


startButton.addEventListener('click', async () => {
    backgroundMusic.play().catch(e => console.log("Gagal memutar musik:", e));

    startScreen.classList.add('hidden');
    birthdayScreen.classList.remove('hidden');
    
    await initAudio();

    requestAnimationFrame(() => {
        resizeCanvas(); 
        resizeConfettiCanvas(); 
        animate();
        titleElement.classList.add('animated-title');
        
        if (micReady) {
            instruction.textContent = "Ayo, tiup lilinnya ";
        }
    });
});

window.addEventListener('resize', () => {
    resizeCanvas();
    resizeConfettiCanvas(); 
});


// ===== BAGIAN 2: SCRIPT KOTAK KADO & GALERI =====

document.addEventListener('DOMContentLoaded', () => {
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
    
    const slides = document.getElementsByClassName("gallery-slide");
    const TOTAL_SLIDES = slides.length;

    if (giftContainer) {
        giftContainer.addEventListener('click', () => {
            giftContainer.classList.add('clicked');
            setTimeout(() => {
                if (galleryContainer) {
                    galleryContainer.classList.add('show');
                    galleryContainer.style.display = 'flex';
                    galleryContainer.setAttribute('aria-hidden', 'false');
                    showSlides(slideIndex);
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
        repeatGalleryBtn.addEventListener('click', hideLetter);
    }

    function closeGalleryFunc() {
        if (galleryContainer) {
            galleryContainer.classList.remove('show');
            galleryContainer.setAttribute('aria-hidden', 'true');
            hideLetter();
            setTimeout(() => { 
                galleryContainer.style.display = 'none'; 
            }, 400);
        }
    }

    function plusSlides(n) {
        const nextIndex = slideIndex + n;
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
            const paragraphs = document.querySelectorAll('.typing-text');
            paragraphs.forEach(p => p.innerHTML = '');
            setTimeout(() => {
                letterContainer.classList.add('show');
                startTypingSequence(paragraphs); 
            }, 10);
        }
    }

    function hideLetter() {
        clearInterval(typingInterval);
        if (galleryContent && letterContainer) {
            galleryContent.classList.remove('letter-mode');
            letterContainer.classList.remove('show');
            setTimeout(() => {
                letterContainer.style.display = 'none';
                document.querySelectorAll('.typing-text').forEach(p => p.innerHTML = '');
            }, 500);
            showSlides(slideIndex = 1);
        }
    }

    function typewriter(element, callback) {
        const text = element.getAttribute('data-text');
        let index = 0;
        element.innerHTML = '';
        element.classList.add('typing');
        typingInterval = setInterval(() => {
            if (index < text.length) {
                element.innerHTML += text.charAt(index);
                index++;
            } else {
                clearInterval(typingInterval);
                element.classList.remove('typing');
                if (callback) callback();
            }
        }, 60);
    }

    async function startTypingSequence(paragraphs) {
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
            slides[i].classList.remove("active", "left", "right");
        }
        const activeSlide = slides[slideIndex - 1];
        const leftSlideIndex = (slideIndex - 2 + slides.length) % slides.length;
        const rightSlideIndex = slideIndex % slides.length;
        const leftSlide = slides[leftSlideIndex];
        const rightSlide = slides[rightSlideIndex];
        activeSlide.style.display = "flex";
        activeSlide.classList.add("active");
        if (leftSlide && leftSlide !== activeSlide) {
            leftSlide.style.display = "flex";
            leftSlide.classList.add("left");
        }
        if (rightSlide && rightSlide !== activeSlide) {
            rightSlide.style.display = "flex";
            rightSlide.classList.add("right");
        }
    }
    
    if (galleryContent) {
        let startX = 0, isDown = false;
        galleryContent.addEventListener('touchstart', e => { isDown = true; startX = e.touches[0].clientX; }, { passive: true });
        galleryContent.addEventListener('touchmove', e => {
            if (!isDown) return;
            let diff = e.touches[0].clientX - startX;
            if (Math.abs(diff) > 50) {
                plusSlides(diff < 0 ? 1 : -1);
                isDown = false;
            }
        }, { passive: true });
        galleryContent.addEventListener('touchend', () => { isDown = false; });
        galleryContent.addEventListener('mousedown', e => { isDown = true; startX = e.clientX; });
        galleryContent.addEventListener('mousemove', e => {
            if (!isDown) return;
            e.preventDefault();
            let diff = e.clientX - startX;
            if (Math.abs(diff) > 50) {
                plusSlides(diff < 0 ? 1 : -1);
                isDown = false;
            }
        });
        ['mouseup', 'mouseleave'].forEach(evt => galleryContent.addEventListener(evt, () => { isDown = false; }));
    }

    // Fungsi untuk dekorasi kado tetap seperti aslinya
    function seededRandom(seed) { let x = Math.sin(seed++) * 10000; return x - Math.floor(x); }
    function randomPos(exclude, seed) {
        let top, left, size, overlap, tries = 0;
        do {
            top = Math.floor(seededRandom(seed + tries) * 180) + 10;
            left = Math.floor(seededRandom(seed + tries + 100) * 170) + 10;
            size = 16;
            overlap = exclude.some(e => Math.abs(e.top - top) < 24 && Math.abs(e.left - left) < 24);
            tries++;
        } while (overlap && tries < 50);
        return { top, left, size };
    }
    const decorations = document.querySelector('.decorations');
    if (decorations) {
        decorations.querySelectorAll('.circle, .heart').forEach(e => e.remove());
        const stars = decorations.querySelectorAll('.star');
        let starPos = [];
        stars.forEach((star) => {
            const style = window.getComputedStyle(star);
            const top = parseInt(style.top) || 0;
            const left = parseInt(style.left) || 0;
            const size = parseInt(style.fontSize) || 18;
            starPos.push({ top, left, size });
        });
        let seed = 20250829;
        for (let i = 0; i < 2; i++) {
            let pos = randomPos(starPos, seed + i * 10);
            let circle = document.createElement('span');
            circle.className = 'circle';
            circle.style.top = pos.top + 'px';
            circle.style.left = pos.left + 'px';
            circle.style.background = i == 0 ? '#ffd54f' : '#81d4fa';
            decorations.appendChild(circle);
            starPos.push(pos);
        }
        for (let i = 0; i < 2; i++) {
            let pos = randomPos(starPos, seed + 100 + i * 10);
            let heart = document.createElement('span');
            heart.className = 'heart';
            heart.style.top = pos.top + 'px';
            heart.style.left = pos.left + 'px';
            decorations.appendChild(heart);
            starPos.push(pos);
        }
    }
});
