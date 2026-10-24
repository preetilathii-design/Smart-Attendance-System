
/* =========================================================
   SMART ATTENDANCE MANAGEMENT SYSTEM
   Supabase Authentication + Database
   ========================================================= */

(() => {
    "use strict";

    const supabaseClient = window.supabaseClient;

    if (!supabaseClient) {
        document.body.innerHTML = `
            <div style="font-family:Arial,sans-serif;padding:30px">
                <h2>Supabase connection not found</h2>
                <p>Check js/supabase.js and make sure the Supabase library
                loads before app.js. Open this project using VS Code Live Server.</p>
            </div>`;
        return;
    }

    let students = [];
    let subjects = [];
    let attendanceRecords = [];
    let currentAttendance = {};
    let currentUser = null;
    let isLoading = false;

    const $ = (id) => document.getElementById(id);

    const today = () => {
        const d = new Date();
        return [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, "0"),
            String(d.getDate()).padStart(2, "0")
        ].join("-");
    };

    const escapeHTML = (value) => String(value ?? "").replace(
        /[&<>"']/g,
        char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]
    );

    const showMessage = (element, message, type = "error") => {
        if (!element) return;

        element.textContent = message;
        element.style.color =
            type === "success" ? "#16803d" :
            type === "info" ? "#475569" : "#dc2626";
    };

    const showError = (error, prefix = "Something went wrong") => {
        console.error(prefix, error);
        return `${prefix}: ${error?.message || "Please try again."}`;
    };

    const formatDate = (date) => {
        if (!date) return "—";

        const parts = String(date).split("-");
        if (parts.length !== 3) return escapeHTML(date);

        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    /* =====================================================
       LOGIN SCREEN AND LOGOUT BUTTON
       ===================================================== */

    function createAuthUI() {
        const style = document.createElement("style");

        style.textContent = `
            #sam-auth-overlay {
                position: fixed;
                inset: 0;
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: #f3f5fa;
                font-family: Arial, sans-serif;
            }

            #sam-auth-overlay * { box-sizing: border-box; }

            .sam-auth-card {
                width: 100%;
                max-width: 420px;
                padding: 32px;
                border-radius: 16px;
                background: #fff;
                box-shadow: 0 12px 40px rgba(0,0,0,.10);
            }

            .sam-auth-card h1 {
                margin: 0 0 8px;
                color: #172554;
                font-size: 25px;
            }

            .sam-auth-card p {
                margin: 0 0 24px;
                color: #64748b;
                line-height: 1.5;
            }

            .sam-auth-card label {
                display: block;
                margin: 16px 0 7px;
                color: #334155;
                font-size: 14px;
                font-weight: 600;
            }

            .sam-auth-card input {
                width: 100%;
                padding: 12px;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                font-size: 15px;
            }

            .sam-auth-card input:focus {
                outline: 2px solid #93c5fd;
                border-color: #2563eb;
            }

            .sam-auth-card button {
                width: 100%;
                margin-top: 22px;
                padding: 13px;
                border: none;
                border-radius: 8px;
                background: #2563eb;
                color: white;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
            }

            .sam-auth-card button:disabled {
                opacity: .65;
                cursor: wait;
            }

            #sam-auth-message {
                margin-top: 14px;
                font-size: 14px;
                overflow-wrap: anywhere;
            }

            #sam-logout-btn {
                display: block;
                width: calc(100% - 24px);
                margin: 18px 12px;
                padding: 11px 14px;
                border: 1px solid rgba(255,255,255,.25);
                border-radius: 8px;
                background: transparent;
                color: inherit;
                font: inherit;
                text-align: left;
                cursor: pointer;
            }

            #sam-logout-btn:hover { opacity: .8; }

            #sam-app-loading {
                position: fixed;
                inset: 0;
                z-index: 99998;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f3f5fa;
                color: #334155;
                font: 16px Arial, sans-serif;
            }
        `;

        document.head.appendChild(style);

        const overlay = document.createElement("div");
        overlay.id = "sam-auth-overlay";
        overlay.style.display = "none";

        overlay.innerHTML = `
            <form class="sam-auth-card" id="sam-login-form">
                <h1>Smart Attendance</h1>
                <p>Sign in with your administrator account to manage attendance.</p>

                <label for="sam-login-email">Admin Email</label>
                <input
                    id="sam-login-email"
                    type="email"
                    autocomplete="username"
                    placeholder="Enter admin email"
                    required
                >

                <label for="sam-login-password">Password</label>
                <input
                    id="sam-login-password"
                    type="password"
                    autocomplete="current-password"
                    placeholder="Enter password"
                    required
                >

                <button id="sam-login-button" type="submit">Sign In</button>
                <div id="sam-auth-message" role="status" aria-live="polite"></div>
            </form>
        `;

        document.body.appendChild(overlay);

        const loading = document.createElement("div");
        loading.id = "sam-app-loading";
        loading.textContent = "Connecting to your attendance database...";
        document.body.appendChild(loading);

        const logoutButton = document.createElement("button");
        logoutButton.id = "sam-logout-btn";
        logoutButton.type = "button";
        logoutButton.textContent = "Log out";

        const nav = document.querySelector(".sidebar-nav");
        if (nav) nav.appendChild(logoutButton);

        $("sam-login-form").addEventListener("submit", signIn);
        logoutButton.addEventListener("click", signOut);

        return { overlay, loading, logoutButton };
    }

    const authUI = createAuthUI();

    async function signIn(event) {
        event.preventDefault();

        const email = $("sam-login-email").value.trim();
        const password = $("sam-login-password").value;
        const button = $("sam-login-button");
        const message = $("sam-auth-message");

        button.disabled = true;
        button.textContent = "Signing in...";
        showMessage(message, "Checking your credentials...", "info");

        try {
            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) throw error;

            currentUser = data.user;
            await loadAllData();

            authUI.overlay.style.display = "none";
            authUI.loading.style.display = "none";
            document.querySelector(".app").style.visibility = "visible";
        } catch (error) {
            showMessage(
                message,
                showError(error, "Sign-in failed"),
                "error"
            );
        } finally {
            button.disabled = false;
            button.textContent = "Sign In";
        }
    }

    async function signOut() {
        if (!confirm("Are you sure you want to log out?")) return;

        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;

            currentUser = null;
            students = [];
            subjects = [];
            attendanceRecords = [];
            currentAttendance = {};

            authUI.overlay.style.display = "flex";
            authUI.loading.style.display = "none";
            $("sam-login-password").value = "";
            showMessage($("sam-auth-message"), "", "info");
        } catch (error) {
            alert(showError(error, "Could not log out"));
        }
    }

    /* =====================================================
       LOAD DATA FROM SUPABASE
       ===================================================== */

    async function loadAllData() {
        if (!currentUser) return;

        isLoading = true;

        try {
            const [studentResult, subjectResult, attendanceResult] =
                await Promise.all([
                    supabaseClient
                        .from("students")
                        .select("id,name,roll_number,course,semester")
                        .order("id"),

                    supabaseClient
                        .from("subjects")
                        .select("id,name,subject_code")
                        .order("id"),

                    supabaseClient
                        .from("attendance")
                        .select("id,student_id,subject_id,attendance_date,status")
                        .order("attendance_date", { ascending: false })
                ]);

            if (studentResult.error) throw studentResult.error;
            if (subjectResult.error) throw subjectResult.error;
            if (attendanceResult.error) throw attendanceResult.error;

            students = (studentResult.data || []).map(s => ({
                id: String(s.id),
                name: s.name,
                roll: s.roll_number,
                course: s.course || "",
                semester: s.semester || ""
            }));

            subjects = (subjectResult.data || []).map(s => ({
                id: String(s.id),
                name: s.name,
                code: s.subject_code || ""
            }));

            attendanceRecords = (attendanceResult.data || []).map(a => {
                const student = students.find(
                    s => s.id === String(a.student_id)
                );

                const subject = subjects.find(
                    s => s.id === String(a.subject_id)
                );

                return {
                    id: String(a.id),
                    date: a.attendance_date,
                    subject: subject?.name || "Deleted subject",
                    subjectId: String(a.subject_id),
                    studentId: String(a.student_id),
                    studentName: student?.name || "Deleted student",
                    roll: student?.roll || "—",
                    status: a.status
                };
            });

            fillSubjectDropdowns();
            fillReportStudentDropdown();
            renderStudents();
            renderSubjects();
            renderAttendance();
            renderDashboard();
            generateReport();
        } catch (error) {
            alert(showError(
                error,
                "Could not load database records. Check your Supabase tables and RLS policies"
            ));
            throw error;
        } finally {
            isLoading = false;
        }
    }

    /* =====================================================
       NAVIGATION
       ===================================================== */

    document.querySelectorAll(".nav-link[data-section]").forEach(link => {
        link.addEventListener("click", () => {
            const sectionName = link.dataset.section;

            document.querySelectorAll(".nav-link").forEach(item => {
                item.classList.remove("active");
            });

            document.querySelectorAll(".page-section").forEach(section => {
                section.classList.remove("active-section");
            });

            link.classList.add("active");

            const section = $(sectionName);
            if (section) section.classList.add("active-section");

            if (sectionName === "dashboard") renderDashboard();
            if (sectionName === "attendance") renderAttendance();
            if (sectionName === "reports") generateReport();
        });
    });

    /* =====================================================
       STUDENTS
       ===================================================== */

    function renderStudents() {
        const body = $("studentTableBody");
        if (!body) return;

        const search = ($("studentSearch")?.value || "").toLowerCase();

        const filtered = students.filter(s =>
            [s.name, s.roll, s.course, s.semester]
                .some(value => String(value).toLowerCase().includes(search))
        );

        if (!filtered.length) {
            body.innerHTML = `
                <tr><td colspan="5" class="empty-state">
                    ${students.length ? "No matching students found." : "No students added yet."}
                </td></tr>`;
            return;
        }

        body.innerHTML = filtered.map(s => `
            <tr>
                <td>${escapeHTML(s.roll)}</td>
                <td>${escapeHTML(s.name)}</td>
                <td>${escapeHTML(s.course)}</td>
                <td>${escapeHTML(s.semester)}</td>
                <td>
                    <button type="button" class="primary-btn sam-edit-student"
                        data-id="${escapeHTML(s.id)}">Edit</button>
                    <button type="button" class="secondary-btn sam-delete-student"
                        data-id="${escapeHTML(s.id)}">Delete</button>
                </td>
            </tr>
        `).join("");
    }

    $("studentSearch")?.addEventListener("input", renderStudents);

    $("studentForm")?.addEventListener("submit", async event => {
        event.preventDefault();

        if (isLoading) return;

        const editId = $("editStudentId").value;
        const payload = {
            name: $("studentName").value.trim(),
            roll_number: $("rollNumber").value.trim(),
            course: $("course").value,
            semester: $("semester").value
        };

        if (!payload.name || !payload.roll_number ||
            !payload.course || !payload.semester) {
            showMessage($("studentFormMessage"), "Please complete all student fields.");
            return;
        }

        const duplicate = students.some(s =>
            s.roll.toLowerCase() === payload.roll_number.toLowerCase() &&
            s.id !== String(editId)
        );

        if (duplicate) {
            showMessage($("studentFormMessage"), "This roll number already exists.");
            return;
        }

        isLoading = true;

        try {
            let result;

            if (editId) {
                result = await supabaseClient
                    .from("students")
                    .update(payload)
                    .eq("id", Number(editId));
            } else {
                result = await supabaseClient
                    .from("students")
                    .insert(payload);
            }

            if (result.error) throw result.error;

            $("studentForm").reset();
            $("editStudentId").value = "";
            $("studentFormTitle").textContent = "Add New Student";
            $("studentSubmitBtn").textContent = "Add Student";
            $("cancelEditBtn").style.display = "none";

            showMessage(
                $("studentFormMessage"),
                editId ? "Student updated successfully." : "Student added successfully.",
                "success"
            );

            await loadAllData();
        } catch (error) {
            showMessage(
                $("studentFormMessage"),
                showError(error, "Could not save student")
            );
        } finally {
            isLoading = false;
        }
    });

    $("cancelEditBtn")?.addEventListener("click", () => {
        $("studentForm").reset();
        $("editStudentId").value = "";
        $("studentFormTitle").textContent = "Add New Student";
        $("studentSubmitBtn").textContent = "Add Student";
        $("cancelEditBtn").style.display = "none";
        showMessage($("studentFormMessage"), "");
    });

    $("studentTableBody")?.addEventListener("click", async event => {
        const editButton = event.target.closest(".sam-edit-student");
        const deleteButton = event.target.closest(".sam-delete-student");

        if (editButton) {
            const student = students.find(
                s => s.id === editButton.dataset.id
            );

            if (!student) return;

            $("editStudentId").value = student.id;
            $("studentName").value = student.name;
            $("rollNumber").value = student.roll;
            $("course").value = student.course;
            $("semester").value = student.semester;
            $("studentFormTitle").textContent = "Edit Student";
            $("studentSubmitBtn").textContent = "Update Student";
            $("cancelEditBtn").style.display = "inline-block";

            $("studentForm").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

        if (deleteButton) {
            const student = students.find(
                s => s.id === deleteButton.dataset.id
            );

            if (!student) return;

            if (!confirm(
                `Delete ${student.name}? Their related attendance records may also be deleted.`
            )) return;

            try {
                const { error } = await supabaseClient
                    .from("students")
                    .delete()
                    .eq("id", Number(student.id));

                if (error) throw error;

                await loadAllData();
                showMessage(
                    $("studentFormMessage"),
                    "Student deleted successfully.",
                    "success"
                );
            } catch (error) {
                alert(showError(error, "Could not delete student"));
            }
        }
    });

    /* =====================================================
       SUBJECTS
       ===================================================== */

    function renderSubjects() {
        const body = $("subjectTableBody");
        if (!body) return;

        const search = ($("subjectSearch")?.value || "").toLowerCase();

        const filtered = subjects.filter(s =>
            [s.name, s.code].some(value =>
                String(value).toLowerCase().includes(search)
            )
        );

        if (!filtered.length) {
            body.innerHTML = `
                <tr><td colspan="3" class="empty-state">
                    ${subjects.length ? "No matching subjects found." : "No subjects added yet."}
                </td></tr>`;
            return;
        }

        body.innerHTML = filtered.map(s => `
            <tr>
                <td>${escapeHTML(s.code)}</td>
                <td>${escapeHTML(s.name)}</td>
                <td>
                    <button type="button" class="secondary-btn sam-delete-subject"
                        data-id="${escapeHTML(s.id)}">Delete</button>
                </td>
            </tr>
        `).join("");
    }

    $("subjectSearch")?.addEventListener("input", renderSubjects);

    $("subjectForm")?.addEventListener("submit", async event => {
        event.preventDefault();

        const name = $("subjectName").value.trim();
        const code = $("subjectCode").value.trim();

        if (!name || !code) {
            showMessage($("subjectMessage"), "Please enter the subject name and code.");
            return;
        }

        try {
            const { error } = await supabaseClient
                .from("subjects")
                .insert({
                    name,
                    subject_code: code
                });

            if (error) throw error;

            $("subjectForm").reset();

            showMessage(
                $("subjectMessage"),
                "Subject added successfully.",
                "success"
            );

            await loadAllData();
        } catch (error) {
            showMessage(
                $("subjectMessage"),
                showError(error, "Could not add subject")
            );
        }
    });

    $("subjectTableBody")?.addEventListener("click", async event => {
        const button = event.target.closest(".sam-delete-subject");
        if (!button) return;

        const subject = subjects.find(s => s.id === button.dataset.id);
        if (!subject) return;

        if (!confirm(
            `Delete ${subject.name}? Related attendance records may also be deleted.`
        )) return;

        try {
            const { error } = await supabaseClient
                .from("subjects")
                .delete()
                .eq("id", Number(subject.id));

            if (error) throw error;

            await loadAllData();

            showMessage(
                $("subjectMessage"),
                "Subject deleted successfully.",
                "success"
            );
        } catch (error) {
            alert(showError(error, "Could not delete subject"));
        }
    });

    function fillSubjectDropdowns() {
        const attendanceSelect = $("attendanceSubject");
        const reportSelect = $("reportSubject");

        if (attendanceSelect) {
            const selected = attendanceSelect.value;

            attendanceSelect.innerHTML =
                `<option value="">Select subject</option>` +
                subjects.map(s => `
                    <option value="${escapeHTML(s.id)}">
                        ${escapeHTML(s.name)} (${escapeHTML(s.code)})
                    </option>
                `).join("");

            if (subjects.some(s => s.id === selected)) {
                attendanceSelect.value = selected;
            }
        }

        if (reportSelect) {
            const selected = reportSelect.value || "all";

            reportSelect.innerHTML =
                `<option value="all">All Subjects</option>` +
                subjects.map(s => `
                    <option value="${escapeHTML(s.id)}">
                        ${escapeHTML(s.name)}
                    </option>
                `).join("");

            reportSelect.value = subjects.some(s => s.id === selected)
                ? selected : "all";
        }
    }

    /* =====================================================
       ATTENDANCE
       ===================================================== */

    function fillReportStudentDropdown() {
        const select = $("reportStudent");
        if (!select) return;

        const selected = select.value || "all";

        select.innerHTML =
            `<option value="all">All Students</option>` +
            students.map(s => `
                <option value="${escapeHTML(s.id)}">
                    ${escapeHTML(s.roll)} - ${escapeHTML(s.name)}
                </option>
            `).join("");

        select.value = students.some(s => s.id === selected)
            ? selected : "all";
    }

    async function loadAttendanceForSelection() {
        const date = $("attendanceDate")?.value || today();
        const subjectId = $("attendanceSubject")?.value || "";

        currentAttendance = {};

        if (!subjectId) {
            renderAttendance();
            return;
        }

        attendanceRecords
            .filter(r => r.date === date && r.subjectId === subjectId)
            .forEach(r => {
                currentAttendance[r.studentId] = r.status;
            });

        renderAttendance();
    }

    function renderAttendance() {
        const body = $("attendanceTableBody");
        if (!body) return;

        const date = $("attendanceDate")?.value || today();
        const subjectId = $("attendanceSubject")?.value || "";

        if (!students.length) {
            body.innerHTML = `
                <tr><td colspan="4" class="empty-state">
                    Add students first to mark attendance.
                </td></tr>`;
            updateAttendanceCounts();
            return;
        }

        if (!subjectId) {
            body.innerHTML = `
                <tr><td colspan="4" class="empty-state">
                    Please select a subject first.
                </td></tr>`;
            updateAttendanceCounts();
            return;
        }

        body.innerHTML = students.map(s => {
            const status = currentAttendance[s.id] || "";

            return `
                <tr>
                    <td>${escapeHTML(s.roll)}</td>
                    <td>${escapeHTML(s.name)}</td>
                    <td>${escapeHTML(s.course)}</td>
                    <td>
                        <button type="button"
                            class="primary-btn sam-mark-present"
                            data-id="${escapeHTML(s.id)}"
                            aria-pressed="${status === "Present"}"
                            style="${status === "Present" ? "outline:3px solid #16a34a;" : ""}">
                            Present
                        </button>

                        <button type="button"
                            class="secondary-btn sam-mark-absent"
                            data-id="${escapeHTML(s.id)}"
                            aria-pressed="${status === "Absent"}"
                            style="${status === "Absent" ? "outline:3px solid #dc2626;" : ""}">
                            Absent
                        </button>

                        <span style="margin-left:6px;font-size:12px;">
                            ${escapeHTML(status)}
                        </span>
                    </td>
                </tr>
            `;
        }).join("");

        updateAttendanceCounts();
    }

    function updateAttendanceCounts() {
        const values = Object.values(currentAttendance);

        if ($("presentCount")) {
            $("presentCount").textContent =
                values.filter(s => s === "Present").length;
        }

        if ($("absentCount")) {
            $("absentCount").textContent =
                values.filter(s => s === "Absent").length;
        }
    }

    $("attendanceDate")?.addEventListener("change", loadAttendanceForSelection);
    $("attendanceSubject")?.addEventListener("change", loadAttendanceForSelection);

    $("attendanceTableBody")?.addEventListener("click", event => {
        const present = event.target.closest(".sam-mark-present");
        const absent = event.target.closest(".sam-mark-absent");

        if (!present && !absent) return;

        const button = present || absent;
        const studentId = button.dataset.id;

        currentAttendance[studentId] = present ? "Present" : "Absent";

        renderAttendance();
        showMessage($("attendanceMessage"), "");
    });

    $("saveAttendanceBtn")?.addEventListener("click", async () => {
        const date = $("attendanceDate")?.value || today();
        const subjectId = $("attendanceSubject")?.value || "";

        if (!students.length) {
            showMessage($("attendanceMessage"), "Add students before saving attendance.");
            return;
        }

        if (!subjectId) {
            showMessage($("attendanceMessage"), "Please select a subject.");
            return;
        }

        const missing = students.filter(s => !currentAttendance[s.id]);

        if (missing.length) {
            showMessage(
                $("attendanceMessage"),
                `Please mark attendance for every student. ${missing.length} student(s) remain unmarked.`
            );
            return;
        }

        const rows = students.map(s => ({
            student_id: Number(s.id),
            subject_id: Number(subjectId),
            attendance_date: date,
            status: currentAttendance[s.id]
        }));

        const button = $("saveAttendanceBtn");
        button.disabled = true;
        button.textContent = "Saving...";

        try {
            const { error } = await supabaseClient
                .from("attendance")
                .upsert(rows, {
                    onConflict: "student_id,subject_id,attendance_date"
                });

            if (error) throw error;

            showMessage(
                $("attendanceMessage"),
                "Attendance saved successfully!",
                "success"
            );

            await loadAllData();
            await loadAttendanceForSelection();
        } catch (error) {
            showMessage(
                $("attendanceMessage"),
                showError(error, "Could not save attendance")
            );
        } finally {
            button.disabled = false;
            button.textContent = "Save Attendance";
        }
    });

    /* =====================================================
       DASHBOARD
       ===================================================== */

    function renderDashboard() {
        const todayRecords = attendanceRecords.filter(r => r.date === today());
        const present = todayRecords.filter(r => r.status === "Present").length;
        const absent = todayRecords.filter(r => r.status === "Absent").length;
        const total = todayRecords.length;
        const rate = total ? Math.round((present / total) * 100) : 0;

        if ($("totalStudents")) $("totalStudents").textContent = students.length;
        if ($("presentToday")) $("presentToday").textContent = present;
        if ($("absentToday")) $("absentToday").textContent = absent;
        if ($("attendanceRate")) $("attendanceRate").textContent = `${rate}%`;

        const body = $("recentAttendance");
        if (!body) return;

        const recent = [...attendanceRecords]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 10);

        if (!recent.length) {
            body.innerHTML = `
                <tr><td colspan="4" class="empty-state">
                    No attendance records available
                </td></tr>`;
            return;
        }

        body.innerHTML = recent.map(r => `
            <tr>
                <td>${escapeHTML(r.studentName)}</td>
                <td>${escapeHTML(r.subject)}</td>
                <td>${formatDate(r.date)}</td>
                <td>${escapeHTML(r.status)}</td>
            </tr>
        `).join("");
    }

    /* =====================================================
       REPORTS
       ===================================================== */

    function generateReport() {
        const body = $("reportTableBody");
        if (!body) return;

        const studentId = $("reportStudent")?.value || "all";
        const subjectId = $("reportSubject")?.value || "all";

        const filtered = attendanceRecords.filter(r =>
            (studentId === "all" || r.studentId === studentId) &&
            (subjectId === "all" || r.subjectId === subjectId)
        );

        const present = filtered.filter(r => r.status === "Present").length;
        const absent = filtered.filter(r => r.status === "Absent").length;
        const rate = filtered.length
            ? Math.round((present / filtered.length) * 100)
            : 0;

        if ($("reportTotalClasses")) {
            $("reportTotalClasses").textContent = filtered.length;
        }

        if ($("reportPresent")) $("reportPresent").textContent = present;
        if ($("reportAbsent")) $("reportAbsent").textContent = absent;

        if ($("reportPercentage")) {
            $("reportPercentage").textContent = `${rate}%`;
        }

        if (!filtered.length) {
            body.innerHTML = `
                <tr><td colspan="5" class="empty-state">
                    No attendance records available
                </td></tr>`;
            return;
        }

        body.innerHTML = filtered
            .sort((a, b) => b.date.localeCompare(a.date))
            .map(r => `
                <tr>
                    <td>${escapeHTML(r.roll)}</td>
                    <td>${escapeHTML(r.studentName)}</td>
                    <td>${escapeHTML(r.subject)}</td>
                    <td>${formatDate(r.date)}</td>
                    <td>${escapeHTML(r.status)}</td>
                </tr>
            `).join("");
    }

    $("generateReportBtn")?.addEventListener("click", generateReport);
    $("reportStudent")?.addEventListener("change", generateReport);
    $("reportSubject")?.addEventListener("change", generateReport);

    /* =====================================================
       AUTHENTICATION INITIALIZATION
       ===================================================== */

    async function initializeApp() {
        document.querySelector(".app").style.visibility = "hidden";

        if ($("attendanceDate") && !$("attendanceDate").value) {
            $("attendanceDate").value = today();
        }

        try {
            const { data, error } = await supabaseClient.auth.getSession();
            if (error) throw error;

            if (data.session?.user) {
                currentUser = data.session.user;
                await loadAllData();

                authUI.overlay.style.display = "none";
                authUI.loading.style.display = "none";
                document.querySelector(".app").style.visibility = "visible";
            } else {
                authUI.loading.style.display = "none";
                authUI.overlay.style.display = "flex";
            }
        } catch (error) {
            authUI.loading.style.display = "none";
            authUI.overlay.style.display = "flex";

            showMessage(
                $("sam-auth-message"),
                showError(error, "Could not connect to Supabase")
            );
        }
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT") {
            currentUser = null;
            authUI.overlay.style.display = "flex";
            authUI.loading.style.display = "none";
            document.querySelector(".app").style.visibility = "hidden";
        }
    });

    initializeApp();
})();
