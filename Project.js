const storageKey = "westbay-staff";

const starterStaff = [
    { name: "Abisola Mofolasayo", email: "abisola.mofolasayo@example.com", role: "Internship", portal: "Active", code: "WB-001" },
    { name: "Adedayo Ademoreti", email: "adedayo.ademoreti@example.com", role: "Service Engineer", portal: "Active", code: "WB-002" },
    { name: "Adegoriye Adesida", email: "adegoriye.adesida@example.com", role: "Business Development Manager", portal: "Awaiting login", code: "WB-003" },
    { name: "Adekunle Aderogba", email: "adekunle.aderogba@example.com", role: "NYSC Corp", portal: "Awaiting login", code: "WB-004" }
];

const tableBody = document.querySelector("#staffTableBody");
const searchInput = document.querySelector("#staffSearchInput");
const emptyMessage = document.querySelector("#staffEmptyMessage");
const message = document.querySelector("#staffMessage");
const dialog = document.querySelector("#staffDialog");
const staffForm = document.querySelector("#staffForm");
const csvInput = document.querySelector("#staffCsvInput");
const dialogTitle = document.querySelector("#staffDialogTitle");
const saveButton = document.querySelector("#saveStaffButton");
let editingEmail = null;

function loadStaff() {
    try {
        const savedStaff = JSON.parse(localStorage.getItem(storageKey));
        return Array.isArray(savedStaff) ? savedStaff : starterStaff;
    } catch {
        return starterStaff;
    }
}

let staffMembers = loadStaff();

function saveStaff() {
    localStorage.setItem(storageKey, JSON.stringify(staffMembers));
}

function initialsFor(name) {
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

function makeCell(className, text) {
    const cell = document.createElement("td");
    if (className) cell.className = className;
    cell.textContent = text;
    return cell;
}

function makeActionButton(action, email) {
    const button = document.createElement("button");
    const svgNamespace = "http://www.w3.org/2000/svg";
    const icon = document.createElementNS(svgNamespace, "svg");
    const path = document.createElementNS(svgNamespace, "path");

    button.type = "button";
    button.className = `staff-row-action is-${action}`;
    button.dataset.action = action;
    button.dataset.email = email;
    button.setAttribute("aria-label", `${action === "edit" ? "Edit" : "Delete"} ${email}`);
    button.title = action === "edit" ? "Edit staff member" : "Delete staff member";
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    icon.append(path);

    if (action === "edit") {
        path.setAttribute("d", "M12 20h9 M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z");
        icon.setAttribute("fill", "none");
        icon.setAttribute("stroke", "currentColor");
        icon.setAttribute("stroke-width", "2");
        icon.setAttribute("stroke-linecap", "round");
        icon.setAttribute("stroke-linejoin", "round");
    } else {
        path.setAttribute("d", "M3 6h18 M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6");
        icon.setAttribute("fill", "none");
        icon.setAttribute("stroke", "currentColor");
        icon.setAttribute("stroke-width", "2");
        icon.setAttribute("stroke-linecap", "round");
        icon.setAttribute("stroke-linejoin", "round");
    }

    button.append(icon);
    return button;
}

function renderStaff() {
    const query = searchInput.value.trim().toLowerCase();
    const filteredStaff = staffMembers.filter((person) =>
        [person.name, person.email, person.role, person.portal]
            .some((value) => String(value || "").toLowerCase().includes(query))
    );

    tableBody.replaceChildren();

    filteredStaff.forEach((person) => {
        const row = document.createElement("tr");
        const nameCell = document.createElement("td");
        const nameBlock = document.createElement("div");
        const avatar = document.createElement("span");
        const nameDetails = document.createElement("span");
        const name = document.createElement("strong");
        const code = document.createElement("small");
        const status = document.createElement("span");
        const actionsCell = document.createElement("td");
        const actions = document.createElement("div");

        nameBlock.className = "staff-name-block";
        avatar.className = "staff-avatar";
        avatar.textContent = initialsFor(person.name);
        nameDetails.className = "staff-name-details";
        name.textContent = person.name;
        code.textContent = person.code || "Westbay staff";
        code.className = "staff-code";
        status.className = `staff-status ${person.portal === "Active" ? "is-active" : "is-pending"}`;
        status.textContent = person.portal;

        nameDetails.append(name, code);
        nameBlock.append(avatar, nameDetails);
        nameCell.append(nameBlock);
        row.append(nameCell, makeCell("staff-email", person.email), makeCell("staff-role", person.role));
        const statusCell = document.createElement("td");
        statusCell.append(status);
        actions.className = "staff-row-actions";
        actions.append(makeActionButton("edit", person.email), makeActionButton("delete", person.email));
        actionsCell.append(actions);
        row.append(statusCell, actionsCell);
        tableBody.append(row);
    });

    emptyMessage.hidden = filteredStaff.length !== 0;
}

function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("is-error", isError);
}

