const lessons = {
    ar: [
        { id: 'home-1', name: 'صف الارتكاز (ت ب س ش)', text: 'تتت ببب سسس ششش تبت سبش شبت سبت سشب' },
        { id: 'home-2', name: 'صف الارتكاز الكامل', text: 'كمنت يسيب شسيب كمنتل ايمسش نتلبي كمنت' },
        { id: 'top-1', name: 'الصف العلوي', text: 'جحخهع غفقث صض جحقث ضصغف هعخ جحقثضص' },
        { id: 'bottom-1', name: 'الصف السفلي', text: 'ئءؤر لاىة وزظ ئءؤ رلاى ةوزظ رلاىة' },
        { id: 'sentences-1', name: 'جمل كاملة', text: 'تعلم الكتابة السريعة يمنحك سرعة وانتاجية عالية في العمل والتواصل' }
    ],
    en: [
        { id: 'en-home-1', name: 'Home Row (f j d k)', text: 'fff jjj ddd kkk fjfk dkfj kdfj fjdk' },
        { id: 'en-home-2', name: 'Full Home Row', text: 'asdf jkl; ajsd fkll asdfjkl; fjdk' },
        { id: 'en-top-1', name: 'Top Row', text: 'qwer tyui op qwerty uiop qweruiop' },
        { id: 'en-bottom-1', name: 'Bottom Row', text: 'zxcv bnm zxcvbnm zxcv bnm zxcvbnm' },
        { id: 'en-sentences-1', name: 'Full Sentences', text: 'the quick brown fox jumps over the lazy dog' }
    ]
};

const keyboardLayouts = {
    ar: [
        ['ذ', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
        ['Tab', 'ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د', '\\'],
        ['Caps', 'ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط', 'Enter'],
        ['Shift', 'ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ', 'Shift'],
        ['Space']
    ],
    en: [
        ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
        ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
        ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
        ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
        ['Space']
    ]
};

let currentLang = 'ar';
let currentLessonIndex = 0;
let targetText = "";
let currentIndex = 0;
let errors = 0;
let timer = null;
let startTime = null;
let elapsedTime = 0;

const textDisplay = document.getElementById('text-display');
const lessonSelect = document.getElementById('lesson-select');
const statWpm = document.getElementById('stat-wpm');
const statAccuracy = document.getElementById('stat-accuracy');
const statTime = document.getElementById('stat-time');
const virtualKeyboard = document.getElementById('virtual-keyboard');

function initApp() {
    renderKeyboard();
    loadLessons();
    setupEventListeners();
}

function setLanguage(lang) {
    currentLang = lang;
    document.getElementById('btn-ar').classList.toggle('active', lang === 'ar');
    document.getElementById('btn-en').classList.toggle('active', lang === 'en');
    textDisplay.classList.toggle('en', lang === 'en');
    renderKeyboard();
    loadLessons();
}

function loadLessons() {
    lessonSelect.innerHTML = "";
    lessons[currentLang].forEach((lesson, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = lesson.name;
        lessonSelect.appendChild(opt);
    });
    currentLessonIndex = 0;
    resetLesson();
}

function changeLesson() {
    currentLessonIndex = parseInt(lessonSelect.value);
    resetLesson();
}

function resetLesson() {
    clearInterval(timer);
    timer = null;
    startTime = null;
    elapsedTime = 0;
    currentIndex = 0;
    errors = 0;

    targetText = lessons[currentLang][currentLessonIndex].text;
    
    statWpm.textContent = '0';
    statAccuracy.textContent = '100%';
    statTime.textContent = '00:00';

    renderText();
    highlightNextKey();
}

function renderText() {
    textDisplay.innerHTML = "";
    for (let i = 0; i < targetText.length; i++) {
        const span = document.createElement('span');
        span.classList.add('char');
        if (i === 0) span.classList.add('current');
        span.textContent = targetText[i];
        textDisplay.appendChild(span);
    }
}

function renderKeyboard() {
    virtualKeyboard.innerHTML = "";
    keyboardLayouts[currentLang].forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('kbd-row');
        row.forEach(keyVal => {
            const keyDiv = document.createElement('div');
            keyDiv.classList.add('key');
            keyDiv.setAttribute('data-key', keyVal);
            if (keyVal === 'Space') keyDiv.classList.add('space');
            else if (['Backspace', 'Enter', 'Shift', 'Caps', 'Tab'].includes(keyVal)) keyDiv.classList.add('wide');
            keyDiv.textContent = keyVal === 'Space' ? '─────' : keyVal;
            rowDiv.appendChild(keyDiv);
        });
        virtualKeyboard.appendChild(rowDiv);
    });
}

function setupEventListeners() {
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('keyup', handleKeyRelease);
}

function handleKeyPress(e) {
    if (e.key === 'Tab') e.preventDefault();

    const keyElement = findKeyElement(e.key);
    if (keyElement) keyElement.classList.add('pressed');

    if (currentIndex >= targetText.length) return;

    if (!startTime) {
        startTime = new Date();
        timer = setInterval(updateStats, 1000);
    }

    const expectedChar = targetText[currentIndex];
    const typedChar = e.key;

    if (['Shift', 'Control', 'Alt', 'CapsLock', 'Tab'].includes(typedChar)) return;

    const charSpans = textDisplay.querySelectorAll('.char');

    if (typedChar === expectedChar) {
        charSpans[currentIndex].classList.remove('current', 'incorrect');
        charSpans[currentIndex].classList.add('correct');
        currentIndex++;
        if (currentIndex < targetText.length) {
            charSpans[currentIndex].classList.add('current');
        } else {
            finishLesson();
        }
    } else {
        errors++;
        charSpans[currentIndex].classList.add('incorrect');
    }

    updateStats();
    highlightNextKey();
}

function handleKeyRelease(e) {
    const keyElement = findKeyElement(e.key);
    if (keyElement) keyElement.classList.remove('pressed');
}

function findKeyElement(key) {
    if (key === ' ') key = 'Space';
    return document.querySelector(`.key[data-key="${key}"]`) || 
           document.querySelector(`.key[data-key="${key.toLowerCase()}"]`);
}

function highlightNextKey() {
    document.querySelectorAll('.key.next-target').forEach(k => k.classList.remove('next-target'));
    if (currentIndex < targetText.length) {
        let nextChar = targetText[currentIndex];
        if (nextChar === ' ') nextChar = 'Space';
        const el = findKeyElement(nextChar);
        if (el) el.classList.add('next-target');
    }
}

function updateStats() {
    if (startTime) {
        elapsedTime = Math.floor((new Date() - startTime) / 1000);
        const mins = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
        const secs = (elapsedTime % 60).toString().padStart(2, '0');
        statTime.textContent = `${mins}:${secs}`;
    }

    const wordsTyped = currentIndex / 5;
    const timeInMins = elapsedTime / 60;
    const wpm = timeInMins > 0 ? Math.round(wordsTyped / timeInMins) : 0;
    
    const totalTyped = currentIndex + errors;
    const accuracy = totalTyped > 0 ? Math.round((currentIndex / totalTyped) * 100) : 100;

    statWpm.textContent = wpm;
    statAccuracy.textContent = `${accuracy}%`;
}

function finishLesson() {
    clearInterval(timer);
    alert(`🎉 أبدعت يا معلم! كملت الدرس بنجاح.\nالسرعة: ${statWpm.textContent} كلمة/دقيقة\nالدقة: ${statAccuracy.textContent}`);
}

initApp();
