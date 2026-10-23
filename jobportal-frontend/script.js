
const API_URL = "http://localhost:8080/api/jobs";

const jobList = document.getElementById("jobList");
const jobsMessage = document.getElementById("jobsMessage");
const totalJobs = document.getElementById("totalJobs");
const searchInput = document.getElementById("searchInput");
const jobForm = document.getElementById("jobForm");
const formMessage = document.getElementById("formMessage");
const submitJobButton = document.getElementById("submitJobButton");

let allJobs = [];
let selectedType = "ALL";

// Format numbers as Indian currency
function formatSalary(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Number(amount));
}

// Create a job card safely

function createJobCard(job) {
    const card = document.createElement("article");
    card.className = "job-card";

    const top = document.createElement("div");
    top.className = "job-card-top";

    const mark = document.createElement("div");
    mark.className = "company-mark";
    mark.textContent = (job.title || "J").trim().charAt(0).toUpperCase();

    const badge = document.createElement("span");
    badge.className = "job-badge";
    badge.textContent = (job.employmentType || "JOB").replaceAll("_", " ");

    top.append(mark, badge);

    const title = document.createElement("h3");
    title.textContent = job.title || "Untitled job";

    const description = document.createElement("p");
    description.className = "job-description";
    description.textContent = job.description || "No description provided.";

    const meta = document.createElement("div");
    meta.className = "job-meta";

    const location = document.createElement("span");
    location.textContent = "📍 " + (job.location || "Not specified");

    const workMode = document.createElement("span");
    workMode.textContent = (job.workMode || "ONSITE").replaceAll("_", " ");

    meta.append(location, workMode);

    const skills = document.createElement("p");
    skills.className = "job-skills";
    skills.textContent = "Skills: " + (job.skillsRequired || "Not specified");

    const bottom = document.createElement("div");
    bottom.className = "job-card-bottom";

    const salary = document.createElement("span");
    salary.className = "job-salary";

    if (job.salaryMin != null && job.salaryMax != null) {
        salary.textContent =
            formatSalary(job.salaryMin) + " – " + formatSalary(job.salaryMax);
    } else if (job.salaryMin != null) {
        salary.textContent = "From " + formatSalary(job.salaryMin);
    } else {
        salary.textContent = "Salary not specified";
    }

    const id = document.createElement("span");
    id.className = "job-id";
    id.textContent = "Job #" + job.id;

    bottom.append(salary, id);

    // Apply Now button
    const applyButton = document.createElement("button");
    applyButton.type = "button";
    applyButton.className = "apply-button";
    applyButton.textContent = "Apply Now";

    applyButton.addEventListener("click", function () {
        
const loggedInUser = JSON.parse(
    sessionStorage.getItem("careerNestUser") || "null"
);

const userId = loggedInUser?.id;
const userRole = loggedInUser?.role;


        if (!userId) {
            alert("Please login first to apply for a job.");
            document.getElementById("loginButton").click();
            return;
        }

        if (userRole && userRole.toUpperCase() !== "STUDENT") {
            alert("Only students can apply for jobs.");
            return;
        }

        window.location.href =
    "apply.html?jobId=" + encodeURIComponent(job.id);
    });

    card.append(top, title, description, meta, skills, bottom, applyButton);

    return card;
}

// Show jobs according to search text and selected type
function displayJobs() {
    const query = searchInput.value.trim().toLowerCase();

    const filteredJobs = allJobs.filter(job => {
        const matchesType =
            selectedType === "ALL" || job.employmentType === selectedType;

        const searchableText = [
            job.title,
            job.location,
            job.skillsRequired,
            job.description
        ].join(" ").toLowerCase();

        return matchesType && searchableText.includes(query);
    });

    jobList.replaceChildren();

    totalJobs.textContent = allJobs.length;

    if (filteredJobs.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = allJobs.length === 0
            ? "No jobs are available yet."
            : "No matching jobs found. Try a different search or filter.";

        jobList.appendChild(empty);
        jobsMessage.textContent = "Showing 0 jobs";
        return;
    }

    filteredJobs.forEach(job => {
        jobList.appendChild(createJobCard(job));
    });

    jobsMessage.textContent =
        `Showing ${filteredJobs.length} of ${allJobs.length} jobs`;
}

