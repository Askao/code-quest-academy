/**
 * Turns whatever a student typed into a join code: the code itself
 * ("abc234", " ABC 234 "), or the whole invite link their teacher sent
 * ("https://www.hcodeacademy.co.uk/join/ABC234"). Codes are six characters
 * from an alphabet without the look-alikes (no 0/O, 1/I/L), so those are
 * rejected up front with a clearer message than "no class found".
 */
const CODE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;

export type ParsedCode = { ok: true; code: string } | { ok: false; error: string };

export function parseJoinCode(input: string): ParsedCode {
  let text = input.trim();
  const link = text.match(/\/join\/([^/?#\s]+)/i);
  if (link) text = link[1]!;
  const code = text.replace(/[\s-]/g, "").toUpperCase();
  if (!code) return { ok: false, error: "Type the join code your teacher gave you." };
  if (!CODE.test(code)) {
    return {
      ok: false,
      error: "That doesn't look like a join code - it's 6 letters and numbers, like K7M2XQ.",
    };
  }
  return { ok: true, code };
}
