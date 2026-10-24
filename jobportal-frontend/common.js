/* ===== CareerNest shared helpers (loaded by every page) ===== */

const API_BASE = "http://localhost:8080/api";
const SESSION_KEY = "careerNestUser";

// The login token is kept in localStorage so every tab shares the login.
// (The server forgets tokens on restart; the next request then asks to log in.)
function getSession() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
        return null;
    }
}

function saveSession(user) {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch {
        alert("Your browser blocked local storage, so you cannot stay logged in.");
    }
}

function clearSession() {
    try {
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
    } catch {
        // Nothing to clear
    }
}

// Logging in or out in another tab updates this tab's menu
window.addEventListener("storage", event => {
    if (event.key === SESSION_KEY) renderNavbar();
});

/**
 * fetch() wrapper that adds the login token, parses JSON and
 * throws an Error with the server's message when the request fails.
 */
async function apiFetch(path, options = {}) {
    const session = getSession();
    const headers = new Headers(options.headers || {});

    if (session?.token) {
        headers.set("Authorization", "Bearer " + session.token);
    }
    if (options.body && !(options.body instanceof FormData)
            && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    let response;
    try {
        response = await fetch(API_BASE + path, { ...options, headers });
    } catch {
        throw new Error("Cannot reach the server. Is Spring Boot running on port 8080?");
    }

    if (response.status === 401 && session) {
        clearSession();
        renderNavbar();
    }

    if (options.raw) {
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || "Request failed (" + response.status + ").");
        }
        return response;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Request failed (" + response.status + ").");
    }
    return data;
}

// Page that matches the user's role
function dashboardFor(role) {
    if (role === "RECRUITER") return "company.html";
    if (role === "ADMIN") return "admin.html";
    return "profile.html";
}

function dashboardLabel(role) {
    if (role === "RECRUITER") return "Company dashboard";
    if (role === "ADMIN") return "Admin panel";
    return "My profile";
}

/**
 * Redirects to the home page unless a user with the given role is logged in.
 * Returns the session when allowed.
 */
function requireRole(role) {
    const session = getSession();
    if (!session?.token || session.role !== role) {
        alert("Please log in with the right account to open this page.");
        window.location.href = "index.html";
        return null;
    }
    return session;
}

async function logout() {
    try {
        await apiFetch("/auth/logout", { method: "POST" });
    } catch {
        // Logging out locally is enough if the server is unreachable
    }
    clearSession();
    window.location.href = "index.html";
}

// Menu links shown for each kind of user
const NAV_LINKS = {
    GUEST: [
        ["Home", "index.html#home"],
        ["Find Jobs", "index.html#jobs"],
        ["For Employers", "index.html#post-job"]
    ],
    STUDENT: [
        ["Find Jobs", "index.html#jobs"],
        ["My Profile & Resume", "profile.html"],
        ["My Applications", "profile.html#applications"]
    ],
    RECRUITER: [
        ["Applicants", "company.html#applicants"],
        ["My Jobs", "company.html#jobs"],
        ["Post a Job", "company.html#post"],
        ["Company Profile", "company.html#company"]
    ],
    ADMIN: [
        ["Admin Panel", "admin.html"],
        ["All Jobs", "index.html#jobs"]
    ]
};

function renderNavLinks(role) {
    const nav = document.querySelector(".navbar nav");
    if (!nav) return;

    nav.replaceChildren();
    (NAV_LINKS[role] || NAV_LINKS.GUEST).forEach(([label, href]) => {
        const link = el("a", null, label);
        link.href = href;
        nav.appendChild(link);
    });
}

// Fills the menu and .nav-actions for the logged-in user (or a guest)
function renderNavbar() {
    const actions = document.querySelector(".nav-actions");
    if (!actions) return;

    const session = getSession();
    const onIndex = document.getElementById("authSection") !== null;

    renderNavLinks(session?.token ? session.role : "GUEST");
    actions.replaceChildren();

    if (!session?.token) {
        const login = document.createElement("button");
        login.className = "outline-button";
        login.type = "button";
        login.textContent = "Login";

        const signup = document.createElement("button");
        signup.className = "nav-button";
        signup.type = "button";
        signup.textContent = "Sign Up";

        if (onIndex) {
            login.addEventListener("click", () => openAuth("LOGIN"));
            signup.addEventListener("click", () => openAuth("SIGNUP"));
        } else {
            login.addEventListener("click", () => {
                window.location.href = "index.html#login";
            });
            signup.addEventListener("click", () => {
                window.location.href = "index.html#signup";
            });
        }

        actions.append(login, signup);
        return;
    }

    const roleLabel = { STUDENT: "Job seeker", RECRUITER: "Company", ADMIN: "Admin" }[session.role];
    const greeting = document.createElement("span");
    greeting.className = "nav-greeting";
    greeting.textContent = (session.role === "RECRUITER" && session.companyName
        ? session.companyName
        : session.fullName || "there") + (roleLabel ? " · " + roleLabel : "");

    const dashboard = document.createElement("a");
    dashboard.className = "outline-button";
    dashboard.href = dashboardFor(session.role);
    dashboard.textContent = dashboardLabel(session.role);

    const logoutButton = document.createElement("button");
    logoutButton.className = "nav-button";
    logoutButton.type = "button";
    logoutButton.textContent = "Logout";
    logoutButton.addEventListener("click", logout);

    actions.append(greeting, dashboard, logoutButton);
}

function formatSalary(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Number(amount));
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric"
        });
}

function prettyEnum(value) {
    if (!value) return "—";
    return value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ");
}

// Creates an element with optional class and text
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
}

function showStatus(node, message, isError = false) {
    node.textContent = message;
    node.classList.toggle("error-text", isError);
    node.classList.toggle("success-text", !isError && message !== "");
}

// Downloads a protected file (e.g. a resume) using the login token
async function downloadFile(path, fallbackName) {
    const response = await apiFetch(path, { raw: true });
    const blob = await response.blob();

    let filename = fallbackName || "download";
    const disposition = response.headers.get("Content-Disposition") || "";
    const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
    if (match) {
        filename = decodeURIComponent(match[1] || match[2]);
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.addEventListener("DOMContentLoaded", renderNavbar);
