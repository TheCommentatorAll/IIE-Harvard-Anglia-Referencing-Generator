/* ==========================================
   IIE HARVARD ANGLIA REFERENCE GENERATOR LOGIC
   Student: Nicholas Morris ST10502284
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------------------------------
    // NAVIGATION & SIDEBAR LOGIC
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

    // Automatically set QR code source to current page URL
    const qrImage = document.querySelector(".qr-code-img");
    if (qrImage) {
        const currentUrl = encodeURIComponent(window.location.href);
        qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${currentUrl}`;
    }


    // ------------------------------------------------------------------
    // REFERENCE TYPE TOGGLING (SOURCE SELECTOR)
    // ------------------------------------------------------------------
    const referenceTypeSelect = document.getElementById("reference-type");
    const fieldsets = document.querySelectorAll(".source-fieldset");

    function showFieldset(type) {
        const targetId = type ? `fields-${type.replace(/_/g, "-")}` : "";
        fieldsets.forEach((fs) => {
            const isActive = fs.id === targetId;
            fs.classList.toggle("active", isActive);
            fs.style.display = isActive ? "block" : "none";
            fs.disabled = !isActive; // Disabled fieldsets are skipped by validation
        });
    }

    if (referenceTypeSelect) {
        referenceTypeSelect.addEventListener("change", (e) => showFieldset(e.target.value));
    }


    // ------------------------------------------------------------------
    // DYNAMIC AUTHOR ADDITION / REMOVAL
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

                // Add remove listener for the dynamic row
                newRow.querySelector(".btn-remove-author").addEventListener("click", () => {
                    newRow.remove();
                });
            });
        }
    });


    // ------------------------------------------------------------------
    // AUTOFETCH & METADATA API INTEGRATION
    // ------------------------------------------------------------------
    const urlInput = document.getElementById("url-input");
    const autofetchBtn = document.getElementById("autofetch-button");
    const pasteBtn = document.getElementById("paste-button");
    const clearBtn = document.getElementById("clear-button");

    function detectSourceTypeFromUrl(url) {
        // 1. Check for Book databases
        if (url.includes("openlibrary.org/books/") || url.includes("google.co.za/books")) {
            return "book";
        }
        // 2. Strict check for Video Platforms (avoid matching words like "/videos/" in news sites)
        else if (
            url.includes("youtube.com/watch") ||
            url.includes("youtu.be/") ||
            url.includes("tiktok.com") ||
            url.includes("instagram.com")
        ) {
            return "online_video";
        }
        // 3. Check for Blogs
        else if (url.includes("medium.com") || url.includes("substack.com")) {
            return "blog";
        }
        // 4. Default fallback for news sites (like eNCA, BBC, News24) and general web pages
        else {
            return "website";
        }
    }

    async function fetchVideoMetadata(url) {
        try {
            // 1. YouTube oEmbed API for pristine titles and channel names
            if (url.includes("youtube.com") || url.includes("youtu.be")) {
                const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
                const response = await fetch(oEmbedUrl);

                if (response.ok) {
                    const data = await response.json();
                    return {
                        title: data.title || "",
                        author: data.author_name || "",
                        platform: "YouTube"
                    };
                }
            }

            // 2. Fallback to Microlink API for other video platforms (Vimeo, TED, etc.)
            const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
            const result = await response.json();

            if (result.status === "success") {
                const urlObj = new URL(url);
                let platformName = result.data.publisher || urlObj.hostname.replace('www.', '');
                platformName = platformName.charAt(0).toUpperCase() + platformName.slice(1);

                return {
                    title: result.data.title || "",
                    author: result.data.author || result.data.publisher || "Anon.",
                    platform: platformName
                };
            }

            throw new Error("Failed to fetch video metadata.");
        } catch (error) {
            console.error("Video Fetch Error:", error);
            return null;
        }
    }

    function extractOpenLibraryId(url) {
        const match = url.match(/\/(books|works)\/(OL[0-9]+[A-Za-z])/);
        return match ? match[2] : null;
    }

    async function fetchBookFromOpenLibrary(url) {
        const bookId = extractOpenLibraryId(url);
        if (!bookId) throw new Error("Invalid Open Library URL format.");

        const apiUrl = `https://openlibrary.org/books/${bookId}.json`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error("Book not found in Open Library database.");

            const data = await response.json();
            const title = data.title || "";
            const publishYear = data.publish_date ? data.publish_date.match(/\d{4}/)?.[0] || "" : "";
            const publisher = data.publishers ? data.publishers[0] : "";
            const place = data.publish_places ? data.publish_places[0] : "";

            let authorSurname = "";
            let authorInitials = "";

            if (data.authors && data.authors.length > 0) {
                const authorKey = data.authors[0].key;
                try {
                    const authorRes = await fetch(`https://openlibrary.org${authorKey}.json`);
                    if (authorRes.ok) {
                        const authorData = await authorRes.json();
                        const fullName = authorData.name || "";
                        const nameParts = fullName.trim().split(" ");
                        if (nameParts.length > 1) {
                            authorSurname = nameParts.pop();
                            authorInitials = nameParts.map(n => n[0].toUpperCase()).join("");
                        } else {
                            authorSurname = fullName;
                        }
                    }
                } catch (authorErr) {
                    console.warn("Could not fetch individual author details:", authorErr);
                }
            }

            return { title, publishYear, publisher, place, authorSurname, authorInitials };
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
            return null;
        }
    }

    if (autofetchBtn) {
        autofetchBtn.addEventListener("click", async () => {
            const url = urlInput.value.trim();
            if (!url) {
                alert("Please paste a link first.");
                return;
            }

            autofetchBtn.disabled = true;
            const originalHTML = autofetchBtn.innerHTML;

            // Set button content with animated dots HTML structure
            autofetchBtn.innerHTML = `Fetching Metadata<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>`;

            // Helper function to safely populate input values without crashing
            try {
                const setVal = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) el.value = val;
                };

                // 1. Check if it's an Open Library Book link
                if (url.includes("openlibrary.org/books/")) {
                    referenceTypeSelect.value = "book";
                    referenceTypeSelect.dispatchEvent(new Event("change"));

                    const bookData = await fetchBookFromOpenLibrary(url);
                    if (bookData) {
                        setVal("book-title", bookData.title);
                        setVal("book-year", bookData.publishYear);
                        setVal("book-publisher", bookData.publisher);
                        setVal("book-place", bookData.place || "Unknown");

                        if (bookData.authorSurname) {
                            setVal("book-author-surname", bookData.authorSurname);
                            setVal("book-author-initials", bookData.authorInitials);
                        }
                        alert("Book metadata successfully fetched from Open Library!");
                    }
                }
                // 2. Check if it's a Google Books link
                else if (url.includes("google.co.za/books")) {
                    referenceTypeSelect.value = "book";
                    referenceTypeSelect.dispatchEvent(new Event("change"));

                    // Attempt to extract title from URL slug or use Microlink as fallback
                    const metadata = await fetchMetadata(url);
                    if (metadata && metadata.title) {
                        setVal("book-title", metadata.title);
                        setVal("book-year", metadata.date || new Date().getFullYear());
                        setVal("book-publisher", metadata.publisher || "Google Books");
                        setVal("book-place", "Unknown");
                        alert("Google Books link detected! Form switched to Book mode. Please review the extracted details.");
                    } else {
                        // Fallback: Extract book name nicely from the URL path slug if scraping fails
                        try {
                            const urlObj = new URL(url);
                            const pathSegments = urlObj.pathname.split('/');
                            // Usually the book title slug is in the path (e.g., /books/edition/Harry_Potter...)
                            const rawTitleSlug = pathSegments.find(seg => seg.length > 5 && seg.includes('_')) || "Book Title";
                            const readableTitle = decodeURIComponent(rawTitleSlug).replace(/_/g, ' ');

                            setVal("book-title", readableTitle);
                            setVal("book-year", new Date().getFullYear());
                            setVal("book-publisher", "Google Books");
                            setVal("book-place", "Unknown");
                            alert("Google Books security restricted direct scraping. We've switched the form to Book mode and filled out the title from the link—please verify the author and publication year.");
                        } catch (e) {
                            alert("Google Books link detected and form switched to Book mode. Please fill in the book details manually.");
                        }
                    }
                } else {
                    // 3. Handle General Websites & News Articles (with fallback extraction)
                    const detectedType = detectSourceTypeFromUrl(url);
                    referenceTypeSelect.value = detectedType;
                    referenceTypeSelect.dispatchEvent(new Event("change"));

                    if (detectedType === "online_video") {
                        // Clear fields first so old data doesn't persist on failure
                        document.getElementById("video-title").value = "";
                        document.getElementById("video-author").value = "";
                        document.getElementById("video-url").value = url;
                        document.getElementById("video-year").value = new Date().getFullYear();

                        const videoData = await fetchVideoMetadata(url);

                        if (videoData && videoData.title) {
                            document.getElementById("video-title").value = videoData.title;
                            document.getElementById("video-author").value = videoData.author;
                            document.getElementById("video-platform").value = videoData.platform;
                            alert("Video metadata successfully fetched!");
                        } else {
                            alert("Could not automatically fetch video details. Please fill them in manually.");
                        }
                    } else {
                        const metadata = await fetchMetadata(url);
                        if (metadata && metadata.title) {
                            setVal("web-page-title", metadata.title);
                            setVal("web-site-title", metadata.publisher || new URL(url).hostname);
                            setVal("web-author", metadata.author || "Anon.");
                            setVal("web-year", metadata.date || new Date().getFullYear());
                            setVal("web-url", url);
                            alert("Website metadata successfully fetched!");
                        } else {
                            // FALLBACK: Extract title from URL slug if security blocks Microlink scraping
                            try {
                                const urlObj = new URL(url);
                                const pathSegments = urlObj.pathname.split('/').filter(seg => seg.length > 0);
                                const lastSegment = pathSegments[pathSegments.length - 1] || "Article Title";
                                const readableTitle = decodeURIComponent(lastSegment).replace(/[-_]/g, ' ');
                                const capitalizedTitle = readableTitle.charAt(0).toUpperCase() + readableTitle.slice(1);

                                setVal("web-page-title", capitalizedTitle);
                                setVal("web-site-title", urlObj.hostname.replace('www.', ''));
                                setVal("web-author", "Anon.");
                                setVal("web-year", new Date().getFullYear());
                                setVal("web-url", url);

                                alert("Site security restricted deep scraping. Title populated from link slug—please review details.");
                            } catch (e) {
                                alert("Could not fetch site metadata due to security restrictions. Please enter details manually.");
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Autofetch error:", error);
                alert("An error occurred while fetching metadata. Please check the console for details.");
            } finally {
                autofetchBtn.disabled = false;
                autofetchBtn.textContent = originalHTML; // Restore original button content
            }
        });
    }

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

    if (clearBtn && urlInput) {
        clearBtn.addEventListener("click", () => {
            urlInput.value = "";
        });
    }


    // ------------------------------------------------------------------
    // CITATION GENERATION ENGINE (IIE HARVARD ANGLIA RULES)
    // ------------------------------------------------------------------
    const referenceForm = document.getElementById("reference-form");

    // FIXED: Removed trailing spaces inside string quotes so elements are found successfully!
    const inTextOutput = document.getElementById("in-text-output");
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

            if (inTextOutput) inTextOutput.innerHTML = inTextResult;
            if (referenceListOutput) referenceListOutput.innerHTML = refListResult;
        });
    }

    // --- HELPER FUNCTIONS FOR AUTHOR & FORMATTING RULES ---
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
    // COPY TO CLIPBOARD BUTTONS
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

    // ------------------------------------------------------------------
    // CONTACT / COMPLAINT FORM HANDLING (FORMSPREE AJAX)
    // ------------------------------------------------------------------
    const contactForm = document.getElementById("contact-form");
    const formStatus = document.getElementById("form-status");

    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // This stops the browser from doing a default redirect/page reload!

            const submitBtn = document.getElementById("submit-btn");
            const originalBtnText = submitBtn ? submitBtn.textContent : "[SEND MESSAGE]";

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "[SENDING...]";
            }
            if (formStatus) formStatus.textContent = "";

            const formData = new FormData(contactForm);

            try {
                const response = await fetch(contactForm.action, {
                    method: "POST",
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    if (formStatus) {
                        formStatus.style.color = "#33FF33";
                        formStatus.textContent = "Success! Your message has been sent. We will be in contact shortly.";
                    }
                    contactForm.reset();
                } else {
                    const data = await response.json();
                    if (formStatus) {
                        formStatus.style.color = "#FF3333";
                        formStatus.textContent = data.error || "Oops! There was a problem submitting your form.";
                    }
                }
            } catch (error) {
                if (formStatus) {
                    formStatus.style.color = "#FF3333";
                    formStatus.textContent = "Network error. Please check your connection and try again.";
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            }
        });
    }

});