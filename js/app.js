/* =====================================================
   SMART ATTENDANCE MANAGEMENT SYSTEM
===================================================== */


/* =====================================================
   NAVIGATION
===================================================== */

const navLinks = document.querySelectorAll(".nav-link");

const pageSections =
    document.querySelectorAll(".page-section");


navLinks.forEach(function (link) {

    link.addEventListener("click", function () {

        const sectionName =
            this.dataset.section;


        navLinks.forEach(function (navLink) {

            navLink.classList.remove("active");

        });


        this.classList.add("active");


        pageSections.forEach(function (section) {

            section.classList.remove(
                "active-section"
            );

        });


        const selectedSection =
            document.getElementById(sectionName);


        if (selectedSection) {

            selectedSection.classList.add(
                "active-section"
            );

        }


        /* Refresh attendance list when opening page */

        if (sectionName === "attendance") {

            displayAttendanceStudents();

        }


        /* Refresh dashboard when opening page */

        if (sectionName === "dashboard") {

            updateDashboard();

        }

    });

});


/* =====================================================
   STUDENT DATA
===================================================== */

let students =
    JSON.parse(
        localStorage.getItem(
            "smartAttendanceStudents"
        )
    ) || [];


/* =====================================================
   ATTENDANCE DATA
===================================================== */

let attendanceRecords =
    JSON.parse(
        localStorage.getItem(
            "smartAttendanceRecords"
        )
    ) || [];


/* =====================================================
   STUDENT ELEMENTS
===================================================== */

const studentForm =
    document.getElementById("studentForm");

const studentName =
    document.getElementById("studentName");

const rollNumber =
    document.getElementById("rollNumber");

const course =
    document.getElementById("course");

const semester =
    document.getElementById("semester");

const editStudentId =
    document.getElementById("editStudentId");

const studentTableBody =
    document.getElementById("studentTableBody");

const studentSearch =
    document.getElementById("studentSearch");

const studentSubmitBtn =
    document.getElementById("studentSubmitBtn");

const cancelEditBtn =
    document.getElementById("cancelEditBtn");

const studentFormTitle =
    document.getElementById("studentFormTitle");

const studentFormMessage =
    document.getElementById("studentFormMessage");


/* =====================================================
   ATTENDANCE ELEMENTS
===================================================== */

const attendanceDate =
    document.getElementById("attendanceDate");

const attendanceSubject =
    document.getElementById(
        "attendanceSubject"
    );

const attendanceTableBody =
    document.getElementById(
        "attendanceTableBody"
    );

const presentCount =
    document.getElementById(
        "presentCount"
    );

const absentCount =
    document.getElementById(
        "absentCount"
    );

const saveAttendanceBtn =
    document.getElementById(
        "saveAttendanceBtn"
    );

const attendanceMessage =
    document.getElementById(
        "attendanceMessage"
    );


/* =====================================================
   SET TODAY'S DATE
===================================================== */

function setTodayDate() {

    if (!attendanceDate) {

        return;

    }


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    attendanceDate.value =
        `${year}-${month}-${day}`;

}


/* =====================================================
   SAVE STUDENTS
===================================================== */

function saveStudents() {

    localStorage.setItem(
        "smartAttendanceStudents",
        JSON.stringify(students)
    );

}


/* =====================================================
   SAVE ATTENDANCE
===================================================== */

function saveAttendanceRecords() {

    localStorage.setItem(
        "smartAttendanceRecords",
        JSON.stringify(
            attendanceRecords
        )
    );

}


/* =====================================================
   DISPLAY STUDENTS
===================================================== */

