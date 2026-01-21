-- DropForeignKey
ALTER TABLE `sale_items` DROP FOREIGN KEY `sale_items_productId_fkey`;

-- AlterTable
ALTER TABLE `sale_items` ADD COLUMN `name` VARCHAR(191) NULL,
    MODIFY `productId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `sales` ADD COLUMN `cashierId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_cashierId_fkey` FOREIGN KEY (`cashierId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