// GET: Load jobs from Spring Boot
async function loadJobs() {
    jobsMessage.textContent = "Loading jobs from the database...";
    jobList.replaceChildren();

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Server returned status " + response.status);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Unexpected data received from the server.");
        }

        allJobs = data.filter(job => job.status === "PUBLISHED");
        displayJobs();
    } catch (error) {
        totalJobs.textContent = "—";
        jobsMessage.textContent =
            "Unable to load jobs. Make sure Spring Boot is running on port 8080 and CORS is configured.";
        console.error("GET jobs error:", error);
    }
}

// Search jobs
document.getElementById("searchForm").addEventListener("submit", event => {
    event.preventDefault();

    displayJobs();

    document.getElementById("jobs").scrollIntoView({
        behavior: "smooth"
    });
});

// Live search while typing
searchInput.addEventListener("input", displayJobs);

// Filter jobs by employment type
document.querySelectorAll(".filter-button").forEach(button => {
    button.addEventListener("click", () => {
        selectedType = button.dataset.type;

        document.querySelectorAll(".filter-button").forEach(item => {
            item.classList.toggle("active", item === button);
        });

        displayJobs();
    });
});

// Refresh from the backend
document.getElementById("refreshButton").addEventListener("click", loadJobs);

// POST: Submit a new job to Spring Boot
jobForm.addEventListener("submit", async event => {
    event.preventDefault();

    formMessage.textContent = "";

    const salaryMinText = document.getElementById("salaryMin").value;
    const salaryMaxText = document.getElementById("salaryMax").value;

    const salaryMin = salaryMinText === "" ? null : Number(salaryMinText);
    const salaryMax = salaryMaxText === "" ? null : Number(salaryMaxText);

    if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
        formMessage.textContent =
            "Minimum salary cannot be greater than maximum salary.";
        return;
    }

    const deadline = document.getElementById("deadline").value;

    if (deadline && deadline < new Date().toLocaleDateString("en-CA")) {
        formMessage.textContent = "Please choose a future application deadline.";
        return;
    }

    const job = {
        companyId: 1,
        title: document.getElementById("title").value.trim(),
        description: document.getElementById("description").value.trim(),
        requirements: document.getElementById("requirements").value.trim() || null,
        skillsRequired: document.getElementById("skills").value.trim() || null,
        location: document.getElementById("location").value.trim(),
        employmentType: document.getElementById("employmentType").value,
        workMode: document.getElementById("workMode").value,
        experienceMin: Number(document.getElementById("experienceMin").value),
        salaryMin,
        salaryMax,
        openings: Number(document.getElementById("openings").value),
        applicationDeadline: deadline || null,
        status: "PUBLISHED"
    };

    submitJobButton.disabled = true;
    submitJobButton.textContent = "Publishing...";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(job)
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(
                `Server error (${response.status}). ${errorDetails}`
            );
        }

        const savedJob = await response.json();

        formMessage.textContent =
            `Success! "${savedJob.title}" was saved with Job ID ${savedJob.id}.`;

        jobForm.reset();

        await loadJobs();

        document.getElementById("jobs").scrollIntoView({
            behavior: "smooth"
        });
    } catch (error) {
        formMessage.textContent =
            "Could not publish the job. Check the backend, CORS and database connection.";
        console.error("POST job error:", error);
    } finally {
        submitJobButton.disabled = false;
        submitJobButton.textContent = "Publish job →";
    }
});

// Load jobs when the page opens
loadJobs();


/* ===== CareerNest Login and Signup ===== */

const AUTH_URL = "http://localhost:8080/api/auth";

const authSection = document.getElementById("authSection");
const authForm = document.getElementById("authForm");
const authMessage = document.getElementById("authMessage");
const authTitle = document.getElementById("authTitle");
const authDescription = document.getElementById("authDescription");
const authSubmitButton = document.getElementById("authSubmitButton");
const fullNameGroup = document.getElementById("fullNameGroup");
const authFullName = document.getElementById("authFullName");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");