function displayStudents(
    searchTerm = ""
) {

    if (!studentTableBody) {

        return;

    }


    studentTableBody.innerHTML = "";


    const search =
        searchTerm.toLowerCase();


    const filteredStudents =
        students.filter(function (student) {

            return (

                student.name
                    .toLowerCase()
                    .includes(search)

                ||

                student.roll
                    .toLowerCase()
                    .includes(search)

                ||

                student.course
                    .toLowerCase()
                    .includes(search)

            );

        });


    if (filteredStudents.length === 0) {

        studentTableBody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty-state"
                >
                    ${
                        students.length === 0
                        ? "No students added yet"
                        : "No matching students found"
                    }
                </td>

            </tr>

        `;

        return;

    }


    filteredStudents.forEach(
        function (student) {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>

                    <span class="roll-number">
                        ${student.roll}
                    </span>

                </td>


                <td>

                    <span class="student-table-name">
                        ${student.name}
                    </span>

                </td>


                <td>

                    <span class="course-badge">
                        ${student.course}
                    </span>

                </td>


                <td>
                    ${student.semester} Semester
                </td>


                <td>

                    <div class="action-buttons">

                        <button
                            class="edit-btn"
                            onclick="editStudent('${student.id}')"
                        >
                            Edit
                        </button>

                        <button
                            class="delete-btn"
                            onclick="deleteStudent('${student.id}')"
                        >
                            Delete
                        </button>

                    </div>

                </td>

            `;


            studentTableBody.appendChild(row);

        }
    );

}


/* =====================================================
   ADD / UPDATE STUDENT
===================================================== */

if (studentForm) {

    studentForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const name =
                studentName.value.trim();

            const roll =
                rollNumber.value.trim();

            const selectedCourse =
                course.value;

            const selectedSemester =
                semester.value;


            if (
                !name ||
                !roll ||
                !selectedCourse ||
                !selectedSemester
            ) {

                showFormMessage(
                    "Please fill in all fields.",
                    "error"
                );

                return;

            }


            const duplicate =
                students.find(
                    function (student) {

                        return (

                            student.roll
                                .toLowerCase() ===
                            roll.toLowerCase()

                            &&

                            student.id !==
                            editStudentId.value

                        );

                    }
                );


            if (duplicate) {

                showFormMessage(
                    "This roll number already exists.",
                    "error"
                );

                return;

            }


            if (editStudentId.value) {

                const student =
                    students.find(
                        function (item) {

                            return (
                                item.id ===
                                editStudentId.value
                            );

                        }
                    );


                if (student) {

                    student.name =
                        name;

                    student.roll =
                        roll;

                    student.course =
                        selectedCourse;

                    student.semester =
                        selectedSemester;

                }


                showFormMessage(
                    "Student updated successfully.",
                    "success"
                );

            }

            else {

                const newStudent = {

                    id:
                        Date.now().toString(),

                    name:
                        name,

                    roll:
                        roll,

                    course:
                        selectedCourse,

                    semester:
                        selectedSemester

                };


                students.push(
                    newStudent
                );


                showFormMessage(
                    "Student added successfully.",
                    "success"
                );

            }


            saveStudents();

            displayStudents();

            updateDashboard();

            displayAttendanceStudents();
            updateReportFilters();
            resetStudentForm();

        }
    );

}


/* =====================================================
   EDIT STUDENT
===================================================== */

function editStudent(id) {

    const student =
        students.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!student) {

        return;

    }


    studentName.value =
        student.name;

    rollNumber.value =
        student.roll;

    course.value =
        student.course;

    semester.value =
        student.semester;

    editStudentId.value =
        student.id;


    studentFormTitle.textContent =
        "Edit Student";

    studentSubmitBtn.textContent =
        "Update Student";

    cancelEditBtn.style.display =
        "inline-block";


    studentFormMessage.textContent =
        "";


    studentForm.scrollIntoView({

        behavior: "smooth",

        block: "start"

    });

}


/* =====================================================
   DELETE STUDENT
===================================================== */

function deleteStudent(id) {

    const student =
        students.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!student) {

        return;

    }


    const confirmed =
        confirm(
            `Delete ${student.name} from student records?`
        );


    if (!confirmed) {

        return;

    }


    students =
        students.filter(
            function (item) {

                return item.id !== id;

            }
        );


    saveStudents();

    displayStudents();

    updateDashboard();

    displayAttendanceStudents();


    showFormMessage(
        "Student deleted successfully.",
        "success"
    );

}


/* =====================================================
   CANCEL EDIT
===================================================== */

