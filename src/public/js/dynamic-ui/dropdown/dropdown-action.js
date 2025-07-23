export default class DropDownAction extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Set default style
    this.style.fontFamily = 'inherit';
    this.style.fontSize = '1rem';
    this.style.boxShadow = '0px 0.1em 0.2em 0px rgba(0,0,0,0.1)';
    this.style.textAlign = 'start';
    this.style.paddingLeft = '0.5em';
    this.style.paddingRight = '1em';
    this.style.paddingTop = '0.5em';
    this.style.whiteSpace = 'nowrap';

    // Add event listeners for mouseover and mouseout
    this.addEventListener('mouseover', () => {
      this.style.backgroundColor = '#a5a5a5';
    });

    this.addEventListener('mouseout', () => {
      this.style.backgroundColor = '';
      this.style.color = '';
    });
  }
}
