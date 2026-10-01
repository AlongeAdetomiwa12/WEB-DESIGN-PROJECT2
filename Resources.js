const databaseName = "westbay-resources";
const storeName = "files";
const uploadButton = document.querySelector("#resourceUploadButton");
const fileInput = document.querySelector("#resourceFileInput");
const resourceGrid = document.querySelector("#resourceGrid");
const emptyMessage = document.querySelector("#resourceEmptyMessage");
const message = document.querySelector("#resourceMessage");
const searchInput = document.querySelector("#resourceSearchInput");
const categoryFilter = document.querySelector("#resources");
const resourceUrls = new Map();
let resources = [];

const categoryLabels = {
    Lesson: "Lessons",
    "past-que": "Past Questions",
    assignments: "Assignments",
    CBT: "CBT-based questions",
    Requestlog: "Request Log"
};

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: "id" });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function withFileStore(mode, operation) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, mode);
        const request = operation(transaction.objectStore(storeName));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => database.close();
        transaction.onerror = () => {
            database.close();
            reject(transaction.error);
        };
    });
}

function formatSize(bytes) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("is-error", isError);
}

function makeResourceCard(resource) {
    const card = document.createElement("article");
    const top = document.createElement("div");
    const type = document.createElement("span");
    const status = document.createElement("span");
    const name = document.createElement("h2");
    const size = document.createElement("p");
    const footer = document.createElement("div");
    const category = document.createElement("span");
    const actions = document.createElement("div");
    const openLink = document.createElement("a");
    const deleteButton = document.createElement("button");
    const url = URL.createObjectURL(resource.file);

    resourceUrls.set(resource.id, url);
    card.className = "resource-card";
    card.dataset.category = resource.category;
    top.className = "resource-card-top";
    type.className = "resource-file-type";
    type.textContent = resource.file.name.toLowerCase().endsWith(".pdf") ? "PDF document" : "Word document";
    status.className = "resource-card-status";
    status.textContent = "Ready";
    name.className = "resource-card-name";
    name.textContent = resource.file.name;
    size.className = "resource-card-size";
    size.textContent = formatSize(resource.file.size);
    footer.className = "resource-card-footer";
    category.className = "resource-card-category";
    category.textContent = categoryLabels[resource.category] || "Resource";
    actions.className = "resource-card-actions";
    openLink.href = url;
    openLink.target = "_blank";
    openLink.rel = "noopener";
    openLink.textContent = "Open";
    openLink.setAttribute("aria-label", `Open ${resource.file.name}`);
    deleteButton.type = "button";
    deleteButton.dataset.deleteResource = resource.id;
    deleteButton.textContent = "Remove";
    deleteButton.setAttribute("aria-label", `Remove ${resource.file.name}`);

    top.append(type, status);
    actions.append(openLink, deleteButton);
    footer.append(category, actions);
    card.append(top, name, size, footer);
    return card;
}

function renderResources() {
    for (const url of resourceUrls.values()) URL.revokeObjectURL(url);
    resourceUrls.clear();

    const query = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;
    const visibleResources = resources.filter((resource) => {
        const matchesCategory = selectedCategory === "All" || resource.category === selectedCategory;
        return matchesCategory && resource.file.name.toLowerCase().includes(query);
    });

    resourceGrid.replaceChildren(...visibleResources.map(makeResourceCard));
    emptyMessage.textContent = resources.length === 0
        ? "No resources added yet. Add a PDF or Word document to get started."
        : "No resources match your search or category filter.";
    emptyMessage.hidden = visibleResources.length !== 0;
    resourceGrid.hidden = visibleResources.length === 0;
}

async function loadResources() {
    try {
        resources = await withFileStore("readonly", (store) => store.getAll());
        renderResources();
    } catch {
        showMessage("Browser storage is unavailable, so resources cannot be loaded.", true);
    }
}

uploadButton.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
    const files = [...fileInput.files];
    if (files.length === 0) return;

    const unsupportedFiles = files.filter((file) => !/\.(pdf|docx)$/i.test(file.name));
    if (unsupportedFiles.length > 0) {
        showMessage("Only PDF and DOCX files are accepted. Unsupported files were skipped.", true);
    } else {
        showMessage("");
    }

    const category = categoryFilter.value === "All" ? "Lesson" : categoryFilter.value;
    const validFiles = files.filter((file) => /\.(pdf|docx)$/i.test(file.name));
    try {
        for (const file of validFiles) {
            const resource = {
                id: crypto.randomUUID(),
                file,
                category,
                addedAt: Date.now()
            };
            await withFileStore("readwrite", (store) => store.add(resource));
            resources.push(resource);
        }
        if (validFiles.length > 0) {
            renderResources();
            showMessage(`${validFiles.length} resource${validFiles.length === 1 ? "" : "s"} added.`);
        }
    } catch {
        showMessage("Could not save the selected file. Check available browser storage and try again.", true);
    } finally {
        fileInput.value = "";
    }
});

resourceGrid.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-delete-resource]");
    if (!button) return;

    try {
        await withFileStore("readwrite", (store) => store.delete(button.dataset.deleteResource));
        resources = resources.filter((resource) => resource.id !== button.dataset.deleteResource);
        renderResources();
        showMessage("Resource removed.");
    } catch {
        showMessage("Could not remove that resource.", true);
    }
});

searchInput.addEventListener("input", renderResources);
categoryFilter.addEventListener("change", renderResources);
loadResources();
