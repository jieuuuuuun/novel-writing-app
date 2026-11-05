import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateSynopsisDto } from './dto/create-synopsis.dto.js';
import type { UpdateSynopsisDto } from './dto/update-synopsis.dto.js';
import type {
  SynopsisCurrentIdResponse,
  SynopsisCurrentResponse,
  SynopsisDeleteResponse,
  SynopsisDetailResponse,
  SynopsisListResponse,
} from './synopsis.types.js';

const TITLE_MAX_LENGTH = 100;
const FIRST_TITLE = '초고';
const NEXT_TITLE = '새 버전';
const COPY_SUFFIX = ' 복사';
const LIST_ORDER = {
  orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
};
const BODY_FIELDS = [
  'summary',
  'beginning',
  'development',
  'crisis',
  'ending',
  'memo',
] as const;

interface OwnedWork {
  id: number;
  currentSynopsisVersionId: number | null;
}

interface SynopsisRecord {
  id: number;
  workId: number;
  title: string;
  summary: string | null;
  beginning: string | null;
  development: string | null;
  crisis: string | null;
  ending: string | null;
  memo: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ParsedSynopsisUpdate {
  title?: string;
  summary?: string;
  beginning?: string;
  development?: string;
  crisis?: string;
  ending?: string;
  memo?: string;
}

@Injectable()
export class SynopsisService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    workId: number,
    userId: number,
  ): Promise<SynopsisListResponse> {
    const work = await this.assertWorkOwned(workId, userId);
    const items = await this.prisma.synopsisVersion.findMany({
      where: { workId },
      ...LIST_ORDER,
      select: {
        id: true,
        title: true,
        sortOrder: true,
        updatedAt: true,
      },
    });

    return {
      currentId: work.currentSynopsisVersionId,
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        sortOrder: item.sortOrder,
        isCurrent: work.currentSynopsisVersionId === item.id,
        updatedAt: item.updatedAt,
      })),
    };
  }

  async findCurrent(
    workId: number,
    userId: number,
  ): Promise<SynopsisCurrentResponse> {
    const work = await this.assertWorkOwned(workId, userId);

    if (work.currentSynopsisVersionId == null) {
      return { current: null };
    }

    const synopsis = await this.prisma.synopsisVersion.findFirst({
      where: {
        id: work.currentSynopsisVersionId,
        workId,
      },
    });

    if (!synopsis) {
      return { current: null };
    }

    return {
      current: this.toDetailResponse(synopsis, work.currentSynopsisVersionId),
    };
  }

  async findOne(
    workId: number,
    synopsisId: number,
    userId: number,
  ): Promise<SynopsisDetailResponse> {
    const work = await this.assertWorkOwned(workId, userId);
    const synopsis = await this.findOwnedSynopsis(workId, synopsisId);

    return this.toDetailResponse(synopsis, work.currentSynopsisVersionId);
  }

  async create(
    workId: number,
    userId: number,
    createSynopsisDto: CreateSynopsisDto = {},
  ): Promise<SynopsisDetailResponse> {
    const work = await this.assertWorkOwned(workId, userId);
    const requestedTitle = this.parseOptionalTitle(createSynopsisDto.title);

    const result = await this.prisma.$transaction(async (tx) => {
      const count = await tx.synopsisVersion.count({
        where: { workId },
      });
      const aggregate = await tx.synopsisVersion.aggregate({
        where: { workId },
        _max: { sortOrder: true },
      });
      const isFirst = count === 0;
      const created = await tx.synopsisVersion.create({
        data: {
          workId,
          title: requestedTitle ?? (isFirst ? FIRST_TITLE : NEXT_TITLE),
          sortOrder: (aggregate._max.sortOrder ?? -1) + 1,
        },
      });

      if (isFirst) {
        await tx.work.update({
          where: { id: workId },
          data: { currentSynopsisVersionId: created.id },
        });
      }

      return {
        created,
        currentId: isFirst ? created.id : work.currentSynopsisVersionId,
      };
    });

    return this.toDetailResponse(result.created, result.currentId);
  }

  async update(
    workId: number,
    synopsisId: number,
    userId: number,
    updateSynopsisDto: UpdateSynopsisDto,
  ): Promise<SynopsisDetailResponse> {
    const work = await this.assertWorkOwned(workId, userId);
    await this.findOwnedSynopsis(workId, synopsisId);
    const parsed = this.parseUpdate(updateSynopsisDto);

    const synopsis =
      Object.keys(parsed).length === 0
        ? await this.findOwnedSynopsis(workId, synopsisId)
        : await this.prisma.synopsisVersion.update({
            where: { id: synopsisId },
            data: parsed,
          });

    return this.toDetailResponse(synopsis, work.currentSynopsisVersionId);
  }

  async duplicate(
    workId: number,
    synopsisId: number,
    userId: number,
    createSynopsisDto: CreateSynopsisDto = {},
  ): Promise<SynopsisDetailResponse> {
    const work = await this.assertWorkOwned(workId, userId);
    const source = await this.findOwnedSynopsis(workId, synopsisId);
    const requestedTitle = this.parseOptionalTitle(createSynopsisDto.title);

    const synopsis = await this.prisma.$transaction(async (tx) => {
      const aggregate = await tx.synopsisVersion.aggregate({
        where: { workId },
        _max: { sortOrder: true },
      });

      return tx.synopsisVersion.create({
        data: {
          workId,
          title: requestedTitle ?? this.copyTitle(source.title),
          summary: source.summary,
          beginning: source.beginning,
          development: source.development,
          crisis: source.crisis,
          ending: source.ending,
          memo: source.memo,
          sortOrder: (aggregate._max.sortOrder ?? -1) + 1,
        },
      });
    });

    return this.toDetailResponse(synopsis, work.currentSynopsisVersionId);
  }

  async setCurrent(
    workId: number,
    synopsisId: number,
    userId: number,
  ): Promise<SynopsisCurrentIdResponse> {
    await this.assertWorkOwned(workId, userId);
    await this.findOwnedSynopsis(workId, synopsisId);

    await this.prisma.$transaction(async (tx) => {
      await tx.work.update({
        where: { id: workId },
        data: { currentSynopsisVersionId: synopsisId },
      });
    });

    return { currentId: synopsisId };
  }

  async remove(
    workId: number,
    synopsisId: number,
    userId: number,
  ): Promise<SynopsisDeleteResponse> {
    const work = await this.assertWorkOwned(workId, userId);
    await this.findOwnedSynopsis(workId, synopsisId);
    const isCurrent = work.currentSynopsisVersionId === synopsisId;

    return this.prisma.$transaction(async (tx) => {
      if (isCurrent) {
        await tx.work.update({
          where: { id: workId },
          data: { currentSynopsisVersionId: null },
        });
      }

      await tx.synopsisVersion.delete({
        where: { id: synopsisId },
      });

      if (!isCurrent) {
        return {
          deletedId: synopsisId,
          currentId: work.currentSynopsisVersionId,
        };
      }

      const next = await tx.synopsisVersion.findFirst({
        where: { workId },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      });

      if (!next) {
        return {
          deletedId: synopsisId,
          currentId: null,
        };
      }

      await tx.work.update({
        where: { id: workId },
        data: { currentSynopsisVersionId: next.id },
      });

      return {
        deletedId: synopsisId,
        currentId: next.id,
      };
    });
  }

  private async assertWorkOwned(
    workId: number,
    userId: number,
  ): Promise<OwnedWork> {
    const work = await this.prisma.work.findFirst({
      where: {
        id: workId,
        userId,
      },
      select: {
        id: true,
        currentSynopsisVersionId: true,
      },
    });

    if (!work) {
      throw new NotFoundException('Work not found.');
    }

    return work;
  }

  private async findOwnedSynopsis(workId: number, synopsisId: number) {
    const synopsis = await this.prisma.synopsisVersion.findFirst({
      where: {
        id: synopsisId,
        workId,
      },
    });

    if (!synopsis) {
      throw new NotFoundException('Synopsis not found.');
    }

    return synopsis;
  }

  private parseOptionalTitle(title: string | undefined) {
    if (title == null) {
      return undefined;
    }

    return this.parseTitle(title);
  }

  private parseTitle(title: string) {
    const parsed = this.parseBoundedString(title, 'title', TITLE_MAX_LENGTH).trim();

    if (!parsed) {
      throw new BadRequestException('title is required.');
    }

    return parsed;
  }

  private parseUpdate(dto: UpdateSynopsisDto): ParsedSynopsisUpdate {
    const parsed: ParsedSynopsisUpdate = {};

    if (dto.title !== undefined) {
      parsed.title = this.parseTitle(dto.title);
    }

    for (const field of BODY_FIELDS) {
      if (dto[field] !== undefined) {
        parsed[field] = this.parseText(dto[field], field);
      }
    }

    return parsed;
  }

  private copyTitle(original: string) {
    if (original.length + COPY_SUFFIX.length <= TITLE_MAX_LENGTH) {
      return `${original}${COPY_SUFFIX}`;
    }

    return `${original.slice(0, TITLE_MAX_LENGTH - COPY_SUFFIX.length)}${COPY_SUFFIX}`;
  }

  private toDetailResponse(
    synopsis: SynopsisRecord,
    currentId: number | null,
  ): SynopsisDetailResponse {
    return {
      id: synopsis.id,
      workId: synopsis.workId,
      title: synopsis.title,
      summary: synopsis.summary ?? '',
      beginning: synopsis.beginning ?? '',
      development: synopsis.development ?? '',
      crisis: synopsis.crisis ?? '',
      ending: synopsis.ending ?? '',
      memo: synopsis.memo ?? '',
      sortOrder: synopsis.sortOrder,
      isCurrent: currentId === synopsis.id,
      createdAt: synopsis.createdAt,
      updatedAt: synopsis.updatedAt,
    };
  }

  private parseBoundedString(
    value: string | undefined,
    fieldName: string,
    maxLength: number,
  ) {
    const parsed = this.parseText(value, fieldName);

    if (parsed.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} must be at most ${maxLength} characters.`,
      );
    }

    return parsed;
  }

  private parseText(value: string | undefined, fieldName: string) {
    if (value == null) {
      return '';
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} must be a string.`);
    }

    return value;
  }
}
