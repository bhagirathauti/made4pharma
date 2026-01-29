-- Migration: add distributors table

CREATE TABLE IF NOT EXISTS `distributors` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `totalPurchase` double NOT NULL DEFAULT 0,
  `storeId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `storeId_name_unique` (`storeId`,`name`),
  KEY `idx_storeId` (`storeId`),
  CONSTRAINT `fk_distributor_store` FOREIGN KEY (`storeId`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
