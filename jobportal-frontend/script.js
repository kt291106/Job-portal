
/* ===== CareerNest home page: job listing and login/signup ===== */

const jobList = document.getElementById("jobList");
const jobsMessage = document.getElementById("jobsMessage");
const totalJobs = document.getElementById("totalJobs");
const searchInput = document.getElementById("searchInput");

let allJobs = [];
let selectedType = "ALL";

function isDeadlinePassed(job) {
    return job.applicationDeadline != null
        && job.applicationDeadline < new Date().toLocaleDateString("en-CA");
}

// Create a job card safely
function createJobCard(job) {
    const card = el("article", "job-card");

    const top = el("div", "job-card-top");
    const mark = el("div", "company-mark",
        (job.companyName || job.title || "J").trim().charAt(0).toUpperCase());
    const badge = el("span", "job-badge",
        (job.employmentType || "JOB").replaceAll("_", " "));
    top.append(mark, badge);

    const title = el("h3", null, job.title || "Untitled job");
    const company = el("p", "job-company", job.companyName || "Company");
    const description = el("p", "job-description",
        job.description || "No description provided.");

    const meta = el("div", "job-meta");
    meta.append(
        el("span", null, "📍 " + (job.location || "Not specified")),
        el("span", null, prettyEnum(job.workMode || "ONSITE")));

    const skills = el("p", "job-skills",
        "Skills: " + (job.skillsRequired || "Not specified"));

    const bottom = el("div", "job-card-bottom");
    let salaryText = "Salary not specified";
    if (job.salaryMin != null && job.salaryMax != null) {
        salaryText = formatSalary(job.salaryMin) + " – " + formatSalary(job.salaryMax);
    } else if (job.salaryMin != null) {
        salaryText = "From " + formatSalary(job.salaryMin);
    } else if (job.salaryMax != null) {
        salaryText = "Up to " + formatSalary(job.salaryMax);
    }
    const deadlineText = job.applicationDeadline
        ? "Apply by " + formatDate(job.applicationDeadline)
        : "Job #" + job.id;
    bottom.append(el("span", "job-salary", salaryText),
        el("span", "job-id", deadlineText));

    card.append(top, title, company, description, meta, skills, bottom,
        createCardAction(job));
    return card;
}

// The card's button depends on who is logged in
function createCardAction(job) {
    const session = getSession();
    const role = session?.token ? session.role : null;

    if (role === "RECRUITER") {
        if (session.companyId != null && job.companyId === session.companyId) {
            const link = el("a", "apply-button", "View applicants →");
            link.href = "company.html?job=" + encodeURIComponent(job.id) + "#applicants";
            return link;
        }
        return el("p", "status-message", "Posted by another company");
    }

    if (role === "ADMIN") {
        return el("p", "status-message", "Manage this job in the admin panel");
    }

    const applyButton = el("button", "apply-button");
    applyButton.type = "button";

    if (isDeadlinePassed(job)) {
        applyButton.textContent = "Applications closed";
        applyButton.disabled = true;
    } else {
        applyButton.textContent = "Apply Now";
        applyButton.addEventListener("click", () => {
            const session = getSession();

            if (!session?.token) {
                alert("Please login as a job seeker to apply.");
                openAuth("LOGIN");
                return;
            }
            if (session.role !== "STUDENT") {
                alert("Only job seeker accounts can apply for jobs.");
                return;
            }

            window.location.href = "apply.html?jobId=" + encodeURIComponent(job.id);
        });
    }

    return applyButton;
}

// Show jobs according to search text and selected type
function displayJobs() {
    const query = searchInput.value.trim().toLowerCase();

    const filteredJobs = allJobs.filter(job => {
        const matchesType =
            selectedType === "ALL" || job.employmentType === selectedType;

        const searchableText = [
            job.title,
            job.companyName,
            job.location,
            job.skillsRequired,
            job.description
        ].join(" ").toLowerCase();

        return matchesType && searchableText.includes(query);
    });

    jobList.replaceChildren();
    totalJobs.textContent = allJobs.length;

    if (filteredJobs.length === 0) {
        jobList.appendChild(el("div", "empty-state", allJobs.length === 0
            ? "No jobs are available yet."
            : "No matching jobs found. Try a different search or filter."));
        jobsMessage.textContent = "Showing 0 jobs";
        return;
    }

    filteredJobs.forEach(job => jobList.appendChild(createJobCard(job)));
    jobsMessage.textContent =
        `Showing ${filteredJobs.length} of ${allJobs.length} jobs`;
}

