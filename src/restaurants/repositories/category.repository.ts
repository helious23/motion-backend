import { EntityRepository, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

/**
 * Custum Repository 생성
 *
 * 기존 Repository 를 class 형태로 만들어 service class 에 DI,
 *
 * module 의 imports 에도 CategoryRepository 로 변경
 */
@EntityRepository(Category)
export class CategoryRepository extends Repository<Category> {
  /**
   * categoryname 을 slug 형태로 변환하여 기존 category 에 있으면 category 를 리턴
   *
   * 기존 category 에 없으면 새로운 category 를 만들어 category를 리턴
   */
  async getOrCreate(name: string): Promise<Category> {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');
    let category = await this.findOne({ slug: categorySlug });
    if (!category) {
      category = await this.save(
        this.create({ slug: categorySlug, name: categoryName }),
      );
    }
    return category;
  }
}
