export function splitString(input: string, maxLength: number): string[] {
  const words = input.split(/\s+/); // Split the string by whitespace

  const result: string[] = [];
  let currentString = "";

  words.forEach((word) => {
    if ((currentString + word).length <= maxLength) {
      currentString += word + " ";
    } else {
      result.push(currentString.trim());
      currentString = word + " ";
    }
  });

  // Push the last accumulated string
  if (currentString.length > 0) {
    result.push(currentString.trim());
  }

  return result;
}
