/* ===== Company dashboard ===== */

const session = requireRole("RECRUITER");

const APPLICATION_STATUSES = [
    "APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "SELECTED", "REJECTED"
];

const jobsTable = document.getElementById("jobsTable");
const jobsMessage = document.getElementById("jobsMessage");
const jobFilter = document.getElementById("jobFilter");
const applicantsTitle = document.getElementById("applicantsTitle");
const applicantsMessage = document.getElementById("applicantsMessage");
const applicantsList = document.getElementById("applicantsList");
const jobForm = document.getElementById("jobForm");
const formMessage = document.getElementById("formMessage");
const submitJobButton = document.getElementById("submitJobButton");
const companyForm = document.getElementById("companyForm");
const companyMessage = document.getElementById("companyMessage");

let currentJobId = null;

// URL hash -> tab, e.g. company.html#post opens "Post a job"
const TAB_FOR_HASH = {
    "#applicants": "applicantsTab",
    "#jobs": "jobsTab",
    "#post": "postTab",
    "#company": "companyTab"
};

/* ----- Tabs ----- */

function showTab(tabId) {
    document.querySelectorAll(".tab-panel").forEach(panel => {
        panel.hidden = panel.id !== tabId;
    });
    document.querySelectorAll(".tabs .filter-button").forEach(button => {
        button.classList.toggle("active", button.dataset.tab === tabId);
    });
}

document.querySelectorAll(".tabs .filter-button").forEach(button => {
    button.addEventListener("click", () => {
        showTab(button.dataset.tab);
        const hash = Object.keys(TAB_FOR_HASH)
            .find(key => TAB_FOR_HASH[key] === button.dataset.tab);
        history.replaceState(null, "", hash);
    });
});

// The navbar links only change the hash, so react to it
window.addEventListener("hashchange", () => {
    showTab(TAB_FOR_HASH[window.location.hash] || "applicantsTab");
});

/* ----- Jobs ----- */

function jobStatusPill(status) {
    const colour = { PUBLISHED: "green", CLOSED: "red", DRAFT: "grey" }[status] || "";
    return el("span", "pill " + colour, prettyEnum(status));
}

async function loadJobs() {
    jobsMessage.textContent = "Loading...";
    try {
        const jobs = await apiFetch("/company/jobs");
        jobsTable.replaceChildren();
        fillJobFilter(jobs);

        if (jobs.length === 0) {
            jobsMessage.textContent = "You have not published any jobs yet. Use the \"Post a job\" tab.";
            return;
        }

        const totalApplicants = jobs.reduce((sum, job) => sum + (job.applicantCount || 0), 0);
        jobsMessage.textContent = `${jobs.length} job(s) · ${totalApplicants} applicant(s) in total`;

        jobs.forEach(job => {
            const row = document.createElement("tr");

            const titleCell = el("td");
            titleCell.append(el("strong", null, job.title),
                el("div", "status-message", job.location || ""));

            const viewButton = el("button", "small-button",
                `View applicants (${job.applicantCount || 0})`);
            viewButton.type = "button";
            viewButton.addEventListener("click", () => {
                jobFilter.value = String(job.id);
                showTab("applicantsTab");
                history.replaceState(null, "", "#applicants");
                loadApplicants(job.id);
            });

            const toggleButton = el("button", "small-button",
                job.status === "PUBLISHED" ? "Close job" : "Re-open");
            toggleButton.type = "button";
            toggleButton.addEventListener("click", () =>
                setJobStatus(job.id, job.status === "PUBLISHED" ? "CLOSED" : "PUBLISHED"));

            const actions = el("td");
            const actionWrap = el("div", "list-actions");
            actionWrap.append(viewButton, toggleButton);
            actions.appendChild(actionWrap);

            const statusCell = el("td");
            statusCell.appendChild(jobStatusPill(job.status));

            row.append(
                titleCell,
                el("td", null, prettyEnum(job.employmentType)),
                el("td", null, job.applicationDeadline ? formatDate(job.applicationDeadline) : "None"),
                statusCell,
                el("td", null, String(job.applicantCount || 0)),
                actions);
            jobsTable.appendChild(row);
        });
    } catch (error) {
        showStatus(jobsMessage, error.message, true);
    }
}

function fillJobFilter(jobs) {
    const selected = jobFilter.value;
    jobFilter.replaceChildren(el("option", null, "All my jobs"));
    jobFilter.firstChild.value = "";

    jobs.forEach(job => {
        const option = el("option", null,
            `${job.title} (${job.applicantCount || 0})`);
        option.value = String(job.id);
        jobFilter.appendChild(option);
    });

    if ([...jobFilter.options].some(option => option.value === selected)) {
        jobFilter.value = selected;
    }
}

