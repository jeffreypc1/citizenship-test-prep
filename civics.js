/* ============================================================
   USCIS Practice Test — JavaScript
   Civics (flash cards, listen, practice, study, history)
   + English (reading, writing, speaking, mock test)
   + Gamification (streaks, achievements, progress)
   ============================================================ */

(function () {
    "use strict";

    // ---- DOM Helpers ----
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);
    const show = (el) => { if (el) el.style.display = ""; };
    const hide = (el) => { if (el) el.style.display = "none"; };

    // ---- Storage ----
    const LS = {
        get(k, fallback) { try { const v = localStorage.getItem("civics_" + k); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; } },
        set(k, v) { try { localStorage.setItem("civics_" + k, JSON.stringify(v)); } catch {} },
    };

    // ---- State ----
    let currentScreen = "home"; // home, civicsSelection, studyApp, englishSelection, englishPractice, eligibilityCheck
    let navigationStack = [];

    // Civics state
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

    // Voice / Sound
    let selectedVoice = null;
    let voicesLoaded = false;
    let soundEnabled = LS.get("sound", true);
    let audioCtx = null;

    // English state
    let englishData = null;
    let engMode = null; // reading, writing, speaking, mock
    let engReadingItems = [];
    let engReadingIndex = 0;
    let engWritingItems = [];
    let engWritingIndex = 0;
    let engSpeakingItems = [];
    let engSpeakingIndex = 0;
    let recognition = null;
    let isRecording = false;

    // Mock test state
    let mockPhase = null; // "reading", "writing", "speaking", "results"
    let mockStep = 0;
    let mockReadingSentences = [];
    let mockWritingSentences = [];
    let mockScores = { reading: [], writing: [], speaking: 0 };
    let mockTimerInterval = null;
    let mockTimeLeft = 0;

    // Progress tracking
    let engReadingCompleted = new Set(LS.get("eng_reading_done", []));
    let engWritingCompleted = new Set(LS.get("eng_writing_done", []));
    let engSpeakingCompleted = new Set(LS.get("eng_speaking_done", []));
    let engReadingPerfect = LS.get("eng_reading_perfect", 0);
    let engWritingPerfect = LS.get("eng_writing_perfect", 0);

    // Achievements
    const ACHIEVEMENTS = [
        { id: "first_steps", icon: "\u{1F476}", name: "First Steps", desc: "Completed 1 practice" },
        { id: "streak_5", icon: "\u{1F525}", name: "5-Day Streak", desc: "Practiced 5 days in a row" },
        { id: "civics_master", icon: "\u{1F3C6}", name: "Civics Master", desc: "Scored 100% on practice test" },
        { id: "perfect_reader", icon: "\u{1F4D6}", name: "Perfect Reader", desc: "Read 10 sentences perfectly" },
        { id: "dictation_pro", icon: "\u{270D}\u{FE0F}", name: "Dictation Pro", desc: "Wrote 10 sentences perfectly" },
    ];

    // Quotes
    const QUOTES = [
        "\"The U.S. is a land of opportunity. Believe in your ability to succeed.\"",
        "\"Every journey begins with a single step. Keep studying, you're doing great!\"",
        "\"Citizenship is a commitment to this country and its values.\"",
        "\"Your determination to learn is your greatest strength.\"",
        "\"Practice makes progress. Every session brings you closer to your goal.\"",
        "\"The future belongs to those who believe in the beauty of their dreams.\" \u2014 Eleanor Roosevelt",
        "\"This nation was built by immigrants. You are part of that story.\"",
        "\"Knowledge is power. The more you study, the more confident you'll feel.\"",
    ];

    // ---- SpeechRecognition setup ----
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // ================================================================
    //  INITIALIZATION
    // ================================================================

    function init() {
        initDarkMode();
        initVoices();
        initSoundToggle();
        initModals();
        initNavigation();
        updateStreak();
        renderHome();
        loadEnglishData();
    }

    // ---- Dark Mode ----
    function initDarkMode() {
        const dm = LS.get("darkMode", false);
        if (dm) document.documentElement.setAttribute("data-theme", "dark");
        updateDarkModeIcons();
        $("#darkModeToggle").addEventListener("click", () => {
            const isDark = document.documentElement.getAttribute("data-theme") === "dark";
            if (isDark) document.documentElement.removeAttribute("data-theme");
            else document.documentElement.setAttribute("data-theme", "dark");
            LS.set("darkMode", !isDark);
            updateDarkModeIcons();
        });
    }
    function updateDarkModeIcons() {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const sun = $(".icon-sun");
        const moon = $(".icon-moon");
        if (sun) sun.style.display = isDark ? "none" : "";
        if (moon) moon.style.display = isDark ? "" : "none";
    }

    // ---- Voices ----
    function initVoices() {
        const sel = $("#voiceSelect");
        function loadVoices() {
            const voices = speechSynthesis.getVoices();
            if (!voices.length) return;
            voicesLoaded = true;
            sel.innerHTML = "";
            const saved = LS.get("voice", "");
            const enVoices = voices.filter(v => v.lang.startsWith("en"));
            const list = enVoices.length ? enVoices : voices;
            list.forEach((v, i) => {
                const opt = document.createElement("option");
                opt.value = i;
                opt.textContent = `${v.name} (${v.lang})`;
                if (v.name === saved) { opt.selected = true; selectedVoice = v; }
                sel.appendChild(opt);
            });
            if (!selectedVoice && list.length) selectedVoice = list[0];
        }
        speechSynthesis.addEventListener("voiceschanged", loadVoices);
        loadVoices();
        sel.addEventListener("change", () => {
            const voices = speechSynthesis.getVoices();
            const enVoices = voices.filter(v => v.lang.startsWith("en"));
            const list = enVoices.length ? enVoices : voices;
            selectedVoice = list[sel.selectedIndex] || null;
            if (selectedVoice) LS.set("voice", selectedVoice.name);
        });
    }

    // ---- Sound ----
    function initSoundToggle() {
        const btn = $("#soundToggle");
        btn.setAttribute("aria-checked", soundEnabled ? "true" : "false");
        btn.addEventListener("click", () => {
            soundEnabled = !soundEnabled;
            btn.setAttribute("aria-checked", soundEnabled ? "true" : "false");
            LS.set("sound", soundEnabled);
        });
    }
    function playSound(type) {
        if (!soundEnabled) return;
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            gain.gain.value = 0.15;
            if (type === "correct") { osc.frequency.value = 880; osc.type = "sine"; }
            else if (type === "wrong") { osc.frequency.value = 300; osc.type = "square"; }
            else { osc.frequency.value = 660; osc.type = "sine"; }
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
        } catch {}
    }

    // ---- Modals ----
    function initModals() {
        const pairs = [
            ["settingsToggle", "settingsModal", "settingsClose"],
            ["shortcutsToggle", "shortcutsModal", "shortcutsClose"],
        ];
        pairs.forEach(([toggleId, modalId, closeId]) => {
            const toggle = $(`#${toggleId}`);
            const modal = $(`#${modalId}`);
            const close = $(`#${closeId}`);
            toggle.addEventListener("click", () => { modal.style.display = modal.style.display === "none" ? "" : "none"; });
            close.addEventListener("click", () => { modal.style.display = "none"; });
            modal.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
        });
    }

    // ---- TTS ----
    function speak(text, rate, onEnd) {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        if (selectedVoice) u.voice = selectedVoice;
        u.rate = rate || 1;
        if (onEnd) u.onend = onEnd;
        speechSynthesis.speak(u);
        return u;
    }

    // ---- Confetti ----
    function fireConfetti() {
        const overlay = $("#confettiOverlay");
        overlay.innerHTML = "";
        const colors = ["#2563eb", "#7c3aed", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#06b6d4"];
        for (let i = 0; i < 60; i++) {
            const piece = document.createElement("div");
            piece.className = "confetti-piece";
            piece.style.left = Math.random() * 100 + "%";
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 0.8 + "s";
            piece.style.animationDuration = (1.5 + Math.random()) + "s";
            piece.style.width = (6 + Math.random() * 8) + "px";
            piece.style.height = (6 + Math.random() * 8) + "px";
            piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
            overlay.appendChild(piece);
        }
        overlay.classList.add("active");
        setTimeout(() => { overlay.classList.remove("active"); overlay.innerHTML = ""; }, 3000);
    }

    // ================================================================
    //  NAVIGATION
    // ================================================================

    function initNavigation() {
        // Brand = home
        $("#brandHome").addEventListener("click", goHome);
        $("#brandHome").addEventListener("keydown", (e) => { if (e.key === "Enter") goHome(); });

        // Back button
        $("#backBtn").addEventListener("click", goBack);

        // Home cards
        $("#civicsCard").addEventListener("click", () => navigateTo("civicsSelection"));
        $("#englishCard").addEventListener("click", () => navigateTo("englishSelection"));
        $("#eligibilityCard").addEventListener("click", () => { eligStartOver(); navigateTo("eligibilityCheck"); });

        // Civics test selection
        $$(".test-card[data-test]").forEach(card => {
            card.addEventListener("click", () => loadCivicsTest(card.dataset.test));
        });

        // English mode selection
        $$(".english-mode-card[data-emode]").forEach(card => {
            card.addEventListener("click", () => loadEnglishMode(card.dataset.emode));
        });

        // Civics tabs
        $$(".mode-tab").forEach(tab => {
            tab.addEventListener("click", () => switchCivicsMode(tab.dataset.mode));
        });

        // Keyboard shortcuts
        document.addEventListener("keydown", handleKeyboard);
    }

    function navigateTo(screen) {
        navigationStack.push(currentScreen);
        showScreen(screen);
    }

    function goBack() {
        if (navigationStack.length) {
            const prev = navigationStack.pop();
            showScreen(prev);
        } else {
            showScreen("home");
        }
    }

    function goHome() {
        navigationStack = [];
        showScreen("home");
        renderHome();
    }

    function showScreen(screen) {
        currentScreen = screen;
        // Hide all screens
        hide($("#homeScreen"));
        hide($("#civicsSelection"));
        hide($("#studyApp"));
        hide($("#englishSelection"));
        hide($("#englishPractice"));
        hide($("#eligibilityCheck"));

        // Show back button if not home
        if (screen === "home") {
            hide($("#backBtn"));
        } else {
            show($("#backBtn"));
        }

        // Stop any audio
        speechSynthesis.cancel();
        stopRecognition();
        clearMockTimer();

        switch (screen) {
            case "home":
                show($("#homeScreen"));
                break;
            case "civicsSelection":
                show($("#civicsSelection"));
                break;
            case "studyApp":
                show($("#studyApp"));
                break;
            case "englishSelection":
                show($("#englishSelection"));
                checkSpeechAPI();
                break;
            case "englishPractice":
                show($("#englishPractice"));
                break;
            case "eligibilityCheck":
                show($("#eligibilityCheck"));
                break;
        }
    }

    // ================================================================
    //  HOME SCREEN
    // ================================================================

    function renderHome() {
        // Quote
        const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        $("#heroQuote").textContent = q;

        // Streak
        const streak = LS.get("dailyStreak", 0);
        $("#homeStreakCount").textContent = streak;
        $("#streakFlame").style.opacity = streak > 0 ? "1" : "0.3";

        // Achievements
        renderAchievements();

        // Progress rings
        updateHomeProgress();

        // Card status indicators
        updateCardStatuses();

        // Ready to apply / progress section
        updateReadyToApply();

        // Quick stats
        renderQuickStats();

        // FAQ accordion
        initFaqAccordion();
    }

    // ---- Card Status Indicators ----
    function hasCivicsPass() {
        const history = LS.get("testHistory", []);
        return history.some(h => (h.score / h.total * 100) >= 60);
    }

    function hasEnglishPass() {
        const r = LS.get("eng_reading_done", []).length;
        const w = LS.get("eng_writing_done", []).length;
        const s = LS.get("eng_speaking_done", []).length;
        return r >= 10 && w >= 10 && s >= 5;
    }

    function getEligibilityStatus() {
        const results = LS.get("eligibility_results", null);
        if (!results || !results.length) return { done: false, allGreen: false, greens: 0, yellows: 0, reds: 0, total: 0, unchecked: 11 };
        let greens = 0, yellows = 0, reds = 0;
        results.forEach(r => {
            if (r && r.color === "green") greens++;
            else if (r && r.color === "yellow") yellows++;
            else if (r && r.color === "red") reds++;
        });
        const answered = greens + yellows + reds;
        return { done: answered > 0, allGreen: greens === 11 && yellows === 0 && reds === 0, greens, yellows, reds, total: 11, unchecked: 11 - answered };
    }

    function updateCardStatuses() {
        // Civics status
        const civicsEl = $("#civicsStatus");
        if (civicsEl) {
            if (hasCivicsPass()) {
                civicsEl.innerHTML = '<span class="status-badge status-badge--pass"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Passed!</span>';
            } else {
                civicsEl.innerHTML = '';
            }
        }

        // English status
        const englishEl = $("#englishStatus");
        if (englishEl) {
            if (hasEnglishPass()) {
                englishEl.innerHTML = '<span class="status-badge status-badge--pass"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Practiced!</span>';
            } else {
                englishEl.innerHTML = '';
            }
        }

        // Eligibility donut + status
        const eligStatus = getEligibilityStatus();
        updateEligibilityDonut(eligStatus);
        const eligEl = $("#eligibilityStatus");
        if (eligEl) {
            if (!eligStatus.done) {
                eligEl.innerHTML = '';
            } else if (eligStatus.allGreen) {
                eligEl.innerHTML = '<span class="status-badge status-badge--pass"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Ready to Apply!</span>';
            } else if (eligStatus.reds > 0) {
                eligEl.innerHTML = '<span class="status-badge status-badge--fail">Issues Found</span>';
            } else {
                eligEl.innerHTML = '<span class="status-badge status-badge--warn">Needs Attention</span>';
            }
        }
    }

    function updateEligibilityDonut(status) {
        const total = status.total;
        const circumference = 2 * Math.PI * 34; // ~213.63
        const greenArc = (status.greens / total) * circumference;
        const yellowArc = (status.yellows / total) * circumference;
        const redArc = (status.reds / total) * circumference;

        const greenCircle = $(".elig-donut-green");
        const yellowCircle = $(".elig-donut-yellow");
        const redCircle = $(".elig-donut-red");
        const textEl = $("#eligRingText");

        if (!greenCircle) return;

        // Each segment: dasharray = "arcLen remainingCircumference", dashoffset = -cumulativeOffset
        // We rotate the SVG -90deg via CSS so 0 is top
        let offset = 0;

        greenCircle.style.strokeDasharray = greenArc + " " + (circumference - greenArc);
        greenCircle.style.strokeDashoffset = -offset;
        offset += greenArc;

        yellowCircle.style.strokeDasharray = yellowArc + " " + (circumference - yellowArc);
        yellowCircle.style.strokeDashoffset = -offset;
        offset += yellowArc;

        redCircle.style.strokeDasharray = redArc + " " + (circumference - redArc);
        redCircle.style.strokeDashoffset = -offset;

        if (textEl) {
            if (status.done) {
                textEl.textContent = status.greens + "/" + total;
            } else {
                textEl.textContent = "";
            }
        }
    }

    // ---- Ready to Apply Section ----
    let readyToApplyConfettiFired = false;

    function updateReadyToApply() {
        const container = $("#readyToApply");
        if (!container) return;

        const civicsPassed = hasCivicsPass();
        const englishPassed = hasEnglishPass();
        const eligStatus = getEligibilityStatus();
        const allReady = civicsPassed && englishPassed && eligStatus.allGreen;

        if (allReady) {
            container.innerHTML = '<div class="ready-card">'
                + '<div class="ready-checkmark"><svg viewBox="0 0 52 52" width="64" height="64"><circle class="ready-checkmark-circle" cx="26" cy="26" r="25" fill="none"/><path class="ready-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg></div>'
                + '<h2 class="ready-title">You\'re Ready to Apply for Citizenship!</h2>'
                + '<p class="ready-subtitle">You\'ve passed the civics test, completed English practice, and cleared the eligibility check. The next step is filing your N-400.</p>'
                + '<a href="https://www.uscis.gov/n-400" target="_blank" rel="noopener" class="ready-cta">File Form N-400 on USCIS.gov <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>'
                + '<p class="ready-encouragement">Congratulations on reaching this milestone. You\'ve put in the work and you\'re ready!</p>'
                + '</div>';
            if (!readyToApplyConfettiFired) {
                readyToApplyConfettiFired = true;
                setTimeout(fireConfetti, 400);
            }
        } else {
            const items = [
                { label: "Civics Test", done: civicsPassed, doneText: "Passed a practice test", todoText: "Score 60%+ on a practice test" },
                { label: "English Practice", done: englishPassed, doneText: "Completed enough exercises", todoText: "Complete 10 reading, 10 writing, 5 speaking" },
                { label: "Eligibility Check", done: eligStatus.allGreen, doneText: "All checks passed", todoText: eligStatus.done ? "Resolve flagged items" : "Complete the eligibility check" },
            ];
            let html = '<div class="progress-checklist">'
                + '<h3 class="progress-checklist-title">Your Citizenship Readiness</h3>'
                + '<div class="progress-checklist-items">';
            items.forEach(item => {
                html += '<div class="progress-checklist-item ' + (item.done ? "progress-checklist-item--done" : "") + '">'
                    + '<span class="progress-checklist-icon">' + (item.done
                        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>'
                        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/></svg>')
                    + '</span>'
                    + '<span class="progress-checklist-label">' + item.label + '</span>'
                    + '<span class="progress-checklist-status">' + (item.done ? item.doneText : item.todoText) + '</span>'
                    + '</div>';
            });
            html += '</div></div>';
            container.innerHTML = html;
        }
    }

    // ---- FAQ Accordion ----
    function initFaqAccordion() {
        const questions = document.querySelectorAll(".faq-question");
        questions.forEach(q => {
            // Remove old listeners by checking data attribute
            if (q.dataset.faqBound) return;
            q.dataset.faqBound = "1";
            q.addEventListener("click", () => {
                const item = q.parentElement;
                const isOpen = item.classList.contains("faq-open");
                item.classList.toggle("faq-open", !isOpen);
                q.setAttribute("aria-expanded", !isOpen);
            });
        });
    }

    function renderAchievements() {
        const container = $("#achievementsBadges");
        const unlocked = LS.get("achievements", {});
        container.innerHTML = "";
        ACHIEVEMENTS.forEach(a => {
            const badge = document.createElement("span");
            badge.className = "achievement-badge" + (unlocked[a.id] ? " unlocked" : "");
            badge.innerHTML = `<span class="achievement-badge-icon">${a.icon}</span> ${a.name}`;
            badge.title = a.desc + (unlocked[a.id] ? " (Unlocked!)" : "");
            container.appendChild(badge);
        });
    }

    function updateHomeProgress() {
        // Civics progress = % of known questions (from study mode)
        const known2008 = LS.get("known_2008", []);
        const known2024 = LS.get("known_2024", []);
        const civicsTotal = 100 + 128;
        const civicsKnown = known2008.length + known2024.length;
        const civicsPct = civicsTotal > 0 ? Math.round((civicsKnown / civicsTotal) * 100) : 0;
        setProgressRing("civicsRingFill", "civicsRingText", civicsPct, 34);

        // English progress
        const engTotal = 55 + 55 + 40;
        const engDone = engReadingCompleted.size + engWritingCompleted.size + engSpeakingCompleted.size;
        const engPct = engTotal > 0 ? Math.round((engDone / engTotal) * 100) : 0;
        setProgressRing("englishRingFill", "englishRingText", engPct, 34);
    }

    function setProgressRing(fillId, textId, pct, radius) {
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (pct / 100) * circumference;
        const fill = $(`#${fillId}`);
        const text = $(`#${textId}`);
        if (fill) fill.style.strokeDashoffset = offset;
        if (text) text.textContent = pct + "%";
    }

    function renderQuickStats() {
        const grid = $("#quickStatsGrid");
        const history = LS.get("testHistory", []);
        const totalTests = history.length;
        const avgScore = totalTests ? Math.round(history.reduce((s, h) => s + (h.score / h.total * 100), 0) / totalTests) : 0;
        const streak = LS.get("dailyStreak", 0);
        const totalPracticed = engReadingCompleted.size + engWritingCompleted.size + engSpeakingCompleted.size;

        grid.innerHTML = `
            <div class="stat-card"><div class="stat-card-number">${totalTests}</div><div class="stat-card-label">Tests Taken</div></div>
            <div class="stat-card"><div class="stat-card-number">${avgScore}%</div><div class="stat-card-label">Avg Score</div></div>
            <div class="stat-card"><div class="stat-card-number">${streak}</div><div class="stat-card-label">Day Streak</div></div>
            <div class="stat-card"><div class="stat-card-number">${totalPracticed}</div><div class="stat-card-label">English Done</div></div>
        `;
    }

    // ---- Streak ----
    function updateStreak() {
        const today = new Date().toISOString().slice(0, 10);
        const lastDate = LS.get("lastPracticeDate", "");
        let streak = LS.get("dailyStreak", 0);

        if (lastDate === today) return; // already logged today

        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (lastDate === yesterday) {
            // streak continues, but don't increment until they practice
        } else if (lastDate && lastDate !== yesterday) {
            // streak broken
            streak = 0;
            LS.set("dailyStreak", 0);
        }
    }

    function recordPractice() {
        const today = new Date().toISOString().slice(0, 10);
        const lastDate = LS.get("lastPracticeDate", "");
        let streak = LS.get("dailyStreak", 0);

        if (lastDate === today) return; // already counted today

        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (lastDate === yesterday || lastDate === today) {
            streak++;
        } else {
            streak = 1;
        }
        LS.set("dailyStreak", streak);
        LS.set("lastPracticeDate", today);

        // Check achievements
        checkAchievement("first_steps");
        if (streak >= 5) checkAchievement("streak_5");
    }

    // ---- Achievements ----
    function checkAchievement(id) {
        const unlocked = LS.get("achievements", {});
        if (unlocked[id]) return;
        unlocked[id] = Date.now();
        LS.set("achievements", unlocked);
        const a = ACHIEVEMENTS.find(x => x.id === id);
        if (a) showAchievementToast(a);
        renderAchievements();
    }

    function showAchievementToast(achievement) {
        const toast = $("#achievementToast");
        $("#achievementToastIcon").textContent = achievement.icon;
        $("#achievementToastTitle").textContent = achievement.name + " Unlocked!";
        $("#achievementToastDesc").textContent = achievement.desc;
        show(toast);
        fireConfetti();
        setTimeout(() => hide(toast), 4000);
    }

    // ================================================================
    //  CIVICS TEST
    // ================================================================

    async function loadCivicsTest(version) {
        testVersion = version;
        const url = version === "2008" ? "civics_2008.json" : "civics_2024.json";
        try {
            const resp = await fetch(url);
            questions = await resp.json();
        } catch (e) {
            questions = [];
            console.error("Failed to load civics questions:", e);
            return;
        }

        // Load known
        const savedKnown = LS.get(`known_${version}`, []);
        knownQuestions = new Set(savedKnown);

        navigateTo("studyApp");
        initCivicsPanels();
        switchCivicsMode("flashcards");
    }

    function initCivicsPanels() {
        populateCategoryFilters();
        initFlashcards();
        initListen();
        initPractice();
        initStudy();
        renderHistory();
    }

    // ---- Category Filters ----
    function populateCategoryFilters() {
        const cats = [...new Set(questions.map(q => q.category))];
        ["fcCategoryFilter", "listenCategoryFilter"].forEach(id => {
            const sel = $(`#${id}`);
            sel.innerHTML = '<option value="all">All Categories</option>';
            cats.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c; opt.textContent = c;
                sel.appendChild(opt);
            });
        });
    }

    // ---- Mode Switching ----
    function switchCivicsMode(mode) {
        currentMode = mode;
        speechSynthesis.cancel();
        $$(".mode-tab").forEach(t => {
            const active = t.dataset.mode === mode;
            t.classList.toggle("active", active);
            t.setAttribute("aria-selected", active);
        });
        $$(".mode-panel").forEach(p => p.classList.remove("active"));
        const panel = $(`#panel-${mode}`);
        if (panel) panel.classList.add("active");

        if (mode === "listen") renderListenCard();
        if (mode === "study") renderStudy();
        if (mode === "history") renderHistory();
    }

    // ================================================================
    //  FLASHCARDS
    // ================================================================

    function initFlashcards() {
        fcFiltered = [...questions];
        fcIndex = 0; fcFlipped = false;
        fcCorrectCount = 0; fcWrongCount = 0; fcWeakFilterActive = false;

        renderFlashcard();

        $("#flashcardWrapper").addEventListener("click", flipCard);
        $("#fcPrev").addEventListener("click", () => fcNav(-1));
        $("#fcNext").addEventListener("click", () => fcNav(1));
        $("#fcShuffle").addEventListener("click", shuffleFlashcards);
        $("#fcReadAloud").addEventListener("click", readFlashcardAloud);
        $("#fcGotRight").addEventListener("click", () => assessCard(true));
        $("#fcGotWrong").addEventListener("click", () => assessCard(false));
        $("#fcWeakFilter").addEventListener("click", toggleWeakFilter);
        $("#fcCategoryFilter").addEventListener("change", filterFlashcards);
    }

    function filterFlashcards() {
        const cat = $("#fcCategoryFilter").value;
        fcFiltered = cat === "all" ? [...questions] : questions.filter(q => q.category === cat);
        if (fcWeakFilterActive) {
            const weakIds = getWeakIds();
            fcFiltered = fcFiltered.filter(q => weakIds.has(q.id));
        }
        fcIndex = 0; fcFlipped = false;
        renderFlashcard();
    }

    function getWeakIds() {
        const scores = LS.get(`fc_scores_${testVersion}`, {});
        const weak = new Set();
        Object.entries(scores).forEach(([id, s]) => {
            if (s.wrong > 0 && s.wrong >= s.correct) weak.add(parseInt(id));
        });
        return weak;
    }

    function toggleWeakFilter() {
        fcWeakFilterActive = !fcWeakFilterActive;
        $("#fcWeakFilter").classList.toggle("active", fcWeakFilterActive);
        filterFlashcards();
    }

    function shuffleFlashcards() {
        for (let i = fcFiltered.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fcFiltered[i], fcFiltered[j]] = [fcFiltered[j], fcFiltered[i]];
        }
        fcIndex = 0; fcFlipped = false;
        renderFlashcard();
    }

    function renderFlashcard() {
        if (!fcFiltered.length) {
            $("#fcQuestion").textContent = "No questions match your filters.";
            $("#fcCategory").textContent = "";
            return;
        }
        const q = fcFiltered[fcIndex];
        $("#fcCategory").textContent = q.category + (q.subcategory ? " > " + q.subcategory : "");
        $("#fcCategoryBack").textContent = q.category;
        $("#fcQuestion").textContent = q.question;
        const answersList = $("#fcAnswers");
        answersList.innerHTML = "";
        q.answers.forEach(a => {
            const li = document.createElement("li");
            li.textContent = a;
            answersList.appendChild(li);
        });
        // Progress
        $("#fcProgress").textContent = `${fcIndex + 1} / ${fcFiltered.length}`;
        const pct = ((fcIndex + 1) / fcFiltered.length) * 100;
        $("#fcProgressBar").style.width = pct + "%";

        // Score display
        if (fcCorrectCount || fcWrongCount) {
            $("#fcScoreDisplay").textContent = `\u2705 ${fcCorrectCount} \u274C ${fcWrongCount}`;
        } else {
            $("#fcScoreDisplay").textContent = "";
        }

        // Reset flip
        const card = $("#flashcard");
        card.classList.remove("flipped");
        fcFlipped = false;
        hide($("#fcAssessment"));
    }

    function flipCard() {
        const card = $("#flashcard");
        fcFlipped = !fcFlipped;
        card.classList.toggle("flipped", fcFlipped);
        if (fcFlipped) show($("#fcAssessment"));
        else hide($("#fcAssessment"));
    }

    function fcNav(dir) {
        if (!fcFiltered.length) return;
        fcIndex = (fcIndex + dir + fcFiltered.length) % fcFiltered.length;
        fcFlipped = false;
        renderFlashcard();
    }

    function assessCard(correct) {
        const q = fcFiltered[fcIndex];
        const scores = LS.get(`fc_scores_${testVersion}`, {});
        if (!scores[q.id]) scores[q.id] = { correct: 0, wrong: 0 };
        if (correct) { scores[q.id].correct++; fcCorrectCount++; playSound("correct"); }
        else { scores[q.id].wrong++; fcWrongCount++; playSound("wrong"); }
        LS.set(`fc_scores_${testVersion}`, scores);
        recordPractice();
        fcNav(1);
    }

    function readFlashcardAloud() {
        if (!fcFiltered.length) return;
        const q = fcFiltered[fcIndex];
        const text = fcFlipped ? q.answers.join(". ") : q.question;
        speak(text);
    }

    // ================================================================
    //  LISTEN MODE
    // ================================================================

    function initListen() {
        listenFiltered = [...questions];
        listenIndex = 0;

        $("#listenPlayPause").addEventListener("click", toggleListenPlay);
        $("#listenPrev").addEventListener("click", () => listenNav(-1));
        $("#listenNext").addEventListener("click", () => listenNav(1));
        $("#listenCategoryFilter").addEventListener("change", filterListen);
        renderListenCard();
    }

    function filterListen() {
        const cat = $("#listenCategoryFilter").value;
        listenFiltered = cat === "all" ? [...questions] : questions.filter(q => q.category === cat);
        listenIndex = 0;
        renderListenCard();
    }

    function renderListenCard() {
        if (!listenFiltered.length) return;
        const q = listenFiltered[listenIndex];
        $("#listenProgress").textContent = `${listenIndex + 1} / ${listenFiltered.length}`;
        $("#listenCategory").textContent = q.category;
        $("#listenQuestion").textContent = q.question;
        $("#listenAnswer").textContent = q.answers.join(" / ");
    }

    function toggleListenPlay() {
        if (listenPlaying) {
            speechSynthesis.cancel();
            listenPlaying = false;
            showListenPlayIcon(false);
            return;
        }
        playListenCurrent();
    }

    function playListenCurrent() {
        if (!listenFiltered.length) return;
        const q = listenFiltered[listenIndex];
        const content = $("#listenContent").value;
        const speed = parseFloat($("#listenSpeed").value) || 1;
        let text = "";
        if (content === "questions" || content === "both") text += q.question + ". ";
        if (content === "answers" || content === "both") text += q.answers[0];
        listenPlaying = true;
        showListenPlayIcon(true);
        speak(text, speed, () => {
            listenPlaying = false;
            showListenPlayIcon(false);
        });
    }

    function showListenPlayIcon(playing) {
        const play = $(".play-icon");
        const pause = $(".pause-icon");
        if (playing) { hide(play); show(pause); }
        else { show(play); hide(pause); }
    }

    function listenNav(dir) {
        speechSynthesis.cancel();
        listenPlaying = false;
        showListenPlayIcon(false);
        if (!listenFiltered.length) return;
        listenIndex = (listenIndex + dir + listenFiltered.length) % listenFiltered.length;
        renderListenCard();
    }

    // ================================================================
    //  PRACTICE TEST
    // ================================================================

    function initPractice() {
        const countInput = $("#practiceQuestionCount");
        countInput.max = questions.length;
        countInput.addEventListener("input", updatePassInfo);
        updatePassInfo();

        $("#practiceBegin").addEventListener("click", startPracticeTest);
        $("#practiceSubmitAnswer").addEventListener("click", submitPracticeAnswer);
        $("#practiceRetake").addEventListener("click", retakePractice);
    }

    function updatePassInfo() {
        const count = parseInt($("#practiceQuestionCount").value) || 10;
        const pass = Math.ceil(count * 0.6);
        $("#practicePassInfo").textContent = `Need ${pass} correct to pass (60%)`;
    }

    function startPracticeTest() {
        practiceQuestionCount = Math.min(parseInt($("#practiceQuestionCount").value) || 10, questions.length);
        practiceTimerEnabled = $("#practiceTimer").checked;
        practiceStreakMode = $("#practiceStreakMode").checked;

        // Pick random questions
        const shuffled = [...questions].sort(() => Math.random() - 0.5);
        practiceQuestions = shuffled.slice(0, practiceQuestionCount);
        practiceIndex = 0;
        practiceScore = 0;
        practiceAnswers = [];
        practiceStreak = 0;
        practiceTotalAsked = 0;
        practiceSelectedChoice = null;

        hide($("#practiceStart"));
        show($("#practiceQuestion"));
        hide($("#practiceResults"));

        if (practiceStreakMode) show($("#streakCounter"));
        else hide($("#streakCounter"));

        renderPracticeQuestion();
    }

    function renderPracticeQuestion() {
        if (practiceIndex >= practiceQuestions.length) {
            finishPracticeTest();
            return;
        }
        const q = practiceQuestions[practiceIndex];
        practiceTotalAsked++;

        if (practiceStreakMode) {
            $("#practiceQNum").textContent = `Question ${practiceTotalAsked}`;
            updateStreakDisplay();
        } else {
            $("#practiceQNum").textContent = `Question ${practiceIndex + 1} of ${practiceQuestionCount}`;
        }

        // Progress ring
        const pct = practiceIndex / practiceQuestionCount;
        const circ = 326.73;
        $("#progressRingFill").style.strokeDashoffset = circ - pct * circ;
        $("#progressRingText").textContent = `${practiceIndex}/${practiceQuestionCount}`;

        // Score
        $("#practiceScoreLive").textContent = `Score: ${practiceScore}`;
        $("#practiceScoreLive").style.color = practiceScore > 0 ? "var(--success)" : "";

        // Question
        $("#practiceQuestionText").textContent = q.question;

        // Build choices (correct + 3 wrong from other questions)
        const correctAnswer = q.answers[0];
        const wrongPool = questions.filter(x => x.id !== q.id).sort(() => Math.random() - 0.5);
        const wrongs = wrongPool.slice(0, 3).map(x => x.answers[0]);
        const choices = [correctAnswer, ...wrongs].sort(() => Math.random() - 0.5);

        const choicesDiv = $("#practiceChoices");
        choicesDiv.innerHTML = "";
        practiceSelectedChoice = null;
        $("#practiceSubmitAnswer").disabled = true;

        choices.forEach(c => {
            const btn = document.createElement("button");
            btn.className = "practice-choice";
            btn.textContent = c;
            btn.addEventListener("click", () => selectChoice(btn, c));
            choicesDiv.appendChild(btn);
        });

        // Timer
        if (practiceTimerEnabled) {
            practiceTimeLeft = 30;
            show($("#practiceTimerDisplay"));
            renderTimer();
            clearInterval(practiceTimerInterval);
            practiceTimerInterval = setInterval(() => {
                practiceTimeLeft--;
                renderTimer();
                if (practiceTimeLeft <= 0) {
                    clearInterval(practiceTimerInterval);
                    autoSubmitTimeout();
                }
            }, 1000);
        } else {
            hide($("#practiceTimerDisplay"));
        }
    }

    function renderTimer() {
        const m = Math.floor(practiceTimeLeft / 60);
        const s = practiceTimeLeft % 60;
        $("#practiceTimerDisplay").textContent = `${m}:${s.toString().padStart(2, "0")}`;
    }

    function selectChoice(btn, value) {
        $$(".practice-choice").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        practiceSelectedChoice = value;
        $("#practiceSubmitAnswer").disabled = false;
    }

    function submitPracticeAnswer() {
        clearInterval(practiceTimerInterval);
        const q = practiceQuestions[practiceIndex];
        const correct = q.answers.some(a =>
            a.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim() ===
            (practiceSelectedChoice || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim()
        );

        // Highlight
        $$(".practice-choice").forEach(btn => {
            btn.style.pointerEvents = "none";
            const isCorrect = q.answers.some(a =>
                a.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim() ===
                btn.textContent.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim()
            );
            if (isCorrect) btn.classList.add("correct");
            if (btn.classList.contains("selected") && !isCorrect) btn.classList.add("wrong");
        });

        if (correct) {
            practiceScore++;
            practiceStreak++;
            playSound("correct");
        } else {
            playSound("wrong");
            if (practiceStreakMode) practiceStreak = 0;
        }

        practiceAnswers.push({
            question: q.question,
            correctAnswer: q.answers[0],
            userAnswer: practiceSelectedChoice,
            correct
        });

        if (practiceStreakMode) updateStreakDisplay();

        // Check streak win
        if (practiceStreakMode && practiceStreak >= 6) {
            setTimeout(() => finishPracticeTest(), 800);
            return;
        }

        // Move to next after delay
        setTimeout(() => {
            practiceIndex++;
            renderPracticeQuestion();
        }, 1200);
    }

    function autoSubmitTimeout() {
        practiceSelectedChoice = null;
        submitPracticeAnswer();
    }

    function updateStreakDisplay() {
        const flames = $("#streakFlames");
        flames.textContent = "";
        for (let i = 0; i < Math.min(practiceStreak, 6); i++) flames.textContent += "\u{1F525}";
        $("#streakNumber").textContent = practiceStreak;
    }

    function finishPracticeTest() {
        clearInterval(practiceTimerInterval);
        hide($("#practiceQuestion"));
        show($("#practiceResults"));

        const total = practiceAnswers.length;
        const pct = total ? Math.round((practiceScore / total) * 100) : 0;
        const pass = pct >= 60;

        if (pass) fireConfetti();

        // Checkmark
        $("#resultsCheckmark").textContent = pass ? "\u{2705}" : "\u{274C}";
        $("#resultsScore").textContent = `${practiceScore} / ${total} (${pct}%)`;
        $("#resultsScore").style.color = pass ? "var(--success)" : "var(--error)";
        $("#resultsStatus").textContent = pass ? "PASSED!" : "Keep Studying";
        $("#resultsStatus").style.color = pass ? "var(--success)" : "var(--error)";

        let statsHtml = "";
        if (practiceStreakMode) {
            statsHtml = `Streak mode \u2014 answered ${total} questions, best streak: ${Math.max(...practiceAnswers.reduce((acc, a, i) => {
                if (a.correct) acc[acc.length - 1]++;
                else acc.push(0);
                return acc;
            }, [0]))}`;
        } else {
            statsHtml = `${practiceScore} correct out of ${total} questions`;
        }
        $("#resultsStats").textContent = statsHtml;

        // Review
        const review = $("#resultsReview");
        review.innerHTML = "";
        practiceAnswers.forEach(a => {
            const div = document.createElement("div");
            div.className = "review-item";
            div.innerHTML = `<div class="review-q">${a.correct ? "\u2705" : "\u274C"} ${a.question}</div>
                <div class="review-a ${a.correct ? "review-correct" : "review-wrong"}">
                    ${a.correct ? a.correctAnswer : `Your answer: ${a.userAnswer || "(none)"} | Correct: ${a.correctAnswer}`}
                </div>`;
            review.appendChild(div);
        });

        // Save history
        const history = LS.get("testHistory", []);
        history.unshift({
            date: new Date().toISOString(),
            version: testVersion,
            score: practiceScore,
            total: total,
            streak: practiceStreakMode,
            passed: pass,
        });
        if (history.length > 50) history.length = 50;
        LS.set("testHistory", history);

        recordPractice();
        if (pct === 100) checkAchievement("civics_master");
    }

    function retakePractice() {
        hide($("#practiceResults"));
        show($("#practiceStart"));
    }

    // ================================================================
    //  STUDY MODE
    // ================================================================

    function initStudy() {
        $("#clearKnown").addEventListener("click", () => {
            knownQuestions.clear();
            LS.set(`known_${testVersion}`, []);
            renderStudy();
        });
    }

    function renderStudy() {
        const container = $("#studyCategories");
        container.innerHTML = "";

        const catMap = {};
        questions.forEach(q => {
            const cat = q.category;
            if (!catMap[cat]) catMap[cat] = [];
            catMap[cat].push(q);
        });

        Object.entries(catMap).forEach(([cat, qs]) => {
            const section = document.createElement("div");
            section.className = "study-category";

            const knownInCat = qs.filter(q => knownQuestions.has(q.id)).length;
            section.innerHTML = `
                <div class="study-category-header">
                    <div class="study-category-title">${cat}</div>
                    <div class="study-category-count">${knownInCat} / ${qs.length} known</div>
                </div>
                <div class="study-questions"></div>
            `;
            const qContainer = section.querySelector(".study-questions");
            qs.forEach(q => {
                const div = document.createElement("div");
                div.className = "study-question" + (knownQuestions.has(q.id) ? " known" : "");
                div.innerHTML = `<span class="sq-number">#${q.id}</span><span class="sq-text">${q.question}</span><div class="sq-answer">${q.answers.join(" / ")}</div>`;
                div.addEventListener("click", () => {
                    div.classList.toggle("expanded");
                    if (div.classList.contains("expanded")) {
                        if (!knownQuestions.has(q.id)) {
                            knownQuestions.add(q.id);
                            div.classList.add("known");
                            LS.set(`known_${testVersion}`, [...knownQuestions]);
                            updateKnownCount();
                        }
                    }
                });
                qContainer.appendChild(div);
            });
            container.appendChild(section);
        });
        updateKnownCount();
    }

    function updateKnownCount() {
        $("#knownCount").textContent = `${knownQuestions.size} marked as known`;
    }

    // ================================================================
    //  HISTORY
    // ================================================================

    function renderHistory() {
        const container = $("#historyContent");
        const history = LS.get("testHistory", []);

        if (!history.length) {
            container.innerHTML = '<div class="history-empty">No test history yet. Take a practice test to see your results here.</div>';
            return;
        }
        container.innerHTML = "";
        history.forEach(h => {
            const pct = Math.round((h.score / h.total) * 100);
            const div = document.createElement("div");
            div.className = "history-item";
            const date = new Date(h.date);
            const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
            div.innerHTML = `
                <div class="history-item-header">
                    <span class="history-item-date">${dateStr} \u2014 ${h.version} Test${h.streak ? " (Streak)" : ""}</span>
                    <span class="history-item-score ${h.passed ? "history-pass" : "history-fail"}">${pct}%</span>
                </div>
                <div class="history-item-details">${h.score} / ${h.total} correct \u2014 ${h.passed ? "PASSED" : "FAILED"}</div>
            `;
            container.appendChild(div);
        });
    }

    // ================================================================
    //  ENGLISH TEST
    // ================================================================

    async function loadEnglishData() {
        try {
            const resp = await fetch("english_test.json");
            englishData = await resp.json();
        } catch (e) {
            console.error("Failed to load English test data:", e);
        }
    }

    function checkSpeechAPI() {
        if (!SpeechRecognition) {
            show($("#speechApiWarning"));
        } else {
            hide($("#speechApiWarning"));
        }
    }

    function loadEnglishMode(mode) {
        if (!englishData) { alert("English test data is still loading. Please try again."); return; }
        engMode = mode;
        navigateTo("englishPractice");

        // Hide all sections
        hide($("#engReading"));
        hide($("#engWriting"));
        hide($("#engSpeaking"));
        hide($("#engMock"));

        switch (mode) {
            case "reading": initReading(); break;
            case "writing": initWriting(); break;
            case "speaking": initSpeaking(); break;
            case "mock": initMock(); break;
        }
    }

    // ---- Text Comparison ----
    function normalizeText(text) {
        return (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).filter(Boolean);
    }

    function compareTexts(target, spoken) {
        const tWords = normalizeText(target);
        const sWords = normalizeText(spoken);
        const result = [];
        let correct = 0;
        let ti = 0, si = 0;

        while (ti < tWords.length || si < sWords.length) {
            if (ti < tWords.length && si < sWords.length && tWords[ti] === sWords[si]) {
                result.push({ word: tWords[ti], status: "correct" });
                correct++;
                ti++; si++;
            } else if (ti < tWords.length && si < sWords.length) {
                // Check if target word appears later in spoken (skip extra)
                const futureInSpoken = sWords.indexOf(tWords[ti], si);
                const futureInTarget = tWords.indexOf(sWords[si], ti);

                if (futureInSpoken >= 0 && (futureInTarget < 0 || futureInSpoken - si <= futureInTarget - ti)) {
                    // Extra words in spoken before match
                    while (si < futureInSpoken) {
                        result.push({ word: sWords[si], status: "extra" });
                        si++;
                    }
                } else if (futureInTarget >= 0) {
                    // Missing words in spoken
                    while (ti < futureInTarget) {
                        result.push({ word: tWords[ti], status: "missing" });
                        ti++;
                    }
                } else {
                    result.push({ word: tWords[ti], status: "wrong", spoken: sWords[si] });
                    ti++; si++;
                }
            } else if (ti < tWords.length) {
                result.push({ word: tWords[ti], status: "missing" });
                ti++;
            } else {
                result.push({ word: sWords[si], status: "extra" });
                si++;
            }
        }

        const total = tWords.length;
        const score = total > 0 ? Math.round((correct / total) * 100) : 0;
        return { result, score, correct, total };
    }

    function renderComparison(result, containerId) {
        const el = $(`#${containerId}`);
        show(el);
        el.innerHTML = result.map(r => {
            switch (r.status) {
                case "correct": return `<span class="word-correct">${r.word}</span>`;
                case "wrong": return `<span class="word-wrong">${r.spoken || r.word}</span>`;
                case "missing": return `<span class="word-missing">[${r.word}]</span>`;
                case "extra": return `<span class="word-extra">${r.word}</span>`;
                default: return r.word;
            }
        }).join(" ");
    }

    function renderScoreBar(score, containerId) {
        const el = $(`#${containerId}`);
        show(el);
        const color = score >= 80 ? "var(--success)" : score >= 50 ? "var(--warning)" : "var(--error)";
        el.innerHTML = `Score: <span class="score-value" style="color:${color}">${score}%</span>`;
    }

    // ---- Speech Recognition ----
    function startRecognition(onResult) {
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
            return;
        }
        stopRecognition();
        recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;
        isRecording = true;

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            isRecording = false;
            onResult(transcript);
        };
        recognition.onerror = (e) => {
            isRecording = false;
            if (e.error !== "no-speech" && e.error !== "aborted") {
                console.warn("Speech recognition error:", e.error);
            }
            onResult("");
        };
        recognition.onend = () => {
            isRecording = false;
        };
        recognition.start();
    }

    function stopRecognition() {
        if (recognition) {
            try { recognition.abort(); } catch {}
            recognition = null;
        }
        isRecording = false;
    }

    // ================================================================
    //  READING PRACTICE
    // ================================================================

    function initReading() {
        show($("#engReading"));
        engReadingItems = [...englishData.reading];
        engReadingIndex = 0;
        renderReadingSentence();

        // Remove old listeners by cloning
        replaceClickHandler("readingListenFirst", () => {
            const s = engReadingItems[engReadingIndex];
            speak(s.sentence, 0.85);
        });
        replaceClickHandler("readingMic", startReadingRecognition);
        replaceClickHandler("readingPrev", () => { engReadingIndex = Math.max(0, engReadingIndex - 1); renderReadingSentence(); });
        replaceClickHandler("readingNext", () => { engReadingIndex = Math.min(engReadingItems.length - 1, engReadingIndex + 1); renderReadingSentence(); });
        replaceClickHandler("readingShuffle", () => {
            shuffleArray(engReadingItems);
            engReadingIndex = 0;
            renderReadingSentence();
        });
    }

    function renderReadingSentence() {
        const s = engReadingItems[engReadingIndex];
        $("#readingSentence").textContent = s.sentence;
        $("#readingProgress").textContent = `${engReadingIndex + 1} / ${engReadingItems.length}`;
        hide($("#readingResult"));
        hide($("#readingScoreBar"));
        hide($("#readingMicStatus"));
        const mic = $("#readingMic");
        mic.classList.remove("recording");
    }

    function startReadingRecognition() {
        const mic = $("#readingMic");
        if (isRecording) {
            stopRecognition();
            mic.classList.remove("recording");
            hide($("#readingMicStatus"));
            return;
        }

        mic.classList.add("recording");
        show($("#readingMicStatus"));

        startRecognition((transcript) => {
            mic.classList.remove("recording");
            hide($("#readingMicStatus"));

            if (!transcript) {
                show($("#readingResult"));
                $("#readingResult").innerHTML = '<span class="word-wrong">No speech detected. Try again.</span>';
                return;
            }

            const target = engReadingItems[engReadingIndex].sentence;
            const { result, score } = compareTexts(target, transcript);
            renderComparison(result, "readingResult");
            renderScoreBar(score, "readingScoreBar");

            // Track progress
            engReadingCompleted.add(engReadingItems[engReadingIndex].id);
            LS.set("eng_reading_done", [...engReadingCompleted]);
            recordPractice();

            if (score === 100) {
                engReadingPerfect++;
                LS.set("eng_reading_perfect", engReadingPerfect);
                if (engReadingPerfect >= 10) checkAchievement("perfect_reader");
                playSound("correct");
            }
        });
    }

    // ================================================================
    //  WRITING PRACTICE
    // ================================================================

    function initWriting() {
        show($("#engWriting"));
        engWritingItems = [...englishData.writing];
        engWritingIndex = 0;
        renderWritingSentence();

        replaceClickHandler("writingPlay", () => playWritingSentence());
        replaceClickHandler("writingReplay", () => playWritingSentence());
        replaceClickHandler("writingCheck", checkWriting);
        replaceClickHandler("writingPrev", () => { engWritingIndex = Math.max(0, engWritingIndex - 1); renderWritingSentence(); });
        replaceClickHandler("writingNext", () => { engWritingIndex = Math.min(engWritingItems.length - 1, engWritingIndex + 1); renderWritingSentence(); });
        replaceClickHandler("writingShuffle", () => {
            shuffleArray(engWritingItems);
            engWritingIndex = 0;
            renderWritingSentence();
        });

        // Enter key submits
        $("#writingInput").addEventListener("keydown", (e) => {
            if (e.key === "Enter") checkWriting();
        });
    }

    function renderWritingSentence() {
        $("#writingProgress").textContent = `${engWritingIndex + 1} / ${engWritingItems.length}`;
        $("#writingInput").value = "";
        hide($("#writingResult"));
        hide($("#writingScoreBar"));
        hide($("#writingReplay"));
        $("#writingInput").focus();
    }

    function playWritingSentence() {
        const s = engWritingItems[engWritingIndex];
        speak(s.sentence, 0.85);
        show($("#writingReplay"));
    }

    function checkWriting() {
        const userText = $("#writingInput").value.trim();
        if (!userText) return;

        const target = engWritingItems[engWritingIndex].sentence;
        const { result, score } = compareTexts(target, userText);
        renderComparison(result, "writingResult");
        renderScoreBar(score, "writingScoreBar");

        engWritingCompleted.add(engWritingItems[engWritingIndex].id);
        LS.set("eng_writing_done", [...engWritingCompleted]);
        recordPractice();

        if (score === 100) {
            engWritingPerfect++;
            LS.set("eng_writing_perfect", engWritingPerfect);
            if (engWritingPerfect >= 10) checkAchievement("dictation_pro");
            playSound("correct");
        }
    }

    // ================================================================
    //  SPEAKING PRACTICE
    // ================================================================

    function initSpeaking() {
        show($("#engSpeaking"));
        engSpeakingItems = [...englishData.speaking];
        engSpeakingIndex = 0;
        renderSpeakingPrompt();

        replaceClickHandler("speakingMic", startSpeakingRecognition);
        replaceClickHandler("speakingPrev", () => { engSpeakingIndex = Math.max(0, engSpeakingIndex - 1); renderSpeakingPrompt(); });
        replaceClickHandler("speakingNext", () => { engSpeakingIndex = Math.min(engSpeakingItems.length - 1, engSpeakingIndex + 1); renderSpeakingPrompt(); });
        replaceClickHandler("speakingShuffle", () => {
            shuffleArray(engSpeakingItems);
            engSpeakingIndex = 0;
            renderSpeakingPrompt();
        });
    }

    function renderSpeakingPrompt() {
        const p = engSpeakingItems[engSpeakingIndex];
        $("#speakingPrompt").textContent = p.prompt;
        $("#speakingProgress").textContent = `${engSpeakingIndex + 1} / ${engSpeakingItems.length}`;
        hide($("#speakingSample"));
        hide($("#speakingTranscript"));
        hide($("#speakingFeedback"));
        hide($("#speakingMicStatus"));
        $("#speakingMic").classList.remove("recording");
    }

    function startSpeakingRecognition() {
        const mic = $("#speakingMic");
        if (isRecording) {
            stopRecognition();
            mic.classList.remove("recording");
            hide($("#speakingMicStatus"));
            return;
        }

        mic.classList.add("recording");
        show($("#speakingMicStatus"));

        startRecognition((transcript) => {
            mic.classList.remove("recording");
            hide($("#speakingMicStatus"));

            const p = engSpeakingItems[engSpeakingIndex];

            // Show sample
            show($("#speakingSample"));
            $("#speakingSampleText").textContent = p.sampleAnswer;

            if (!transcript) {
                show($("#speakingFeedback"));
                $("#speakingFeedback").textContent = "No speech detected. Try again.";
                $("#speakingFeedback").style.color = "var(--error)";
                $("#speakingFeedback").style.background = "var(--error-bg)";
                return;
            }

            // Show transcript
            show($("#speakingTranscript"));
            $("#speakingTranscriptText").textContent = transcript;

            // Simple scoring: check word count and if it contains relevant words
            const words = normalizeText(transcript);
            const wordCount = words.length;
            let feedback = "";
            let feedbackColor = "";
            let feedbackBg = "";

            if (wordCount >= 3) {
                feedback = "Good response! You spoke a complete answer.";
                feedbackColor = "var(--success)";
                feedbackBg = "var(--success-bg)";
                playSound("correct");
            } else if (wordCount >= 1) {
                feedback = "Try to answer in a full sentence for better practice.";
                feedbackColor = "var(--warning)";
                feedbackBg = "var(--warning-bg)";
            } else {
                feedback = "Try again with a more complete answer.";
                feedbackColor = "var(--error)";
                feedbackBg = "var(--error-bg)";
            }

            show($("#speakingFeedback"));
            $("#speakingFeedback").textContent = feedback;
            $("#speakingFeedback").style.color = feedbackColor;
            $("#speakingFeedback").style.background = feedbackBg;

            // Track
            engSpeakingCompleted.add(p.id);
            LS.set("eng_speaking_done", [...engSpeakingCompleted]);
            recordPractice();
        });
    }

    // ================================================================
    //  MOCK TEST
    // ================================================================

    function initMock() {
        show($("#engMock"));
        mockPhase = null;
        mockStep = 0;
        mockScores = { reading: [], writing: [], speaking: 0 };

        // Pick 3 random reading, 3 writing
        const rShuffled = [...englishData.reading].sort(() => Math.random() - 0.5);
        mockReadingSentences = rShuffled.slice(0, 3);
        const wShuffled = [...englishData.writing].sort(() => Math.random() - 0.5);
        mockWritingSentences = wShuffled.slice(0, 3);

        hide($("#mockResults"));
        renderMockStart();
    }

    function renderMockStart() {
        const content = $("#mockContent");
        content.innerHTML = `
            <div style="text-align:center; padding:20px">
                <div style="font-size:2rem; margin-bottom:16px">\u{1F3C6}</div>
                <h3 style="margin-bottom:8px">Full English Mock Test</h3>
                <p style="color:var(--text-secondary); margin-bottom:20px">This simulates the real USCIS English test:<br>3 Reading sentences + 3 Writing sentences + Speaking section</p>
                <button class="primary-btn" id="mockStartBtn">Begin Mock Test</button>
            </div>
        `;
        $("#mockProgress").textContent = "";
        $("#mockTimer").textContent = "";
        hide($("#mockActions").querySelector && $("#mockActions"));
        $("#mockActions").innerHTML = "";

        replaceClickHandler("mockStartBtn", () => {
            mockPhase = "reading";
            mockStep = 0;
            renderMockReading();
        });
    }

    function clearMockTimer() {
        if (mockTimerInterval) { clearInterval(mockTimerInterval); mockTimerInterval = null; }
    }

    function startMockCountdown(seconds, onDone) {
        clearMockTimer();
        mockTimeLeft = seconds;
        renderMockTimerDisplay();
        mockTimerInterval = setInterval(() => {
            mockTimeLeft--;
            renderMockTimerDisplay();
            if (mockTimeLeft <= 0) {
                clearMockTimer();
                if (onDone) onDone();
            }
        }, 1000);
    }

    function renderMockTimerDisplay() {
        const m = Math.floor(mockTimeLeft / 60);
        const s = mockTimeLeft % 60;
        $("#mockTimer").textContent = `${m}:${s.toString().padStart(2, "0")}`;
    }

    // ---- Mock Reading ----
    function renderMockReading() {
        const sentence = mockReadingSentences[mockStep];
        $("#mockProgress").textContent = `Reading ${mockStep + 1} / 3`;

        const content = $("#mockContent");
        content.innerHTML = `
            <div class="mock-section-label">Reading Section</div>
            <div class="mock-instruction">Read the following sentence aloud:</div>
            <div class="eng-sentence" style="margin-bottom:0">${sentence.sentence}</div>
            <div class="eng-result" id="mockReadingResult" style="display:none;margin-top:16px"></div>
            <div class="eng-score-bar" id="mockReadingScore" style="display:none;margin-top:8px"></div>
        `;

        const actions = $("#mockActions");
        actions.innerHTML = `
            <button class="fab-btn" id="mockReadingMic" aria-label="Read aloud">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
        `;

        startMockCountdown(30, () => advanceMockReading(0));

        replaceClickHandler("mockReadingMic", () => {
            const mic = $("#mockReadingMic");
            if (isRecording) { stopRecognition(); mic.classList.remove("recording"); return; }
            mic.classList.add("recording");

            startRecognition((transcript) => {
                mic.classList.remove("recording");
                const { result, score } = compareTexts(sentence.sentence, transcript || "");
                renderComparison(result, "mockReadingResult");
                renderScoreBar(score, "mockReadingScore");
                mockScores.reading.push(score);
                clearMockTimer();
                setTimeout(() => advanceMockReading(), 1500);
            });
        });
    }

    function advanceMockReading(score) {
        if (score !== undefined) mockScores.reading.push(score);
        mockStep++;
        if (mockStep < 3) {
            renderMockReading();
        } else {
            mockPhase = "writing";
            mockStep = 0;
            renderMockWriting();
        }
    }

    // ---- Mock Writing ----
    function renderMockWriting() {
        const sentence = mockWritingSentences[mockStep];
        $("#mockProgress").textContent = `Writing ${mockStep + 1} / 3`;

        const content = $("#mockContent");
        content.innerHTML = `
            <div class="mock-section-label">Writing Section (Dictation)</div>
            <div class="mock-instruction">Listen to the sentence, then type what you heard:</div>
            <div class="eng-writing-prompt" style="margin-bottom:16px">
                <button class="action-btn action-btn--secondary" id="mockWritingPlay">Play Sentence</button>
            </div>
            <div class="eng-writing-input-row">
                <input type="text" class="eng-input" id="mockWritingInput" placeholder="Type what you hear..." autocomplete="off" spellcheck="false">
                <button class="primary-btn" id="mockWritingCheck">Check</button>
            </div>
            <div class="eng-result" id="mockWritingResult" style="display:none"></div>
            <div class="eng-score-bar" id="mockWritingScore" style="display:none"></div>
        `;
        $("#mockActions").innerHTML = "";

        startMockCountdown(45, () => submitMockWriting());

        replaceClickHandler("mockWritingPlay", () => speak(sentence.sentence, 0.85));
        replaceClickHandler("mockWritingCheck", () => submitMockWriting());
        const input = $("#mockWritingInput");
        input.addEventListener("keydown", (e) => { if (e.key === "Enter") submitMockWriting(); });

        // Auto-play the sentence
        setTimeout(() => speak(sentence.sentence, 0.85), 500);
    }

    function submitMockWriting() {
        clearMockTimer();
        const sentence = mockWritingSentences[mockStep];
        const userText = ($("#mockWritingInput") ? $("#mockWritingInput").value : "").trim();
        const { result, score } = compareTexts(sentence.sentence, userText);
        renderComparison(result, "mockWritingResult");
        renderScoreBar(score, "mockWritingScore");
        mockScores.writing.push(score);

        setTimeout(() => advanceMockWriting(), 1500);
    }

    function advanceMockWriting() {
        mockStep++;
        if (mockStep < 3) {
            renderMockWriting();
        } else {
            mockPhase = "speaking";
            mockStep = 0;
            renderMockSpeaking();
        }
    }

    // ---- Mock Speaking ----
    function renderMockSpeaking() {
        // Just one speaking prompt for the mock
        const prompt = englishData.speaking[Math.floor(Math.random() * englishData.speaking.length)];
        $("#mockProgress").textContent = "Speaking";

        const content = $("#mockContent");
        content.innerHTML = `
            <div class="mock-section-label">Speaking Section</div>
            <div class="mock-instruction">Answer the following question:</div>
            <div class="eng-speaking-prompt">${prompt.prompt}</div>
            <div id="mockSpeakingTranscript" style="display:none;text-align:center;padding:12px;background:var(--primary-lighter);border-radius:8px;margin-top:12px"></div>
        `;

        const actions = $("#mockActions");
        actions.innerHTML = `
            <button class="fab-btn" id="mockSpeakingMic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
        `;

        startMockCountdown(30, () => finishMockSpeaking(0));

        replaceClickHandler("mockSpeakingMic", () => {
            const mic = $("#mockSpeakingMic");
            if (isRecording) { stopRecognition(); mic.classList.remove("recording"); return; }
            mic.classList.add("recording");

            startRecognition((transcript) => {
                mic.classList.remove("recording");
                clearMockTimer();

                if (transcript) {
                    show($("#mockSpeakingTranscript"));
                    $("#mockSpeakingTranscript").innerHTML = `<strong>You said:</strong> ${transcript}`;
                    const words = normalizeText(transcript);
                    const score = words.length >= 3 ? 100 : words.length >= 1 ? 50 : 0;
                    finishMockSpeaking(score);
                } else {
                    finishMockSpeaking(0);
                }
            });
        });
    }

    function finishMockSpeaking(score) {
        clearMockTimer();
        mockScores.speaking = score;
        setTimeout(renderMockResults, 1500);
    }

    // ---- Mock Results ----
    function renderMockResults() {
        mockPhase = "results";
        $("#mockProgress").textContent = "Results";
        $("#mockTimer").textContent = "";
        $("#mockActions").innerHTML = "";

        const readingAvg = mockScores.reading.length
            ? Math.round(mockScores.reading.reduce((a, b) => a + b, 0) / mockScores.reading.length)
            : 0;
        const writingAvg = mockScores.writing.length
            ? Math.round(mockScores.writing.reduce((a, b) => a + b, 0) / mockScores.writing.length)
            : 0;
        const speakingScore = mockScores.speaking;
        const overall = Math.round((readingAvg + writingAvg + speakingScore) / 3);
        const passed = overall >= 60;

        if (passed) fireConfetti();

        const content = $("#mockContent");
        content.innerHTML = `
            <div class="mock-results-card">
                <div style="font-size:3rem; margin-bottom:12px">${passed ? "\u{2705}" : "\u{274C}"}</div>
                <div style="font-size:2.5rem; font-weight:800; color:${passed ? "var(--success)" : "var(--error)"}; margin-bottom:8px">${overall}%</div>
                <div style="font-size:1.1rem; font-weight:700; color:${passed ? "var(--success)" : "var(--error)"}; margin-bottom:20px">${passed ? "PASSED!" : "Keep Practicing"}</div>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:24px">
                    <div class="stat-card"><div class="stat-card-number">${readingAvg}%</div><div class="stat-card-label">Reading</div></div>
                    <div class="stat-card"><div class="stat-card-number">${writingAvg}%</div><div class="stat-card-label">Writing</div></div>
                    <div class="stat-card"><div class="stat-card-number">${speakingScore}%</div><div class="stat-card-label">Speaking</div></div>
                </div>
                <button class="primary-btn" id="mockRetake">Take Another Mock Test</button>
            </div>
        `;

        replaceClickHandler("mockRetake", initMock);
        recordPractice();
    }

    // ================================================================
    //  KEYBOARD SHORTCUTS
    // ================================================================

    function handleKeyboard(e) {
        // Ignore if in input
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
        // Ignore if modal open
        if ($("#settingsModal").style.display !== "none" || $("#shortcutsModal").style.display !== "none") return;

        if (currentScreen === "studyApp" && currentMode === "flashcards") {
            switch (e.key) {
                case " ":
                    e.preventDefault();
                    flipCard();
                    break;
                case "ArrowLeft":
                    fcNav(-1);
                    break;
                case "ArrowRight":
                    fcNav(1);
                    break;
                case "r": case "R":
                    readFlashcardAloud();
                    break;
                case "s": case "S":
                    shuffleFlashcards();
                    break;
                case "1":
                    if (fcFlipped) assessCard(true);
                    break;
                case "2":
                    if (fcFlipped) assessCard(false);
                    break;
            }
        }

        if (e.key === "d" || e.key === "D") {
            $("#darkModeToggle").click();
        }
    }

    // ================================================================
    //  UTILITIES
    // ================================================================

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    function replaceClickHandler(id, handler) {
        const el = typeof id === "string" ? $(`#${id}`) : id;
        if (!el) return;
        const clone = el.cloneNode(true);
        el.parentNode.replaceChild(clone, el);
        clone.addEventListener("click", handler);
    }

    // ================================================================
    //  N-400 ELIGIBILITY CHECK
    // ================================================================

    let eligStep = 0;
    let eligResults = [];   // {label, color, text}
    let eligTrack = 5;      // 3 or 5 year track
    let eligIsMale = false;

    const ELIG_LABELS = [
        "Age", "Green Card Status", "Basis for Filing", "Physical Presence",
        "Long Trips", "State Residence", "Selective Service", "Taxes",
        "Criminal History", "English & Civics", "Oath of Allegiance"
    ];

    function eligStartOver() {
        eligStep = 0;
        eligResults = [];
        eligTrack = 5;
        eligIsMale = false;
        eligRenderStep();
    }

    function eligRenderStep() {
        const total = 11;
        const fill = $("#eligProgressFill");
        const label = $("#eligStepLabel");
        const content = $("#eligContent");
        if (!fill || !content) return;

        if (eligStep < total) {
            fill.style.width = ((eligStep / total) * 100) + "%";
            label.textContent = "Step " + (eligStep + 1) + " of " + total;
        } else {
            fill.style.width = "100%";
            label.textContent = "Results";
        }

        switch (eligStep) {
            case 0: return eligRenderQ("Are you at least 18 years old?", [
                { text: "Yes", color: "green", msg: "You meet the age requirement." },
                { text: "No", color: "red", msg: "You must be at least 18 to apply for naturalization." }
            ]);
            case 1: return eligRenderQ("Are you a Lawful Permanent Resident (green card holder)?", [
                { text: "Yes", color: "green", msg: "You have the required immigration status." },
                { text: "No", color: "red", msg: "You must have a green card before applying for citizenship." }
            ]);
            case 2: return eligRenderQ("Which best describes your situation?", [
                { text: "I've been a permanent resident for 5+ years", color: "green", msg: "You meet the continuous residence requirement for the 5-year track.", fn() { eligTrack = 5; } },
                { text: "I've been a permanent resident for 3+ years AND married to a US citizen", color: "green", msg: "You meet the continuous residence requirement for the 3-year track.", fn() { eligTrack = 3; } },
                { text: "I've been a permanent resident for less than 3 years", color: "red", msg: "You may need to wait longer before applying." },
                { text: "I'm not sure", color: "yellow", msg: "Check your green card for the date you became a permanent resident." }
            ]);
            case 3: {
                const q = eligTrack === 3
                    ? "Have you been physically present in the United States for at least 18 months out of the last 3 years?"
                    : "Have you been physically present in the United States for at least 30 months (2.5 years) out of the last 5 years?";
                return eligRenderQ(q, [
                    { text: "Yes", color: "green", msg: "You meet the physical presence requirement." },
                    { text: "Not sure", color: "yellow", msg: "Add up all your time outside the US. Every day abroad counts against you." },
                    { text: "No", color: "red", msg: "You may need to wait until you meet the physical presence requirement." }
                ]);
            }
            case 4: return eligRenderQ("Have you taken any single trip outside the United States lasting 6 months or longer?", [
                { text: "No", color: "green", msg: "Your continuous residence is intact." },
                { text: "Yes, between 6\u201312 months", color: "yellow", msg: "Trips of 6\u201312 months may disrupt your continuous residence. You may need to show you maintained ties to the US. Consider consulting an attorney." },
                { text: "Yes, 1 year or longer", color: "red", msg: "A trip of 1+ year generally breaks continuous residence. You may need to restart the waiting period. Consult an immigration attorney." }
            ]);
            case 5: return eligRenderQ("Have you lived in the state where you plan to file for at least 3 months?", [
                { text: "Yes", color: "green", msg: "You meet the state residence requirement." },
                { text: "No", color: "yellow", msg: "You\u2019ll need to wait or file in your previous state." }
            ]);
            case 6: return eligRenderSelectiveService();
            case 7: return eligRenderQ("Have you filed all required federal, state, and local tax returns since becoming a permanent resident?", [
                { text: "Yes", color: "green", msg: "Good. Keep copies of your tax transcripts for the interview." },
                { text: "No, but I can file them before my interview", color: "yellow", msg: "File any missing returns as soon as possible. USCIS may ask for tax transcripts." },
                { text: "No, and I\u2019m not sure I can", color: "red", msg: "Failure to file required tax returns may be a bar to good moral character. Consider consulting a tax professional and an immigration attorney." }
            ]);
            case 8: return eligRenderQ('Have you EVER been arrested, cited, charged, or convicted of a crime or offense (including traffic offenses like DUI)?', [
                { text: "No, never", color: "green", msg: "No criminal history concerns." },
                { text: "Yes, only minor traffic tickets (no DUI, no criminal charges)", color: "yellow", msg: "You must disclose everything on your application, but minor traffic tickets are usually not a problem." },
                { text: "Yes, I have been arrested or convicted of a crime", color: "red", msg: 'Criminal history requires careful analysis. Some offenses may be a bar to citizenship. Strongly recommend consulting an immigration attorney before applying.<br><br><strong>Important:</strong> You must disclose ALL arrests and charges, even if dismissed, expunged, or sealed.' }
            ]);
            case 9: return eligRenderQ("Are you comfortable with basic English reading, writing, and speaking?", [
                { text: "Yes", color: "green", msg: "Practice using the Civics Test and English Test sections on this site!" },
                { text: "I\u2019m studying", color: "green", msg: "Keep practicing! Use the study tools on this site." },
                { text: "I may qualify for an exemption (age/disability)", color: "green", msg: 'You may qualify for an exemption. <a href="https://www.uscis.gov/citizenship/exceptions-and-accommodations" target="_blank" rel="noopener">Check USCIS.gov for details</a>.' },
                { text: "I\u2019m not sure", color: "yellow", msg: "You\u2019ll need to be able to read, write, and speak basic English. Start practicing now!" }
            ]);
            case 10: return eligRenderQ("Are you willing to take the Oath of Allegiance to the United States?", [
                { text: "Yes", color: "green", msg: "Great. The Oath is the final step of the naturalization ceremony." },
                { text: "Yes, but with religious/conscientious objector modification", color: "green", msg: "Modifications are available for religious beliefs. You can be excused from the \u201Cbear arms\u201D portion." },
                { text: "No or not sure", color: "yellow", msg: "You must be willing to swear loyalty to the United States to become a citizen." }
            ]);
            default: return eligRenderSummary();
        }
    }

    function eligRenderQ(question, options) {
        const content = $("#eligContent");
        let html = '<div class="elig-step"><div class="glass-card" style="padding:32px;">';
        html += '<div class="elig-question">' + question + '</div>';
        html += '<div class="elig-options" id="eligOptions">';
        options.forEach((opt, i) => {
            html += '<button class="elig-option" data-idx="' + i + '">' + opt.text + '</button>';
        });
        html += '</div>';
        html += '<div id="eligResultArea"></div>';
        html += '</div></div>';
        content.innerHTML = html;

        content.querySelectorAll(".elig-option").forEach(btn => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.dataset.idx);
                const opt = options[idx];
                // Disable all options
                content.querySelectorAll(".elig-option").forEach(b => { b.disabled = true; b.style.opacity = "0.5"; });
                btn.style.opacity = "1";
                btn.style.borderColor = opt.color === "green" ? "var(--success)" : opt.color === "yellow" ? "var(--warning)" : "var(--error)";
                if (opt.fn) opt.fn();
                // Show result + next
                const area = $("#eligResultArea");
                area.innerHTML = '<div class="elig-result elig-result--' + opt.color + '">' + opt.msg + '</div>'
                    + '<button class="elig-next-btn" id="eligNextBtn">Next \u2192</button>';
                // Store result
                eligResults[eligStep] = { label: ELIG_LABELS[eligStep], color: opt.color, text: opt.msg };
                $("#eligNextBtn").addEventListener("click", () => { eligStep++; eligRenderStep(); });
                area.scrollIntoView({ behavior: "smooth", block: "nearest" });
            });
        });
    }

    // Selective Service — multi-part conditional
    function eligRenderSelectiveService() {
        const content = $("#eligContent");
        let html = '<div class="elig-step"><div class="glass-card" style="padding:32px;">';
        html += '<div class="elig-question">Are you male?</div>';
        html += '<div class="elig-options" id="eligOptions">';
        html += '<button class="elig-option" data-choice="no">No</button>';
        html += '<button class="elig-option" data-choice="yes">Yes</button>';
        html += '</div>';
        html += '<div id="eligResultArea"></div>';
        html += '</div></div>';
        content.innerHTML = html;

        content.querySelectorAll(".elig-option").forEach(btn => {
            btn.addEventListener("click", () => {
                content.querySelectorAll(".elig-option").forEach(b => { b.disabled = true; b.style.opacity = "0.5"; });
                btn.style.opacity = "1";
                if (btn.dataset.choice === "no") {
                    eligIsMale = false;
                    eligResults[6] = { label: "Selective Service", color: "green", text: "Selective Service registration is not required." };
                    const area = $("#eligResultArea");
                    area.innerHTML = '<div class="elig-result elig-result--green">Selective Service registration is not required for you.</div>'
                        + '<button class="elig-next-btn" id="eligNextBtn">Next \u2192</button>';
                    $("#eligNextBtn").addEventListener("click", () => { eligStep++; eligRenderStep(); });
                } else {
                    eligIsMale = true;
                    eligSSPart2();
                }
            });
        });
    }

    function eligSSPart2() {
        const area = $("#eligResultArea");
        area.innerHTML = '<div class="elig-question" style="margin-top:20px;">Are you between 18 and 26 years old, OR were you ever in the US between ages 18\u201326?</div>'
            + '<div class="elig-options" id="eligSSOptions2">'
            + '<button class="elig-option" data-choice="no">No (I was never in the US during ages 18\u201326)</button>'
            + '<button class="elig-option" data-choice="current">Yes, I\u2019m currently between 18 and 26</button>'
            + '<button class="elig-option" data-choice="past">Yes, but I\u2019m over 26 now</button>'
            + '</div><div id="eligSSArea2"></div>';

        area.querySelectorAll("#eligSSOptions2 .elig-option").forEach(btn => {
            btn.addEventListener("click", () => {
                area.querySelectorAll("#eligSSOptions2 .elig-option").forEach(b => { b.disabled = true; b.style.opacity = "0.5"; });
                btn.style.opacity = "1";
                const area2 = $("#eligSSArea2");
                if (btn.dataset.choice === "no") {
                    eligResults[6] = { label: "Selective Service", color: "green", text: "Not applicable \u2014 you were not in the US during the required age range." };
                    area2.innerHTML = '<div class="elig-result elig-result--green">Selective Service registration does not apply in your case.</div>'
                        + '<button class="elig-next-btn" id="eligNextBtn">Next \u2192</button>';
                    $("#eligNextBtn").addEventListener("click", () => { eligStep++; eligRenderStep(); });
                } else if (btn.dataset.choice === "current") {
                    eligSSPart3Current(area2);
                } else {
                    eligSSPart3Past(area2);
                }
            });
        });
    }

    function eligSSPart3Current(container) {
        container.innerHTML = '<div class="elig-question" style="margin-top:20px;">Have you registered for the Selective Service?</div>'
            + '<div class="elig-options" id="eligSSOptions3">'
            + '<button class="elig-option" data-choice="yes">Yes</button>'
            + '<button class="elig-option" data-choice="no">No</button>'
            + '</div><div id="eligSSArea3"></div>';

        container.querySelectorAll("#eligSSOptions3 .elig-option").forEach(btn => {
            btn.addEventListener("click", () => {
                container.querySelectorAll("#eligSSOptions3 .elig-option").forEach(b => { b.disabled = true; b.style.opacity = "0.5"; });
                btn.style.opacity = "1";
                const area3 = $("#eligSSArea3");
                if (btn.dataset.choice === "yes") {
                    eligResults[6] = { label: "Selective Service", color: "green", text: "Registered for Selective Service." };
                    area3.innerHTML = '<div class="elig-result elig-result--green">You\u2019re registered. No issues here.</div>'
                        + '<button class="elig-next-btn" id="eligNextBtn">Next \u2192</button>';
                } else {
                    eligResults[6] = { label: "Selective Service", color: "yellow", text: "Should register at sss.gov before applying." };
                    area3.innerHTML = '<div class="elig-result elig-result--yellow">You should register now before applying. <a href="https://www.sss.gov" target="_blank" rel="noopener">Register at sss.gov</a></div>'
                        + '<button class="elig-next-btn" id="eligNextBtn">Next \u2192</button>';
                }
                $("#eligNextBtn").addEventListener("click", () => { eligStep++; eligRenderStep(); });
            });
        });
    }

    function eligSSPart3Past(container) {
        container.innerHTML = '<div class="elig-question" style="margin-top:20px;">Did you register for the Selective Service when you were between 18\u201326?</div>'
            + '<div class="elig-options" id="eligSSOptions3">'
            + '<button class="elig-option" data-choice="yes">Yes</button>'
            + '<button class="elig-option" data-choice="no">No</button>'
            + '</div><div id="eligSSArea3"></div>';

        container.querySelectorAll("#eligSSOptions3 .elig-option").forEach(btn => {
            btn.addEventListener("click", () => {
                container.querySelectorAll("#eligSSOptions3 .elig-option").forEach(b => { b.disabled = true; b.style.opacity = "0.5"; });
                btn.style.opacity = "1";
                const area3 = $("#eligSSArea3");
                if (btn.dataset.choice === "yes") {
                    eligResults[6] = { label: "Selective Service", color: "green", text: "Registered for Selective Service." };
                    area3.innerHTML = '<div class="elig-result elig-result--green">You\u2019re registered. No issues here.</div>'
                        + '<button class="elig-next-btn" id="eligNextBtn">Next \u2192</button>';
                } else {
                    eligResults[6] = { label: "Selective Service", color: "yellow", text: "May need a Status Information Letter from Selective Service." };
                    area3.innerHTML = '<div class="elig-result elig-result--yellow">You may need to request a Status Information Letter. This can affect your application. <a href="https://www.sss.gov/verify/sil/" target="_blank" rel="noopener">Request a Status Information Letter</a></div>'
                        + '<button class="elig-next-btn" id="eligNextBtn">Next \u2192</button>';
                }
                $("#eligNextBtn").addEventListener("click", () => { eligStep++; eligRenderStep(); });
            });
        });
    }

    function eligRenderSummary() {
        const content = $("#eligContent");
        let greens = 0, yellows = 0, reds = 0;
        eligResults.forEach(r => {
            if (r.color === "green") greens++;
            else if (r.color === "yellow") yellows++;
            else reds++;
        });

        let verdictClass, verdictMsg;
        if (reds > 0) {
            verdictClass = "red";
            verdictMsg = "One or more areas may prevent you from applying at this time. Review the red items below and consider consulting an immigration attorney.";
        } else if (yellows > 0) {
            verdictClass = "yellow";
            verdictMsg = "You may be eligible, but some areas need attention. Review the yellow items below.";
        } else {
            verdictClass = "green";
            verdictMsg = "You appear to meet the basic eligibility requirements! Consider filing Form N-400.";
        }

        let html = '<div class="elig-summary">';
        html += '<div class="elig-summary-header"><h2>Your Results</h2></div>';

        html += '<div class="elig-counts">';
        html += '<span class="elig-count-badge elig-count-badge--green">' + greens + ' Good</span>';
        if (yellows > 0) html += '<span class="elig-count-badge elig-count-badge--yellow">' + yellows + ' Attention</span>';
        if (reds > 0) html += '<span class="elig-count-badge elig-count-badge--red">' + reds + ' Concern</span>';
        html += '</div>';

        html += '<div class="elig-verdict elig-verdict--' + verdictClass + '">' + verdictMsg + '</div>';

        html += '<div class="elig-results-grid">';
        eligResults.forEach(r => {
            html += '<div class="elig-result-row">'
                + '<span class="elig-result-dot elig-result-dot--' + r.color + '"></span>'
                + '<span class="elig-result-label">' + r.label + '</span>'
                + '</div>';
        });
        html += '</div>';

        html += '<div class="elig-disclaimer">'
            + '<strong>Disclaimer:</strong> This is an informational tool only and is not legal advice. '
            + 'Eligibility for naturalization depends on many factors. Consult an immigration attorney for personalized guidance.'
            + '</div>';

        html += '<div class="elig-links">';
        html += '<a href="https://www.uscis.gov/n-400" target="_blank" rel="noopener">\u{1F4CB} Form N-400 on USCIS.gov</a>';
        html += '<a href="https://www.uscis.gov/citizenship/find-study-materials-and-resources" target="_blank" rel="noopener">\u{1F4DA} USCIS Study Materials</a>';
        html += '<a href="https://www.uscis.gov/citizenship/exceptions-and-accommodations" target="_blank" rel="noopener">\u267F Exceptions &amp; Accommodations</a>';
        html += '</div>';

        html += '<button class="elig-start-over" id="eligStartOverBtn">Start Over</button>';
        html += '</div>';

        content.innerHTML = html;

        // Save eligibility results to localStorage
        LS.set("eligibility_results", eligResults);

        // Confetti if all green
        if (reds === 0 && yellows === 0) {
            fireConfetti();
        }

        $("#eligStartOverBtn").addEventListener("click", eligStartOver);
    }

    // ================================================================
    //  BOOT
    // ================================================================

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
