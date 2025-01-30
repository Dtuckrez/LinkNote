const notes = [];

function createReadMeNote() {
    const readMeExists = notes.some(note => note.title === "README");
    if (readMeExists) return; // Don't create a duplicate

    const noteId = generateGUID();

    const readMeNote = {
        id: noteId,
        title: "README",
        content: `
            <strong>Welcome to Your Note App!</strong><br><br>
            This is your <strong>README Note</strong>, here to guide you through using the <strong>/command</strong> to link notes.<br><br>

            <strong>How to Link Notes:</strong><br>
            1. <strong>Create a new note</strong> by clicking anywhere on the screen.<br>
            2. <strong>Type '/' followed by a word</strong> (e.g., '/TaskList').<br>
            3. A <strong>dropdown will appear</strong> with existing note titles.<br>
            4. <strong>Select a note</strong> to create a link to it.<br>
            5. The linked note will appear as <em>*TaskList*</em> inside your text.<br>
            6. <strong>Click on the linked note</strong> to open it!<br><br>

            <strong>Tips:</strong><br>
            - You can create <strong>multiple links</strong> within a note.<br>
            - Linked notes will automatically update in the text.<br>
            - If a note doesn’t exist yet, create it first to link it later.<br><br>

            Now, go ahead and start creating your notes! 🚀
        `,
        position: { x: 50, y: 50 }, // Fixed position for README note
        size: { width: 300, height: 200 }, // Larger than regular notes
        color: '#d1ecf1', // Light blue background
        isVisible: true,
        links: new Map(),
    };

    notes.push(readMeNote);
    renderNotes();
    addNoteToMenu(readMeNote);
}

// Run this when the page loads
window.onload = function () {
    createReadMeNote();
};


// Generate a GUID
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function generateUniqueNoteTitle() {
    let highestNumber = 0;

    // Check all notes to find the highest existing number
    notes.forEach((note) => {
        const match = note.title.match(/^note_\*(\d+)\*$/); // Match "note_*X*"
        if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > highestNumber) {
                highestNumber = num; // Keep track of the highest note number
            }
        }
    });

    return `note_${highestNumber + 1}`; // Ensure next number is always unique
}
// Create a new note
function createNote(x, y) {
    const noteId = generateGUID();

    const newNote = {
        id: noteId,
        title: generateUniqueNoteTitle(), // Set title dynamically with size
        content: '',
        position: { x, y },
        size: { width: 200, height: 200 },
        color: '#ffffff', // Default color
        isVisible: true,
        links: new Map(), // Store links as a map
    };

    notes.push(newNote);

    console.log('New note added:', newNote); // Log the newly added note
    console.log('Current notes array:', notes); // Log the entire notes array

    renderNotes();
    addNoteToMenu(newNote);
}

function renderNotes() {
    const noteContainer = document.getElementById('note-container');
    noteContainer.innerHTML = ''; // Clear existing notes

    console.log('Rendering notes. Total notes:', notes.length);

    notes.forEach((note) => {
        if (!note.isVisible) return;

        const noteElement = renderNote(note);
        noteContainer.appendChild(noteElement);
    });
}

function renderNote(note) {
    console.log(`Rendering note with ID: ${note.id}`);

    const noteElement = document.createElement('div');
    noteElement.className = 'note';
    noteElement.dataset.id = note.id;
    noteElement.style.left = `${note.position.x}px`;
    noteElement.style.top = `${note.position.y}px`;
    noteElement.style.width = `${note.size.width}px`;
    noteElement.style.height = `${note.size.height}px`;
    noteElement.style.backgroundColor = note.color || '#ffffff';

    // Add title, text area, and footer
    createNoteTitle(note, noteElement);
    createNoteTextArea(note, noteElement);
    createNoteFooter(note, noteElement);

    // Attach event listeners (drag, delete, etc.)
    attachNoteEventListeners(note, noteElement);

    return noteElement;
}

