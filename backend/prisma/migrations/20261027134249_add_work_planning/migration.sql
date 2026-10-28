-- CreateTable
CREATE TABLE `work_planning` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `work_id` INTEGER NOT NULL,
    `genre` VARCHAR(100) NULL,
    `subgenre` VARCHAR(100) NULL,
    `target_audience` VARCHAR(200) NULL,
    `keywords` VARCHAR(500) NULL,
    `logline` TEXT NULL,
    `introduction` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `work_planning_work_id_key`(`work_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_planning_custom_field` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `planning_id` INTEGER NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `sort_order` INTEGER NOT NULL,
    `value_type` VARCHAR(20) NOT NULL DEFAULT 'text',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `work_planning_custom_field_planning_id_sort_order_idx`(`planning_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `work_planning` ADD CONSTRAINT `work_planning_work_id_fkey` FOREIGN KEY (`work_id`) REFERENCES `work`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_planning_custom_field` ADD CONSTRAINT `work_planning_custom_field_planning_id_fkey` FOREIGN KEY (`planning_id`) REFERENCES `work_planning`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
