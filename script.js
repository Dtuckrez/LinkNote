
/**
 * Saves and restores the cursor position after modifying the DOM.
 */
function getCursorPosition(textArea) {
    let position = 0;
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preRange = range.cloneRange();
        preRange.selectNodeContents(textArea);
        preRange.setEnd(range.endContainer, range.endOffset);
        position = preRange.toString().length;
    }
    return position;
}


// Helper function to get predefined colors
function getColorByIndex(index) {
    const colors = ['#f8d7da', '#d4edda', '#d1ecf1', '#fff3cd', '#fefefe'];
    return colors[index % colors.length]; // Cycle through colors
}

// Remove note from the side menu
function removeNoteFromMenu(noteId) {
    const noteItem = document.querySelector(`.note-item[data-note-id="${noteId}"]`);
    if (noteItem) {
        noteItem.remove();
    }
}

// Add a note to the side menu
function addNoteToMenu(note) {
    const sideMenu = document.getElementById('side-menu');

    // Prevent duplicates
    if (document.querySelector(`.note-item[data-note-id="${note.id}"]`)) {
        console.log(`Note with ID: ${note.id} already exists in the side menu.`);
        return;
    }

    console.log(`Adding note with ID: ${note.id} to the side menu.`); // Log menu addition

    const noteItem = document.createElement('div');
    noteItem.className = 'note-item';
    noteItem.dataset.noteId = note.id;
    noteItem.textContent = note.title || 'Untitled';

    noteItem.addEventListener('click', () => {
        console.log(`Restoring note with ID: ${note.id} from the side menu.`); // Log note restoration
        showNote(note.id);
    });

    sideMenu.appendChild(noteItem);
}

function updateNoteInMenu(note) {
    // Find the corresponding menu item by the note ID
    const noteItem = document.querySelector(`.note-item[data-note-id="${note.id}"]`);
    if (noteItem) {
        // Update the menu item text to match the note's title
        noteItem.textContent = note.title || 'Untitled'; // Fallback to 'Untitled' if the title is empty
    }
}

// Show a hidden note
function showNote(noteId) {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
        note.isVisible = true; // Update visibility state
        renderNotes(); // Re-render notes
        console.log(`Note with ID ${noteId} is now visible.`);
    }
}


// // Make a note draggable
function makeNoteDraggable(noteElement, note) {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const dragHandle = noteElement.querySelector('.drag-handle');
    dragHandle.addEventListener('mousedown', (event) => {
        isDragging = true;
        offsetX = event.clientX - noteElement.getBoundingClientRect().left;
        offsetY = event.clientY - noteElement.getBoundingClientRect().top;
        noteElement.style.zIndex = 1000;
    });

    document.addEventListener('mousemove', (event) => {
        if (!isDragging) return;

        const containerRect = document.getElementById('note-container').getBoundingClientRect();
        const mouseX = event.clientX - containerRect.left;
        const mouseY = event.clientY - containerRect.top;

        noteElement.style.left = `${mouseX - offsetX}px`;
        noteElement.style.top = `${mouseY - offsetY}px`;

        note.position.x = mouseX - offsetX;
        note.position.y = mouseY - offsetY;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        noteElement.style.zIndex = '';
    });
}

function makeNoteDraggable(noteElement, note) {
    const dragHandle = noteElement.querySelector('.drag-handle');

    // Sanity check
    if (!dragHandle) {
        console.error('Drag handle not found for note:', note.id);
        return;
    }

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    dragHandle.addEventListener('mousedown', (event) => {
        isDragging = true;
        offsetX = event.clientX - noteElement.getBoundingClientRect().left;
        offsetY = event.clientY - noteElement.getBoundingClientRect().top;
        noteElement.style.zIndex = 1000;
    });

    document.addEventListener('mousemove', (event) => {
        if (!isDragging) return;

        const containerRect = document.getElementById('note-container').getBoundingClientRect();
        const mouseX = event.clientX - containerRect.left;
        const mouseY = event.clientY - containerRect.top;

        noteElement.style.left = `${mouseX - offsetX}px`;
        noteElement.style.top = `${mouseY - offsetY}px`;

        note.position.x = mouseX - offsetX;
        note.position.y = mouseY - offsetY;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        noteElement.style.zIndex = '';
    });
}

function handleSlashInput(textArea, note) {
    console.log(`handleSlashInput: ${note}`);

    const text = textArea.textContent; // Get raw text
    const cursorPosition = getCursorPosition(textArea);

    // Get the last word before the cursor
    const words = text.slice(0, cursorPosition).split(/\s+/);
    const lastWord = words[words.length - 1]; // The most recent word

    if (lastWord.startsWith('/') && lastWord.length > 1) {
        console.log(`Slash detected: "${lastWord}". Showing dropdown...`);
        console.log("📌 handleSlashInput Note Object:", note);

        showDropdown(textArea, note, lastWord);
    } else {
        removeDropdown(); // Remove if invalid
    }
}


