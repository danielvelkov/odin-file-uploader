import Dropdown from './dynamic-ui/dropdown/dropdown.js';
import DropDownAction from './dynamic-ui/dropdown/dropdown-action.js';

customElements.define('drop-down', Dropdown);
customElements.define('drop-down-action', DropDownAction);

const addFolderButton = document.getElementById('addFolderButton');
const addFolderForm = document.getElementById('addFolderForm');
const closeFolderForm = document.getElementById('closeFolderForm');

addFolderButton.addEventListener('click', () => {
  addFolderForm.removeAttribute('hidden');
  addFolderButton.toggleAttribute('hidden');
});

closeFolderForm.addEventListener('click', () => {
  addFolderForm.hidden = true;
  addFolderButton.toggleAttribute('hidden');
});
