/* ===== CareerNest shared helpers & Dual-Mode Engine ===== */

const API_BASE = "http://localhost:8080/api";
const SESSION_KEY = "careerNestUser";
const DEMO_DB_KEY = "careerNestDemoDB_v2";
const DEMO_MODE_OVERRIDE_KEY = "careerNestForceDemo";

let isBackendAvailable = null; // null = untested, true = live, false = mock fallback

// ===== Session Management =====
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

window.addEventListener("storage", event => {
    if (event.key === SESSION_KEY) renderNavbar();
});

// ===== Mock Database Seed =====
function getInitialDemoDB() {
    return {
        users: [
            {
                id: 1,
                fullName: "Priya Sharma",
                email: "priya@example.test",
                role: "STUDENT",
                isActive: true,
                password: "Demo@12345"
            },
            {
                id: 2,
                fullName: "Aarav Verma",
                email: "aarav@example.test",
                role: "STUDENT",
                isActive: true,
                password: "Demo@12345"
            },
            {
                id: 3,
                fullName: "Neha Patel",
                email: "neha@example.test",
                role: "RECRUITER",
                isActive: true,
                companyId: 1,
                companyName: "TechNova Solutions",
                password: "Demo@12345"
            },
            {
                id: 4,
                fullName: "Vikram Malhotra",
                email: "vikram@example.test",
                role: "RECRUITER",
                isActive: true,
                companyId: 2,
                companyName: "CloudScale Systems",
                password: "Demo@12345"
            },
            {
                id: 99,
                fullName: "System Administrator",
                email: "admin@careernest.local",
                role: "ADMIN",
                isActive: true,
                password: "Admin@12345"
            }
        ],
        companies: [
            {
                id: 1,
                name: "TechNova Solutions",
                website: "https://technova.example.com",
                industry: "Information Technology",
                companySize: "201-1000",
                headquarters: "Bengaluru, Karnataka",
                description: "Pioneering enterprise AI software and next-gen cloud platforms.",
                recruiterName: "Neha Patel",
                recruiterEmail: "neha@example.test"
            },
            {
                id: 2,
                name: "CloudScale Systems",
                website: "https://cloudscale.example.com",
                industry: "Cloud Infrastructure",
                companySize: "51-200",
                headquarters: "Hyderabad, Telangana",
                description: "Scalable cloud DevOps and high-performance serverless architecture.",
                recruiterName: "Vikram Malhotra",
                recruiterEmail: "vikram@example.test"
            },
            {
                id: 3,
                name: "Pulse HealthTech",
                website: "https://pulsehealth.example.com",
                industry: "Digital Healthcare",
                companySize: "51-200",
                headquarters: "Pune, Maharashtra",
                description: "Revolutionizing modern healthcare diagnostics and patient care apps.",
                recruiterName: "Ritu Kapoor",
                recruiterEmail: "ritu@pulsehealth.example.com"
            },
            {
                id: 4,
                name: "Zenith Creative Labs",
                website: "https://zenithcreative.example.com",
                industry: "Design & UX Consulting",
                companySize: "11-50",
                headquarters: "Mumbai, Maharashtra",
                description: "World-class digital product design, UX research, and visual identities.",
                recruiterName: "Kunal Singhania",
                recruiterEmail: "kunal@zenithcreative.example.com"
            }
        ],
        jobs: [
            {
                id: 1,
                title: "Full Stack Java Developer",
                companyId: 1,
                companyName: "TechNova Solutions",
                description: "Join our core engineering group to build robust microservices with Spring Boot, MySQL, and modern JavaScript/React. You will design resilient REST APIs and scalable data pipelines.",
                requirements: "Strong proficiency in Java 17+, Spring Boot, SQL, and RESTful API architecture. Experience with Git and CI/CD pipelines.",
                skillsRequired: "Java, Spring Boot, MySQL, REST APIs, Git, React",
                location: "Bengaluru (Hybrid)",
                employmentType: "FULL_TIME",
                workMode: "HYBRID",
                experienceMin: 1,
                salaryMin: 850000,
                salaryMax: 1400000,
                openings: 3,
                status: "PUBLISHED",
                applicationDeadline: "2026-12-31"
            },
            {
                id: 2,
                title: "Frontend UI/UX Engineer",
                companyId: 4,
                companyName: "Zenith Creative Labs",
                description: "We are seeking a creative Frontend Engineer passionate about crafting pixel-perfect, responsive web interfaces with smooth animations and accessibility best practices.",
                requirements: "Solid foundation in modern HTML5, CSS3, modern JavaScript, and UI animation techniques.",
                skillsRequired: "HTML5, CSS3, JavaScript, UI/UX, Responsive Design, Figma",
                location: "Mumbai (Hybrid)",
                employmentType: "FULL_TIME",
                workMode: "HYBRID",
                experienceMin: 0,
                salaryMin: 700000,
                salaryMax: 1100000,
                openings: 2,
                status: "PUBLISHED",
                applicationDeadline: "2026-11-30"
            },
            {
                id: 3,
                title: "Software Engineering Intern",
                companyId: 1,
                companyName: "TechNova Solutions",
                description: "Hands-on internship for pre-final and final year students. Work directly alongside senior architects on production features, unit testing, and real-time telemetry.",
                requirements: "Pursuing B.Tech/B.E. or MCA in Computer Science or related fields. Passion for clean code and problem solving.",
                skillsRequired: "Java or Python, Data Structures, OOP, SQL, Problem Solving",
                location: "Bengaluru (Onsite)",
                employmentType: "INTERNSHIP",
                workMode: "ONSITE",
                experienceMin: 0,
                salaryMin: 35000,
                salaryMax: 45000,
                openings: 5,
                status: "PUBLISHED",
                applicationDeadline: "2026-12-15"
            },
            {
                id: 4,
                title: "Cloud DevOps Engineer",
                companyId: 2,
                companyName: "CloudScale Systems",
                description: "Manage AWS/GCP cloud environments, automated deployment pipelines, Docker containers, and Kubernetes clusters for mission-critical client services.",
                requirements: "Hands-on experience with Linux, Docker, CI/CD pipelines, and cloud monitoring tools.",
                skillsRequired: "AWS, Docker, Kubernetes, Linux, Terraform, CI/CD",
                location: "Remote (India)",
                employmentType: "FULL_TIME",
                workMode: "REMOTE",
                experienceMin: 2,
                salaryMin: 1200000,
                salaryMax: 1800000,
                openings: 2,
                status: "PUBLISHED",
                applicationDeadline: "2026-12-20"
            },
            {
                id: 5,
                title: "Junior Data Analyst",
                companyId: 3,
                companyName: "Pulse HealthTech",
                description: "Analyze clinical metrics, customer utilization dashboards, and performance trends using SQL and modern data visualization tools.",
                requirements: "Bachelor's degree in Engineering, Mathematics, or Data Science. Proficiency in SQL and Excel.",
                skillsRequired: "SQL, Python, Excel, PowerBI, Data Visualization",
                location: "Pune (Hybrid)",
                employmentType: "FULL_TIME",
                workMode: "HYBRID",
                experienceMin: 0,
                salaryMin: 600000,
                salaryMax: 850000,
                openings: 2,
                status: "PUBLISHED",
                applicationDeadline: "2026-12-10"
            },
            {
                id: 6,
                title: "Product Design Intern",
                companyId: 4,
                companyName: "Zenith Creative Labs",
                description: "Learn UX workflows, wireframing, interactive prototyping, and user testing. Deliver design solutions that wow users.",
                requirements: "Portfolio showcasing digital interface design, Figma fluency, and strong aesthetic sense.",
                skillsRequired: "Figma, Wireframing, Prototyping, User Research",
                location: "Remote",
                employmentType: "INTERNSHIP",
                workMode: "REMOTE",
                experienceMin: 0,
                salaryMin: 30000,
                salaryMax: 40000,
                openings: 3,
                status: "PUBLISHED",
                applicationDeadline: "2026-11-28"
            }
        ],
        profiles: {
            "1": {
                userId: 1,
                fullName: "Priya Sharma",
                email: "priya@example.test",
                phone: "9876543210",
                collegeName: "National Institute of Technology",
                degree: "B.Tech",
                branch: "Computer Science & Engineering",
                graduationYear: 2026,
                cgpa: 9.15,
                skills: "Java, Spring Boot, MySQL, JavaScript, React, Git, REST APIs",
                linkedinUrl: "https://linkedin.com/in/priya-sharma-demo",
                githubUrl: "https://github.com/priya-sharma-demo",
                complete: true
            }
        },
        resumes: {
            "1": [
                {
                    id: 101,
                    originalFilename: "Priya_Sharma_Resume.pdf",
                    contentType: "application/pdf",
                    size: 142050,
                    isDefault: true,
                    uploadedAt: new Date().toISOString()
                }
            ]
        },
        applications: [
            {
                applicationId: 501,
                jobId: 1,
                jobTitle: "Full Stack Java Developer",
                companyId: 1,
                companyName: "TechNova Solutions",
                studentId: 1,
                fullName: "Priya Sharma",
                email: "priya@example.test",
                phone: "9876543210",
                collegeName: "National Institute of Technology",
                degree: "B.Tech",
                branch: "Computer Science & Engineering",
                graduationYear: 2026,
                cgpa: 9.15,
                skills: "Java, Spring Boot, MySQL, JavaScript, React, Git",
                linkedinUrl: "https://linkedin.com/in/priya-sharma-demo",
                githubUrl: "https://github.com/priya-sharma-demo",
                coverLetter: "I am deeply interested in building high-scale distributed backend systems. With strong proficiency in Java and Spring Boot, I would love to contribute to TechNova Solutions.",
                resumeId: 101,
                resumeName: "Priya_Sharma_Resume.pdf",
                status: "SHORTLISTED",
                appliedAt: new Date(Date.now() - 86400000 * 2).toISOString()
            }
        ]
    };
}

