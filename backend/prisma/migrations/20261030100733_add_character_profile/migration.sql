-- CreateTable
CREATE TABLE `character_profile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `character_id` INTEGER NOT NULL,
    `height` VARCHAR(100) NULL,
    `body_type` VARCHAR(100) NULL,
    `hair` VARCHAR(200) NULL,
    `eyes` VARCHAR(200) NULL,
    `skin` VARCHAR(100) NULL,
    `fashion` VARCHAR(200) NULL,
    `feature` VARCHAR(200) NULL,
    `appearance_note` TEXT NULL,
    `personality` TEXT NULL,
    `likes` TEXT NULL,
    `dislikes` TEXT NULL,
    `secret` TEXT NULL,
    `habits` TEXT NULL,
    `speech_mannerism` TEXT NULL,
    `signature` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `character_profile_character_id_key`(`character_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `character_custom_field` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `character_id` INTEGER NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `sort_order` INTEGER NOT NULL,
    `value_type` VARCHAR(20) NOT NULL DEFAULT 'text',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `character_custom_field_character_id_sort_order_idx`(`character_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `character_profile` ADD CONSTRAINT `character_profile_character_id_fkey` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_custom_field` ADD CONSTRAINT `character_custom_field_character_id_fkey` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
