-- CreateTable
CREATE TABLE `character` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `work_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `role` VARCHAR(100) NULL,
    `age` VARCHAR(50) NULL,
    `occupation` VARCHAR(100) NULL,
    `summary` VARCHAR(300) NULL,
    `goal` TEXT NULL,
    `trauma` TEXT NULL,
    `weakness` TEXT NULL,
    `lack` TEXT NULL,
    `quote` TEXT NULL,
    `sort_order` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `character_work_id_sort_order_idx`(`work_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `character` ADD CONSTRAINT `character_work_id_fkey` FOREIGN KEY (`work_id`) REFERENCES `work`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
