/**
 * Web fallback for SQLite database.
 * Returns null so that AsyncStorage is used seamlessly on web.
 */
export async function getNativeSQLiteDatabase(): Promise<any> {
  return null;
}
