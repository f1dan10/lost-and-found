/**
 * Every category, in the order the chips show them, with its label and the name of its icon. This file imports
 * nothing, so plain functions such as the search can use the labels and still be tested with `bun test`.
 */
export const CATEGORIES = [
  { value: "BOTTLE", label: "Bottle", icon: "bottle" },
  { value: "CLOTHING", label: "Clothing", icon: "clothing" },
  { value: "ELECTRONICS", label: "Electronics", icon: "electronics" },
  { value: "KEYS_ID", label: "Keys / ID", icon: "keys" },
  { value: "BAG", label: "Bag", icon: "bag" },
  { value: "JEWELRY", label: "Jewelry", icon: "jewelry" },
  { value: "OTHER", label: "Other", icon: "other" },
] as const;

/** The label for a category, such as "Keys / ID" for KEYS_ID. */
export function categoryLabel(category: string): string {
  return CATEGORIES.find((entry) => entry.value === category)?.label ?? category;
}
