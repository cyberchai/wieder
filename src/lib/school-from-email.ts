// Map an email address to the school/organization it belongs to, for the
// profile "campus" stat. Known domains win; otherwise we title-case the domain
// label so any .edu still reads as a place.

const KNOWN_SCHOOLS: Record<string, string> = {
  "smith.edu": "Smith College",
  "mtholyoke.edu": "Mount Holyoke College",
  "amherst.edu": "Amherst College",
  "hampshire.edu": "Hampshire College",
  "umass.edu": "UMass Amherst",
  "unis.org": "UNIS",
  "gmail.com": "Independent",
  "outlook.com": "Independent",
  "icloud.com": "Independent",
};

export interface SchoolInfo {
  name: string;
  domain: string;
}

export function schoolFromEmail(email?: string | null): SchoolInfo {
  if (!email || !email.includes("@")) {
    return { name: "Independent", domain: "" };
  }

  const domain = email.split("@")[1]?.toLowerCase().trim() ?? "";
  const known = KNOWN_SCHOOLS[domain];
  if (known) {
    return { name: known, domain };
  }

  // Derive a readable name from the domain's main label (e.g. "berkeley.edu" → "Berkeley")
  const parts = domain.split(".");
  const label = parts.length >= 2 ? parts[parts.length - 2] : parts[0] || "";
  const titled = label ? label.charAt(0).toUpperCase() + label.slice(1) : "Independent";

  return { name: titled, domain };
}