if (cancelEditBtn) {

    cancelEditBtn.addEventListener(
        "click",
        function () {

            resetStudentForm();

            studentFormMessage.textContent =
                "";

        }
    );

}


/* =====================================================
   RESET STUDENT FORM
===================================================== */

function resetStudentForm() {

    if (!studentForm) {

        return;

    }


    studentForm.reset();

    editStudentId.value = "";


    studentFormTitle.textContent =
        "Add New Student";

    studentSubmitBtn.textContent =
        "Add Student";

    cancelEditBtn.style.display =
        "none";

}


/* =====================================================
   FORM MESSAGE
===================================================== */

function showFormMessage(
    message,
    type
) {

    if (!studentFormMessage) {

        return;

    }


    studentFormMessage.textContent =
        message;

    studentFormMessage.className =
        "form-message " + type;


    setTimeout(function () {

        studentFormMessage.textContent =
            "";

        studentFormMessage.className =
            "form-message";

    }, 3000);

}


/* =====================================================
   SEARCH STUDENTS
===================================================== */

if (studentSearch) {

    studentSearch.addEventListener(
        "input",
        function () {

            displayStudents(
                this.value
            );

        }
    );

}


/* =====================================================
   ATTENDANCE STATUS
===================================================== */

let currentAttendance = {};


/* =====================================================
   DISPLAY ATTENDANCE STUDENTS
===================================================== */

function displayAttendanceStudents() {

    if (!attendanceTableBody) {

        return;

    }


    attendanceTableBody.innerHTML = "";


    if (students.length === 0) {

        attendanceTableBody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="empty-state"
                >
                    Add students first to mark attendance.
                </td>

            </tr>

        `;

        updateAttendanceSummary();

        return;

    }


    students.forEach(
        function (student) {

            const existingStatus =
                currentAttendance[
                    student.id
                ] || "";


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>

                    <span class="roll-number">
                        ${student.roll}
                    </span>

                </td>


                <td>

                    <span class="student-table-name">
                        ${student.name}
                    </span>

                </td>


                <td>

                    <span class="course-badge">
                        ${student.course}
                    </span>

                </td>


                <td>

                    <div class="attendance-buttons">

                        <button
                            type="button"
                            class="attendance-btn present-btn
                            ${
                                existingStatus === "Present"
                                ? "selected"
                                : ""
                            }"
                            onclick="setAttendance(
                                '${student.id}',
                                'Present'
                            )"
                        >
                            Present
                        </button>


                        <button
                            type="button"
                            class="attendance-btn absent-btn
                            ${
                                existingStatus === "Absent"
                                ? "selected"
                                : ""
                            }"
                            onclick="setAttendance(
                                '${student.id}',
                                'Absent'
                            )"
                        >
                            Absent
                        </button>

                    </div>

                </td>

            `;


            attendanceTableBody.appendChild(
                row
            );

        }
    );


    updateAttendanceSummary();

}


/* =====================================================
   SET ATTENDANCE
===================================================== */

function setAttendance(
    studentId,
    status
) {

    currentAttendance[
        studentId
    ] = status;


    displayAttendanceStudents();

}


/* =====================================================
   ATTENDANCE SUMMARY
===================================================== */

function updateAttendanceSummary() {

    if (!presentCount || !absentCount) {

        return;

    }


    let present = 0;

    let absent = 0;


    Object.values(
        currentAttendance
    ).forEach(function (status) {

        if (status === "Present") {

            present++;

        }

        if (status === "Absent") {

            absent++;

        }

    });


    presentCount.textContent =
        present;

    absentCount.textContent =
        absent;

}


/* =====================================================
   SAVE ATTENDANCE
===================================================== */

