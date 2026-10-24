/* ===== Apply for a job (job seekers only) ===== */

const session = requireRole("STUDENT");
const jobId = new URLSearchParams(window.location.search).get("jobId");

const jobTitle = document.getElementById("jobTitle");
const companyName = document.getElementById("companyName");
const jobDetails = document.getElementById("jobDetails");
const pageMessage = document.getElementById("pageMessage");
const formMessage = document.getElementById("formMessage");
const applicationForm = document.getElementById("applicationForm");
const resumeChoices = document.getElementById("resumeChoices");
const resumeFile = document.getElementById("resumeFile");
const coverLetter = document.getElementById("coverLetter");
const coverCount = document.getElementById("coverCount");
const submitButton = document.getElementById("submitApplication");

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const PROFILE_FIELDS = [
    "phone", "collegeName", "degree", "branch", "graduationYear",
    "cgpa", "skills", "linkedinUrl", "githubUrl"
];

let selectedJob = null;
let deadlinePassed = false;

function addDetail(label, value) {
    const item = el("div");
    item.append(el("span", null, label), document.createTextNode(value || "—"));
    jobDetails.appendChild(item);
}

function renderJob(job) {
    jobTitle.textContent = job.title || "Untitled job";
    companyName.textContent = job.companyName || "";

    let salary = "Not specified";
    if (job.salaryMin != null && job.salaryMax != null) {
        salary = formatSalary(job.salaryMin) + " – " + formatSalary(job.salaryMax);
    } else if (job.salaryMin != null) {
        salary = "From " + formatSalary(job.salaryMin);
    } else if (job.salaryMax != null) {
        salary = "Up to " + formatSalary(job.salaryMax);
    }

    jobDetails.replaceChildren();
    addDetail("Location", job.location);
    addDetail("Type", prettyEnum(job.employmentType));
    addDetail("Work mode", prettyEnum(job.workMode));
    addDetail("Experience", (job.experienceMin ?? 0) + " years");
    addDetail("Salary", salary);
    addDetail("Openings", String(job.openings ?? "—"));
    addDetail("Deadline", job.applicationDeadline ? formatDate(job.applicationDeadline) : "None");
    addDetail("Skills", job.skillsRequired);

    document.getElementById("jobDescription").textContent =
        job.description || "No description provided.";
    document.getElementById("jobRequirements").textContent =
        job.requirements ? "Requirements: " + job.requirements : "";
}

// Existing resumes as radio buttons; picking a new file deselects them
function renderResumes(resumes, selectId) {
    resumeChoices.replaceChildren();

    if (resumes.length === 0) {
        resumeChoices.appendChild(el("p", "status-message",
            "You have no resume uploaded yet. Please upload one below."));
        return;
    }

    resumes.forEach((resume, index) => {
        const option = el("label", "resume-option");
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "resumeId";
        radio.value = resume.id;
        radio.checked = selectId != null
            ? resume.id === selectId
            : resume.isDefault === true || index === 0;
        radio.addEventListener("change", () => { resumeFile.value = ""; });
        option.append(radio, document.createTextNode("Use saved resume: " + resume.originalFilename));
        resumeChoices.appendChild(option);
    });
}

resumeFile.addEventListener("change", () => {
    if (resumeFile.files.length > 0) {
        resumeChoices.querySelectorAll("input[name=resumeId]").forEach(radio => {
            radio.checked = false;
        });
    }
});

async function loadPage() {
    if (!jobId) {
        jobTitle.textContent = "No job selected";
        showStatus(pageMessage, "Please open this page using a job's Apply Now button.", true);
        return;
    }

    try {
        const [job, profile, resumes] = await Promise.all([
            apiFetch("/jobs/" + encodeURIComponent(jobId)),
            apiFetch("/profile"),
            apiFetch("/resumes")
        ]);

        selectedJob = job;
        renderJob(job);

        document.getElementById("fullName").value = profile.fullName || "";
        document.getElementById("email").value = profile.email || "";
        PROFILE_FIELDS.forEach(field => {
            const value = profile[field];
            document.getElementById(field).value = value == null ? "" : value;
        });
        renderResumes(resumes);

        deadlinePassed = Boolean(job.applicationDeadline)
            && job.applicationDeadline < new Date().toLocaleDateString("en-CA");

        applicationForm.hidden = false;
        submitButton.disabled = deadlinePassed;

        if (deadlinePassed) {
            showStatus(pageMessage, "The application deadline for this job has passed.", true);
        }
    } catch (error) {
        jobTitle.textContent = "Unable to load job";
        showStatus(pageMessage, error.message, true);
    }
}

