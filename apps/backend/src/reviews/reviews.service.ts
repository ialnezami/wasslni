import { Injectable } from '@nestjs/common';
import { ReviewsRepository } from './repositories/reviews.repository';

@Injectable()
export class ReviewsService {
  constructor(private readonly reviewsRepository: ReviewsRepository) {}

  findForUser(userId: string) {
    return this.reviewsRepository.findByReviewee(userId);
  }
}