if (saveAttendanceBtn) {

    saveAttendanceBtn.addEventListener(
        "click",
        function () {

            const date =
                attendanceDate.value;

            const subject =
                attendanceSubject.value;


            if (!date) {

                showAttendanceMessage(
                    "Please select a date.",
                    "error"
                );

                return;

            }


            if (!subject) {

                showAttendanceMessage(
                    "Please select a subject.",
                    "error"
                );

                return;

            }


            if (
                Object.keys(
                    currentAttendance
                ).length !== students.length
            ) {

                showAttendanceMessage(
                    "Please mark attendance for every student.",
                    "error"
                );

                return;

            }


            /* Remove existing record
               for same date and subject */

            attendanceRecords =
                attendanceRecords.filter(
                    function (record) {

                        return !(
                            record.date === date
                            &&
                            record.subject === subject
                        );

                    }
                );


            /* Create attendance record */

            students.forEach(
                function (student) {

                    attendanceRecords.push({

                        id:
                            Date.now().toString()
                            +
                            student.id,

                        date:
                            date,

                        subject:
                            subject,

                        studentId:
                            student.id,

                        studentName:
                            student.name,

                        roll:
                            student.roll,

                        status:
                            currentAttendance[
                                student.id
                            ]

                    });

                }
            );


            saveAttendanceRecords();


            showAttendanceMessage(
                "Attendance saved successfully.",
                "success"
            );


            updateDashboard();


            displayRecentAttendance();

        }
    );

}


/* =====================================================
   ATTENDANCE MESSAGE
===================================================== */

function showAttendanceMessage(
    message,
    type
) {

    if (!attendanceMessage) {

        return;

    }


    attendanceMessage.textContent =
        message;

    attendanceMessage.className =
        "form-message " + type;


    setTimeout(function () {

        attendanceMessage.textContent =
            "";

        attendanceMessage.className =
            "form-message";

    }, 3000);

}


/* =====================================================
   DASHBOARD
===================================================== */

function updateDashboard() {

    const totalStudents =
        document.getElementById(
            "totalStudents"
        );

    const presentToday =
        document.getElementById(
            "presentToday"
        );

    const absentToday =
        document.getElementById(
            "absentToday"
        );

    const attendanceRate =
        document.getElementById(
            "attendanceRate"
        );


    if (!totalStudents) {

        return;

    }


    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    const todayRecords =
        attendanceRecords.filter(
            function (record) {

                return record.date === today;

            }
        );


    const present =
        todayRecords.filter(
            function (record) {

                return record.status === "Present";

            }
        ).length;


    const absent =
        todayRecords.filter(
            function (record) {

                return record.status === "Absent";

            }
        ).length;


    const total =
        present + absent;


    const rate =
        total > 0
        ? Math.round(
            (present / total) * 100
        )
        : 0;


    totalStudents.textContent =
        students.length;

    presentToday.textContent =
        present;

    absentToday.textContent =
        absent;

    attendanceRate.textContent =
        rate + "%";


    displayRecentAttendance();

}


/* =====================================================
   RECENT ATTENDANCE
===================================================== */