coverLetter.addEventListener("input", () => {
    coverCount.textContent = coverLetter.value.trim().length + " / 3000";
});

// Returns an error message, or null when every field is valid
function validateForm() {
    const fields = applicationForm.querySelectorAll(
        "input:not([disabled]):not([type=file]):not([type=radio]), textarea");

    for (const input of fields) {
        if (input.type !== "number") input.value = input.value.trim();

        if (!input.checkValidity()) {
            const label = applicationForm.querySelector(`label[for=${input.id}]`);
            const name = label ? label.textContent.replace("*", "").trim() : input.id;
            input.focus();

            if (input.id === "coverLetter") return "Cover letter must be 50 to 3000 characters.";
            if (input.validity.valueMissing) return name + " is required.";
            if (input.id === "phone") return "Phone must be 10 to 15 digits (optional + at the start).";
            if (input.type === "url") return name + " must be a valid URL starting with http:// or https://.";
            if (input.validity.rangeUnderflow || input.validity.rangeOverflow) {
                return name + " must be between " + input.min + " and " + input.max + ".";
            }
            return name + " is not valid.";
        }
    }

    const file = resumeFile.files[0];
    const savedResume = applicationForm.querySelector("input[name=resumeId]:checked");

    if (!file && !savedResume) {
        resumeFile.focus();
        return "Please upload a resume or select a saved one.";
    }
    if (file && !/\.(pdf|doc|docx)$/i.test(file.name)) {
        return "Resume must be a PDF, DOC or DOCX file.";
    }
    if (file && file.size > MAX_RESUME_BYTES) {
        return "Resume file is too large. Maximum size is 5 MB.";
    }

    const letter = coverLetter.value.trim();
    if (letter.length < 50 || letter.length > 3000) {
        coverLetter.focus();
        return "Cover letter must be 50 to 3000 characters.";
    }
    return null;
}

applicationForm.addEventListener("submit", async event => {
    event.preventDefault();
    showStatus(formMessage, "");

    if (!selectedJob || deadlinePassed) {
        showStatus(formMessage, "This job is not accepting applications.", true);
        return;
    }

    const problem = validateForm();
    if (problem) {
        showStatus(formMessage, problem, true);
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    try {
        // 1. Save the applicant's details to their profile
        const cgpaText = document.getElementById("cgpa").value;
        await apiFetch("/profile", {
            method: "PUT",
            body: JSON.stringify({
                phone: document.getElementById("phone").value,
                collegeName: document.getElementById("collegeName").value,
                degree: document.getElementById("degree").value,
                branch: document.getElementById("branch").value,
                graduationYear: Number(document.getElementById("graduationYear").value),
                cgpa: cgpaText === "" ? null : Number(cgpaText),
                skills: document.getElementById("skills").value,
                linkedinUrl: document.getElementById("linkedinUrl").value,
                githubUrl: document.getElementById("githubUrl").value
            })
        });

        // 2. Upload the new resume, if one was chosen
        let resumeId;
        const file = resumeFile.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("file", file);
            const uploaded = await apiFetch("/resumes", { method: "POST", body: formData });
            resumeId = uploaded.id;
            resumeFile.value = "";
            renderResumes(await apiFetch("/resumes"), resumeId);
        } else {
            resumeId = Number(applicationForm.querySelector("input[name=resumeId]:checked").value);
        }

        // 3. Submit the application
        await apiFetch("/applications", {
            method: "POST",
            body: JSON.stringify({
                jobId: selectedJob.id,
                resumeId,
                coverLetter: coverLetter.value.trim()
            })
        });

        showStatus(formMessage,
            "Application submitted successfully! Track its status on your profile page.");
        submitButton.textContent = "Application submitted ✓";
        applicationForm.querySelectorAll("input, textarea").forEach(input => {
            input.disabled = true;
        });
    } catch (error) {
        showStatus(formMessage, error.message, true);
        submitButton.disabled = false;
        submitButton.textContent = "Submit application →";
    }
});

if (session) {
    loadPage();
}
