/**
 * @description User-Service parameters
 */
export interface IUserOptions {
  uid: number;
}

/**
 * @description Transaction record interface
 */
export interface IRecord {
  id: string;
  typeId: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  remark?: string;
}

/**
 * @description Create record options
 */
export interface ICreateRecordOptions {
  userId: number;
  typeId: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  remark?: string;
}

/**
 * @description Update record options
 */
export interface IUpdateRecordOptions {
  id: string;
  typeId?: string;
  date?: string;
  amount?: number;
  type?: 'income' | 'expense';
  remark?: string;
}