function getDemoDB() {
    try {
        const raw = localStorage.getItem(DEMO_DB_KEY);
        if (!raw) {
            const initial = getInitialDemoDB();
            localStorage.setItem(DEMO_DB_KEY, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(raw);
    } catch {
        return getInitialDemoDB();
    }
}

function saveDemoDB(db) {
    try {
        localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db));
    } catch (e) {
        console.error("Failed to save demo DB", e);
    }
}

// ===== Simulated Backend Engine =====
async function mockApiFetch(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const session = getSession();
    const db = getDemoDB();

    // Artificial delay to make interactions feel natural
    await new Promise(r => setTimeout(r, 60));

    // Handle RAW download requests (e.g. resumes)
    if (options.raw) {
        const resumeMatch = path.match(/^\/resumes\/(\d+)\/file$/);
        if (resumeMatch) {
            const blob = new Blob([
                "CareerNest Simulated Resume Document\n\nApplicant: Priya Sharma\nRole: Software Engineer\nEducation: B.Tech CSE (9.15 CGPA)\nSkills: Java, Spring Boot, React, MySQL, Cloud Architecture\n"
            ], { type: "application/pdf" });
            return new Response(blob, {
                status: 200,
                headers: new Headers({
                    "Content-Disposition": 'attachment; filename="Priya_Sharma_Resume.pdf"',
                    "Content-Type": "application/pdf"
                })
            });
        }
    }

    let body = {};
    if (options.body) {
        if (options.body instanceof FormData) {
            body = options.body;
        } else if (typeof options.body === "string") {
            try { body = JSON.parse(options.body); } catch { body = {}; }
        }
    }

    // 1. Auth Login
    if (path === "/auth/login" && method === "POST") {
        const user = db.users.find(u => u.email.toLowerCase() === (body.email || "").toLowerCase());
        if (!user || user.password !== body.password) {
            throw new Error("Invalid email or password.");
        }
        if (!user.isActive) {
            throw new Error("This account is currently deactivated. Please contact support.");
        }
        return {
            token: "demo-jwt-token-" + user.id + "-" + Date.now(),
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            companyId: user.companyId || null,
            companyName: user.companyName || null
        };
    }

    // 2. Auth Signup
    if (path === "/auth/signup" && method === "POST") {
        const existing = db.users.find(u => u.email.toLowerCase() === (body.email || "").toLowerCase());
        if (existing) throw new Error("An account with this email already exists.");

        let newCompanyId = null;
        let companyName = null;
        if (body.accountType === "COMPANY") {
            newCompanyId = db.companies.length + 1;
            companyName = body.companyName || "New Company";
            db.companies.push({
                id: newCompanyId,
                name: companyName,
                website: body.companyWebsite || "",
                industry: body.companyIndustry || "Technology",
                companySize: body.companySize || "11-50",
                headquarters: body.companyHeadquarters || "India",
                description: "",
                recruiterName: body.fullName,
                recruiterEmail: body.email
            });
        }

        const newUser = {
            id: db.users.length + 10,
            fullName: body.fullName || (body.accountType === "COMPANY" ? "Recruiter" : "Job Seeker"),
            email: body.email,
            role: body.accountType === "COMPANY" ? "RECRUITER" : "STUDENT",
            companyId: newCompanyId,
            companyName: companyName,
            isActive: true,
            password: body.password
        };
        db.users.push(newUser);
        saveDemoDB(db);

        return {
            token: "demo-jwt-token-" + newUser.id + "-" + Date.now(),
            id: newUser.id,
            email: newUser.email,
            fullName: newUser.fullName,
            role: newUser.role,
            companyId: newUser.companyId || null,
            companyName: newUser.companyName || null
        };
    }

    // 3. Jobs Listing
    if (path === "/jobs" && method === "GET") {
        return db.jobs.filter(j => j.status === "PUBLISHED");
    }

    // 4. Job by ID
    const singleJobMatch = path.match(/^\/jobs\/(\d+)$/);
    if (singleJobMatch && method === "GET") {
        const job = db.jobs.find(j => j.id === Number(singleJobMatch[1]));
        if (!job) throw new Error("Job not found.");
        return job;
    }

    // 5. Post Job (Company or Student)
    if (path === "/jobs" && method === "POST") {
        const newJob = {
            id: db.jobs.length + 1,
            title: body.title,
            companyId: session?.companyId || 1,
            companyName: session?.companyName || "TechNova Solutions",
            description: body.description,
            requirements: body.requirements || "",
            skillsRequired: body.skillsRequired || "",
            location: body.location || "Remote",
            employmentType: body.employmentType || "FULL_TIME",
            workMode: body.workMode || "HYBRID",
            experienceMin: body.experienceMin || 0,
            salaryMin: body.salaryMin || null,
            salaryMax: body.salaryMax || null,
            openings: body.openings || 1,
            status: "PUBLISHED",
            applicationDeadline: body.applicationDeadline || null
        };
        db.jobs.unshift(newJob);
        saveDemoDB(db);
        return newJob;
    }

    // 6. Company Jobs
    if (path === "/company/jobs" && method === "GET") {
        const cId = session?.companyId || 1;
        return db.jobs.filter(j => j.companyId === cId).map(j => ({
            ...j,
            applicantCount: db.applications.filter(a => a.jobId === j.id).length
        }));
    }

    // 7. Company Job Status Change
    const companyJobStatusMatch = path.match(/^\/company\/jobs\/(\d+)\/status$/);
    if (companyJobStatusMatch && method === "PATCH") {
        const jId = Number(companyJobStatusMatch[1]);
        const job = db.jobs.find(j => j.id === jId);
        if (job) {
            job.status = body.status;
            saveDemoDB(db);
        }
        return { message: "Job status updated." };
    }

    // 8. Company Profile
    if (path === "/company/me" && method === "GET") {
        const cId = session?.companyId || 1;
        const c = db.companies.find(comp => comp.id === cId) || db.companies[0];
        return c;
    }

    if (path === "/company/me" && method === "PUT") {
        const cId = session?.companyId || 1;
        const idx = db.companies.findIndex(comp => comp.id === cId);
        if (idx !== -1) {
            db.companies[idx] = { ...db.companies[idx], ...body };
            saveDemoDB(db);
            return db.companies[idx];
        }
        return body;
    }

    // 9. Company Applications
    if (path === "/company/applications" && method === "GET") {
        const cId = session?.companyId || 1;
        return db.applications.filter(a => a.companyId === cId);
    }

    const companyJobAppsMatch = path.match(/^\/company\/jobs\/(\d+)\/applications$/);
    if (companyJobAppsMatch && method === "GET") {
        const jId = Number(companyJobAppsMatch[1]);
        const job = db.jobs.find(j => j.id === jId) || { title: "Job #" + jId };
        const apps = db.applications.filter(a => a.jobId === jId);
        return { job, applications: apps };
    }

    const appStatusMatch = path.match(/^\/company\/applications\/(\d+)\/status$/);
    if (appStatusMatch && method === "PATCH") {
        const aId = Number(appStatusMatch[1]);
        const app = db.applications.find(a => a.applicationId === aId);
        if (app) {
            app.status = body.status;
            saveDemoDB(db);
        }
        return { message: "Application status updated." };
    }

    // 10. Student Profile
    if (path === "/profile" && method === "GET") {
        const uId = String(session?.id || 1);
        const p = db.profiles[uId] || {
            fullName: session?.fullName || "Student User",
            email: session?.email || "student@example.test",
            complete: false
        };
        return p;
    }

    if (path === "/profile" && method === "PUT") {
        const uId = String(session?.id || 1);
        db.profiles[uId] = {
            userId: session?.id || 1,
            fullName: session?.fullName || "Student User",
            email: session?.email || "student@example.test",
            ...body,
            complete: true
        };
        saveDemoDB(db);
        return { message: "Profile saved successfully." };
    }

    // 11. Resumes
    if (path === "/resumes" && method === "GET") {
        const uId = String(session?.id || 1);
        return db.resumes[uId] || [];
    }

    if (path === "/resumes" && method === "POST") {
        const uId = String(session?.id || 1);
        if (!db.resumes[uId]) db.resumes[uId] = [];

        let filename = "Resume.pdf";
        if (body instanceof FormData && body.get("file")) {
            filename = body.get("file").name;
        }

        const newResume = {
            id: Date.now(),
            originalFilename: filename,
            contentType: "application/pdf",
            size: 154000,
            isDefault: db.resumes[uId].length === 0,
            uploadedAt: new Date().toISOString()
        };
        db.resumes[uId].push(newResume);
        saveDemoDB(db);
        return newResume;
    }

    const deleteResumeMatch = path.match(/^\/resumes\/(\d+)$/);
    if (deleteResumeMatch && method === "DELETE") {
        const uId = String(session?.id || 1);
        const rId = Number(deleteResumeMatch[1]);
        if (db.resumes[uId]) {
            db.resumes[uId] = db.resumes[uId].filter(r => r.id !== rId);
            saveDemoDB(db);
        }
        return { message: "Resume deleted." };
    }

    // 12. Applications for Job Seeker
    if ((path === "/applications" || path === "/applications/mine") && method === "GET") {
        const uId = session?.id || 1;
        return db.applications.filter(a => a.studentId === uId);
    }

    if ((path === "/applications" || path.endsWith("/apply")) && method === "POST") {
        let jId;
        const applyMatch = path.match(/^\/jobs\/(\d+)\/apply$/);
        if (applyMatch) {
            jId = Number(applyMatch[1]);
        } else {
            jId = Number(body.jobId);
        }

        const job = db.jobs.find(j => j.id === jId) || {
            title: "Software Engineer",
            companyId: 1,
            companyName: "TechNova Solutions"
        };

        let coverLetter = "";
        let resumeId = null;

        if (body instanceof FormData) {
            coverLetter = body.get("coverLetter") || "";
            resumeId = Number(body.get("resumeId")) || 101;
        } else {
            coverLetter = body.coverLetter || "";
            resumeId = Number(body.resumeId) || 101;
        }

        const uId = session?.id || 1;
        const profile = db.profiles[String(uId)] || {};

        const newApp = {
            applicationId: Date.now(),
            jobId: jId,
            jobTitle: job.title,
            companyId: job.companyId,
            companyName: job.companyName,
            studentId: uId,
            fullName: session?.fullName || "Candidate",
            email: session?.email || "candidate@example.test",
            phone: profile.phone || "9876543210",
            collegeName: profile.collegeName || "Engineering Institute",
            degree: profile.degree || "B.Tech",
            branch: profile.branch || "CSE",
            graduationYear: profile.graduationYear || 2026,
            cgpa: profile.cgpa || 9.0,
            skills: profile.skills || "Java, Spring Boot, React",
            linkedinUrl: profile.linkedinUrl || "",
            githubUrl: profile.githubUrl || "",
            coverLetter: coverLetter,
            resumeId: resumeId,
            resumeName: "Resume_Document.pdf",
            status: "APPLIED",
            appliedAt: new Date().toISOString()
        };

        db.applications.push(newApp);
        saveDemoDB(db);
        return { message: "Application submitted successfully!", applicationId: newApp.applicationId };
    }

    // 13. Admin Routes
    if (path === "/admin/stats" && method === "GET") {
        return {
            students: db.users.filter(u => u.role === "STUDENT").length,
            recruiters: db.users.filter(u => u.role === "RECRUITER").length,
            companies: db.companies.length,
            jobs: db.jobs.length,
            applications: db.applications.length
        };
    }

    if (path === "/admin/users" && method === "GET") {
        return db.users;
    }

    const adminUserActiveMatch = path.match(/^\/admin\/users\/(\d+)\/active$/);
    if (adminUserActiveMatch && method === "PATCH") {
        const uId = Number(adminUserActiveMatch[1]);
        const user = db.users.find(u => u.id === uId);
        if (user) {
            user.isActive = body.active;
            saveDemoDB(db);
        }
        return { message: "User status updated." };
    }

    if (path === "/admin/companies" && method === "GET") {
        return db.companies.map(c => ({
            ...c,
            jobCount: db.jobs.filter(j => j.companyId === c.id).length
        }));
    }

    if (path === "/admin/jobs" && method === "GET") {
        return db.jobs.map(j => ({
            ...j,
            applicantCount: db.applications.filter(a => a.jobId === j.id).length
        }));
    }

    const adminJobStatusMatch = path.match(/^\/admin\/jobs\/(\d+)\/status$/);
    if (adminJobStatusMatch && method === "PATCH") {
        const jId = Number(adminJobStatusMatch[1]);
        const job = db.jobs.find(j => j.id === jId);
        if (job) {
            job.status = body.status;
            saveDemoDB(db);
        }
        return { message: "Job status updated." };
    }

    return { message: "Success" };
}