async function setJobStatus(jobId, status) {
    const verb = status === "CLOSED" ? "close" : "re-open";
    if (!confirm(`Are you sure you want to ${verb} this job?`)) return;

    try {
        await apiFetch(`/company/jobs/${jobId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status })
        });
        loadJobs();
    } catch (error) {
        showStatus(jobsMessage, error.message, true);
    }
}

document.getElementById("refreshJobs").addEventListener("click", loadJobs);

/* ----- Applicants (fetched fresh from the database each time) ----- */

function addDetail(grid, label, value, isLink = false) {
    const item = el("div");
    item.appendChild(el("span", null, label));

    if (isLink && value && /^https?:\/\//i.test(value)) {
        const link = el("a", null, value);
        link.href = value;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        item.appendChild(link);
    } else {
        item.appendChild(document.createTextNode(
            value === null || value === undefined || value === "" ? "—" : String(value)));
    }
    grid.appendChild(item);
}

function createApplicantCard(applicant) {
    const card = el("article", "applicant-card");

    const head = el("div", "applicant-head");
    const who = el("div");
    who.append(el("h3", null, applicant.fullName || "Applicant #" + applicant.applicantId),
        el("small", null, "Applied " + formatDate(applicant.appliedAt)));
    if (applicant.jobTitle) {
        who.appendChild(el("div", "applicant-job", "For: " + applicant.jobTitle));
    }
    head.append(who, el("span", "pill", prettyEnum(applicant.status)));

    const grid = el("div", "detail-grid");
    addDetail(grid, "Email", applicant.email);
    addDetail(grid, "Phone", applicant.phone);
    addDetail(grid, "College", applicant.collegeName);
    addDetail(grid, "Degree", applicant.degree);
    addDetail(grid, "Branch", applicant.branch);
    addDetail(grid, "Graduation year", applicant.graduationYear);
    addDetail(grid, "CGPA", applicant.cgpa);
    addDetail(grid, "Skills", applicant.skills);
    addDetail(grid, "LinkedIn", applicant.linkedinUrl, true);
    addDetail(grid, "GitHub", applicant.githubUrl, true);

    card.append(head, grid);

    if (applicant.coverLetter) {
        card.appendChild(el("p", "cover-letter", applicant.coverLetter));
    }

    const actions = el("div", "applicant-actions");

    const resumeButton = el("button", "small-button",
        applicant.resumeId ? "⬇ Resume: " + applicant.resumeName : "No resume attached");
    resumeButton.type = "button";
    resumeButton.disabled = !applicant.resumeId;
    resumeButton.addEventListener("click", () =>
        downloadFile(`/resumes/${applicant.resumeId}/file`, applicant.resumeName)
            .catch(error => showStatus(applicantsMessage, error.message, true)));

    const select = document.createElement("select");
    select.setAttribute("aria-label", "Application status");
    const statuses = APPLICATION_STATUSES.includes(applicant.status)
        ? APPLICATION_STATUSES
        : [applicant.status, ...APPLICATION_STATUSES];
    statuses.forEach(status => {
        const option = el("option", null, prettyEnum(status));
        option.value = status;
        option.selected = status === applicant.status;
        select.appendChild(option);
    });
    select.disabled = applicant.status === "WITHDRAWN";

    const saveStatus = el("button", "small-button", "Update status");
    saveStatus.type = "button";
    saveStatus.disabled = select.disabled;
    saveStatus.addEventListener("click", async () => {
        saveStatus.disabled = true;
        try {
            await apiFetch(`/company/applications/${applicant.applicationId}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: select.value })
            });
            showStatus(applicantsMessage,
                `${applicant.fullName}'s status changed to ${prettyEnum(select.value)}.`);
            loadApplicants(currentJobId);
        } catch (error) {
            showStatus(applicantsMessage, error.message, true);
            saveStatus.disabled = false;
        }
    });

    actions.append(resumeButton, select, saveStatus);
    card.appendChild(actions);
    return card;
}

// jobId = null loads applicants for every job of this company
async function loadApplicants(jobId) {
    currentJobId = jobId;
    applicantsList.replaceChildren();
    showStatus(applicantsMessage, "Loading applicants...");

    try {
        let applications;
        if (jobId) {
            const data = await apiFetch(`/company/jobs/${jobId}/applications`);
            applicantsTitle.textContent = "Applicants for " + data.job.title;
            applications = data.applications;
        } else {
            applicantsTitle.textContent = "All applicants";
            applications = await apiFetch("/company/applications");
        }

        if (applications.length === 0) {
            showStatus(applicantsMessage, jobId
                ? "No one has applied for this job yet."
                : "No one has applied to your jobs yet.");
            return;
        }

        showStatus(applicantsMessage, applications.length + " applicant(s)");
        applications.forEach(applicant =>
            applicantsList.appendChild(createApplicantCard(applicant)));
    } catch (error) {
        showStatus(applicantsMessage, error.message, true);
    }
}

jobFilter.addEventListener("change", () => {
    loadApplicants(jobFilter.value ? Number(jobFilter.value) : null);
});

