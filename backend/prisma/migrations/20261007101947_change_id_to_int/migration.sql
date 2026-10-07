/*
  Warnings:

  - The primary key for the `episode` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `episode` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `work_id` on the `episode` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `user` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - The primary key for the `work` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `work` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `user_id` on the `work` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `episode` DROP FOREIGN KEY `episode_work_id_fkey`;

-- DropForeignKey
ALTER TABLE `work` DROP FOREIGN KEY `work_user_id_fkey`;

-- DropIndex
DROP INDEX `episode_work_id_fkey` ON `episode`;

-- DropIndex
DROP INDEX `work_user_id_fkey` ON `work`;

-- AlterTable
ALTER TABLE `episode` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `work_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `work` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `user_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `work` ADD CONSTRAINT `work_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `episode` ADD CONSTRAINT `episode_work_id_fkey` FOREIGN KEY (`work_id`) REFERENCES `work`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