function createNoteTitle(note, noteElement) {
    const title = document.createElement('div');
    title.className = 'note-title';
    title.style.display = 'flex';
    title.style.alignItems = 'center';
    title.style.justifyContent = 'space-between';

    // Close Button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.textContent = '✖';
    closeButton.addEventListener('click', () => {
        console.log(`Hiding note with ID: ${note.id}`);
        note.isVisible = false;
        renderNotes();
    });
    title.appendChild(closeButton);

    // Editable Title
    const titleText = document.createElement('div');
    titleText.className = 'editable-title';
    titleText.contentEditable = true;
    titleText.textContent = note.title;
    titleText.style.flexGrow = 1;
    titleText.style.textAlign = 'center';
    titleText.addEventListener('input', () => {
        note.title = titleText.textContent;
        updateNoteInMenu(note);
    });
    title.appendChild(titleText);

    // Drag Handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.textContent = '☰';
    dragHandle.style.cursor = 'grab';
    title.appendChild(dragHandle);

    noteElement.appendChild(title);
}

function createNoteTextArea(note, noteElement) {
    const textArea = document.createElement('div');
    textArea.className = 'note-text';
    textArea.contentEditable = true;
    textArea.innerHTML = convertToClickableLinks(note.content);
    textArea.style.backgroundColor = note.color || '#ffffff';
    textArea.style.maxHeight = "150px";  // Prevent overflowing
    textArea.style.overflowY = "auto";   // Enable vertical scrolling when needed
    textArea.style.padding = "5px";      // Add some spacing inside
    textArea.style.boxSizing = "border-box"; // Ensure padding doesn't mess with height
    
    // Handle linked text dynamically
    textArea.addEventListener("input", (event) => {
        console.log("📌 createNoteTextArea Note Object:", note);
    
        handleSlashInput(textArea, note);
        note.content = textArea.textContent;
    
        // Convert *text* to clickable links in real-time
        textArea.innerHTML = convertToClickableLinks(note.content);
    
        // Restore cursor to prevent it from staying inside the span
        restoreCursorPosition(textArea);
    
        console.log(`✏️ Updated note content: "${note.content}"`);
    });

    // Handle clicking linked notes
    textArea.addEventListener('click', (event) => {
        if (event.target.classList.contains('linked-note')) {
            const clickedText = event.target.textContent.trim(); // e.g. "*Title*"
            const cleanTitle = clickedText.replace(/\*/g, ''); // Remove * only, keep it as "Title"

            console.log(`📌 Raw clicked text: "${clickedText}"`);
            console.log(`🔍 Cleaned title for lookup: "${cleanTitle}"`);

            const noteId = note.links.get(cleanTitle);    
            if (noteId) {
                console.log(`📝 Opening linked note: ${clickedText} (ID: ${noteId})`);
                showNote(noteId);
            } else {
                console.warn(`⚠️ No linked note found for: ${clickedText}`);
            }
        }
    });

        // Attach event listener to clickable spans
    textArea.querySelectorAll(".linked-note").forEach(span => {
        span.addEventListener("click", (event) => {
            const title = event.target.dataset.title;
            console.log(`Clicked linked note: ${title}`);
            // Implement logic to open the linked note
        });
    });

    noteElement.appendChild(textArea);
}

function convertToClickableLinks(text) {
    return text.replace(/\*(.*?)\*/g, (match, title) => {
        return `<span class="linked-note" data-title="${title}" contenteditable="false">*${title}*</span>`;
    });
}

function createNoteFooter(note, noteElement) {
    const footer = document.createElement('div');
    footer.className = 'note-footer';

    // Add color picker
    for (let i = 0; i < 5; i++) {
        const circle = document.createElement('div');
        circle.className = 'color-circle';
        circle.style.backgroundColor = getColorByIndex(i);
        circle.style.border = '2px solid black';

        circle.addEventListener('click', () => {
            console.log(`🎨 Changing note color for ID: ${note.id} to ${circle.style.backgroundColor}`);

            // Update the note's stored color
            note.color = circle.style.backgroundColor;

            // Apply the new color instantly
            noteElement.style.backgroundColor = note.color;

            // Also update the text area background color
            const textArea = noteElement.querySelector('.note-text');
            if (textArea) {
                textArea.style.backgroundColor = note.color;
            }

            // Optional: Update title background to a neutral color if needed
            const title = noteElement.querySelector('.note-title');
            if (title) {
                title.style.backgroundColor = '#f4f4f9';
            }

            // Optional: Make the selected color's border bold
            const allCircles = footer.querySelectorAll('.color-circle');
            allCircles.forEach((c) => c.style.border = '2px solid black');
            circle.style.border = `2px solid black`;
        });

        footer.appendChild(circle);
    }

    noteElement.appendChild(footer);
}

function attachNoteEventListeners(note, noteElement) {
    // Make note draggable
    makeNoteDraggable(noteElement, note);
}

