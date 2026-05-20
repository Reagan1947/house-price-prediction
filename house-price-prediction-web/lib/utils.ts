type ClassDictionary = Record<string, unknown>;
type ClassArray = ClassValue[];
type ClassValue = string | number | null | boolean | undefined | ClassDictionary | ClassArray;

const flattenClassValue = (value: ClassValue): string[] => {
  if (!value) {
    return [];
  }

  if (typeof value === "string" || typeof value === "number") {
    return [`${value}`];
  }

  if (Array.isArray(value)) {
    return value.flatMap(flattenClassValue);
  }

  return Object.entries(value)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([className]) => className);
};

export function cn(...inputs: ClassValue[]): string {
  return inputs.flatMap(flattenClassValue).join(" ");
}
