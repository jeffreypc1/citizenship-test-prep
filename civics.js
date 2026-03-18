/* ============================================================
   USCIS Civics Test Practice — JavaScript
   Features: voice selection, self-assessment, streak mode,
   score history, dark mode, sound effects, keyboard shortcuts
   ============================================================ */

(function () {
    "use strict";

    // ---- State ----
    let questions = [];
    let testVersion = null;
    let currentMode = "flashcards";

    // Flashcard state
    let fcIndex = 0;
    let fcFiltered = [];
    let fcFlipped = false;
    let fcCorrectCount = 0;
    let fcWrongCount = 0;
    let fcWeakFilterActive = false;

    // Listen state
    let listenIndex = 0;
    let listenFiltered = [];
    let listenPlaying = false;
    let listenUtterance = null;

    // Practice state
    let practiceQuestions = [];
    let practiceIndex = 0;
    let practiceScore = 0;
    let practiceAnswers = [];
    let practiceTimerInterval = null;
    let practiceTimeLeft = 30;
    let practiceTimerEnabled = false;
    let practiceSelectedChoice = null;
    let practiceQuestionCount = 10;
    let practiceStreakMode = false;
    let practiceStreak = 0;
    let practiceTotalAsked = 0;

    // Study state
    let knownQuestions = new Set();

    // Voice state
    let selectedVoice = null;
    let voicesLoaded = false;

    // Sound effects
    let soundEnabled = true;
    let audioCtx = null;

    // ---- DOM Helpers ----
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ---- Storage keys ----
    function storageKey(suffix) {
        return "civics_" + testVersion + "_" + suffix;
    }

    function globalKey(suffix) {
        return "civics_" + suffix;
    }

    function loadKnown() {
        try {
            const data = localStorage.getItem(storageKey("known"));
            if (data) knownQuestions = new Set(JSON.parse(data));
        } catch (e) { /* ignore */ }
    }

    function saveKnown() {
        try {
            localStorage.setItem(storageKey("known"), JSON.stringify([...knownQuestions]));
        } catch (e) { /* ignore */ }
    }

    // ---- Per-question performance (for flash cards) ----
    function loadQuestionPerf() {
        try {
            const data = localStorage.getItem(storageKey("fc_perf"));
            return data ? JSON.parse(data) : {};
        } catch (e) { return {}; }
    }

    function saveQuestionPerf(perf) {
        try {
            localStorage.setItem(storageKey("fc_perf"), JSON.stringify(perf));
        } catch (e) { /* ignore */ }
    }

    function recordFcPerf(qid, correct) {
        const perf = loadQuestionPerf();
        if (!perf[qid]) perf[qid] = { right: 0, wrong: 0 };
        if (correct) perf[qid].right++;
        else perf[qid].wrong++;
        saveQuestionPerf(perf);
    }

    function getWeakQuestionIds() {
        const perf = loadQuestionPerf();
        const weak = [];
        for (const [qid, stats] of Object.entries(perf)) {
            if (stats.wrong > 0) weak.push(parseInt(qid, 10));
        }
        return weak;
    }

    // ---- Score History ----
    function loadHistory() {
        try {
            const data = localStorage.getItem(storageKey("history"));
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    }

    function saveHistory(history) {
        try {
            localStorage.setItem(storageKey("history"), JSON.stringify(history));
        } catch (e) { /* ignore */ }
    }

    function addHistoryEntry(entry) {
        const history = loadHistory();
        history.push(entry);
        // Keep last 50
        if (history.length > 50) history.splice(0, history.length - 50);
        saveHistory(history);
    }

    // ---- Dark Mode ----
    function initDarkMode() {
        const saved = localStorage.getItem(globalKey("dark_mode"));
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const dark = saved === "true" || (saved === null && prefersDark);
        applyDarkMode(dark);

        $("#darkModeToggle").addEventListener("click", () => {
            const isDark = document.documentElement.getAttribute("data-theme") === "dark";
            applyDarkMode(!isDark);
            localStorage.setItem(globalKey("dark_mode"), (!isDark).toString());
        });
    }

    function applyDarkMode(dark) {
        document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
        const sunIcon = $(".icon-sun");
        const moonIcon = $(".icon-moon");
        if (dark) {
            sunIcon.style.display = "none";
            moonIcon.style.display = "";
        } else {
            sunIcon.style.display = "";
            moonIcon.style.display = "none";
        }
    }

    // ---- Voice Selection ----
    function initVoiceSelection() {
        const select = $("#voiceSelect");

        function populateVoices() {
            const voices = speechSynthesis.getVoices();
            if (!voices.length) return;
            voicesLoaded = true;

            select.innerHTML = "";
            const defaultOpt = document.createElement("option");
            defaultOpt.value = "";
            defaultOpt.textContent = "Default voice";
            select.appendChild(defaultOpt);

            voices.forEach((voice, i) => {
                const opt = document.createElement("option");
                opt.value = i;
                opt.textContent = voice.name + " (" + voice.lang + ")";
                if (voice.default) opt.textContent += " - Default";
                select.appendChild(opt);
            });

            // Restore saved voice
            const savedVoice = localStorage.getItem(globalKey("voice"));
            if (savedVoice) {
                const idx = voices.findIndex(v => v.name === savedVoice);
                if (idx >= 0) {
                    select.value = idx;
                    selectedVoice = voices[idx];
                }
            }
        }

        if ("speechSynthesis" in window) {
            populateVoices();
            speechSynthesis.onvoiceschanged = populateVoices;
        }

        select.addEventListener("change", () => {
            const voices = speechSynthesis.getVoices();
            if (select.value === "") {
                selectedVoice = null;
                localStorage.removeItem(globalKey("voice"));
            } else {
                const idx = parseInt(select.value, 10);
                selectedVoice = voices[idx] || null;
                if (selectedVoice) {
                    localStorage.setItem(globalKey("voice"), selectedVoice.name);
                }
            }
        });
    }

    // ---- Sound Effects ----
    function initSoundEffects() {
        const saved = localStorage.getItem(globalKey("sound"));
        soundEnabled = saved !== "false";
        updateSoundToggle();

        $("#soundToggle").addEventListener("click", () => {
            soundEnabled = !soundEnabled;
            localStorage.setItem(globalKey("sound"), soundEnabled.toString());
            updateSoundToggle();
        });
    }

    function updateSoundToggle() {
        const toggle = $("#soundToggle");
        toggle.setAttribute("aria-checked", soundEnabled.toString());
    }

    function getAudioCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    function playCorrectSound() {
        if (!soundEnabled) return;
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) { /* ignore */ }
    }

    function playWrongSound() {
        if (!soundEnabled) return;
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(311.13, ctx.currentTime); // Eb4
            osc.frequency.setValueAtTime(277.18, ctx.currentTime + 0.15); // Db4
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) { /* ignore */ }
    }

    // ---- Modals ----
    function initModals() {
        // Settings
        $("#settingsToggle").addEventListener("click", () => {
            $("#settingsModal").style.display = "";
        });
        $("#settingsClose").addEventListener("click", () => {
            $("#settingsModal").style.display = "none";
        });
        $("#settingsModal").addEventListener("click", (e) => {
            if (e.target === $("#settingsModal")) $("#settingsModal").style.display = "none";
        });

        // Shortcuts
        $("#shortcutsToggle").addEventListener("click", () => {
            $("#shortcutsModal").style.display = "";
        });
        $("#shortcutsClose").addEventListener("click", () => {
            $("#shortcutsModal").style.display = "none";
        });
        $("#shortcutsModal").addEventListener("click", (e) => {
            if (e.target === $("#shortcutsModal")) $("#shortcutsModal").style.display = "none";
        });

        // ESC to close
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                $("#settingsModal").style.display = "none";
                $("#shortcutsModal").style.display = "none";
            }
        });
    }

    // ---- Test Selection ----
    function initTestSelection() {
        $$(".test-card").forEach((card) => {
            card.addEventListener("click", () => {
                testVersion = card.dataset.test;
                loadTest(testVersion);
            });
        });

        $("#backToSelect").addEventListener("click", () => {
            stopListening();
            stopPracticeTimer();
            $("#testSelection").style.display = "";
            $("#studyApp").style.display = "none";
            $("#backToSelect").style.display = "none";
            testVersion = null;
        });
    }

    async function loadTest(version) {
        // Show skeleton
        $("#skeletonLoader").style.display = "";
        $("#testSelection").style.display = "none";

        try {
            const resp = await fetch("civics_" + version + ".json");
            if (!resp.ok) throw new Error("Failed to load questions");
            questions = await resp.json();
        } catch (e) {
            alert("Error loading questions. Please try again.");
            $("#skeletonLoader").style.display = "none";
            $("#testSelection").style.display = "";
            return;
        }

        // Brief delay for visual feedback
        await new Promise(r => setTimeout(r, 300));
        $("#skeletonLoader").style.display = "none";

        loadKnown();
        populateCategoryFilters();
        showStudyApp();
        switchMode("flashcards");
    }

    function showStudyApp() {
        $("#testSelection").style.display = "none";
        $("#studyApp").style.display = "";
        $("#backToSelect").style.display = "";
    }

    // ---- Categories ----
    function getCategories() {
        const cats = new Map();
        questions.forEach((q) => {
            const key = q.category;
            if (!cats.has(key)) cats.set(key, new Set());
            cats.get(key).add(q.subcategory);
        });
        return cats;
    }

    function populateCategoryFilters() {
        const cats = getCategories();
        const options = '<option value="all">All Categories</option>' +
            Array.from(cats.keys()).map((c) =>
                '<option value="' + escHtml(c) + '">' + escHtml(c) + '</option>'
            ).join("");

        $("#fcCategoryFilter").innerHTML = options;
        $("#listenCategoryFilter").innerHTML = options;
    }

    function filterByCategory(cat) {
        if (cat === "all") return [...questions];
        return questions.filter((q) => q.category === cat);
    }

    // ---- Mode Switching ----
    function initModeTabs() {
        $$(".mode-tab").forEach((tab) => {
            tab.addEventListener("click", () => {
                switchMode(tab.dataset.mode);
            });
        });
    }

    function switchMode(mode) {
        stopListening();
        currentMode = mode;

        $$(".mode-tab").forEach((t) => {
            const isActive = t.dataset.mode === mode;
            t.classList.toggle("active", isActive);
            t.setAttribute("aria-selected", isActive);
        });

        $$(".mode-panel").forEach((p) => {
            p.classList.toggle("active", p.id === "panel-" + mode);
        });

        if (mode === "flashcards") initFlashcards();
        else if (mode === "listen") initListen();
        else if (mode === "practice") initPractice();
        else if (mode === "study") initStudy();
        else if (mode === "history") renderHistory();
    }

    // ---- Flash Cards ----
    function initFlashcards() {
        let filtered = filterByCategory($("#fcCategoryFilter").value);

        if (fcWeakFilterActive) {
            const weakIds = getWeakQuestionIds();
            filtered = filtered.filter(q => weakIds.includes(q.id));
        }

        fcFiltered = filtered;
        fcIndex = 0;
        fcFlipped = false;
        fcCorrectCount = 0;
        fcWrongCount = 0;
        renderFlashcard();
        updateFcScore();
    }

    function renderFlashcard() {
        if (!fcFiltered.length) {
            $("#fcQuestion").textContent = fcWeakFilterActive
                ? "No weak questions found! Great job!"
                : "No questions in this category.";
            $("#fcCategory").textContent = "";
            $("#fcCategoryBack").textContent = "";
            $("#fcAnswers").innerHTML = "";
            $("#fcProgress").textContent = "0 / 0";
            updateFcProgressBar();
            return;
        }
        const q = fcFiltered[fcIndex];
        fcFlipped = false;
        $("#flashcard").classList.remove("flipped");
        $("#fcAssessment").style.display = "none";

        $("#fcCategory").textContent = q.subcategory || q.category;
        $("#fcCategoryBack").textContent = q.subcategory || q.category;
        $("#fcQuestion").textContent = q.id + ". " + q.question;
        $("#fcProgress").textContent = (fcIndex + 1) + " / " + fcFiltered.length;

        const answersEl = $("#fcAnswers");
        answersEl.innerHTML = "";
        q.answers.forEach((a) => {
            const li = document.createElement("li");
            li.textContent = a;
            answersEl.appendChild(li);
        });

        if (q.variable) {
            const li = document.createElement("li");
            li.textContent = "(Answer varies by location/time)";
            li.style.fontStyle = "italic";
            li.style.opacity = "0.6";
            answersEl.appendChild(li);
        }

        updateFcProgressBar();
    }

    function updateFcProgressBar() {
        const bar = $("#fcProgressBar");
        if (!fcFiltered.length) {
            bar.style.width = "0%";
            bar.setAttribute("aria-valuenow", 0);
            return;
        }
        const pct = ((fcIndex + 1) / fcFiltered.length) * 100;
        bar.style.width = pct + "%";
        bar.setAttribute("aria-valuenow", Math.round(pct));
    }

    function updateFcScore() {
        const el = $("#fcScoreDisplay");
        if (fcCorrectCount === 0 && fcWrongCount === 0) {
            el.textContent = "";
        } else {
            el.textContent = fcCorrectCount + " right, " + fcWrongCount + " wrong";
        }
    }

    function flipCard() {
        if (!fcFiltered.length) return;
        fcFlipped = !fcFlipped;
        $("#flashcard").classList.toggle("flipped", fcFlipped);

        // Show assessment buttons when flipped to answer
        if (fcFlipped) {
            $("#fcAssessment").style.display = "";
        } else {
            $("#fcAssessment").style.display = "none";
        }
    }

    function fcNavigate(dir) {
        if (!fcFiltered.length) return;
        // Stop any active reading
        if (fcReadingActive) {
            speechSynthesis.cancel();
            fcReadingActive = false;
            const btn = $("#fcReadAloud");
            if (btn) btn.classList.remove("speaking");
        }
        fcIndex = (fcIndex + dir + fcFiltered.length) % fcFiltered.length;
        renderFlashcard();
    }

    function shuffleCards() {
        for (let i = fcFiltered.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fcFiltered[i], fcFiltered[j]] = [fcFiltered[j], fcFiltered[i]];
        }
        fcIndex = 0;
        renderFlashcard();
    }

    function fcAssess(correct) {
        if (!fcFiltered.length) return;
        const q = fcFiltered[fcIndex];

        if (correct) {
            fcCorrectCount++;
            playCorrectSound();
        } else {
            fcWrongCount++;
            playWrongSound();
        }

        recordFcPerf(q.id, correct);
        updateFcScore();

        // Auto-advance
        setTimeout(() => {
            if (fcIndex < fcFiltered.length - 1) {
                fcIndex++;
            } else {
                fcIndex = 0; // wrap around
            }
            renderFlashcard();
        }, 200);
    }

    function initFlashcardEvents() {
        $("#flashcardWrapper").addEventListener("click", flipCard);
        $("#flashcardWrapper").addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                flipCard();
            }
        });
        $("#fcPrev").addEventListener("click", () => fcNavigate(-1));
        $("#fcNext").addEventListener("click", () => fcNavigate(1));
        $("#fcShuffle").addEventListener("click", shuffleCards);
        $("#fcCategoryFilter").addEventListener("change", () => {
            fcWeakFilterActive = false;
            $("#fcWeakFilter").classList.remove("active");
            initFlashcards();
        });

        // Weak filter
        $("#fcWeakFilter").addEventListener("click", () => {
            fcWeakFilterActive = !fcWeakFilterActive;
            $("#fcWeakFilter").classList.toggle("active", fcWeakFilterActive);
            initFlashcards();
        });

        // Assessment buttons
        $("#fcGotRight").addEventListener("click", () => fcAssess(true));
        $("#fcGotWrong").addEventListener("click", () => fcAssess(false));

        // Keyboard navigation
        document.addEventListener("keydown", (e) => {
            if (currentMode !== "flashcards") return;
            if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") return;
            // Check for open modals
            if ($("#settingsModal").style.display !== "none" || $("#shortcutsModal").style.display !== "none") return;

            if (e.key === "ArrowLeft") fcNavigate(-1);
            else if (e.key === "ArrowRight") fcNavigate(1);
            else if (e.key === " ") { e.preventDefault(); flipCard(); }
            else if (e.key === "r" || e.key === "R") readAloud();
            else if (e.key === "s" || e.key === "S") shuffleCards();
            else if (e.key === "1" && fcFlipped) fcAssess(true);
            else if (e.key === "2" && fcFlipped) fcAssess(false);
        });

        // Global shortcuts
        document.addEventListener("keydown", (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") return;
            if (e.key === "d" || e.key === "D") {
                const isDark = document.documentElement.getAttribute("data-theme") === "dark";
                applyDarkMode(!isDark);
                localStorage.setItem(globalKey("dark_mode"), (!isDark).toString());
            }
        });

        // Swipe support
        let touchStartX = 0;
        let touchStartY = 0;
        const wrapper = $("#flashcardWrapper");
        wrapper.addEventListener("touchstart", (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        wrapper.addEventListener("touchend", (e) => {
            const dx = e.changedTouches[0].screenX - touchStartX;
            const dy = e.changedTouches[0].screenY - touchStartY;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0) fcNavigate(-1);
                else fcNavigate(1);
            }
        }, { passive: true });

        // Read aloud
        $("#fcReadAloud").addEventListener("click", readAloud);
    }

    // ---- TTS Helper ----
    function createUtterance(text) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.9;
        if (selectedVoice) utter.voice = selectedVoice;
        return utter;
    }

    // ---- Read Aloud (context-aware, toggleable) ----
    let fcReadingActive = false;

    function readAloud() {
        if (!("speechSynthesis" in window)) {
            alert("Your browser does not support text-to-speech.");
            return;
        }
        if (!fcFiltered.length) return;

        const btn = $("#fcReadAloud");

        // If already reading, stop it
        if (fcReadingActive) {
            speechSynthesis.cancel();
            fcReadingActive = false;
            btn.classList.remove("speaking");
            return;
        }

        speechSynthesis.cancel();
        fcReadingActive = true;

        const q = fcFiltered[fcIndex];

        if (fcFlipped) {
            // Card is showing answer side: read the answer
            const text = q.answers.join(", or, ");
            const utter = createUtterance(text);
            utter.onstart = () => btn.classList.add("speaking");
            utter.onend = () => { btn.classList.remove("speaking"); fcReadingActive = false; };
            utter.onerror = () => { btn.classList.remove("speaking"); fcReadingActive = false; };
            speechSynthesis.speak(utter);
        } else {
            // Card is showing question side: read question, then flip, then read answer
            const qText = q.question;
            const utterQ = createUtterance(qText);
            utterQ.onstart = () => btn.classList.add("speaking");

            utterQ.onend = () => {
                if (!fcReadingActive) return;
                // Flip card after question is read
                if (!fcFlipped) flipCard();

                // Pause, then read answer
                setTimeout(() => {
                    if (!fcReadingActive) return;
                    const aText = q.answers.join(", or, ");
                    const utterA = createUtterance(aText);
                    utterA.onend = () => { btn.classList.remove("speaking"); fcReadingActive = false; };
                    utterA.onerror = () => { btn.classList.remove("speaking"); fcReadingActive = false; };
                    speechSynthesis.speak(utterA);
                }, 600);
            };

            utterQ.onerror = () => { btn.classList.remove("speaking"); fcReadingActive = false; };
            speechSynthesis.speak(utterQ);
        }
    }

    // ---- Listen Mode ----
    function initListen() {
        listenFiltered = filterByCategory($("#listenCategoryFilter").value);
        listenIndex = 0;
        listenPlaying = false;
        updateListenUI();
        updatePlayPauseBtn();
    }

    function updateListenUI() {
        if (!listenFiltered.length) return;
        const q = listenFiltered[listenIndex];
        $("#listenProgress").textContent = (listenIndex + 1) + " / " + listenFiltered.length;
        $("#listenCategory").textContent = q.subcategory || q.category;
        $("#listenQuestion").textContent = q.id + ". " + q.question;
        $("#listenAnswer").textContent = q.answers.join("  |  ");
        $("#listenAnswer").classList.remove("highlight");
    }

    function updatePlayPauseBtn() {
        const playIcon = $(".play-icon");
        const pauseIcon = $(".pause-icon");
        const btn = $("#listenPlayPause");

        if (listenPlaying) {
            playIcon.style.display = "none";
            pauseIcon.style.display = "";
            btn.classList.add("playing");
            btn.setAttribute("aria-label", "Pause");
        } else {
            playIcon.style.display = "";
            pauseIcon.style.display = "none";
            btn.classList.remove("playing");
            btn.setAttribute("aria-label", "Play");
        }
    }

    function stopListening() {
        listenPlaying = false;
        if ("speechSynthesis" in window) speechSynthesis.cancel();
        listenUtterance = null;
        updatePlayPauseBtn();
    }

    function speakCurrent() {
        if (!("speechSynthesis" in window) || !listenFiltered.length) return;
        speechSynthesis.cancel();

        const q = listenFiltered[listenIndex];
        const content = $("#listenContent").value;
        const speed = parseFloat($("#listenSpeed").value);

        let text = "";
        if (content === "questions" || content === "both") {
            text += q.question;
        }
        if (content === "both") text += " ... ";
        if (content === "answers" || content === "both") {
            text += q.answers.join(", or, ");
        }

        if (content === "both" || content === "answers") {
            $("#listenAnswer").classList.add("highlight");
        }

        const utter = createUtterance(text);
        utter.rate = speed;
        listenUtterance = utter;

        utter.onend = () => {
            if (!listenPlaying) return;
            if (listenIndex < listenFiltered.length - 1) {
                listenIndex++;
                updateListenUI();
                setTimeout(() => {
                    if (listenPlaying) speakCurrent();
                }, 600);
            } else {
                listenPlaying = false;
                updatePlayPauseBtn();
            }
        };

        utter.onerror = () => {
            listenPlaying = false;
            updatePlayPauseBtn();
        };

        speechSynthesis.speak(utter);
    }

    function toggleListenPlayPause() {
        if (listenPlaying) {
            stopListening();
        } else {
            listenPlaying = true;
            updatePlayPauseBtn();
            speakCurrent();
        }
    }

    function listenNavigate(dir) {
        const wasPlaying = listenPlaying;
        stopListening();
        listenIndex = Math.max(0, Math.min(listenFiltered.length - 1, listenIndex + dir));
        updateListenUI();
        if (wasPlaying) {
            listenPlaying = true;
            updatePlayPauseBtn();
            speakCurrent();
        }
    }

    function initListenEvents() {
        $("#listenPlayPause").addEventListener("click", toggleListenPlayPause);
        $("#listenPrev").addEventListener("click", () => listenNavigate(-1));
        $("#listenNext").addEventListener("click", () => listenNavigate(1));
        $("#listenCategoryFilter").addEventListener("change", () => {
            stopListening();
            initListen();
        });
        $("#listenContent").addEventListener("change", () => {
            if (listenPlaying) {
                stopListening();
                listenPlaying = true;
                updatePlayPauseBtn();
                speakCurrent();
            }
        });
    }

    // ---- Practice Test ----
    function initPractice() {
        $("#practiceStart").style.display = "";
        $("#practiceQuestion").style.display = "none";
        $("#practiceResults").style.display = "none";
        updatePassInfo();
    }

    function updatePassInfo() {
        const count = parseInt($("#practiceQuestionCount").value, 10) || 10;
        const needed = Math.ceil(count * 0.6);
        $("#practicePassInfo").textContent = "Need " + needed + " correct to pass (60%)";
    }

    function beginPractice() {
        practiceQuestionCount = Math.max(1, Math.min(100, parseInt($("#practiceQuestionCount").value, 10) || 10));
        practiceStreakMode = $("#practiceStreakMode").checked;
        practiceTimerEnabled = $("#practiceTimer").checked;

        // Select random questions
        const shuffled = [...questions].sort(() => Math.random() - 0.5);

        if (practiceStreakMode) {
            // In streak mode, we need a pool of questions — take all shuffled
            practiceQuestions = shuffled;
            practiceQuestionCount = shuffled.length; // use entire pool
        } else {
            practiceQuestions = shuffled.slice(0, practiceQuestionCount);
        }

        practiceIndex = 0;
        practiceScore = 0;
        practiceAnswers = [];
        practiceSelectedChoice = null;
        practiceStreak = 0;
        practiceTotalAsked = 0;

        $("#practiceStart").style.display = "none";
        $("#practiceQuestion").style.display = "";
        $("#practiceResults").style.display = "none";

        // Show/hide streak counter
        $("#streakCounter").style.display = practiceStreakMode ? "" : "none";
        updateStreakDisplay();

        showPracticeQuestion();
    }

    function updateStreakDisplay() {
        if (!practiceStreakMode) return;
        const num = $("#streakNumber");
        const flames = $("#streakFlames");
        num.textContent = practiceStreak;

        // Show fire emojis based on streak
        let fireStr = "";
        for (let i = 0; i < Math.min(practiceStreak, 6); i++) fireStr += "\uD83D\uDD25";
        if (practiceStreak === 0) fireStr = "\u2014";
        flames.textContent = fireStr;

        // Pulse animation
        const counter = $("#streakCounter");
        counter.style.animation = "none";
        // Force reflow
        void counter.offsetWidth;
        counter.style.animation = "streakPulse 0.3s ease";
    }

    function showPracticeQuestion() {
        if (practiceStreakMode) {
            // Wrap around the question pool
            const poolIndex = practiceTotalAsked % practiceQuestions.length;
            const q = practiceQuestions[poolIndex];

            $("#practiceQNum").textContent = "Question " + (practiceTotalAsked + 1);
            updatePracticeRingStreak();
            showQuestionContent(q, poolIndex);
        } else {
            const q = practiceQuestions[practiceIndex];
            const total = practiceQuestions.length;

            $("#practiceQNum").textContent = "Question " + (practiceIndex + 1) + " of " + total;
            updatePracticeRing();
            showQuestionContent(q, practiceIndex);
        }
    }

    function showQuestionContent(q, idx) {
        $("#practiceScoreLive").textContent = practiceScore + " correct";
        $("#practiceQuestionText").textContent = q.question;
        $("#practiceSubmitAnswer").disabled = true;
        practiceSelectedChoice = null;

        const choices = generateChoices(q);
        const container = $("#practiceChoices");
        container.innerHTML = "";

        choices.forEach((choice, i) => {
            const btn = document.createElement("button");
            btn.className = "practice-choice";
            btn.textContent = choice;
            btn.setAttribute("role", "radio");
            btn.setAttribute("aria-checked", "false");
            btn.dataset.index = i;
            btn.addEventListener("click", () => selectChoice(btn, i));
            container.appendChild(btn);
        });

        if (practiceTimerEnabled) {
            practiceTimeLeft = 30;
            $("#practiceTimerDisplay").style.display = "";
            updateTimerDisplay();
            startPracticeTimer();
        } else {
            $("#practiceTimerDisplay").style.display = "none";
        }
    }

    function updatePracticeRing() {
        const total = practiceQuestions.length;
        const circumference = 2 * Math.PI * 52;
        const progress = practiceIndex / total;
        const offset = circumference * (1 - progress);
        $("#progressRingFill").style.strokeDashoffset = offset;

        const passed = practiceScore >= Math.ceil(total * 0.6);
        if (practiceIndex > 0 && passed) {
            $("#progressRingFill").style.stroke = "var(--success)";
        } else {
            $("#progressRingFill").style.stroke = "var(--primary)";
        }

        $("#progressRingText").textContent = practiceScore + "/" + total;
    }

    function updatePracticeRingStreak() {
        const circumference = 2 * Math.PI * 52;
        const progress = practiceStreak / 6;
        const offset = circumference * (1 - Math.min(progress, 1));
        $("#progressRingFill").style.strokeDashoffset = offset;

        if (practiceStreak >= 4) {
            $("#progressRingFill").style.stroke = "var(--success)";
        } else if (practiceStreak >= 2) {
            $("#progressRingFill").style.stroke = "var(--accent-warm)";
        } else {
            $("#progressRingFill").style.stroke = "var(--primary)";
        }

        $("#progressRingText").textContent = practiceStreak + "/6";
    }

    function generateChoices(question) {
        const correctAnswer = question.answers[Math.floor(Math.random() * question.answers.length)];

        const allOtherAnswers = [];
        questions.forEach((q) => {
            if (q.id !== question.id) {
                q.answers.forEach((a) => {
                    if (!question.answers.includes(a) && !allOtherAnswers.includes(a)) {
                        allOtherAnswers.push(a);
                    }
                });
            }
        });

        const shuffled = allOtherAnswers.sort(() => Math.random() - 0.5);
        const distractors = shuffled.slice(0, 3);
        const choices = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);

        question._correctAnswer = correctAnswer;
        question._choices = choices;

        return choices;
    }

    function selectChoice(btn, idx) {
        $$(".practice-choice").forEach((b) => {
            b.classList.remove("selected");
            b.setAttribute("aria-checked", "false");
        });
        btn.classList.add("selected");
        btn.setAttribute("aria-checked", "true");
        practiceSelectedChoice = idx;
        $("#practiceSubmitAnswer").disabled = false;
    }

    function submitAnswer() {
        if (practiceSelectedChoice === null) return;
        stopPracticeTimer();

        const poolIndex = practiceStreakMode
            ? (practiceTotalAsked % practiceQuestions.length)
            : practiceIndex;
        const q = practiceQuestions[poolIndex];
        const chosenText = q._choices[practiceSelectedChoice];
        const isCorrect = q.answers.includes(chosenText);

        if (isCorrect) {
            practiceScore++;
            playCorrectSound();
            if (practiceStreakMode) practiceStreak++;
        } else {
            playWrongSound();
            if (practiceStreakMode) practiceStreak = 0;
        }

        if (practiceStreakMode) {
            updateStreakDisplay();
        }

        // Show correct/incorrect visually
        $$(".practice-choice").forEach((btn) => {
            btn.classList.add("disabled");
            const btnText = btn.textContent;
            if (q.answers.includes(btnText)) {
                btn.classList.add("correct");
            }
            if (parseInt(btn.dataset.index, 10) === practiceSelectedChoice && !isCorrect) {
                btn.classList.add("incorrect");
            }
        });

        practiceAnswers.push({
            question: q,
            chosen: chosenText,
            correct: isCorrect,
        });

        practiceTotalAsked++;

        // Check completion
        setTimeout(() => {
            if (practiceStreakMode) {
                if (practiceStreak >= 6) {
                    showPracticeResults();
                } else {
                    // Continue asking
                    showPracticeQuestion();
                }
            } else {
                practiceIndex++;
                if (practiceIndex < practiceQuestions.length) {
                    showPracticeQuestion();
                } else {
                    showPracticeResults();
                }
            }
        }, 1000);
    }

    function startPracticeTimer() {
        stopPracticeTimer();
        practiceTimerInterval = setInterval(() => {
            practiceTimeLeft--;
            updateTimerDisplay();
            if (practiceTimeLeft <= 0) {
                stopPracticeTimer();
                if (practiceSelectedChoice !== null) {
                    submitAnswer();
                } else {
                    const poolIndex = practiceStreakMode
                        ? (practiceTotalAsked % practiceQuestions.length)
                        : practiceIndex;
                    const q = practiceQuestions[poolIndex];
                    practiceAnswers.push({
                        question: q,
                        chosen: "(No answer - time ran out)",
                        correct: false,
                    });
                    playWrongSound();

                    if (practiceStreakMode) {
                        practiceStreak = 0;
                        updateStreakDisplay();
                    }

                    practiceTotalAsked++;
                    practiceIndex++;

                    if (practiceStreakMode) {
                        showPracticeQuestion();
                    } else if (practiceIndex < practiceQuestions.length) {
                        showPracticeQuestion();
                    } else {
                        showPracticeResults();
                    }
                }
            }
        }, 1000);
    }

    function stopPracticeTimer() {
        if (practiceTimerInterval) {
            clearInterval(practiceTimerInterval);
            practiceTimerInterval = null;
        }
    }

    function updateTimerDisplay() {
        const display = $("#practiceTimerDisplay");
        const secs = practiceTimeLeft;
        display.textContent = "0:" + (secs < 10 ? "0" : "") + secs;
        display.classList.toggle("urgent", secs <= 10);
    }

    function showPracticeResults() {
        stopPracticeTimer();
        $("#practiceQuestion").style.display = "none";
        $("#practiceResults").style.display = "";

        const totalQ = practiceStreakMode ? practiceTotalAsked : practiceQuestions.length;
        const passThreshold = practiceStreakMode ? 6 : Math.ceil(totalQ * 0.6);
        const passed = practiceStreakMode ? (practiceStreak >= 6) : (practiceScore >= passThreshold);

        // Animated checkmark
        const checkmarkEl = $("#resultsCheckmark");
        if (passed) {
            checkmarkEl.innerHTML = '<svg viewBox="0 0 52 52"><circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none" stroke="' + "var(--success)" + '" stroke-width="2"/><path class="checkmark-check" fill="none" stroke="' + "var(--success)" + '" stroke-width="3" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg>';
            showConfetti();
        } else {
            checkmarkEl.innerHTML = '<svg viewBox="0 0 52 52"><circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none" stroke="' + "var(--error)" + '" stroke-width="2"/><path class="crossmark-x1" fill="none" stroke="' + "var(--error)" + '" stroke-width="3" d="M16 16l20 20"/><path class="crossmark-x2" fill="none" stroke="' + "var(--error)" + '" stroke-width="3" d="M36 16l-20 20"/></svg>';
        }

        const scoreEl = $("#resultsScore");
        scoreEl.textContent = practiceScore + " / " + totalQ;
        scoreEl.className = "results-score " + (passed ? "pass" : "fail");

        const statusEl = $("#resultsStatus");
        if (practiceStreakMode && passed) {
            statusEl.textContent = "6 in a Row -- You Passed!";
        } else if (passed) {
            statusEl.textContent = "You Passed!";
        } else {
            statusEl.textContent = "Not Passing -- Keep Studying!";
        }
        statusEl.className = "results-status " + (passed ? "pass" : "fail");

        // Stats
        const statsEl = $("#resultsStats");
        let statsHtml = '';
        statsHtml += '<div class="results-stat-item"><div class="results-stat-value">' + practiceScore + '</div><div class="results-stat-label">Correct</div></div>';
        statsHtml += '<div class="results-stat-item"><div class="results-stat-value">' + (totalQ - practiceScore) + '</div><div class="results-stat-label">Wrong</div></div>';
        statsHtml += '<div class="results-stat-item"><div class="results-stat-value">' + Math.round((practiceScore / totalQ) * 100) + '%</div><div class="results-stat-label">Accuracy</div></div>';
        if (practiceStreakMode) {
            statsHtml += '<div class="results-stat-item"><div class="results-stat-value">' + practiceTotalAsked + '</div><div class="results-stat-label">Total Asked</div></div>';
        }
        statsEl.innerHTML = statsHtml;

        // Build review
        const reviewEl = $("#resultsReview");
        reviewEl.innerHTML = "";

        practiceAnswers.forEach((a) => {
            const item = document.createElement("div");
            item.className = "review-item";

            const icon = a.correct
                ? '<svg class="review-icon correct" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>'
                : '<svg class="review-icon incorrect" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

            let html = '<div class="review-question">' + icon + escHtml(a.question.question) + '</div>';
            html += '<div class="review-answer">Your answer: ' + escHtml(a.chosen) + '</div>';

            if (!a.correct) {
                html += '<div class="review-correct-answer">Correct: ' + escHtml(a.question.answers.join(" | ")) + '</div>';
            }

            item.innerHTML = html;
            reviewEl.appendChild(item);
        });

        // Save to history
        addHistoryEntry({
            date: new Date().toISOString(),
            version: testVersion,
            score: practiceScore,
            total: totalQ,
            passed: passed,
            mode: practiceStreakMode ? "streak" : "standard",
            streakTotal: practiceStreakMode ? practiceTotalAsked : null
        });
    }

    // ---- Confetti ----
    function showConfetti() {
        const overlay = $("#confettiOverlay");
        overlay.innerHTML = "";
        overlay.classList.remove("active");
        void overlay.offsetWidth;
        overlay.classList.add("active");

        const colors = ["#22c55e", "#4a7ddb", "#f59e0b", "#ef4444", "#7c3aed", "#ec4899", "#06b6d4"];
        for (let i = 0; i < 60; i++) {
            const piece = document.createElement("div");
            piece.className = "confetti-piece";
            piece.style.left = Math.random() * 100 + "%";
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = (Math.random() * 0.8) + "s";
            piece.style.animationDuration = (2 + Math.random() * 2) + "s";
            piece.style.width = (6 + Math.random() * 8) + "px";
            piece.style.height = (6 + Math.random() * 8) + "px";
            piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
            overlay.appendChild(piece);
        }

        setTimeout(() => {
            overlay.classList.remove("active");
            overlay.innerHTML = "";
        }, 4000);
    }

    function initPracticeEvents() {
        $("#practiceBegin").addEventListener("click", beginPractice);
        $("#practiceSubmitAnswer").addEventListener("click", submitAnswer);
        $("#practiceRetake").addEventListener("click", () => {
            initPractice();
        });
        $("#practiceQuestionCount").addEventListener("input", updatePassInfo);

        // Streak mode disables question count
        $("#practiceStreakMode").addEventListener("change", () => {
            const streakMode = $("#practiceStreakMode").checked;
            $("#practiceQuestionCount").disabled = streakMode;
            if (streakMode) {
                $("#practicePassInfo").textContent = "Get 6 correct in a row to pass";
            } else {
                updatePassInfo();
            }
        });
    }

    // ---- Study Mode ----
    function initStudy() {
        loadKnown();
        renderStudy();
        updateKnownCount();
    }

    function renderStudy() {
        const container = $("#studyCategories");
        container.innerHTML = "";

        const cats = getCategories();

        cats.forEach((subcats, category) => {
            const group = document.createElement("div");
            group.className = "study-category-group";

            const catQuestions = questions.filter((q) => q.category === category);
            const knownInCat = catQuestions.filter((q) => knownQuestions.has(q.id)).length;

            const header = document.createElement("button");
            header.className = "study-category-header";
            header.innerHTML =
                escHtml(category) +
                '<span class="study-category-count">' + knownInCat + '/' + catQuestions.length + ' known</span>' +
                '<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="6 9 12 15 18 9"/></svg>';

            const items = document.createElement("div");
            items.className = "study-items-hidden";

            header.addEventListener("click", () => {
                header.classList.toggle("open");
                items.classList.toggle("study-items-hidden");
            });

            subcats.forEach((sub) => {
                const subHeader = document.createElement("div");
                subHeader.className = "study-subcategory-header";
                subHeader.textContent = sub;
                items.appendChild(subHeader);

                const subQuestions = questions.filter((q) => q.category === category && q.subcategory === sub);
                subQuestions.forEach((q) => {
                    const item = document.createElement("div");
                    item.className = "study-question-item" + (knownQuestions.has(q.id) ? " known" : "");
                    item.dataset.qid = q.id;

                    const check = document.createElement("div");
                    check.className = "study-known-check" + (knownQuestions.has(q.id) ? " checked" : "");
                    check.setAttribute("role", "checkbox");
                    check.setAttribute("aria-checked", knownQuestions.has(q.id));
                    check.setAttribute("aria-label", "Mark question " + q.id + " as known");
                    check.setAttribute("tabindex", "0");
                    check.innerHTML = knownQuestions.has(q.id)
                        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>'
                        : "";

                    check.addEventListener("click", () => toggleKnown(q.id, check, item));
                    check.addEventListener("keydown", (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleKnown(q.id, check, item);
                        }
                    });

                    const content = document.createElement("div");
                    content.className = "study-question-content";
                    content.innerHTML =
                        '<div class="study-q-text"><span class="study-q-num">' + q.id + '.</span> ' + escHtml(q.question) + '</div>' +
                        '<div class="study-a-text">' + escHtml(q.answers.join(" | ")) + '</div>';

                    item.appendChild(check);
                    item.appendChild(content);
                    items.appendChild(item);
                });
            });

            group.appendChild(header);
            group.appendChild(items);
            container.appendChild(group);
        });
    }

    function toggleKnown(qid, checkEl, itemEl) {
        if (knownQuestions.has(qid)) {
            knownQuestions.delete(qid);
            checkEl.classList.remove("checked");
            checkEl.innerHTML = "";
            checkEl.setAttribute("aria-checked", "false");
            itemEl.classList.remove("known");
        } else {
            knownQuestions.add(qid);
            checkEl.classList.add("checked");
            checkEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>';
            checkEl.setAttribute("aria-checked", "true");
            itemEl.classList.add("known");
        }
        saveKnown();
        updateKnownCount();
        updateStudyCategoryCounts();
    }

    function updateKnownCount() {
        $("#knownCount").textContent = knownQuestions.size + " marked as known";
    }

    function updateStudyCategoryCounts() {
        $$(".study-category-group").forEach((group) => {
            const items = group.querySelectorAll(".study-question-item");
            const known = group.querySelectorAll(".study-question-item.known");
            const countEl = group.querySelector(".study-category-count");
            if (countEl) {
                countEl.textContent = known.length + "/" + items.length + " known";
            }
        });
    }

    function initStudyEvents() {
        $("#clearKnown").addEventListener("click", () => {
            if (confirm("Reset all progress? This will unmark all questions as known.")) {
                knownQuestions.clear();
                saveKnown();
                renderStudy();
                updateKnownCount();
            }
        });
    }

    // ---- History ----
    function renderHistory() {
        const container = $("#historyContent");
        const history = loadHistory();

        if (!history.length) {
            container.innerHTML =
                '<div class="history-empty">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
                    '<div class="history-empty-title">No tests taken yet</div>' +
                    '<div class="history-empty-desc">Complete a practice test to see your scores and progress here.</div>' +
                '</div>';
            return;
        }

        // Calculate stats
        const scores = history.map(h => h.score / h.total);
        const bestScore = Math.max(...scores);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const passCount = history.filter(h => h.passed).length;

        let html = '';

        // Summary cards
        html += '<div class="history-summary">';
        html += '<div class="history-stat-card"><div class="history-stat-value">' + Math.round(bestScore * 100) + '%</div><div class="history-stat-label">Best Score</div></div>';
        html += '<div class="history-stat-card"><div class="history-stat-value">' + Math.round(avgScore * 100) + '%</div><div class="history-stat-label">Average</div></div>';
        html += '<div class="history-stat-card"><div class="history-stat-value pass-color">' + passCount + '<span style="font-size:0.6em;color:var(--text-muted)">/' + history.length + '</span></div><div class="history-stat-label">Tests Passed</div></div>';
        html += '</div>';

        // Mini bar chart (last 10)
        const recent = history.slice(-10);
        html += '<div class="history-chart">';
        html += '<div class="history-chart-title">Recent Scores</div>';
        html += '<div class="history-bars">';
        recent.forEach((h) => {
            const pct = Math.round((h.score / h.total) * 100);
            const barClass = h.passed ? "pass-bar" : "fail-bar";
            html += '<div class="history-bar ' + barClass + '" style="height:' + Math.max(pct, 4) + '%">';
            html += '<div class="history-bar-tooltip">' + pct + '% (' + h.score + '/' + h.total + ')</div>';
            html += '</div>';
        });
        html += '</div></div>';

        // Recent entries list
        html += '<div class="history-list-title">Test History</div>';
        html += '<div class="history-list">';
        [...history].reverse().forEach((h) => {
            const date = new Date(h.date);
            const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
                " " + date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
            const passClass = h.passed ? "pass" : "fail";
            const modeLabel = h.mode === "streak" ? "Streak" : "Standard";

            html += '<div class="history-entry">';
            html += '<span class="history-entry-date">' + escHtml(dateStr) + '</span>';
            html += '<span class="history-entry-score">' + h.score + '/' + h.total + '</span>';
            html += '<span class="history-entry-mode">' + modeLabel + '</span>';
            html += '<span class="history-badge ' + passClass + '">' + (h.passed ? "Pass" : "Fail") + '</span>';
            html += '</div>';
        });
        html += '</div>';

        // Clear button
        html += '<div style="text-align:center;margin-top:24px;">';
        html += '<button class="history-clear-btn" id="historyClear">Clear History</button>';
        html += '</div>';

        container.innerHTML = html;

        // Clear history handler
        const clearBtn = $("#historyClear");
        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                if (confirm("Clear all test history? This cannot be undone.")) {
                    saveHistory([]);
                    renderHistory();
                }
            });
        }
    }

    // ---- Utility ----
    function escHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    // ---- Init ----
    function init() {
        initDarkMode();
        initVoiceSelection();
        initSoundEffects();
        initModals();
        initTestSelection();
        initModeTabs();
        initFlashcardEvents();
        initListenEvents();
        initPracticeEvents();
        initStudyEvents();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
