-- AlterTable
ALTER TABLE `work` ADD COLUMN `current_synopsis_version_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `synopsis_version` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `work_id` INTEGER NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `summary` TEXT NULL,
    `beginning` TEXT NULL,
    `development` TEXT NULL,
    `crisis` TEXT NULL,
    `ending` TEXT NULL,
    `memo` TEXT NULL,
    `sort_order` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `synopsis_version_work_id_sort_order_idx`(`work_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `work_current_synopsis_version_id_key` ON `work`(`current_synopsis_version_id`);

-- AddForeignKey
ALTER TABLE `work` ADD CONSTRAINT `work_current_synopsis_version_id_fkey` FOREIGN KEY (`current_synopsis_version_id`) REFERENCES `synopsis_version`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `synopsis_version` ADD CONSTRAINT `synopsis_version_work_id_fkey` FOREIGN KEY (`work_id`) REFERENCES `work`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
