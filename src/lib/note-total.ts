const amountLinePattern = /^([+-]?)(\d+)(?:\.(\d{1,2}))?(?:\s.*)?$/;
const ignoredSectionMarker = "///";

export function parseNoteLineAmountInCents(line: string) {
  const match = amountLinePattern.exec(line);
  if (!match) {
    return null;
  }

  const [, sign, wholeAmount, fractionalAmount = ""] = match;
  const cents = Number(wholeAmount) * 100 + Number(fractionalAmount.padEnd(2, "0"));

  if (!Number.isSafeInteger(cents)) {
    return null;
  }

  return sign === "-" ? -cents : cents;
}

export function calculateNoteTotalInCents(body: string) {
  let totalInCents = 0;

  for (const line of body.split(/\r?\n/)) {
    if (line.trimStart().startsWith(ignoredSectionMarker)) {
      break;
    }

    totalInCents += parseNoteLineAmountInCents(line) ?? 0;
  }

  return totalInCents;
}