// GET: published jobs from Spring Boot
async function loadJobs() {
    jobsMessage.textContent = "Loading jobs from the database...";
    jobList.replaceChildren();

    try {
        const data = await apiFetch("/jobs");

        if (!Array.isArray(data)) {
            throw new Error("Unexpected data received from the server.");
        }

        allJobs = data;
        displayJobs();
    } catch (error) {
        totalJobs.textContent = "—";
        jobsMessage.textContent = "Unable to load jobs. " + error.message;
        console.error("GET jobs error:", error);
    }
}

document.getElementById("searchForm").addEventListener("submit", event => {
    event.preventDefault();
    displayJobs();
    document.getElementById("jobs").scrollIntoView({ behavior: "smooth" });
});

searchInput.addEventListener("input", displayJobs);

document.querySelectorAll(".filter-button").forEach(button => {
    button.addEventListener("click", () => {
        selectedType = button.dataset.type;
        document.querySelectorAll(".filter-button").forEach(item => {
            item.classList.toggle("active", item === button);
        });
        displayJobs();
    });
});

document.getElementById("refreshButton").addEventListener("click", loadJobs);

/* ===== Employer section ===== */

document.getElementById("employerSignupButton").addEventListener("click", () => {
    openAuth("SIGNUP", "COMPANY");
});

document.getElementById("employerLoginButton").addEventListener("click", () => {
    openAuth("LOGIN");
    loginIntent = "COMPANY";
    authTitle.textContent = "Company login";
    authDescription.textContent = "Log in with your company (recruiter) account.";
});

// Guests see "register your company"; companies see shortcuts;
// job seekers don't see the employer section at all
function renderEmployerSection() {
    const session = getSession();
    const role = session?.token ? session.role : null;

    document.getElementById("post-job").hidden = role === "STUDENT" || role === "ADMIN";
    document.getElementById("employerGuest").hidden = role === "RECRUITER";
    document.getElementById("employerCompany").hidden = role !== "RECRUITER";

    if (role === "RECRUITER") {
        document.getElementById("employerCompanyName").textContent =
            session.companyName || "Your company";
    }
}

/* ===== Login and Signup ===== */

const authSection = document.getElementById("authSection");
const authForm = document.getElementById("authForm");
const authMessage = document.getElementById("authMessage");
const authTitle = document.getElementById("authTitle");
const authDescription = document.getElementById("authDescription");
const authSubmitButton = document.getElementById("authSubmitButton");
const accountTypeGroup = document.getElementById("accountTypeGroup");
const fullNameGroup = document.getElementById("fullNameGroup");
const companyFields = document.getElementById("companyFields");
const authFullName = document.getElementById("authFullName");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const companyNameInput = document.getElementById("companyName");

let authMode = "LOGIN";
let loginIntent = null;

function selectedAccountType() {
    const checked = authForm.querySelector("input[name=accountType]:checked");
    return checked ? checked.value : "STUDENT";
}

function updateAccountTypeFields() {
    const isCompany = authMode === "SIGNUP" && selectedAccountType() === "COMPANY";
    companyFields.hidden = !isCompany;
    companyNameInput.required = isCompany;
    document.getElementById("authFullNameLabel").textContent =
        isCompany ? "Your name (recruiter)" : "Full name";
}

function openAuth(mode, accountType) {
    authSection.hidden = false;
    authForm.hidden = false;
    setAuthMode(mode);

    if (accountType) {
        const radio = authForm.querySelector(
            `input[name=accountType][value=${accountType}]`);
        if (radio) radio.checked = true;
        updateAccountTypeFields();
    }

    authSection.scrollIntoView({ behavior: "smooth", block: "center" });
}

