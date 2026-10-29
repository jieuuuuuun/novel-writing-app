-- CreateTable
CREATE TABLE `character_relation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `work_id` INTEGER NOT NULL,
    `character_a_id` INTEGER NOT NULL,
    `character_b_id` INTEGER NOT NULL,
    `type` VARCHAR(50) NULL,
    `summary` VARCHAR(300) NULL,
    `a_to_b_label` VARCHAR(50) NULL,
    `a_to_b_note` TEXT NULL,
    `b_to_a_label` VARCHAR(50) NULL,
    `b_to_a_note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `character_relation_work_id_idx`(`work_id`),
    INDEX `character_relation_character_a_id_idx`(`character_a_id`),
    INDEX `character_relation_character_b_id_idx`(`character_b_id`),
    UNIQUE INDEX `character_relation_work_id_character_a_id_character_b_id_key`(`work_id`, `character_a_id`, `character_b_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `character_relation` ADD CONSTRAINT `character_relation_work_id_fkey` FOREIGN KEY (`work_id`) REFERENCES `work`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_relation` ADD CONSTRAINT `character_relation_character_a_id_fkey` FOREIGN KEY (`character_a_id`) REFERENCES `character`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_relation` ADD CONSTRAINT `character_relation_character_b_id_fkey` FOREIGN KEY (`character_b_id`) REFERENCES `character`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