function displayRecentAttendance() {

    const recentAttendance =
        document.getElementById(
            "recentAttendance"
        );


    if (!recentAttendance) {

        return;

    }


    recentAttendance.innerHTML = "";


    const recentRecords =
        attendanceRecords
            .slice()
            .reverse()
            .slice(0, 8);


    if (recentRecords.length === 0) {

        recentAttendance.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="empty-state"
                >
                    No attendance records available
                </td>

            </tr>

        `;

        return;

    }


    recentRecords.forEach(
        function (record) {

            const row =
                document.createElement("tr");


            const statusClass =
                record.status === "Present"
                ? "status-present"
                : "status-absent";


            row.innerHTML = `

                <td>
                    ${record.studentName}
                </td>

                <td>
                    ${record.subject}
                </td>

                <td>
                    ${record.date}
                </td>

                <td>

                    <span class="${statusClass}">
                        ${record.status}
                    </span>

                </td>

            `;


            recentAttendance.appendChild(
                row
            );

        }
    );

}


/* =====================================================
   INITIALIZE APPLICATION
===================================================== */

setTodayDate();

displayStudents();

displayAttendanceStudents();

updateDashboard();


console.log(
    "Smart Attendance System initialized successfully."
);
/* =====================================================
   SUBJECT MANAGEMENT
===================================================== */


/* Load subjects */

let subjects =
    JSON.parse(
        localStorage.getItem(
            "smartAttendanceSubjects"
        )
    ) || [];


/* Subject elements */

const subjectForm =
    document.getElementById(
        "subjectForm"
    );

const subjectName =
    document.getElementById(
        "subjectName"
    );

const subjectCode =
    document.getElementById(
        "subjectCode"
    );

const subjectTableBody =
    document.getElementById(
        "subjectTableBody"
    );

const subjectSearch =
    document.getElementById(
        "subjectSearch"
    );

const subjectMessage =
    document.getElementById(
        "subjectMessage"
    );


/* =====================================================
   SAVE SUBJECTS
===================================================== */

function saveSubjects() {

    localStorage.setItem(
        "smartAttendanceSubjects",
        JSON.stringify(subjects)
    );

}


/* =====================================================
   DISPLAY SUBJECTS
===================================================== */

function displaySubjects(
    searchTerm = ""
) {

    if (!subjectTableBody) {
        return;
    }


    subjectTableBody.innerHTML = "";


    const search =
        searchTerm.toLowerCase();


    const filteredSubjects =
        subjects.filter(
            function (subject) {

                return (

                    subject.name
                        .toLowerCase()
                        .includes(search)

                    ||

                    subject.code
                        .toLowerCase()
                        .includes(search)

                );

            }
        );


    if (filteredSubjects.length === 0) {

        subjectTableBody.innerHTML = `

            <tr>

                <td
                    colspan="3"
                    class="empty-state"
                >
                    ${
                        subjects.length === 0
                        ? "No subjects added yet"
                        : "No matching subjects found"
                    }
                </td>

            </tr>

        `;

        return;

    }


    filteredSubjects.forEach(
        function (subject) {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>

                    <span class="subject-code">
                        ${subject.code}
                    </span>

                </td>


                <td>

                    <span class="subject-name">
                        ${subject.name}
                    </span>

                </td>


                <td>

                    <button
                        class="subject-delete-btn"
                        onclick="deleteSubject('${subject.id}')"
                    >
                        Delete
                    </button>

                </td>

            `;


            subjectTableBody.appendChild(
                row
            );

        }
    );

}


/* =====================================================
   ADD SUBJECT
===================================================== */

if (subjectForm) {

    subjectForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const name =
                subjectName.value.trim();

            const code =
                subjectCode.value.trim();


            if (!name || !code) {

                showSubjectMessage(
                    "Please fill in all fields.",
                    "error"
                );

                return;

            }


            /* Check duplicate code */

            const duplicate =
                subjects.find(
                    function (subject) {

                        return (
                            subject.code
                                .toLowerCase() ===
                            code.toLowerCase()
                        );

                    }
                );


            if (duplicate) {

                showSubjectMessage(
                    "This subject code already exists.",
                    "error"
                );

                return;

            }


            const newSubject = {

                id:
                    Date.now().toString(),

                name:
                    name,

                code:
                    code.toUpperCase()

            };


            subjects.push(
                newSubject
            );


            saveSubjects();

            displaySubjects();

            updateSubjectDropdown();

updateReportFilters();


            subjectForm.reset();


            showSubjectMessage(
                "Subject added successfully.",
                "success"
            );

        }
    );

}


/* =====================================================
   DELETE SUBJECT
===================================================== */

function deleteSubject(id) {

    const subject =
        subjects.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!subject) {
        return;
    }


    const confirmed =
        confirm(
            `Delete ${subject.name}?`
        );


    if (!confirmed) {
        return;
    }


    subjects =
        subjects.filter(
            function (item) {

                return item.id !== id;

            }
        );


    saveSubjects();

    displaySubjects();

    updateSubjectDropdown();


    showSubjectMessage(
        "Subject deleted successfully.",
        "success"
    );

}


/* =====================================================
   SUBJECT SEARCH
===================================================== */

if (subjectSearch) {

    subjectSearch.addEventListener(
        "input",
        function () {

            displaySubjects(
                this.value
            );

        }
    );

}


/* =====================================================
   SUBJECT MESSAGE
===================================================== */

function showSubjectMessage(
    message,
    type
) {

    if (!subjectMessage) {
        return;
    }


    subjectMessage.textContent =
        message;

    subjectMessage.className =
        "form-message " + type;


    setTimeout(
        function () {

            subjectMessage.textContent =
                "";

            subjectMessage.className =
                "form-message";

        },
        3000
    );

}


