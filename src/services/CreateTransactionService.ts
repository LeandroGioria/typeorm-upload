import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const existCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    let categoryId;

    if (existCategory) {
      categoryId = existCategory.id;
    } else {
      const newCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(newCategory);
      categoryId = newCategory.id;
    }

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Invalid type');
    }

    if (type === 'outcome') {
      const balance = await transactionsRepository.getBalance();
      if (value > balance.total) {
        throw new AppError('Invalid balance value');
      }
    }

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category_id: categoryId,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