function showDropdown(textArea, currentNote, searchTerm) {
    removeDropdown(); // Remove any existing dropdown first

    console.log(`Showing dropdown for search term: "${searchTerm}" in note ID: ${currentNote.id}`);

    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';
    dropdown.style.position = 'absolute';
    dropdown.style.zIndex = '1000'; // Ensure it's above everything

    // Find notes that match the search term
    const filteredNotes = notes.filter(note => 
        note.id !== currentNote.id && note.title.toLowerCase().includes(searchTerm.substring(1).toLowerCase())
    );

    if (filteredNotes.length === 0) {
        console.log("No matching notes found.");
        return;
    }

    filteredNotes.forEach((linkedNote) => {
        const option = document.createElement('div');
        option.className = 'dropdown-option';
        option.textContent = linkedNote.title || 'Untitled';

        option.addEventListener('click', () => {
            console.log(`Selected note: ${linkedNote.title} (ID: ${linkedNote.id})`);
            currentNote.links.set(linkedNote.title, linkedNote.id); // Store as a link
            console.log("📌 showDropdown Note Object:", currentNote);

            insertNoteTitleAtSlash(textArea, linkedNote, searchTerm, currentNote);

            removeDropdown();
        });

        dropdown.appendChild(option);
    });

    // Position at the cursor
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    dropdown.style.left = `${rect.left}px`;
    dropdown.style.top = `${rect.bottom + window.scrollY}px`;

    document.body.appendChild(dropdown);

    // Close dropdown if user clicks outside
    document.addEventListener('click', removeDropdown, { once: true });
}

function removeDropdown() {
    const existingDropdown = document.querySelector('.dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
}

function insertNoteTitleAtSlash(textArea, linkedNote, searchTerm, currentNote) {
    console.log(`🛠 Inserting linked note as plain text: "${linkedNote.title}"`);

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    // Define the replacement text (*title*)
    const replacementText = `*${linkedNote.title}*`;

    // Find the /searchTerm in the textArea
    const textNodes = Array.from(textArea.childNodes);
    for (let node of textNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.includes(searchTerm)) {
            const fullText = node.textContent;
            const index = fullText.indexOf(searchTerm);

            // Split text into three parts
            const beforeText = fullText.substring(0, index);  // Before `/searchTerm`
            const afterText = fullText.substring(index + searchTerm.length);  // After `/searchTerm`

            // Create separate nodes
            const beforeNode = document.createTextNode(beforeText);
            const replacementNode = document.createTextNode(replacementText); // This replaces /title
            const afterNode = document.createTextNode(afterText || " "); // Ensures spacing

            // Replace the original text node
            textArea.replaceChild(afterNode, node);
            textArea.insertBefore(replacementNode, afterNode);
            textArea.insertBefore(beforeNode, replacementNode);

            // Move cursor after the new replacement text
            restoreCursorPosition(textArea, replacementNode);
            break;
        }
    }

    // Update content in the note object
    currentNote.content = textArea.innerHTML;
    console.log(`✅ Updated note content: "${currentNote.content}"`);
}


function processTextWithLinks(text, note) {
    console.log("📝 Processing text for link replacement...");
    
    // Regex pattern to find words starting with "/"
    const tagPattern = /\/(\w+)/g;

    return text.replace(tagPattern, (match, title) => {
        if (note.links.has(`/${title}`)) {
            const linkedNoteId = note.links.get(`/${title}`);
            console.log(`🔗 Found match: "${match}" -> Replacing with linked span`);

            return `<span class="linked-note" data-linked-id="${linkedNoteId}">*${title}*</span>`;
        }
        return match; // Leave unchanged if not a linked note
    });
}


function getCursorPosition(contentEditable) {
    let position = 0; // Default to the start of the content
    const selection = window.getSelection();

    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0); // Get the current range
        const preRange = range.cloneRange(); // Clone the range to preserve selection
        preRange.selectNodeContents(contentEditable); // Select the entire content of the element
        preRange.setEnd(range.endContainer, range.endOffset); // Set the end point of the range to the cursor position
        position = preRange.toString().length; // Calculate the length of text before the cursor
    }

    return position;
}

function restoreCursorPosition(textArea) {
    const selection = window.getSelection();
    const range = document.createRange();

    if (textArea.lastChild) {
        range.setStartAfter(textArea.lastChild); // Move cursor after the last node
    } else {
        range.setStart(textArea, 0); // Default position
    }

    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}






// Handle container click to create a note
document.getElementById('note-container').addEventListener('click', (event) => {
    if (event.target.closest('.note')) return;

    const containerRect = document.getElementById('note-container').getBoundingClientRect();
    createNote(event.clientX - containerRect.left, event.clientY - containerRect.top);
});


document.getElementById('log-notes-button').addEventListener('click', () => {
    console.log('Current Notes:', notes);
});