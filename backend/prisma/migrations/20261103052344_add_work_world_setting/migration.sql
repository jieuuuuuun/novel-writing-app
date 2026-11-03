-- CreateTable
CREATE TABLE `work_world_setting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `work_id` INTEGER NOT NULL,
    `era` TEXT NULL,
    `places` TEXT NULL,
    `atmosphere` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `work_world_setting_work_id_key`(`work_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_world_setting_custom_field` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `setting_id` INTEGER NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `sort_order` INTEGER NOT NULL,
    `value_type` VARCHAR(20) NOT NULL DEFAULT 'text',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `work_world_setting_custom_field_setting_id_sort_order_idx`(`setting_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `work_world_setting` ADD CONSTRAINT `work_world_setting_work_id_fkey` FOREIGN KEY (`work_id`) REFERENCES `work`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_world_setting_custom_field` ADD CONSTRAINT `work_world_setting_custom_field_setting_id_fkey` FOREIGN KEY (`setting_id`) REFERENCES `work_world_setting`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
