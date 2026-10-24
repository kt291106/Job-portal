/* ===== Job seeker profile, resumes and applications ===== */

const session = requireRole("STUDENT");

const profileForm = document.getElementById("profileForm");
const profileMessage = document.getElementById("profileMessage");
const profileNotice = document.getElementById("profileNotice");
const saveProfileButton = document.getElementById("saveProfileButton");
const resumeForm = document.getElementById("resumeForm");
const resumeFile = document.getElementById("resumeFile");
const resumeMessage = document.getElementById("resumeMessage");
const uploadButton = document.getElementById("uploadButton");
const resumeList = document.getElementById("resumeList");
const applicationList = document.getElementById("applicationList");

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const PROFILE_FIELDS = [
    "phone", "collegeName", "degree", "branch", "graduationYear",
    "cgpa", "skills", "linkedinUrl", "githubUrl"
];

// Where to return after completing the profile (set by apply.html)
const returnTo = new URLSearchParams(window.location.search).get("returnJob");

let profileComplete = false;
let resumeCount = 0;

function updateNotice() {
    const missing = [];
    if (!profileComplete) missing.push("complete your profile");
    if (resumeCount === 0) missing.push("upload a resume");

    profileNotice.replaceChildren();

    if (missing.length === 0 && !returnTo) {
        profileNotice.hidden = true;
        return;
    }

    profileNotice.hidden = false;

    if (missing.length > 0) {
        profileNotice.append("Before you can apply for jobs, please "
            + missing.join(" and ") + ".");
        return;
    }

    profileNotice.append("Your profile is ready. ");
    const link = el("a", null, "Continue your application →");
    link.href = "apply.html?jobId=" + encodeURIComponent(returnTo);
    profileNotice.append(link);
}

async function loadProfile() {
    try {
        const profile = await apiFetch("/profile");

        document.getElementById("fullName").value = profile.fullName || "";
        document.getElementById("email").value = profile.email || "";
        document.getElementById("profileHeading").textContent =
            "Hi, " + (profile.fullName || "there");

        PROFILE_FIELDS.forEach(field => {
            const value = profile[field];
            document.getElementById(field).value = value == null ? "" : value;
        });

        profileComplete = profile.complete === true;
        updateNotice();
    } catch (error) {
        showStatus(profileMessage, error.message, true);
    }
}

function validateProfile() {
    for (const input of profileForm.querySelectorAll("input:not([disabled]), textarea")) {
        input.value = input.value.trim();
        if (!input.checkValidity()) {
            const label = profileForm.querySelector(`label[for=${input.id}]`);
            const name = label ? label.textContent.replace("*", "").trim() : input.id;
            input.focus();

            if (input.validity.valueMissing) return name + " is required.";
            if (input.id === "phone") return "Phone must be 10 to 15 digits (optional + at the start).";
            if (input.type === "url") return name + " must be a valid URL starting with http:// or https://.";
            return name + " is not valid.";
        }
    }
    return null;
}

profileForm.addEventListener("submit", async event => {
    event.preventDefault();
    showStatus(profileMessage, "");

    const problem = validateProfile();
    if (problem) {
        showStatus(profileMessage, problem, true);
        return;
    }

    const cgpaText = document.getElementById("cgpa").value;
    const body = {
        phone: document.getElementById("phone").value,
        collegeName: document.getElementById("collegeName").value,
        degree: document.getElementById("degree").value,
        branch: document.getElementById("branch").value,
        graduationYear: Number(document.getElementById("graduationYear").value),
        cgpa: cgpaText === "" ? null : Number(cgpaText),
        skills: document.getElementById("skills").value,
        linkedinUrl: document.getElementById("linkedinUrl").value,
        githubUrl: document.getElementById("githubUrl").value
    };

    saveProfileButton.disabled = true;
    saveProfileButton.textContent = "Saving...";

    try {
        const saved = await apiFetch("/profile", {
            method: "PUT",
            body: JSON.stringify(body)
        });
        profileComplete = saved.complete === true;
        showStatus(profileMessage, saved.message || "Profile saved.");
        updateNotice();
    } catch (error) {
        showStatus(profileMessage, error.message, true);
    } finally {
        saveProfileButton.disabled = false;
        saveProfileButton.textContent = "Save profile";
    }
});

