/* 
 * Bookmarklet: Interaktiver Button-Auto-Klick-Cursor mit SVG-Overlay
 * Features:
 * - Jede Instanz läuft unabhängig
 * - SVG-Cursor (Pfeil/Hand), per Touch/Mouse bewegbar
 * - Button-Erkennung via Timer
 * - Klick auf Button unter Cursor (mit Ton + visuellem Feedback)
 * - Rückstandslose Selbstentfernung durch Klick auf Cursor
 * - Debug-Modus mit Alerts + Konsole
 * SVG enthält beide Darstellungen ("pointer-arrow", "pointer-hand")
 * 
 * Autor: ChatGPT (OpenAI)
 * Datum: 2025-10-09
 * Version: 1.0
 */
/* 
 * Bookmarklet: Interaktiver Button-Auto-Klick-Cursor mit SVG-Overlay
 * Verbesserungen:
 * - Cursor bleibt nach Drag bestehen (Klick ≠ Drag)
 * - 4x größerer Cursor
 * - Rahmen aus SVG entfernt
 * 
 * Autor: ChatGPT (OpenAI)
 * Datum: 2025-10-09
 * Version: 1.1
 */

(function () {
  const DEBUG = true;

  const instanceId = `bookmarklet_cursor_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const overlayId = `overlay_${instanceId}`;
  const svgId = `svg_${instanceId}`;
  const CHECK_INTERVAL = 1000;
  const TONE_DURATION = 500;
  const TONE_FREQUENCY = 220;

  let dragging = false;
  let moved = false;
  let dragOffset = { x: 0, y: 0 };
  let timerId = null;
  let currentCursor = null;

  // Neu: Set, um bereits geloggte Buttons zu tracken
  const loggedButtons = new Set();

  function log(...args) {
    if (DEBUG) console.log(`[${instanceId}]`, ...args);
  }

  function alertDebug(message) {
    if (DEBUG) alert(`[${instanceId}]\n${message}`);
  }

  // ... (SVG-String und createCursorOverlay bleiben gleich)

  // ... (Drag-Funktionen bleiben gleich)

  function getCursorPosition() {
    const rect = currentCursor.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  function switchCursorMode(toHand = true) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const arrow = svg.querySelector('#pointer-arrow');
    const hand = svg.querySelector('#pointer-hand');
    if (toHand) {
      arrow.style.display = 'none';
      hand.style.display = 'block';
    } else {
      arrow.style.display = 'block';
      hand.style.display = 'none';
    }
  }

  function playTone() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(TONE_FREQUENCY, ctx.currentTime);
    oscillator.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + TONE_DURATION / 1000);
  }

  function checkButtons() {
    const buttons = Array.from(document.querySelectorAll('button'));

    const pos = getCursorPosition();

    buttons.forEach((button) => {
      const rect = button.getBoundingClientRect();

      // Neu: Button-Position einmalig loggen im Debug-Modus
      if (DEBUG && !loggedButtons.has(button)) {
        loggedButtons.add(button);
        log(
          `Neuer Button entdeckt! Screen-Position: left=${rect.left.toFixed(
            0
          )}, top=${rect.top.toFixed(0)}, right=${rect.right.toFixed(
            0
          )}, bottom=${rect.bottom.toFixed(0)}, width=${rect.width.toFixed(
            0
          )}, height=${rect.height.toFixed(0)}`
        );
      }

      const inside =
        pos.x >= rect.left &&
        pos.x <= rect.right &&
        pos.y >= rect.top &&
        pos.y <= rect.bottom;

      if (inside) {
        log(`Button ausgelöst von Cursor ${instanceId}`);
        alertDebug(
          `Button ausgelöst!\nCursor: (${pos.x.toFixed(0)}, ${pos.y.toFixed(
            0
          )})\nButton: (${rect.left.toFixed(0)}, ${rect.top.toFixed(
            0
          )})\nText: ${button.innerText.trim()}`
        );
        button.click();
        playTone();
        switchCursorMode(true);
        setTimeout(() => switchCursorMode(false), 1000);
      }
    });
  }

  function removeInstance() {
    if (timerId) clearInterval(timerId);
    const overlay = document.getElementById(overlayId);
    if (overlay) overlay.remove();
    log('Instanz wurde entfernt.');
  }

  // INIT
  const overlay = createCursorOverlay();
  switchCursorMode(false);
  timerId = setInterval(checkButtons, CHECK_INTERVAL);
})();

