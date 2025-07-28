/* eslint-disable @typescript-eslint/no-unused-vars */
function cancelEditSelectedFromClick(type) {
  document.getElementById(`add-${type}-form`).hidden = true;
  document.getElementById(`add-${type}-button`).toggleAttribute('hidden');
}

function startEditFromClick(type) {
  document.getElementById(`add-${type}-form`).removeAttribute('hidden');
  document.getElementById(`add-${type}-button`).toggleAttribute('hidden');
}

function handleUpdateFormKeydown(event, type, id) {
  if (event.key === 'Escape') {
    event.preventDefault();
    cancelEditSelectedFromOptions(event, type, id);
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    document.getElementById(`update-${type}-form-${id}`).submit();
  }
}

function cancelEditSelectedFromOptions(event, type, id) {
  event.preventDefault();
  document.getElementById(`update-${type}-form-${id}`).hidden = true;
  document.getElementById(`${type}-nav-button-${id}`).toggleAttribute(`hidden`);
  document.getElementById(`${type}-options-${id}`).toggleAttribute(`hidden`);
}

function startEditFromOptions(event, type, id) {
  event.preventDefault();
  const form = document.getElementById(`update-${type}-form-${id}`);
  form.removeAttribute(`hidden`);
  document.getElementById(`${type}-nav-button-${id}`).toggleAttribute(`hidden`);
  document.getElementById(`${type}-options-${id}`).toggleAttribute(`hidden`);
  const input = form.querySelector(`input`);
  const length = input.value.length;
  input.focus();
  input.setSelectionRange(length, length);
}
