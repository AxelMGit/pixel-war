export function qs(id) {
  return document.getElementById(id);
}

export function shorten(addr) {
  if (!addr) return '--';
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

export default { qs, shorten };
