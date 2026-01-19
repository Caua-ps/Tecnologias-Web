let enabled = true;

const sounds = {
    roll: new Audio("./sounds/roll.mp3"),
    move: new Audio("./sounds/move.mp3"),
    capture: new Audio("./sounds/capture.mp3"),
    capture_ai: new Audio("./sounds/capture_ai.mp3"),
    win: new Audio("./sounds/win.mp3"),
    error: new Audio("./sounds/error.mp3"),
    finished: new Audio("./sounds/finished.mp3"),
    lose: new Audio("./sounds/lose.mp3"),
    end: new Audio("./sounds/end.mp3"),
    inicio: new Audio("./sounds/inicio.mp3"),
  };

export function playSound(name) {
  if (!enabled) return;
  const s = sounds[name];
  if (!s) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}

export function toggleSound() {
  enabled = !enabled;
  return enabled;
}
