/* ===== Admin panel ===== */

const session = requireRole("ADMIN");
const adminMessage = document.getElementById("adminMessage");

function showTab(tabId) {
    document.querySelectorAll(".tab-panel").forEach(panel => {
        panel.hidden = panel.id !== tabId;
    });
    document.querySelectorAll(".tabs .filter-button").forEach(button => {
        button.classList.toggle("active", button.dataset.tab === tabId);
    });
}

document.querySelectorAll(".tabs .filter-button").forEach(button => {
    button.addEventListener("click", () => showTab(button.dataset.tab));
});

function cell(content) {
    const td = document.createElement("td");
    if (content instanceof Node) {
        td.appendChild(content);
    } else {
        td.textContent = content === null || content === undefined ? "—" : String(content);
    }
    return td;
}

function row(...cells) {
    const tr = document.createElement("tr");
    cells.forEach(content => tr.appendChild(cell(content)));
    return tr;
}

async function loadStats() {
    const stats = await apiFetch("/admin/stats");
    document.getElementById("statStudents").textContent = stats.students;
    document.getElementById("statRecruiters").textContent = stats.recruiters;
    document.getElementById("statCompanies").textContent = stats.companies;
    document.getElementById("statJobs").textContent = stats.jobs;
    document.getElementById("statApplications").textContent = stats.applications;
}

async function loadUsers() {
    const users = await apiFetch("/admin/users");
    const table = document.getElementById("usersTable");
    table.replaceChildren();

    users.forEach(user => {
        const status = el("span", "pill " + (user.isActive ? "green" : "red"),
            user.isActive ? "Active" : "Deactivated");

        let action = "";
        if (user.id !== session.id) {
            action = el("button", "small-button" + (user.isActive ? " danger" : ""),
                user.isActive ? "Deactivate" : "Activate");
            action.type = "button";
            action.addEventListener("click", () => setUserActive(user, !user.isActive));
        }

        table.appendChild(row(user.id, user.fullName, user.email,
            prettyEnum(user.role), status, action));
    });
}

async function setUserActive(user, active) {
    const verb = active ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${verb} ${user.fullName}?`)) return;

    try {
        const result = await apiFetch(`/admin/users/${user.id}/active`, {
            method: "PATCH",
            body: JSON.stringify({ active })
        });
        showStatus(adminMessage, result.message);
        loadUsers();
    } catch (error) {
        showStatus(adminMessage, error.message, true);
    }
}

async function loadCompanies() {
    const companies = await apiFetch("/admin/companies");
    const table = document.getElementById("companiesTable");
    table.replaceChildren();

    companies.forEach(company => {
        const recruiter = el("div");
        recruiter.append(el("div", null, company.recruiterName || "—"),
            el("small", "status-message", company.recruiterEmail || ""));
        table.appendChild(row(company.id, company.name, company.industry,
            company.headquarters, recruiter, company.jobCount));
    });
}

async function loadJobs() {
    const jobs = await apiFetch("/admin/jobs");
    const table = document.getElementById("jobsTable");
    table.replaceChildren();

    jobs.forEach(job => {
        const colour = { PUBLISHED: "green", CLOSED: "red", DRAFT: "grey" }[job.status] || "";
        const status = el("span", "pill " + colour, prettyEnum(job.status));

        const target = job.status === "PUBLISHED" ? "CLOSED" : "PUBLISHED";
        const action = el("button", "small-button", target === "CLOSED" ? "Close" : "Publish");
        action.type = "button";
        action.addEventListener("click", async () => {
            if (!confirm(`Change "${job.title}" to ${prettyEnum(target)}?`)) return;
            try {
                await apiFetch(`/admin/jobs/${job.id}/status`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: target })
                });
                showStatus(adminMessage, `"${job.title}" is now ${prettyEnum(target)}.`);
                loadJobs();
            } catch (error) {
                showStatus(adminMessage, error.message, true);
            }
        });

        table.appendChild(row(job.id, job.title, job.companyName, status,
            job.applicantCount, action));
    });
}

async function loadAll() {
    showStatus(adminMessage, "");
    try {
        await Promise.all([loadStats(), loadUsers(), loadCompanies(), loadJobs()]);
    } catch (error) {
        showStatus(adminMessage, error.message, true);
    }
}

document.getElementById("refreshAll").addEventListener("click", loadAll);

if (session) {
    loadAll();
}