/* =====================================================
   UPDATE ATTENDANCE SUBJECT DROPDOWN
===================================================== */

function updateSubjectDropdown() {

    if (!attendanceSubject) {
        return;
    }


    attendanceSubject.innerHTML = `

        <option value="">
            Select subject
        </option>

    `;


    subjects.forEach(
        function (subject) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                subject.name;

            option.textContent =
                `${subject.code} — ${subject.name}`;


            attendanceSubject.appendChild(
                option
            );

        }
    );

}


/* =====================================================
   INITIALIZE SUBJECTS
===================================================== */

displaySubjects();

updateSubjectDropdown();
/* =====================================================
   REPORTS
===================================================== */

const reportStudent =
    document.getElementById("reportStudent");

const reportSubject =
    document.getElementById("reportSubject");

const generateReportBtn =
    document.getElementById("generateReportBtn");

const reportTableBody =
    document.getElementById("reportTableBody");

const reportTotalClasses =
    document.getElementById("reportTotalClasses");

const reportPresent =
    document.getElementById("reportPresent");

const reportAbsent =
    document.getElementById("reportAbsent");

const reportPercentage =
    document.getElementById("reportPercentage");


/* Populate report filters */

function updateReportFilters() {

    if (!reportStudent || !reportSubject) {
        return;
    }


    reportStudent.innerHTML = `
        <option value="all">
            All Students
        </option>
    `;


    students.forEach(function(student) {

        const option =
            document.createElement("option");

        option.value = student.id;

        option.textContent =
            `${student.roll} — ${student.name}`;

        reportStudent.appendChild(option);

    });


    reportSubject.innerHTML = `
        <option value="all">
            All Subjects
        </option>
    `;


    subjects.forEach(function(subject) {

        const option =
            document.createElement("option");

        option.value = subject.name;

        option.textContent =
            `${subject.code} — ${subject.name}`;

        reportSubject.appendChild(option);

    });

}


/* Generate report */

function generateReport() {

    if (!reportTableBody) {
        return;
    }


    const selectedStudent =
        reportStudent.value;

    const selectedSubject =
        reportSubject.value;


    let records =
        attendanceRecords.slice();


    if (selectedStudent !== "all") {

        records =
            records.filter(function(record) {

                return record.studentId ===
                    selectedStudent;

            });

    }


    if (selectedSubject !== "all") {

        records =
            records.filter(function(record) {

                return record.subject ===
                    selectedSubject;

            });

    }


    reportTableBody.innerHTML = "";


    if (records.length === 0) {

        reportTableBody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty-state"
                >
                    No attendance records found
                </td>

            </tr>

        `;

    }
    else {

        records
            .slice()
            .reverse()
            .forEach(function(record) {

                const row =
                    document.createElement("tr");


                const statusClass =
                    record.status === "Present"
                    ? "status-present"
                    : "status-absent";


                row.innerHTML = `

                    <td>
                        ${record.roll}
                    </td>

                    <td>
                        ${record.studentName}
                    </td>

                    <td>
                        ${record.subject}
                    </td>

                    <td>
                        ${record.date}
                    </td>

                    <td>
                        <span class="${statusClass}">
                            ${record.status}
                        </span>
                    </td>

                `;


                reportTableBody.appendChild(row);

            });

    }


    const total =
        records.length;


    const present =
        records.filter(function(record) {

            return record.status === "Present";

        }).length;


    const absent =
        records.filter(function(record) {

            return record.status === "Absent";

        }).length;


    const percentage =
        total > 0
        ? Math.round((present / total) * 100)
        : 0;


    reportTotalClasses.textContent =
        total;

    reportPresent.textContent =
        present;

    reportAbsent.textContent =
        absent;

    reportPercentage.textContent =
        percentage + "%";

}


/* Generate report button */

if (generateReportBtn) {

    generateReportBtn.addEventListener(
        "click",
        generateReport
    );

}


/* Initialize reports */

updateReportFilters();

generateReport();