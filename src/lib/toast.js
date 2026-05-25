/** Imperative toast API — use after ToastProvider is mounted. */

let pushToast = null;

export function registerToast(fn) {
  pushToast = fn;
}

export const toast = {
  success(message) {
    pushToast?.(message, "success");
  },
  error(message) {
    pushToast?.(message, "error");
  },
  info(message) {
    pushToast?.(message, "info");
  },
};
