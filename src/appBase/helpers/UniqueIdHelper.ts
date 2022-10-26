export class UniqueIdHelper {

  static chars = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0",
    "-", "_"];

  static alphanumericChars = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  public static isMissing(obj: any) {
    if (obj === undefined || obj === null) return true;
    else if (obj.toString() === "") return true;
    else return false;
  }

  public static shortId() {
    return this.generate(UniqueIdHelper.chars, 11);
  }

  public static generateAlphanumeric() {
    return this.generate(UniqueIdHelper.alphanumericChars, 11);
  }

  public static generate(charList: string[], length: number) {
    let result = "";
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * charList.length);
      const c = charList[idx];
      result += c;
    }
    return result;
  }

}