/**
 * Universal fetch wrapper:
 * Tries live backend first; if unavailable, falls back to local Interactive Demo Engine.
 */
async function apiFetch(path, options = {}) {
    const session = getSession();
    const headers = new Headers(options.headers || {});

    if (session?.token) {
        headers.set("Authorization", "Bearer " + session.token);
    }
    if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const forceDemo = localStorage.getItem(DEMO_MODE_OVERRIDE_KEY) === "true";
    if (forceDemo) {
        return mockApiFetch(path, options);
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(API_BASE + path, {
            ...options,
            headers,
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        isBackendAvailable = true;
        updateConnectionBadge(true);

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
    } catch (netErr) {
        // Backend offline or unreachable -> switch to Mock Demo Engine seamlessly
        isBackendAvailable = false;
        updateConnectionBadge(false);
        console.info("Notice: Live Spring Boot backend is offline. Running in interactive demo mode.", netErr.message);
        return mockApiFetch(path, options);
    }
}

// Visual status pill for live backend vs standalone interactive demo
function updateConnectionBadge(live) {
    let badge = document.getElementById("connectionBadge");
    if (!badge) {
        badge = document.createElement("button");
        badge.id = "connectionBadge";
        badge.className = "demo-badge-pill";
        badge.type = "button";
        const nav = document.querySelector(".navbar");
        if (nav) nav.appendChild(badge);
    }

    if (live) {
        badge.textContent = "🟢 Live Backend";
        badge.title = "Connected to Spring Boot API on port 8080";
        badge.style.color = "var(--green)";
        badge.style.borderColor = "#a7f3d0";
        badge.style.background = "var(--green-bg)";
    } else {
        badge.textContent = "✨ Demo Mode";
        badge.title = "Spring Boot offline - running full interactive simulation. Click to test live connection.";
        badge.onclick = () => {
            localStorage.removeItem(DEMO_MODE_OVERRIDE_KEY);
            alert("Testing live Spring Boot connection (port 8080)...");
            window.location.reload();
        };
    }
}

// Page that matches the user's role
function dashboardFor(role) {
    if (role === "RECRUITER") return "company.html";
    if (role === "ADMIN") return "admin.html";
    return "profile.html";
}

function dashboardLabel(role) {
    if (role === "RECRUITER") return "Company Dashboard";
    if (role === "ADMIN") return "Admin Panel";
    return "My Profile";
}

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
        // Logging out locally is enough
    }
    clearSession();
    window.location.href = "index.html";
}

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
        signup.className = "primary-button";
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
    } else {
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

    // Attach logo badge if missing
    const logoEl = document.querySelector(".navbar .logo");
    if (logoEl && !logoEl.querySelector(".logo-badge")) {
        const badge = el("span", "logo-badge", "CN");
        logoEl.prepend(badge);
    }
}

