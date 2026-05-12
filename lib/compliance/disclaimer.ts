import { FIRST_MESSAGE_DISCLAIMER, FOOTER_DISCLAIMER } from "./constants";

export function appendDisclaimer(text: string, isFirstMessage: boolean): string {
  let finalResponse = text;

  // If it's the very first message from the user to the bot
  if (isFirstMessage) {
    finalResponse = `${FIRST_MESSAGE_DISCLAIMER}\n\n${finalResponse}`;
  }

  // Always append footer
  finalResponse = `${finalResponse}\n\n${FOOTER_DISCLAIMER}`;

  return finalResponse;
}
