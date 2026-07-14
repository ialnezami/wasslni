import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const UPLOADS_ROOT = join(process.cwd(), 'uploads');

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new BadRequestException('Only JPEG, PNG, or WebP images are allowed'), false);
  }
  cb(null, true);
}

export function multerConfig(subfolder: string) {
  return {
    storage: diskStorage({
      destination: join(UPLOADS_ROOT, subfolder),
      filename: (_req, file, cb) => {
        const uniqueName = randomBytes(16).toString('hex') + extname(file.originalname).toLowerCase();
        cb(null, uniqueName);
      },
    }),
    fileFilter,
    limits: { fileSize: MAX_SIZE_BYTES },
  };
}

export function toPublicUrl(subfolder: string, filename: string): string {
  return `/uploads/${subfolder}/${filename}`;
}
