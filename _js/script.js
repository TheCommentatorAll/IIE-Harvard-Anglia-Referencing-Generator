/* ==========================================
   IIE HARVARD ANGLIA REFERENCE GENERATOR LOGIC
   Student: Nicholas Morris ST10502284
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------------------------------------------
    // 1. NAVIGATION & SIDEBAR LOGIC
    // ------------------------------------------------------------------
    const menuToggle = document.getElementById("menu-toggle");
    const menuClose = document.getElementById("menu-close");
    const sideMenu = document.getElementById("side-menu");
    const overlay = document.getElementById("overlay");

    function openSidebar() {
        if (sideMenu) sideMenu.classList.add("open");
        if (overlay) overlay.classList.add("active");
        if (menuToggle) menuToggle.setAttribute("aria-expanded", "true");
    }

    function closeSidebar() {
        if (sideMenu) sideMenu.classList.remove("open");
        if (overlay) overlay.classList.remove("active");
        if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
    }

    if (menuToggle) menuToggle.addEventListener("click", openSidebar);
    if (menuClose) menuClose.addEventListener("click", closeSidebar);
    if (overlay) overlay.addEventListener("click", closeSidebar);

    // ------------------------------------------------------------------
    // 2. REFERENCE TYPE TOGGLING (SOURCE SELECTOR)
    // ------------------------------------------------------------------
    const referenceTypeSelect = document.getElementById("reference-type");
    const fieldsets = document.querySelectorAll(".source-fieldset");

    if (referenceTypeSelect) {
        referenceTypeSelect.addEventListener("change", (e) => {
            const selectedType = e.target.value;

            // Hide all fieldsets
            fieldsets.forEach((fieldset) => {
                fieldset.classList.remove("active");
                fieldset.style.display = "none";
            });

            // Show selected fieldset
            if (selectedType) {
                const activeFieldset = document.getElementById(`fields-${selectedType}`);
                if (activeFieldset) {
                    activeFieldset.classList.add("active");
                    activeFieldset.style.display = "block";
                }
            }
        });
    }

    // ------------------------------------------------------------------
    // 3. DYNAMIC AUTHOR ADDITION / REMOVAL
    // ------------------------------------------------------------------
    const authorContainers = [
        { btnId: "book-add-author-btn", containerId: "book-author-container", prefix: "book-author" },
        { btnId: "journal-add-author-btn", containerId: "journal-author-container", prefix: "journal-author" },
        { btnId: "blog-add-author-btn", containerId: "blog-author-container", prefix: "blog-author" },
        { btnId: "student-material-add-author-btn", containerId: "student-material-author-container", prefix: "student-material-author" }
    ];

    authorContainers.forEach(({ btnId, containerId, prefix }) => {
        const addBtn = document.getElementById(btnId);
        const container = document.getElementById(containerId);

        if (addBtn && container) {
            addBtn.addEventListener("click", () => {
                const newRow = document.createElement("div");
                newRow.className = "author-row form-group-inline";
                newRow.style.marginTop = "0.5rem";

                newRow.innerHTML = `
                    <input type="text" class="${prefix}-surname" placeholder="Author Surname" required />
                    <input type="text" class="${prefix}-initials" placeholder="Author Initials" required />
                    <button type="button" class="btn-remove-author" style="background-color: #4D1B1B; border-color: #FF3333; color: #FFCCCC;">&times; Remove</button>
                `;

                container.appendChild(newRow);

                // Add remove listener
                newRow.querySelector(".btn-remove-author").addEventListener("click", () => {
                    newRow.remove();
                });
            });
        }
    });

    // ------------------------------------------------------------------
    // 4. AUTOFETCH & TOOLBAR BUTTONS
    // ------------------------------------------------------------------

    function detectSourceTypeFromUrl(url) {
        if (url.includes("openlibrary.org/books/") || url.includes("books.google.com")) {
            return "book";
        } else if (url.includes("youtube.com/watch") || url.includes("youtu.be/")) {
            return "online_video";
        } else if (url.includes("medium.com") || url.includes("substack.com")) {
            return "blog";
        } else {
            return "website"; // Default fallback
        }
    }

    function extractOpenLibraryId(url) {
        // Matches patterns like /books/OL1234567M or /works/OL1234567W
        const match = url.match(/\/(books|works)\/(OL[0-9]+[A-Za-z])/);
        return match ? match[2] : null;
    }

    async function fetchBookFromOpenLibrary(url) {
        const bookId = extractOpenLibraryId(url);
        if (!bookId) {
            throw new Error("Invalid Open Library URL format.");
        }

        const apiUrl = `https://openlibrary.org/books/${bookId}.json`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error("Book not found in Open Library database.");

            const data = await response.json();

            // 1. Extract basic fields
            const title = data.title || "";
            const publishYear = data.publish_date ? data.publish_date.match(/\d{4}/)?.[0] || "" : "";
            const publisher = data.publishers ? data.publishers[0] : "";
            const place = data.publish_places ? data.publish_places[0] : "";

            // 2. Fetch Author Name if available
            let authorSurname = "";
            let authorInitials = "";

            if (data.authors && data.authors.length > 0) {
                const authorKey = data.authors[0].key; // e.g., "/authors/OL26330A"
                try {
                    const authorRes = await fetch(`https://openlibrary.org${authorKey}.json`);
                    if (authorRes.ok) {
                        const authorData = await authorRes.json();
                        const fullName = authorData.name || "";

                        // Parse full name into Surname and Initials
                        const nameParts = fullName.trim().split(" ");
                        if (nameParts.length > 1) {
                            authorSurname = nameParts.pop(); // Last word is usually surname
                            authorInitials = nameParts.map(n => n[0].toUpperCase()).join("");
                        } else {
                            authorSurname = fullName;
                        }
                    }
                } catch (authorErr) {
                    console.warn("Could not fetch individual author details:", authorErr);
                }
            }

            return {
                title,
                publishYear,
                publisher,
                place,
                authorSurname,
                authorInitials
            };
        } catch (error) {
            console.error("Open Library API Error:", error);
            return null;
        }
    }

    async function fetchMetadata(url) {
        try {
            const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
            const result = await response.json();

            if (result.status === "success") {
                return {
                    title: result.data.title || "",
                    author: result.data.author || result.data.publisher || "",
                    publisher: result.data.publisher || "",
                    date: result.data.date ? result.data.date.substring(0, 4) : "",
                    image: result.data.image ? result.data.image.url : ""
                };
            }
            throw new Error("Failed to parse metadata.");
        } catch (error) {
            console.error("Autofetch error:", error);
            alert("Could not automatically fetch metadata. Please enter details manually.");
            return null;
        }
    }

    const urlInput = document.getElementById("url-input");
    const autofetchBtn = document.getElementById("autofetch-button");
    const pasteBtn = document.getElementById("paste-button");
    const clearBtn = document.getElementById("clear-button");

    if (autofetchBtn) {
        autofetchBtn.addEventListener("click", async () => {
            const url = urlInput.value.trim();
            if (!url) {
                alert("Please paste a link first.");
                return;
            }

            // Check if it's an Open Library Book link
            if (url.includes("openlibrary.org/books/")) {
                // 1. Force dropdown to "Book"
                referenceTypeSelect.value = "book";
                referenceTypeSelect.dispatchEvent(new Event("change"));

                // 2. Fetch data from Open Library API
                const bookData = await fetchBookFromOpenLibrary(url);

                if (bookData) {
                    // 3. Populate Book form fields
                    document.getElementById("book-title").value = bookData.title;
                    document.getElementById("book-year").value = bookData.publishYear;
                    document.getElementById("book-publisher").value = bookData.publisher;
                    document.getElementById("book-place").value = bookData.place || "Unknown";

                    // Populate Author fields
                    if (bookData.authorSurname) {
                        document.getElementById("book-author-surname").value = bookData.authorSurname;
                        document.getElementById("book-author-initials").value = bookData.authorInitials;
                    }

                    alert("Book metadata successfully fetched from Open Library!");
                }
            } else {
                // Fallback for general websites / videos / blogs using Microlink or generic scraper
                // 1. Detect source type (website, blog, video)
                const detectedType = detectSourceTypeFromUrl(url);
                referenceTypeSelect.value = detectedType;
                referenceTypeSelect.dispatchEvent(new Event("change"));

                // 2. Fetch metadata using Microlink API
                const metadata = await fetchMetadata(url);

                if (metadata) {
                    // 3. Populate general/website fields based on selected type
                    if (detectedType === "online_video") {
                        document.getElementById("video-title").value = metadata.title;
                        document.getElementById("video-platform").value = metadata.publisher;
                        document.getElementById("video-author").value = metadata.author;
                        document.getElementById("video-year").value = metadata.date;
                        document.getElementById("video-url").value = url;
                    } else if (detectedType === "blog") {
                        document.getElementById("blog-title").value = metadata.title;
                        document.getElementById("blog-platform").value = metadata.publisher;
                        document.getElementById("blog-year").value = metadata.date;
                        document.getElementById("blog-url").value = url;
                    } else {
                        // Default website fields
                        document.getElementById("web-page-title").value = metadata.title;
                        document.getElementById("web-site-title").value = metadata.publisher;
                        document.getElementById("web-author").value = metadata.author;
                        document.getElementById("web-year").value = metadata.date;
                        document.getElementById("web-url").value = url;
                    }

                    alert("Website metadata successfully fetched!");
                }
            }
        });
    }



    // Paste from Clipboard
    if (pasteBtn && urlInput) {
        pasteBtn.addEventListener("click", async () => {
            try {
                const text = await navigator.clipboard.readText();
                urlInput.value = text;
            } catch (err) {
                alert("Failed to read clipboard contents. Please grant clipboard permissions.");
            }
        });
    }

    // Clear Field
    if (clearBtn && urlInput) {
        clearBtn.addEventListener("click", () => {
            urlInput.value = "";
        });
    }

    // ------------------------------------------------------------------
    // 5. CITATION GENERATION ENGINE (IIE HARVARD ANGLIA RULES)
    // ------------------------------------------------------------------
    const referenceForm = document.getElementById("reference-form");
    const inTextOutput = document.getElementById("in-text-output"); // matches space in HTML id
    const referenceListOutput = document.getElementById("reference-list-output");

    if (referenceForm) {
        referenceForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const type = referenceTypeSelect ? referenceTypeSelect.value : "";

            if (!type) {
                alert("Please select a reference type from the dropdown list.");
                return;
            }

            let inTextResult = "";
            let refListResult = "";

            switch (type) {
                case "book":
                    ({ inTextResult, refListResult } = generateBookReference());
                    break;
                case "journal":
                    ({ inTextResult, refListResult } = generateJournalReference());
                    break;
                case "website":
                    ({ inTextResult, refListResult } = generateWebsiteReference());
                    break;
                case "online_video":
                    ({ inTextResult, refListResult } = generateVideoReference());
                    break;
                case "blog":
                    ({ inTextResult, refListResult } = generateBlogReference());
                    break;
                case "student_material":
                    ({ inTextResult, refListResult } = generateStudentMaterialReference());
                    break;
                default:
                    alert("Selected type is not yet supported.");
                    return;
            }

            if (inTextOutput) inTextOutput.textContent = inTextResult;
            if (referenceListOutput) referenceListOutput.innerHTML = refListResult;

            console.log("Generated In-Text Citation:", inTextResult);
            console.log("Generated Reference List Entry:", refListResult);
        });
    }

    // --- HELPER FUNCTIONS FOR AUTHOR FORMATTING ---
    function getAuthors(containerId, primarySurnameId, primaryInitialsId, prefix) {
        const authors = [];
        const surnameEl = document.getElementById(primarySurnameId);
        const initialsEl = document.getElementById(primaryInitialsId);

        if (surnameEl && surnameEl.value.trim()) {
            authors.push({
                surname: formatTitleCase(surnameEl.value.trim()),
                initials: formatInitials(initialsEl ? initialsEl.value.trim() : "")
            });
        }

        const container = document.getElementById(containerId);
        if (container) {
            const rows = container.querySelectorAll(".author-row");
            rows.forEach((row, idx) => {
                if (idx === 0) return; // skip initial template row
                const sInput = row.querySelector(`.${prefix}-surname`) || row.querySelectorAll("input")[0];
                const iInput = row.querySelector(`.${prefix}-initials`) || row.querySelectorAll("input")[1];
                if (sInput && sInput.value.trim()) {
                    authors.push({
                        surname: formatTitleCase(sInput.value.trim()),
                        initials: formatInitials(iInput ? iInput.value.trim() : "")
                    });
                }
            });
        }
        return authors;
    }

    function formatInTextAuthors(authors) {
        if (authors.length === 0) return "Anon.";
        if (authors.length === 1) return authors[0].surname;
        if (authors.length === 2) return `${authors[0].surname} and ${authors[1].surname}`;
        if (authors.length === 3) return `${authors[0].surname}, ${authors[1].surname} and ${authors[2].surname}`;
        return `${authors[0].surname} <i>et al.</i>`;
    }

    function formatRefListAuthors(authors) {
        if (authors.length === 0) return "Anon.";
        if (authors.length === 1) return `${authors[0].surname}, ${authors[0].initials}`;
        if (authors.length === 2) return `${authors[0].surname}, ${authors[0].initials} and ${authors[1].surname}, ${authors[1].initials}`;

        const lastAuthor = authors[authors.length - 1];
        const primaryAuthors = authors.slice(0, authors.length - 1).map(a => `${a.surname}, ${a.initials}`).join(", ");
        return `${primaryAuthors} and ${lastAuthor.surname}, ${lastAuthor.initials}`;
    }

    function formatInitials(str) {
        if (!str) return "";
        const cleaned = str.replace(/[^a-zA-Z]/g, "").toUpperCase();
        return cleaned.split("").join(".") + (cleaned ? "." : "");
    }

    function formatTitleCase(str) {
        return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }

    function formatDate(date) {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    // --- GENERATORS FOR SPECIFIC SOURCE TYPES ---
    function generateBookReference() {
        const authors = getAuthors("book-author-container", "book-author-surname", "book-author-initials", "book-author");
        const title = document.getElementById("book-title").value.trim();
        const year = document.getElementById("book-year").value.trim() || "n.d.";
        const edition = document.getElementById("book-edition").value.trim();
        const place = document.getElementById("book-place").value.trim();
        const publisher = document.getElementById("book-publisher").value.trim();

        const inText = `(${formatInTextAuthors(authors)}, ${year})`;
        const editionStr = edition ? `${edition}. ` : "";
        const refList = `${formatRefListAuthors(authors)}, ${year}. <i>${title}</i>. ${editionStr}${place}: ${publisher}.`;

        return { inTextResult: inText, refListResult: refList };
    }

    function generateJournalReference() {
        const authors = getAuthors("journal-author-container", "journal-author-surname", "journal-author-initials", "journal-author");
        const year = document.getElementById("journal-year").value.trim() || "n.d.";
        const title = document.getElementById("journal-title").value.trim();
        const journalName = document.getElementById("journal-name").value.trim();
        const volume = document.getElementById("journal-volume").value.trim();
        const pages = document.getElementById("journal-pages").value.trim();
        const doi = document.getElementById("journal-doi").value.trim();

        const inText = `(${formatInTextAuthors(authors)}, ${year})`;
        const pagesStr = pages ? `, pp.${pages}` : "";
        const volumeStr = volume ? ` ${volume}` : "";
        const doiStr = doi ? `. Available at: &lt;${doi}&gt; [Accessed ${formatDate(new Date())}]` : "";

        const refList = `${formatRefListAuthors(authors)}, ${year}. ${title}. <i>${journalName}</i>,${volumeStr}${pagesStr}${doiStr}.`;

        return { inTextResult: inText, refListResult: refList };
    }

    function generateWebsiteReference() {
        const author = document.getElementById("web-author").value.trim() || "Anon.";
        const year = document.getElementById("web-year").value.trim() || "n.d.";
        const pageTitle = document.getElementById("web-page-title").value.trim();
        const siteTitle = document.getElementById("web-site-title").value.trim();
        const url = document.getElementById("web-url").value.trim();
        const accessedDate = document.getElementById("web-accessed-date").value.trim() || formatDate(new Date());

        const inText = `(${author}, ${year})`;
        const refList = `${author}, ${year}. <i>${pageTitle}</i>. [online] ${siteTitle}. Available at: &lt;${url}&gt; [Accessed ${accessedDate}].`;

        return { inTextResult: inText, refListResult: refList };
    }

    function generateVideoReference() {
        const author = document.getElementById("video-author").value.trim() || "Anon.";
        const year = document.getElementById("video-year").value.trim() || "n.d.";
        const title = document.getElementById("video-title").value.trim();
        const platform = document.getElementById("video-platform").value.trim();
        const url = document.getElementById("video-url").value.trim();
        const accessedDate = document.getElementById("video-accessed-date").value.trim() || formatDate(new Date());

        const inText = `(${author}, ${year})`;
        const refList = `${author}, ${year}. <i>${title}</i>. [video online] ${platform}. Available at: &lt;${url}&gt; [Accessed ${accessedDate}].`;

        return { inTextResult: inText, refListResult: refList };
    }

    function generateBlogReference() {
        const authors = getAuthors("blog-author-container", "blog-author-surname", "blog-author-firstname", "blog-author");
        const year = document.getElementById("blog-year").value.trim() || "n.d.";
        const title = document.getElementById("blog-title").value.trim();
        const platform = document.getElementById("blog-platform").value.trim();
        const url = document.getElementById("blog-url").value.trim();
        const accessedDate = document.getElementById("blog-accessed-date").value.trim() || formatDate(new Date());

        const inText = `(${formatInTextAuthors(authors)}, ${year})`;
        const refList = `${formatRefListAuthors(authors)}, ${year}. ${title}. <i>${platform}</i>, [blog] Available at: &lt;${url}&gt; [Accessed ${accessedDate}].`;

        return { inTextResult: inText, refListResult: refList };
    }

    function generateStudentMaterialReference() {
        const authors = getAuthors("student-material-author-container", "student-material-author-surname", "student-material-author-initials", "student-material-author");
        const year = document.getElementById("student-material-year").value.trim() || "n.d.";
        const title = document.getElementById("student-material-title").value.trim();
        const institution = document.getElementById("student-material-institution").value.trim();
        const url = document.getElementById("student-material-url").value.trim();
        const accessedDate = document.getElementById("student-material-accessed-date").value.trim() || formatDate(new Date());

        const inText = `(${formatInTextAuthors(authors)}, ${year})`;
        const urlStr = url ? ` Available at: &lt;${url}&gt; [Accessed ${accessedDate}].` : "";
        const refList = `${formatRefListAuthors(authors)}, ${year}. <i>${title}</i>. [Module Guide]. ${institution}.${urlStr}`;

        return { inTextResult: inText, refListResult: refList };
    }

    // ------------------------------------------------------------------
    // 6. COPY TO CLIPBOARD BUTTONS
    // ------------------------------------------------------------------
    const copyButtons = document.querySelectorAll(".btn-copy");

    copyButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("data-target") || btn.getAttribute("data-target ");
            if (!targetId) return;

            const targetElement = document.getElementById(targetId.trim());
            if (!targetElement) return;

            const textToCopy = targetElement.innerText || targetElement.textContent;

            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = btn.textContent;
                btn.textContent = "Copied!";
                btn.style.backgroundColor = "#33FF33";
                btn.style.color = "#001100";

                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.backgroundColor = "";
                    btn.style.color = "";
                }, 2000);
            }).catch((err) => {
                alert("Failed to copy text to clipboard.");
            });
        });
    });
});