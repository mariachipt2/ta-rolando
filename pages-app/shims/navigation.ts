export function useRouter() {
  return {
    refresh: () => window.dispatchEvent(new Event("tr:refresh")),
    push: (path: string) => {
      location.hash = path;
    },
  };
}
