import { getData } from "../data/storage.js";

export function signedInUser() {
  const session = JSON.parse(
    sessionStorage.getItem("nironCinema_current_user") || "null",
  );
  return getData().users.find((user) => user.id === session?.id);
}
export function requestAccess(target) {
  if (signedInUser()) {
    window.location.href = target;
    return;
  }
  sessionStorage.setItem("nironCinema_pendingPage", target);
  if (!document.getElementById("authModal")) {
    window.location.replace("./index.html?signin=1");
    return;
  }
  document.getElementById("authModal").classList.remove("hidden");
  document.getElementById("signupForm").classList.add("hidden");
  document.getElementById("signinForm").classList.remove("hidden");
  document.getElementById("signupTab").classList.remove("text-nironBlue");
  document.getElementById("signinTab").classList.add("text-nironBlue");
  document.getElementById("signinEmail").focus();
}
export function resumeAccess() {
  const target = sessionStorage.getItem("nironCinema_pendingPage");
  sessionStorage.removeItem("nironCinema_pendingPage");
  if (
    target &&
    /^\.\/(movie\.html\?id=[^\s]+|tickets\.html|food\.html)$/.test(target)
  )
    window.location.href = target;
}
