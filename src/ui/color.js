export function syncColor(hex) {
  const v = hex || '#ffffff';
  const cp = document.getElementById('colorPicker');
  const cpl = document.getElementById('colorPickerLarge');
  const hexInput = document.getElementById('hexInput');
  if (cp) cp.value = v;
  if (cpl) cpl.value = v;
  if (hexInput) hexInput.value = v;
}

export default syncColor;
