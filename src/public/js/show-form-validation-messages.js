const form = document.querySelector('form');

function showErrorMessage(e) {
  if (
    !e.target.id ||
    (e.target.tagName !== 'INPUT' &&
      e.target.tagName !== 'SELECT' &&
      e.target.tagName !== 'TEXTAREA')
  )
    return;
  const errorElement = document.querySelector(`#${e.target.id} ~ span.error`);

  if (!errorElement) return;
  let formElement = e.target;
  if (formElement.validity.valid) {
    errorElement.textContent = '';
    errorElement.classList.add('invisible');
    return;
  }

  if (formElement.validity.valueMissing) {
    errorElement.textContent = 'Value for field required.';
  } else if (formElement.validity.tooShort) {
    errorElement.textContent = 'Value for field too short.';
  } else {
    errorElement.textContent = formElement.validationMessage;
  }
  errorElement.classList.remove('invisible');
}
form.addEventListener('focusout', showErrorMessage);
form.addEventListener('input', showErrorMessage);
