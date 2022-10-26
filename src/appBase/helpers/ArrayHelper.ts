import { UniqueIdHelper } from "./UniqueIdHelper";

export class ArrayHelper {
  static getIds(array: any[], propertyName: string) {
    const result: string[] = [];
    for (const item of array) {
      const id = item[propertyName]?.toString();
      if (!UniqueIdHelper.isMissing(id) && result.indexOf(id) === -1) result.push(id);
    }
    return result;
  }

  static getIndex(array: any[], propertyName: string, value: any) {
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      if (ArrayHelper.compare(item, propertyName, value)) return i;
    }
    return -1;
  }

  static getOne(array: any[], propertyName: string, value: any) {
    for (const item of array || []) if (ArrayHelper.compare(item, propertyName, value)) return item;
    return null
  }

  static getAll(array: any[], propertyName: string, value: any) {
    const result: any[] = []
    for (const item of array || []) {
      if (ArrayHelper.compare(item, propertyName, value)) result.push(item);
    }
    return result;
  }

  static getAllArray(array: any[], propertyName: string, values: any[]) {
    const result: any[] = []
    for (const item of array || []) if (values.indexOf(item[propertyName]) > -1) result.push(item);
    return result;
  }

  private static compare(item: any, propertyName: string, value: any) {
    const propChain = propertyName.split(".");
    if (propChain.length === 1) return item[propertyName] === value;
    else {
      let obj = item;
      for (let i = 0; i < propChain.length - 1; i++) {
        if (obj) obj = item[propChain[i]];
      }
      return obj[propChain[propChain.length - 1]] === value;
    }
  }

  static getUniqueValues(array: any[], propertyName: string) {
    const result: any[] = [];

    for (const item of array) {
      const val = (propertyName.indexOf(".") === -1) ? item[propertyName] : this.getDeepValue(item, propertyName)
      if (result.indexOf(val) === -1) result.push(val);
    }
    return result;
  }

  static getDeepValue(item: any, propertyName: string) {
    const propertyNames = propertyName.split(".");
    let result: any = item;
    propertyNames.forEach(name => {
      result = result[name];
    });
    return result;
  }

}
