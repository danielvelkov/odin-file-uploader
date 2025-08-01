export default class Dropdown extends HTMLElement {
  #dropDownListMenu;

  constructor() {
    super();
  }

  connectedCallback() {
    this.initDropDown();
  }

  get dropDownListMenu() {
    return this.#dropDownListMenu;
  }

  toggleDropDown() {
    this.#dropDownListMenu.classList.toggle('visible');
  }

  createDropDownList() {
    const dropDownList = document.createElement('ul');
    dropDownList.className = 'dropdown-list';
    dropDownList.append(document.createElement('slot'));

    document.addEventListener('click', (e) => {
      if (e.target !== this) dropDownList.classList.remove('visible');
    });

    document.addEventListener('scroll', () => {
      dropDownList.classList.remove('visible');
    });

    dropDownList.addEventListener('click', () => {
      this.toggleDropDown();
    });

    return dropDownList;
  }

  initDropDown() {
    const shadow = this.attachShadow({ mode: 'open' });

    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'dropdown');

    const icon = document.createElement('span');
    icon.setAttribute('class', 'icon');
    icon.setAttribute('tabindex', 0);
    icon.setAttribute('aria-label', 'Open dropdown');

    const img = document.createElement('img');
    img.setAttribute('aria-label', 'Menu bar');
    img.src = '/icons/bars.svg';
    icon.appendChild(img);

    const style = document.createElement('style');
    style.textContent = `
    .dropdown {
      position: relative;
      text-align: center;
      width: 1.2em;
      height: 1.2em;
    }

    .dropdown-list {
      padding: 0px;
      display: none;
      position: fixed;
      border: 1px solid black;
      border-radius: 0.125em;
      top: 0;
      left: 0;
      z-index: 1000;
    } 

    .dropdown-list.visible {
      display: inline-flex;
      flex-direction: column;
    }

    img {
      width:20px;
      height:20px;
    }
    `;

    shadow.appendChild(style);
    shadow.appendChild(wrapper);
    wrapper.appendChild(icon);

    this.#dropDownListMenu = this.createDropDownList();
    wrapper.appendChild(this.#dropDownListMenu);

    // Add event listener to toggle dropdown visibility
    wrapper.addEventListener('click', () => {
      this.toggleDropDown();
      const rect = wrapper.getBoundingClientRect();
      const dropdown = this.#dropDownListMenu;
      const dropdownWidth = dropdown.offsetWidth;
      const viewportWidth = window.innerWidth;

      let left = rect.left;

      // If dropdown would overflow to the right, align it to the left edge
      if (left + dropdownWidth > viewportWidth) {
        left = viewportWidth - dropdownWidth - 10; // Adjust with margin
      }

      dropdown.style.top = `${rect.top}px`;
      dropdown.style.left = `${left}px`;
    });
  }
}
