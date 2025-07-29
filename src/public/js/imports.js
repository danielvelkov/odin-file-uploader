import Dropdown from './dynamic-ui/dropdown/dropdown.js';
import DropDownAction from './dynamic-ui/dropdown/dropdown-action.js';

customElements.define('drop-down', Dropdown);
customElements.define('drop-down-action', DropDownAction);

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('drop-down').forEach((el) => {
    const currentDisplay = getComputedStyle(el).display;
    el.style.display = currentDisplay === 'none' ? 'inline-block' : 'none';
  });
  document.querySelectorAll('drop-down-action').forEach((el) => {
    const currentDisplay = getComputedStyle(el).display;
    el.style.display = currentDisplay === 'none' ? 'inline-block' : 'none';
  });
});
