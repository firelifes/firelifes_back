import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Record } from '../entity/record.entity';
import { ICreateRecordOptions, IUpdateRecordOptions } from '../interface';

@Provide()
export class RecordService {
  @InjectEntityModel(Record)
  recordModel: Repository<Record>;

  async createRecord(options: ICreateRecordOptions): Promise<Record> {
    const record = this.recordModel.create({
      typeId: options.typeId,
      date: options.date,
      amount: options.amount,
      type: options.type,
      remark: options.remark || '',
    });
    return this.recordModel.save(record);
  }

  async updateRecord(options: IUpdateRecordOptions): Promise<Record | null> {
    const record = await this.recordModel.findOne({ where: { id: options.id } });
    if (!record) {
      return null;
    }

    if (options.typeId !== undefined) record.typeId = options.typeId;
    if (options.date !== undefined) record.date = options.date;
    if (options.amount !== undefined) record.amount = options.amount;
    if (options.type !== undefined) record.type = options.type;
    if (options.remark !== undefined) record.remark = options.remark;

    return this.recordModel.save(record);
  }

  async getRecordById(id: number): Promise<Record | null> {
    return this.recordModel.findOne({ where: { id } });
  }

  async getAllRecords(): Promise<Record[]> {
    return this.recordModel.find({
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async getRecordsByUserId(userId: number): Promise<Record[]> {
    return this.recordModel.find({
      where: { userId },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async deleteRecord(id: number): Promise<boolean> {
    const result = await this.recordModel.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