function nextStaffCode() {
    const nextNumber = staffMembers.reduce((highest, person) => {
        const match = String(person.code || "").match(/(\d+)$/);
        return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0) + 1;
    return `WB-${String(nextNumber).padStart(3, "0")}`;
}

function upsertStaff(person) {
    const existingIndex = staffMembers.findIndex((item) => item.email.toLowerCase() === person.email.toLowerCase());
    if (existingIndex >= 0) {
        staffMembers[existingIndex] = { ...staffMembers[existingIndex], ...person };
        return "updated";
    }
    staffMembers.push({ ...person, code: person.code || nextStaffCode() });
    return "added";
}

function parseCsv(text) {
    const rows = [];
    let row = [];
    let value = "";
    let insideQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
        const character = text[index];
        if (character === '"' && insideQuotes && text[index + 1] === '"') {
            value += '"';
            index += 1;
        } else if (character === '"') {
            insideQuotes = !insideQuotes;
        } else if (character === "," && !insideQuotes) {
            row.push(value.trim());
            value = "";
        } else if ((character === "\n" || character === "\r") && !insideQuotes) {
            if (character === "\r" && text[index + 1] === "\n") index += 1;
            row.push(value.trim());
            if (row.some((cell) => cell !== "")) rows.push(row);
            row = [];
            value = "";
        } else {
            value += character;
        }
    }

    row.push(value.trim());
    if (row.some((cell) => cell !== "")) rows.push(row);
    return rows;
}

function importCsv(text) {
    const rows = parseCsv(text);
    if (rows.length < 2) throw new Error("The CSV needs a header row and at least one staff row.");

    const headers = rows[0].map((header) => header.replace(/^\uFEFF/, "").toLowerCase().replace(/[\s_-]/g, ""));
    const nameIndex = headers.findIndex((header) => ["name", "fullname"].includes(header));
    const emailIndex = headers.indexOf("email");
    const roleIndex = headers.indexOf("role");
    const portalIndex = headers.findIndex((header) => ["portal", "status", "portalstatus"].includes(header));

    if ([nameIndex, emailIndex, roleIndex].some((index) => index < 0)) {
        throw new Error("CSV headers must include Name, Email, and Role. Portal or Status is optional.");
    }

    let imported = 0;
    let updated = 0;
    rows.slice(1).forEach((cells) => {
        const name = cells[nameIndex] || "";
        const email = cells[emailIndex] || "";
        const role = cells[roleIndex] || "";
        if (!name || !email || !role) return;

        const rawPortal = portalIndex >= 0 ? cells[portalIndex] : "Awaiting login";
        const portal = rawPortal.toLowerCase() === "active" ? "Active" : "Awaiting login";
        if (upsertStaff({ name, email, role, portal }) === "added") imported += 1;
        else updated += 1;
    });

    if (imported + updated === 0) throw new Error("No complete staff rows were found in the CSV.");
    saveStaff();
    renderStaff();
    showMessage(`CSV imported: ${imported} added, ${updated} updated.`);
}

document.querySelector("#addStaffButton").addEventListener("click", () => {
    editingEmail = null;
    staffForm.reset();
    dialogTitle.textContent = "Add employee";
    saveButton.textContent = "Add employee";
    dialog.showModal();
});

document.querySelector("#closeStaffDialog").addEventListener("click", () => dialog.close());
document.querySelector("#cancelStaffDialog").addEventListener("click", () => dialog.close());
staffForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(staffForm);
    const updatedPerson = {
        name: formData.get("name").trim(),
        email: formData.get("email").trim(),
        role: formData.get("role").trim(),
        portal: formData.get("portal")
    };

    if (editingEmail) {
        const editingIndex = staffMembers.findIndex((person) => person.email.toLowerCase() === editingEmail.toLowerCase());
        const duplicateEmail = staffMembers.some((person, index) =>
            index !== editingIndex && person.email.toLowerCase() === updatedPerson.email.toLowerCase()
        );
        if (duplicateEmail) {
            showMessage("That email address already belongs to another staff member.", true);
            return;
        }
        staffMembers[editingIndex] = { ...staffMembers[editingIndex], ...updatedPerson };
        showMessage("Employee updated.");
    } else {
        const result = upsertStaff(updatedPerson);
        showMessage(result === "added" ? "Employee added." : "Employee updated.");
    }

    saveStaff();
    renderStaff();
    dialog.close();
});

tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const personIndex = staffMembers.findIndex((person) => person.email.toLowerCase() === button.dataset.email.toLowerCase());
    if (personIndex < 0) return;

    const person = staffMembers[personIndex];
    if (button.dataset.action === "delete") {
        if (!window.confirm(`Delete ${person.name} from the staff list?`)) return;
        staffMembers.splice(personIndex, 1);
        saveStaff();
        renderStaff();
        showMessage("Employee deleted.");
        return;
    }

    editingEmail = person.email;
    staffForm.elements.name.value = person.name;
    staffForm.elements.email.value = person.email;
    staffForm.elements.role.value = person.role;
    staffForm.elements.portal.value = person.portal;
    dialogTitle.textContent = "Edit employee";
    saveButton.textContent = "Save changes";
    dialog.showModal();
});

document.querySelector("#uploadStaffButton").addEventListener("click", () => csvInput.click());
csvInput.addEventListener("change", async () => {
    const file = csvInput.files[0];
    if (!file) return;

    try {
        importCsv(await file.text());
    } catch (error) {
        showMessage(error.message || "Could not read that CSV file.", true);
    } finally {
        csvInput.value = "";
    }
});

searchInput.addEventListener("input", renderStaff);
renderStaff();