async function loadResumes() {
    try {
        const resumes = await apiFetch("/resumes");
        resumeCount = resumes.length;
        resumeList.replaceChildren();

        if (resumes.length === 0) {
            resumeList.appendChild(el("p", "status-message", "No resumes uploaded yet."));
        }

        resumes.forEach(resume => {
            const item = el("div", "list-item");
            const info = el("div");
            info.append(el("strong", null, resume.originalFilename),
                el("small", null, formatSize(resume.fileSizeBytes)
                    + " · uploaded " + formatDate(resume.uploadedAt)));

            const actions = el("div", "list-actions");
            const view = el("button", "small-button", "Download");
            view.type = "button";
            view.addEventListener("click", () =>
                downloadFile(`/resumes/${resume.id}/file`, resume.originalFilename)
                    .catch(error => showStatus(resumeMessage, error.message, true)));

            const remove = el("button", "small-button danger", "Delete");
            remove.type = "button";
            remove.addEventListener("click", async () => {
                if (!confirm(`Delete "${resume.originalFilename}"?`)) return;
                try {
                    await apiFetch(`/resumes/${resume.id}`, { method: "DELETE" });
                    showStatus(resumeMessage, "Resume deleted.");
                    loadResumes();
                } catch (error) {
                    showStatus(resumeMessage, error.message, true);
                }
            });

            actions.append(view, remove);
            item.append(info, actions);
            resumeList.appendChild(item);
        });

        updateNotice();
    } catch (error) {
        showStatus(resumeMessage, error.message, true);
    }
}

function formatSize(bytes) {
    if (bytes == null) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

resumeForm.addEventListener("submit", async event => {
    event.preventDefault();
    showStatus(resumeMessage, "");

    const file = resumeFile.files[0];
    if (!file) {
        showStatus(resumeMessage, "Please choose a file to upload.", true);
        return;
    }
    if (!/\.(pdf|docx?|DOCX?|PDF)$/i.test(file.name)) {
        showStatus(resumeMessage, "Only PDF, DOC or DOCX files are allowed.", true);
        return;
    }
    if (file.size > MAX_RESUME_BYTES) {
        showStatus(resumeMessage, "File is too large. Maximum size is 5 MB.", true);
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    uploadButton.disabled = true;
    uploadButton.textContent = "Uploading...";

    try {
        await apiFetch("/resumes", { method: "POST", body: formData });
        showStatus(resumeMessage, "Resume uploaded.");
        resumeForm.reset();
        loadResumes();
    } catch (error) {
        showStatus(resumeMessage, error.message, true);
    } finally {
        uploadButton.disabled = false;
        uploadButton.textContent = "Upload resume";
    }
});

function statusPill(status) {
    const colour = {
        SELECTED: "green", SHORTLISTED: "green", INTERVIEW: "green",
        REJECTED: "red", WITHDRAWN: "grey"
    }[status] || "";
    return el("span", "pill " + colour, prettyEnum(status));
}

async function loadApplications() {
    try {
        const applications = await apiFetch("/applications/mine");
        applicationList.replaceChildren();

        if (applications.length === 0) {
            applicationList.appendChild(
                el("p", "status-message", "You have not applied for any jobs yet."));
            return;
        }

        applications.forEach(application => {
            const item = el("div", "list-item");
            const info = el("div");
            info.append(
                el("strong", null, application.jobTitle || "Job #" + application.jobId),
                el("small", null, (application.companyName || "Company")
                    + " · applied " + formatDate(application.appliedAt)));
            item.append(info, statusPill(application.status));
            applicationList.appendChild(item);
        });
    } catch (error) {
        applicationList.replaceChildren(el("p", "status-message error-text", error.message));
    }
}

if (session) {
    loadProfile();
    loadResumes();
    loadApplications();
}
