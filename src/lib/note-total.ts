const amountLinePattern = /^([+-]?)(\d+)(?:\.(\d{1,2}))?(?:\s.*)?$/;

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
  return body.split(/\r?\n/).reduce((total, line) => {
    return total + (parseNoteLineAmountInCents(line) ?? 0);
  }, 0);
}