// 1-Click Quick Demo Login Helper
function quickLogin(role) {
    const db = getDemoDB();
    let user;
    if (role === "STUDENT") {
        user = db.users.find(u => u.email === "priya@example.test") || db.users[0];
    } else if (role === "RECRUITER") {
        user = db.users.find(u => u.email === "neha@example.test") || db.users[2];
    } else if (role === "ADMIN") {
        user = db.users.find(u => u.role === "ADMIN") || db.users[4];
    }

    if (user) {
        saveSession({
            token: "demo-jwt-token-" + user.id + "-" + Date.now(),
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            companyId: user.companyId || null,
            companyName: user.companyName || null
        });
        window.location.href = dashboardFor(user.role);
    }
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

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
}

function showStatus(node, message, isError = false) {
    if (!node) return;
    node.textContent = message;
    node.classList.toggle("error-text", isError);
    node.classList.toggle("success-text", !isError && message !== "");
}

async function downloadFile(path, fallbackName) {
    const response = await apiFetch(path, { raw: true });
    const blob = await response.blob();

    let filename = fallbackName || "download.pdf";
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

document.addEventListener("DOMContentLoaded", () => {
    renderNavbar();
    // Pre-test backend connection status
    fetch(API_BASE + "/jobs", { method: "HEAD", signal: AbortSignal.timeout(1200) })
        .then(() => updateConnectionBadge(true))
        .catch(() => updateConnectionBadge(false));
});
