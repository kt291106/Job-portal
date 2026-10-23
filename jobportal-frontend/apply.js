
const API_URL = "http://localhost:8080/api";
const params = new URLSearchParams(window.location.search);
const jobId = params.get("jobId");

const jobTitle = document.getElementById("jobTitle");
const companyName = document.getElementById("companyName");
const jobLocation = document.getElementById("jobLocation");
const jobType = document.getElementById("jobType");
const jobDescription = document.getElementById("jobDescription");
const pageMessage = document.getElementById("pageMessage");
const applicationForm = document.getElementById("applicationForm");
const submitButton = document.getElementById("submitApplication");

let selectedJob = null;

function showMessage(message, isError = false) {
    pageMessage.textContent = message;
    pageMessage.style.color = isError ? "#b42318" : "#187443";
}

async function loadSelectedJob() {
    if (!jobId) {
        jobTitle.textContent = "No job selected";
        applicationForm.hidden = true;
        showMessage("Please open this page using a job's Apply Now button.", true);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/jobs`);

        if (!response.ok) {
            throw new Error("Could not fetch jobs from the server.");
        }

        const jobs = await response.json();

        selectedJob = jobs.find(job => String(job.id) === String(jobId));

        if (!selectedJob) {
            jobTitle.textContent = "Job not found";
            applicationForm.hidden = true;
            showMessage("This job may have been removed or its ID is invalid.", true);
            return;
        }

        jobTitle.textContent = selectedJob.title || "Untitled job";
        companyName.textContent =
            selectedJob.company?.name ||
            selectedJob.companyName ||
            "Company details unavailable";

        jobLocation.textContent =
            "Location: " + (selectedJob.location || "Not specified");

        jobType.textContent =
            "Job type: " +
            (selectedJob.employmentType || "Not specified");

        jobDescription.textContent =
            selectedJob.description || "No description provided.";

        const user = JSON.parse(
            sessionStorage.getItem("careerNestUser") || "null"
        );

        if (user) {
            document.getElementById("fullName").value =
                user.fullName || "";

            document.getElementById("email").value =
                user.email || "";
        }
    } catch (error) {
        jobTitle.textContent = "Unable to load job";
        applicationForm.hidden = true;
        showMessage(error.message, true);
    }
}

applicationForm.addEventListener("submit", async event => {
    event.preventDefault();

    const user = JSON.parse(
        sessionStorage.getItem("careerNestUser") || "null"
    );

    if (!user || !user.id) {
        showMessage("Please log in before applying for a job.", true);
        return;
    }

    if (!selectedJob) {
        showMessage("Job details have not loaded.", true);
        return;
    }

    submitButton.disabled = true;
submitButton.textContent = "Submitting...";

try {
    const response = await fetch(`${API_URL}/applications`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            jobId: selectedJob.id,
            applicantId: user.id,
            coverLetter: document.getElementById("coverLetter").value.trim()
        })
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Application submission failed.");
    }

    showMessage("Application submitted successfully! You will be notified about the next steps via email.");

    applicationForm.reset();
    document.getElementById("fullName").value = user.fullName || "";
    document.getElementById("email").value = user.email || "";

    submitButton.textContent = "Application Submitted";
    return;

} catch (error) {
    showMessage(error.message, true);
} finally {
    if (submitButton.textContent !== "Application Submitted") {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Application";
    }
}
});

loadSelectedJob();
