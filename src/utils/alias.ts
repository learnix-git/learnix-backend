export function generateAlias(name: string): string {
  // Convert name to slug
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "")
    .replace(/(\s+)/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Generate random xxx-yyy-zzz
  const randomChars = () => Math.random().toString(36).substring(2, 5);
  const suffix = `${randomChars()}-${randomChars()}-${randomChars()}`;

  return `${slug}-${suffix}`;
}
