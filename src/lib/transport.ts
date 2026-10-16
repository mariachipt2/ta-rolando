type Transport = (path: string, init?: RequestInit) => Promise<Response>;
let adapter: Transport | undefined;
let staticMode = false;
export function configureTransport(transport: Transport) {
  adapter = transport;
  staticMode = true;
}
export function request(path: string, init?: RequestInit) {
  return adapter ? adapter(path, init) : fetch(path, init);
}
export function navigate(path: string) {
  if (staticMode) {
    location.hash = path;
    if (location.hash === "#" + path)
      window.dispatchEvent(new Event("tr:refresh"));
  } else location.href = path;
}
