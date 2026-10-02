const sidebar = document.querySelector(".sidebar");
const menuButton = document.querySelector(".mobile-menu-toggle");
const backdrop = document.querySelector(".sidebar-backdrop");

sidebar.id = "primary-sidebar";

function setMenuOpen(isOpen) {
    document.body.classList.toggle("sidebar-open", isOpen);
    menuButton.setAttribute("aria-expanded", isOpen);
    menuButton.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    backdrop.hidden = !isOpen;
}

menuButton.addEventListener("click", () => {
    setMenuOpen(!document.body.classList.contains("sidebar-open"));
});

backdrop.addEventListener("click", () => setMenuOpen(false));
sidebar.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuOpen(false);
});