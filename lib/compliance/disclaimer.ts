import { getFirstMessageDisclaimer, FOOTER_DISCLAIMER } from "./constants";

export function appendDisclaimer(text: string, isFirstMessage: boolean, hospitalName: string = "Our Hospital"): string {
  let finalResponse = text;

  // If it's the very first message from the user to the bot
  if (isFirstMessage) {
    finalResponse = `${getFirstMessageDisclaimer(hospitalName)}\n\n${finalResponse}`;
  }

  // Always append footer
  finalResponse = `${finalResponse}\n\n${FOOTER_DISCLAIMER}`;

  return finalResponse;
}