let authMode = "LOGIN";

function openAuth(mode) {
    authSection.hidden = false;
    setAuthMode(mode);

    authSection.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function setAuthMode(mode) {
    authMode = mode;
    authForm.reset();
    authMessage.textContent = "";

    const isSignup = mode === "SIGNUP";

    fullNameGroup.hidden = !isSignup;
    authFullName.required = isSignup;

    document.getElementById("loginTab").classList.toggle("active", !isSignup);
    document.getElementById("signupTab").classList.toggle("active", isSignup);

    authTitle.textContent = isSignup ? "Create your account" : "Welcome back!";
    authDescription.textContent = isSignup
        ? "Join CareerNest and explore new opportunities."
        : "Login to continue your career journey.";

    authSubmitButton.textContent = isSignup ? "Create account →" : "Login →";

    document.getElementById("authSwitchText").textContent = isSignup
        ? "Already have an account?"
        : "New to CareerNest?";

    document.getElementById("authSwitchButton").textContent = isSignup
        ? "Login"
        : "Create account";
}

document.getElementById("loginButton").addEventListener("click", () => {
    openAuth("LOGIN");
});

document.getElementById("signupButton").addEventListener("click", () => {
    openAuth("SIGNUP");
});

document.getElementById("loginTab").addEventListener("click", () => {
    setAuthMode("LOGIN");
});

document.getElementById("signupTab").addEventListener("click", () => {
    setAuthMode("SIGNUP");
});

document.getElementById("authSwitchButton").addEventListener("click", () => {
    setAuthMode(authMode === "LOGIN" ? "SIGNUP" : "LOGIN");
});

document.getElementById("closeAuthButton").addEventListener("click", () => {
    authSection.hidden = true;
    authMessage.textContent = "";
});

authForm.addEventListener("submit", async event => {
    event.preventDefault();

    authMessage.textContent = "";

    const requestData = {
        email: authEmail.value.trim(),
        password: authPassword.value
    };

    let endpoint = "/login";

    if (authMode === "SIGNUP") {
        requestData.fullName = authFullName.value.trim();
        endpoint = "/signup";
    }

    authSubmitButton.disabled = true;
    authSubmitButton.textContent =
        authMode === "SIGNUP" ? "Creating account..." : "Logging in...";

    try {
        const response = await fetch(AUTH_URL + endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.detail ||
                result.message ||
                (response.status === 409
                    ? "This email is already registered. Please log in."
                    : "Request failed. Please check your details.")
            );
        }

        if (authMode === "SIGNUP") {
            authMessage.textContent =
                "Account created successfully! You can now log in.";

            setAuthMode("LOGIN");
            authEmail.value = requestData.email;
            authMessage.textContent =
                "Account created successfully! Please log in.";
        } else {
            // Demo only: browser storage is not secure authentication.
            sessionStorage.setItem("careerNestUser", JSON.stringify({
                id: result.id,
                fullName: result.fullName,
                email: result.email,
                role: result.role
            }));

            authMessage.textContent =
                "Login successful! Welcome, " + result.fullName + ".";

            authTitle.textContent = "Welcome, " + result.fullName + "!";
            authDescription.textContent =
                "You are logged in to CareerNest.";

            authForm.hidden = true;
            document.getElementById("authSwitchText").textContent =
                "Ready to explore opportunities?";
            document.getElementById("authSwitchButton").textContent =
                "Find Jobs";

            document.getElementById("authSwitchButton").onclick = () => {
                authSection.hidden = true;
                authForm.hidden = false;
                document.getElementById("jobs").scrollIntoView({
                    behavior: "smooth"
                });
            };
        }
    } catch (error) {
        authMessage.textContent =
            error.message || "Unable to connect. Is the backend running?";
        console.error("Authentication error:", error);
    } finally {
        authSubmitButton.disabled = false;
        authSubmitButton.textContent =
            authMode === "SIGNUP" ? "Create account →" : "Login →";
    }
});

