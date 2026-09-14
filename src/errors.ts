/** Thrown when save bytes do not match the expected layout. */
export class SaveFormatError extends Error {
  override name = "SaveFormatError";
}
