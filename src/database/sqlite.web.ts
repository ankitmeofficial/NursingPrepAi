/**
 * Web implementation of getNativeSQLiteDatabase.
 * Returns null so that AsyncStorage is used seamlessly on web without wasm bundler errors.
 */
export async function getNativeSQLiteDatabase(): Promise<any> {
  return null;
}
