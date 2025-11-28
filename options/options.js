// Saves options to chrome.storage
const saveOptions = () => {
    const geminiApiKey = document.getElementById('geminiApiKey').value;

    chrome.storage.sync.set(
        { geminiApiKey: geminiApiKey },
        () => {
            // Update status to let user know options were saved.
            const status = document.getElementById('status');
            status.textContent = 'Options saved.';
            status.className = 'success';
            setTimeout(() => {
                status.textContent = '';
                status.className = '';
            }, 2000);
        }
    );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
    chrome.storage.sync.get(
        { geminiApiKey: '' }, // Default value
        (items) => {
            document.getElementById('geminiApiKey').value = items.geminiApiKey;
        }
    );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