function setAuthMode(mode) {
    authMode = mode;
    loginIntent = null;
    authForm.reset();
    showStatus(authMessage, "");

    const isSignup = mode === "SIGNUP";

    accountTypeGroup.hidden = !isSignup;
    fullNameGroup.hidden = !isSignup;
    authFullName.required = isSignup;
    updateAccountTypeFields();

    document.getElementById("loginTab").classList.toggle("active", !isSignup);
    document.getElementById("signupTab").classList.toggle("active", isSignup);

    authTitle.textContent = isSignup ? "Create your account" : "Welcome back!";
    authDescription.textContent = isSignup
        ? "Join CareerNest as a job seeker or as a company."
        : "Job seekers, companies and admins log in here.";

    authSubmitButton.textContent = isSignup ? "Create account →" : "Login →";

    document.getElementById("authSwitchText").textContent = isSignup
        ? "Already have an account?"
        : "New to CareerNest?";
    document.getElementById("authSwitchButton").textContent = isSignup
        ? "Login"
        : "Create account";
}

authForm.querySelectorAll("input[name=accountType]").forEach(radio => {
    radio.addEventListener("change", updateAccountTypeFields);
});

document.getElementById("loginTab").addEventListener("click", () => setAuthMode("LOGIN"));
document.getElementById("signupTab").addEventListener("click", () => setAuthMode("SIGNUP"));

document.getElementById("authSwitchButton").addEventListener("click", () => {
    // After a job seeker logs in, the form is hidden and this links to the profile
    if (authForm.hidden) {
        window.location.href = "profile.html";
        return;
    }
    setAuthMode(authMode === "LOGIN" ? "SIGNUP" : "LOGIN");
});

document.getElementById("closeAuthButton").addEventListener("click", () => {
    authSection.hidden = true;
    showStatus(authMessage, "");
});

authForm.addEventListener("submit", async event => {
    event.preventDefault();
    showStatus(authMessage, "");

    const requestData = {
        email: authEmail.value.trim(),
        password: authPassword.value
    };

    let endpoint = "/auth/login";

    if (authMode === "SIGNUP") {
        endpoint = "/auth/signup";
        requestData.fullName = authFullName.value.trim();
        requestData.accountType = selectedAccountType();

        if (requestData.accountType === "COMPANY") {
            requestData.company = {
                name: companyNameInput.value.trim(),
                website: document.getElementById("companyWebsite").value.trim(),
                industry: document.getElementById("companyIndustry").value.trim(),
                companySize: document.getElementById("companySize").value,
                headquarters: document.getElementById("companyHeadquarters").value.trim()
            };
        }
    }

    authSubmitButton.disabled = true;
    authSubmitButton.textContent =
        authMode === "SIGNUP" ? "Creating account..." : "Logging in...";

    try {
        const result = await apiFetch(endpoint, {
            method: "POST",
            body: JSON.stringify(requestData)
        });

        if (authMode === "SIGNUP") {
            setAuthMode("LOGIN");
            authEmail.value = requestData.email;
            showStatus(authMessage, "Account created successfully! Please log in.");
            return;
        }

        saveSession({
            token: result.token,
            id: result.id,
            fullName: result.fullName,
            email: result.email,
            role: result.role,
            companyId: result.companyId ?? null,
            companyName: result.companyName ?? null
        });

        // Companies and admins go straight to their dashboards
        if (result.role === "RECRUITER" || result.role === "ADMIN") {
            window.location.href = dashboardFor(result.role);
            return;
        }

        const wantedCompany = loginIntent === "COMPANY";
        renderNavbar();
        renderEmployerSection();
        displayJobs();
        showStatus(authMessage, wantedCompany
            ? "Note: " + result.email + " is a JOB SEEKER account, so it cannot publish jobs. "
                + "To hire, log out and sign up again choosing \"Company\" with a different email."
            : "Login successful! Welcome, " + result.fullName + ".",
            wantedCompany);
        authTitle.textContent = "Welcome, " + result.fullName + "!";
        authDescription.textContent =
            "Complete your profile and upload a resume before applying.";
        authForm.hidden = true;

        document.getElementById("authSwitchText").textContent = "";
        document.getElementById("authSwitchButton").textContent =
            "Go to my profile →";
    } catch (error) {
        showStatus(authMessage, error.message, true);
        console.error("Authentication error:", error);
    } finally {
        authSubmitButton.disabled = false;
        authSubmitButton.textContent =
            authMode === "SIGNUP" ? "Create account →" : "Login →";
    }
});

// Open login/signup when arriving from another page (index.html#login)
if (window.location.hash === "#login" || window.location.hash === "#signup") {
    openAuth(window.location.hash === "#signup" ? "SIGNUP" : "LOGIN");
}

renderEmployerSection();
loadJobs();