document.getElementById("refreshApplicants").addEventListener("click", () => {
    loadApplicants(currentJobId);
});

/* ----- Post a job ----- */

function validateJobForm() {
    for (const input of jobForm.querySelectorAll("input, textarea, select")) {
        if (input.type !== "number" && input.type !== "date" && input.tagName !== "SELECT") {
            input.value = input.value.trim();
        }
        if (!input.checkValidity()) {
            const label = jobForm.querySelector(`label[for=${input.id}]`);
            const name = label ? label.textContent.replace("*", "").trim() : input.id;
            input.focus();
            if (input.validity.valueMissing) return name + " is required.";
            if (input.validity.rangeUnderflow) return name + " must be at least " + input.min + ".";
            if (input.validity.rangeOverflow) return name + " must be at most " + input.max + ".";
            return name + " is not valid.";
        }
    }

    const salaryMin = document.getElementById("salaryMin").value;
    const salaryMax = document.getElementById("salaryMax").value;
    if (salaryMin !== "" && salaryMax !== "" && Number(salaryMin) > Number(salaryMax)) {
        return "Minimum salary cannot be greater than maximum salary.";
    }

    const deadline = document.getElementById("deadline").value;
    if (deadline && deadline < new Date().toLocaleDateString("en-CA")) {
        return "Please choose a future application deadline.";
    }
    return null;
}

jobForm.addEventListener("submit", async event => {
    event.preventDefault();
    showStatus(formMessage, "");

    const problem = validateJobForm();
    if (problem) {
        showStatus(formMessage, problem, true);
        return;
    }

    const numberOrNull = id => {
        const value = document.getElementById(id).value;
        return value === "" ? null : Number(value);
    };

    const job = {
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        requirements: document.getElementById("requirements").value || null,
        skillsRequired: document.getElementById("skills").value || null,
        location: document.getElementById("location").value,
        employmentType: document.getElementById("employmentType").value,
        workMode: document.getElementById("workMode").value,
        experienceMin: numberOrNull("experienceMin"),
        salaryMin: numberOrNull("salaryMin"),
        salaryMax: numberOrNull("salaryMax"),
        openings: numberOrNull("openings"),
        applicationDeadline: document.getElementById("deadline").value || null
    };

    submitJobButton.disabled = true;
    submitJobButton.textContent = "Publishing...";

    try {
        const saved = await apiFetch("/jobs", {
            method: "POST",
            body: JSON.stringify(job)
        });
        jobForm.reset();
        showStatus(formMessage, `"${saved.title}" was published (Job #${saved.id}). `
            + "It now appears on the home page and under \"My jobs\".");
        loadJobs();
    } catch (error) {
        showStatus(formMessage, error.message, true);
    } finally {
        submitJobButton.disabled = false;
        submitJobButton.textContent = "Publish job →";
    }
});

/* ----- Company profile ----- */

const COMPANY_FIELDS = {
    cName: "name",
    cWebsite: "website",
    cIndustry: "industry",
    cSize: "companySize",
    cHeadquarters: "headquarters",
    cDescription: "description"
};

async function loadCompany() {
    try {
        const company = await apiFetch("/company/me");
        document.getElementById("companyHeading").textContent = company.name;
        Object.entries(COMPANY_FIELDS).forEach(([inputId, field]) => {
            document.getElementById(inputId).value = company[field] || "";
        });
    } catch (error) {
        showStatus(companyMessage, error.message, true);
    }
}

companyForm.addEventListener("submit", async event => {
    event.preventDefault();
    showStatus(companyMessage, "");

    const body = {};
    for (const [inputId, field] of Object.entries(COMPANY_FIELDS)) {
        const input = document.getElementById(inputId);
        input.value = input.value.trim();
        if (!input.checkValidity()) {
            input.focus();
            showStatus(companyMessage, input.validity.valueMissing
                ? "Company name is required."
                : "Website must be a valid URL starting with http:// or https://.", true);
            return;
        }
        body[field] = input.value;
    }

    const button = document.getElementById("saveCompanyButton");
    button.disabled = true;

    try {
        const saved = await apiFetch("/company/me", {
            method: "PUT",
            body: JSON.stringify(body)
        });
        document.getElementById("companyHeading").textContent = saved.name;
        saveSession({ ...getSession(), companyName: saved.name });
        showStatus(companyMessage, saved.message || "Saved.");
    } catch (error) {
        showStatus(companyMessage, error.message, true);
    } finally {
        button.disabled = false;
    }
});

if (session) {
    // company.html?job=5#applicants opens the applicants of job 5
    const jobParam = Number(new URLSearchParams(window.location.search).get("job")) || null;
    showTab(TAB_FOR_HASH[window.location.hash] || "applicantsTab");

    loadCompany();
    loadJobs().then(() => {
        if (jobParam) jobFilter.value = String(jobParam);
    });
    loadApplicants(jobParam);
}
